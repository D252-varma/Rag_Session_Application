import { useState, useRef, type ChangeEvent, type FormEvent } from 'react'
import { buildSessionHeaders, addActiveDocument } from './session'
import { motion, AnimatePresence } from 'framer-motion'
import { UploadCloud, FileText, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react'

type UploadStatus = 'idle' | 'uploading' | 'success' | 'error'

interface UploadResult {
    fileName: string
    fileType: string
    charCount: number
    wordCount: number
    chunkCount: number
}

interface UploadPanelProps {
    sessionId: string
    chunkSize: number
    chunkOverlap: number
    onUploadSuccess?: () => void
}

export function UploadPanel({ sessionId, chunkSize, chunkOverlap, onUploadSuccess }: UploadPanelProps) {
    const [file, setFile] = useState<File | null>(null)
    const [status, setStatus] = useState<UploadStatus>('idle')
    const [error, setError] = useState<string | null>(null)
    const [result, setResult] = useState<UploadResult | null>(null)
    const [isDragging, setIsDragging] = useState(false)

    const fileInputRef = useRef<HTMLInputElement>(null)

    const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
        const nextFile = event.target.files?.[0] ?? null
        setFile(nextFile)
        setResult(null)
        setError(null)
    }

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault()
        setIsDragging(true)
    }

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault()
        setIsDragging(false)
    }

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault()
        setIsDragging(false)
        const nextFile = e.dataTransfer.files?.[0] ?? null
        if (nextFile && (nextFile.type === 'application/pdf' || nextFile.type === 'text/plain' || nextFile.name.endsWith('.pdf') || nextFile.name.endsWith('.txt'))) {
            setFile(nextFile)
            setResult(null)
            setError(null)
        } else {
            setError('Please choose a .pdf or .txt file.')
        }
    }

    const handleSubmit = async (event: FormEvent) => {
        event.preventDefault()

        if (!file) {
            setError('Please choose a .pdf or .txt file.')
            return
        }

        const formData = new FormData()
        formData.append('file', file)
        formData.append('chunkSize', String(chunkSize))
        formData.append('chunkOverlap', String(chunkOverlap))

        setStatus('uploading')
        setError(null)
        setResult(null)

        try {
            const response = await fetch('http://localhost:4000/upload', {
                method: 'POST',
                headers: {
                    ...buildSessionHeaders(sessionId),
                },
                body: formData,
            })

            if (!response.ok) {
                const data = await response.json().catch(() => ({}))
                const message = (data && (data.error as string)) || 'Upload failed'
                setStatus('error')
                setError(message)
                return
            }

            const data = (await response.json()) as UploadResult
            addActiveDocument(sessionId, data.fileName)
            setResult(data)
            setStatus('success')
            if (onUploadSuccess) onUploadSuccess()
        } catch {
            setStatus('error')
            setError('Network error while uploading file.')
        }
    }

    return (
        <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="premium-glass-panel"
            style={{
                padding: '1.5rem',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '1rem',
                width: '100%',
                maxWidth: '450px',
            }}
        >
            <div style={{ textAlign: 'center' }}>
                <h2 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.2rem' }}>Knowledge Base</h2>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)' }}>Upload documents to give context.</p>
            </div>

            <form
                onSubmit={handleSubmit}
                style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'center' }}
            >
                <input
                    type="file"
                    accept=".pdf,.txt"
                    onChange={handleFileChange}
                    ref={fileInputRef}
                    style={{ display: 'none' }}
                />

                <motion.div
                    onClick={() => fileInputRef.current?.click()}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    animate={{
                        borderColor: isDragging ? 'var(--siri-cyan)' : 'var(--glass-border)',
                        backgroundColor: isDragging ? 'rgba(34, 211, 238, 0.05)' : 'rgba(255, 255, 255, 0.02)',
                        scale: isDragging ? 1.02 : 1,
                        boxShadow: isDragging ? '0 0 20px rgba(34, 211, 238, 0.1)' : 'none'
                    }}
                    whileHover={{ scale: 1.01, backgroundColor: 'var(--glass-bg-hover)', borderColor: 'var(--glass-border-highlight)' }}
                    style={{
                        width: '100%',
                        height: '110px',
                        border: '1.5px dashed var(--glass-border)',
                        borderRadius: '16px',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center',
                        alignItems: 'center',
                        cursor: 'pointer',
                        transition: 'all 0.3s ease'
                    }}
                >
                    {file ? (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.4rem' }}>
                            <FileText size={30} color="var(--siri-blue)" />
                            <span style={{ fontSize: '0.9rem', color: 'var(--text-primary)', fontWeight: 500 }}>{file.name}</span>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>{(file.size / 1024).toFixed(1)} KB</span>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)' }}>
                            <UploadCloud size={32} strokeWidth={1.5} />
                            <div style={{ textAlign: 'center' }}>
                                <p style={{ fontWeight: 500, fontSize: '0.9rem', color: 'var(--text-primary)', marginBottom: '0.2rem' }}>Click or drag file to upload</p>
                                <p style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>Supports .pdf and .txt</p>
                            </div>
                        </div>
                    )}
                </motion.div>

                <AnimatePresence mode="popLayout">
                    {file && (
                        <motion.button
                            type="submit"
                            disabled={status === 'uploading'}
                            initial={{ opacity: 0, y: -10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -10, scale: 0.95 }}
                            style={{
                                width: '100%',
                                padding: '0.875rem',
                                borderRadius: '14px',
                                border: '1px solid rgba(255,255,255,0.1)',
                                background: status === 'uploading'
                                    ? 'rgba(255,255,255,0.05)'
                                    : 'linear-gradient(135deg, var(--siri-blue) 0%, #3b82f6 100%)',
                                color: '#fff',
                                fontSize: '0.95rem',
                                fontWeight: 500,
                                cursor: status === 'uploading' ? 'not-allowed' : 'pointer',
                                display: 'flex',
                                justifyContent: 'center',
                                alignItems: 'center',
                                gap: '0.5rem',
                                boxShadow: status !== 'uploading' ? '0 8px 25px rgba(10, 132, 255, 0.4)' : 'none',
                                textShadow: '0 1px 2px rgba(0,0,0,0.2)'
                            }}
                            whileHover={status !== 'uploading' ? { filter: 'brightness(1.1)', y: -2 } : {}}
                            whileTap={status !== 'uploading' ? { scale: 0.98 } : {}}
                        >
                            {status === 'uploading' ? (
                                <>
                                    <Loader2 size={18} className="animate-spin" />
                                    Processing document...
                                </>
                            ) : (
                                'Transcribe & Embed'
                            )}
                        </motion.button>
                    )}
                </AnimatePresence>
            </form>

            {/* Status Region */}
            <AnimatePresence>
                {(error || result) && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        style={{ width: '100%', overflow: 'hidden' }}
                    >
                        {error && (
                            <div style={{
                                padding: '1rem',
                                borderRadius: '12px',
                                background: 'rgba(255, 50, 50, 0.1)',
                                border: '1px solid rgba(255, 50, 50, 0.2)',
                                color: '#ff6b6b',
                                display: 'flex',
                                alignItems: 'flex-start',
                                gap: '0.75rem',
                                fontSize: '0.9rem'
                            }}>
                                <AlertCircle size={18} />
                                <span>{error}</span>
                            </div>
                        )}

                        {result && (
                            <div style={{
                                padding: '1rem',
                                borderRadius: '14px',
                                background: 'rgba(50, 215, 75, 0.05)',
                                border: '1px solid rgba(50, 215, 75, 0.2)',
                                color: 'var(--siri-cyan)',
                                boxShadow: '0 4px 20px rgba(50, 215, 75, 0.1)',
                                marginTop: '0.5rem'
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.8rem', fontWeight: 500, fontSize: '0.9rem' }}>
                                    <CheckCircle2 size={16} />
                                    Document added to knowledge base.
                                </div>
                                <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                                    <div style={{
                                        background: 'rgba(255,255,255,0.03)',
                                        padding: '0.4rem 0.8rem',
                                        borderRadius: '8px',
                                        fontSize: '0.8rem',
                                        color: 'var(--text-secondary)',
                                        border: '1px solid var(--glass-border)'
                                    }}>
                                        Chunks: <strong style={{ color: 'var(--text-primary)' }}>{result.chunkCount}</strong>
                                    </div>
                                    <div style={{
                                        background: 'rgba(255,255,255,0.03)',
                                        padding: '0.4rem 0.8rem',
                                        borderRadius: '8px',
                                        fontSize: '0.8rem',
                                        color: 'var(--text-secondary)',
                                        border: '1px solid var(--glass-border)'
                                    }}>
                                        Words: <strong style={{ color: 'var(--text-primary)' }}>{result.wordCount}</strong>
                                    </div>
                                </div>
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.section>
    )
}
