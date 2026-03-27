'use client'

import { Sparkles, Edit2 } from 'lucide-react'

export function Flashcard({ 
  card, 
  isFlipped, 
  onFlip, 
  onEdit,
  colorVariant = 'purple'
}: { 
  card: any, 
  isFlipped: boolean, 
  onFlip: () => void, 
  onEdit?: (e: React.MouseEvent) => void,
  colorVariant?: 'mint' | 'purple' | 'pink' | 'blue'
}) {
  const getPastelClass = () => {
    switch (colorVariant) {
      case 'mint': return 'bg-pastel-mint'
      case 'pink': return 'bg-pastel-pink'
      case 'blue': return 'bg-pastel-blue'
      default: return 'bg-pastel-purple'
    }
  }

  return (
    <div
      className={`flip-card w-full aspect-4/3 sm:aspect-3/2 cursor-pointer ${isFlipped ? 'flipped' : ''}`}
      onClick={onFlip}
    >
      <div className="flip-card-inner w-full h-full relative">
        <div className={`flip-card-front absolute inset-0 ${getPastelClass()} rounded-3xl p-6 md:p-10 flex flex-col justify-between h-full shadow-sm backdrop-blur-[2px]`}>
          <div className="flex justify-between items-center w-full">
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Question</p>
            {onEdit && (
              <button onClick={onEdit} className="p-2 -mt-2 -mr-2 text-muted-foreground hover:text-primary transition-colors z-10 rounded-full hover:bg-white/20">
                <Edit2 className="w-4 h-4" />
              </button>
            )}
          </div>
          <p className="font-serif text-2xl md:text-3xl font-bold text-foreground text-center leading-relaxed overflow-y-auto scrollbar-hide">
            {card.question}
          </p>
          <p className="text-[10px] text-muted-foreground text-center font-bold uppercase tracking-widest flex items-center justify-center gap-2">
            <Sparkles className="w-3.5 h-3.5 text-primary/70 animate-pulse" /> Click to reveal answer
          </p>
        </div>
        <div className={`flip-card-back absolute inset-0 ${getPastelClass()} rounded-3xl p-6 md:p-10 flex flex-col justify-between h-full shadow-xl shadow-primary/5 backdrop-blur-xs border-primary/20`}>
          <p className="text-[10px] uppercase tracking-widest text-primary font-bold">Answer</p>
          <p className="font-serif text-xl md:text-2xl font-bold text-foreground text-center leading-relaxed overflow-y-auto scrollbar-hide">
            {card.answer}
          </p>
          <p className="text-[10px] text-muted-foreground text-center font-bold uppercase tracking-widest">How did you do?</p>
        </div>
      </div>
    </div>
  )
}
