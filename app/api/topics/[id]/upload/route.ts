import { NextResponse } from "next/server";
import connectDB from "../../../../../lib/db";
import Topic from "../../../../../models/Topic";
import { withAuth, AuthenticatedRequest } from "../../../../../lib/middleware";
import { extractTextFromPdf } from "../../../../../services/pdf.service";
import { sanitizeText } from "../../../../../services/sanitizer.service";
import { errorResponse } from "../../../../../lib/handleApiError";

async function uploadFile(req: AuthenticatedRequest, context: { params: Promise<{ id: string }> }) {
  try {
    await connectDB();
    const userId = req.user.id;
    const { id } = await context.params;

    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { success: false, error: "No file provided", code: "VALIDATION_ERROR" },
        { status: 400 }
      );
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { success: false, error: "File size exceeds 5MB limit", code: "VALIDATION_ERROR" },
        { status: 400 }
      );
    }

    const allowedMimeTypes = ["application/pdf", "text/plain"];
    if (!allowedMimeTypes.includes(file.type)) {
      return NextResponse.json(
        { success: false, error: "Invalid file type. Only PDF and TXT allowed.", code: "VALIDATION_ERROR" },
        { status: 400 }
      );
    }

    // Process file
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    let extractedText = "";

    if (file.type === "application/pdf") {
      extractedText = await extractTextFromPdf(buffer);
    } else if (file.type === "text/plain") {
      extractedText = buffer.toString("utf-8");
    }

    // Sanitize and format the text (fix spaces, line breaks, etc.)
    extractedText = await sanitizeText(extractedText);

    // Save formal source material to DB
    const extension = file.name.split('.').pop() || "";
    const updatedTopic = await Topic.findOneAndUpdate(
      { _id: id, userId },
      { 
        $push: { 
          sourceMaterials: {
            type: file.type === "application/pdf" ? "pdf" : "text",
            title: file.name,
            fileName: file.name,
            fileExtension: extension,
            extractedText: extractedText,
            uploadedAt: new Date()
          } 
        } 
      },
      { new: true }
    ).populate({ path: "subjectId", model: (await import("@/models/Subject")).default });

    // Return the extracted text and the updated topic
    return NextResponse.json({ success: true, extractedText, data: updatedTopic });
  } catch (error: any) {
    return errorResponse(error);
  }
}

export const POST = withAuth(uploadFile);
