import { connectToDatabase } from "@/lib/mongodb";
import Settings from "@/models/Settings";
import { STORAGE_CONFIG } from "@/lib/storageConstants";
import StorageCalculator from "./StorageCalculator";

const DEFAULT_RATE = STORAGE_CONFIG.GLOBAL.DEFAULT_EXCHANGE_RATE;

export default async function Page() {
  let exchangeRate = DEFAULT_RATE;

  try {
    await connectToDatabase();
    const rateSetting = await Settings.findOne({ key: "exchangeRate" }).lean();
    if (rateSetting?.value) {
      exchangeRate = Number(rateSetting.value);
    }
  } catch (error) {
    console.error("Failed to fetch exchange rate on server:", error);
    // Fall back to DEFAULT_RATE — the client will still work
  }

  return <StorageCalculator adminExchangeRate={exchangeRate} />;
}
