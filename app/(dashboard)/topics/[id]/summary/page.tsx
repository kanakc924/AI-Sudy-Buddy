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
  Terminal,
  Brain,
  AlertTriangle,
  Lightbulb,
  Workflow,
  Sigma,
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

/**
 * Robust Mermaid syntax cleaner.
 * Strips markdown fences, removes common halucinations like '...', 
 * and extracts only the valid diagram definition.
 */
function cleanMermaidCode(code: string): string {
  if (!code) return "";
  
  // 1. Remove markdown fences and language tags
  let cleaned = code
    .replace(/^```mermaid\s*/i, "")
    .replace(/```\s*$/g, "")
    .replace(/```/g, ""); // Catch stray middle backticks
    
  // 2. Remove common continuation hallucinations
  cleaned = cleaned.replace(/^\s*\.\.\.\s*$/gm, ""); // Remove full-line '...'
  cleaned = cleaned.replace(/\.\.\.\s*$/g, "");     // Remove trailing '...'
  
  // 3. Find the first valid mermaid keyword to start the definition
  const keywords = ['graph', 'flowchart', 'sequenceDiagram', 'classDiagram', 'stateDiagram', 'erDiagram', 'journey', 'gantt', 'pie', 'quadrantChart', 'requirementDiagram', 'gitGraph', 'C4Context'];
  let firstKeywordIndex = -1;
  
  for (const kw of keywords) {
    const idx = cleaned.toLowerCase().indexOf(kw.toLowerCase());
    if (idx !== -1 && (firstKeywordIndex === -1 || idx < firstKeywordIndex)) {
      // Ensure it's not just a word inside another word
      const charBefore = idx > 0 ? cleaned[idx - 1] : ' ';
      if (/\s/.test(charBefore)) {
        firstKeywordIndex = idx;
      }
    }
  }
  
  if (firstKeywordIndex !== -1) {
    cleaned = cleaned.substring(firstKeywordIndex);
  }

  // 4. Aggressive Suffix Stripping for AI "Notes" or meta-text
  // Common markers where AI adds text after the diagram ends
  const junkMarkers = ["Note:", "Notes:", "Explanation:", "This diagram", "(Note", "```"];
  for (const marker of junkMarkers) {
    const junkIndex = cleaned.indexOf(marker);
    if (junkIndex !== -1) {
      cleaned = cleaned.substring(0, junkIndex);
    }
  }

  // 5. Auto-quote all unquoted square bracket labels to prevent special char parse errors
  //    e.g. [Top-p (Nucleus) Sampling]  →  ["Top-p (Nucleus) Sampling"]
  //    Matches [text] where text is NOT already wrapped in double quotes.
  cleaned = cleaned.replace(/\[([^"\]\[]+)\]/g, (match, label) => {
    // If already starts with a quote, leave it alone
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

/**
 * Extracts raw text from React Markdown children to avoid [object Object] rendering
 */
function flattenText(children: any): string {
  return Array.isArray(children)
    ? children.map(child => (typeof child === 'string' ? child : flattenText(child.props?.children))).join('')
    : typeof children === 'string'
    ? children
    : children?.props?.children
    ? flattenText(children.props.children)
    : '';
}

/**
 * Mermaid diagram renderer component for AI generated diagrams
 */
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
          theme: 'base', // Using base for better print control
          themeVariables: {
            fontSize: '14px',
            fontFamily: 'Inter, sans-serif',
            primaryColor: '#ffffff',
            nodeBorder: '#4338ca',
          },
          flowchart: {
            padding: 30,      // Increase padding to prevent word cutting
            nodeSpacing: 60,
            rankSpacing: 60,
            useMaxWidth: false, // Ensure full resolution for print
            htmlLabels: false,  // Better for consistent SVG rendering in PDFs
          },
        })

        // Sanitize before rendering
        const sanitized = sanitizeMermaid(code)

        const id = `mermaid-${Math.random().toString(36).substr(2, 9)}`
        const { svg } = await mermaid.render(id, sanitized)

        if (ref.current) {
          ref.current.innerHTML = svg
        }
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
        <p className="text-sm text-amber-400 font-medium">
          ⚠️ Diagram could not be rendered
        </p>
        <p className="text-xs text-amber-400/70 mt-1">
          The AI generated an invalid diagram structure. Try regenerating the summary.
        </p>
        <details className="mt-2 text-left">
          <summary className="text-xs text-muted-foreground cursor-pointer">
            Show raw diagram code
          </summary>
          <pre className="text-xs text-muted-foreground mt-2 overflow-x-auto p-2 bg-card rounded">
            {code}
          </pre>
        </details>
      </div>
    )
  }

  return (
    <div
      ref={ref}
      className="mermaid my-6 flex justify-center overflow-x-auto rounded-xl bg-card/50 p-4"
    />
  )
}

function SectionHeading({ title, index }: { title: string, index: string }) {
  return (
    <div className="mt-12 mb-6 border-b border-slate-200 pb-2">
      <h2 className="font-serif text-2xl font-extrabold tracking-tight text-indigo-900">
        {index}. {title.toUpperCase()}
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
      @page {
        size: auto;
        margin: 0mm; 
      }
      body {
        padding: 1.5cm;
        background: white !important;
        -webkit-print-color-adjust: exact;
      }
      /* Standardize all header sizes for equality */
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
      /* Strip backgrounds and glows */
      .bg-primary\\/5, [class*="bg-primary"], .group, .bg-card, .card-printable { 
        background: none !important; 
        border: none !important; 
        box-shadow: none !important; 
      }
      /* Ensure Mermaid diagrams are visible and appropriately scaled in print */
      .mermaid {
        width: 100% !important;
        display: flex !important;
        justify-content: center !important;
        margin: 20pt 0 !important;
      }
      .mermaid svg {
        width: 100% !important;
        max-width: 100% !important;
        height: auto !important;
        overflow: visible !important;
      }
      .mermaid .node rect, .mermaid .node circle, .mermaid .node polygon, .mermaid rect { 
        fill: #ffffff !important; 
        stroke: #4338ca !important; 
        stroke-width: 1.5px !important; 
      }
      .mermaid text, .mermaid .label, .mermaid .nodeText { 
        fill: #000000 !important; 
        color: #000000 !important; 
        font-weight: 700 !important; 
        font-size: 10px !important;
        text-rendering: geometricPrecision !important;
      }
      .mermaid .node label, .mermaid .label {
        padding: 10px !important;
      }
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

  /**
   * Helper to render common pitfall strings which may contain MISTAKE -> CORRECT
   */
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
    
    // Reset focus and selection
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + before.length, end + before.length);
    }, 0);
  }

  if (loading) {
    return (
      <div className="absolute inset-0 z-50 bg-background flex flex-col items-center justify-center">
        <Loader2 className="w-10 h-10 text-primary animate-spin mb-4" />
        <p className="text-muted-foreground animate-pulse text-sm uppercase tracking-widest font-medium">Assembling Academic Deep Dive...</p>
      </div>
    )
  }

  return (
    <div ref={outerContainerRef} className="absolute inset-0 z-50 bg-background overflow-y-auto selection:bg-primary/30">
      {/* Premium Header */}
      <div className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border/50 px-4 md:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => isEditing ? setIsEditing(false) : router.push(`/topics/${topicId}`)} 
            className="rounded-full bg-card hover:bg-card/80 border border-border"
          >
            {isEditing ? <X className="w-5 h-5 text-muted-foreground" /> : <ArrowLeft className="w-5 h-5 text-muted-foreground" />}
          </Button>
          <div className="hidden sm:block">
            <h2 className="text-sm font-bold text-foreground flex items-center gap-2 uppercase tracking-wide">
              Master Summary
            </h2>
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">Research Grade</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {!isEditing ? (
            <>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={toggleEdit}
                className="rounded-xl border-border bg-card/50 text-muted-foreground hover:text-primary transition-all hover:border-primary/50"
              >
                <Pencil className="w-4 h-4 mr-2" />
                Edit
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleRegenerate}
                disabled={isRegenerating}
                className="rounded-xl border-border bg-card/50 text-muted-foreground hover:text-primary transition-all hover:border-primary/50"
              >
                <RefreshCw className={cn("w-4 h-4 mr-2", isRegenerating && "animate-spin")} />
                Regenerate
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={exportToPDF}
                disabled={isExporting}
                className="rounded-xl border-border bg-card/50 text-muted-foreground hover:text-blue-500 transition-all hover:border-blue-500/50"
              >
                {isExporting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Download className="w-4 h-4 mr-2" />}
                Export PDF
              </Button>
            </>
          ) : (
            <Button 
              size="sm" 
              onClick={handleSave}
              disabled={isSaving}
              className="rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/20"
            >
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
              Save Changes
            </Button>
          )}
        </div>
      </div>

      <div className="max-w-[800px] mx-auto px-4 py-8 min-h-screen">
        {isEditing ? (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="mb-6 flex items-center justify-between border-b border-border/50 pb-4">
              <h2 className="font-serif text-2xl font-bold">Edit Summary</h2>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => insertText("**", "**")} className="rounded-lg h-9 w-9 p-0" title="Bold">
                  <Bold className="w-4 h-4" />
                </Button>
                <Button variant="outline" size="sm" onClick={() => insertText("*", "*")} className="rounded-lg h-9 w-9 p-0" title="Italic">
                  <Italic className="w-4 h-4" />
                </Button>
                <Button variant="outline" size="sm" onClick={() => insertText("<mark>", "</mark>")} className="rounded-lg h-9 w-9 p-0" title="Highlight">
                  <Highlighter className="w-4 h-4" />
                </Button>
              </div>
            </div>
            <textarea
              ref={textareaRef}
              value={editableMarkdown}
              onChange={(e) => setEditableMarkdown(e.target.value)}
              className="w-full min-h-[600px] bg-card border border-border rounded-2xl p-8 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 shadow-inner font-mono text-sm leading-relaxed"
              placeholder="Write your summary in markdown..."
            />
          </div>
        ) : !data && !markdownData ? (
          <div className="text-center py-24">
            <div className="bg-card w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 border border-border">
              <Sparkles className="w-8 h-8 text-primary" />
            </div>
            <h2 className="font-serif text-3xl mb-3 font-bold">Ready for the Deep Dive?</h2>
            <p className="text-muted-foreground mb-10 max-w-md mx-auto">Transform your raw materials into a structured, academic-grade study guide with visual processes and math.</p>
            <Button 
              onClick={handleRegenerate} 
              disabled={isRegenerating}
              className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-2xl px-12 h-14 font-bold text-lg shadow-xl shadow-primary/20"
            >
              {isRegenerating ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <Brain className="w-5 h-5 mr-2" />}
              Generate Academic Summary
            </Button>
          </div>
        ) : (
          <article ref={contentRef} className="animate-in fade-in duration-1000 fill-mode-forwards document-viewer">
            <div ref={printRef} id="summary-export-content">
              {data ? (
                <div className="space-y-2">
                  <h1 className="font-serif text-3xl md:text-5xl text-foreground font-black leading-tight mb-12 tracking-tight">
                    Academic Deep Dive: <span className="text-primary italic">Topic Synthesis</span>
                  </h1>
                  
                  <SectionHeading title="Executive Overview" index="01" />
                  <div className="relative z-10">
                      <ReactMarkdown rehypePlugins={[rehypeRaw]} components={{
                        mark: ({ children }) => <mark className="bg-primary/20 text-primary-foreground px-1 rounded-sm border-b border-primary/50 font-medium">{children}</mark>,
                        p: ({ children }) => <p className="text-lg md:text-xl text-foreground/90 leading-relaxed font-medium">{children}</p>
                      }}>
                        {data.executiveOverview}
                      </ReactMarkdown>
                    </div>
                  
                  {/* 2. Key Concepts Table */}
                  <SectionHeading title="Architecture & Key Concepts" index="02" />
                  <div className="overflow-x-auto mb-12 document-table-wrapper">
                    <table className="w-full text-sm border-collapse">
                      <thead>
                        <tr>
                          <th className="px-6 py-4">Concept</th>
                          <th className="px-6 py-4">Characteristics</th>
                          <th className="px-6 py-4">Use Case</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.keyConcepts.map((item, idx) => (
                          <tr key={idx}>
                            <td className="concept-cell font-bold text-foreground">{item.concept}</td>
                            <td className="details-cell">{item.characteristics}</td>
                            <td className="use-case-cell">{item.useCase}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* 3. Deep Dive */}
                  {data.deepDive && (
                    <div className="mb-12">
                      <SectionHeading title="Deep Dive Analysis" index="03" />
                      <div className="bg-card border border-border/60 rounded-3xl p-8 prose prose-invert max-w-none prose-p:text-base prose-p:leading-relaxed prose-headings:text-foreground prose-li:text-base prose-h3:text-primary prose-h3:text-lg prose-h3:font-bold prose-h3:mt-6 prose-h3:mb-2 prose-h3:pb-1 prose-h3:border-b prose-h3:border-border/40 text-foreground">
                        <ReactMarkdown
                          remarkPlugins={[remarkMath, remarkGfm]}
                          rehypePlugins={[rehypeKatex, rehypeRaw]}
                        >
                          {data.deepDive}
                        </ReactMarkdown>
                      </div>
                    </div>
                  )}

                  {/* 4. Mathematical Foundations */}
                  {data.mathematicalFoundations && data.mathematicalFoundations.length > 0 && (
                    <>
                      <SectionHeading title="Mathematical Foundations" index="04" />
                      <div className="space-y-6 mb-12">
                        {data.mathematicalFoundations.map((math, idx) => (
                          <div key={idx} className="bg-card border border-border/60 rounded-3xl p-6 md:p-8 hover:border-primary/30 transition-all card-printable">
                            <div className="bg-background/80 rounded-2xl p-8 mb-6 flex justify-center items-center text-2xl overflow-x-auto shadow-inner border border-border/40">
                              <ReactMarkdown 
                                remarkPlugins={[remarkMath, remarkGfm]} 
                                rehypePlugins={[rehypeKatex, rehypeRaw]}
                              >
                                {`$$${math.formula.replace(/\$/g, '').trim()}$$`}
                              </ReactMarkdown>
                            </div>
                            <div className="grid md:grid-cols-2 gap-8">
                              <div>
                                <span className="text-[10px] font-bold text-primary uppercase tracking-widest mb-2 block">Variables</span>
                                <div className="text-sm text-muted-foreground leading-relaxed prose prose-invert prose-sm max-w-none">
                                  <ReactMarkdown 
                                    remarkPlugins={[remarkMath, remarkGfm]} 
                                    rehypePlugins={[rehypeKatex, rehypeRaw]}
                                  >
                                    {math.variables}
                                  </ReactMarkdown>
                                </div>
                              </div>
                              <div className="border-l border-border/50 pl-8">
                                <div className="flex items-center gap-2 mb-2">
                                   <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
                                   <span className="text-[10px] font-bold text-amber-600 uppercase tracking-widest">The Intuition</span>
                                </div>
                                <p className="text-sm text-foreground/80 leading-relaxed italic">"{math.intuition}"</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </>
                  )}

                  {/* 5. Visual Process Flow */}
                  <SectionHeading title="Visual Process Flow" index="05" />
                  <div className="mermaid-container mb-12">
                     <MermaidDiagram code={data.visualProcessFlow} />
                  </div>

                  {/* 6. Common Pitfalls */}
                  <SectionHeading title="Common Pitfalls" index="06" />
                  <div className="grid sm:grid-cols-2 gap-4 mb-12">
                    {data.commonPitfalls.map((pitfall, idx) => (
                      <div key={idx} className="flex gap-4 p-5 rounded-2xl bg-rose-500/5 border border-rose-500/20 group hover:bg-rose-500/10 transition-all card-printable">
                        <div className="mt-1 w-5 h-5 rounded-full bg-rose-500/20 flex items-center justify-center shrink-0">
                          <X className="w-3 h-3 text-rose-500" />
                        </div>
                        {renderPitfall(pitfall)}
                      </div>
                    ))}
                  </div>

                  {/* 7. Definitions */}
                  {data.definitions && data.definitions.length > 0 && (
                    <>
                      <SectionHeading title="Key Definitions" index="07" />
                      <div className="grid sm:grid-cols-2 gap-4 mb-12">
                        {data.definitions.map((def, idx) => (
                          <div key={idx} className="bg-card/50 border border-border/50 rounded-2xl p-6 hover:border-emerald-500/30 transition-all group card-printable">
                             <div className="text-emerald-500 font-bold mb-2 uppercase tracking-widest text-[10px] group-hover:scale-105 transition-transform origin-left">{def.term}</div>
                             <p className="text-sm text-foreground/90 leading-relaxed">{def.meaning}</p>
                          </div>
                        ))}
                      </div>
                    </>
                  )}

                  {/* 8. Trivia */}
                  <SectionHeading title="Did You Know?" index="08" />
                  <div className="space-y-4 mb-20">
                    {data.didYouKnow.map((fact, idx) => (
                      <div key={idx} className="flex items-start gap-4 p-4 rounded-xl border border-border/40 hover:bg-card/30 transition-all">
                        <div className="mt-0.5 p-1.5 bg-amber-500/10 rounded-lg">
                          <Lightbulb className="w-4 h-4 text-amber-600" />
                        </div>
                        <p className="text-sm text-muted-foreground leading-relaxed italic">{fact}</p>
                      </div>
                    ))}
                  </div>

                  {/* 9. Key Takeaways */}
                  {data.keyTakeaways && data.keyTakeaways.length > 0 && (
                    <div className="mt-8 rounded-xl border border-primary/30 bg-primary/5 p-6 key-takeaways-wrapper">
                      <h2 className="font-serif text-2xl text-foreground mb-4 font-bold border-b border-border/50 pb-2">
                        09. KEY TAKEAWAYS
                      </h2>
                      <ul className="space-y-3 list-none">
                        {data.keyTakeaways.map((point, i) => (
                          <li key={i} className="flex gap-3 items-start">
                            <span className="text-primary font-bold font-mono text-sm mt-0.5 shrink-0">
                              {i + 1}.
                            </span>
                            <span className="text-foreground/90 leading-relaxed text-sm">
                              {point}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ) : (
                <div className="prose prose-invert max-w-none prose-headings:font-serif prose-headings:font-bold prose-p:text-lg prose-p:leading-relaxed prose-mark:bg-primary/20 prose-mark:text-primary-foreground prose-blockquote:border-primary/50 prose-blockquote:bg-card/30 prose-blockquote:rounded-xl prose-blockquote:p-4">
                   <ReactMarkdown 
                    remarkPlugins={[remarkMath, remarkGfm]} 
                    rehypePlugins={[rehypeKatex, rehypeRaw]}
                    components={{
                      h1: ({ children }) => (
                        <h1 className="font-serif text-3xl md:text-5xl text-foreground font-black leading-tight mb-12 tracking-tight">
                          {children}
                        </h1>
                      ),
                      h2: ({ children }) => {
                        const title = flattenText(children);
                        let emoji = "📌";
                        let color = "bg-indigo-500";
                        
                        return <SectionHeading title={title} index="" />;
                      },
                      h3: ({ children }) => {
                        // In our convertToMarkdown, h3 was used for formulas
                        if (String(children).includes('$')) {
                          return (
                            <div className="bg-background/80 rounded-2xl p-8 mb-6 flex justify-center items-center text-2xl overflow-x-auto shadow-inner border border-border/40 my-4">
                              {children}
                            </div>
                          );
                        }
                        return <h3 className="text-xl font-bold mb-4">{children}</h3>;
                      },
                      blockquote: ({ children }) => (
                        <div className="border-l-4 border-primary/50 bg-primary/5 p-6 rounded-r-2xl my-6 italic text-foreground/80">
                          {children}
                        </div>
                      ),
                      ul: ({ children }) => <ul className="grid sm:grid-cols-2 gap-4 mb-12">{children}</ul>,
                      li: ({ children }) => (
                        <div className="flex gap-4 p-5 rounded-2xl bg-primary/5 border border-primary/10 group hover:bg-primary/10 transition-all">
                          <div className="mt-1 w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                            <ChevronRight className="w-3 h-3 text-primary" />
                          </div>
                          <div className="text-sm leading-relaxed text-foreground/80 font-medium">{children}</div>
                        </div>
                      ),
                      code({ node, inline, className, children, ...props }: any) {
                        const match = /language-(\w+)/.exec(className || '')
                        if (!inline && match && match[1] === 'mermaid') {
                          return <MermaidDiagram code={String(children).replace(/\n$/, '')} />
                        }
                        return (
                          <code className={className} {...props}>
                            {children}
                          </code>
                        )
                      },
                      mark: ({ children }) => <mark className="bg-primary/20 text-primary-foreground px-1 rounded-sm border-b border-primary/50 font-medium">{children}</mark>,
                      table: ({ children }) => (
                        <div className="overflow-x-auto rounded-2xl border border-border/50 bg-card/30 shadow-sm mb-12">
                          <table className="w-full text-sm border-collapse">{children}</table>
                        </div>
                      ),
                      thead: ({ children }) => <thead className="bg-card/50 border-b border-border/50">{children}</thead>,
                      th: ({ children }) => <th className="px-6 py-4 text-left font-bold text-primary uppercase tracking-wider text-[10px]">{children}</th>,
                      td: ({ children }) => <td className="px-6 py-5 text-muted-foreground leading-relaxed">{children}</td>,
                    }}
                  >
                    {markdownData || ""}
                  </ReactMarkdown>
                </div>
              )}
            </div>

            <div className="mt-20 pt-12 border-t border-border/30 flex flex-col sm:flex-row gap-6 justify-between items-center no-print pb-20">
              <Button 
                variant="ghost" 
                onClick={() => router.push(`/topics/${topicId}`)} 
                className="h-14 px-8 rounded-2xl hover:bg-card/80 text-muted-foreground group"
              >
                <ArrowLeft className="w-5 h-5 mr-3 group-hover:-translate-x-1 transition-transform" /> 
                Return to Dashboard
              </Button>
              <div className="flex w-full sm:w-auto gap-4">
                <Button 
                  onClick={() => router.push(`/topics/${topicId}/quiz`)} 
                  className="h-14 px-10 rounded-2xl bg-primary hover:bg-primary/90 text-primary-foreground shadow-xl shadow-primary/20 font-bold"
                >
                  Bridge to Assessment
                </Button>
              </div>
            </div>
          </article>
        )}
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .document-viewer mark {
          background-color: rgba(124, 92, 252, 0.2) !important;
          color: #A78BFA !important;
          padding: 0.1em 0.3em;
          border-radius: 0.2em;
          border-bottom: 2px solid rgba(124, 92, 252, 0.5);
          font-weight: 500;
        }

        .prose h1 { margin-bottom: 2rem; border-bottom: 1px solid rgba(124, 92, 252, 0.2); padding-bottom: 1rem; }
        .prose h2 { margin-top: 3rem; margin-bottom: 1.5rem; color: #A78BFA; }
        .prose table { border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 1rem; overflow: hidden; background: rgba(255, 255, 255, 0.02); }
        .prose th { background: rgba(124, 92, 252, 0.1); color: #A78BFA; padding: 1rem !important; }
        .prose td { padding: 1rem !important; border-top: 1px solid rgba(255, 255, 255, 0.05); }
        
        @media print {
          /* Force all content to be visible and non-animated */
          *, *::before, *::after {
            animation: none !important;
            transition: none !important;
            opacity: 1 !important;
            visibility: visible !important;
          }

          /* Reset absolute layout context for the print engine */
          html, body, #__next, [data-inner-container] {
            height: auto !important;
            min-height: 100% !important;
            overflow: visible !important;
            background: white !important;
            color: black !important;
            margin: 0 !important;
            padding: 0 !important;
            position: relative !important;
          }

          /* Target the summary absolute container specially - MUST BE STATIC FOR PRINT */
          .absolute.inset-0.z-50 {
            position: absolute !important; /* Keep absolute but ensure parent allows flow */
            top: 0 !important;
            left: 0 !important;
            width: 100% !important;
            height: auto !important;
            min-height: 100% !important;
            overflow: visible !important;
            z-index: auto !important;
            display: block !important;
          }

          /* Ensure the article isn't clipped */
          article {
            height: auto !important;
            overflow: visible !important;
            display: block !important;
          }

          /* Remove all UI chrome */
          .no-print, nav, aside, header, .sticky, .fixed, button, .lucide, [role="button"] {
            display: none !important;
            height: 0 !important;
            width: 0 !important;
            margin: 0 !important;
            padding: 0 !important;
            overflow: hidden !important;
          }

          /* Force layout to full width */
          .max-w-\[800px\], .max-w-7xl, .container, .mx-auto {
            max-width: 100% !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
          }

          #summary-export-content {
            background-color: white !important;
            color: #000 !important;
            padding: 10mm !important;
            width: 100% !important;
            display: block !important;
            height: auto !important;
            overflow: visible !important;
          }

          /* Visual Consistency in Light Mode Print */
          .bg-card, .bg-primary\/5, .bg-rose-500\/5, .bg-amber-500\/10, .bg-indigo-500, .bg-primary {
            background-color: #ffffff !important;
            border: 1px solid #e2e8f0 !important;
            color: black !important;
            box-shadow: none !important;
          }

          h1, h2, h3, h4, p, span, td, th, li, div {
            color: black !important;
          }

          h2 {
            /* page-break-before: always; */
            margin-top: 3rem !important;
            border-bottom: 2px solid #7C5CFC !important;
            padding-bottom: 0.5rem !important;
          }

          .bg-card, table, tr, .mermaid, blockquote, div[key] {
            page-break-inside: avoid !important;
          }

          /* Clean up blurred decorations */
          .backdrop-blur-md, .blur-3xl, .noise-bg, .absolute.inset-0.bg-background {
            display: none !important;
          }
        }

        ::-webkit-scrollbar { width: 8px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(124, 92, 252, 0.1); border-radius: 10px; }
        ::-webkit-scrollbar-thumb:hover { background: rgba(124, 92, 252, 0.3); }
      `}} />
    </div>
  )
}
