'use client'

import React from 'react'
import { Button, ButtonProps } from '@/components/ui/button'
import { LucideIcon, ArrowLeft, RefreshCw, Download, Brain, Sparkles, ChevronLeft, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import Link from 'next/link'

/**
 * PRIMARY BUTTON
 * LOADING-AWARE BUTTON WITH CONSISTENT SHADOW AND ROUNDING
 */
interface PrimaryButtonProps extends ButtonProps {
  loading?: boolean
  icon?: LucideIcon
  children?: React.ReactNode
}

export function PrimaryButton({ 
  children, 
  loading, 
  icon: Icon, 
  className, 
  disabled, 
  ...props 
}: PrimaryButtonProps) {
  return (
    <Button
      disabled={loading || disabled}
      className={cn(
        "bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl h-10 px-6 font-bold shadow-lg shadow-primary/20 transition-all hover:scale-[1.02] active:scale-[0.98]",
        className
      )}
      {...props}
    >
      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin mr-2" />
      ) : Icon ? (
        <Icon className="w-4 h-4 mr-2" />
      ) : null}
      {children}
    </Button>
  )
}

/**
 * ICON BUTTON
 * FOR COMPACT ACTIONS LIKE BACK, CLOSE, EDIT, DELETE
 */
interface IconButtonProps extends ButtonProps {
  icon: LucideIcon
}

export function IconButton({ icon: Icon, className, ...props }: IconButtonProps) {
  return (
    <Button
      variant="ghost"
      size="icon"
      className={cn(
        "h-9 w-9 rounded-xl border border-border bg-card/50 text-muted-foreground hover:text-primary transition-all hover:border-primary/50 hover:bg-card",
        className
      )}
      {...props}
    >
      <Icon className="w-4 h-4" />
    </Button>
  )
}

/**
 * BACK BUTTON
 * STANDARD NAVIGATION BACK BUTTON WITH "BACK TO..." TEXT
 */
interface BackButtonProps {
  href: string
  label?: string
  className?: string
}

export function BackButton({ href, label = "Back", className }: BackButtonProps) {
  return (
    <Link href={href}>
      <Button 
        variant="ghost" 
        className={cn(
          "px-0 text-muted-foreground hover:text-primary hover:bg-transparent -ml-2 font-medium transition-colors group", 
          className
        )}
      >
        <ChevronLeft className="w-4 h-4 mr-1 transition-transform group-hover:-translate-x-1" />
        {label}
      </Button>
    </Link>
  )
}

/**
 * REGENERATE BUTTON
 * SPECIFIC FOR AI CONTENT REFRESHING
 */
interface RegenerateButtonProps {
  onClick: () => void
  loading?: boolean
  label?: string
  className?: string
}

export function RegenerateButton({ onClick, loading, label = "Regenerate", className }: RegenerateButtonProps) {
  return (
    <Button 
      variant="outline" 
      size="sm" 
      onClick={onClick}
      disabled={loading}
      className={cn("rounded-xl border-border bg-card/50 text-muted-foreground hover:text-primary transition-all hover:border-primary/50", className)}
    >
      <RefreshCw className={cn("w-4 h-4 mr-2", loading && "animate-spin")} />
      {label}
    </Button>
  )
}

/**
 * EXPORT PDF BUTTON
 * FOR PRINTING SUMMARIES OR REPORTS
 */
interface ExportPDFButtonProps {
  onClick: () => void
  loading?: boolean
  label?: string
  className?: string
}

export function ExportPDFButton({ onClick, loading, label = "Export PDF", className }: ExportPDFButtonProps) {
  return (
    <Button 
      variant="outline" 
      size="sm" 
      onClick={onClick}
      disabled={loading}
      className={cn("rounded-xl border-border bg-card/50 text-muted-foreground hover:text-blue-500 transition-all hover:border-blue-500/50", className)}
    >
      {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Download className="w-4 h-4 mr-2" />}
      {label}
    </Button>
  )
}
