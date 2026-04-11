'use client'

import { useParams, useSearchParams, useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useAuth } from '@/context/AuthContext'
import { Brain, FileText, Sparkles, Loader2, Target, Upload, ImageIcon, Save } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

// Hooks & Components
import { useTopicDetail } from '@/hooks/useTopicDetail'
import { TopicHeader } from './_components/TopicHeader'
import { LibrarySection } from './_components/LibrarySection'
import { StatsSection } from './_components/StatsSection'
import { TopicModals } from './_components/TopicModals'

// Shared Components
import { PdfUpload } from '@/components/pdf-upload'
import { ImageUpload } from '@/components/image-upload'
import { DiagramExplainer } from '@/components/diagram-explainer'
import { FlashcardPreview } from '@/components/topics/FlashcardPreview'
import { QuizPreview } from '@/components/topics/QuizPreview'
import { FlashcardModal } from '@/components/topics/FlashcardModal'
import { QuizQuestionModal } from '@/components/topics/QuizQuestionModal'

import { 
  GenerateCard, 
  EmptyState, 
  PageHeader, 
  GridSkeleton 
} from '@/components/common'

export default function TopicDetailPage() {
  const { updateAiUsage } = useAuth()
  const params = useParams()
  const searchParams = useSearchParams()
  const router = useRouter()
  const topicId = params.id as string
  const defaultTab = searchParams.get('tab') || 'notes'

  const {
    topic,
    notes, handleNotesChange,
    isSaving, saveAsSourceMaterial,
    saveStatus,
    activeGen,
    rateLimited,
    flashcards,
    quizzes,
    sessions,
    isMounted,
    selectedFlashcard, setSelectedFlashcard,
    isFlashcardModalOpen, setIsFlashcardModalOpen,
    selectedQuestion, setSelectedQuestion,
    isQuizModalOpen, setIsQuizModalOpen,
    extractedText, setExtractedText,
    appendExtractedText,
    saveExtractedAsNotes,
    selectedMaterial, setSelectedMaterial,
    isDeleteDialogOpen, setIsDeleteDialogOpen,
    materialToDelete, setMaterialToDelete,
    isDeleting,
    handleDeleteMaterial,
    isRegenConfirmOpen, setIsRegenConfirmOpen,
    regenType, setRegenType,
    handleGenerate,
    handleDirectImageGenerate,
    handleSaveFlashcard,
    handleDeleteFlashcard,
    handleSaveQuizQuestion,
    handleDeleteQuizQuestion
  } = useTopicDetail(topicId, updateAiUsage)

  const generationCards = [
    { 
      id: 'flashcards', 
      title: 'Flashcards', 
      icon: Sparkles, 
      color: 'bg-primary shadow-primary/20', 
      desc: 'Create study set for spaced repetition',
      path: 'flashcards'
    },
    { 
      id: 'quiz', 
      title: 'Quiz', 
      icon: Brain, 
      color: 'bg-blue-500 shadow-blue-500/20', 
      desc: 'Test your understanding with 10 MCQs',
      path: 'quiz'
    },
    { 
      id: 'summary', 
      title: 'Summary', 
      icon: FileText, 
      color: 'bg-emerald-500 shadow-emerald-500/20', 
      desc: 'Get a clean markdown study guide',
      path: 'summary'
    }
  ]

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto min-h-screen space-y-8 animate-in fade-in duration-500">
      <TopicHeader topic={topic} />

      <div className="pt-8 space-y-8">
        <Tabs defaultValue={defaultTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 h-14 bg-card rounded-xl border border-border/50 p-1 mb-6 shadow-sm">
            <TabsTrigger value="notes" className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-sm font-medium">Notes</TabsTrigger>
            <TabsTrigger value="upload" className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-sm font-medium">Upload</TabsTrigger>
            <TabsTrigger value="generate" className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-sm font-medium">Generate</TabsTrigger>
          </TabsList>

          <TabsContent value="notes" className="relative outline-none">
            <div className="relative">
              <textarea
                value={notes}
                onChange={handleNotesChange}
                placeholder="Start typing your notes here..."
                className="w-full min-h-[400px] lg:min-h-[500px] bg-card border border-border rounded-xl p-6 md:p-8 text-foreground resize-none focus:outline-none focus:ring-2 focus:ring-primary/50 shadow-sm leading-relaxed text-base"
              />
              <div className="absolute top-4 right-4 flex items-center gap-3 no-print">
                {saveStatus === 'saving' && <span className="text-xs text-muted-foreground flex items-center animate-pulse"><Loader2 className="w-3 h-3 mr-1 animate-spin" /> Saving...</span>}
                {saveStatus === 'saved' && <span className="text-xs text-emerald-500 flex items-center font-bold">SAVED ✓</span>}
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={saveAsSourceMaterial}
                  disabled={isSaving}
                  className="rounded-lg h-8 px-3 text-xs bg-primary/5 hover:bg-primary/10 border-primary/20 text-primary font-bold uppercase tracking-tighter"
                >
                  {isSaving ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <Save className="w-3 h-3 mr-1" />}
                  Save as Source Material
                </Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="upload" className="outline-none">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              {/* Document Upload */}
              <div className="glass-card rounded-xl p-6 flex flex-col items-center text-center gap-4 border-border group cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-all duration-200 h-full">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-primary/10 border border-primary/20 group-hover:scale-110 group-hover:bg-primary/20 transition-all duration-200">
                  <FileText className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h2 className="font-serif text-xl mb-1 group-hover:text-primary transition-colors duration-200">Document Upload</h2>
                  <p className="text-xs text-muted-foreground px-2">Click or drag PDF / TXT to upload and extract text.</p>
                </div>
                <div className="w-full mt-auto pt-4">
                  <PdfUpload topicId={topicId} onExtracted={(text, updatedTopic) => 
                    appendExtractedText(text, 'Extracted Text from PDF', updatedTopic)
                  } />
                </div>
              </div>

              {/* Image Extraction */}
              <div className="glass-card rounded-xl p-6 flex flex-col items-center text-center gap-4 border-border group cursor-pointer hover:border-blue-500/50 hover:bg-blue-500/5 transition-all duration-200 h-full">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-blue-500/10 border border-blue-500/20 group-hover:scale-110 group-hover:bg-blue-500/20 transition-all duration-200">
                  <ImageIcon className="w-6 h-6 text-blue-500" />
                </div>
                <div>
                  <h2 className="font-serif text-xl mb-1 group-hover:text-blue-500 transition-colors duration-200">Image Extraction</h2>
                  <p className="text-xs text-muted-foreground px-2">Upload textbook photos to instantly convert to text.</p>
                </div>
                <div className="w-full mt-auto pt-4">
                  <ImageUpload topicId={topicId} onExtracted={(text, updatedTopic) => 
                    appendExtractedText(text, 'Extracted Text from Image', updatedTopic)
                  } />
                </div>
              </div>

              {/* Diagram Explainer */}
              <div className="glass-card rounded-xl p-6 flex flex-col items-center text-center gap-4 border-border group cursor-pointer hover:border-emerald-500/50 hover:bg-emerald-500/5 transition-all duration-200 h-full">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-emerald-500/10 border border-emerald-500/20 group-hover:scale-110 group-hover:bg-emerald-500/20 transition-all duration-200">
                  <Upload className="w-6 h-6 text-emerald-500" />
                </div>
                <div>
                  <h2 className="font-serif text-xl mb-1 group-hover:text-emerald-500 transition-colors duration-200">Explain a Diagram</h2>
                  <p className="text-xs text-muted-foreground px-2">Upload a flowchart or chart — AI generates a step-by-step walkthrough.</p>
                </div>
                <div className="w-full mt-auto pt-4">
                  <DiagramExplainer topicId={topicId} onExtracted={(text, updatedTopic) => 
                    appendExtractedText(text, 'Diagram Explanation', updatedTopic)
                  } />
                </div>
              </div>
            </div>
            
            {extractedText && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card rounded-xl p-6 border-primary/30 mt-6 overflow-hidden">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-serif text-xl text-primary flex items-center gap-2 font-bold"><Sparkles className="w-5 h-5 text-amber-500" /> Extracted Text</h3>
                  <Button size="sm" onClick={saveExtractedAsNotes} disabled={isSaving} className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl font-bold uppercase tracking-widest px-6 h-10">
                    {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />} Save to Notes
                  </Button>
                </div>
                <textarea
                  value={extractedText}
                  onChange={e => setExtractedText(e.target.value)}
                  className="w-full min-h-[400px] bg-muted/20 border border-border/50 rounded-xl p-6 text-base leading-relaxed text-foreground resize-y focus:outline-none focus:border-primary/50 transition-all font-sans"
                  placeholder="Extracted text will appear here..."
                />
              </motion.div>
            )}

            {topic?.sourceImages && topic.sourceImages.length > 0 && (
              <div className="pt-8 border-t border-border/50 mt-8 space-y-4">
                <h3 className="font-serif text-xl border-b border-border pb-2 flex items-center gap-2 font-bold">
                  <ImageIcon className="w-5 h-5 text-primary" /> Uploaded Source Images
                </h3>
                <p className="text-sm text-muted-foreground">Original pages and diagrams uploaded to this topic.</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {topic.sourceImages.map((img: any, i: number) => (
                    <a key={img.publicId} href={img.url} target="_blank" rel="noopener noreferrer" className="block relative aspect-3/4 rounded-xl overflow-hidden border border-border/50 hover:border-primary/50 transition-colors group">
                      <img src={img.url} alt={`Upload ${i + 1}`} className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-300" />
                      <div className="absolute inset-x-0 bottom-0 bg-linear-to-t from-background/90 to-transparent p-3 pt-6 flex justify-between items-end opacity-0 group-hover:opacity-100 transition-opacity">
                        <span className="text-[10px] font-bold tracking-widest uppercase">{new Date(img.uploadedAt).toLocaleDateString()}</span>
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="generate" className="outline-none">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {generationCards.map((card) => (
                <GenerateCard 
                  key={card.id}
                  icon={card.icon}
                  title={card.title}
                  description={card.desc}
                  color={card.color}
                  loading={activeGen === card.id}
                  disabled={rateLimited}
                  onView={() => router.push(`/topics/${topicId}/${card.path}`)}
                  onGenerate={() => {
                    const hasExisting = 
                      (card.id === 'flashcards' && (topic?.flashcardsCount > 0 || flashcards.length > 0)) || 
                      (card.id === 'quiz' && (topic?.quizCount > 0 || quizzes.length > 0)) ||
                      (card.id === 'summary' && topic?.summary);
                    
                    if (hasExisting) {
                      setRegenType(card.id as any);
                      setIsRegenConfirmOpen(true);
                    } else {
                      handleGenerate(card.id as any, false);
                    }
                  }}
                />
              ))}
            </div>
            
            {rateLimited && (
              <div className="mt-6 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 flex items-start gap-3 shadow-[0_0_15px_rgba(245,158,11,0.1)]">
                <span className="text-xl shrink-0">⏳</span>
                <div>
                  <p className="text-sm font-medium text-amber-500">All AI models are currently busy</p>
                  <p className="text-xs text-amber-500/70 mt-1">
                    Generate buttons will re-enable automatically in 2 minutes.
                  </p>
                </div>
              </div>
            )}

            <div className="mt-16 pt-8 border-t border-border/50">
              <h3 className="font-serif text-2xl mb-2 flex items-center gap-2 font-bold"><Sparkles className="w-5 h-5 text-amber-500" /> Direct Image Magic</h3>
              <p className="text-muted-foreground mb-6">Skip typing! Upload a photo and instantly get a Quiz or Flashcard deck.</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="glass-card rounded-xl p-6 border-border flex flex-col items-center text-center hover:-translate-y-1 transition-transform group">
                  <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                    <Brain className="w-8 h-8 text-primary" />
                  </div>
                  <h4 className="font-bold text-lg mb-1">Flashcards from Image</h4>
                  <p className="text-sm text-muted-foreground mb-4">Extract concepts & definitions</p>
                  <Button 
                    onClick={() => !activeGen && document.getElementById('direct-image-flashcard')?.click()}
                    disabled={activeGen !== null || rateLimited}
                    className="w-full bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl h-12 font-bold uppercase tracking-widest"
                  >
                    {activeGen === 'image-flashcard' ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Select Image'}
                  </Button>
                  <input id="direct-image-flashcard" type="file" accept="image/*" className="hidden" onChange={(e) => handleDirectImageGenerate(e, 'flashcard')} />
                </div>
                
                <div className="glass-card rounded-xl p-6 border-border flex flex-col items-center text-center hover:-translate-y-1 transition-transform group">
                  <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                    <Target className="w-8 h-8 text-blue-500" />
                  </div>
                  <h4 className="font-bold text-lg mb-1">Quiz from Image</h4>
                  <p className="text-sm text-muted-foreground mb-4">Create MCQs automatically</p>
                  <Button 
                    onClick={() => !activeGen && document.getElementById('direct-image-quiz')?.click()}
                    disabled={activeGen !== null || rateLimited}
                    className="w-full bg-blue-500 hover:bg-blue-500/90 text-white rounded-xl h-12 font-bold uppercase tracking-widest shadow-lg shadow-blue-500/20"
                  >
                    {activeGen === 'image-quiz' ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Select Image'}
                  </Button>
                  <input id="direct-image-quiz" type="file" accept="image/*" className="hidden" onChange={(e) => handleDirectImageGenerate(e, 'quiz')} />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-16 pt-16 border-t border-border/50">
              {flashcards.length > 0 && (
                <FlashcardPreview 
                  flashcards={flashcards} 
                  topicId={topicId} 
                  onAddClick={() => {}} 
                  onEditClick={(card) => { setSelectedFlashcard(card); setIsFlashcardModalOpen(true); }}
                  onDeleteClick={handleDeleteFlashcard}
                />
              )}
              {quizzes.length > 0 && (
                <QuizPreview 
                  questions={quizzes} 
                  topicId={topicId} 
                  onAddClick={() => {}} 
                  onEditClick={(q) => { setSelectedQuestion(q); setIsQuizModalOpen(true); }}
                  onDeleteClick={handleDeleteQuizQuestion}
                />
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      <LibrarySection 
        topic={topic} 
        setSelectedMaterial={setSelectedMaterial} 
        setMaterialToDelete={setMaterialToDelete} 
        setIsDeleteDialogOpen={setIsDeleteDialogOpen} 
      />

      <StatsSection sessions={sessions} isMounted={isMounted} />

      <TopicModals 
        selectedMaterial={selectedMaterial} 
        setSelectedMaterial={setSelectedMaterial}
        isDeleteDialogOpen={isDeleteDialogOpen}
        setIsDeleteDialogOpen={setIsDeleteDialogOpen}
        materialToDelete={materialToDelete}
        isDeleting={isDeleting}
        handleDeleteMaterial={handleDeleteMaterial}
        isRegenConfirmOpen={isRegenConfirmOpen}
        setIsRegenConfirmOpen={setIsRegenConfirmOpen}
        regenType={regenType}
        handleGenerate={handleGenerate}
      />

      <FlashcardModal 
        open={isFlashcardModalOpen} 
        onOpenChange={setIsFlashcardModalOpen} 
        flashcard={selectedFlashcard} 
        onSave={handleSaveFlashcard} 
      />
      <QuizQuestionModal 
        open={isQuizModalOpen} 
        onOpenChange={setIsQuizModalOpen} 
        question={selectedQuestion} 
        onSave={handleSaveQuizQuestion} 
      />
    </div>
  )
}
