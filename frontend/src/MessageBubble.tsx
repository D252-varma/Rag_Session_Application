import { motion } from 'framer-motion'
import { CheckCircle2, AlertTriangle, Sparkles } from 'lucide-react'
import type { ChatMessage } from './ChatWindow' // Will define interface here later

// Helper for staggered typing animation or slide up
export function MessageBubble({ msg }: { msg: ChatMessage }) {
    const isUser = msg.role === 'user'

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            layout
            transition={{ type: 'spring', stiffness: 200, damping: 20 }}
            style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: isUser ? 'flex-end' : 'flex-start',
                width: '100%'
            }}
        >
            <div style={{
                maxWidth: '85%',
                padding: '1rem 1.25rem',
                borderRadius: '20px',
                borderBottomRightRadius: isUser ? '4px' : '20px',
                borderBottomLeftRadius: !isUser ? '4px' : '20px',
                background: isUser
                    ? 'linear-gradient(135deg, rgba(42, 139, 255, 0.2), rgba(192, 132, 252, 0.2))'
                    : (msg.status === 'error' ? 'rgba(255, 50, 50, 0.1)' : 'var(--glass-bg)'),
                backdropFilter: 'var(--glass-blur)',
                color: msg.status === 'error' ? '#ff6b6b' : 'var(--text-primary)',
                border: `1px solid ${isUser ? 'rgba(42, 139, 255, 0.4)' : 'var(--glass-border)'}`,
                boxShadow: isUser ? '0 0 20px rgba(192, 132, 252, 0.1)' : '0 4px 15px rgba(0,0,0,0.1)',
                whiteSpace: 'pre-wrap',
                fontSize: '0.95rem',
                lineHeight: 1.6,
                position: 'relative',
                overflow: 'hidden'
            }}>
                {msg.status === 'searching' ? (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--siri-cyan)' }}>
                        <Sparkles size={16} className="animate-pulse" />
                        <span style={{ animation: 'pulse 1.5s infinite' }}>Synthesizing knowledge...</span>
                    </span>
                ) : msg.content}
            </div>

            {/* Assistant Metadata Block */}
            {!isUser && msg.status === 'success' && msg.debug && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    style={{ marginTop: '0.5rem', width: '85%', paddingLeft: '0.75rem', paddingRight: '0.75rem' }}
                >
                    <div style={{
                        fontSize: '0.75rem',
                        color: 'var(--text-tertiary)',
                        marginBottom: '0.25rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.3rem'
                    }}>
                        <CheckCircle2 size={12} />
                        Searched {msg.debug.totalStoredChunks} document chunks. Found {msg.sources?.length || 0} matches.
                    </div>

                    {(msg.sources?.length === 0 && msg.debug.totalStoredChunks > 0) && (
                        <div style={{
                            marginTop: '0.5rem',
                            padding: '0.5rem 0.75rem',
                            backgroundColor: 'rgba(255, 165, 0, 0.1)',
                            color: '#ffd166',
                            fontSize: '0.8rem',
                            borderRadius: '8px',
                            border: '1px solid rgba(255, 165, 0, 0.2)',
                            display: 'flex',
                            alignItems: 'flex-start',
                            gap: '0.5rem'
                        }}>
                            <AlertTriangle size={14} style={{ marginTop: '0.1rem' }} />
                            <span>No chunks passed similarity threshold. Grounded scope rejected securely.</span>
                        </div>
                    )}

                    {(msg.sources && msg.sources.length > 0) && (
                        <details style={{
                            fontSize: '0.75rem',
                            color: 'var(--text-secondary)',
                            backgroundColor: 'rgba(255, 255, 255, 0.02)',
                            padding: '0.35rem 0.75rem',
                            borderRadius: '8px',
                            border: '1px solid rgba(255,255,255,0.05)',
                            marginTop: '0.25rem',
                            cursor: 'pointer'
                        }}>
                            <summary style={{ outline: 'none' }}>Source Evidence</summary>
                            <ul style={{ paddingLeft: '1rem', marginTop: '0.5rem', listStyle: 'none' }}>
                                {msg.sources.map((src, i) => (
                                    <li key={i} style={{ marginBottom: '0.5rem', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.5rem' }}>
                                        <strong style={{ color: 'var(--siri-cyan)' }}>{src.chunk.fileName || 'Doc'}</strong> <span style={{ opacity: 0.6 }}>(Match: {(src.score * 100).toFixed(1)}%)</span>
                                        <br />
                                        <span style={{ fontStyle: 'italic', opacity: 0.7, display: 'inline-block', marginTop: '0.25rem' }}>"{src.chunk.text.substring(0, 100)}..."</span>
                                    </li>
                                ))}
                            </ul>
                        </details>
                    )}
                </motion.div>
            )}
        </motion.div>
    )
}
