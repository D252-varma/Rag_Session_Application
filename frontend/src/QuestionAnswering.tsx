import { useState, type FormEvent } from 'react'
import { buildSessionHeaders } from './session'

// Encapsulates returned chunk hits mapping to backend StoredChunk
interface SearchChunk {
    sessionId: string
    documentId: string
    text: string
    fileName: string | null
}

// Representing matching chunk combined with numerical distance
interface QueryResultWrapper {
    chunk: SearchChunk
    score: number
}

// Network state handler
type QueryStatus = 'idle' | 'searching' | 'success' | 'error'

interface QnAProps {
    sessionId: string
}

// Visual interface allowing users to prompt the backend LLM against uploaded context
export function QuestionAnswering({ sessionId }: QnAProps) {
    // Context states
    const [query, setQuery] = useState('')
    const [status, setStatus] = useState<QueryStatus>('idle')
    const [error, setError] = useState<string | null>(null)

    // Storage for response outputs
    const [answer, setAnswer] = useState<string | null>(null)
    const [sources, setSources] = useState<QueryResultWrapper[]>([])
    const [totalChunks, setTotalChunks] = useState<number | null>(null)

    // Pass user's prompt string securely to the /query generation endpoint
    const handleSubmit = async (event: FormEvent) => {
        event.preventDefault()

        const trimmed = query.trim()
        if (!trimmed) return

        setStatus('searching')
        setError(null)
        setAnswer(null)
        setSources([])
        setTotalChunks(null)

        try {
            const response = await fetch('http://localhost:4000/query', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...buildSessionHeaders(sessionId), // Add session scope security headers
                },
                body: JSON.stringify({
                    query: trimmed,
                    // Leaving topK and similarityThreshold omitted forces backend defaults
                }),
            })

            if (!response.ok) {
                // Safe evaluation of failure messages
                const data = await response.json().catch(() => ({}))
                const message = (data && (data.error as string)) || 'Generation failed'
                setStatus('error')
                setError(message)
                return
            }

            // Propagate successfully extracted string and referenced metadata
            const data = await response.json()
            setAnswer(data.answer)
            setSources(data.results || [])
            setTotalChunks(data.debug?.totalStoredChunks ?? 0)
            setStatus('success')
        } catch {
            setStatus('error')
            setError('Network error while querying backend.')
        }
    }

    return (
        <section style={{ marginTop: '2rem' }}>
            <h2>Ask a Question</h2>
            <form onSubmit={handleSubmit}>
                <div style={{ marginBottom: '1rem' }}>
                    <textarea
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Ask something about the documents you uploaded..."
                        rows={4}
                        style={{ width: '100%', padding: '0.5rem' }}
                    />
                </div>
                <button type="submit" disabled={status === 'searching' || !query.trim()}>
                    {status === 'searching' ? 'Thinking…' : 'Ask'}
                </button>
            </form>

            {/* Surface error conditions */}
            {status === 'error' && error && (
                <div style={{ color: 'red', marginTop: '1rem' }}>
                    <strong>Error:</strong> {error}
                </div>
            )}

            {/* Surface successfully generated answers and telemetry */}
            {status === 'success' && (
                <div style={{ marginTop: '2rem' }}>

                    {/* Debug Metrics */}
                    <div style={{
                        marginBottom: '1rem',
                        padding: '0.75rem',
                        backgroundColor: '#e6f7ff',
                        border: '1px solid #91d5ff',
                        borderRadius: '4px',
                        fontSize: '0.9rem'
                    }}>
                        <strong>Retrieval Debug:</strong> Stored chunks: {totalChunks} | Retrieved chunks: {sources.length}
                    </div>

                    {sources.length === 0 && totalChunks !== null && totalChunks > 0 && (
                        <div style={{
                            marginBottom: '1rem',
                            padding: '0.75rem',
                            backgroundColor: '#fffbe6',
                            border: '1px solid #ffe58f',
                            borderRadius: '4px',
                            color: '#d46b08',
                            fontSize: '0.9rem'
                        }}>
                            <strong>Warning:</strong> No chunks passed the similarity threshold. The query was rejected by application RAG guardrails.
                        </div>
                    )}

                    <h3>Answer</h3>
                    <div style={{
                        padding: '1rem',
                        backgroundColor: '#f5f5f5',
                        borderRadius: '4px',
                        whiteSpace: 'pre-wrap',
                        color: '#333'
                    }}>
                        {answer}
                    </div>

                    {/* Conditional rendering for relevant sources if applicable */}
                    {sources.length > 0 && (
                        <div style={{ marginTop: '1.5rem' }}>
                            <h4>Relevant Sources Used</h4>
                            <ul style={{ listStyleType: 'none', padding: 0 }}>
                                {sources.map((src, index) => (
                                    <li key={index} style={{
                                        marginBottom: '1rem',
                                        padding: '1rem',
                                        border: '1px solid #ddd',
                                        borderRadius: '4px'
                                    }}>
                                        <div style={{ fontSize: '0.9rem', color: '#666', marginBottom: '0.5rem' }}>
                                            <strong>Source {index + 1}:</strong> {src.chunk.fileName || 'Unknown File'}
                                            <span style={{ marginLeft: '1rem' }}>
                                                (Score: {(src.score * 100).toFixed(1)}%)
                                            </span>
                                        </div>
                                        <div style={{ fontSize: '0.9rem', fontStyle: 'italic', lineHeight: 1.4 }}>
                                            "{src.chunk.text.substring(0, 300)}..."
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>
            )}
        </section>
    )
}
