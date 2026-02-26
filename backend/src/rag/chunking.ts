import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters';
import { CHUNK_OVERLAP, CHUNK_SIZE } from '../config/env';
import { getEmbeddingsClient } from './embeddings';

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

export async function chunkAndEmbedText(params: {
  sessionId: string;
  documentId: string;
  text: string;
}): Promise<ChunkingResult> {
  const { sessionId, documentId, text } = params;

  const trimmed = text.trim();
  if (!trimmed) {
    return { chunks: [] };
  }

  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: CHUNK_SIZE,
    chunkOverlap: CHUNK_OVERLAP,
  });

  const docs = await splitter.createDocuments([trimmed]);
  const embeddingsClient = getEmbeddingsClient();

  const vectors = await embeddingsClient.embedDocuments(docs.map((doc) => doc.pageContent));

  const chunks: ChunkMetadata[] = docs.map((doc, index) => ({
    sessionId,
    documentId,
    index,
    text: doc.pageContent,
    embedding: vectors[index] ?? [],
  }));

  return { chunks };
}

