'use client'

import React, { ReactNode } from 'react'
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription, 
  DialogFooter 
} from '@/components/ui/dialog'
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle 
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Loader2, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'

/**
 * DELETE CONFIRM DIALOG
 * UNIVERSAL CONFIRMATION MODAL FOR DESTRUCTIVE ACTIONS
 */
interface DeleteConfirmDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
  loading?: boolean
  title?: string
  description?: string
  actionLabel?: string
}

export function DeleteConfirmDialog({
  open,
  onOpenChange,
  onConfirm,
  loading,
  title = "Are you absolutely sure?",
  description = "This action cannot be undone. This will permanently delete the item and all associated data.",
  actionLabel = "Delete"
}: DeleteConfirmDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="bg-popover border-border rounded-2xl shadow-2xl">
        <AlertDialogHeader>
          <AlertDialogTitle className="font-serif text-xl">{title}</AlertDialogTitle>
          <AlertDialogDescription className="text-muted-foreground leading-relaxed">
            {description}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="gap-2 mt-2">
          <AlertDialogCancel disabled={loading} className="rounded-xl border-border hover:bg-card">
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction 
            asChild
          >
            <Button
              variant="destructive"
              onClick={(e) => {
                e.preventDefault()
                onConfirm()
              }}
              disabled={loading}
              className="rounded-xl bg-destructive hover:bg-destructive/90 text-destructive-foreground font-bold shadow-lg shadow-destructive/10"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Trash2 className="w-4 h-4 mr-2" />}
              {actionLabel}
            </Button>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

/**
 * FORM DIALOG
 * BASE COMPONENT FOR CREATE/EDIT MODALS WITH FORM FIELDS
 */
interface FormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description?: string
  onSubmit: (e: React.FormEvent) => void
  loading?: boolean
  submitLabel?: string
  children: ReactNode
}

export function FormDialog({
  open,
  onOpenChange,
  title,
  description,
  onSubmit,
  loading,
  submitLabel = "Save Changes",
  children
}: FormDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-popover border-border rounded-2xl w-[95vw] shadow-2xl">
        <DialogHeader>
          <DialogTitle className="font-serif text-2xl">{title}</DialogTitle>
          {description && (
            <DialogDescription className="text-muted-foreground">
              {description}
            </DialogDescription>
          )}
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4 py-2">
          {children}
          <DialogFooter className="pt-4 sm:justify-start gap-2">
            <Button 
              type="button" 
              variant="ghost" 
              onClick={() => onOpenChange(false)} 
              disabled={loading}
              className="w-full sm:w-auto h-12 rounded-xl border border-transparent hover:border-border"
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={loading} 
              className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-primary-foreground h-12 rounded-xl font-bold shadow-lg shadow-primary/20"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              {submitLabel}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

/**
 * SUBJECT/TOPIC INPUTS
 * SHARED FORM FIELDS FOR SUBJECT AND TOPIC MODALS
 */
interface ResourceFormFieldsProps {
  name: string
  setName: (val: string) => void
  description?: string
  setDescription?: (val: string) => void
  namePlaceholder?: string
  descPlaceholder?: string
  showDescription?: boolean
}

export function ResourceFormFields({
  name,
  setName,
  description,
  setDescription,
  namePlaceholder = "e.g. Computer Science 101",
  descPlaceholder = "What is this about?",
  showDescription = true
}: ResourceFormFieldsProps) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <label className="text-sm font-bold ml-1 text-foreground/80 uppercase tracking-widest text-[10px]">Name</label>
        <Input 
          value={name} 
          onChange={e => setName(e.target.value)} 
          placeholder={namePlaceholder} 
          className="bg-muted/30 border-border h-12 px-4 rounded-xl focus:ring-primary/20"
          autoFocus
          required
        />
      </div>
      {showDescription && setDescription && (
        <div className="space-y-2">
          <label className="text-sm font-bold ml-1 text-foreground/80 uppercase tracking-widest text-[10px]">Description (Optional)</label>
          <textarea 
            value={description} 
            onChange={e => setDescription(e.target.value)} 
            placeholder={descPlaceholder} 
            className="w-full min-h-[100px] bg-muted/30 border border-border rounded-xl p-4 text-sm text-foreground resize-none focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-border transition-all"
          />
        </div>
      )}
    </div>
  )
}
