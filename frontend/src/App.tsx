import './App.css'
import { getOrCreateSessionId } from './session'

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
      <p>Backend health-check and modules will be wired next.</p>
    </main>
  )
}

export default App
