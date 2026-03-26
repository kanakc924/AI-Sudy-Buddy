"use client";

import React from "react";
import { usePathname } from "next/navigation";
import { Menu, User, LogOut } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { ThemeToggle } from "@/components/theme-toggle";

interface NavbarProps {
  onMenuClick: () => void;
}

export function Navbar({ onMenuClick }: NavbarProps) {
  const pathname = usePathname();
  const { logout, user } = useAuth();
  const [dropdownOpen, setDropdownOpen] = React.useState(false);

  // Generate breadcrumb logic simply
  const paths = pathname.split("/").filter(Boolean);
  let pageTitle = "Dashboard";
  if (paths.length > 0) {
    pageTitle = paths[paths.length - 1].charAt(0).toUpperCase() + paths[paths.length - 1].slice(1);
    // Ignore IDs in breadcrumb for simplicity
    if (pageTitle.length === 24) pageTitle = "Details"; 
  }

  return (
    <header className="h-16 border-b border-border bg-surface/50 backdrop-blur top-0 sticky z-30 flex items-center justify-between px-4 lg:px-8">
      <div className="flex items-center gap-4">
        <button 
          onClick={onMenuClick}
          className="lg:hidden p-2 -ml-2 rounded-md text-muted hover:text-text hover:bg-surface2 transition-colors"
        >
          <Menu size={24} />
        </button>
        <h1 className="text-lg font-playfair font-semibold hidden sm:block">
          AI Study Buddy <span className="text-muted mx-2">/</span> <span className="text-accent">{pageTitle}</span>
        </h1>
        <h1 className="text-lg font-playfair font-semibold sm:hidden text-accent">
          {pageTitle}
        </h1>
      </div>

      <div className="relative flex items-center gap-4">
        <ThemeToggle />
        <button 
          onClick={() => setDropdownOpen(!dropdownOpen)}
          className="flex items-center gap-2 hover:bg-surface2 p-1.5 rounded-lg transition-colors"
        >
          <div className="w-8 h-8 rounded-full bg-surface2 border border-border flex items-center justify-center text-sm font-bold">
            {user?.name?.charAt(0).toUpperCase() || "U"}
          </div>
        </button>

        {dropdownOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setDropdownOpen(false)} />
            <div className="absolute right-0 mt-2 w-48 bg-surface border border-border2 rounded-lg shadow-xl py-1 z-50 animate-in fade-in zoom-in-95 duration-100">
              <div className="px-4 py-2 border-b border-border2">
                <p className="text-sm font-medium">{user?.name}</p>
                <p className="text-xs text-muted truncate">{user?.email}</p>
              </div>
              <button 
                onClick={logout}
                className="w-full text-left px-4 py-2 text-sm text-red hover:bg-red/10 flex items-center gap-2"
              >
                <LogOut size={16} />
                Logout
              </button>
            </div>
          </>
        )}
      </div>
    </header>
  );
}
