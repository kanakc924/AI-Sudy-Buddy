'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { 
  ArrowLeft, 
  Sparkles, 
  Pencil, 
  RefreshCw, 
  Download, 
  Save, 
  X, 
  Bold, 
  Italic, 
  Highlighter,
  Loader2,
  Brain,
  Lightbulb,
  ChevronRight
} from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkMath from 'remark-math'
import remarkGfm from 'remark-gfm'
import rehypeKatex from 'rehype-katex'
import rehypeRaw from 'rehype-raw'
import 'katex/dist/katex.min.css'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { useReactToPrint } from 'react-to-print'
import { updateTopic, generateSummary } from '@/services/api'
import { cn } from '@/lib/utils'
import { SummaryOutput } from '@/schemas/summary.schema'
import { sanitizeMermaid } from '@/lib/sanitizeMermaid'

import { 
  IconButton, 
  PrimaryButton 
} from '@/components/common'

/**
 * Robust Mermaid syntax cleaner.
 */
function cleanMermaidCode(code: string): string {
  if (!code) return "";
  
  let cleaned = code
    .replace(/^```mermaid\s*/i, "")
    .replace(/```\s*$/g, "")
    .replace(/```/g, "");
    
  cleaned = cleaned.replace(/^\s*\.\.\.\s*$/gm, "");
  cleaned = cleaned.replace(/\.\.\.\s*$/g, "");
  
  const keywords = ['graph', 'flowchart', 'sequenceDiagram', 'classDiagram', 'stateDiagram', 'erDiagram', 'journey', 'gantt', 'pie', 'quadrantChart', 'requirementDiagram', 'gitGraph', 'C4Context'];
  let firstKeywordIndex = -1;
  
  for (const kw of keywords) {
    const idx = cleaned.toLowerCase().indexOf(kw.toLowerCase());
    if (idx !== -1 && (firstKeywordIndex === -1 || idx < firstKeywordIndex)) {
      const charBefore = idx > 0 ? cleaned[idx - 1] : ' ';
      if (/\s/.test(charBefore)) {
        firstKeywordIndex = idx;
      }
    }
  }
  
  if (firstKeywordIndex !== -1) {
    cleaned = cleaned.substring(firstKeywordIndex);
  }

  const junkMarkers = ["Note:", "Notes:", "Explanation:", "This diagram", "(Note", "```"];
  for (const marker of junkMarkers) {
    const junkIndex = cleaned.indexOf(marker);
    if (junkIndex !== -1) {
      cleaned = cleaned.substring(0, junkIndex);
    }
  }

  cleaned = cleaned.replace(/\[([^"\]\[]+)\]/g, (match, label) => {
    if (label.startsWith('"')) return match;
    return `["${label}"]`;
  });

  return cleaned.trim();
}

/**
 * Transforms structured JSON summary into a high-fidelity Markdown document
 */
function convertToMarkdown(data: SummaryOutput): string {
  let md = `# Academic Deep Dive: Topic Synthesis\n\n`;
  md += `## 01. EXECUTIVE OVERVIEW\n\n${data.executiveOverview}\n\n`;
  md += `## 02. ARCHITECTURE & KEY CONCEPTS\n\n`;
  md += `| Concept | Characteristics | Use Case |\n`;
  md += `| :--- | :--- | :--- |\n`;
  data.keyConcepts.forEach(item => {
    md += `| ${item.concept} | ${item.characteristics} | ${item.useCase} |\n`;
  });
  md += `\n`;
  md += `## 03. DEEP DIVE\n\n${data.deepDive}\n\n`;
  if (data.mathematicalFoundations && data.mathematicalFoundations.length > 0) {
    md += `## 04. MATHEMATICAL FOUNDATIONS\n\n`;
    data.mathematicalFoundations.forEach(math => {
      const formula = math.formula.startsWith('$') ? math.formula : `$$${math.formula}$$`;
      md += `${formula}\n\n`;
      md += `**Variables:** ${math.variables}\n\n`;
      md += `> *"${math.intuition}"*\n\n`;
    });
  }
  md += `## 05. VISUAL PROCESS FLOW\n\n\`\`\`mermaid\n${cleanMermaidCode(data.visualProcessFlow)}\n\`\`\`\n\n`;
  md += `## 06. COMMON PITFALLS\n\n`;
  data.commonPitfalls.forEach(p => {
    md += `- ${p}\n`;
  });
  md += `\n`;
  md += `## 07. DEFINITIONS\n\n`;
  data.definitions.forEach(d => {
    md += `**${d.term}**: ${d.meaning}\n\n`;
  });
  md += `## 08. DID YOU KNOW?\n\n`;
  data.didYouKnow.forEach(f => {
    md += `- *${f}*\n`;
  });
  return md;
}

function flattenText(children: any): string {
  return Array.isArray(children)
    ? children.map(child => (typeof child === 'string' ? child : flattenText(child.props?.children))).join('')
    : typeof children === 'string'
    ? children
    : children?.props?.children
    ? flattenText(children.props.children)
    : '';
}

function MermaidDiagram({ code }: { code: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const [error, setError] = useState(false)

  useEffect(() => {
    const renderDiagram = async () => {
      if (!ref.current) return
      setError(false)
      try {
        const mermaid = (await import('mermaid')).default
        mermaid.initialize({
          startOnLoad: false,
          theme: 'base',
          themeVariables: {
            fontSize: '14px',
            fontFamily: 'Inter, sans-serif',
            primaryColor: '#ffffff',
            nodeBorder: '#4338ca',
          },
          flowchart: {
            padding: 30,
            nodeSpacing: 60,
            rankSpacing: 60,
            useMaxWidth: false,
            htmlLabels: false,
          },
        })
        const sanitized = sanitizeMermaid(code)
        const id = `mermaid-${Math.random().toString(36).substr(2, 9)}`
        const { svg } = await mermaid.render(id, sanitized)
        if (ref.current) ref.current.innerHTML = svg
      } catch (err) {
        console.error('Mermaid render error:', err)
        setError(true)
      }
    }
    renderDiagram()
  }, [code])

  if (error) {
    return (
      <div className="my-6 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-center">
        <p className="text-sm text-amber-500 font-bold">⚠️ Diagram could not be rendered</p>
        <p className="text-xs text-amber-500/70 mt-1">The AI generated an invalid diagram structure.</p>
        <details className="mt-2 text-left">
          <summary className="text-xs text-muted-foreground cursor-pointer">Show raw code</summary>
          <pre className="text-xs text-muted-foreground mt-2 overflow-x-auto p-2 bg-card rounded">{code}</pre>
        </details>
      </div>
    )
  }
  return <div ref={ref} className="mermaid my-6 flex justify-center overflow-x-auto rounded-xl bg-card/50 p-4" />
}

function SectionHeading({ title, index }: { title: string, index: string }) {
  return (
    <div className="mt-12 mb-6 border-b border-border transition-colors pb-2">
      <h2 className="font-serif text-2xl font-black tracking-tight text-primary uppercase">
        {index && `${index}. `}{title}
      </h2>
    </div>
  );
}

export default function SummaryPage() {
  const router = useRouter()
  const params = useParams()
  const topicId = params.id as string
  
  const [data, setData] = useState<SummaryOutput | null>(null)
  const [markdownData, setMarkdownData] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [editableMarkdown, setEditableMarkdown] = useState("")
  const [isRegenerating, setIsRegenerating] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  
  const contentRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const outerContainerRef = useRef<HTMLDivElement>(null)
  const printRef = useRef<HTMLDivElement>(null)

  const handleExportPDF = useReactToPrint({
    contentRef: printRef,
    documentTitle: topicId ? `Summary_${topicId}` : 'Academic_Summary',
    pageStyle: `
      @page { size: auto; margin: 0mm; }
      body { padding: 1.5cm; background: white !important; }
      h2, .section-title {
        font-size: 18pt !important;
        font-weight: 800 !important;
        color: #1e1b4b !important;
        border-bottom: 2pt solid #e2e8f0 !important;
        padding-bottom: 5pt !important;
        margin-top: 20pt !important;
        margin-bottom: 10pt !important;
        display: block !important;
      }
      .mermaid svg { width: 100% !important; max-width: 100% !important; height: auto !important; }
    `,
    onAfterPrint: () => {
      setIsExporting(false);
      toast.success('Exported to PDF!');
    },
  });

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        const res = await fetch(`/api/topics/${topicId}`)
        if (!res.ok) throw new Error('Failed to fetch topic data')
        const json = await res.json()
        const rawSummary = json.data?.summary
        if (typeof rawSummary === 'string' && rawSummary.trim().startsWith('{')) {
          try {
             setData(JSON.parse(rawSummary))
             setMarkdownData(null)
          } catch {
             setMarkdownData(rawSummary)
             setData(null)
          }
        } else if (typeof rawSummary === 'object' && rawSummary !== null) {
          setData(rawSummary)
          setMarkdownData(null)
        } else if (typeof rawSummary === 'string' && rawSummary.length > 0) {
          setMarkdownData(rawSummary)
          setData(null)
        }
      } catch (err: any) {
        console.error('Fetch error:', err)
        toast.error('Failed to load summary')
      } finally {
        setLoading(false)
      }
    }
    fetchSummary()
  }, [topicId])

  const handleRegenerate = async () => {
    setIsRegenerating(true)
    try {
      const res = await generateSummary(topicId)
      setData(res.data.summary)
      setMarkdownData(null)
      toast.success('High-fidelity summary generated!')
    } catch (err: any) {
      toast.error(err.message || 'Generation failed')
    } finally {
      setIsRegenerating(false)
    }
  }

  const exportToPDF = () => {
    setIsExporting(true);
    handleExportPDF();
  }

  const renderPitfall = (text: string) => {
    if (text.includes('MISTAKE:') && text.includes('CORRECT:')) {
      const [mistakePart, correctPart] = text.split('CORRECT:');
      const mistake = mistakePart.replace('MISTAKE:', '').trim();
      const correct = correctPart.trim();
      return (
        <div className="space-y-3 w-full">
          <div className="flex items-start gap-2">
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/20 text-rose-500 mt-0.5 border border-rose-500/30">MISTAKE</span>
            <span className="text-sm text-foreground/70">{mistake}</span>
          </div>
          <div className="flex items-start gap-2 border-t border-border/30 pt-2">
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-500 mt-0.5 border border-emerald-500/30">CORRECT</span>
            <span className="text-sm text-foreground/90 font-medium">{correct}</span>
          </div>
        </div>
      );
    }
    return <p className="text-sm leading-relaxed text-foreground/80 font-medium">{text}</p>;
  }

  const toggleEdit = () => {
    if (!isEditing) {
      const initialText = data ? convertToMarkdown(data) : (markdownData || "");
      setEditableMarkdown(initialText);
    }
    setIsEditing(!isEditing);
  }

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updateTopic(topicId, { summary: editableMarkdown });
      setMarkdownData(editableMarkdown);
      setData(null);
      setIsEditing(false);
      toast.success('Summary updated!');
    } catch (err) {
      toast.error('Failed to save changes');
    } finally {
      setIsSaving(false);
    }
  }

  const insertText = (before: string, after: string = "") => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;
    const selectedText = text.substring(start, end);
    const newText = text.substring(0, start) + before + selectedText + after + text.substring(end);
    setEditableMarkdown(newText);
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + before.length, end + before.length);
    }, 0);
  }

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 bg-background flex flex-col items-center justify-center">
        <Loader2 className="w-10 h-10 text-primary animate-spin mb-4" />
        <p className="text-muted-foreground animate-pulse text-sm uppercase tracking-widest font-bold">Assembling Academic Deep Dive...</p>
      </div>
    )
  }

  return (
    <div ref={outerContainerRef} className="absolute inset-0 z-50 bg-background overflow-y-auto selection:bg-primary/30">
      {/* Sticky Premium Header */}
      <div className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border/50 px-4 md:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <IconButton 
            icon={isEditing ? X : ArrowLeft} 
            onClick={() => isEditing ? setIsEditing(false) : router.push(`/topics/${topicId}`)}
            className="bg-card border-border"
          />
          <div className="hidden sm:block">
            <h2 className="text-sm font-bold text-foreground flex items-center gap-2 uppercase tracking-wide">
              Master Summary
            </h2>
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">Academic Synthesis Mode</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {!isEditing ? (
            <>
              <IconButton icon={Pencil} onClick={toggleEdit} title="Edit Summary" />
              <IconButton 
                icon={RefreshCw} 
                onClick={handleRegenerate} 
                disabled={isRegenerating} 
                className={isRegenerating ? "animate-spin" : ""}
                title="Regenerate" 
              />
              <IconButton 
                icon={Download} 
                onClick={exportToPDF} 
                disabled={isExporting} 
                className={isExporting ? "text-blue-500" : ""}
                title="Export PDF" 
              />
            </>
          ) : (
            <PrimaryButton 
              onClick={handleSave} 
              disabled={isSaving} 
              icon={isSaving ? Loader2 : Save}
              className="h-10 px-6 rounded-xl"
            >
              {isSaving ? 'Saving...' : 'Save Changes'}
            </PrimaryButton>
          )}
        </div>
      </div>

      <div className="max-w-[800px] mx-auto px-4 py-8 min-h-screen">
        {isEditing ? (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="mb-6 flex items-center justify-between border-b border-border/50 pb-4">
              <h2 className="font-serif text-2xl font-bold">Edit Summary</h2>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => insertText("**", "**")} className="rounded-lg h-9 w-9 p-0 border-border" title="Bold"><Bold className="w-4 h-4" /></Button>
                <Button variant="outline" size="sm" onClick={() => insertText("*", "*")} className="rounded-lg h-9 w-9 p-0 border-border" title="Italic"><Italic className="w-4 h-4" /></Button>
                <Button variant="outline" size="sm" onClick={() => insertText("<mark>", "</mark>")} className="rounded-lg h-9 w-9 p-0 border-border" title="Highlight"><Highlighter className="w-4 h-4" /></Button>
              </div>
            </div>
            <textarea
              ref={textareaRef}
              value={editableMarkdown}
              onChange={(e) => setEditableMarkdown(e.target.value)}
              className="w-full min-h-[600px] bg-card border border-border rounded-2xl p-8 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 shadow-inner font-mono text-sm leading-relaxed resize-y"
              placeholder="Write your summary in markdown..."
            />
          </div>
        ) : !data && !markdownData ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="bg-primary/10 w-24 h-24 rounded-3xl flex items-center justify-center mb-8 border border-primary/20 shadow-xl shadow-primary/5">
              <Sparkles className="w-10 h-10 text-primary" />
            </div>
            <h2 className="font-serif text-3xl mb-4 font-black">Ready for the Synthesis?</h2>
            <p className="text-muted-foreground mb-10 max-w-md mx-auto leading-relaxed">Transform your materials into a structured, research-grade summary with visual processes and mathematical foundations.</p>
            <PrimaryButton 
              onClick={handleRegenerate} 
              disabled={isRegenerating}
              className="px-12 h-14 text-lg"
              icon={isRegenerating ? Loader2 : Brain}
            >
              Generate Academic Deep Dive
            </PrimaryButton>
          </div>
        ) : (
          <article ref={contentRef} className="animate-in fade-in duration-1000 fill-mode-forwards document-viewer">
            <div ref={printRef} id="summary-export-content" className="bg-background">
              {data ? (
                <div className="space-y-4">
                  <h1 className="font-serif text-4xl md:text-6xl text-foreground font-black leading-tight mb-16 tracking-tight">
                    Academic Deep Dive: <span className="text-primary italic">Topic Synthesis</span>
                  </h1>
                  
                  <SectionHeading title="Executive Overview" index="01" />
                  <div className="relative z-10">
                    <ReactMarkdown rehypePlugins={[rehypeRaw]} components={{
                      mark: ({ children }) => <mark className="bg-primary/20 text-primary underline decoration-primary/30 underline-offset-4 px-1 rounded-sm font-bold">{children}</mark>,
                      p: ({ children }) => <p className="text-xl md:text-2xl text-foreground/90 leading-relaxed font-medium tracking-tight mb-6">{children}</p>
                    }}>
                      {data.executiveOverview}
                    </ReactMarkdown>
                  </div>
                  
                  <SectionHeading title="Architecture & Key Concepts" index="02" />
                  <div className="overflow-x-auto mb-12 border border-border/50 rounded-2xl bg-card shadow-sm">
                    <table className="w-full text-sm border-collapse">
                      <thead>
                        <tr className="bg-muted/30 border-b border-border/50">
                          <th className="px-6 py-4 text-left font-bold text-primary uppercase text-[10px] tracking-widest">Concept</th>
                          <th className="px-6 py-4 text-left font-bold text-primary uppercase text-[10px] tracking-widest">Characteristics</th>
                          <th className="px-6 py-4 text-left font-bold text-primary uppercase text-[10px] tracking-widest">Use Case</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/30">
                        {data.keyConcepts.map((item, idx) => (
                          <tr key={idx} className="hover:bg-muted/10 transition-colors">
                            <td className="px-6 py-5 font-bold text-foreground">{item.concept}</td>
                            <td className="px-6 py-5 text-muted-foreground border-l border-border/10">{item.characteristics}</td>
                            <td className="px-6 py-5 text-foreground/80 font-medium border-l border-border/10 italic">{item.useCase}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <SectionHeading title="Deep Dive Analysis" index="03" />
                  <div className="bg-card border border-border/50 rounded-3xl p-8 mb-12 shadow-inner-sm prose prose-invert max-w-none text-foreground leading-relaxed">
                    <ReactMarkdown remarkPlugins={[remarkMath, remarkGfm]} rehypePlugins={[rehypeKatex, rehypeRaw]}>
                      {data.deepDive}
                    </ReactMarkdown>
                  </div>

                  {data.mathematicalFoundations && data.mathematicalFoundations.length > 0 && (
                    <>
                      <SectionHeading title="Mathematical Foundations" index="04" />
                      <div className="space-y-6 mb-12">
                        {data.mathematicalFoundations.map((math, idx) => (
                          <div key={idx} className="bg-card border border-border/60 rounded-3xl p-8 hover:border-primary/30 transition-all shadow-sm">
                            <div className="bg-muted/20 rounded-2xl p-10 mb-8 flex justify-center items-center text-3xl overflow-x-auto border border-border/30 shadow-inner">
                              <ReactMarkdown remarkPlugins={[remarkMath, remarkGfm]} rehypePlugins={[rehypeKatex, rehypeRaw]}>
                                {`$$${math.formula.replace(/\$/g, '').trim()}$$`}
                              </ReactMarkdown>
                            </div>
                            <div className="grid md:grid-cols-2 gap-10">
                              <div>
                                <span className="text-[10px] font-bold text-primary uppercase tracking-widest mb-3 block">Logical Variables</span>
                                <div className="text-sm text-muted-foreground leading-relaxed">
                                  <ReactMarkdown remarkPlugins={[remarkMath, remarkGfm]} rehypePlugins={[rehypeKatex, rehypeRaw]}>
                                    {math.variables}
                                  </ReactMarkdown>
                                </div>
                              </div>
                              <div className="border-l border-border/50 pl-10">
                                <span className="text-[10px] font-bold text-amber-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                                  <Lightbulb className="w-3 h-3" /> The Intuition
                                </span>
                                <p className="text-sm text-foreground/90 font-medium italic leading-relaxed">"{math.intuition}"</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </>
                  )}

                  <SectionHeading title="Visual Process Flow" index="05" />
                  <div className="mb-12">
                     <MermaidDiagram code={data.visualProcessFlow} />
                  </div>

                  <SectionHeading title="Common Pitfalls" index="06" />
                  <div className="grid sm:grid-cols-2 gap-6 mb-12">
                    {data.commonPitfalls.map((pitfall, idx) => (
                      <div key={idx} className="p-6 rounded-2xl bg-rose-500/5 border border-rose-500/10 group hover:bg-rose-500/10 transition-all">
                        {renderPitfall(pitfall)}
                      </div>
                    ))}
                  </div>

                  <SectionHeading title="Key Definitions" index="07" />
                  <div className="grid sm:grid-cols-2 gap-4 mb-20">
                    {data.definitions.map((def, idx) => (
                      <div key={idx} className="bg-card/50 border border-border/30 rounded-2xl p-6 hover:border-emerald-500/30 transition-all">
                         <div className="text-emerald-500 font-bold mb-2 uppercase tracking-widest text-[10px]">{def.term}</div>
                         <p className="text-sm text-foreground/80">{def.meaning}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="prose prose-invert max-w-none prose-mark:bg-primary/20 prose-mark:text-primary-foreground prose-blockquote:border-primary/50 prose-blockquote:bg-card/30 prose-blockquote:rounded-xl prose-blockquote:p-6">
                   <ReactMarkdown 
                    remarkPlugins={[remarkMath, remarkGfm]} 
                    rehypePlugins={[rehypeKatex, rehypeRaw]}
                    components={{
                      h1: ({ children }) => <h1 className="font-serif text-4xl md:text-6xl text-foreground font-black leading-tight mb-16 tracking-tight">{children}</h1>,
                      h2: ({ children }) => <SectionHeading title={flattenText(children)} index="" />,
                      h3: ({ children }) => {
                        if (String(children).includes('$')) {
                          return <div className="bg-muted/20 rounded-2xl p-10 mb-8 flex justify-center items-center text-3xl overflow-x-auto border border-border/30 shadow-inner my-6">{children}</div>;
                        }
                        return <h3 className="text-2xl font-bold mb-4 mt-8 border-b border-border/30 pb-2">{children}</h3>;
                      },
                      blockquote: ({ children }) => <div className="border-l-4 border-primary/50 bg-primary/5 p-8 rounded-r-3xl my-8 italic text-xl text-foreground/80 leading-relaxed font-medium">{children}</div>,
                      ul: ({ children }) => <ul className="grid sm:grid-cols-2 gap-6 mb-12">{children}</ul>,
                      li: ({ children }) => (
                        <div className="flex gap-4 p-6 rounded-2xl bg-card border border-border/50 group hover:border-primary/50 transition-all shadow-sm">
                          <div className="mt-1 w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                            <ChevronRight className="w-3 h-3 text-primary" />
                          </div>
                          <div className="text-sm font-medium text-foreground/90">{children}</div>
                        </div>
                      ),
                      code({ node, inline, className, children, ...props }: any) {
                        const match = /language-(\w+)/.exec(className || '')
                        if (!inline && match && match[1] === 'mermaid') {
                          return <MermaidDiagram code={String(children).replace(/\n$/, '')} />
                        }
                        return <code className={className} {...props}>{children}</code>
                      },
                      table: ({ children }) => <div className="overflow-x-auto rounded-2xl border border-border/50 bg-card shadow-sm mb-12"><table className="w-full text-sm border-collapse">{children}</table></div>,
                      thead: ({ children }) => <thead className="bg-muted/30 border-b border-border/50">{children}</thead>,
                      th: ({ children }) => <th className="px-6 py-4 text-left font-bold text-primary uppercase text-[10px] tracking-widest">{children}</th>,
                      td: ({ children }) => <td className="px-6 py-5 text-muted-foreground leading-relaxed border-t border-border/10">{children}</td>,
                    }}
                  >
                    {markdownData}
                  </ReactMarkdown>
                </div>
              )}
            </div>
          </article>
        )}
      </div>
    </div>
  )
}
