import express, { NextFunction, Request, Response } from 'express';
import cors from 'cors';

const app = express();
const PORT = process.env.PORT || 4000;

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

