'use client'

import { useRef, useState } from 'react'
import { Loader2, BookOpen, Upload, ChevronDown, ChevronUp } from 'lucide-react'
import { toast } from 'sonner'
import { explainDiagram } from '@/services/api'
import ReactMarkdown from 'react-markdown'

interface DiagramExplainerProps {
  topicId: string
  onExtracted?: (explanation: string, updatedTopic?: any) => void
}

export function DiagramExplainer({ topicId, onExtracted }: DiagramExplainerProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [loading, setLoading] = useState(false)
  const [dragActive, setDragActive] = useState(false)

  const handleUpload = async (file: File) => {
    // Validate image
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file')
      return
    }

    setLoading(true)

    try {
      const result = await explainDiagram(topicId, file)
      if (onExtracted) {
        onExtracted(result.extractedText, (result as any).data)
      }
      toast.success('Diagram explained!', { icon: '🎓' })
    } catch (err: any) {
      if (err.code === 'AI_RATE_LIMITED' || err.status === 429) {
        toast.warning('The AI is currently busy. Please wait a moment and try again.', { icon: '⏳' })
      } else {
        toast.error(err.message || 'Failed to explain diagram')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    setDragActive(false)
    const file = e.dataTransfer.files?.[0]
    if (file) await handleUpload(file)
  }

  return (
    <div className="space-y-4">
      {/* Upload Zone */}
      <div
        className={`border-2 border-dashed rounded-xl p-8 min-h-[220px] flex flex-col items-center justify-center text-center transition-all duration-200 cursor-pointer 
          ${dragActive
            ? 'border-primary bg-primary/10'
            : 'border-border hover:border-primary hover:bg-primary/8 hover:shadow-[0_0_20px_rgba(124,92,252,0.15)]'
          }
          ${loading ? 'opacity-60 pointer-events-none' : ''}
        `}
        onClick={() => fileInputRef.current?.click()}
        onDragOver={e => { e.preventDefault(); setDragActive(true) }}
        onDragLeave={() => setDragActive(false)}
        onDrop={handleDrop}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={e => {
            const file = e.target.files?.[0]
            if (file) handleUpload(file)
          }}
        />
        <div className="flex flex-col items-center gap-3">
          <div className="p-4 bg-primary/10 rounded-full">
            {loading
              ? <Loader2 className="w-6 h-6 text-primary animate-spin" />
              : <Upload className="w-6 h-6 text-primary" />
            }
          </div>
          {loading ? (
            <div>
              <p className="text-sm font-semibold text-foreground">
                Analyzing diagram...
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                AI is generating your walkthrough
              </p>
            </div>
          ) : (
            <div>
              <p className="text-sm font-semibold text-foreground">
                Upload a diagram, flowchart, or chart
              </p>
              <p className="text-xs text-muted-foreground mt-1 px-2">
                AI will generate a full step-by-step explanation
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}