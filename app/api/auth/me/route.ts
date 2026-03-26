import { NextRequest, NextResponse } from "next/server";
import connectDB from "../../../../lib/db";
import User from "../../../../models/User";
import { withAuth, AuthenticatedRequest } from "../../../../lib/middleware";

async function getMeHandler(req: AuthenticatedRequest) {
  try {
    await connectDB();
    const userId = req.user.id;
    
    const user = await User.findById(userId).select("-password -__v");
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: { message: "User not found", code: "NOT_FOUND" } },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: user });
  } catch (error: any) {
    console.error("GetMe Error:", error);
    return NextResponse.json(
      { success: false, error: { message: error.message || "Internal Server Error", code: "INTERNAL_ERROR" } },
      { status: 500 }
    );
  }
}

export const GET = withAuth(getMeHandler);
