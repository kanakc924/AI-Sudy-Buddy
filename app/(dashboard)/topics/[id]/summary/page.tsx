'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Play, Sparkles } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import Link from 'next/link'

export default function SummaryPage() {
  const router = useRouter()
  const params = useParams()
  const topicId = params.id as string
  const [summary, setSummary] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Hide sidebar for distraction-free reading by manipulating body class (optional, or just absolute overlay)
    // Actually, following the spec: "override layout, distraction-free reading only"
    // We will just make this container cover the dashboard layout or use a layout group.
    // For simplicity without changing Next.js layout structures, we'll force full screen style.
    
    const fetchSummary = async () => {
      try {
        const res = await fetch(`/api/topics/${topicId}`)
        const json = await res.json()
        setSummary(json.data.summary || '')
      } catch (err) {
        toast.error('Failed to load summary')
      } finally {
        setLoading(false)
      }
    }
    fetchSummary()
  }, [topicId])

  const wordCount = summary ? summary.split(/\s+/).length : 0

  return (
    <div className="absolute inset-0 z-50 bg-background overflow-y-auto">
      <div className="max-w-[680px] mx-auto px-4 py-8 lg:py-12">
        <div className="flex items-center gap-4 mb-12">
          <Button variant="ghost" size="icon" onClick={() => router.push(`/topics/${topicId}`)} className="rounded-full bg-card hover:bg-card/80 border border-border">
            <ArrowLeft className="w-5 h-5 text-muted-foreground" />
          </Button>
          <span className="text-sm font-medium text-muted-foreground">Back to Topic</span>
        </div>

        {loading ? (
          <div className="animate-pulse space-y-6">
            <div className="h-10 w-3/4 bg-card rounded-lg" />
            <div className="h-4 w-1/4 bg-card rounded-md" />
            <div className="space-y-3 pt-8">
              <div className="h-4 w-full bg-card rounded-md" />
              <div className="h-4 w-[90%] bg-card rounded-md" />
              <div className="h-4 w-[95%] bg-card rounded-md" />
            </div>
          </div>
        ) : !summary ? (
          <div className="text-center py-24">
            <div className="bg-card w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
              <Sparkles className="w-8 h-8 text-muted-foreground" />
            </div>
            <h2 className="font-serif text-2xl mb-2">No summary generated yet</h2>
            <p className="text-muted-foreground mb-8">Go back to the topic and generate one from your notes.</p>
            <Button onClick={() => router.push(`/topics/${topicId}`)} className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl">
              Back to Generation
            </Button>
          </div>
        ) : (
          <article className="animate-in fade-in duration-500 fill-mode-forwards">
            <h1 className="font-serif text-3xl md:text-4xl lg:text-5xl text-foreground font-bold leading-tight mb-4">
              Topic Summary
            </h1>
            <p className="text-muted-foreground mb-12 flex items-center gap-2 text-sm font-medium tracking-wide">
              {wordCount} WORDS
            </p>

            <div className="prose prose-invert prose-lg max-w-none">
              <ReactMarkdown
                components={{
                  h1: ({ children }) => <h1 className="font-serif text-2xl text-foreground mt-10 mb-5 font-bold">{children}</h1>,
                  h2: ({ children }) => <h2 className="font-serif text-xl text-foreground mt-8 mb-4 font-bold border-b border-border/50 pb-2">{children}</h2>,
                  h3: ({ children }) => <h3 className="text-lg text-primary mt-6 mb-3 font-semibold">{children}</h3>,
                  p: ({ children }) => <p className="text-foreground/90 leading-[1.8] mb-6 whitespace-pre-wrap">{children}</p>,
                  strong: ({ children }) => <strong className="text-primary font-semibold">{children}</strong>,
                  ul: ({ children }) => <ul className="list-disc pl-6 mb-6 space-y-2 text-foreground/90 leading-[1.8]">{children}</ul>,
                  ol: ({ children }) => <ol className="list-decimal pl-6 mb-6 space-y-2 text-foreground/90 leading-[1.8]">{children}</ol>,
                  li: ({ children }) => <li className="">{children}</li>,
                  blockquote: ({ children }) => <blockquote className="border-l-4 border-primary/50 pl-4 py-1 bg-primary/5 rounded-r-lg mb-6 italic text-foreground/80">{children}</blockquote>
                }}
              >
                {summary}
              </ReactMarkdown>
            </div>

            <div className="mt-16 pt-8 border-t border-border/50 flex flex-col sm:flex-row gap-4 justify-between items-center">
              <Button variant="ghost" onClick={() => router.push(`/topics/${topicId}`)} className="h-12 px-6 rounded-xl hover:bg-card w-full sm:w-auto">
                <ArrowLeft className="w-4 h-4 mr-2" /> Back to Topic
              </Button>
              <div className="flex w-full sm:w-auto gap-4">
                <Button variant="outline" onClick={() => router.push(`/topics/${topicId}/quiz`)} className="h-12 px-6 rounded-xl border-border bg-card/50 w-full sm:w-auto">
                  <Play className="w-4 h-4 mr-2" /> Take Quiz
                </Button>
                <Button onClick={() => router.push(`/topics/${topicId}/flashcards`)} className="h-12 px-6 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20 w-full sm:w-auto">
                  <Sparkles className="w-4 h-4 mr-2" /> Flashcards
                </Button>
              </div>
            </div>
          </article>
        )}
      </div>
    </div>
  )
}
