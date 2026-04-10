"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, BookOpen, Settings } from "lucide-react";
import clsx from "clsx";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/subjects", label: "Subjects", icon: BookOpen },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function MobileBottomNav() {
  const pathname = usePathname();

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-surface border-t border-border2 z-40 flex items-center justify-evenly pb-safe no-print">
      {navItems.map((item) => {
        const isActive = pathname.startsWith(item.href);
        const Icon = item.icon;

        return (
          <Link
            key={item.href}
            href={item.href}
            className="flex flex-col items-center justify-center w-full h-full min-w-[44px] min-h-[44px] group"
          >
            <Icon 
              size={20} 
              className={clsx(
                "mb-1 transition-colors", 
                isActive ? "text-accent" : "text-muted group-hover:text-text"
              )} 
            />
            <span className={clsx(
              "text-[10px] font-medium transition-colors",
              isActive ? "text-accent" : "text-muted group-hover:text-text"
            )}>
              {item.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
