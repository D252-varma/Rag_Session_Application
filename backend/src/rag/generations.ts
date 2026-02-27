import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { PromptTemplate } from '@langchain/core/prompts';
import { GEMINI_API_KEY } from '../config/env';
import { StringOutputParser } from '@langchain/core/output_parsers';
import type { StoredChunk } from './vectorStore';

let chatModel: ChatGoogleGenerativeAI | null = null;

// Lazily initializes and returns the Gemini Chat Model
export function getChatModel(): ChatGoogleGenerativeAI {
    if (!GEMINI_API_KEY) {
        throw new Error('GEMINI_API_KEY is not configured');
    }

    if (chatModel) {
        return chatModel;
    }

    chatModel = new ChatGoogleGenerativeAI({
        model: 'gemini-2.5-flash', // Key bound dynamically mapped model
        apiKey: GEMINI_API_KEY,
        temperature: 0, // Keep temperature 0 for strictly analytical grounded answers
    });

    return chatModel;
}

// System prompt explicitly instructing the LLM to only answer if context supports it
const QA_PROMPT_TEMPLATE = `You are a document-based assistant.
Answer ONLY using the context below.
If the answer is not in the context, say:
"This question is outside the scope of uploaded documents."

Context:
{retrieved_chunks}

Question:
{user_question}`;

const qaPrompt = PromptTemplate.fromTemplate(QA_PROMPT_TEMPLATE);

export async function generateAnswer(query: string, chunks: StoredChunk[]): Promise<string> {
    // Edge case: If no chunks met the similarity threshold, we bypass the LLM entirely
    // as an application-layer guardrail
    if (chunks.length === 0) {
        return "This question is outside the scope of uploaded documents.";
    }

    // Combine the text from the top retrieved chunks
    const context = chunks.map((chunk) => chunk.text).join('\n---\n');

    const llm = getChatModel();

    // Create an LCEL chain: Prompt -> LLM -> String Output
    const chain = qaPrompt.pipe(llm).pipe(new StringOutputParser());

    const response = await chain.invoke({
        retrieved_chunks: context,
        user_question: query,
    });

    return response;
}
