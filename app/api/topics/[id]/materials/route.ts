import { NextResponse } from "next/server";
import mongoose from "mongoose";
import connectDB from "@/lib/db";
import Topic from "@/models/Topic";
import { withAuth, AuthenticatedRequest } from "@/lib/middleware";
import { errorResponse } from "@/lib/handleApiError";


async function saveMaterial(req: AuthenticatedRequest, context: { params: Promise<{ id: string }> }) {
  try {
    await connectDB();
    const { id: topicId } = await context.params;
    
    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(topicId)) {
      return NextResponse.json(
        { success: false, error: "Invalid topic ID format", code: "VALIDATION_ERROR" },
        { status: 400 }
      );
    }
    
    const userId = req.user.id;

    const { content, type, title } = await req.json();

    if (!content) {
      return NextResponse.json({ success: false, error: "Content is required" }, { status: 400 });
    }

    // Auto-generate title if not provided
    let finalTitle = title;
    if (!finalTitle) {
      const firstLine = content.trim().split('\n')[0];
      finalTitle = firstLine.length > 30 ? firstLine.substring(0, 30) + '...' : firstLine;
      if (!finalTitle) finalTitle = "Saved Note";
    }

    const TopicModel = (await import("@/models/Topic")).default;

    const updatedTopic = await TopicModel.findOneAndUpdate(
      { _id: topicId, userId },
      {
        $push: {
          sourceMaterials: {
            type: type || 'note',
            title: finalTitle,
            content: content,
            uploadedAt: new Date()
          }
        }
      },
      { new: true, runValidators: true }
    ).populate({ path: "subjectId", model: (await import("@/models/Subject")).default });

    if (!updatedTopic) {
      return NextResponse.json({ success: false, error: "Topic not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: updatedTopic });
  } catch (error: any) {
    return errorResponse(error);
  }

}

async function deleteMaterial(req: AuthenticatedRequest, context: { params: Promise<{ id: string }> }) {
  try {
    await connectDB();
    const { id: topicId } = await context.params;
    const userId = req.user.id;
    const { searchParams } = new URL(req.url);
    const materialId = searchParams.get("materialId");

    if (!materialId) {
      return NextResponse.json({ success: false, error: "Material ID is required" }, { status: 400 });
    }

    // Find topic and the specific material to check for Cloudinary publicId
    const topic = await Topic.findOne({ _id: topicId, userId });
    if (!topic) {
      return NextResponse.json({ success: false, error: "Topic not found" }, { status: 404 });
    }

    const material = (topic.sourceMaterials as any).id(materialId);
    if (!material) {
      return NextResponse.json({ success: false, error: "Material not found" }, { status: 404 });
    }

    // Delete from Cloudinary if it has a publicId
    if (material.publicId) {
      const { deleteImageFromCloudinary } = await import("@/services/cloudinary.service");
      try {
        await deleteImageFromCloudinary(material.publicId);
      } catch (cloudinaryError) {
        console.error("Cloudinary deletion failed:", cloudinaryError);
        // Continue anyway to sync DB
      }
    }

    // Remove from sourceMaterials array
    const updatedTopic = await Topic.findOneAndUpdate(
      { _id: topicId, userId },
      { $pull: { sourceMaterials: { _id: materialId } } },
      { new: true }
    ).populate({ path: "subjectId", model: (await import("@/models/Subject")).default });

    return NextResponse.json({ success: true, data: updatedTopic });
  } catch (error: any) {
    return errorResponse(error);
  }
}

export const POST = withAuth(saveMaterial);
export const DELETE = withAuth(deleteMaterial);
