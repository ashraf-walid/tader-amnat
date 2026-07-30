import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import Settings from "@/models/Settings";

export async function GET() {
  try {
    await connectToDatabase();

    const dateRangeSetting = await Settings.findOne({ key: "dateRange" }).lean();

    return NextResponse.json({
      success: true,
      dateRange: dateRangeSetting?.value || "",
      updatedAt: dateRangeSetting?.updatedAt || null,
    });
  } catch (error) {
    console.error("Failed to fetch dateRange setting:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}