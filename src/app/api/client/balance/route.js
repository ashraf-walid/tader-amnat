import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import User from "@/models/User";
import AccountData from "@/models/AccountData";
import { requireAuth, AuthError } from "@/lib/auth";

export const dynamic = "force-dynamic";

/**
 * GET /api/client/balance
 * Gets the openingBalance.debit for the authenticated user's accountCode.
 */
export async function GET(request) {
  try {
    // 1. التوثيق والتحقق من هوية المستخدم
    const decoded = requireAuth(request);
    await connectToDatabase();

    const userId = decoded.id || decoded.userId;
    const user = await User.findById(userId).select("accountCode username");

    if (!user) {
      return NextResponse.json(
        { success: false, error: "المستخدم غير موجود" },
        { status: 404 }
      );
    }

    // 2. التأكد من وجود accountCode لدى المستخدم
    if (!user.accountCode) {
      return NextResponse.json(
        { success: false, error: "لا يوجد كود حساب مرتبط بحسابك الحالي" },
        { status: 400 }
      );
    }

    // 3. البحث في مجموعة accountdatas عن الحساب الذي يطابق بياناته accountCode
    // نحول الكود الرقمي للمستخدم إلى نص لأن حقل accountCode في AccountData هو String
    const account = await AccountData.findOne({
      accountCode: String(user.accountCode),
    }).lean();

    if (!account) {
      return NextResponse.json(
        {
          success: false,
          error: `لم يتم العثور على بيانات مالية لكود الحساب: ${user.accountCode}`,
        },
        { status: 404 }
      );
    }

    // 4. جلب openingBalance.debit وإرجاعها للواجهة الأمامية
    const debit = account.openingBalance?.debit ?? 0;

    return NextResponse.json({
      success: true,
      accountCode: user.accountCode,
      accountName: account.account,
      debit: debit,
    });
  } catch (error) {
    console.error("GET /api/client/balance error:", error);
    if (error instanceof AuthError) {
      return NextResponse.json(
        { success: false, error: "غير مصرح، يرجى تسجيل الدخول أولاً" },
        { status: 401 }
      );
    }
    return NextResponse.json(
      { success: false, error: "حدث خطأ في الخادم أثناء جلب الرصيد" },
      { status: 500 }
    );
  }
}
