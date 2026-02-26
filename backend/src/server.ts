import express, { NextFunction, Request, Response } from 'express';
import cors from 'cors';
import multer from 'multer';
import { chunkAndEmbedText } from './rag/chunking';
import { getVectorStore } from './rag/vectorStore';
import { loadPdfFromBuffer } from './rag/loaders';

const app = express();
const PORT = process.env.PORT || 4000;

const upload = multer({ storage: multer.memoryStorage() });

app.use(cors());
app.use(express.json());

declare module 'express-serve-static-core' {
  interface Request {
    sessionId?: string;
  }
}

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

app.post(
  '/upload',
  upload.single('file'),
  async (req: Request, res: Response): Promise<void> => {
    const sessionId = req.sessionId;
    const file = req.file;

    if (!file) {
      res.status(400).json({ error: 'No file uploaded' });
      return;
    }

    const isPdf = file.mimetype === 'application/pdf';
    const isText =
      file.mimetype === 'text/plain' || file.originalname.toLowerCase().endsWith('.txt');

    if (!isPdf && !isText) {
      res.status(400).json({ error: 'Only .pdf and .txt files are supported' });
      return;
    }

    let extractedText = '';
    let pageCount = 0;

    if (isPdf) {
      try {
        const loaded = await loadPdfFromBuffer(file.buffer, file.originalname);
        extractedText = loaded.text;
        pageCount = loaded.pageCount;
      } catch (error) {
        // If PDF text extraction fails, fall back gracefully:
        // treat this PDF as having no extractable text instead of returning 500.
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

    if (trimmed.length > 0 && sessionId) {
      const documentId = `doc-${Date.now()}`;

      try {
        const { chunks } = await chunkAndEmbedText({
          sessionId,
          documentId,
          text: trimmed,
        });
        chunkCount = chunks.length;

        if (chunkCount > 0) {
          const store = getVectorStore();
          store.addDocuments({
            sessionId,
            documentId,
            fileName: file.originalname,
            chunks,
          });
        }
      } catch (error) {
        // If embedding generation fails (e.g. GEMINI_API_KEY/config issue),
        // log it but still return success so the upload UI can show basic metrics.
        // eslint-disable-next-line no-console
        console.warn('Embedding generation failed, continuing with chunkCount = 0', error);
        chunkCount = 0;
      }
    }

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

app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'ok',
    message: 'Backend is running',
    sessionId: req.sessionId,
  });
});

app.post('/session/reset', (req: Request, res: Response) => {
  const activeSessionId = req.sessionId;

  if (!activeSessionId) {
    res.status(400).json({ error: 'Missing sessionId for reset' });
    return;
  }

  const store = getVectorStore();
  store.clearSession(activeSessionId);

  res.status(200).json({
    status: 'reset',
    sessionId: activeSessionId,
  });
});

app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`Backend server listening on port ${PORT}`);
});

