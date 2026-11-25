import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import ClientLedgerEntry from "@/models/ClientLedgerEntry";
import { requireOwner } from "@/lib/auth";
import { logActivity } from "@/lib/activityLog";

export const dynamic = "force-dynamic";

/**
 * DELETE /api/data/ledger
 * Deletes client ledger balance history:
 * - If ?accountCode=123 is provided: deletes history for that specific client.
 * - If no accountCode is provided: deletes history for all clients.
 * Restricted to Owner only.
 */
export async function DELETE(request) {
  try {
    const actor = requireOwner(request);
    const { searchParams } = new URL(request.url);
    const accountCode = searchParams.get("accountCode")?.trim();

    await connectToDatabase();

    if (accountCode) {
      const result = await ClientLedgerEntry.deleteMany({
        accountCode: String(accountCode),
      });

      await logActivity(actor, "ledger.delete_client", {
        details: { accountCode, deletedCount: result.deletedCount },
      });

      return NextResponse.json({
        success: true,
        accountCode,
        deletedCount: result.deletedCount,
        message: `تم حذف ${result.deletedCount} سجل للعميل ${accountCode}`,
      });
    }

    const result = await ClientLedgerEntry.deleteMany({});

    await logActivity(actor, "ledger.clear_all", {
      details: { deletedCount: result.deletedCount },
    });

    return NextResponse.json({
      success: true,
      deletedCount: result.deletedCount,
      message: `تم مسح جميع سجلات حركة الرصيد التاريخية (${result.deletedCount} سجل)`,
    });
  } catch (error) {
    console.error("DELETE /api/data/ledger Error:", error);
    if (error.name === "AuthError") {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }
    if (error.name === "ForbiddenError") {
      return NextResponse.json(
        { success: false, error: "Forbidden - Owner only" },
        { status: 403 }
      );
    }
    return NextResponse.json(
      { success: false, error: error.message || "حدث خطأ أثناء الحذف" },
      { status: 500 }
    );
  }
}
