'use client'

import React, { ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { BackButton } from './Buttons'

interface PageHeaderProps {
  title: string
  subtitle?: string
  backHref?: string
  backLabel?: string
  children?: ReactNode
  className?: string
  titleClassName?: string
}

/**
 * STANDARD PAGE HEADER
 * CONSISTENT LAYOUT FOR TITLES, NAVIGATION, AND ACTIONS
 */
export function PageHeader({
  title,
  subtitle,
  backHref,
  backLabel,
  children,
  className,
  titleClassName
}: PageHeaderProps) {
  const router = useRouter()

  return (
    <div className={cn("flex flex-col md:flex-row items-start md:items-center justify-between gap-6 border-b border-border/50 pb-8 mb-8", className)}>
      <div className="flex flex-col gap-2">
        {backHref && (
          <BackButton href={backHref} label={backLabel} />
        )}
        <div className="space-y-1">
          <h1 className={cn("font-serif text-3xl md:text-4xl font-bold tracking-tight text-foreground", titleClassName)}>
            {title}
          </h1>
          {subtitle && (
            <p className="text-sm text-muted-foreground font-medium uppercase tracking-widest mt-1">
              {subtitle}
            </p>
          )}
        </div>
      </div>

      {children && (
        <div className="flex items-center gap-3 w-full md:w-auto">
          {children}
        </div>
      )}
    </div>
  )
}
