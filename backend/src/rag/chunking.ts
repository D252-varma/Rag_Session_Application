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

function splitTextIntoChunks(text: string): string[] {
  const chunks: string[] = [];
  const length = text.length;

  if (length === 0) {
    return chunks;
  }

  let start = 0;

  while (start < length) {
    const end = Math.min(start + CHUNK_SIZE, length);
    const chunk = text.slice(start, end);
    chunks.push(chunk);

    if (end === length) {
      break;
    }

    const nextStart = end - CHUNK_OVERLAP;
    start = nextStart > start ? nextStart : end;
  }

  return chunks;
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

  const pieces = splitTextIntoChunks(trimmed);
  const embeddingsClient = getEmbeddingsClient();

  const vectors = await embeddingsClient.embedDocuments(pieces);

  const chunks: ChunkMetadata[] = pieces.map((text, index) => ({
    sessionId,
    documentId,
    index,
    text,
    embedding: vectors[index] ?? [],
  }));

  return { chunks };
}

