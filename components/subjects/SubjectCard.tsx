'use client'

import Link from 'next/link'
import { MoreHorizontal, Pencil, Trash2, Clock, FileText } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import type { Subject } from '@/types'
import { cn } from '@/lib/utils'

interface SubjectCardProps {
  subject: Subject
  onEdit: (subject: Subject) => void
  onDelete: (subject: Subject) => void
  index: number
}

export function SubjectCard({ subject, onEdit, onDelete, index }: SubjectCardProps) {
  return (
    <Link
      href={`/subjects/${subject.id}`}
      className={cn(
        'group relative block rounded-xl border border-border bg-card p-6 transition-all',
        'hover:border-violet/30 hover:shadow-lg hover:shadow-violet/5 hover:-translate-y-1',
        'animate-fade-in-up'
      )}
      style={{ 
        animationDelay: `${index * 50}ms`,
        borderLeftWidth: '4px',
        borderLeftColor: subject.color,
      }}
    >
      {/* Dropdown Menu */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-2 top-2 h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={(e: any) => e.preventDefault()}
          >
            <MoreHorizontal className="h-4 w-4" />
            <span className="sr-only">Open menu</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem 
            onClick={(e: any) => {
              e.preventDefault()
              onEdit(subject)
            }}
          >
            <Pencil className="mr-2 h-4 w-4" />
            Edit
          </DropdownMenuItem>
          <DropdownMenuItem 
            onClick={(e: any) => {
              e.preventDefault()
              onDelete(subject)
            }}
            className="text-destructive focus:text-destructive"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Content */}
      <h3 className="font-serif text-lg font-semibold text-foreground pr-8">
        {subject.title}
      </h3>
      <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
        {subject.description}
      </p>

      {/* Meta */}
      <div className="mt-4 flex items-center gap-4 text-xs text-[#A0A6B8]">
        <div className="flex items-center gap-1">
          <FileText className="h-3.5 w-3.5" />
          {subject.topicCount} {subject.topicCount <= 1 ? 'topic' : 'topics'}
        </div>
        <div className="flex items-center gap-1">
          <Clock className="h-3.5 w-3.5" />
          {subject.lastStudied}
        </div>
      </div>
    </Link>
  )
}
