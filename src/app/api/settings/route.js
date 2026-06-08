import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import Settings from "@/models/Settings";
import { requireAdmin } from "@/lib/auth";

export async function GET(req) {
  try {
    await connectToDatabase();
    // Default to the original hardcoded rate if it hasn't been saved yet
    const defaultRate = 53;

    const rateSetting = await Settings.findOne({ key: "exchangeRate" });

    // Return the value directly if it exists, otherwise default
    const rateValue =
      rateSetting && rateSetting.value
        ? Number(rateSetting.value)
        : defaultRate;

    return NextResponse.json({ success: true, exchangeRate: rateValue });
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

    await connectToDatabase();

    const rateSetting = await Settings.findOneAndUpdate(
      { key: "exchangeRate" },
      { value: Number(exchangeRate) },
      { returnDocument: "after", upsert: true },
    );

    return NextResponse.json({
      success: true,
      exchangeRate: rateSetting.value,
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
