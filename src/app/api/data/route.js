import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import AccountData from "@/models/AccountData";
import { requireAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await connectToDatabase();
    const data = await AccountData.find({}).sort({ accountCode: 1 });

    return NextResponse.json(
      {
        data: data,
        timestamp: Date.now(),
      },
      {
        headers: {
          "Cache-Control": "no-store, max-age=0, must-revalidate",
          Pragma: "no-cache",
          Expires: "0",
        },
      }
    );
  } catch (error) {
    console.error("GET /api/data Error:", error);
    return NextResponse.json({ data: [], timestamp: Date.now() });
  }
}

export async function POST(request) {
  try {
    // Only admin/owner can upload data
    requireAdmin(request);

    const data = await request.json();
    await connectToDatabase();

    // Replace all data with the new uploaded data
    // This matches the original logic of overwriting the JSON file
    await AccountData.deleteMany({});
    if (data && data.length > 0) {
      await AccountData.insertMany(data);
    }

    console.log("POST /api/data: Saved", data.length, "items to MongoDB");
    return NextResponse.json({ success: true, timestamp: Date.now() });
  } catch (error) {
    console.error("POST /api/data Error:", error);
    if (error.name === "AuthError") {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }
    if (error.name === "ForbiddenError") {
      return NextResponse.json(
        { success: false, error: "Forbidden - Admin only" },
        { status: 403 }
      );
    }
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
