"use client";

import React from "react";
import { QuizQuestion as QuizQuestionType } from "../../hooks/useQuizSession";
import { CheckCircle2, XCircle, Info } from "lucide-react";
import clsx from "clsx";

interface QuizQuestionProps {
  question: QuizQuestionType;
  selectedAnswer: number | null;
  onSelect: (index: number) => void;
  onNext: () => void;
}

export function QuizQuestion({ question, selectedAnswer, onSelect, onNext }: QuizQuestionProps) {
  const isAnswered = selectedAnswer !== null;

  return (
    <div className="w-full max-w-3xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="glass p-8 sm:p-10 rounded-2xl border-accent/20 shadow-lg">
        <h2 className="text-xl sm:text-2xl font-playfair font-semibold text-text leading-relaxed">
          {question.question}
        </h2>
      </div>

      <div className="space-y-3">
        {question.options.map((option, index) => {
          const isSelected = selectedAnswer === index;
          const isCorrect = isAnswered && index === question.correctIndex;
          const isWrongSelection = isSelected && !isCorrect;

          return (
            <button
              key={index}
              onClick={() => !isAnswered && onSelect(index)}
              disabled={isAnswered}
              className={clsx(
                "w-full p-5 sm:p-6 rounded-xl border text-left flex items-center justify-between transition-all duration-200",
                !isAnswered ? "bg-surface border-border hover:border-accent hover:bg-accent/5 hover:translate-x-1 cursor-pointer shadow-sm active:scale-[0.99]" : "",
                isCorrect ? "bg-green/10 border-green text-text shadow-[0_0_15px_rgba(74,222,128,0.15)]" : "",
                isWrongSelection ? "bg-red/10 border-red text-text" : "",
                isAnswered && !isCorrect && !isWrongSelection ? "bg-surface opacity-50 border-border" : ""
              )}
            >
              <span className="font-sans text-lg">{option}</span>
              {isCorrect && <CheckCircle2 className="text-green w-6 h-6 shrink-0" />}
              {isWrongSelection && <XCircle className="text-red w-6 h-6 shrink-0" />}
            </button>
          );
        })}
      </div>

      {isAnswered && (
        <div className="pt-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
           <div className="bg-surface2/80 p-6 rounded-xl border border-border flex gap-4">
              <div className="text-accent shrink-0 mt-1"><Info size={24} /></div>
              <div>
                 <h4 className="font-semibold text-text mb-1 tracking-wide uppercase text-sm text-muted">Explanation</h4>
                 <p className="text-text leading-relaxed font-sans">{question.explanation}</p>
              </div>
           </div>
           
           <div className="mt-8 flex justify-end">
              <button 
                 onClick={onNext}
                 className="px-8 py-4 bg-accent text-white font-bold rounded-xl hover:bg-accent/90 shadow-[0_0_20px_var(--accent-glow)] transition-all active:scale-95"
              >
                 Continue
              </button>
           </div>
        </div>
      )}
    </div>
  );
}
