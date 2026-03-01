const SESSION_STORAGE_KEY = 'rag_session_id';

export interface DocumentMeta {
  fileName: string;
  uploadTime: string;
}

// Helper to reliably scope documents to the current session hash
function getSessionDocsKey(sessionId: string) {
  return `rag_docs_${sessionId}`;
}

// Generate a random session ID using crypto if available
function createSessionId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }

  // Fallback generation for older browsers
  const random = Math.random().toString(36).slice(2);
  const timestamp = Date.now().toString(36);
  return `sess_${timestamp}_${random}`;
}

// Retrieve saved session ID or create a new one to persist user session
export function getOrCreateSessionId(): string {
  // Skip during SSR
  if (typeof window === 'undefined') {
    return createSessionId();
  }

  const existing = window.localStorage.getItem(SESSION_STORAGE_KEY);
  if (existing && existing.trim().length > 0) {
    console.log(`[RAG Session] Loaded active session: ${existing}`);
    return existing;
  }

  // Save new session locally
  const next = createSessionId();
  window.localStorage.setItem(SESSION_STORAGE_KEY, next);
  console.log(`[RAG Session] Created new assigned session: ${next}`);
  return next;
}

// Construct standard headers to identify requests
export function buildSessionHeaders(sessionId: string): HeadersInit {
  return {
    'x-session-id': sessionId,
  };
}

// Clear the session ID from local storage to force a hard session reset
export function clearSessionLocalStorage(): void {
  if (typeof window !== 'undefined') {
    const existing = window.localStorage.getItem(SESSION_STORAGE_KEY);
    if (existing) {
      console.log(`[RAG Session] Erasing and resetting older session: ${existing}`);
      window.localStorage.removeItem(getSessionDocsKey(existing)); // Clear docs strictly linked to this session
    }
    window.localStorage.removeItem(SESSION_STORAGE_KEY);
  }
}


// ----------------------------------------
// Active Documents Storage Methods
// ----------------------------------------

export function getActiveDocuments(sessionId: string): DocumentMeta[] {
  if (typeof window === 'undefined') return [];

  const docsText = window.localStorage.getItem(getSessionDocsKey(sessionId));
  if (!docsText) return [];

  try {
    return JSON.parse(docsText);
  } catch {
    return [];
  }
}

export function addActiveDocument(sessionId: string, fileName: string): DocumentMeta[] {
  if (typeof window === 'undefined') return [];

  const docs = getActiveDocuments(sessionId);
  // Avoid duplicating identical filenames
  if (!docs.some(d => d.fileName === fileName)) {
    docs.push({ fileName, uploadTime: new Date().toLocaleTimeString() });
    window.localStorage.setItem(getSessionDocsKey(sessionId), JSON.stringify(docs));
  }
  return docs;
}

export function clearActiveDocuments(sessionId: string): void {
  if (typeof window !== 'undefined') {
    window.localStorage.removeItem(getSessionDocsKey(sessionId));
  }
}

