import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import Settings from "@/models/Settings";
import { requireAdmin } from "@/lib/auth";
import cache, { CacheKeys, CacheTTL } from "@/lib/cache";
import { saveExchangeRate } from "@/lib/exchangeRate";

export async function GET() {
  try {
    // 1️⃣ Try reading from memory first
    const cachedRate = cache.get(CacheKeys.EXCHANGE_RATE);
    if (cachedRate !== null) {
      console.log("✅ Exchange rate from cache:", cachedRate);
      return NextResponse.json({
        success: true,
        exchangeRate: cachedRate,
        fromCache: true,
      });
    }

    // 2️⃣ If not found in memory, read from MongoDB
    await connectToDatabase();
    const defaultRate = 53;

    const rateSetting = await Settings.findOne({ key: "exchangeRate" }).lean();

    const rateValue =
      rateSetting && rateSetting.value
        ? Number(rateSetting.value)
        : defaultRate;

    // 3️⃣ احفظ في الذاكرة لمدة 24 ساعة
    cache.set(CacheKeys.EXCHANGE_RATE, rateValue, CacheTTL.EXCHANGE_RATE);
    console.log("📦 Exchange rate cached:", rateValue);

    return NextResponse.json(
      {
        success: true,
        exchangeRate: rateValue,
        updatedAt: rateSetting?.updatedAt || null,
        fromCache: false,
      },
    );
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
    requireAdmin(req);

    const body = await req.json();
    const { exchangeRate } = body;

    if (!exchangeRate || isNaN(exchangeRate)) {
      return NextResponse.json(
        { success: false, error: "Invalid exchange rate" },
        { status: 400 },
      );
    }

    const rateSetting = await saveExchangeRate(Number(exchangeRate));

    return NextResponse.json({
      success: true,
      exchangeRate: rateSetting.value,
      updatedAt: rateSetting.updatedAt,
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
