"use client";

import React from "react";
import { ScoreCircle } from "../common/ScoreCircle";
import { Button } from "../common/Button";
import { RotateCcw, ArrowLeft } from "lucide-react";
import Link from "next/link";

interface FlashcardResultsProps {
  correct: number;
  missed: number;
  topicId: string;
  onRestart: () => void;
}

export function FlashcardResults({ correct, missed, topicId, onRestart }: FlashcardResultsProps) {
  const total = correct + missed;
  const score = total > 0 ? Math.round((correct / total) * 100) : 0;

  return (
    <div className="w-full max-w-2xl mx-auto glass rounded-2xl p-8 sm:p-12 text-center animate-in zoom-in-95 duration-500">
      <h2 className="text-3xl font-playfair font-bold mb-2 text-text">Session Complete!</h2>
      <p className="text-muted mb-8">Great job dedicating time to your studies.</p>
      
      <div className="flex justify-center mb-8 relative">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-accent rounded-full mix-blend-screen filter blur-[50px] opacity-20"></div>
        <ScoreCircle score={score} size={160} strokeWidth={12} />
      </div>

      <div className="flex justify-center gap-12 mb-10">
         <div className="text-center">
            <p className="text-3xl font-dm-mono font-bold text-green">{correct}</p>
            <p className="text-sm font-medium text-muted uppercase tracking-wider">Known</p>
         </div>
         <div className="text-center">
            <p className="text-3xl font-dm-mono font-bold text-red">{missed}</p>
            <p className="text-sm font-medium text-muted uppercase tracking-wider">Review</p>
         </div>
      </div>

      <div className="flex flex-col sm:flex-row justify-center gap-4">
         <Button onClick={onRestart} className="gap-2">
            <RotateCcw size={18} /> Review Again
         </Button>
         <Link href={`/topics/${topicId}`}>
            <Button variant="secondary" className="w-full sm:w-auto gap-2">
               <ArrowLeft size={18} /> Back to Topic
            </Button>
         </Link>
      </div>
    </div>
  );
}
