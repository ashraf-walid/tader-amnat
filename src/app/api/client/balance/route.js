import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import AccountData from "@/models/AccountData";
import Settings from "@/models/Settings";
import { requireAuth, AuthError } from "@/lib/auth";

export const dynamic = "force-dynamic";

/**
 * GET /api/client/balance
 * Gets the openingBalance.debit for the accountCode carried in the user's token.
 */
export async function GET(request) {
  try {
    // 1. التوثيق والتحقق من هوية المستخدم واستخراج كود الحساب من الـ Token
    const decoded = requireAuth(request);
    
    // التأكد من وجود accountCode داخل الـ Token
    if (!decoded.accountCode) {
      return NextResponse.json(
        { success: false, error: "لا يوجد كود حساب مرتبط بجلسة الدخول الحالية. يرجى تسجيل الخروج والدخول مجدداً." },
        { status: 400 }
      );
    }

    await connectToDatabase();

    // 2. البحث في مجموعة accountdatas عن الحساب الذي يطابق accountCode المستخرج من الـ Token
    // وكذلك جلب تاريخ الفترة من الإعدادات
    const [account, dateRangeSetting] = await Promise.all([
      AccountData.findOne({
        accountCode: String(decoded.accountCode),
      }).lean(),
      Settings.findOne({ key: "dateRange" }).lean(),
    ]);

    if (!account) {
      return NextResponse.json(
        {
          success: false,
          error: `لم يتم العثور على بيانات مالية لكود الحساب: ${decoded.accountCode}`,
        },
        { status: 404 }
      );
    }

    // 3. إرجاع كافة البيانات المالية والعمليات
    return NextResponse.json({
      success: true,
      accountCode: decoded.accountCode,
      accountName: account.account,
      dateRange: dateRangeSetting?.value || "",
      openingBalance: account.openingBalance,
      totals: account.totals,
      closingBalance: account.closingBalance,
      transactions: account.transactions || [],
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
