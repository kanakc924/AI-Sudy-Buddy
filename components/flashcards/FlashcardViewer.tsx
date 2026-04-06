"use client";

import React, { useState, useEffect } from "react";
import { Flashcard } from "../../hooks/useFlashcardSession";
import { RotateCcw } from "lucide-react";
import clsx from "clsx";

interface FlashcardViewerProps {
  card: Flashcard;
  onAnswer: (correct: boolean) => void;
}

export function FlashcardViewer({ card, onAnswer }: FlashcardViewerProps) {
  const [isFlipped, setIsFlipped] = useState(false);
  const [animateState, setAnimateState] = useState("");

  // Reset flip state when card changes
  useEffect(() => {
    setIsFlipped(false);
    setAnimateState("slide-in-right");
  }, [card._id]);

  const handleAnswer = (correct: boolean) => {
    setAnimateState(correct ? "slide-out-right" : "slide-out-left");
    setTimeout(() => {
       onAnswer(correct);
    }, 300);
  };

  return (
    <div className="w-full max-w-2xl mx-auto flex flex-col items-center gap-8 perspective-1000">
      
      {/* 3D Flip Card */}
      <div 
        className={clsx(
          "relative w-full aspect-4/3 sm:aspect-3/2 cursor-pointer preserve-3d transition-transform duration-500 ease-out z-10",
          isFlipped ? "rotate-y-180" : "",
          animateState === "slide-in-right" ? "animate-in slide-in-from-right-8 fade-in duration-300" :
          animateState === "slide-out-right" ? "animate-out slide-out-to-right-12 fade-out duration-300" :
          animateState === "slide-out-left" ? "animate-out slide-out-to-left-12 fade-out duration-300" : ""
        )}
        onClick={() => setIsFlipped(!isFlipped)}
      >
        {/* Front */}
        <div className="absolute inset-0 backface-hidden glass border-accent/20 rounded-2xl flex flex-col items-center justify-center p-8 xs:p-12 text-center shadow-[0_10px_40px_var(--accent-dim)]">
           <h2 className="text-2xl sm:text-3xl font-playfair font-semibold text-text leading-tight">{card.question}</h2>
           <p className="absolute bottom-6 text-sm text-muted flex items-center gap-2">
             <RotateCcw size={16}/> Click to flip
           </p>
        </div>
        
        {/* Back */}
        <div className="absolute inset-0 backface-hidden glass border-green/30 rounded-2xl flex flex-col items-center justify-center p-8 xs:p-12 text-center rotate-y-180 bg-surface/95 shadow-[0_10px_40px_rgba(74,222,128,0.1)]">
           <div className="text-xl sm:text-2xl font-sans text-text leading-relaxed overflow-y-auto max-h-full scrollbar-hide">
              {card.answer}
           </div>
        </div>
      </div>

      {/* Answer Controls - Only visible when flipped */}
      <div className={clsx(
         "flex gap-4 w-full justify-center transition-all duration-300",
         isFlipped ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none"
      )}>
         <button 
           onClick={() => handleAnswer(false)}
           className="px-8 py-3 lg:px-12 lg:py-4 rounded-xl font-bold bg-surface2 border border-red/30 text-red hover:bg-red/10 hover:border-red/50 hover:shadow-[0_0_20px_rgba(239,68,68,0.2)] hover:-translate-y-1 transition-all duration-200 active:scale-95"
         >
            Missed It
         </button>
         <button 
           onClick={() => handleAnswer(true)}
           className="px-8 py-3 lg:px-12 lg:py-4 rounded-xl font-bold bg-surface2 border border-green/30 text-green hover:bg-green/10 hover:border-green/50 hover:shadow-[0_0_20px_rgba(34,197,94,0.2)] hover:-translate-y-1 transition-all duration-200 active:scale-95"
         >
            Got It
         </button>
      </div>

      {/* Tailwind specific custom CSS for 3D flip embedded inline for simplicity, 
          Ideally in globals.css, but we will add them here or global */}
      <style dangerouslySetInnerHTML={{__html: `
        .perspective-1000 { perspective: 1000px; }
        .preserve-3d { transform-style: preserve-3d; }
        .backface-hidden { backface-visibility: hidden; }
        .rotate-y-180 { transform: rotateY(180deg); }
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}} />
    </div>
  );
}
