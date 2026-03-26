"use client";

import React from "react";
import Link from "next/link";
import { Play, FileText, Image as ImageIcon, Trash2 } from "lucide-react";
import { Topic } from "../../hooks/useTopics";

interface TopicCardProps {
  topic: Topic;
  onDelete: (id: string) => void;
}

export function TopicCard({ topic, onDelete }: TopicCardProps) {
  return (
    <div className="glass rounded-xl overflow-hidden group hover:border-accent/40 transition-colors flex flex-col">
      <div className="p-5 flex-1">
        <div className="flex justify-between items-start mb-3">
          <h3 className="text-lg font-playfair font-semibold group-hover:text-accent transition-colors line-clamp-2 pr-6">
            <Link href={`/topics/${topic._id}`}>
              {topic.title}
            </Link>
          </h3>
          <button 
            onClick={(e: any) => {
              e.preventDefault();
              if (confirm("Are you sure you want to delete this topic?")) onDelete(topic._id);
            }}
            className="p-1.5 -mr-1.5 rounded-md text-muted hover:text-red hover:bg-red/10 transition-colors shrink-0"
          >
            <Trash2 size={16} />
          </button>
        </div>
        
        <p className="text-muted text-sm line-clamp-2 mb-4">
          {topic.notes ? topic.notes : "No notes yet. Click to add or upload content."}
        </p>

        <div className="flex items-center gap-3 text-xs text-muted font-medium mb-1">
          <div className="flex items-center gap-1">
            <FileText size={14} className={topic.notes ? "text-blue" : ""} /> 
            <span>Notes</span>
          </div>
          <div className="flex items-center gap-1">
            <ImageIcon size={14} className={topic.sourceImages?.length > 0 ? "text-green" : ""} />
            <span>{topic.sourceImages?.length || 0} Images</span>
          </div>
        </div>
      </div>

      <div className="bg-surface2/50 p-3 border-t border-border flex justify-between items-center mt-auto gap-2">
         <Link href={`/topics/${topic._id}`} className="flex-1 py-2 text-center text-sm font-medium rounded-md hover:bg-surface2 text-text transition-colors">
            Manage
         </Link>
         <Link href={`/topics/${topic._id}/flashcards`} className="flex-1 py-2 flex items-center justify-center gap-2 text-sm font-medium rounded-md bg-accent/10 hover:bg-accent/20 text-accent transition-colors">
            <Play size={14} /> Study
         </Link>
      </div>
    </div>
  );
}
