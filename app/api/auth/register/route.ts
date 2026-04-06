import { NextRequest, NextResponse } from "next/server";
import connectDB from "../../../../lib/db";
import User from "../../../../models/User";
import bcrypt from "bcryptjs";
import { signToken } from "../../../../lib/auth";

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const body = await req.json();
    const { email, password, name } = body;

    if (!email || !password || !name) {
      return NextResponse.json(
        { success: false, error: { message: "Please provide all required fields", code: "VALIDATION_ERROR" } },
        { status: 400 }
      );
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return NextResponse.json(
        { success: false, error: { message: "User already exists with this email", code: "CONFLICT" } },
        { status: 409 }
      );
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = await User.create({
      email,
      name,
      passwordHash: hashedPassword,
    });

    const token = signToken({ id: newUser._id.toString(), email: newUser.email });

    return NextResponse.json(
      { success: true, token, user: { id: newUser._id, email: newUser.email, name: newUser.name } },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Register Error:", error);
    return NextResponse.json(
      { success: false, error: { message: error.message || "Internal Server Error", code: "INTERNAL_ERROR" } },
      { status: 500 }
    );
  }
}
