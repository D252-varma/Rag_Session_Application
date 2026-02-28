import express, { NextFunction, Request, Response } from 'express';
import cors from 'cors';
import multer from 'multer';
import { chunkAndEmbedText } from './rag/chunking';
import { getVectorStore } from './rag/vectorStore';
import { getEmbeddingsClient } from './rag/embeddings';
import { loadPdfFromBuffer } from './rag/loaders';
import { generateAnswer } from './rag/generations';

const app = express();
const PORT = process.env.PORT || 4000;

const upload = multer({ storage: multer.memoryStorage() });

app.use(cors());
app.use(express.json());

// Add sessionId to Express Request
declare module 'express-serve-static-core' {
  interface Request {
    sessionId?: string;
  }
}

// Middleware to validate session header
function sessionMiddleware(req: Request, res: Response, next: NextFunction): void {
  const headerSessionId = req.header('x-session-id');

  if (!headerSessionId || headerSessionId.trim().length === 0) {
    res.status(400).json({ error: 'Missing x-session-id header' });
    return;
  }

  req.sessionId = headerSessionId.trim();
  next();
}

app.use(sessionMiddleware);

// Endpoint to upload, extract, chunk, and embed documents
app.post(
  '/upload',
  upload.single('file'),
  async (req: Request, res: Response): Promise<void> => {
    // 1. Verify session
    const sessionId = req.sessionId;
    if (!sessionId) {
      res.status(400).json({ error: 'Missing sessionId' });
      return;
    }

    // 2. Extract configuration payload if available
    const { chunkSize: rawChunkSize, chunkOverlap: rawChunkOverlap } = req.body;
    let chunkSize: number | undefined;
    let chunkOverlap: number | undefined;

    if (rawChunkSize) {
      const parsed = parseInt(String(rawChunkSize), 10);
      if (!isNaN(parsed) && parsed > 0) chunkSize = parsed;
    }

    if (rawChunkOverlap) {
      const parsed = parseInt(String(rawChunkOverlap), 10);
      if (!isNaN(parsed) && parsed >= 0) chunkOverlap = parsed;
    }

    // 3. Process File Payload
    const file = req.file;
    if (!file) {
      res.status(400).json({ error: 'No file uploaded' });
      return;
    }

    const isPdf = file.mimetype === 'application/pdf';
    const isText =
      file.mimetype === 'text/plain' || file.originalname.toLowerCase().endsWith('.txt');

    // Reject unsupported files
    if (!isPdf && !isText) {
      res.status(400).json({ error: 'Only .pdf and .txt files are supported' });
      return;
    }

    let extractedText = '';
    let pageCount = 0;

    // Extract text based on document type
    if (isPdf) {
      try {
        const loaded = await loadPdfFromBuffer(file.buffer, file.originalname);
        extractedText = loaded.text;
        pageCount = loaded.pageCount;
      } catch (error) {
        // Fall back gracefully if extraction fails
        // eslint-disable-next-line no-console
        console.warn('PDF text extraction failed, continuing with empty text', error);
        extractedText = '';
        pageCount = 0;
      }
    } else if (isText) {
      extractedText = file.buffer.toString('utf-8');
    }

    const trimmed = extractedText.trim();
    const charCount = trimmed.length;
    const wordCount = trimmed.length > 0 ? trimmed.split(/\s+/).length : 0;

    let chunkCount = 0;

    // Process chunking if we have text
    if (trimmed.length > 0 && sessionId) {
      // Create a document tracking ID
      const documentId = `doc-${Date.now()}`;

      try {
        const { chunks } = await chunkAndEmbedText({
          sessionId,
          documentId,
          text: trimmed,
          ...(chunkSize !== undefined && { chunkSize }),
          ...(chunkOverlap !== undefined && { chunkOverlap })
        });
        chunkCount = chunks.length;

        // Store vectors locally mapping to the session
        if (chunkCount > 0) {
          const store = getVectorStore();
          await store.addDocuments({
            sessionId,
            documentId,
            fileName: file.originalname,
            chunks,
          });
        }
      } catch (error) {
        // Log generation failure but return success payload so UI handles it
        // eslint-disable-next-line no-console
        console.warn('Embedding generation failed, continuing with chunkCount = 0', error);
        chunkCount = 0;
      }
    }

    // Return document metrics
    res.status(200).json({
      sessionId,
      fileName: file.originalname,
      fileSizeBytes: file.size,
      fileType: isPdf ? 'pdf' : 'txt',
      charCount,
      wordCount,
      pageCount,
      chunkCount,
    });
  },
);

// Endpoint for testing searches against the document store
app.post('/query', async (req: Request, res: Response): Promise<void> => {
  const sessionId = req.sessionId;
  const { query, history, topK, similarityThreshold } = req.body;

  if (!sessionId) {
    res.status(400).json({ error: 'Missing sessionId' });
    return;
  }

  if (!query || typeof query !== 'string') {
    res.status(400).json({ error: 'Query must be a non-empty string' });
    return;
  }

  // Token Guardrail: Prevent abusive or excessively long prompts from burning tokenizer limits
  if (query.trim().length > 500) {
    console.warn(`[Guardrail] Blocked overly long query (${query.length} chars) from session ${sessionId}`);
    res.status(400).json({ error: 'Question is too long. Please restrict your query to 500 characters or less.' });
    return;
  }

  try {
    const embeddingsClient = getEmbeddingsClient();
    const [queryEmbedding] = await embeddingsClient.embedDocuments([query]);

    // Explicit array bounds checking fallback against API faults
    if (!queryEmbedding) {
      res.status(500).json({ error: 'Failed to generate query embedding' });
      return;
    }

    const store = getVectorStore();
    const totalChunks = await store.getChunkCount(sessionId);

    // Log tracking metric requested by Orchestration Debug module
    console.log(`[RAG Debug] Run retrieval against ${totalChunks} stored chunks for session ${sessionId}`);

    const results = await store.query({
      sessionId,
      embedding: queryEmbedding,
      topK,
      similarityThreshold,
    });

    // Log query matched results
    console.log(`[RAG Debug] Query matched ${results.length} chunks meeting threshold >= ${similarityThreshold ?? 'default'}`);

    // Guardrail: Pass retrieved chunks into standard prompt template
    const retrievedChunks = results.map(r => r.chunk);
    const answer = await generateAnswer(query, retrievedChunks, history);

    // Return the generated answer paired with its semantic sources and debugging counts
    res.status(200).json({
      answer,
      results,
      debug: {
        totalStoredChunks: totalChunks,
        retrievedChunks: results.length,
        topScore: results.length > 0 ? results[0]?.score : null,
      }
    });
  } catch (error: any) {
    console.error('Error during query execution:', error);
    res.status(500).json({
      error: 'Internal server error during search query',
      details: error.message || String(error)
    });
  }
});

// Health-check endpoint
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'ok',
    message: 'Backend is running',
    sessionId: req.sessionId,
  });
});

// Purges a session's vector store records
app.post('/session/reset', async (req: Request, res: Response) => {
  const activeSessionId = req.sessionId;

  if (!activeSessionId) {
    res.status(400).json({ error: 'Missing sessionId for reset' });
    return;
  }

  // Clear specific session
  const store = getVectorStore();
  await store.clearSession(activeSessionId);

  res.status(200).json({
    status: 'reset',
    sessionId: activeSessionId,
  });
});

app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`Backend server listening on port ${PORT}`);
});

