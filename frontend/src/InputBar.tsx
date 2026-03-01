import { motion } from 'framer-motion'
import { ArrowUp } from 'lucide-react'
import type { FormEvent } from 'react'

interface InputBarProps {
    query: string
    setQuery: (q: string) => void
    disabled: boolean
    onSubmit: (e: FormEvent) => void
}

export function InputBar({ query, setQuery, disabled, onSubmit }: InputBarProps) {
    return (
        <motion.form
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            onSubmit={onSubmit}
            style={{
                position: 'fixed',
                bottom: '1.5rem',
                left: '50%',
                transform: 'translateX(-50%)',
                width: 'min(calc(100vw - 2rem), 800px)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '0.6rem 0.8rem 0.6rem 1.5rem',
                background: 'rgba(255, 255, 255, 0.08)',
                backdropFilter: 'var(--glass-blur)',
                WebkitBackdropFilter: 'var(--glass-blur)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                borderRadius: '99px',
                boxShadow: '0 10px 40px rgba(0,0,0,0.4)',
                zIndex: 999,
                transition: 'all 0.3s ease'
            }}
            className="input-glow-focus"
        >
            <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Ask anything about the documents you uploaded..."
                style={{
                    flex: 1,
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--text-primary)',
                    fontSize: '1rem',
                    outline: 'none',
                    padding: '0.5rem 0',
                }}
                disabled={disabled}
            />

            <motion.button
                type="submit"
                disabled={disabled || !query.trim()}
                whileHover={!(disabled || !query.trim()) ? { scale: 1.05 } : {}}
                whileTap={!(disabled || !query.trim()) ? { scale: 0.95 } : {}}
                style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: '50%',
                    border: 'none',
                    background: (disabled || !query.trim()) ? 'rgba(255,255,255,0.1)' : 'linear-gradient(135deg, var(--siri-blue) 0%, var(--siri-purple) 100%)',
                    color: (disabled || !query.trim()) ? 'rgba(255, 255, 255, 0.4)' : '#ffffff',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    cursor: (disabled || !query.trim()) ? 'not-allowed' : 'pointer',
                    transition: 'color 0.2s ease, transform 0.2s ease',
                    padding: 0
                }}
            >
                <ArrowUp strokeWidth={2.5} size={20} />
            </motion.button>
        </motion.form>
    )
}
