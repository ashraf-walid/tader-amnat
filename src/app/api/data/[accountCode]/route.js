import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import AccountData from "@/models/AccountData";
import { requireAdmin } from "@/lib/auth";
import { invalidateCache } from "@/lib/cache";
import { calculateNetBalance, sendBalanceNotification } from "@/lib/balanceNotification";

export const dynamic = "force-dynamic";

/**
 * PATCH /api/data/[accountCode]
 * Update a single account's transactions
 */
export async function PATCH(request, { params }) {
  try {
    requireAdmin(request);

    const { accountCode } = await params;
    const body = await request.json();
    const { transactions } = body;

    if (!transactions || !Array.isArray(transactions)) {
      return NextResponse.json(
        {
          success: false,
          error: "Transactions array is required",
        },
        { status: 400 },
      );
    }

    await connectToDatabase();

    const existingAccount = await AccountData.findOne({ accountCode }).lean();
    if (!existingAccount) {
      return NextResponse.json(
        {
          success: false,
          error: "Account not found",
        },
        { status: 404 },
      );
    }
    const oldBal = calculateNetBalance(existingAccount);

    // Update only the transactions field for this specific account
    const updatedAccount = await AccountData.findOneAndUpdate(
      { accountCode },
      { $set: { transactions } },
      { returnDocument: "after" },
    );

    if (!updatedAccount) {
      return NextResponse.json(
        {
          success: false,
          error: "Account not found",
        },
        { status: 404 },
      );
    }

    // Compare new balance with old balance and send notification if changed
    const newBal = calculateNetBalance(updatedAccount);
    if (Math.abs(oldBal - newBal) > 0.001) {
      sendBalanceNotification(accountCode, newBal);
    }

    // 🔥 Invalidate cache for data pages
    invalidateCache("data:");
    console.log("🗑️ Data cache invalidated after transaction update");

    return NextResponse.json({
      success: true,
      account: updatedAccount,
      message: "تم تحديث المعاملات بنجاح",
    });
  } catch (error) {
    console.error("PATCH /api/data/[accountCode] Error:", error);
    if (error.name === "AuthError" || error.name === "ForbiddenError") {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}
