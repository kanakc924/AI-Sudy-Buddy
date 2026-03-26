"use client";

import React from "react";
import { ScoreCircle } from "../common/ScoreCircle";
import { Button } from "../common/Button";
import { ArrowLeft, BookOpen } from "lucide-react";
import Link from "next/link";

interface QuizResultsProps {
  correct: number;
  total: number;
  topicId: string;
}

export function QuizResults({ correct, total, topicId }: QuizResultsProps) {
  const score = total > 0 ? Math.round((correct / total) * 100) : 0;
  
  let feedback = "Good effort! Keep studying.";
  if (score >= 90) feedback = "Outstanding! You've mastered this.";
  else if (score >= 70) feedback = "Great job! You have a solid grasp.";

  return (
    <div className="w-full max-w-2xl mx-auto glass rounded-2xl p-8 sm:p-12 text-center animate-in zoom-in-95 duration-500">
      <h2 className="text-3xl font-playfair font-bold mb-2 text-text">Quiz Complete!</h2>
      <p className="text-muted mb-8">{feedback}</p>
      
      <div className="flex justify-center mb-10 relative">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-accent rounded-full mix-blend-screen filter blur-[50px] opacity-20"></div>
        <ScoreCircle score={score} size={180} strokeWidth={14} />
      </div>

      <div className="flex justify-center gap-12 mb-10 border-t border-b border-border py-6 my-8">
         <div className="text-center">
            <p className="text-3xl font-dm-mono font-bold text-text">{correct}</p>
            <p className="text-xs font-semibold text-muted uppercase tracking-wider mt-1">Correct</p>
         </div>
         <div className="text-center">
            <p className="text-3xl font-dm-mono font-bold text-text">{total}</p>
            <p className="text-xs font-semibold text-muted uppercase tracking-wider mt-1">Total</p>
         </div>
      </div>

      <div className="flex flex-col sm:flex-row justify-center gap-4">
         <Link href={`/topics/${topicId}`} className="w-full sm:w-auto">
            <Button className="w-full gap-2 text-md h-12">
               <BookOpen size={18} /> Review Notes
            </Button>
         </Link>
         <Link href="/dashboard" className="w-full sm:w-auto">
            <Button variant="outline" className="w-full gap-2 text-md h-12">
               <ArrowLeft size={18} /> Back Dashboard
            </Button>
         </Link>
      </div>
    </div>
  );
}
