import { NextResponse } from "next/server";
import connectDB from "../../../../lib/db";
import Flashcard from "../../../../models/Flashcard";
import { withAuth, AuthenticatedRequest } from "../../../../lib/middleware";

async function editFlashcard(req: AuthenticatedRequest, context: { params: Promise<{ id: string }> }) {
  try {
    await connectDB();
    const userId = req.user.id;
    const { id } = await context.params;
    const body = await req.json();

    // Mark as edited if changes being made
    const updateData = { ...body, isEdited: true };

    const flashcard = await Flashcard.findOneAndUpdate(
      { _id: id, userId },
      { $set: updateData },
      { new: true, runValidators: true }
    );

    if (!flashcard) {
      return NextResponse.json(
        { success: false, error: { message: "Flashcard not found", code: "NOT_FOUND" } },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: flashcard });
  } catch (error: any) {
    console.error("Update Flashcard Error:", error);
    return NextResponse.json(
      { success: false, error: { message: "Internal Server Error", code: "INTERNAL_ERROR" } },
      { status: 500 }
    );
  }
}

async function deleteFlashcard(req: AuthenticatedRequest, context: { params: Promise<{ id: string }> }) {
  try {
    await connectDB();
    const userId = req.user.id;
    const { id } = await context.params;

    const flashcard = await Flashcard.findOneAndDelete({ _id: id, userId });

    if (!flashcard) {
      return NextResponse.json(
        { success: false, error: { message: "Flashcard not found", code: "NOT_FOUND" } },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: {} });
  } catch (error: any) {
    console.error("Delete Flashcard Error:", error);
    return NextResponse.json(
      { success: false, error: { message: "Internal Server Error", code: "INTERNAL_ERROR" } },
      { status: 500 }
    );
  }
}

export const PUT = withAuth(editFlashcard);
export const DELETE = withAuth(deleteFlashcard);
