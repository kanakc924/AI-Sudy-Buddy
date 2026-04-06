"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, BookOpen, Settings, Zap, X, BrainCircuit, Brain, AlertTriangle } from "lucide-react";
import { useAuthContext } from "../../context/AuthContext";
import { Progress } from "../ui/progress";

import clsx from "clsx";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  // Assume we might fetch streak or pass it down
  streak?: number;
}

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/subjects", label: "Subjects", icon: BookOpen },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function Sidebar({ isOpen, onClose, streak = 0 }: SidebarProps) {
  const pathname = usePathname();
  const { user } = useAuthContext();

  const isHotStreak = streak > 5;

  return (
    <>
      {/* Mobile/Tablet Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={clsx(
          "fixed inset-y-0 left-0 z-50 w-72 lg:w-60 bg-surface border-r border-border flex flex-col transition-transform duration-300 ease-in-out",
          isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        {/* Header */}
        <div className="h-16 flex items-center justify-between px-6 border-b border-border text-accent font-playfair font-bold text-xl">
          <div className="flex items-center gap-2">
            <BrainCircuit className="w-6 h-6" />
            <span>Study Buddy</span>
          </div>
          <button className="lg:hidden text-muted hover:text-text" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = pathname.startsWith(item.href);
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => onClose()} // Close on navigation for mobile
                className={clsx(
                  "flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-all group",
                  isActive
                    ? "bg-accent-dim text-accent border-l-2 border-accent"
                    : "text-muted hover:bg-surface2 hover:text-text"
                )}
              >
                <Icon size={20} className={clsx(isActive ? "text-accent" : "text-muted group-hover:text-text")} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Footer info (AI Usage, Streak & User) */}
        <div className="p-4 border-t border-border space-y-4">
          {/* AI Usage Indicator */}
          {user && (
            <div className="px-4 py-3 rounded-lg bg-surface2 border border-border/50">
              <div className="flex justify-between items-center mb-2">
                <div className="flex items-center gap-2">
                  <Brain size={14} className="text-primary" />
                  <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">AI Power</span>
                </div>
                <span className="text-[10px] font-bold text-foreground">
                  {user.aiUsageToday || 0}/{user.aiDailyLimit || 200}
                </span>
              </div>
              <Progress 
                value={Math.min(100, ((user.aiUsageToday || 0) / (user.aiDailyLimit || 200)) * 100)} 
                className={clsx(
                  "h-1.5",
                  (user.aiUsageToday || 0) / (user.aiDailyLimit || 200) >= 0.8 ? "[&>div]:bg-destructive" : "[&>div]:bg-primary"
                )}
              />
              {(user.aiUsageToday || 0) / (user.aiDailyLimit || 200) >= 0.8 && (
                <div className="mt-1.5 flex items-center gap-1">
                  <AlertTriangle size={10} className="text-destructive" />
                  <span className="text-[9px] font-medium text-destructive">Nearing daily limit</span>
                </div>
              )}
            </div>
          )}

          <div className="mb-0">
            <div className={clsx(
              "flex items-center justify-between px-4 py-3 rounded-lg bg-surface2",
              isHotStreak ? "animate-pulse shadow-[0_0_10px_var(--gold)] border border-gold/30" : ""
            )}>
              <div className="flex items-center gap-2">
                <Zap size={18} className="text-gold" />
                <span className="font-semibold text-sm">Streak</span>
              </div>
              <span className="font-dm-mono text-gold font-bold">{streak} days</span>
            </div>
          </div>
          <div className="flex items-center justify-between px-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-accent text-black flex items-center justify-center font-bold">
                {user?.name?.charAt(0).toUpperCase() || "U"}
              </div>
              <div className="flex flex-col overflow-hidden">
                <span className="text-sm font-semibold text-text truncate">{user?.name || "User"}</span>
                <span className="text-xs text-muted truncate">{user?.email}</span>
              </div>
            </div>

          </div>
        </div>
      </aside>
    </>
  );
}
