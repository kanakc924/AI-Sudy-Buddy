import React from "react";
import { FolderX, Plus } from "lucide-react";
import { Button } from "./Button";

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({ 
  icon = <FolderX className="w-12 h-12 text-muted" />, 
  title, 
  description, 
  actionLabel, 
  onAction 
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center w-full p-12 text-center rounded-xl border border-dashed border-border2 glass">
      <div className="mb-4 bg-surface2 p-4 rounded-full">
        {icon}
      </div>
      <h3 className="text-xl font-playfair font-semibold text-text mb-2">{title}</h3>
      <p className="text-muted max-w-sm mb-6">{description}</p>
      {actionLabel && onAction && (
        <Button onClick={onAction} variant="primary">
          <Plus className="w-4 h-4 mr-2" />
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
