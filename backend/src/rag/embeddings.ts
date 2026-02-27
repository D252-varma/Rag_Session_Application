import { GoogleGenerativeAIEmbeddings } from '@langchain/google-genai';
import { GEMINI_API_KEY } from '../config/env';

let embeddingsClient: GoogleGenerativeAIEmbeddings | null = null;

// Lazily initializes and returns the Gemini embedder
export function getEmbeddingsClient(): GoogleGenerativeAIEmbeddings {
  if (!GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY is not configured');
  }

  if (embeddingsClient) {
    return embeddingsClient;
  }

  // Use a unified model to guarantee matching text-embedding generation semantics 
  // for both Document Upload context and User Question extraction
  embeddingsClient = new GoogleGenerativeAIEmbeddings({
    apiKey: GEMINI_API_KEY,
    model: 'gemini-embedding-001',
  });

  return embeddingsClient;
}
