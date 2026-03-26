"use client";

import React from "react";
import clsx from "clsx";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: { value: number; label: string };
  isAccent?: boolean;
}

export function StatCard({ title, value, icon, trend, isAccent }: StatCardProps) {
  return (
    <div className={clsx(
      "p-6 rounded-3xl transition-all hover:-translate-y-1 hover:shadow-xl relative overflow-hidden",
      isAccent 
        ? "bg-accent text-black shadow-[0_0_30px_var(--accent-glow)] border-none" 
        : "glass border border-border2"
    )}>
      <div className="flex justify-between items-start mb-4 relative z-10">
        <div className={clsx("p-3 rounded-xl", isAccent ? "bg-black/10 text-black" : "bg-surface2 text-muted")}>
          {icon}
        </div>
        {trend && (
          <div className={clsx("text-xs font-bold px-3 py-1.5 rounded-full shadow-sm", 
            isAccent ? "bg-black text-accent" : (trend.value >= 0 ? "bg-green/10 text-green border border-green/20" : "bg-red/10 text-red border border-red/20"))}>
            {trend.value >= 0 ? "+" : ""}{trend.value}%
          </div>
        )}
      </div>
      <div className="relative z-10">
        <h3 className={clsx("text-sm font-semibold mb-2", isAccent ? "text-black/70" : "text-muted")}>{title}</h3>
        <p className={clsx("text-4xl font-dm-mono font-bold tracking-tight", isAccent ? "text-black" : "text-text")}>{value}</p>
      </div>
      {trend && <p className={clsx("text-xs mt-3 relative z-10 font-medium", isAccent ? "text-black/60" : "text-muted")}>{trend.label}</p>}
      
      {/* Background glow decoration */}
      {isAccent && <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-white/20 blur-2xl rounded-full pointer-events-none"></div>}
    </div>
  );
}
