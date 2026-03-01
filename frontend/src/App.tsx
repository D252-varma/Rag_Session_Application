import './App.css'
import { getOrCreateSessionId, clearSessionLocalStorage, getActiveDocuments, type DocumentMeta } from './session'
import { UploadPanel } from './UploadPanel'
import { ChatWindow } from './ChatWindow'
import { SettingsModal } from './SettingsModal'
import { ActiveDocsPanel } from './ActiveDocsPanel'
import { useState, useEffect } from 'react'
import { Settings, RefreshCw } from 'lucide-react'

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

  const [activeDocs, setActiveDocs] = useState<DocumentMeta[]>([]);

  useEffect(() => {
    setActiveDocs(getActiveDocuments(sessionId));
  }, [sessionId]);

  const handleResetSession = async () => {
    if (!window.confirm("Are you sure you want to clear all uploaded documents and start a new session?")) {
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
      <div className="app-header-actions" style={{
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
            background: 'rgba(255, 50, 50, 0.08)',
            color: '#ff6b6b',
            border: '1px solid rgba(255, 50, 50, 0.15)',
            cursor: isResetting ? 'not-allowed' : 'pointer',
            fontWeight: 500,
            fontSize: '0.85rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            transition: 'all 0.3s ease'
          }}
          onMouseOver={(e) => {
            if (!isResetting) {
              e.currentTarget.style.background = 'rgba(255, 50, 50, 0.15)';
              e.currentTarget.style.boxShadow = '0 0 20px rgba(255, 50, 50, 0.3)';
            }
          }}
          onMouseOut={(e) => {
            if (!isResetting) {
              e.currentTarget.style.background = 'rgba(255, 50, 50, 0.08)';
              e.currentTarget.style.boxShadow = 'var(--glass-shadow)';
            }
          }}
        >
          <RefreshCw size={16} className={isResetting ? 'animate-spin' : ''} />
          {isResetting ? 'Erasing...' : 'Reset Session'}
        </button>
      </div>

      <div style={{
        marginTop: '7rem',
        marginBottom: '2.5rem',
        textAlign: 'center',
        padding: '0 1rem',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '0.5rem'
      }} className="animate-fade-in app-hero-header">
        <h1 style={{
          fontSize: 'clamp(2rem, 5vw, 4rem)',
          fontWeight: 700,
          background: 'linear-gradient(to right bottom, #ffffff, var(--text-tertiary))',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          lineHeight: 1.1,
          letterSpacing: '-0.03em',
          textShadow: '0 0 30px rgba(255,255,255,0.05)'
        }}>
          THIS IS SESSION-BASED RAG APPLICATION
        </h1>
        <p style={{
          fontSize: '1.1rem',
          color: 'var(--text-secondary)',
          fontWeight: 400,
          maxWidth: '500px',
          letterSpacing: '-0.01em'
        }}>
          AI assistant equipped with persistent semantic memory.
        </p>
      </div>

      <div className="app-main-layout" style={{
        width: '100%',
        maxWidth: '1000px',
        margin: '0 auto',
        zIndex: 10,
        paddingBottom: '2rem'
      }}>
        <div className="top-panels-container">
          <ActiveDocsPanel
            documents={activeDocs}
            onClearDocs={handleResetSession}
            isClearing={isResetting}
          />
          <UploadPanel
            sessionId={sessionId}
            chunkSize={chunkSize}
            chunkOverlap={chunkOverlap}
            onUploadSuccess={() => setActiveDocs(getActiveDocuments(sessionId))}
          />
        </div>

        <div style={{ textAlign: 'center', marginBottom: '-1.5rem', zIndex: 5, marginTop: '2rem' }}>
          <div style={{
            display: 'inline-block',
            fontSize: '0.8rem',
            color: 'var(--text-tertiary)',
            background: 'var(--glass-bg)',
            backdropFilter: 'var(--glass-blur)',
            padding: '0.6rem 1.25rem',
            borderRadius: '20px',
            border: '1px solid var(--glass-border)',
            maxWidth: '92%',
            lineHeight: 1.5,
            wordWrap: 'break-word'
          }}>
            ⚠️ Answers are generated from all uploaded documents unless you clear the documents.
          </div>
        </div>

        <div style={{ width: '100%', marginTop: '2.5rem' }}>
          <ChatWindow
            sessionId={sessionId}
            topK={topK}
            similarityThreshold={similarityThreshold}
            activeDocumentsCount={activeDocs.length}
          />
        </div>
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
