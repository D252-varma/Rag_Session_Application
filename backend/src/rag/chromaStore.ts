import { ChromaClient, Collection } from 'chromadb';
import type { VectorStore, QueryResult } from './vectorStore';
import type { ChunkMetadata } from './chunking';
import { getEmbeddingsClient } from './embeddings';
import { traceable } from 'langsmith/traceable';

// Initialize the Chroma HTTP client mapped to the orchestrator script
const client = new ChromaClient({ path: 'http://localhost:8000' });

// Ensure valid characters for Chroma collection names (alphanumeric and dashes)
function getCollectionName(sessionId: string) {
    return `session_${sessionId.replace(/[^a-zA-Z0-9_-]/g, '_')}`;
}

export class ChromaStore implements VectorStore {
    private async getCollection(sessionId: string): Promise<Collection> {
        // Utilize Cosine space to exactly map against our previous manual similarity logic
        return await client.getOrCreateCollection({
            name: getCollectionName(sessionId),
            metadata: { "hnsw:space": "cosine" }
        });
    }

    /**
     * Adds an array of document chunks to the persistent Chroma collection.
     * LangSmith wrapper acts as a "tool" to track ingestion times.
     */
    public addDocuments = traceable(
        async (params: {
            sessionId: string;
            documentId: string;
            fileName?: string;
            chunks: ChunkMetadata[];
        }): Promise<void> => {
            const { sessionId, documentId, fileName, chunks } = params;
            if (chunks.length === 0) return;

            const collection = await this.getCollection(sessionId);

            // Deconstruct arrays for Chroma batch ingest
            const ids = chunks.map(c => `${documentId}_${c.index}`);
            const embeddings = chunks.map(c => c.embedding);
            const documents = chunks.map(c => c.text);
            const metadatas = chunks.map(c => ({
                sessionId: sessionId,
                documentId: c.documentId,
                index: c.index,
                fileName: fileName || '',
            }));

            await collection.add({
                ids,
                embeddings,
                metadatas,
                documents
            });

            console.log(`[ChromaDB] Added ${chunks.length} chunks to session ${sessionId}`);
        },
        {
            name: "ChromaDB - Add Documents",
            run_type: "tool",
        }
    );

    async clearSession(sessionId: string): Promise<void> {
        try {
            await client.deleteCollection({ name: getCollectionName(sessionId) });
        } catch (err: any) {
            if (!err.message?.includes("does not exist")) {
                console.error('Failed to clear Chroma session:', err);
            }
        }
    }

    /**
     * Executes a dense vector Similarity Search against the Chroma DB collection.
     * LangSmith wrapper acts as a "retriever".
     */
    public query = traceable(
        async (params: {
            sessionId: string;
            embedding: number[];
            topK?: number;
            similarityThreshold?: number;
        }): Promise<QueryResult[]> => {
            const { sessionId, embedding, topK = 5, similarityThreshold = 0.4 } = params;

            try {
                const collection = await this.getCollection(sessionId);

                const results = await collection.query({
                    queryEmbeddings: [embedding],
                    nResults: topK,
                });

                const out: QueryResult[] = [];
                const distances = results.distances?.[0] || [];
                const metadatas = results.metadatas?.[0] || [];
                const documents = results.documents?.[0] || [];
                const ids = results.ids?.[0] || [];

                for (let i = 0; i < ids.length; i++) {
                    // Cosine distance is returned. Cosine similarity = 1 - Cosine Distance
                    const dist = distances[i];
                    if (dist === null || dist === undefined) continue;

                    const score = 1 - dist;

                    if (score >= similarityThreshold) {
                        out.push({
                            score,
                            chunk: {
                                sessionId: String(metadatas[i]?.sessionId || sessionId),
                                documentId: String(metadatas[i]?.documentId || ''),
                                index: Number(metadatas[i]?.index || 0),
                                text: String(documents[i] || ''),
                                embedding: [], // Avoid passing raw huge vectors to Frontend to save bandwidth
                                fileName: String(metadatas[i]?.fileName || ''),
                            }
                        });
                    }
                }

                // Ensure explicitly descending order before returning
                out.sort((a, b) => b.score - a.score);

                console.log(`[Chroma DB] Found ${out.length} valid chunks above threshold >= ${similarityThreshold}`);
                return out;

            } catch (err: any) {
                if (!err.message?.includes("does not exist")) {
                    console.error("Chroma collection query failed:", err);
                }
                return [];
            }
        },
        {
            name: "ChromaDB - Query Documents",
            run_type: "retriever",
        }
    );

    async getChunkCount(sessionId: string): Promise<number> {
        try {
            const collection = await client.getCollection({ name: getCollectionName(sessionId) });
            return await collection.count();
        } catch {
            return 0;
        }
    }
}
