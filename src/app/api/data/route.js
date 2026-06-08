import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import AccountData from "@/models/AccountData";
import { requireAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(request) {
  try {
    await connectToDatabase();

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limitParam = parseInt(searchParams.get("limit") || "50", 10);
    // limit=0 means "return all" (used by backup download)
    const fetchAll = limitParam === 0;
    const limit = fetchAll ? 0 : Math.min(Math.max(1, limitParam), 200);
    const search = (searchParams.get("search") || "").trim();
    const transactionsOnly = searchParams.get("transactionsOnly") === "true";

    // Build query filter
    const filter = {};
    if (search) {
      const regex = new RegExp(
        search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
        "i",
      );
      filter.$or = [{ account: regex }, { accountCode: regex }];
    }
    if (transactionsOnly) {
      filter.transactions = { $exists: true, $not: { $size: 0 } };
    }

    // If fetching all (backup), skip pagination
    if (fetchAll) {
      const data = await AccountData.find(filter).sort({ accountCode: 1 });
      return NextResponse.json(
        { data, timestamp: Date.now() },
        {
          headers: {
            "Cache-Control": "no-store, max-age=0, must-revalidate",
            Pragma: "no-cache",
            Expires: "0",
          },
        },
      );
    }

    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      AccountData.find(filter).sort({ accountCode: 1 }).skip(skip).limit(limit),
      AccountData.countDocuments(filter),
    ]);

    const totalPages = Math.ceil(total / limit) || 1;

    return NextResponse.json(
      {
        data,
        pagination: {
          page,
          limit,
          total,
          totalPages,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1,
        },
        timestamp: Date.now(),
      },
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
    return NextResponse.json(
      {
        data: [],
        pagination: {
          page: 1,
          limit: 50,
          total: 0,
          totalPages: 1,
          hasNextPage: false,
          hasPrevPage: false,
        },
        timestamp: Date.now(),
      },
      { status: 500 },
    );
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
