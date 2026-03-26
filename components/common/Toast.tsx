"use client";
import React, { useEffect } from "react";

// For a real production app we'd use sonner or react-hot-toast,
// but to meet the structure requirement easily, here is a localized toast.

export function Toast({ message, type = "info", onClose }: { message: string, type?: "success" | "error" | "info", onClose: () => void }) {
  useEffect(() => {
    const timer = setTimeout(() => onClose(), 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const bgStyles = {
    success: "bg-green/10 border-green text-green",
    error: "bg-red/10 border-red text-red",
    info: "bg-blue/10 border-blue text-blue"
  };

  return (
    <div className={`fixed bottom-24 md:bottom-10 left-1/2 transform -translate-x-1/2 px-4 py-3 rounded-lg border shadow-lg z-50 animate-in slide-in-from-bottom-5 ${bgStyles[type]}`}>
      {message}
    </div>
  );
}
