import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import Settings from "@/models/Settings";
import { requireAdmin } from "@/lib/auth";
import cache, { CacheKeys, CacheTTL } from "@/lib/cache";
import { saveExchangeRate } from "@/lib/exchangeRate";
import { logActivity } from "@/lib/activityLog";

export async function GET() {
  try {
    await connectToDatabase();
    const defaultRate = 53;

    const rateSetting = await Settings.findOne({ key: "exchangeRate" }).lean();

    const rateValue =
      rateSetting && rateSetting.value
        ? Number(rateSetting.value)
        : defaultRate;

    // Read or initialize exchangeRateHistory
    let historyDoc = await Settings.findOne({ key: "exchangeRateHistory" }).lean();
    let history = Array.isArray(historyDoc?.value) ? historyDoc.value : [];

    if (history.length === 0 && rateSetting?.value) {
      const prevSetting = await Settings.findOne({ key: "previousExchangeRate" }).lean();
      history = [
        {
          rate: Number(rateSetting.value),
          date: rateSetting.updatedAt || new Date(),
          by: "الحالي",
        },
      ];
      if (prevSetting?.value && Number(prevSetting.value) !== Number(rateSetting.value)) {
        history.push({
          rate: Number(prevSetting.value),
          date: prevSetting.updatedAt || new Date(Date.now() - 86400000),
          by: "سابق",
        });
      }
      await Settings.findOneAndUpdate(
        { key: "exchangeRateHistory" },
        { value: history },
        { upsert: true }
      );
    }

    cache.set(CacheKeys.EXCHANGE_RATE, rateValue, CacheTTL.EXCHANGE_RATE);

    return NextResponse.json({
      success: true,
      exchangeRate: rateValue,
      updatedAt: rateSetting?.updatedAt || null,
      history: history.slice(0, 3),
      fromCache: false,
    });
  } catch (error) {
    console.error("Failed to fetch settings:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}

export async function PUT(req) {
  try {
    // Only admin/owner can change settings
    const actor = requireAdmin(req);

    const body = await req.json();
    const { exchangeRate } = body;

    if (!exchangeRate || isNaN(exchangeRate)) {
      return NextResponse.json(
        { success: false, error: "Invalid exchange rate" },
        { status: 400 },
      );
    }

    await connectToDatabase();
    const current = await Settings.findOne({ key: "exchangeRate" }).lean();
    const rateSetting = await saveExchangeRate(Number(exchangeRate), actor.username);

    if (Number(current?.value) !== Number(rateSetting.value)) {
      await logActivity(actor, "rate.update", {
        details: { from: current?.value ?? null, to: rateSetting.value },
      });
    }

    const historyDoc = await Settings.findOne({ key: "exchangeRateHistory" }).lean();
    let history = Array.isArray(historyDoc?.value) ? historyDoc.value : [];
    if (history.length === 0) {
      history = [{ rate: rateSetting.value, date: rateSetting.updatedAt, by: actor.username }];
    }

    return NextResponse.json({
      success: true,
      exchangeRate: rateSetting.value,
      updatedAt: rateSetting.updatedAt,
      history: history.slice(0, 3),
    });
  } catch (error) {
    if (error.name === "AuthError") {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }
    if (error.name === "ForbiddenError") {
      return NextResponse.json(
        { success: false, error: "Forbidden - Admin only" },
        { status: 403 },
      );
    }
    console.error("Failed to update settings:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}
