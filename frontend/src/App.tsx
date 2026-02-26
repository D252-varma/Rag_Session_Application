import './App.css'
import { getOrCreateSessionId } from './session'
import { FileUpload } from './FileUpload'

function App() {
  const sessionId = getOrCreateSessionId()

  return (
    <main className="app-root">
      <h1>Session-Based RAG App</h1>
      <p>Frontend is running.</p>
      <p>
        Current session ID:&nbsp;
        <code>{sessionId}</code>
      </p>
      <FileUpload sessionId={sessionId} />
    </main>
  )
}

export default App
