"use client";

import React from "react";
import Link from "next/link";
import { Play, FileText, Image as ImageIcon, Trash2, ArrowRight } from "lucide-react";
import { Topic } from "../../hooks/useTopics";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface TopicCardProps {
  topic: Topic;
  onDelete: (id: string) => void;
}

export function TopicCard({ topic, onDelete }: TopicCardProps) {
  return (
    <Card className="group border-border bg-card hover:border-primary/40 transition-all duration-300 flex flex-col shadow-sm hover:shadow-xl hover:shadow-primary/5">
      <CardHeader className="p-5 pb-3">
        <div className="flex justify-between items-start">
          <CardTitle className="font-serif text-xl font-bold group-hover:text-primary transition-colors line-clamp-2 pr-6 leading-tight">
            <Link href={`/topics/${topic._id}`}>
              {topic.title}
            </Link>
          </CardTitle>
          <button 
            onClick={(e: any) => {
              e.preventDefault();
              if (confirm("Are you sure you want to delete this topic?")) onDelete(topic._id);
            }}
            className="p-1.5 -mr-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors shrink-0"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </CardHeader>
      
      <CardContent className="p-5 pt-0 flex-1">
        <p className="text-muted-foreground text-sm line-clamp-2 mb-6 leading-relaxed min-h-10">
          {topic.notes ? topic.notes : "No notes yet. Click to add or upload content."}
        </p>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <Badge variant="secondary" className="bg-primary/5 text-primary border-primary/10 px-2 py-0 h-5 text-[10px] font-bold uppercase tracking-wider">
              <FileText size={10} className="mr-1" /> Notes
            </Badge>
          </div>
          {topic.sourceImages?.length > 0 && (
            <div className="flex items-center gap-1.5">
              <Badge variant="secondary" className="bg-emerald-500/5 text-emerald-500 border-emerald-500/10 px-2 py-0 h-5 text-[10px] font-bold uppercase tracking-wider">
                <ImageIcon size={10} className="mr-1" /> {topic.sourceImages.length} Images
              </Badge>
            </div>
          )}
        </div>
      </CardContent>

      <CardFooter className="p-3 border-t border-border/50 flex gap-2 bg-muted/20">
         <Link href={`/topics/${topic._id}`} className="flex-1">
            <Button variant="ghost" size="sm" className="w-full text-[10px] uppercase tracking-widest font-bold text-muted-foreground hover:bg-card hover:text-foreground h-9">
               Manage
            </Button>
         </Link>
         <Link href={`/topics/${topic._id}/flashcards`} className="flex-1">
            <Button size="sm" className="w-full gap-2 text-[10px] uppercase tracking-widest font-bold rounded-xl bg-primary/10 hover:bg-primary/20 text-primary h-9 shadow-sm">
               <Play size={12} fill="currentColor" /> Study
            </Button>
         </Link>
      </CardFooter>
    </Card>
  );
}
