import { NextRequest, NextResponse } from "next/server";
import { verifyToken, JwtPayload } from "./auth";

/**
 * Custom request type extending NextRequest to include our parsed user data.
 */
export interface AuthenticatedRequest extends NextRequest {
  user: JwtPayload;
}

/**
 * Higher-order function to protect API routes.
 * It checks the Authorization header for a valid Bearer token,
 * verifies it, and attaches the payload to `req.user`.
 */
export function withAuth(
  handler: (req: AuthenticatedRequest, ...args: any[]) => Promise<NextResponse> | NextResponse
) {
  return async (req: NextRequest, ...args: any[]) => {
    try {
      let token: string | undefined = req.cookies.get("study_buddy_token")?.value;

      if (!token) {
        const authHeader = req.headers.get("authorization");
        if (authHeader && authHeader.startsWith("Bearer ")) {
          token = authHeader.split(" ")[1];
        }
      }

      if (!token) {
        return NextResponse.json(
          { success: false, error: { message: "Unauthorized: Missing token", code: "UNAUTHORIZED" } },
          { status: 401 }
        );
      }
      const decoded = verifyToken(token);

      if (!decoded) {
        return NextResponse.json(
          { success: false, error: { message: "Unauthorized: Invalid token", code: "UNAUTHORIZED" } },
          { status: 401 }
        );
      }

      // We clone the request and add the user property on our custom type but 
      // JavaScript allows us to just mutate it or pass it nicely casted.
      (req as AuthenticatedRequest).user = decoded;

      return await handler(req as AuthenticatedRequest, ...args);
    } catch (error) {
      console.error("Auth Middleware Error:", error);
      return NextResponse.json(
        { success: false, error: { message: "Internal Server Error", code: "INTERNAL_ERROR" } },
        { status: 500 }
      );
    }
  };
}
