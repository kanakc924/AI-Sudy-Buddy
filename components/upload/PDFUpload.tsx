"use client";

import React, { useRef, useState } from "react";
import { FileText, UploadCloud } from "lucide-react";

interface PDFUploadProps {
  onUpload: (file: File) => Promise<void>;
  isLoading: boolean;
}

export function PDFUpload({ onUpload, isLoading }: PDFUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      await onUpload(e.dataTransfer.files[0]);
    }
  };

  const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      await onUpload(e.target.files[0]);
    }
  };

  return (
    <div 
      className={`relative w-full p-6 border-2 border-dashed rounded-xl text-center transition-colors ${
        dragActive ? "border-blue bg-blue/10" : "border-border2 hover:border-blue hover:bg-surface2"
      } ${isLoading ? "opacity-50 pointer-events-none" : ""}`}
      onDragEnter={handleDrag}
      onDragLeave={handleDrag}
      onDragOver={handleDrag}
      onDrop={handleDrop}
      onClick={() => fileInputRef.current?.click()}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept="application/pdf, text/plain"
        onChange={handleChange}
        className="hidden"
      />
      <div className="flex flex-col items-center justify-center gap-2 cursor-pointer">
        <div className="p-3 bg-surface2 text-blue rounded-full">
          {isLoading ? <UploadCloud className="animate-bounce" /> : <FileText />}
        </div>
        <p className="text-sm font-medium">Click or drag PDF/TXT to upload</p>
        <p className="text-xs text-muted">Text will be appended to your notes</p>
      </div>
    </div>
  );
}
