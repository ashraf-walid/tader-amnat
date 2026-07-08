import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import PushSubscription from "@/models/PushSubscription";
import webpush from "@/lib/webpush";
import { requireOwner } from "@/lib/auth";

export const dynamic = "force-dynamic";

/**
 * POST /api/push/send
 * يرسل إشعار Push لجميع المشتركين أو لمستخدم محدد
 * Body: { title, body, url?, userId? }
 * مقتصر على الـ owner فقط
 */
export async function POST(req) {
  try {
    requireOwner(req);

    const { title, body, url = "/", userId } = await req.json();

    if (!title || !body) {
      return NextResponse.json({ success: false, error: "العنوان والنص مطلوبان" }, { status: 400 });
    }

    await connectToDatabase();

    // إذا تم تحديد userId → أرسل له فقط، وإلا أرسل للجميع
    const filter = userId ? { userId } : {};
    const subscriptions = await PushSubscription.find(filter);

    if (subscriptions.length === 0) {
      return NextResponse.json({ success: false, error: "لا يوجد مشتركون" }, { status: 404 });
    }

    const payload = JSON.stringify({ title, body, url });
    const results = { sent: 0, failed: 0, removed: 0 };

    await Promise.allSettled(
      subscriptions.map(async (sub) => {
        try {
          await webpush.sendNotification(
            { endpoint: sub.endpoint, keys: sub.keys },
            payload
          );
          results.sent++;
        } catch (err) {
          // 410 Gone أو 404 → الاشتراك منتهي، احذفه من DB
          if (err.statusCode === 410 || err.statusCode === 404) {
            await PushSubscription.deleteOne({ _id: sub._id });
            results.removed++;
          } else {
            results.failed++;
          }
        }
      })
    );

    return NextResponse.json({ success: true, results });
  } catch (err) {
    console.error("POST /api/push/send error:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
