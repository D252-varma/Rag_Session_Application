import { motion } from 'framer-motion';
import { FileText, Trash2, CheckCircle2, ShieldAlert } from 'lucide-react';
import type { DocumentMeta } from './session';

interface ActiveDocsPanelProps {
    documents: DocumentMeta[];
    onClearDocs: () => void;
    isClearing: boolean;
}

export function ActiveDocsPanel({ documents, onClearDocs, isClearing }: ActiveDocsPanelProps) {
    const hasDocuments = documents.length > 0;

    return (
        <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="premium-glass-panel active-docs-sidebar"
            style={{
                width: '100%',
                maxWidth: '320px',
                height: 'fit-content',
                minHeight: '400px',
                display: 'flex',
                flexDirection: 'column',
                padding: '1.5rem',
                gap: '1.5rem',
            }}
        >
            <div style={{ paddingBottom: '1rem', borderBottom: '1px solid var(--glass-border)' }}>
                <h2 style={{
                    fontSize: '1.25rem',
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    margin: 0
                }}>
                    <FileText size={20} color="var(--siri-blue)" />
                    Active Documents
                </h2>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-tertiary)', margin: '0.5rem 0 0 0', lineHeight: 1.4 }}>
                    Manage your uploaded knowledge base.
                </p>
            </div>

            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {!hasDocuments ? (
                    <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '2rem 1rem',
                        textAlign: 'center',
                        color: 'var(--text-tertiary)',
                        backgroundColor: 'rgba(255,255,255,0.02)',
                        borderRadius: '16px',
                        border: '1px dashed var(--glass-border)',
                        gap: '1rem'
                    }}>
                        <ShieldAlert size={32} opacity={0.5} />
                        <span style={{ fontSize: '0.9rem' }}>No documents uploaded yet. Upload a file to begin.</span>
                    </div>
                ) : (
                    documents.map((doc, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.1 }}
                            style={{
                                display: 'flex',
                                alignItems: 'flex-start',
                                gap: '0.75rem',
                                padding: '1rem',
                                background: 'rgba(255,255,255,0.03)',
                                borderRadius: '12px',
                                border: '1px solid var(--glass-border)',
                                transition: 'all 0.2s ease',
                            }}
                            onMouseOver={(e) => {
                                e.currentTarget.style.background = 'rgba(255,255,255,0.06)';
                                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)';
                            }}
                            onMouseOut={(e) => {
                                e.currentTarget.style.background = 'rgba(255,255,255,0.03)';
                                e.currentTarget.style.borderColor = 'var(--glass-border)';
                            }}
                        >
                            <CheckCircle2 size={16} color="var(--siri-cyan)" style={{ marginTop: '0.2rem', minWidth: '16px' }} />
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', overflow: 'hidden' }}>
                                <span style={{
                                    fontWeight: 500,
                                    fontSize: '0.9rem',
                                    whiteSpace: 'nowrap',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    color: 'var(--text-primary)'
                                }}>
                                    {doc.fileName}
                                </span>
                                <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
                                    Added at {doc.uploadTime}
                                </span>
                            </div>
                        </motion.div>
                    ))
                )}
            </div>

            {hasDocuments && (
                <button
                    onClick={onClearDocs}
                    disabled={isClearing}
                    style={{
                        padding: '1rem',
                        background: 'rgba(255, 50, 50, 0.1)',
                        color: '#ff6b6b',
                        border: '1px solid rgba(255, 50, 50, 0.2)',
                        borderRadius: '12px',
                        cursor: isClearing ? 'not-allowed' : 'pointer',
                        fontWeight: 600,
                        fontSize: '0.9rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.5rem',
                        transition: 'all 0.3s ease',
                        marginTop: 'auto'
                    }}
                    onMouseOver={(e) => {
                        if (!isClearing) {
                            e.currentTarget.style.background = 'rgba(255, 50, 50, 0.2)';
                            e.currentTarget.style.boxShadow = '0 0 20px rgba(255, 50, 50, 0.2)';
                        }
                    }}
                    onMouseOut={(e) => {
                        if (!isClearing) {
                            e.currentTarget.style.background = 'rgba(255, 50, 50, 0.1)';
                            e.currentTarget.style.boxShadow = 'none';
                        }
                    }}
                >
                    <Trash2 size={18} className={isClearing ? 'animate-bounce' : ''} />
                    {isClearing ? 'Clearing...' : 'Clear Documents'}
                </button>
            )}
        </motion.div>
    );
}
