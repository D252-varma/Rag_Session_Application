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
        maxRetries: 0, // CRITICAL: Stop Langchain from infinitely hanging the Node thread on 429 Quota Rate Limits
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

Previous Conversation History:
{conversation_history}

Current Question:
{user_question}`;

const qaPrompt = PromptTemplate.fromTemplate(QA_PROMPT_TEMPLATE);

export async function generateAnswer(query: string, chunks: StoredChunk[], history?: any[]): Promise<string> {
    // Edge case: If no chunks met the similarity threshold, we bypass the LLM entirely
    // as an application-layer guardrail
    if (chunks.length === 0) {
        return "This question is outside the scope of uploaded documents.";
    }

    // Token Safeguard: Limit Context length to approx 2,000 tokens (8,000 chars) max to prevent crashing model buffers
    const MAX_CONTEXT_LENGTH = 8000;
    const rawContext = chunks.map((chunk) => chunk.text).join('\n---\n');
    const context = rawContext.length > MAX_CONTEXT_LENGTH
        ? rawContext.slice(0, MAX_CONTEXT_LENGTH) + '\n... [Remaining context truncated for length]'
        : rawContext;

    console.log(`[RAG Debug] Injecting ${context.length} characters of context into final prompt`);

    let historyTranscript = "No previous context.";

    if (history && Array.isArray(history) && history.length > 0) {
        // Token Safeguard: Limit the injected history transcript to the last 6 messages
        const constrainedHistory = history.slice(-6);

        historyTranscript = constrainedHistory
            .filter(msg => {
                // Drop error states or placeholder searching bubbles from the backend injection
                if (msg.role === 'assistant' && msg.status !== 'success') return false;
                return true;
            })
            .map(msg => `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}`)
            .join('\n\n');

        // Token Safeguard: Ensure conversation history does not balloon the prompt payload (cap at ~500 tokens / 2,000 characters)
        const MAX_HISTORY_LENGTH = 2000;
        if (historyTranscript.length > MAX_HISTORY_LENGTH) {
            historyTranscript = '... [Oldest messages truncated]\n' + historyTranscript.slice(-MAX_HISTORY_LENGTH);
        }
    }

    const llm = getChatModel();

    // Create an LCEL chain: Prompt -> LLM -> String Output
    const chain = qaPrompt.pipe(llm).pipe(new StringOutputParser());

    const response = await chain.invoke({
        retrieved_chunks: context,
        conversation_history: historyTranscript,
        user_question: query,
    });

    return response;
}
