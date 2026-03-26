import { NextResponse } from "next/server";
import connectDB from "../../../../../lib/db";
import Topic from "../../../../../models/Topic";
import { withAuth, AuthenticatedRequest } from "../../../../../lib/middleware";
import { extractTextFromImage } from "../../../../../services/ai.service";
import { uploadImageToCloudinary } from "../../../../../services/cloudinary.service";

async function uploadImage(req: AuthenticatedRequest, context: { params: Promise<{ id: string }> }) {
  try {
    await connectDB();
    const userId = req.user.id;
    const { id } = await context.params;

    const topic = await Topic.findOne({ _id: id, userId });
    if (!topic) {
      return NextResponse.json(
        { success: false, error: { message: "Topic not found", code: "NOT_FOUND" } },
        { status: 404 }
      );
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { success: false, error: { message: "No image provided", code: "VALIDATION_ERROR" } },
        { status: 400 }
      );
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { success: false, error: { message: "Image size exceeds 5MB limit", code: "VALIDATION_ERROR" } },
        { status: 400 }
      );
    }

    const allowedMimeTypes = ["image/jpeg", "image/png", "image/webp", "image/jpg"];
    if (!allowedMimeTypes.includes(file.type)) {
      return NextResponse.json(
        { success: false, error: { message: "Invalid image type. Only JPG, PNG, WEBP allowed.", code: "VALIDATION_ERROR" } },
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
    topic.sourceImages.push({
      url: cloudinaryResult.url,
      publicId: cloudinaryResult.publicId,
      extractedText: extractedText,
      uploadedAt: new Date(),
    });

    await topic.save();

    return NextResponse.json({ success: true, data: topic, extractedText });
  } catch (error: any) {
    console.error("Upload Image Error:", error);
    return NextResponse.json(
      { success: false, error: { message: error.message || "Internal Server Error", code: "INTERNAL_ERROR" } },
      { status: 500 }
    );
  }
}

export const POST = withAuth(uploadImage);
