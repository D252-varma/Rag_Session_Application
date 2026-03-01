import { useState, useRef, useEffect, type FormEvent } from 'react'
import { buildSessionHeaders } from './session'
import { MessageBubble } from './MessageBubble'
import { InputBar } from './InputBar'
import { motion, AnimatePresence } from 'framer-motion'
import { Bot, Trash2 } from 'lucide-react'

// Internal types mapped from original QA
interface SearchChunk {
    sessionId: string
    documentId: string
    text: string
    fileName: string | null
}
interface QueryResultWrapper {
    chunk: SearchChunk
    score: number
}
type QueryStatus = 'idle' | 'searching' | 'success' | 'error'

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

interface ChatWindowProps {
    sessionId: string
    topK: number
    similarityThreshold: number
    activeDocumentsCount: number
}

export function ChatWindow({ sessionId, topK, similarityThreshold, activeDocumentsCount }: ChatWindowProps) {
    const [history, setHistory] = useState<ChatMessage[]>([])
    const [query, setQuery] = useState('')
    const chatEndRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [history])

    const handleSubmit = async (event: FormEvent) => {
        event.preventDefault()
        const trimmed = query.trim()
        if (!trimmed) return

        const userMsgId = Date.now().toString()
        const userMessage: ChatMessage = { id: userMsgId, role: 'user', content: trimmed }

        const assistantMsgId = (Date.now() + 1).toString()
        const placeholderMessage: ChatMessage = { id: assistantMsgId, role: 'assistant', content: '', status: 'searching' }

        setHistory(prev => [...prev, userMessage, placeholderMessage])
        setQuery('')

        try {
            const response = await fetch('http://localhost:4000/query', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...buildSessionHeaders(sessionId),
                },
                body: JSON.stringify({
                    query: trimmed,
                    history: history.slice(-10).map((m) => ({ role: m.role, content: m.content })),
                    topK,
                    similarityThreshold
                })
            })

            if (!response.ok) {
                const data = await response.json().catch(() => ({}))
                const errorMessage = (data && (data.error as string)) || 'Generation failed'
                setHistory(prev => prev.map(msg =>
                    msg.id === assistantMsgId
                        ? { ...msg, content: errorMessage, status: 'error' }
                        : msg
                ))
                return
            }

            const data = await response.json()
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
        <motion.section
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="premium-glass-panel chat-window-wrapper"
            style={{
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
                height: '600px',
                width: '100%',
                margin: '0 auto',
                overflow: 'hidden',
            }}
        >
            {/* Clear Chat Button */}
            {history.length > 0 && (
                <button
                    onClick={() => setHistory([])}
                    style={{
                        position: 'absolute',
                        top: '1rem',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        zIndex: 10,
                        padding: '0.4rem 0.8rem',
                        background: 'rgba(255, 50, 50, 0.1)',
                        color: '#ff6b6b',
                        border: '1px solid rgba(255, 50, 50, 0.2)',
                        borderRadius: '12px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.4rem',
                        fontSize: '0.8rem',
                        fontWeight: 500,
                        transition: 'all 0.2s ease',
                        backdropFilter: 'var(--glass-blur)'
                    }}
                    onMouseOver={(e) => {
                        e.currentTarget.style.background = 'rgba(255, 50, 50, 0.2)';
                        e.currentTarget.style.boxShadow = '0 0 15px rgba(255, 50, 50, 0.2)';
                    }}
                    onMouseOut={(e) => {
                        e.currentTarget.style.background = 'rgba(255, 50, 50, 0.1)';
                        e.currentTarget.style.boxShadow = 'none';
                    }}
                >
                    <Trash2 size={14} />
                    Clear Chat
                </button>
            )}

            {/* scrolling message canvas */}
            <div className="chat-window-scroll-area" style={{
                flex: 1,
                overflowY: 'auto',
                padding: '1.5rem',
                paddingBottom: '8rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '2.5rem',
                scrollBehavior: 'smooth'
            }}>
                <AnimatePresence>
                    {activeDocumentsCount === 0 ? (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            style={{
                                textAlign: 'center',
                                marginTop: '15%',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                gap: '1.5rem',
                                color: 'var(--text-tertiary)'
                            }}
                        >
                            <div style={{
                                padding: '1.2rem',
                                background: 'rgba(255,255,255,0.03)',
                                borderRadius: '50%',
                                border: '1px solid var(--glass-border)',
                                boxShadow: '0 0 30px rgba(255,255,255,0.02)'
                            }}>
                                <Bot size={44} color="rgba(255,255,255,0.25)" strokeWidth={1} />
                            </div>
                            <p style={{ maxWidth: '300px', lineHeight: 1.6, fontSize: '0.95rem', fontWeight: 300 }}>
                                No documents uploaded yet. Upload a file to begin.
                            </p>
                        </motion.div>
                    ) : history.length === 0 ? (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            style={{
                                textAlign: 'center',
                                marginTop: '15%',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                gap: '1.5rem',
                                color: 'var(--text-tertiary)'
                            }}
                        >
                            <div style={{
                                padding: '1.2rem',
                                background: 'rgba(255,255,255,0.03)',
                                borderRadius: '50%',
                                border: '1px solid var(--glass-border)',
                                boxShadow: '0 0 30px rgba(255,255,255,0.02)'
                            }}>
                                <Bot size={44} color="rgba(255,255,255,0.25)" strokeWidth={1} />
                            </div>
                            <p style={{ maxWidth: '300px', lineHeight: 1.6, fontSize: '0.95rem', fontWeight: 300 }}>
                                System ready. Ask questions securely restricted to your uploaded document boundaries.
                            </p>
                        </motion.div>
                    ) : (
                        history.map((msg) => <MessageBubble key={msg.id} msg={msg} />)
                    )}
                </AnimatePresence>
                <div ref={chatEndRef} />
            </div>

            {/* Suspended input bar */}
            <InputBar
                query={query}
                setQuery={setQuery}
                disabled={activeDocumentsCount === 0 || (history.length > 0 && history[history.length - 1].status === 'searching')}
                onSubmit={handleSubmit}
            />
        </motion.section>
    )
}
