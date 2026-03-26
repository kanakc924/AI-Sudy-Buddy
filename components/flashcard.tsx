'use client'

import { Sparkles, Edit2 } from 'lucide-react'

export function Flashcard({ card, isFlipped, onFlip, onEdit }: { card: any, isFlipped: boolean, onFlip: () => void, onEdit?: (e: React.MouseEvent) => void }) {
  return (
    <div
      className={`flip-card w-full aspect-4/3 sm:aspect-3/2 cursor-pointer ${isFlipped ? 'flipped' : ''}`}
      onClick={onFlip}
    >
      <div className="flip-card-inner w-full h-full relative">
        <div className="flip-card-front absolute inset-0 glass-card rounded-2xl p-6 md:p-10 flex flex-col justify-between h-full bg-card/80 border-border shadow-md">
          <div className="flex justify-between items-center w-full">
            <p className="text-xs uppercase tracking-widest text-muted-foreground font-semibold">Question</p>
            {onEdit && (
              <button onClick={onEdit} className="p-2 -mt-2 -mr-2 text-muted-foreground hover:text-primary transition-colors z-10 rounded-full hover:bg-card">
                <Edit2 className="w-4 h-4" />
              </button>
            )}
          </div>
          <p className="font-serif text-2xl md:text-3xl text-foreground text-center leading-relaxed overflow-y-auto scrollbar-hide">
            {card.question}
          </p>
          <p className="text-sm text-muted-foreground text-center flex items-center justify-center gap-2">
            <Sparkles className="w-4 h-4 text-primary/70 animate-pulse" /> Click to reveal answer
          </p>
        </div>
        <div className="flip-card-back absolute inset-0 glass-card rounded-2xl p-6 md:p-10 flex flex-col justify-between h-full border border-primary/30 bg-card/90 shadow-xl shadow-primary/10">
          <p className="text-xs uppercase tracking-widest text-primary font-semibold">Answer</p>
          <p className="font-serif text-xl md:text-2xl text-foreground text-center leading-relaxed overflow-y-auto scrollbar-hide">
            {card.answer}
          </p>
          <p className="text-sm text-muted-foreground text-center">How did you do?</p>
        </div>
      </div>
    </div>
  )
}
