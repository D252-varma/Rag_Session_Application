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

  embeddingsClient = new GoogleGenerativeAIEmbeddings({
    apiKey: GEMINI_API_KEY,
    model: 'text-embedding-004',
  });

  return embeddingsClient;
}

