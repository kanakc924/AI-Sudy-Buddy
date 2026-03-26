import { NextRequest, NextResponse } from "next/server";

const rateLimitMap = new Map<string, number[]>();

export function aiRateLimiter(req: NextRequest, userId: string) {
  const now = Date.now();
  const windowMs = 60 * 1000; // 1 minute window
  const maxRequests = 15; // Stay under OpenRouter's 20/min to have buffer

  if (!rateLimitMap.has(userId)) {
    rateLimitMap.set(userId, []);
  }

  const timestamps = rateLimitMap
    .get(userId)!
    .filter((t) => now - t < windowMs);
    
  timestamps.push(now);
  rateLimitMap.set(userId, timestamps);

  if (timestamps.length > maxRequests) {
    return NextResponse.json(
      {
        success: false,
        error: {
          message: "You are generating too fast. Please wait a moment before trying again.",
          code: "AI_RATE_LIMIT",
          retryAfter: Math.ceil(windowMs / 1000),
        },
      },
      { status: 429 }
    );
  }

  return null; // indicate no rate limit reached
}
