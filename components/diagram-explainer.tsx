'use client'

import { useRef, useState } from 'react'
import { Loader2, BookOpen, Upload, ChevronDown, ChevronUp } from 'lucide-react'
import { toast } from 'sonner'
import { explainDiagram } from '@/services/api'
import ReactMarkdown from 'react-markdown'

interface DiagramExplainerProps {
  topicId: string
}

export function DiagramExplainer({ topicId }: DiagramExplainerProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [loading, setLoading] = useState(false)
  const [imageUrl, setImageUrl] = useState('')
  const [explanation, setExplanation] = useState('')
  const [dragActive, setDragActive] = useState(false)
  const [expanded, setExpanded] = useState(true)

  const handleUpload = async (file: File) => {
    // Validate image
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file')
      return
    }

    setLoading(true)
    setExplanation('')
    setImageUrl('')

    try {
      const result = await explainDiagram(topicId, file)
      setExplanation(result.explanation)
      setImageUrl(result.imageUrl)
      toast.success('Diagram explained!', { icon: '🎓' })
    } catch (err: any) {
      if (err.message?.includes('429')) {
        toast.warning('Rate limit reached. Try again in 60s', { icon: '⚠️' })
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
      {!explanation && (
        <div
          className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all
            ${dragActive
              ? 'border-primary bg-primary/10'
              : 'border-border hover:border-primary hover:bg-card'
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
            <div className="p-3 bg-primary/10 rounded-full">
              {loading
                ? <Loader2 className="w-6 h-6 text-primary animate-spin" />
                : <Upload className="w-6 h-6 text-primary" />
              }
            </div>
            {loading ? (
              <div>
                <p className="text-sm font-medium text-foreground">
                  Analyzing diagram...
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  AI is generating your walkthrough
                </p>
              </div>
            ) : (
              <div>
                <p className="text-sm font-medium text-foreground">
                  Upload a diagram, flowchart, or chart
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  AI will generate a full step-by-step explanation
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Result */}
      {explanation && (
        <div className="glass-card rounded-xl overflow-hidden">

          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-border">
            <div className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-primary" />
              <h3 className="font-serif text-lg text-primary">
                Diagram Walkthrough
              </h3>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setExplanation('')
                  setImageUrl('')
                }}
                className="text-xs text-muted-foreground hover:text-foreground px-3 py-1 rounded-lg hover:bg-card transition-colors"
              >
                Upload new
              </button>
              <button
                onClick={() => setExpanded(!expanded)}
                className="p-1 rounded-lg hover:bg-card transition-colors"
              >
                {expanded
                  ? <ChevronUp className="w-4 h-4 text-muted-foreground" />
                  : <ChevronDown className="w-4 h-4 text-muted-foreground" />
                }
              </button>
            </div>
          </div>

          {expanded && (
            <div className="p-6">
              {/* Image preview */}
              {imageUrl && (
                <img
                  src={imageUrl}
                  alt="Uploaded diagram"
                  className="w-full max-h-64 object-contain rounded-lg mb-6 border border-border"
                />
              )}

              {/* Explanation — rendered as markdown */}
              <div className="prose prose-sm max-w-none
                prose-headings:font-serif prose-headings:text-foreground
                prose-p:text-foreground/90 prose-p:leading-relaxed
                prose-li:text-foreground/90
                prose-strong:text-primary
                prose-h2:text-lg prose-h2:mt-6 prose-h2:mb-3
                prose-ul:space-y-1 prose-ol:space-y-2
              ">
                <ReactMarkdown>{explanation}</ReactMarkdown>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}