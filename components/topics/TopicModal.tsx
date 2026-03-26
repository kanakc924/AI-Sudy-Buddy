"use client";

import React, { useState } from "react";
import { Modal } from "../common/Modal";
import { Button } from "../common/Button";

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
    <Modal isOpen={isOpen} onClose={onClose} title="Create New Topic">
      <form id="createTopicForm" onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-muted mb-1">Topic Title <span className="text-red">*</span></label>
          <input
            autoFocus
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full bg-surface2 border border-border2 focus:border-accent text-text rounded-lg px-4 py-3 outline-none transition-colors"
            placeholder="e.g. Cell Division, The French Revolution..."
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-muted mb-1">Initial Notes (Optional)</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full bg-surface2 border border-border2 focus:border-accent text-text rounded-lg px-4 py-3 outline-none transition-colors min-h-[120px] resize-y"
            placeholder="Paste your raw notes here. You can also upload files later."
          />
        </div>
      </form>
      <div className="mt-6 flex justify-end gap-3">
        <Button variant="ghost" onClick={onClose}>Cancel</Button>
        <Button type="submit" form="createTopicForm" isLoading={isLoading}>Create Topic</Button>
      </div>
    </Modal>
  );
}
