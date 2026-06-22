import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import AccountData from "@/models/AccountData";
import Settings from "@/models/Settings";
import { requireAdmin, requireOwner } from "@/lib/auth";
import { invalidateCache } from "@/lib/cache";

export const dynamic = "force-dynamic";

export async function GET(request) {
  try {
    requireAdmin(request);
    await connectToDatabase();

    // fetch all data
    const [data, dateRangeSetting] = await Promise.all([
      AccountData.find({}).sort({ accountCode: 1 }),
      Settings.findOne({ key: "dateRange" }),
    ]);
    return NextResponse.json(
      { data, dateRange: dateRangeSetting?.value || "", timestamp: Date.now() },
      {
        headers: {
          "Cache-Control": "no-store, max-age=0, must-revalidate",
          Pragma: "no-cache",
          Expires: "0",
        },
      },
    );
  } catch (error) {
    console.error("GET /api/data Error:", error);
    if (error.name === "AuthError") {
      return NextResponse.json(
        { data: [], timestamp: Date.now(), success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }
    if (error.name === "ForbiddenError") {
      return NextResponse.json(
        { data: [], timestamp: Date.now(), success: false, error: "Forbidden - Admin only" },
        { status: 403 },
      );
    }
    return NextResponse.json(
      { data: [], timestamp: Date.now() },
      { status: 500 },
    );
  }
}

/**
 * DELETE /api/data
 * Clear ALL financial data — owner only.
 */
export async function DELETE(request) {
  try {
    requireOwner(request);

    await connectToDatabase();
    const deleted = await AccountData.deleteMany({});

    // 🔥 Invalidate all data cache
    invalidateCache("data:");
    console.log(`🗑️ All financial data cleared (${deleted.deletedCount} accounts) by owner`);

    return NextResponse.json({
      success: true,
      deletedCount: deleted.deletedCount,
      timestamp: Date.now(),
    });
  } catch (error) {
    console.error("DELETE /api/data Error:", error);
    if (error.name === "AuthError") {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }
    if (error.name === "ForbiddenError") {
      return NextResponse.json(
        { success: false, error: "Forbidden - Owner only" },
        { status: 403 },
      );
    }
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}

export async function POST(request) {
  try {
    requireAdmin(request);

    const body = await request.json();
    await connectToDatabase();

    let dataToSave = [];
    let dateRange = null;

    if (Array.isArray(body)) {
      dataToSave = body;
    } else if (body && body.data) {
      dataToSave = body.data;
      dateRange = body.dateRange;
    }

    // 🚫 Block empty POST — use DELETE /api/data to clear all data (owner only)
    if (dataToSave.length === 0) {
      return NextResponse.json(
        { success: false, error: "Cannot clear data via POST. Use DELETE /api/data (owner only)." },
        { status: 400 },
      );
    }

    // ⚠️ Safety check: Prevent accidental data loss
    if (dataToSave.length > 0 && dataToSave.length < 5) {
      const currentCount = await AccountData.countDocuments();
      if (currentCount > dataToSave.length * 2) {
        console.warn(
          `⚠️ WARNING: Attempting to replace ${currentCount} accounts with only ${dataToSave.length}. This might be a filtered dataset!`,
        );
        // Optionally, you can reject the request:
        // return NextResponse.json(
        //   { success: false, error: "Suspicious data replacement detected" },
        //   { status: 400 }
        // );
      }
    }

    // Replace all data with the new uploaded data
    // This matches the original logic of overwriting the JSON file
    await AccountData.deleteMany({});
    if (dataToSave && dataToSave.length > 0) {
      await AccountData.insertMany(dataToSave);
    }

    // Save dateRange if provided
    if (dateRange !== null) {
      await Settings.findOneAndUpdate(
        { key: "dateRange" },
        { value: dateRange },
        { upsert: true, new: true }
      );
    }

    // 🔥 Invalidate all data cache
    invalidateCache("data:");
    console.log("🗑️ Data cache invalidated after bulk upload");

    console.log("POST /api/data: Saved", dataToSave.length, "items to MongoDB");
    return NextResponse.json({ success: true, timestamp: Date.now() });
  } catch (error) {
    console.error("POST /api/data Error:", error);
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
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}
