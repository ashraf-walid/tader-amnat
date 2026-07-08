import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import User from "@/models/User";
import CalculationLog from "@/models/CalculationLog";
import PushSubscription from "@/models/PushSubscription";
import webpush from "@/lib/webpush";
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

    // 🔔 إرسال إشعار للمالك (owner) عند حساب فاتورة جديدة
    try {
      const owners = await User.find({ role: "owner" }).select("_id").lean();
      // const ownerIds = owners.map((o) => o._id);

      // استبعاد المالك نفسه من تلقي إشعار عن حركته هو
      // const targetSubscriptions = await PushSubscription.find({
      //   userId: { $in: ownerIds, $ne: user._id },
      // });

      if (targetSubscriptions.length > 0) {
        const payload = JSON.stringify({
          title: "حساب فاتورة جديدة ⚓",
          body: `قام ${updated.username}${
            updated.officeName ? ` (${updated.officeName})` : ""
          } بحساب فاتورة أرضيات جديدة.`,
          url: "/admin",
        });

        // إرسال الإشعارات بدون تعطيل الـ response الرئيسي
        Promise.allSettled(
          targetSubscriptions.map(async (sub) => {
            try {
              await webpush.sendNotification(
                { endpoint: sub.endpoint, keys: sub.keys },
                payload
              );
            } catch (err) {
              if (err.statusCode === 410 || err.statusCode === 404) {
                await PushSubscription.deleteOne({ _id: sub._id });
              }
            }
          })
        ).catch((err) => console.error("Promise.allSettled push error:", err));
      }
    } catch (pushErr) {
      console.error("Failed to send push notification to owner:", pushErr);
    }

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
