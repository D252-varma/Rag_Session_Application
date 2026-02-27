import { promises as fs } from 'fs';
import os from 'os';
import path from 'path';
import { randomUUID } from 'crypto';
import { PDFLoader } from '@langchain/community/document_loaders/fs/pdf';

// Represents the extracted text and page count from a document
export interface LoadedDocument {
  text: string;
  pageCount: number;
}

/**
 * Given a binary file buffer and original filename, writes the file to a temporary location
 * so that Langchain's PDF loader can process it, extracts the text, and returns the contents.
 * 
 * @param buffer - The binary buffer holding the PDF's contents
 * @param fileName - Original name the user uploaded the PDF with
 * @returns An object containing the extracted raw text string and the total number of pages parsed.
 */
export async function loadPdfFromBuffer(buffer: Buffer, fileName: string): Promise<LoadedDocument> {
  // Create a secure temporary directory for Langchain PDF extraction
  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'rag-pdf-'));

  // Clean file name to prevent unsafe characters confusing the filesystem
  const safeName = fileName.replace(/[^a-zA-Z0-9_.-]/g, '_');
  const tmpPath = path.join(tmpDir, `${randomUUID()}-${safeName}`);

  try {
    // Save buffer so PDFLoader can read from disk
    await fs.writeFile(tmpPath, buffer);

    const loader = new PDFLoader(tmpPath);
    const docs = await loader.load();

    // Join all extracted pages into a single string
    const text = docs.map((doc) => doc.pageContent).join('\n\n');
    const pageCount = docs.length;

    return { text, pageCount };
  } catch (err) {
    console.error('Inner loader error during pdf extraction:', err);
    throw err;
  } finally {
    // Clean up temp files (ignoring errors if it fails)
    try {
      await fs.unlink(tmpPath);
      await fs.rmdir(tmpDir);
    } catch {
      // ignore
    }
  }
}

