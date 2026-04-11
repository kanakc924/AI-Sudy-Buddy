"use client";

import React, { useState } from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription, 
  DialogFooter 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";

interface TopicModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { title: string; notes?: string }) => Promise<void>;
  isLoading?: boolean;
}

export function TopicModal({ isOpen, onClose, onSubmit, isLoading }: TopicModalProps) {
  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit({ title, notes });
    if (!isLoading) {
      setTitle("");
      setNotes("");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[425px] bg-card border-border shadow-2xl rounded-2xl">
        <DialogHeader>
          <DialogTitle className="font-serif text-2xl font-bold">Create New Topic</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Add a new topic to your subject. You can add notes or upload documents later.
          </DialogDescription>
        </DialogHeader>
        
        <form id="createTopicForm" onSubmit={handleSubmit} className="space-y-6 pt-4">
          <div className="space-y-2">
            <Label htmlFor="title" className="text-sm font-semibold tracking-tight">
              Topic Title <span className="text-destructive">*</span>
            </Label>
            <Input
              id="title"
              autoFocus
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="bg-muted/30 border-border focus:ring-primary/50 rounded-xl"
              placeholder="e.g. Cell Division, The French Revolution..."
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="notes" className="text-sm font-semibold tracking-tight">
              Initial Notes (Optional)
            </Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="min-h-[120px] bg-muted/30 border-border focus:ring-primary/50 rounded-xl resize-none"
              placeholder="Paste your raw notes here..."
            />
          </div>
        </form>

        <DialogFooter className="pt-6">
          <Button 
            variant="ghost" 
            onClick={onClose}
            className="rounded-xl text-muted-foreground"
          >
            Cancel
          </Button>
          <Button 
            type="submit" 
            form="createTopicForm" 
            disabled={isLoading}
            className="rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold px-6 shadow-lg shadow-primary/20"
          >
            {isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
            Create Topic
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
