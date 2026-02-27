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
interface QueryResult {
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
  }): void;
  clearSession(sessionId: string): void;
  query(params: {
    sessionId: string;
    embedding: number[];
    topK?: number;
    similarityThreshold?: number;
  }): QueryResult[];
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

// Calculates vector magnitude (L2 Norm)
function getMagnitude(vec: number[]): number {
  let sum = 0;
  for (let i = 0; i < vec.length; i += 1) {
    const val = vec[i] ?? 0;
    sum += val * val;
  }
  return Math.sqrt(sum);
}

// Pre-normalizes a raw vector array into a unit vector
function normalizeVector(vec: number[]): number[] {
  const mag = getMagnitude(vec);
  if (mag === 0) return vec;
  return vec.map((val) => val / mag);
}

// Calculates distance between unit vector arrays 
// (assuming inputs are pre-normalized, so it relies on pure dot product)
function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length === 0 || b.length === 0 || a.length !== b.length) {
    return 0;
  }

  let dot = 0;
  for (let i = 0; i < a.length; i += 1) {
    dot += (a[i] ?? 0) * (b[i] ?? 0);
  }

  return dot;
}

class InMemoryVectorStore implements VectorStore {
  // Add vectorized chunks to memory mapped by session
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

    const storedChunks: StoredChunk[] = chunks.map((chunk) => {
      // Pre-normalize embedding vector immediately on upload to make queries strictly dot-product
      return {
        ...chunk,
        embedding: normalizeVector(chunk.embedding),
        fileName: fileName ?? null,
      };
    });

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
  clearSession(sessionId: string): void {
    sessions.delete(sessionId);
  }

  // Performs exhaustive linear scan vector search within a session boundary
  query(params: {
    sessionId: string;
    embedding: number[];
    topK?: number;
    similarityThreshold?: number;
  }): QueryResult[] {
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

    // Step 0: Pre-normalize the incoming search query so it works seamlessly against normalized chunk storage
    const normalizedQuery = normalizeVector(embedding);

    // Step 1: Calculate raw similarity scores against the source query vector
    let scored: QueryResult[] = allChunks.map((chunk) => ({
      chunk,
      score: cosineSimilarity(normalizedQuery, chunk.embedding),
    }));

    // Step 2: Filter results dynamically against the baseline acceptable match threshold
    scored = scored.filter((x) => x.score >= similarityThreshold);

    // Step 3: Rank results by distance closeness (descending order)
    scored.sort((a, b) => b.score - a.score);

    // Step 4: Constrain returned size to the topK configured values
    return scored.slice(0, Math.max(0, topK));
  }
}

const vectorStoreInstance: VectorStore = new InMemoryVectorStore();

export function getVectorStore(): VectorStore {
  return vectorStoreInstance;
}

