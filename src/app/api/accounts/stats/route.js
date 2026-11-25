import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import User from "@/models/User";
import CalculationLog from "@/models/CalculationLog";
import PageVisit from "@/models/PageVisit";
import { requireOwner } from "@/lib/auth";
import { logActivity } from "@/lib/activityLog";
import { invalidateCache } from "@/lib/cache";

export const dynamic = "force-dynamic";

/**
 * DELETE /api/accounts/stats
 * Deletes specific user activity data (Owner only).
 * Query params:
 * - target: "calculationsCount" | "lastCalculation" | "lastBalanceView"
 * - userId: optional (if omitted or empty, applies to ALL accounts)
 */
export async function DELETE(request) {
  try {
    const actor = requireOwner(request);
    const { searchParams } = new URL(request.url);
    const target = searchParams.get("target")?.trim();
    const userId = searchParams.get("userId")?.trim();

    if (!["calculationsCount", "lastCalculation", "lastBalanceView"].includes(target)) {
      return NextResponse.json(
        { success: false, error: "نوع البيانات المراد حذفها غير محدد أو غير صالح" },
        { status: 400 }
      );
    }

    await connectToDatabase();

    let targetUser = null;
    if (userId) {
      targetUser = await User.findById(userId).select("username").lean();
      if (!targetUser) {
        return NextResponse.json({ success: false, error: "المستخدم غير موجود" }, { status: 404 });
      }
    }

    let affectedCount = 0;
    let message = "";

    switch (target) {
      case "calculationsCount": {
        if (userId) {
          const res = await User.updateOne({ _id: userId }, { $set: { calculationsCount: 0 } });
          affectedCount = res.modifiedCount;
          message = `تم تصفير عدد عمليات الحساب للمستخدم ${targetUser.username}`;
        } else {
          const res = await User.updateMany({}, { $set: { calculationsCount: 0 } });
          affectedCount = res.modifiedCount;
          message = `تم تصفير عدد عمليات الحساب لجميع المستخدمين (${affectedCount} حساب)`;
        }
        break;
      }

      case "lastCalculation": {
        if (userId) {
          const res = await CalculationLog.deleteMany({ userId });
          affectedCount = res.deletedCount;
          message = `تم مسح سجلات فواتير المستخدم ${targetUser.username} (${affectedCount} سجل)`;
        } else {
          const res = await CalculationLog.deleteMany({});
          affectedCount = res.deletedCount;
          message = `تم مسح سجلات فواتير جميع المستخدمين (${affectedCount} سجل)`;
        }
        break;
      }

      case "lastBalanceView": {
        if (userId) {
          const res = await PageVisit.deleteMany({ userId, page: "/client/balance" });
          affectedCount = res.deletedCount;
          message = `تم مسح سجل فتح كشف الرصيد للمستخدم ${targetUser.username}`;
        } else {
          const res = await PageVisit.deleteMany({ page: "/client/balance" });
          affectedCount = res.deletedCount;
          message = `تم مسح سجل فتح كشف الرصيد لجميع المستخدمين (${affectedCount} سجل)`;
        }
        break;
      }
    }

    // Invalidate accounts cache
    invalidateCache("accounts:");

    await logActivity(actor, `stats.delete_${target}`, {
      details: { target, userId: userId || "all", affectedCount },
    });

    return NextResponse.json({
      success: true,
      target,
      userId: userId || "all",
      affectedCount,
      message,
    });
  } catch (error) {
    console.error("DELETE /api/accounts/stats Error:", error);
    if (error.name === "AuthError") {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }
    if (error.name === "ForbiddenError") {
      return NextResponse.json({ success: false, error: "Forbidden - Owner only" }, { status: 403 });
    }
    return NextResponse.json(
      { success: false, error: error.message || "حدث خطأ أثناء الحذف" },
      { status: 500 }
    );
  }
}
