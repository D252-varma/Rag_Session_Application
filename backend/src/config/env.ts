import dotenv from 'dotenv';
import path from 'path';

// Ensure .env is loaded before reading any variables.
// Resolve from the project root: ../.env relative to backend working directory.
// This works both in dev (ts-node-dev on src) and prod (node on dist) because
// process.cwd() is the backend folder in both cases.
dotenv.config({
  path: path.resolve(process.cwd(), '../.env'),
});

export const GEMINI_API_KEY = process.env.GEMINI_API_KEY ?? '';

if (!GEMINI_API_KEY) {
  // We log a warning instead of throwing so the server can still start;
  // upload/embedding code will handle the missing key explicitly.
  // eslint-disable-next-line no-console
  console.warn('GEMINI_API_KEY is not set. Embedding generation will fail until it is configured.');
}

export const CHUNK_SIZE = Number.parseInt(process.env.CHUNK_SIZE ?? '1000', 10);
export const CHUNK_OVERLAP = Number.parseInt(process.env.CHUNK_OVERLAP ?? '200', 10);

