import { motion, AnimatePresence } from 'framer-motion'
import { X, Settings, Zap, Target, BookOpen, Layers } from 'lucide-react'

interface SettingsModalProps {
    isOpen: boolean
    onClose: () => void
    chunkSize: number
    setChunkSize: (val: number) => void
    chunkOverlap: number
    setChunkOverlap: (val: number) => void
    topK: number
    setTopK: (val: number) => void
    similarityThreshold: number
    setSimilarityThreshold: (val: number) => void
}

export function SettingsModal({
    isOpen, onClose,
    chunkSize, setChunkSize,
    chunkOverlap, setChunkOverlap,
    topK, setTopK,
    similarityThreshold, setSimilarityThreshold
}: SettingsModalProps) {
    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    style={{
                        position: 'fixed',
                        inset: 0,
                        zIndex: 9999,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: 'rgba(0, 0, 0, 0.4)',
                        backdropFilter: 'blur(10px)',
                        WebkitBackdropFilter: 'blur(10px)',
                        padding: '1rem',
                    }}
                    onClick={onClose}
                >
                    <motion.div
                        initial={{ scale: 0.95, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.95, opacity: 0, y: 20 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                        onClick={(e) => e.stopPropagation()}
                        className="premium-glass-panel"
                        style={{
                            width: '100%',
                            maxWidth: '500px',
                            padding: '2rem',
                            position: 'relative',
                            background: 'rgba(15, 23, 42, 0.8)', // Deep navy frost
                        }}
                    >
                        <button
                            onClick={onClose}
                            style={{
                                position: 'absolute',
                                top: '1.5rem',
                                right: '1.5rem',
                                background: 'rgba(255,255,255,0.05)',
                                border: '1px solid rgba(255,255,255,0.1)',
                                color: 'var(--text-secondary)',
                                borderRadius: '50%',
                                width: '32px',
                                height: '32px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer',
                                transition: 'all 0.2s ease'
                            }}
                            onMouseOver={(e) => {
                                e.currentTarget.style.background = 'rgba(255,255,255,0.1)';
                                e.currentTarget.style.color = '#fff';
                            }}
                            onMouseOut={(e) => {
                                e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
                                e.currentTarget.style.color = 'var(--text-secondary)';
                            }}
                        >
                            <X size={18} />
                        </button>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '2rem' }}>
                            <div style={{ padding: '0.6rem', background: 'rgba(42, 139, 255, 0.1)', borderRadius: '12px', color: 'var(--siri-blue)' }}>
                                <Settings size={24} />
                            </div>
                            <div>
                                <h2 style={{ fontSize: '1.25rem', fontWeight: 600, margin: 0 }}>Guardrails & Retrieval</h2>
                                <p style={{ fontSize: '0.85rem', color: 'var(--text-tertiary)', margin: '0.2rem 0 0 0' }}>Configure global RAG memory parameters.</p>
                            </div>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

                            {/* Chunk Size */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                                    <label style={{ fontSize: '0.9rem', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <BookOpen size={16} color="var(--text-secondary)" /> Chunk Size (characters)
                                    </label>
                                    <span style={{ fontSize: '0.85rem', color: 'var(--siri-cyan)', fontFamily: 'monospace' }}>{chunkSize}</span>
                                </div>
                                <input
                                    type="range"
                                    min="200"
                                    max="4000"
                                    step="100"
                                    value={chunkSize}
                                    onChange={(e) => setChunkSize(Number(e.target.value))}
                                    style={{ width: '100%', cursor: 'pointer', accentColor: 'var(--siri-cyan)' }}
                                />
                                <p style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', margin: 0 }}>Larger chunks provide more context but consume more prompt tokens.</p>
                            </div>

                            {/* Chunk Overlap */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                                    <label style={{ fontSize: '0.9rem', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <Layers size={16} color="var(--text-secondary)" /> Chunk Overlap
                                    </label>
                                    <span style={{ fontSize: '0.85rem', color: 'var(--siri-cyan)', fontFamily: 'monospace' }}>{chunkOverlap}</span>
                                </div>
                                <input
                                    type="range"
                                    min="0"
                                    max="1000"
                                    step="50"
                                    value={chunkOverlap}
                                    onChange={(e) => setChunkOverlap(Number(e.target.value))}
                                    style={{ width: '100%', cursor: 'pointer', accentColor: 'var(--siri-cyan)' }}
                                />
                                <p style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', margin: 0 }}>Amount of overlapping text between adjacent chunks to preserve boundaries.</p>
                            </div>

                            {/* Top K */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                                    <label style={{ fontSize: '0.9rem', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <Target size={16} color="var(--text-secondary)" /> Top K (Injection Limit)
                                    </label>
                                    <span style={{ fontSize: '0.85rem', color: 'var(--siri-cyan)', fontFamily: 'monospace' }}>{topK} results</span>
                                </div>
                                <input
                                    type="range"
                                    min="1"
                                    max="10"
                                    step="1"
                                    value={topK}
                                    onChange={(e) => setTopK(Number(e.target.value))}
                                    style={{ width: '100%', cursor: 'pointer', accentColor: 'var(--siri-cyan)' }}
                                />
                                <p style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', margin: 0 }}>Maximum number of semantic excerpts to supply the LLM per prompt.</p>
                            </div>

                            {/* Similarity Threshold */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                                    <label style={{ fontSize: '0.9rem', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <Zap size={16} color="var(--text-secondary)" /> Similarity Threshold Strictness
                                    </label>
                                    <span style={{ fontSize: '0.85rem', color: 'var(--siri-cyan)', fontFamily: 'monospace' }}>{similarityThreshold.toFixed(2)}</span>
                                </div>
                                <input
                                    type="range"
                                    min="0.0"
                                    max="1.0"
                                    step="0.05"
                                    value={similarityThreshold}
                                    onChange={(e) => setSimilarityThreshold(Number(e.target.value))}
                                    style={{ width: '100%', cursor: 'pointer', accentColor: 'var(--siri-cyan)' }}
                                />
                                <p style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', margin: 0 }}>0.0 is very loose (hallucination risk). 0.5+ is very strict (rejection risk).</p>
                            </div>

                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    )
}
