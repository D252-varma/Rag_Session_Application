import { useState, useRef, useEffect, type FormEvent } from 'react'
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

export interface ChatMessage {
    id: string
    role: 'user' | 'assistant'
    content: string
    status?: QueryStatus
    sources?: QueryResultWrapper[]
    debug?: {
        totalStoredChunks: number
    }
}

export function QuestionAnswering({ sessionId }: QnAProps) {
    // Array-based conversational memory
    const [history, setHistory] = useState<ChatMessage[]>([])
    const [query, setQuery] = useState('')

    // Auto-scroll ref
    const chatEndRef = useRef<HTMLDivElement>(null)

    // Scroll to the bottom whenever history updates natively
    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [history])

    const handleSubmit = async (event: FormEvent) => {
        event.preventDefault()

        const trimmed = query.trim()
        if (!trimmed) return

        // 1. Immediately inject user's question into visual chat array
        const userMsgId = Date.now().toString()
        const userMessage: ChatMessage = { id: userMsgId, role: 'user', content: trimmed }

        // 2. Inject a placeholder message for the Assistant showing activity
        const assistantMsgId = (Date.now() + 1).toString()
        const placeholderMessage: ChatMessage = { id: assistantMsgId, role: 'assistant', content: '', status: 'searching' }

        setHistory(prev => [...prev, userMessage, placeholderMessage])
        setQuery('') // Clear input quickly to mimic standard chat UX

        try {
            const response = await fetch('http://localhost:4000/query', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...buildSessionHeaders(sessionId),
                },
                body: JSON.stringify({
                    query: trimmed,
                    history: history, // Send previous established context natively safely
                }),
            })

            if (!response.ok) {
                const data = await response.json().catch(() => ({}))
                const errorMessage = (data && (data.error as string)) || 'Generation failed'

                // Overwrite placeholder natively
                setHistory(prev => prev.map(msg =>
                    msg.id === assistantMsgId
                        ? { ...msg, content: errorMessage, status: 'error' }
                        : msg
                ))
                return
            }

            const data = await response.json()

            // Output grounded result payload completely
            setHistory(prev => prev.map(msg =>
                msg.id === assistantMsgId
                    ? {
                        ...msg,
                        content: data.answer,
                        status: 'success',
                        sources: data.results || [],
                        debug: data.debug
                    }
                    : msg
            ))

        } catch {
            setHistory(prev => prev.map(msg =>
                msg.id === assistantMsgId
                    ? { ...msg, content: 'Network error while querying backend.', status: 'error' }
                    : msg
            ))
        }
    }

    return (
        <section className="glass-panel" style={{
            marginTop: '2rem',
            display: 'flex',
            flexDirection: 'column',
            height: '600px',
            width: '100%',
            maxWidth: '900px',
            margin: '2rem auto',
            overflow: 'hidden',
        }}>
            {/* Header */}
            <div style={{
                padding: '1.2rem',
                borderBottom: '1px solid var(--glass-border)',
                background: 'rgba(255, 255, 255, 0.05)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
            }}>
                <h2 style={{ margin: 0, fontSize: '1.2rem', color: 'var(--text-main)', letterSpacing: '0.5px' }}>
                    Document Intelligence <span style={{ color: 'var(--neon-cyan)', fontSize: '0.8em' }}>| RAG</span>
                </h2>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                    {sessionId.split('-')[0]} // SECURE
                </div>
            </div>

            {/* Chat Feed */}
            <div style={{
                flex: 1,
                overflowY: 'auto',
                padding: '1.5rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '1.5rem'
            }}>
                {history.length === 0 ? (
                    <div style={{
                        color: 'var(--text-muted)',
                        textAlign: 'center',
                        marginTop: '3rem',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '1rem'
                    }}>
                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--neon-violet)" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                        </svg>
                        <p style={{ maxWidth: '300px', lineHeight: 1.6 }}>System initialized. Awaiting queries against the uploaded document context.</p>
                    </div>
                ) : (
                    history.map((msg) => (
                        <div key={msg.id} className="animate-slide-up" style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start',
                        }}>
                            {/* Literal Message Bubble */}
                            <div style={{
                                maxWidth: '85%',
                                padding: '1rem 1.25rem',
                                borderRadius: '12px',
                                borderBottomRightRadius: msg.role === 'user' ? '4px' : '12px',
                                borderBottomLeftRadius: msg.role === 'assistant' ? '4px' : '12px',
                                background: msg.role === 'user'
                                    ? 'linear-gradient(135deg, rgba(0, 123, 255, 0.2), rgba(138, 43, 226, 0.2))'
                                    : (msg.status === 'error' ? 'rgba(255, 50, 50, 0.1)' : 'rgba(255, 255, 255, 0.05)'),
                                color: msg.status === 'error' ? '#ff6b6b' : 'var(--text-main)',
                                border: `1px solid ${msg.role === 'user' ? 'rgba(0, 123, 255, 0.3)' : 'var(--glass-border)'}`,
                                boxShadow: msg.role === 'user' ? '0 0 10px rgba(0, 123, 255, 0.1)' : 'none',
                                whiteSpace: 'pre-wrap',
                                fontSize: '0.95rem',
                                lineHeight: 1.6,
                            }}>
                                {msg.status === 'searching' ? (
                                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--neon-cyan)' }}>
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ animation: 'spin 2s linear infinite' }}>
                                            <line x1="12" y1="2" x2="12" y2="6"></line><line x1="12" y1="18" x2="12" y2="22"></line><line x1="4.93" y1="4.93" x2="7.76" y2="7.76"></line><line x1="16.24" y1="16.24" x2="19.07" y2="19.07"></line><line x1="2" y1="12" x2="6" y2="12"></line><line x1="18" y1="12" x2="22" y2="12"></line><line x1="4.93" y1="19.07" x2="7.76" y2="16.24"></line><line x1="16.24" y1="7.76" x2="19.07" y2="4.93"></line>
                                        </svg>
                                        Synthesizing context...
                                    </span>
                                ) : msg.content}
                            </div>

                            {/* Assistant Metadata Block */}
                            {msg.role === 'assistant' && msg.status === 'success' && msg.debug && (
                                <div style={{ marginTop: '0.75rem', width: '85%', paddingLeft: '0.5rem' }}>

                                    <div style={{
                                        fontSize: '0.75rem',
                                        color: 'var(--text-muted)',
                                        marginBottom: '0.5rem',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.25rem'
                                    }}>
                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                                        Searched {msg.debug.totalStoredChunks} document chunks. Found {msg.sources?.length || 0} relevant matches.
                                    </div>

                                    {(msg.sources?.length === 0 && msg.debug.totalStoredChunks > 0) && (
                                        <div style={{
                                            padding: '0.5rem 0.75rem',
                                            backgroundColor: 'rgba(255, 165, 0, 0.1)',
                                            color: '#ffd166',
                                            fontSize: '0.8rem',
                                            borderRadius: '6px',
                                            marginBottom: '0.5rem',
                                            border: '1px solid rgba(255, 165, 0, 0.2)'
                                        }}>
                                            ⚠️ No chunks passed the similarity threshold. Answer generated outside RAG scope limits.
                                        </div>
                                    )}

                                    {(msg.sources && msg.sources.length > 0) && (
                                        <details style={{
                                            fontSize: '0.8rem',
                                            color: 'var(--text-muted)',
                                            backgroundColor: 'rgba(255, 255, 255, 0.02)',
                                            padding: '0.5rem',
                                            borderRadius: '6px',
                                            border: '1px solid var(--glass-border)'
                                        }}>
                                            <summary style={{ cursor: 'pointer', outline: 'none' }}>View Source Evidence</summary>
                                            <ul style={{ paddingLeft: '1rem', marginTop: '0.75rem', listStyle: 'none' }}>
                                                {msg.sources.map((src, i) => (
                                                    <li key={i} style={{ marginBottom: '0.75rem', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.75rem' }}>
                                                        <strong style={{ color: 'var(--neon-cyan)' }}>{src.chunk.fileName || 'Doc'}</strong> <span style={{ opacity: 0.7 }}>(Match: {(src.score * 100).toFixed(1)}%)</span>
                                                        <br />
                                                        <span style={{ fontStyle: 'italic', opacity: 0.8, display: 'inline-block', marginTop: '0.25rem' }}>"{src.chunk.text.substring(0, 150)}..."</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </details>
                                    )}
                                </div>
                            )}
                        </div>
                    ))
                )}
                {/* Invisible element to auto-scroll into layout */}
                <div ref={chatEndRef} />
            </div>

            {/* Input Form Box docked at bottom */}
            <form onSubmit={handleSubmit} style={{
                padding: '1.25rem',
                borderTop: '1px solid var(--glass-border)',
                background: 'rgba(10, 10, 15, 0.4)',
                display: 'flex',
                gap: '0.75rem'
            }}>
                <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Ask something about the documents you uploaded..."
                    style={{
                        flex: 1,
                        padding: '0.85rem 1rem',
                        borderRadius: '8px',
                        border: '1px solid var(--glass-border)',
                        background: 'rgba(255, 255, 255, 0.05)',
                        color: 'var(--text-main)',
                        outline: 'none',
                        transition: 'all 0.2s ease',
                        boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.1)'
                    }}
                    onFocus={(e) => {
                        e.target.style.borderColor = 'var(--neon-violet)';
                        e.target.style.boxShadow = '0 0 0 2px rgba(138, 43, 226, 0.2)';
                    }}
                    onBlur={(e) => {
                        e.target.style.borderColor = 'var(--glass-border)';
                        e.target.style.boxShadow = 'inset 0 2px 4px rgba(0,0,0,0.1)';
                    }}
                    disabled={history.length > 0 && history[history.length - 1].status === 'searching'}
                />
                <button
                    type="submit"
                    disabled={!query.trim() || (history.length > 0 && history[history.length - 1].status === 'searching')}
                    style={{
                        padding: '0 1.5rem',
                        background: 'linear-gradient(135deg, var(--neon-blue), var(--neon-violet))',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: (!query.trim() || (history.length > 0 && history[history.length - 1].status === 'searching')) ? 'not-allowed' : 'pointer',
                        fontWeight: 600,
                        opacity: (!query.trim() || (history.length > 0 && history[history.length - 1].status === 'searching')) ? 0.5 : 1,
                        transition: 'all 0.2s ease'
                    }}
                >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
                </button>
            </form>
            <style>{`
                @keyframes spin { 100% { transform: rotate(360deg); } }
            `}</style>
        </section>
    )
}
