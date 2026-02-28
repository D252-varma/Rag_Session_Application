import type { ChunkMetadata } from './chunking';

export interface StoredChunk extends ChunkMetadata {
  fileName: string | null;
}

// Full document mapping containing its extracted chunks
interface SessionDocument {
  fileName: string | null;
  chunks: StoredChunk[];
}

// Stores all active documents per user session
interface SessionStore {
  documents: Map<string, SessionDocument>;
}

// Similarity score mapping to text match
export interface QueryResult {
  chunk: StoredChunk;
  score: number;
}

// Session-aware vector DB blueprint
export interface VectorStore {
  addDocuments(params: {
    sessionId: string;
    documentId: string;
    fileName?: string;
    chunks: ChunkMetadata[];
  }): Promise<void>;
  clearSession(sessionId: string): Promise<void>;
  query(params: {
    sessionId: string;
    embedding: number[];
    topK?: number;
    similarityThreshold?: number;
  }): Promise<QueryResult[]>;
  getChunkCount(sessionId: string): Promise<number>;
}

// Global in-memory storage holding session caches
const sessions = new Map<string, SessionStore>();

// Retrieves or initializes a local store for a given session
function getOrCreateSession(sessionId: string): SessionStore {
  let store = sessions.get(sessionId);
  if (!store) {
    store = { documents: new Map() };
    sessions.set(sessionId, store);
  }
  return store;
}

// L2 Normalization requested by explicit user debug checklist
function normalize(vec: number[]): number[] {
  const norm = Math.sqrt(vec.reduce((sum, v) => sum + v * v, 0));
  if (norm === 0) return vec;
  return vec.map((v) => v / norm);
}

// Calculates distance between vector arrays (higher values mean more similar text)
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
  // Add vectorized chunks to memory mapped by session
  async addDocuments(params: {
    sessionId: string;
    documentId: string;
    fileName?: string;
    chunks: ChunkMetadata[];
  }): Promise<void> {
    const { sessionId, documentId, fileName, chunks } = params;
    if (chunks.length === 0) {
      return;
    }

    const sessionStore = getOrCreateSession(sessionId);
    const existing = sessionStore.documents.get(documentId);

    const storedChunks: StoredChunk[] = chunks.map((chunk) => ({
      ...chunk,
      embedding: normalize(chunk.embedding), // Normalize during index creation
      fileName: fileName ?? null,
    }));

    if (existing) {
      // Append chunks to existing document
      existing.chunks.push(...storedChunks);
      if (fileName) {
        existing.fileName = fileName;
      }
    } else {
      // Register new document
      const doc: SessionDocument = {
        fileName: fileName ?? null,
        chunks: storedChunks,
      };
      sessionStore.documents.set(documentId, doc);
    }
  }

  // Deletes memory allocations for a single user's session
  async clearSession(sessionId: string): Promise<void> {
    sessions.delete(sessionId);
  }

  // Performs exhaustive linear scan vector search within a session boundary
  async query(params: {
    sessionId: string;
    embedding: number[];
    topK?: number;
    similarityThreshold?: number;
  }): Promise<QueryResult[]> {
    const { sessionId, embedding, topK = 5, similarityThreshold = 0.4 } = params;

    // Quick exit if session doesn't exist bounds checking
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

    // Step 0: Ensure the query is L2 Normalized for safe dot-product distances
    const normalizedQuery = normalize(embedding);

    // Step 1: Calculate raw similarity scores against the source query vector
    let scored: QueryResult[] = allChunks.map((chunk) => {
      const score = cosineSimilarity(normalizedQuery, chunk.embedding);
      return { chunk, score };
    });

    // Step 2: Filter results dynamically against the baseline acceptable match threshold
    scored = scored.filter((x) => x.score >= similarityThreshold);

    // Step 3: Rank results by distance closeness (descending order)
    scored.sort((a, b) => b.score - a.score);

    // Step 4: Constrain returned size to the topK configured values
    const topChunks = scored.slice(0, Math.max(0, topK));

    // Professional Debug Telemetry
    console.log("Stored chunks:", allChunks.length);
    console.log("Retrieved chunks:", topChunks.length);
    console.log("Top similarity score:", topChunks[0]?.score ?? 'N/A');

    return topChunks;
  }

  // Debug visibility helper to check how many embeddings are stored for a session
  async getChunkCount(sessionId: string): Promise<number> {
    const sessionStore = sessions.get(sessionId);
    if (!sessionStore) return 0;

    let total = 0;
    for (const doc of sessionStore.documents.values()) {
      total += doc.chunks.length;
    }
    return total;
  }
}

import { ChromaStore } from './chromaStore';

const vectorStoreInstance: VectorStore = new ChromaStore();

export function getVectorStore(): VectorStore {
  return vectorStoreInstance;
}

