import { NextResponse } from "next/server";
import connectDB from "@/lib/db"; // Use default import

export async function GET() {
  try {
    await connectDB();
    return NextResponse.json({ 
      success: true, 
      message: "MongoDB connected successfully" 
    });
  } catch (error: any) {
    return NextResponse.json({ 
      success: false, 
      message: error.message 
    }, { status: 500 });
  }
}
