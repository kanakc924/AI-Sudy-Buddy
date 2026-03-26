"use client";

import React from "react";
import { AuthProvider } from "@/context/AuthContext";
import { ThemeProvider } from "../../context/ThemeContext";
import { Toaster } from "@/components/ui/sonner";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <AuthProvider>
        {children}
        <Toaster />
      </AuthProvider>
    </ThemeProvider>
  );
}
