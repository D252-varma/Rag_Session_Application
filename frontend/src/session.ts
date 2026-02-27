const SESSION_STORAGE_KEY = 'rag_session_id';

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
    return existing;
  }

  // Save new session locally
  const next = createSessionId();
  window.localStorage.setItem(SESSION_STORAGE_KEY, next);
  return next;
}

// Construct standard headers to identify requests
export function buildSessionHeaders(sessionId: string): HeadersInit {
  return {
    'x-session-id': sessionId,
  };
}

