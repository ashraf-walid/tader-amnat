import { NextResponse } from "next/server";
import { requireAuth, AuthError } from "@/lib/auth";

/**
 * GET /api/auth/me
 * Returns the current authenticated user's info from the JWT token.
 */
export async function GET(request) {
  try {
    const decoded = requireAuth(request);
    return NextResponse.json({
      success: true,
      user: {
        id: decoded.id,
        username: decoded.username,
        role: decoded.role,
      },
    });
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json(
        { success: false, error: "غير مسجل الدخول" },
        { status: 401 }
      );
    }
    return NextResponse.json(
      { success: false, error: "حدث خطأ في الخادم" },
      { status: 500 }
    );
  }
}
