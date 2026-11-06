import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import Settings from "@/models/Settings";
import { notifyAdmins, saveExchangeRate } from "@/lib/exchangeRate";

export const dynamic = "force-dynamic";

const SOURCE_URL = "https://allratestoday.com/api/open/central-bank/cbe";
const AUTO_SETTING_KEY = "exchangeRateAuto";
const MAX_CHANGE_RATIO = 0.05;
const HISTORY_LIMIT = 30;

async function fetchUsdSellRate() {
  const response = await fetch(SOURCE_URL, {
    cache: "no-store",
    signal: AbortSignal.timeout(10000),
  });
  if (!response.ok) {
    throw new Error(`Rate source returned ${response.status}`);
  }

  const data = await response.json();
  const sellRate = data.rates?.find(
    (r) => r.base === "USD" && r.quote === "EGP" && r.type === "sell",
  );
  const rate = Math.round(Number(sellRate?.value) * 100) / 100;

  if (!data.rate_date || !(rate > 0)) {
    throw new Error("Rate source response has no USD sell rate");
  }

  return { rate, rateDate: data.rate_date };
}

async function updateRate(isLive) {
  const { rate, rateDate } = await fetchUsdSellRate();

  // Fridays, Saturdays and holidays publish nothing, so the date stays old
  const today = new Date().toLocaleDateString("en-CA", { timeZone: "Africa/Cairo" });
  if (rateDate !== today) {
    return { status: "no-new-rate", rateDate };
  }

  await connectToDatabase();

  const autoSetting = await Settings.findOne({ key: AUTO_SETTING_KEY }).lean();
  const history = autoSetting?.value?.history ?? [];
  if (history.at(-1)?.rateDate === rateDate) {
    return { status: "already-processed", rateDate };
  }

  const currentSetting = await Settings.findOne({ key: "exchangeRate" }).lean();
  const previousRate = Number(currentSetting?.value) || null;
  const changeRatio = previousRate ? Math.abs(rate - previousRate) / previousRate : 0;

  let status;
  if (changeRatio > MAX_CHANGE_RATIO) {
    status = "rejected";
  } else if (rate === previousRate) {
    status = "unchanged";
  } else {
    status = isLive ? "updated" : "trial";
  }

  if (status === "updated") {
    await saveExchangeRate(rate);
  }

  const entry = { rateDate, rate, previousRate, status, checkedAt: new Date() };
  await Settings.findOneAndUpdate(
    { key: AUTO_SETTING_KEY },
    { value: { history: [...history, entry].slice(-HISTORY_LIMIT) } },
    { upsert: true },
  );
  console.log("Automatic exchange rate:", entry);

  if (status === "rejected" && isLive) {
    await notifyAdmins(
      `السعر الجديد ${rate} ج.م بعيد عن السعر الحالي ${previousRate} ج.م ولم يتم حفظه. راجعوا السعر يدويًا.`,
    );
  }

  return { status, rateDate, rate, previousRate };
}

export async function GET(req) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const isLive = process.env.NEXT_PUBLIC_AUTO_EXCHANGE_RATE_LIVE === "true";

  try {
    const result = await updateRate(isLive);
    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    console.error("Automatic exchange rate update failed:", error);

    if (isLive) {
      try {
        await notifyAdmins("تعذر تحديث سعر الصرف تلقائيًا. برجاء تسجيله يدويًا.");
      } catch (notifyError) {
        console.error("Failed to alert admins:", notifyError);
      }
    }

    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
