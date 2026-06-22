import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import User from "@/models/User";
import CalculationLog from "@/models/CalculationLog";
import { requireAuth } from "@/lib/auth";
import { invalidateCache } from "@/lib/cache";

export const dynamic = "force-dynamic";

/**
 * POST /api/attempts/use
 * Combined API: Consume one attempt AND increment calculationsCount atomically.
 * This ensures both operations happen together or not at all.
 */
export async function POST(request) {
  try {
    const decoded = requireAuth(request);

    await connectToDatabase();

    const userId = decoded.userId || decoded.id;
    const user = await User.findById(userId).select(
      "attempts username calculationsCount",
    );
    if (!user) {
      return NextResponse.json(
        { success: false, error: "المستخدم غير موجود" },
        { status: 404 },
      );
    }

    // I will rerun the code if needed.
    // if (user.attempts <= 0) {
    //   return NextResponse.json(
    //     {
    //       success: false,
    //       error:
    //         "لقد استنفدت جميع المحاولات المتاحة. يرجى الاتصال بالإدارة لتجديد المحاولات.",
    //       remainingAttempts: 0,
    //     },
    //     { status: 403 },
    //   );
    // }

    // Perform both operations in one update (atomic as much as possible)
    const updated = await User.findByIdAndUpdate(
      user._id,
      { $inc: { attempts: -1, calculationsCount: 1 } },
      { returnDocument: "after", select: "attempts username calculationsCount role officeName" },
    );

    // Log this calculation for date-based reporting
    await CalculationLog.create({
      userId: user._id,
      username: updated.username,
      role: updated.role || "client",
      officeName: updated.officeName || "",
    });

    // 🔥 مسح الـ Cache لأن بيانات الحساب تغيرت (محاولات و فواتير)
    invalidateCache("accounts:");
    console.log("🗑️ Accounts cache invalidated after combined use attempt");

    return NextResponse.json({
      success: true,
      remainingAttempts: updated.attempts,
      calculationsCount: updated.calculationsCount,
      message: `متبقي ${updated.attempts} محاولة`,
    });
  } catch (error) {
    console.error("POST /api/attempts/use Error:", error);

    if (error.name === "AuthError") {
      return NextResponse.json(
        { success: false, error: "يجب تسجيل الدخول" },
        { status: 401 },
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: "حدث خطأ أثناء تحديث المحاولات والفواتير",
        message: error.message,
      },
      { status: 500 },
    );
  }
}
