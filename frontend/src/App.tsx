import './App.css'
import { getOrCreateSessionId, clearSessionLocalStorage } from './session'
import { FileUpload } from './FileUpload'
import { QuestionAnswering } from './QuestionAnswering'
import { useState } from 'react'

// Main App Component
function App() {
  // Get active session ID for this user
  const sessionId = getOrCreateSessionId()
  const [isResetting, setIsResetting] = useState(false);

  const handleResetSession = async () => {
    if (!window.confirm("Are you sure you want to reset your session? All uploaded files, knowledge vectors, and chat history will be permanently deleted.")) {
      return;
    }

    setIsResetting(true);
    try {
      const response = await fetch('http://localhost:4000/session/reset', {
        method: 'POST',
        headers: {
          'x-session-id': sessionId
        }
      });

      if (response.ok) {
        clearSessionLocalStorage();
        window.location.reload(); // Hard reload wipes React tree and gets new token
      } else {
        console.error("Failed to reset backend session state.");
        setIsResetting(false);
      }
    } catch (err) {
      console.error("Network error during session reset:", err);
      setIsResetting(false);
    }
  };

  return (
    <main className="app-root">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1>Session-Based RAG App</h1>
          <p>Frontend is running.</p>
          <p>
            Current session ID:&nbsp;
            <code>{sessionId}</code>
          </p>
        </div>

        <button
          onClick={handleResetSession}
          disabled={isResetting}
          className="glass-panel"
          style={{
            padding: '0.75rem 1.5rem',
            background: 'rgba(255, 50, 50, 0.1)',
            color: '#ff6b6b',
            border: '1px solid rgba(255, 50, 50, 0.3)',
            cursor: isResetting ? 'not-allowed' : 'pointer',
            transition: 'all 0.2s ease',
            boxShadow: '0 4px 15px rgba(255, 50, 50, 0.1)',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}
          onMouseOver={(e) => {
            if (!isResetting) {
              e.currentTarget.style.background = 'rgba(255, 50, 50, 0.2)';
              e.currentTarget.style.boxShadow = '0 0 15px rgba(255, 50, 50, 0.3)';
            }
          }}
          onMouseOut={(e) => {
            if (!isResetting) {
              e.currentTarget.style.background = 'rgba(255, 50, 50, 0.1)';
              e.currentTarget.style.boxShadow = '0 4px 15px rgba(255, 50, 50, 0.1)';
            }
          }}
        >
          {isResetting ? 'Erasing...' : (
            <>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"></path><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
              Reset Session
            </>
          )}
        </button>
      </div>

      {/* File upload UI */}
      <FileUpload sessionId={sessionId} />

      <hr style={{ margin: '2rem 0' }} />

      {/* Chat application view bounds */}
      <QuestionAnswering sessionId={sessionId} />
    </main>
  )
}

export default App
