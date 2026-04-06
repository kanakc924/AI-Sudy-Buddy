import { NextResponse } from "next/server";
import connectDB from "../../../../lib/db";
import Subject from "../../../../models/Subject";
import Topic from "../../../../models/Topic";
import Flashcard from "../../../../models/Flashcard";
import Quiz from "../../../../models/Quiz";
import Session from "../../../../models/Session";
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

    const subject = await Subject.findOne({ _id: id, userId });

    if (!subject) {
      return NextResponse.json(
        { success: false, error: { message: "Subject not found", code: "NOT_FOUND" } },
        { status: 404 }
      );
    }
    
    // Get all topics under this subject
    const topics = await Topic.find({ subjectId: id, userId }).select('_id');
    const topicIds = topics.map(t => t._id);

    // Cascade delete related data
    if (topicIds.length > 0) {
      await Flashcard.deleteMany({ topicId: { $in: topicIds }, userId });
      await Quiz.deleteMany({ topicId: { $in: topicIds }, userId });
      await Session.deleteMany({ topicId: { $in: topicIds }, userId });
    }

    // Delete topics
    await Topic.deleteMany({ subjectId: id, userId });

    // Delete subject
    await Subject.findByIdAndDelete(id);

    return NextResponse.json({ 
      success: true, 
      data: { 
        message: 'Subject and all related data deleted successfully',
        deletedTopics: topicIds.length,
      } 
    });
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
