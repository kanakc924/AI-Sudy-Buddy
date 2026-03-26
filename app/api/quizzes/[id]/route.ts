import { NextResponse } from "next/server";
import connectDB from "../../../../lib/db";
import Quiz from "../../../../models/Quiz";
import { withAuth, AuthenticatedRequest } from "../../../../lib/middleware";

async function editQuiz(req: AuthenticatedRequest, context: { params: Promise<{ id: string }> }) {
  try {
    await connectDB();
    const userId = req.user.id;
    const { id } = await context.params;
    const body = await req.json();

    const updateData = { ...body, isEdited: true };

    const quiz = await Quiz.findOneAndUpdate(
      { _id: id, userId },
      { $set: updateData },
      { new: true, runValidators: true }
    );

    if (!quiz) {
      return NextResponse.json(
        { success: false, error: { message: "Quiz not found", code: "NOT_FOUND" } },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: quiz });
  } catch (error: any) {
    console.error("Update Quiz Error:", error);
    return NextResponse.json(
      { success: false, error: { message: "Internal Server Error", code: "INTERNAL_ERROR" } },
      { status: 500 }
    );
  }
}

// PRD doesn't mention DELETE quiz explicitly, but it makes sense to mirror flashcards.
async function deleteQuiz(req: AuthenticatedRequest, context: { params: Promise<{ id: string }> }) {
  try {
    await connectDB();
    const userId = req.user.id;
    const { id } = await context.params;

    const quiz = await Quiz.findOneAndDelete({ _id: id, userId });

    if (!quiz) {
      return NextResponse.json(
        { success: false, error: { message: "Quiz not found", code: "NOT_FOUND" } },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: {} });
  } catch (error: any) {
    console.error("Delete Quiz Error:", error);
    return NextResponse.json(
      { success: false, error: { message: "Internal Server Error", code: "INTERNAL_ERROR" } },
      { status: 500 }
    );
  }
}

export const PUT = withAuth(editQuiz);
export const DELETE = withAuth(deleteQuiz);
