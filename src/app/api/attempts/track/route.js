import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import User from "@/models/User";
import { requireAuth } from "@/lib/auth";

export const dynamic = "force-dynamic";

/**
 * POST /api/attempts/track
 * Increment calculationsCount after a successful bill calculation.
 * Called from the client only after setResult() — i.e. only on success.
 */
export async function POST(request) {
  try {
    const decoded = requireAuth(request);

    await connectToDatabase();

    console.log("Track: updating user", decoded.userId);
    // Increment using findByIdAndUpdate to bypass bcrypt pre-save hook
    const updated = await User.findByIdAndUpdate(
      decoded.userId,
      { $inc: { calculationsCount: 1 } },
      { returnDocument: "after" },
    );

    console.log("Track result:", {
      found: !!updated,
      calculationsCount: updated?.calculationsCount,
      username: updated?.username,
    });

    if (!updated) {
      return NextResponse.json(
        { success: false, error: "المستخدم غير موجود" },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      calculationsCount: updated.calculationsCount,
    });
  } catch (error) {
    console.error("POST /api/attempts/track Error:", error);

    if (error.name === "AuthError") {
      return NextResponse.json(
        { success: false, error: "يجب تسجيل الدخول" },
        { status: 401 },
      );
    }

    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}
