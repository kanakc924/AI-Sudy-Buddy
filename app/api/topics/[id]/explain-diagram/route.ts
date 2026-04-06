import { NextRequest, NextResponse } from 'next/server'
import mongoose from 'mongoose'

import connectDB from '@/lib/db'
import { verifyToken } from '@/lib/auth'
import { uploadImageToCloudinary } from '@/services/cloudinary.service'
import { explainDiagram } from '@/services/ai.service'
import { sanitizeText } from '@/services/sanitizer.service'
import { errorResponse } from '@/lib/handleApiError'
import { aiRateLimiter } from '@/lib/rateLimiter'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB()
    const { id } = await params
    
    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: "Invalid topic ID format", code: "VALIDATION_ERROR" },
        { status: 400 }
      );
    }

    
    // Auth check
    const authHeader = req.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ success: false, error: 'Unauthorized', code: 'UNAUTHORIZED' }, { status: 401 })
    }
    const decoded = verifyToken(authHeader.split(' ')[1])
    if (!decoded) {
      return NextResponse.json({ success: false, error: 'Invalid token', code: 'UNAUTHORIZED' }, { status: 401 })
    }

    // Check rate limit
    const { limitedResponse, limit, remaining, reset } = await aiRateLimiter(req as any, decoded.id);
    if (limitedResponse) return limitedResponse;

    const headers = {
      "X-RateLimit-Limit": limit.toString(),
      "X-RateLimit-Remaining": remaining.toString(),
      "X-RateLimit-Reset": reset.toString(),
    };

    // Get the image file
    const formData = await req.formData()
    const file = formData.get('image') as File | null
    if (!file) {
      return NextResponse.json({ success: false, error: 'No image provided', code: 'VALIDATION_ERROR' }, { status: 400 })
    }

    // Upload to Cloudinary
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    const uploadResult = await uploadImageToCloudinary(buffer)

    // Send to AI with diagram explanation prompt using the robust fallback service
    const rawText = await explainDiagram(buffer, file.type);
    
    // Sanitize and format the text (fix spaces, line breaks, etc.)
    const text = await sanitizeText(rawText);

    // Save to Topic
    const extension = file.name.split('.').pop() || "png";
    const TopicModel = (await import('@/models/Topic')).default;
    const SubjectModel = (await import('@/models/Subject')).default;
    const updatedTopic = await TopicModel.findOneAndUpdate(
      { _id: id, userId: decoded.id },
      {
        $push: {
          sourceMaterials: {
            type: 'diagram',
            title: `Diagram: ${file.name}`,
            url: uploadResult.url,
            publicId: uploadResult.publicId,
            extractedText: text,
            fileName: file.name,
            fileExtension: extension,
            uploadedAt: new Date(),
          }
        }
      },
      { new: true }
    ).populate({ path: "subjectId", model: SubjectModel });

    return NextResponse.json({
      success: true,
      extractedText: text,
      imageUrl: uploadResult.url,
      data: updatedTopic
    }, { headers })

  } catch (error: any) {
    return errorResponse(error)
  }
}