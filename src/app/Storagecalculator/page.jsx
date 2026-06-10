import { STORAGE_CONFIG } from "@/lib/storageConstants";
import StorageCalculator from "./StorageCalculator";
import cache, { CacheKeys, CacheTTL } from "@/lib/cache";
import { connectToDatabase } from "@/lib/mongodb";
import Settings from "@/models/Settings";

// ⚡ إجبار Next.js على عدم حفظ هذه الصفحة في cache
export const dynamic = 'force-dynamic';
export const revalidate = 0;

const DEFAULT_RATE = STORAGE_CONFIG.GLOBAL.DEFAULT_EXCHANGE_RATE;

export default async function Page() {
  let exchangeRate = DEFAULT_RATE;

  try {
    console.log('🔄 [StorageCalc] Loading exchange rate...');

    // 1️⃣ محاولة القراءة من Server Cache أولاً
    const cachedRate = cache.get(CacheKeys.EXCHANGE_RATE);

    if (cachedRate !== null) {
      console.log("⚡ [StorageCalc] Exchange rate from server cache:", cachedRate);
      exchangeRate = cachedRate;
    } else {
      console.log("📡 [StorageCalc] Cache miss, reading from MongoDB...");

      // 2️⃣ إذا لم توجد في Cache، اقرأ من MongoDB
      await connectToDatabase();
      const rateSetting = await Settings.findOne({ key: "exchangeRate" }).lean();

      if (rateSetting?.value) {
        exchangeRate = Number(rateSetting.value);

        // 3️⃣ احفظ في Cache لمدة 24 ساعة
        cache.set(CacheKeys.EXCHANGE_RATE, exchangeRate, CacheTTL.EXCHANGE_RATE);
        console.log("📦 [StorageCalc] Exchange rate cached:", exchangeRate);
      } else {
        console.log("⚠️ [StorageCalc] No rate in MongoDB, using default:", DEFAULT_RATE);
      }
    }

    console.log("✅ [StorageCalc] Final exchange rate:", exchangeRate);
  } catch (error) {
    console.error("❌ [StorageCalc] Failed to fetch exchange rate:", error);
    // Fall back to DEFAULT_RATE — the client will still work
  }

  return <StorageCalculator adminExchangeRate={exchangeRate} />;
}
