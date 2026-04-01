"use client";

import React from "react";
import { usePathname, useRouter } from "next/navigation";
import { Menu, User, LogOut } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { ThemeToggle } from "@/components/theme-toggle";

interface NavbarProps {
  onMenuClick: () => void;
}

export function Navbar({ onMenuClick }: NavbarProps) {
  const pathname = usePathname();
  const router = useRouter();
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
            <div className="absolute right-0 mt-3 w-80 bg-[#252833] border border-[#323645] rounded-3xl shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-200 overflow-hidden">
              {/* Header Section */}
              <div className="p-6 flex flex-col items-center text-center space-y-3">
                <div className="w-20 h-20 rounded-full bg-primary flex items-center justify-center text-3xl font-bold text-primary-foreground shadow-lg shadow-primary/20">
                  {user?.name?.charAt(0).toUpperCase() || "U"}
                </div>
                <div className="space-y-1">
                  <h3 className="text-xl font-semibold text-white">Hi, {user?.name?.split(' ')[0]}!</h3>
                  <p className="text-sm text-muted-foreground">{user?.email}</p>
                </div>
                
                {/* Manage Account Pill Button */}
                <button 
                  onClick={() => {
                    router.push('/settings');
                    setDropdownOpen(false);
                  }}
                  className="mt-4 px-6 py-2 rounded-full border border-[#323645] text-sm font-medium text-white hover:bg-[#323645] hover:border-[#8F8DF2]/50 transition-all active:scale-95"
                >
                  Manage Account
                </button>
              </div>

              {/* Footer Section */}
              <div className="border-t border-[#323645] p-2 bg-[#1C1E26]/50">
                <button 
                  onClick={logout}
                  className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-2xl text-sm font-medium text-red-400 hover:bg-red-400/10 transition-colors group"
                >
                  <div className="p-2 rounded-lg bg-red-400/10 group-hover:bg-red-400/20 transition-colors">
                    <LogOut size={18} />
                  </div>
                  Sign out
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </header>
  );
}
