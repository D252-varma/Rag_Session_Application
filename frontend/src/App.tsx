import './App.css'
import { getOrCreateSessionId } from './session'
import { FileUpload } from './FileUpload'
import { QuestionAnswering } from './QuestionAnswering'

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

      <hr style={{ margin: '2rem 0' }} />

      {/* Chat application view bounds */}
      <QuestionAnswering sessionId={sessionId} />
    </main>
  )
}

export default App
