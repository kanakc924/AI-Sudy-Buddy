import { NextResponse } from "next/server";
import connectDB from "../../../../../../lib/db";
import Topic from "../../../../../../models/Topic";
import { withAuth, AuthenticatedRequest } from "../../../../../../lib/middleware";
import { aiRateLimiter } from "../../../../../../lib/rateLimiter";
import { generateSummary } from "../../../../../../services/ai.service";
import { errorResponse } from "../../../../../../lib/handleApiError";

async function generateSummaryRoute(req: AuthenticatedRequest, context: { params: Promise<{ id: string }> }) {
  try {
    await connectDB();
    const userId = req.user.id;
    const { id } = await context.params;

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

    // Combine notes and extracted text from source materials for a comprehensive summary
    let combinedContent = topic.notes || "";
    
    if (topic.sourceMaterials && topic.sourceMaterials.length > 0) {
      const materialsText = topic.sourceMaterials
        .map((m: any) => m.extractedText || m.content || "")
        .filter((t: string) => t.length > 0)
        .join("\n\n");
      
      if (materialsText) {
        combinedContent += "\n\n--- Source Materials ---\n\n" + materialsText;
      }
    }

    if (combinedContent.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: "Topic has no content to generate from", code: "NO_CONTENT" },
        { status: 400 }
      );
    }

    const imageCount = topic.sourceMaterials?.filter((m: any) => m.type === 'image').length || 0;
    const summaryData = await generateSummary(combinedContent, imageCount);

    // Save to DB
    topic.summary = summaryData;
    await topic.save();

    return NextResponse.json({ success: true, data: topic }, { status: 201, headers });
  } catch (error: any) {
    return errorResponse(error);
  }
}

export const POST = withAuth(generateSummaryRoute);
