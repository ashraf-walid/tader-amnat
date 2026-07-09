import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import PushSubscription from "@/models/PushSubscription";
import { requireAuth } from "@/lib/auth";

export const dynamic = "force-dynamic";

/**
 * POST /api/push/subscribe
 * Saves the user's Push Subscription in the database
*/
export async function POST(req) {
  try {
    const decoded = requireAuth(req);
    const subscription = await req.json();

    if (!subscription?.endpoint || !subscription?.keys?.p256dh || !subscription?.keys?.auth) {
      return NextResponse.json({ success: false, error: "بيانات الاشتراك غير مكتملة" }, { status: 400 });
    }

    await connectToDatabase();

    // upsert: Update if available, create if not — to avoid duplication for the same device
    await PushSubscription.findOneAndUpdate(
      { endpoint: subscription.endpoint },
      {
        userId:   decoded.userId,
        username: decoded.username,
        endpoint: subscription.endpoint,
        keys: {
          p256dh: subscription.keys.p256dh,
          auth:   subscription.keys.auth,
        },
      },
      { upsert: true, new: true }
    );

    return NextResponse.json({ success: true, message: "تم حفظ الاشتراك بنجاح" });
  } catch (err) {
    console.error("POST /api/push/subscribe error:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
