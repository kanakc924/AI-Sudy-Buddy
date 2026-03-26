import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/db'
import { extractTextFromPdf } from '@/services/pdf.service'
import Topic from '@/models/Topic'
import { verifyToken } from '@/lib/auth'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    // Auth check
    const authHeader = req.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const token = authHeader.split(' ')[1]
    const decoded = verifyToken(token)
    if (!decoded) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    // Parse the uploaded file
    const formData = await req.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Validate file type
    const isPDF = file.type === 'application/pdf'
    const isTxt = file.type === 'text/plain'

    if (!isPDF && !isTxt) {
      return NextResponse.json(
        { error: 'Only PDF and TXT files are supported' },
        { status: 400 }
      )
    }

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Extract text
    let extractedText = ''
    if (isPDF) {
      extractedText = await extractTextFromPdf(buffer)
    } else {
      // Plain text file — just decode it
      extractedText = new TextDecoder().decode(buffer)
    }

    // Connect DB and verify topic belongs to user
    await connectDB()
    const topic = await Topic.findOne({
      _id: id,
      userId: decoded.id,
    })

    if (!topic) {
      return NextResponse.json({ error: 'Topic not found' }, { status: 404 })
    }

    // Return extracted text — don't auto-save, let user review first
    return NextResponse.json({
      success: true,
      extractedText,
      fileName: file.name,
      pageCount: isPDF ? undefined : null,
    })

  } catch (error: any) {
    console.error('Upload error:', error)
    return NextResponse.json(
      { error: error.message || 'Upload failed' },
      { status: 500 }
    )
  }
}