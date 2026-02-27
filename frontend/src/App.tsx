import './App.css'
import { getOrCreateSessionId } from './session'
import { FileUpload } from './FileUpload'

// Main App Component
function App() {
  // Get active session ID for this user
  const sessionId = getOrCreateSessionId()

  return (
    <main className="app-root">
      <h1>Session-Based RAG App</h1>
      <p>Frontend is running.</p>
      <p>
        Current session ID:&nbsp;
        <code>{sessionId}</code>
      </p>

      {/* File upload UI */}
      <FileUpload sessionId={sessionId} />
    </main>
  )
}

export default App
