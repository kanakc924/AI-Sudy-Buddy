import { NextResponse } from "next/server";
import connectDB from "../../../../lib/db";
import Session from "../../../../models/Session";
import { withAuth, AuthenticatedRequest } from "../../../../lib/middleware";

async function getSessionById(req: AuthenticatedRequest, context: { params: Promise<{ id: string }> }) {
  try {
    await connectDB();
    const userId = req.user.id;
    const { id } = await context.params;

    const session = await Session.findOne({ _id: id, userId });

    if (!session) {
      return NextResponse.json(
        { success: false, error: { message: "Session not found", code: "NOT_FOUND" } },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: session }, { status: 200 });
  } catch (error: any) {
    console.error("Get Session Error:", error);
    return NextResponse.json(
      { success: false, error: { message: "Internal Server Error", code: "INTERNAL_ERROR" } },
      { status: 500 }
    );
  }
}

export const GET = withAuth(getSessionById);
