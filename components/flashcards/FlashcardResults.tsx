"use client";

import React from "react";
import { ScoreCircle } from "@/components/score-circle";
import { Button } from "@/components/ui/button";
import { RotateCcw, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";

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
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="w-full max-w-2xl mx-auto bg-card border border-border rounded-3xl p-8 sm:p-12 text-center shadow-2xl relative overflow-hidden"
    >
      <div className="absolute top-0 left-0 w-full h-1 bg-linear-to-r from-transparent via-primary/50 to-transparent"></div>
      
      <h2 className="text-4xl font-serif font-bold mb-3 text-foreground tracking-tight">Session Complete!</h2>
      <p className="text-muted-foreground mb-10 text-lg">Great job dedicating time to your studies.</p>
      
      <div className="flex justify-center mb-10 relative">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-primary rounded-full mix-blend-screen filter blur-[60px] opacity-10"></div>
        <ScoreCircle score={score} size={180} strokeWidth={12} />
      </div>

      <div className="flex justify-center gap-16 mb-12 border-t border-b border-border/50 py-8 my-8 bg-muted/20 rounded-2xl">
         <div className="text-center">
            <p className="text-4xl font-mono font-bold text-emerald-500 tabular-nums">{correct}</p>
            <p className="text-[10px] font-bold uppercase tracking-widest mt-2 bg-emerald-500/10 text-emerald-600 px-3 py-1 rounded-full border border-emerald-500/20">Known</p>
         </div>
         <div className="text-center">
            <p className="text-4xl font-mono font-bold text-destructive tabular-nums">{missed}</p>
            <p className="text-[10px] font-bold uppercase tracking-widest mt-2 bg-destructive/10 text-destructive px-3 py-1 rounded-full border border-destructive/20">Review</p>
         </div>
      </div>

      <div className="flex flex-col sm:flex-row justify-center gap-4">
         <Button 
            onClick={onRestart} 
            className="w-full sm:w-auto gap-2 h-12 px-8 rounded-xl font-bold bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20"
         >
            <RotateCcw size={18} /> Review Again
         </Button>
         <Link href={`/topics/${topicId}`} className="w-full sm:w-auto">
            <Button 
               variant="outline" 
               className="w-full gap-2 h-12 px-8 rounded-xl font-bold border-border bg-transparent text-muted-foreground hover:bg-muted"
            >
               <ArrowLeft size={18} /> Back to Topic
            </Button>
         </Link>
      </div>
    </motion.div>
  );
}
