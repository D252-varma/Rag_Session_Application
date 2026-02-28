import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters';
import { CHUNK_OVERLAP, CHUNK_SIZE } from '../config/env';
import { getEmbeddingsClient } from './embeddings';
import { StringOutputParser } from '@langchain/core/output_parsers';
import { traceable } from 'langsmith/traceable';

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

export interface ChunkingParams {
  sessionId: string;
  documentId: string;
  text: string;
  chunkSize?: number;
  chunkOverlap?: number;
}

// Splits text into chunks and generates embeddings via Langchain
export const chunkAndEmbedText = traceable(
  async (params: ChunkingParams): Promise<{ chunks: ChunkMetadata[] }> => {
    const { sessionId, documentId, text, chunkSize = CHUNK_SIZE, chunkOverlap = CHUNK_OVERLAP } = params;

    // Skip empty text
    const trimmed = text.trim();
    if (!trimmed) {
      return { chunks: [] };
    }

    // Split text based on chunk size & overlap config
    const splitter = new RecursiveCharacterTextSplitter({
      chunkSize: chunkSize,
      chunkOverlap: chunkOverlap,
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

    return {
      chunks,
    };
  },
  {
    name: "Document Chunking & Embedding",
    run_type: "tool",
  }
);
