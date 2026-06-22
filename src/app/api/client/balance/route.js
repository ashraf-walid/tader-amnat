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
    
    if (!decoded.accountCode) {
      const roleLower = String(decoded.role || "").toLowerCase();
      const isStaff = ["admin", "owner", "employee"].includes(roleLower);
      
      let message = "لا يوجد كود حساب مرتبط بحسابك حالياً. يرجى مراجعة الإدارة لربط كود العميل الخاص بك.";
      if (roleLower === "owner") {
        message = "حسابك مسجل كمالك للتطبيق. صفحة كشف الحساب هذه مخصصة للعملاء فقط.";
      } else if (roleLower === "admin") {
        message = "حسابك مسجل كمدير للنظام (Admin). صفحة كشف الحساب هذه مخصصة للعملاء فقط.";
      } else if (roleLower === "employee") {
        message = "حسابك مسجل كموظف في النظام. صفحة كشف الحساب هذه مخصصة للعملاء فقط.";
      }

      return NextResponse.json({
        success: true,
        hasAccountCode: false,
        isStaff,
        message,
      });
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
      hasAccountCode: true,
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
