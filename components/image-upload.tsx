'use client'

import { useState, useCallback } from 'react'
import { Image as ImageIcon, Loader2 } from 'lucide-react'
import { uploadImage } from '@/services/api'
import { toast } from 'sonner'
import Image from 'next/image'

export function ImageUpload({ topicId, onExtracted }: { topicId: string, onExtracted: (text: string) => void }) {
  const [isDragging, setIsDragging] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [preview, setPreview] = useState<string | null>(null)

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const droppedFile = e.dataTransfer.files[0]
    if (droppedFile?.type.startsWith('image/')) {
      await processImage(droppedFile)
    } else {
      toast.error('Only image files are supported')
    }
  }, [topicId])

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0]
    if (selected) await processImage(selected)
  }

  const processImage = async (file: File) => {
    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size exceeds 5MB limit')
      return
    }

    // Create preview
    const reader = new FileReader()
    reader.onload = (e) => setPreview(e.target?.result as string)
    reader.readAsDataURL(file)

    setIsUploading(true)
    try {
      const res = await uploadImage(topicId, file)
      toast.success('Image processed via AI')
      if (res.extractedText) {
        onExtracted(res.extractedText)
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to process image')
      setPreview(null)
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <div 
      className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer ${
        isDragging ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50 hover:bg-card/50'
      }`}
      onDragEnter={() => setIsDragging(true)}
      onDragLeave={() => setIsDragging(false)}
      onDragOver={e => e.preventDefault()}
      onDrop={handleDrop}
      onClick={() => !isUploading && document.getElementById('image-upload-input')?.click()}
    >
      <input 
        id="image-upload-input" 
        type="file" 
        accept="image/*" 
        className="hidden" 
        onChange={handleFileSelect}
        disabled={isUploading}
      />
      
      <div className="flex flex-col items-center justify-center gap-3">
        {isUploading ? (
          <>
            <div className="relative w-24 h-24 rounded-lg overflow-hidden border-2 border-primary mb-2">
              {preview && <Image src={preview} alt="Upload preview" fill className="object-cover opacity-50" />}
              <div className="absolute inset-0 flex items-center justify-center bg-background/50 backdrop-blur-sm">
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
              </div>
            </div>
            <p className="font-serif text-lg text-foreground">Extracting text via Vision AI...</p>
          </>
        ) : preview ? (
          <>
            <div className="w-24 h-24 rounded-lg overflow-hidden border border-border shadow-md mb-2 relative">
              <Image src={preview} alt="Upload preview" fill className="object-cover" />
            </div>
            <p className="font-serif text-lg text-foreground">Done!</p>
            <p className="text-sm text-primary group-hover:underline">Click to upload another page</p>
          </>
        ) : (
          <>
            <div className="bg-primary/10 border border-primary/20 p-4 rounded-full group-hover:scale-110 transition-transform">
              <ImageIcon className="w-8 h-8 text-primary" />
            </div>
            <p className="font-serif text-lg text-foreground">Upload a textbook page</p>
            <p className="text-sm text-muted-foreground">Snap a picture of your notes to instantly convert to text.</p>
          </>
        )}
      </div>
    </div>
  )
}
