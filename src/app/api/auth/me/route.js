import { NextResponse } from "next/server";
import { requireAuth, AuthError } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import User from "@/models/User";

/**
 * GET /api/auth/me
 * Returns the current authenticated user's info from the database.
 */
export async function GET(request) {
  try {
    const decoded = requireAuth(request);
    await connectToDatabase();

    const userId = decoded.id || decoded.userId;
    const user = await User.findById(userId).select("-password");

    if (!user) {
      return NextResponse.json(
        { success: false, error: "المستخدم غير موجود" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user._id.toString(),
        username: user.username,
        role: user.role,
        phone: user.phone,
        officeName: user.officeName,
        attempts: user.attempts,
        accountCode: user.accountCode,
        isActive: user.isActive,
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
