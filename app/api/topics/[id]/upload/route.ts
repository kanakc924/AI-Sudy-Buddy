import { NextResponse } from "next/server";
import connectDB from "../../../../../lib/db";
import Topic from "../../../../../models/Topic";
import { withAuth, AuthenticatedRequest } from "../../../../../lib/middleware";
import { extractTextFromPdf } from "../../../../../services/pdf.service";

async function uploadFile(req: AuthenticatedRequest, context: { params: Promise<{ id: string }> }) {
  try {
    await connectDB();
    const userId = req.user.id;
    const { id } = await context.params;

    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { success: false, error: { message: "No file provided", code: "VALIDATION_ERROR" } },
        { status: 400 }
      );
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { success: false, error: { message: "File size exceeds 5MB limit", code: "VALIDATION_ERROR" } },
        { status: 400 }
      );
    }

    const allowedMimeTypes = ["application/pdf", "text/plain"];
    if (!allowedMimeTypes.includes(file.type)) {
      return NextResponse.json(
        { success: false, error: { message: "Invalid file type. Only PDF and TXT allowed.", code: "VALIDATION_ERROR" } },
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

    // Return the extracted text to be previewed on the frontend
    return NextResponse.json({ success: true, extractedText });
  } catch (error: any) {
    console.error("Upload File Error:", error);
    return NextResponse.json(
      { success: false, error: { message: error.message || "Internal Server Error", code: "INTERNAL_ERROR" } },
      { status: 500 }
    );
  }
}

export const POST = withAuth(uploadFile);
