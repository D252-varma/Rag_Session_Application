import type { ChunkMetadata } from './chunking';

export interface StoredChunk extends ChunkMetadata {
  fileName: string | null;
}

interface SessionDocument {
  fileName: string | null;
  chunks: StoredChunk[];
}

interface SessionStore {
  documents: Map<string, SessionDocument>;
}

interface QueryResult {
  chunk: StoredChunk;
  score: number;
}

export interface VectorStore {
  addDocuments(params: {
    sessionId: string;
    documentId: string;
    fileName?: string;
    chunks: ChunkMetadata[];
  }): void;
  clearSession(sessionId: string): void;
  query(params: {
    sessionId: string;
    embedding: number[];
    topK: number;
  }): QueryResult[];
}

const sessions = new Map<string, SessionStore>();

function getOrCreateSession(sessionId: string): SessionStore {
  let store = sessions.get(sessionId);
  if (!store) {
    store = { documents: new Map() };
    sessions.set(sessionId, store);
  }
  return store;
}

function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length === 0 || b.length === 0 || a.length !== b.length) {
    return 0;
  }

  let dot = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i += 1) {
    const va = a[i] ?? 0;
    const vb = b[i] ?? 0;
    dot += va * vb;
    normA += va * va;
    normB += vb * vb;
  }

  if (normA === 0 || normB === 0) {
    return 0;
  }

  return dot / Math.sqrt(normA * normB);
}

class InMemoryVectorStore implements VectorStore {
  addDocuments(params: {
    sessionId: string;
    documentId: string;
    fileName?: string;
    chunks: ChunkMetadata[];
  }): void {
    const { sessionId, documentId, fileName, chunks } = params;
    if (chunks.length === 0) {
      return;
    }

    const sessionStore = getOrCreateSession(sessionId);
    const existing = sessionStore.documents.get(documentId);

    const storedChunks: StoredChunk[] = chunks.map((chunk) => ({
      ...chunk,
      fileName: fileName ?? null,
    }));

    if (existing) {
      existing.chunks.push(...storedChunks);
      if (fileName) {
        existing.fileName = fileName;
      }
    } else {
      const doc: SessionDocument = {
        fileName: fileName ?? null,
        chunks: storedChunks,
      };
      sessionStore.documents.set(documentId, doc);
    }
  }

  clearSession(sessionId: string): void {
    sessions.delete(sessionId);
  }

  query(params: {
    sessionId: string;
    embedding: number[];
    topK: number;
  }): QueryResult[] {
    const { sessionId, embedding, topK } = params;
    const sessionStore = sessions.get(sessionId);
    if (!sessionStore) {
      return [];
    }

    const allChunks: StoredChunk[] = [];
    for (const doc of sessionStore.documents.values()) {
      allChunks.push(...doc.chunks);
    }

    if (allChunks.length === 0) {
      return [];
    }

    const scored: QueryResult[] = allChunks.map((chunk) => ({
      chunk,
      score: cosineSimilarity(embedding, chunk.embedding),
    }));

    scored.sort((a, b) => b.score - a.score);

    return scored.slice(0, Math.max(0, topK));
  }
}

const vectorStoreInstance: VectorStore = new InMemoryVectorStore();

export function getVectorStore(): VectorStore {
  return vectorStoreInstance;
}

