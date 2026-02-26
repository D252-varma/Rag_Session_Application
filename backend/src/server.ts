import express, { NextFunction, Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import multer from 'multer';

dotenv.config();

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

    // For now we only extract text for plain .txt files.
    // PDF text extraction will be handled via LangChain-based loaders in the core RAG modules.
    let extractedText = '';

    if (isText) {
      extractedText = file.buffer.toString('utf-8');
    }

    const trimmed = extractedText.trim();
    const charCount = trimmed.length;
    const wordCount = trimmed.length > 0 ? trimmed.split(/\s+/).length : 0;

    res.status(200).json({
      sessionId,
      fileName: file.originalname,
      fileSizeBytes: file.size,
      fileType: isPdf ? 'pdf' : 'txt',
      charCount,
      wordCount,
      chunkCount: 0,
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

  // Placeholder: when we add in-memory storage, we will clear all data
  // associated with activeSessionId here.

  res.status(200).json({
    status: 'reset',
    sessionId: activeSessionId,
  });
});

app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`Backend server listening on port ${PORT}`);
});

