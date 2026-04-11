'use client'

import { FileText, Image as ImageIcon, MessageSquare, AlertTriangle, Loader2 } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle 
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import ReactMarkdown from 'react-markdown'

interface TopicModalsProps {
  selectedMaterial: any
  setSelectedMaterial: (mat: any) => void
  isDeleteDialogOpen: boolean
  setIsDeleteDialogOpen: (open: boolean) => void
  materialToDelete: any
  isDeleting: boolean
  handleDeleteMaterial: () => void
  isRegenConfirmOpen: boolean
  setIsRegenConfirmOpen: (open: boolean) => void
  regenType: string | null
  handleGenerate: (type: any, replace: boolean) => void
}

export function TopicModals({
  selectedMaterial, setSelectedMaterial,
  isDeleteDialogOpen, setIsDeleteDialogOpen,
  materialToDelete, isDeleting, handleDeleteMaterial,
  isRegenConfirmOpen, setIsRegenConfirmOpen, regenType, handleGenerate
}: TopicModalsProps) {
  return (
    <>
      {/* File Viewer Modal */}
      <Dialog open={!!selectedMaterial} onOpenChange={() => setSelectedMaterial(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col p-0 border-border bg-card shadow-2xl">
          <DialogHeader className="p-8 border-b border-border/50 bg-muted/20 flex-row items-center justify-between shrink-0 space-y-0">
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-xl ${
                selectedMaterial?.type === 'pdf' ? 'bg-red-500/10 text-red-400' : 
                selectedMaterial?.type === 'diagram' ? 'bg-emerald-500/10 text-emerald-400' : 
                'bg-blue-500/10 text-blue-400'
              }`}>
                {selectedMaterial?.type === 'pdf' ? <FileText className="w-6 h-6" /> : 
                 selectedMaterial?.type === 'diagram' ? <ImageIcon className="w-6 h-6" /> : 
                 <MessageSquare className="w-6 h-6" />}
              </div>
              <div>
                <DialogTitle className="font-serif text-2xl text-foreground">
                  {selectedMaterial?.title}
                </DialogTitle>
                <p className="text-xs text-muted-foreground mt-1 font-medium tracking-wide uppercase">
                  {selectedMaterial?.fileExtension || selectedMaterial?.type} • Added on {selectedMaterial && new Date(selectedMaterial.uploadedAt).toLocaleString()}
                </p>
              </div>
            </div>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto p-8 md:p-12 custom-scrollbar">
            {selectedMaterial?.type === 'diagram' && selectedMaterial?.url && (
              <div className="mb-12">
                <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-[0.2em] mb-4">Original Image Reference</p>
                <div className="relative rounded-2xl overflow-hidden border border-border/50 group max-w-2xl mx-auto">
                  <img src={selectedMaterial.url} alt="Source Diagram" className="w-full h-auto object-contain bg-muted/5 group-hover:scale-[1.02] transition-transform duration-500" />
                  <a href={selectedMaterial.url} target="_blank" rel="noopener noreferrer" className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button variant="secondary" size="sm" className="rounded-full shadow-lg">View Full Resolution</Button>
                  </a>
                </div>
                <hr className="mt-12 border-border/30" />
              </div>
            )}

            <div className="prose dark:prose-invert prose-slate max-w-none 
              prose-headings:font-serif prose-headings:font-bold prose-headings:text-foreground
              prose-p:text-foreground/90 prose-p:leading-relaxed prose-p:text-lg
              prose-strong:text-primary prose-strong:font-bold
              prose-code:bg-muted prose-code:text-primary prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded-md prose-code:before:content-none prose-code:after:content-none
              prose-ul:my-6 prose-li:my-2 prose-li:text-foreground/90
            ">
              <ReactMarkdown>
                {selectedMaterial?.content || selectedMaterial?.extractedText || "No content found for this material."}
              </ReactMarkdown>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Deletion Confirmation Modal */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="max-w-md border-border bg-card shadow-2xl p-0 overflow-hidden">
          <div className="p-8 space-y-6">
            <div className="w-14 h-14 rounded-2xl bg-destructive/10 flex items-center justify-center border border-destructive/20 mx-auto">
              <AlertTriangle className="w-8 h-8 text-destructive" />
            </div>
            
            <div className="text-center space-y-2">
              <DialogTitle className="font-serif text-2xl text-foreground">Delete Material?</DialogTitle>
              <DialogDescription className="text-muted-foreground text-sm leading-relaxed px-4">
                Are you sure you want to delete <span className="text-foreground font-medium">'{materialToDelete?.title}'</span>? 
                This action will also remove any associated AI-generated insights and cannot be undone.
              </DialogDescription>
            </div>

            <div className="flex gap-3 pt-2">
              <Button 
                variant="outline" 
                onClick={() => setIsDeleteDialogOpen(false)}
                className="flex-1 rounded-xl border-border bg-transparent text-muted-foreground"
              >
                Cancel
              </Button>
              <Button 
                onClick={handleDeleteMaterial}
                disabled={isDeleting}
                className="flex-1 rounded-xl bg-destructive hover:bg-destructive/90 text-destructive-foreground font-bold"
              >
                {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Delete'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Regeneration Confirmation */}
      <AlertDialog open={isRegenConfirmOpen} onOpenChange={setIsRegenConfirmOpen}>
        <AlertDialogContent className="bg-card border-border text-foreground">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-serif text-xl">Overwriting Existing Content?</AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              You already have {regenType} for this topic. Regenerating will permanently overwrite them with new AI-generated versions. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-transparent border-border text-muted-foreground rounded-xl">Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => {
                if (regenType) handleGenerate(regenType, true);
                setIsRegenConfirmOpen(false);
              }}
              className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-xl"
            >
              Confirm Regenerate
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
