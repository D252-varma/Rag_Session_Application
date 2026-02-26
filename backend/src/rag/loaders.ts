import { promises as fs } from 'fs';
import os from 'os';
import path from 'path';
import { randomUUID } from 'crypto';
import { PDFLoader } from '@langchain/community/document_loaders/fs/pdf';

export interface LoadedDocument {
  text: string;
  pageCount: number;
}

export async function loadPdfFromBuffer(buffer: Buffer, fileName: string): Promise<LoadedDocument> {
  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'rag-pdf-'));
  const safeName = fileName.replace(/[^a-zA-Z0-9_.-]/g, '_');
  const tmpPath = path.join(tmpDir, `${randomUUID()}-${safeName}`);

  try {
    await fs.writeFile(tmpPath, buffer);

    const loader = new PDFLoader(tmpPath);
    const docs = await loader.load();

    const text = docs.map((doc) => doc.pageContent).join('\n\n');
    const pageCount = docs.length;

    return { text, pageCount };
  } catch (err) {
    console.error('Inner loader error during pdf extraction:', err);
    throw err;
  } finally {
    // Best-effort cleanup; ignore errors.
    try {
      await fs.unlink(tmpPath);
      await fs.rmdir(tmpDir);
    } catch {
      // ignore
    }
  }
}

