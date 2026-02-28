import './App.css'
import { getOrCreateSessionId, clearSessionLocalStorage } from './session'
import { UploadPanel } from './UploadPanel'
import { ChatWindow } from './ChatWindow'
import { SettingsModal } from './SettingsModal'
import { useState } from 'react'
import { RefreshCw, Settings } from 'lucide-react'

// Main App Component
function App() {
  // Get active session ID for this user
  const sessionId = getOrCreateSessionId()
  const [isResetting, setIsResetting] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Unified Retrieval & Guardrails State
  const [chunkSize, setChunkSize] = useState(1000);
  const [chunkOverlap, setChunkOverlap] = useState(200);
  const [topK, setTopK] = useState(3);
  const [similarityThreshold, setSimilarityThreshold] = useState(0.15);

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
      {/* Fluid Background Layer */}
      <div className="fluid-bg-container">
        <div className="fluid-orb fluid-orb-1"></div>
        <div className="fluid-orb fluid-orb-2"></div>
        <div className="fluid-orb fluid-orb-3"></div>
      </div>

      {/* Floating Header Actions */}
      <div style={{
        position: 'absolute',
        top: '2rem',
        right: '2rem',
        display: 'flex',
        alignItems: 'center',
        gap: '1rem',
        zIndex: 100
      }}>
        <div style={{
          fontSize: '0.75rem',
          color: 'var(--text-tertiary)',
          fontFamily: 'monospace',
          background: 'var(--glass-bg)',
          backdropFilter: 'var(--glass-blur)',
          padding: '0.5rem 1rem',
          borderRadius: '20px',
          border: '1px solid var(--glass-border)'
        }}>
          ID: {sessionId.split('-')[0]}
        </div>

        <button
          onClick={() => setIsSettingsOpen(true)}
          className="premium-glass-panel"
          style={{
            padding: '0.6rem 0.8rem',
            background: 'var(--glass-bg)',
            color: 'var(--text-secondary)',
            border: '1px solid var(--glass-border)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            transition: 'all 0.3s ease'
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.background = 'rgba(255,255,255,0.1)';
            e.currentTarget.style.color = 'var(--text-primary)';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.background = 'var(--glass-bg)';
            e.currentTarget.style.color = 'var(--text-secondary)';
          }}
        >
          <Settings size={18} />
        </button>

        <button
          onClick={handleResetSession}
          disabled={isResetting}
          className="premium-glass-panel"
          style={{
            padding: '0.6rem 1.25rem',
            background: 'rgba(255, 50, 50, 0.05)',
            color: '#ff6b6b',
            border: '1px solid rgba(255, 50, 50, 0.2)',
            cursor: isResetting ? 'not-allowed' : 'pointer',
            fontWeight: 500,
            fontSize: '0.9rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            transition: 'all 0.3s ease'
          }}
          onMouseOver={(e) => {
            if (!isResetting) {
              e.currentTarget.style.background = 'rgba(255, 50, 50, 0.15)';
              e.currentTarget.style.boxShadow = '0 0 20px rgba(255, 50, 50, 0.2)';
            }
          }}
          onMouseOut={(e) => {
            if (!isResetting) {
              e.currentTarget.style.background = 'rgba(255, 50, 50, 0.05)';
              e.currentTarget.style.boxShadow = 'var(--glass-shadow)';
            }
          }}
        >
          <RefreshCw size={16} className={isResetting ? 'animate-spin' : ''} />
          {isResetting ? 'Erasing...' : 'Reset Session'}
        </button>
      </div>

      <div style={{
        marginTop: '8rem',
        marginBottom: '3rem',
        textAlign: 'center',
        padding: '0 1rem',
        animation: 'soft-fade-in 1s ease-out forwards'
      }}>
        <h1 style={{
          fontSize: 'clamp(2.5rem, 6vw, 4.5rem)',
          fontWeight: 800,
          background: 'linear-gradient(135deg, #ffffff 0%, rgba(255,255,255,0.7) 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          lineHeight: 1.1,
          letterSpacing: '-0.02em',
          maxWidth: '900px',
          margin: '0 auto',
          textShadow: '0 0 40px rgba(255,255,255,0.1)'
        }}>
          THIS IS SESSION-BASED RAG APPLICATION
        </h1>
      </div>

      <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '2rem', zIndex: 10 }}>
        <UploadPanel sessionId={sessionId} chunkSize={chunkSize} chunkOverlap={chunkOverlap} />
        <ChatWindow sessionId={sessionId} topK={topK} similarityThreshold={similarityThreshold} />
      </div>

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        chunkSize={chunkSize}
        setChunkSize={setChunkSize}
        chunkOverlap={chunkOverlap}
        setChunkOverlap={setChunkOverlap}
        topK={topK}
        setTopK={setTopK}
        similarityThreshold={similarityThreshold}
        setSimilarityThreshold={setSimilarityThreshold}
      />
    </main>
  )
}

export default App
