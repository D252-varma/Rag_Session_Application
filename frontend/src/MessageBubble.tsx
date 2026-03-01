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
            <div className="message-bubble" style={{
                maxWidth: '85%',
                padding: '1rem 1.25rem',
                borderRadius: '24px',
                borderBottomRightRadius: isUser ? '4px' : '24px',
                borderBottomLeftRadius: !isUser ? '4px' : '24px',
                background: isUser
                    ? 'linear-gradient(135deg, rgba(10, 132, 255, 0.25), rgba(191, 90, 242, 0.25))'
                    : (msg.status === 'error' ? 'rgba(255, 50, 50, 0.1)' : 'var(--glass-bg-strong)'),
                backdropFilter: 'var(--glass-blur)',
                color: msg.status === 'error' ? '#ff6b6b' : 'var(--text-primary)',
                border: `1px solid ${isUser ? 'rgba(255,255,255,0.1)' : 'var(--glass-border)'}`,
                boxShadow: isUser ? '0 8px 32px rgba(191, 90, 242, 0.15)' : '0 10px 40px rgba(0,0,0,0.2)',
                whiteSpace: 'pre-wrap',
                fontSize: '0.95rem',
                lineHeight: 1.6,
                position: 'relative',
                overflow: 'hidden'
            }}>
                {msg.status === 'searching' ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--siri-cyan)' }}>
                        <Sparkles size={16} />
                        <div style={{ display: 'flex', alignItems: 'center', height: '100%', paddingTop: '0.2rem' }}>
                            <span className="typing-dot"></span>
                            <span className="typing-dot"></span>
                            <span className="typing-dot"></span>
                        </div>
                    </div>
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
                            fontSize: '0.8rem',
                            color: 'var(--text-secondary)',
                            backgroundColor: 'rgba(255, 255, 255, 0.03)',
                            padding: '0.5rem 0.8rem',
                            borderRadius: '12px',
                            border: '1px solid var(--glass-border)',
                            marginTop: '0.5rem',
                            cursor: 'pointer',
                            boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
                        }}>
                            <summary style={{ outline: 'none', fontWeight: 500 }}>View Sources</summary>
                            <ul style={{ paddingLeft: '0', marginTop: '0.75rem', listStyle: 'none' }}>
                                {msg.sources.map((src, i) => (
                                    <li key={i} style={{ marginBottom: '0.75rem', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.75rem' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                                            <strong style={{ color: 'var(--siri-cyan)' }}>{src.chunk.fileName || 'Doc'}</strong>
                                            <span style={{ opacity: 0.6, fontSize: '0.75rem' }}>Match: {(src.score * 100).toFixed(1)}%</span>
                                        </div>
                                        <div style={{ fontStyle: 'italic', opacity: 0.7, lineHeight: 1.4 }}>
                                            "{src.chunk.text.substring(0, 150)}..."
                                        </div>
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
