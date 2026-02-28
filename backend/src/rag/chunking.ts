import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters';
import { CHUNK_OVERLAP, CHUNK_SIZE } from '../config/env';
import { getEmbeddingsClient } from './embeddings';

// Connects a semantic chunk to its source document and user session
export interface ChunkMetadata {
  sessionId: string;
  documentId: string;
  index: number;
  text: string;
  embedding: number[];
}

export interface ChunkingResult {
  chunks: ChunkMetadata[];
}

// Splits text into chunks and generates embeddings via Langchain
export async function chunkAndEmbedText(params: {
  sessionId: string;
  documentId: string;
  text: string;
  chunkSize?: number;
  chunkOverlap?: number;
}): Promise<ChunkingResult> {
  const { sessionId, documentId, text, chunkSize, chunkOverlap } = params;

  // Skip empty text
  const trimmed = text.trim();
  if (!trimmed) {
    return { chunks: [] };
  }

  // Split text based on chunk size & overlap config
  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: chunkSize ?? CHUNK_SIZE,
    chunkOverlap: chunkOverlap ?? CHUNK_OVERLAP,
  });

  const docs = await splitter.createDocuments([trimmed]);

  // Call Gemini to generate vector embeddings
  const embeddingsClient = getEmbeddingsClient();
  const vectors = await embeddingsClient.embedDocuments(docs.map((doc) => doc.pageContent));

  // Format chunks with metadata
  const chunks: ChunkMetadata[] = docs.map((doc, index) => ({
    sessionId,
    documentId,
    index,
    text: doc.pageContent,
    embedding: vectors[index] ?? [],
  }));

  return { chunks };
}

