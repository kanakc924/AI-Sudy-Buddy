'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { BookOpen, FileText, Image as ImageIcon, MessageSquare, Trash2 } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { EmptyState } from '@/components/common'
import { cn } from '@/lib/utils'

interface LibrarySectionProps {
  topic: any
  setSelectedMaterial: (mat: any) => void
  setMaterialToDelete: (mat: any) => void
  setIsDeleteDialogOpen: (open: boolean) => void
}

export function LibrarySection({ topic, setSelectedMaterial, setMaterialToDelete, setIsDeleteDialogOpen }: LibrarySectionProps) {
  return (
    <div className="mt-12">
      <Card className="border-border bg-card rounded-3xl overflow-hidden shadow-sm">
        <CardHeader className="pb-6 border-b border-border/50 bg-muted/20">
          <div className="flex items-center justify-between">
            <CardTitle className="font-serif text-xl font-bold flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-primary" />
              Study Library & Source Materials
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-8 bg-card">
          {topic?.sourceMaterials && topic.sourceMaterials.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...topic.sourceMaterials]
                .sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime())
                .map((mat: any, idx: number) => {
                  const isPdf = mat.type === 'pdf' || mat.fileExtension === 'pdf';
                  const isDiagram = mat.type === 'diagram';

                  return (
                    <motion.div 
                      key={idx}
                      whileHover={{ y: -4 }}
                      onClick={() => setSelectedMaterial(mat)}
                      className="group relative flex flex-col p-6 bg-muted/10 border border-border/50 rounded-2xl cursor-pointer transition-all hover:border-primary/50 hover:shadow-primary/10"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className={cn(
                          "p-3 rounded-xl transition-transform group-hover:scale-110",
                          isPdf ? 'bg-red-500/10 text-red-500' : 
                          isDiagram ? 'bg-emerald-500/10 text-emerald-500' : 
                          'bg-primary/10 text-primary'
                        )}>
                          {isPdf ? <FileText className="w-6 h-6" /> : 
                           isDiagram ? <ImageIcon className="w-6 h-6" /> : 
                           <MessageSquare className="w-6 h-6" />}
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest bg-muted/50 px-2 py-0.5 rounded-full">
                            {mat.fileExtension || mat.type}
                          </span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setMaterialToDelete(mat);
                              setIsDeleteDialogOpen(true);
                            }}
                            className="p-1.5 rounded-lg hover:bg-destructive/10 transition-colors group/trash"
                            title="Delete material"
                          >
                            <Trash2 className="w-4 h-4 text-muted-foreground group-hover:text-destructive transition-colors" />
                          </button>
                        </div>
                      </div>
                      
                      <h4 className="font-bold text-foreground mb-1 line-clamp-1 group-hover:text-primary transition-colors">
                        {mat.title}
                      </h4>
                      <p className="text-[11px] text-muted-foreground font-medium">
                        Saved: {new Date(mat.uploadedAt).toLocaleDateString()}
                      </p>
                      
                      <div className="mt-4 pt-4 border-t border-border/10 flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <span className="text-[10px] font-bold text-primary uppercase tracking-widest">Click to View</span>
                      </div>
                    </motion.div>
                  );
                })}
            </div>
          ) : (
            <EmptyState variant="library" />
          )}
        </CardContent>
      </Card>
    </div>
  )
}
