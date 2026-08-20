import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import AccountData from "@/models/AccountData";
import { requireAdmin } from "@/lib/auth";
import { invalidateCache } from "@/lib/cache";

export const dynamic = "force-dynamic";

export async function POST(request) {
  try {
    requireAdmin(request);

    const body = await request.json();
    const { targetDate } = body;

    if (!targetDate) {
      return NextResponse.json(
        { success: false, error: "يجب تحديد التاريخ المطلوب" },
        { status: 400 },
      );
    }

    await connectToDatabase();

    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);

    const accountsWithTransactions = await AccountData.find({
      "transactions.date": {
        $gte: startOfDay,
        $lte: endOfDay,
      },
    });

    if (accountsWithTransactions.length === 0) {
      return NextResponse.json({
        success: true,
        message: "لا توجد معاملات مسجلة في هذا التاريخ",
        totalDeletedTransactions: 0,
        affectedAccountsCount: 0,
      });
    }

    let totalDeletedTransactions = 0;
    let totalDeletedAmount = { additions: 0, deductions: 0 };

    for (const account of accountsWithTransactions) {
      const originalCount = account.transactions.length;

      const toDelete = account.transactions.filter((t) => {
        const d = new Date(t.date);
        return d >= startOfDay && d <= endOfDay;
      });

      toDelete.forEach((t) => {
        if (t.type === "addition") {
          totalDeletedAmount.additions += t.amount || 0;
        } else if (t.type === "deduction") {
          totalDeletedAmount.deductions += t.amount || 0;
        }
      });

      account.transactions = account.transactions.filter((t) => {
        const d = new Date(t.date);
        return !(d >= startOfDay && d <= endOfDay);
      });

      const deletedCount = originalCount - account.transactions.length;
      totalDeletedTransactions += deletedCount;

      if (deletedCount > 0) {
        const manualAdditions = account.transactions
          .filter((t) => t.type === "addition")
          .reduce((sum, t) => sum + (t.amount || 0), 0);

        const manualDeductions = account.transactions
          .filter((t) => t.type === "deduction")
          .reduce((sum, t) => sum + (t.amount || 0), 0);

        account.totals = {
          debit: manualAdditions,
          credit: manualDeductions,
        };

        await account.save();
      }
    }

    invalidateCache("data:");

    return NextResponse.json({
      success: true,
      totalDeletedTransactions,
      affectedAccountsCount: accountsWithTransactions.length,
      totalDeletedAmount,
    });
  } catch (error) {
    console.error("POST /api/data/delete-transactions Error:", error);
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
