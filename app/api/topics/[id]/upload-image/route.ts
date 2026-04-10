import { NextResponse } from "next/server";
import mongoose from "mongoose";

import connectDB from "../../../../../lib/db";
import Topic from "../../../../../models/Topic";
import { withAuth, AuthenticatedRequest } from "../../../../../lib/middleware";
import { extractTextFromImage } from "../../../../../services/ai.service";
import { uploadImageToCloudinary } from "../../../../../services/cloudinary.service";
import { errorResponse } from "../../../../../lib/handleApiError";
import { aiRateLimiter } from "../../../../../lib/rateLimiter";

async function uploadImage(req: AuthenticatedRequest, context: { params: Promise<{ id: string }> }) {
  try {
    await connectDB();
    const userId = req.user.id;
    const { id } = await context.params;
    
    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: "Invalid topic ID format", code: "VALIDATION_ERROR" },
        { status: 400 }
      );
    }


    // Check rate limit
    const { limitedResponse, limit, remaining, reset } = await aiRateLimiter(req, userId);
    if (limitedResponse) return limitedResponse;

    const headers = {
      "X-RateLimit-Limit": limit.toString(),
      "X-RateLimit-Remaining": remaining.toString(),
      "X-RateLimit-Reset": reset.toString(),
    };

    const topic = await Topic.findOne({ _id: id, userId });
    if (!topic) {
      return NextResponse.json(
        { success: false, error: "Topic not found", code: "NOT_FOUND" },
        { status: 404 }
      );
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { success: false, error: "No image provided", code: "VALIDATION_ERROR" },
        { status: 400 }
      );
    }

    // Validate file size (10MB)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { success: false, error: "Image size exceeds 10MB limit", code: "VALIDATION_ERROR" },
        { status: 400 }
      );
    }

    const allowedMimeTypes = ["image/jpeg", "image/png", "image/webp", "image/jpg"];
    if (!allowedMimeTypes.includes(file.type)) {
      return NextResponse.json(
        { success: false, error: "Invalid image type. Only JPG, PNG, WEBP allowed.", code: "VALIDATION_ERROR" },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const uint8Array = new Uint8Array(arrayBuffer);

    // Upload to Cloudinary
    const cloudinaryResult = await uploadImageToCloudinary(buffer);

    // Extract text from image via OpenRouter AI Vision
    const extractedText = await extractTextFromImage(uint8Array, file.type);

    // Save to Topic
    const extension = file.name.split('.').pop() || "jpg";
    const updatedTopic = await Topic.findOneAndUpdate(
      { _id: id, userId },
      {
        $push: {
          sourceMaterials: {
            type: 'image',
            title: file.name,
            url: cloudinaryResult.url,
            publicId: cloudinaryResult.publicId,
            extractedText: extractedText,
            fileName: file.name,
            fileExtension: extension,
            uploadedAt: new Date(),
          },
          sourceImages: {
            url: cloudinaryResult.url,
            publicId: cloudinaryResult.publicId,
            extractedText: extractedText,
            uploadedAt: new Date(),
          }
        }
      },
      { new: true }
    ).populate({ path: "subjectId", model: (await import("@/models/Subject")).default });

    return NextResponse.json({ success: true, data: updatedTopic, extractedText }, { headers });
  } catch (error: any) {
    return errorResponse(error);
  }
}

export const POST = withAuth(uploadImage);
