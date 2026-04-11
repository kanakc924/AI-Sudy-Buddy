"use client";

import React from "react";
import { ScoreCircle } from "@/components/score-circle";
import { Button } from "@/components/ui/button";
import { ArrowLeft, BookOpen } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";

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
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="w-full max-w-2xl mx-auto bg-card border border-border rounded-3xl p-8 sm:p-12 text-center shadow-2xl relative overflow-hidden"
    >
      <div className="absolute top-0 left-0 w-full h-1 bg-linear-to-r from-transparent via-primary/50 to-transparent"></div>
      
      <h2 className="text-4xl font-serif font-bold mb-3 text-foreground tracking-tight">Quiz Complete!</h2>
      <p className="text-muted-foreground mb-10 text-lg">{feedback}</p>
      
      <div className="flex justify-center mb-12 relative">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-primary rounded-full mix-blend-screen filter blur-[60px] opacity-10"></div>
        <ScoreCircle score={score} size={200} strokeWidth={12} />
      </div>

      <div className="flex justify-center gap-16 mb-12 border-t border-b border-border/50 py-8 my-8 bg-muted/20 rounded-2xl">
         <div className="text-center">
            <p className="text-4xl font-mono font-bold text-foreground tabular-nums">{correct}</p>
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-2 bg-muted px-3 py-1 rounded-full">Correct</p>
         </div>
         <div className="text-center">
            <p className="text-4xl font-mono font-bold text-foreground tabular-nums">{total}</p>
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-2 bg-muted px-3 py-1 rounded-full">Total</p>
         </div>
      </div>

      <div className="flex flex-col sm:flex-row justify-center gap-4">
         <Link href={`/topics/${topicId}`} className="w-full sm:w-auto">
            <Button className="w-full gap-2 h-12 px-8 rounded-xl font-bold bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20">
               <BookOpen size={18} /> Review Notes
            </Button>
         </Link>
         <Link href="/dashboard" className="w-full sm:w-auto">
            <Button variant="outline" className="w-full gap-2 h-12 px-8 rounded-xl font-bold border-border bg-transparent text-muted-foreground hover:bg-muted">
               <ArrowLeft size={18} /> Back Dashboard
            </Button>
         </Link>
      </div>
    </motion.div>
  );
}
