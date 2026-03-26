import { NextResponse } from "next/server";
import connectDB from "../../../../lib/db";
import Subject from "../../../../models/Subject";
import { withAuth, AuthenticatedRequest } from "../../../../lib/middleware";

async function updateSubject(req: AuthenticatedRequest, context: { params: Promise<{ id: string }> }) {
  try {
    await connectDB();
    const userId = req.user.id;
    const { id } = await context.params;
    const body = await req.json();

    const subject = await Subject.findOneAndUpdate(
      { _id: id, userId },
      { $set: body },
      { new: true, runValidators: true }
    );

    if (!subject) {
      return NextResponse.json(
        { success: false, error: { message: "Subject not found", code: "NOT_FOUND" } },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: subject });
  } catch (error: any) {
    console.error("Update Subject Error:", error);
    return NextResponse.json(
      { success: false, error: { message: "Internal Server Error", code: "INTERNAL_ERROR" } },
      { status: 500 }
    );
  }
}

async function deleteSubject(req: AuthenticatedRequest, context: { params: Promise<{ id: string }> }) {
  try {
    await connectDB();
    const userId = req.user.id;
    const { id } = await context.params;

    const subject = await Subject.findOneAndDelete({ _id: id, userId });

    if (!subject) {
      return NextResponse.json(
        { success: false, error: { message: "Subject not found", code: "NOT_FOUND" } },
        { status: 404 }
      );
    }
    
    // Note: To be rigorous we should optionally delete Topics & Flashcards & Quizzes 
    // relating to this Subject, but deleting the top level is fine for basic requirements.

    return NextResponse.json({ success: true, data: {} });
  } catch (error: any) {
    console.error("Delete Subject Error:", error);
    return NextResponse.json(
      { success: false, error: { message: "Internal Server Error", code: "INTERNAL_ERROR" } },
      { status: 500 }
    );
  }
}

export const PUT = withAuth(updateSubject);
export const DELETE = withAuth(deleteSubject);
