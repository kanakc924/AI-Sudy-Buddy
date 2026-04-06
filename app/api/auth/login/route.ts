import { NextRequest, NextResponse } from "next/server";
import connectDB from "../../../../lib/db";
import User from "../../../../models/User";
import bcrypt from "bcryptjs";
import { signToken } from "../../../../lib/auth";

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const body = await req.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: { message: "Please provide email and password", code: "VALIDATION_ERROR" } },
        { status: 400 }
      );
    }

    const user = await User.findOne({ email });
    if (!user || !user.passwordHash) {
      return NextResponse.json(
        { success: false, error: { message: "Invalid credentials", code: "UNAUTHORIZED" } },
        { status: 401 }
      );
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return NextResponse.json(
        { success: false, error: { message: "Invalid credentials", code: "UNAUTHORIZED" } },
        { status: 401 }
      );
    }

    const token = signToken({ id: user._id.toString(), email: user.email });

    return NextResponse.json(
      {
        success: true,
        token,
        user: { id: user._id, email: user.email, name: user.name },
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Login Error:", error);
    return NextResponse.json(
      { success: false, error: { message: error.message || "Internal Server Error", code: "INTERNAL_ERROR" } },
      { status: 500 }
    );
  }
}
