import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/db'
import { verifyToken } from '@/lib/auth'
import { uploadImageToCloudinary } from '@/services/cloudinary.service'
import { generateText } from 'ai'
import { createOpenRouter } from '@openrouter/ai-sdk-provider'

const openrouter = createOpenRouter({
  apiKey: process.env.OPENROUTER_API_KEY!,
})

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB()
    const { id } = await params
    // Auth check
    const authHeader = req.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const decoded = verifyToken(authHeader.split(' ')[1])
    if (!decoded) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    // Get the image file
    const formData = await req.formData()
    const file = formData.get('image') as File | null
    if (!file) {
      return NextResponse.json({ error: 'No image provided' }, { status: 400 })
    }

    // Upload to Cloudinary
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    const uploadResult = await uploadImageToCloudinary(buffer)

    // Send to AI with diagram explanation prompt
    const { text } = await generateText({
      model: openrouter('google/gemma-3-27b-it:free'),
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: `You are an expert teacher. I am showing you a diagram, flowchart, or chart.

Your job is to produce a structured "mini lecture" with these exact sections:

## What This Diagram Shows
[1-2 sentence overview of what this diagram represents]

## Key Components
[List every labeled element, shape, or node in the diagram with a brief explanation of what each one means]

## Step-by-Step Walkthrough
[Walk through the diagram step by step as if explaining it to a student who has never seen it. Number each step. Explain what happens at each stage, why it matters, and how it connects to the next step.]

## Key Takeaways
[3-5 bullet points summarizing the most important things to understand from this diagram]

Be thorough. This is a study aid — the student needs to fully understand the diagram from your explanation alone.`,
            },
            {
              type: 'image',
              image: new URL(uploadResult.url),
            },
          ],
        },
      ],
    })

    return NextResponse.json({
      success: true,
      explanation: text,
      imageUrl: uploadResult.url,
    })

  } catch (error: any) {
    // Fallback model on rate limit
    if (error?.statusCode === 429) {
      return NextResponse.json(
        { error: 'Rate limit reached. Try again in 60s' },
        { status: 429 }
      )
    }
    console.error('Explain diagram error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to explain diagram' },
      { status: 500 }
    )
  }
}