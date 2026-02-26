import { useState, ChangeEvent, FormEvent } from 'react'
import { buildSessionHeaders } from './session'

type UploadStatus = 'idle' | 'uploading' | 'success' | 'error'

interface UploadResult {
  fileName: string
  fileType: string
  charCount: number
  wordCount: number
  chunkCount: number
}

interface FileUploadProps {
  sessionId: string
}

export function FileUpload({ sessionId }: FileUploadProps) {
  const [file, setFile] = useState<File | null>(null)
  const [status, setStatus] = useState<UploadStatus>('idle')
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<UploadResult | null>(null)

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const nextFile = event.target.files?.[0] ?? null
    setFile(nextFile)
    setResult(null)
    setError(null)
  }

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()

    if (!file) {
      setError('Please choose a .pdf or .txt file.')
      return
    }

    const formData = new FormData()
    formData.append('file', file)

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
      setResult(data)
      setStatus('success')
    } catch {
      setStatus('error')
      setError('Network error while uploading file.')
    }
  }

  return (
    <section>
      <h2>Upload document</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="file"
          accept=".pdf,.txt"
          onChange={handleFileChange}
        />
        <button type="submit" disabled={status === 'uploading'}>
          {status === 'uploading' ? 'Uploading…' : 'Upload'}
        </button>
      </form>

      <div>
        <p>
          <strong>Upload status:</strong> {status}
        </p>
        {error && <p>{error}</p>}
        {result && (
          <div>
            <p>
              <strong>File:</strong> {result.fileName} ({result.fileType})
            </p>
            <p>
              <strong>Character count:</strong> {result.charCount}
            </p>
            <p>
              <strong>Word count:</strong> {result.wordCount}
            </p>
            <p>
              <strong>Number of chunks created:</strong> {result.chunkCount} (will be populated in
              module 3)
            </p>
          </div>
        )}
      </div>
    </section>
  )
}

