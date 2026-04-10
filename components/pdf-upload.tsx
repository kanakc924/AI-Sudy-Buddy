'use client'

import { useRef, useState } from 'react'
import { FileText, UploadCloud, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { uploadDocument } from '@/services/api'

interface PdfUploadProps {
  topicId: string
  onExtracted: (text: string, updatedTopic?: any) => void
}

export function PdfUpload({ topicId, onExtracted }: PdfUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [dragActive, setDragActive] = useState(false)
  const [loading, setLoading] = useState(false)
  const [fileName, setFileName] = useState('')

  const handleUpload = async (file: File) => {
    const isPDF = file.type === 'application/pdf'
    const isTxt = file.type === 'text/plain'
    if (!isPDF && !isTxt) {
      toast.error('Only PDF and TXT files are supported')
      return
    }

    // Validate file size (10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('File size exceeds 10MB limit')
      return
    }

    setFileName(file.name)
    setLoading(true)

    try {
      const data = await uploadDocument(topicId, file)

      if (!data.extractedText) {
        throw new Error('No text could be extracted')
      }

      onExtracted(data.extractedText, data.data)
      toast.success(`Extracted text from ${file.name}`)
    } catch (err: any) {
      if (err.code === 'AI_RATE_LIMITED' || err.status === 429) {
        toast.warning('The AI is currently busy. Please wait a moment and try again.', { icon: '⏳' })
      } else {
        toast.error(err.message || 'Failed to process file')
      }
      setFileName('')
    } finally {
      setLoading(false)
    }
  }

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') setDragActive(true)
    else if (e.type === 'dragleave') setDragActive(false)
  }

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    if (e.dataTransfer.files?.[0]) await handleUpload(e.dataTransfer.files[0])
  }

  const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) await handleUpload(e.target.files[0])
  }

  return (
    <div
      className={`relative w-full p-8 min-h-[220px] flex flex-col items-center justify-center border-2 border-dashed rounded-xl text-center transition-all duration-200 cursor-pointer
        ${dragActive ? 'border-primary bg-primary/10' : 'border-border hover:border-primary hover:bg-primary/8 hover:shadow-[0_0_20px_rgba(124,92,252,0.15)]'}
        ${loading ? 'opacity-60 pointer-events-none' : ''}
      `}
      onDragEnter={handleDrag}
      onDragLeave={handleDrag}
      onDragOver={handleDrag}
      onDrop={handleDrop}
      onClick={() => fileInputRef.current?.click()}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept="application/pdf,text/plain"
        onChange={handleChange}
        className="hidden"
      />

      <div className="flex flex-col items-center gap-3">
        <div className="p-4 bg-primary/10 rounded-full">
          {loading
            ? <Loader2 className="w-6 h-6 text-primary animate-spin" />
            : <FileText className="w-6 h-6 text-primary" />
          }
        </div>

        {loading ? (
          <div>
            <p className="text-sm font-medium text-foreground">
              Extracting text from {fileName}...
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              This may take a moment
            </p>
          </div>
        ) : fileName ? (
          <div>
            <p className="text-sm font-medium text-foreground">{fileName}</p>
            <p className="text-xs text-muted-foreground mt-1">
              Click to upload a different file
            </p>
          </div>
        ) : (
          <div>
            <p className="text-sm font-medium text-foreground">
              Click or drag PDF / TXT to upload
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Text will be extracted and shown for review
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
