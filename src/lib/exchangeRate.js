import { connectToDatabase } from "@/lib/mongodb";
import Settings from "@/models/Settings";
import PushSubscription from "@/models/PushSubscription";
import User from "@/models/User";
import webpush from "@/lib/webpush";
import cache, { CacheKeys, CacheTTL } from "@/lib/cache";

async function sendPush(filter, message) {
  try {
    const subscriptions = await PushSubscription.find(filter);
    if (subscriptions.length === 0) return;

    const payload = JSON.stringify(message);

    // Awaited because a serverless function can stop as soon as it responds
    await Promise.allSettled(
      subscriptions.map(async (sub) => {
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
    );
  } catch (pushErr) {
    console.error("Failed to send push notifications:", pushErr);
  }
}

/**
 * Saves the official exchange rate, refreshes the cache and tells every
 * subscriber. Used by both the admin form and the automatic update.
 */
export async function saveExchangeRate(value) {
  await connectToDatabase();

  const currentSetting = await Settings.findOne({ key: "exchangeRate" }).lean();
  const currentRate = Number(currentSetting?.value);

  const rateSetting = await Settings.findOneAndUpdate(
    { key: "exchangeRate" },
    { value },
    { returnDocument: "after", upsert: true },
  );

  cache.delete(CacheKeys.EXCHANGE_RATE);
  cache.set(CacheKeys.EXCHANGE_RATE, rateSetting.value, CacheTTL.EXCHANGE_RATE);

  // Saving the same rate again must not erase the real previous rate
  if (currentRate > 0 && currentRate !== Number(value)) {
    await Settings.findOneAndUpdate(
      { key: "previousExchangeRate" },
      { value: currentRate },
      { upsert: true },
    );
    cache.set(CacheKeys.PREVIOUS_EXCHANGE_RATE, currentRate, CacheTTL.EXCHANGE_RATE);
  }

  await sendPush({}, {
    title: "تحديث سعر الصرف 💱",
    body: `تم تحديث سعر الصرف الرسمي في النظام إلى ${rateSetting.value} ج.م.`,
    url: "/Storagecalculator",
  });

  return rateSetting;
}

/**
 * Alerts admins and owners only: subscribers can also be clients.
 */
export async function notifyAdmins(body) {
  await connectToDatabase();

  const admins = await User.find({ role: { $in: ["admin", "owner"] } })
    .select("_id")
    .lean();

  await sendPush(
    { userId: { $in: admins.map((admin) => admin._id) } },
    { title: "تحديث سعر الصرف التلقائي ⚠️", body, url: "/admin" },
  );
}
