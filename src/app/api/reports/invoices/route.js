import mongoose from "mongoose";
import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { requireOwner } from "@/lib/auth";
import { invalidateCache } from "@/lib/cache";
import { logActivity } from "@/lib/activityLog";
import CalculationLog from "@/models/CalculationLog";
import User from "@/models/User";

export const dynamic = "force-dynamic";

export async function DELETE(request) {
  try {
    const actor = requireOwner(request);
    const body = await request.json();
    const { userId, invoiceIds, deleteAll } = body || {};

    if (!mongoose.isValidObjectId(userId)) {
      return NextResponse.json({ success: false, error: "معرّف العميل غير صالح" }, { status: 400 });
    }
    if (deleteAll !== true && (!Array.isArray(invoiceIds) || invoiceIds.length === 0 || invoiceIds.length > 2000)) {
      return NextResponse.json({ success: false, error: "حدد فاتورة واحدة على الأقل للحذف" }, { status: 400 });
    }
    if (deleteAll !== true && invoiceIds.some((id) => !mongoose.isValidObjectId(id))) {
      return NextResponse.json({ success: false, error: "تحتوي قائمة الفواتير على معرّف غير صالح" }, { status: 400 });
    }

    await connectToDatabase();
    const clientId = new mongoose.Types.ObjectId(userId);
    const client = await User.findById(clientId).select("username calculationsCount").lean();
    const query = { userId: clientId };
    if (deleteAll !== true) {
      query._id = { $in: [...new Set(invoiceIds)].map((id) => new mongoose.Types.ObjectId(id)) };
    }

    const deletion = await CalculationLog.deleteMany(query);
    const deletedCount = deletion.deletedCount || 0;
    if (deletedCount > 0) {
      const counterUpdate = await User.updateOne(
        { _id: clientId, calculationsCount: { $gte: deletedCount } },
        { $inc: { calculationsCount: -deletedCount } },
      );
      if (counterUpdate.matchedCount === 0 && client) {
        await User.updateOne({ _id: clientId }, { $set: { calculationsCount: 0 } });
      }

      invalidateCache("accounts:");
      await logActivity(actor, deleteAll === true ? "invoice.deleteAll" : "invoice.deleteSelected", {
        target: { kind: "client", accountCode: String(clientId), name: client?.username || "" },
        details: { deletedCount, invoiceIds: deleteAll === true ? [] : [...new Set(invoiceIds)] },
      });
    }

    const updatedClient = client
      ? await User.findById(clientId).select("calculationsCount").lean()
      : null;

    return NextResponse.json({
      success: true,
      deletedCount,
      calculationsCount: updatedClient?.calculationsCount || 0,
    });
  } catch (error) {
    if (error.name === "AuthError") {
      return NextResponse.json({ success: false, error: "يجب تسجيل الدخول" }, { status: 401 });
    }
    if (error.name === "ForbiddenError") {
      return NextResponse.json({ success: false, error: "هذه العملية متاحة للمالك فقط" }, { status: 403 });
    }
    console.error("DELETE /api/reports/invoices Error:", error);
    return NextResponse.json({ success: false, error: "تعذر حذف الفواتير" }, { status: 500 });
  }
}
