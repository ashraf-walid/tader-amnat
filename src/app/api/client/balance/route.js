import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import AccountData from "@/models/AccountData";
import Settings from "@/models/Settings";
import User from "@/models/User";
import PageVisit from "@/models/PageVisit";
import { requireAuth, AuthError } from "@/lib/auth";
import { getBalanceHistory } from "@/lib/clientLedger";

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

    const clientCodeStr = String(decoded.accountCode);

    // 2. البحث في مجموعة accountdatas عن الحساب الذي يطابق accountCode
    // أولاً: تطابق تام
    let account = await AccountData.findOne({
      accountCode: clientCodeStr,
    }).lean();

    // ثانياً: إذا لم يُعثر على الحساب، البحث بنمط يبدأ بكود العميل ويليه رقم أو رقمين في النهاية
    if (!account) {
      account = await AccountData.findOne({
        accountCode: { $regex: `^${clientCodeStr}\\d{1,2}$` },
      }).lean();

      // تحديث تلقائي لكود العميل في جدول المستخدمين ليتطابق مع الكود الجديد مستقبلاً
      if (account && (decoded.userId || decoded.id)) {
        const userId = decoded.userId || decoded.id;
        const newCodeNum = Number(account.accountCode);
        if (!isNaN(newCodeNum)) {
          User.findByIdAndUpdate(userId, { accountCode: newCodeNum })
            .then(() => {
              console.log(
                `✅ تم تحديث كود العميل تلقائياً للمستخدم ${userId} من ${clientCodeStr} إلى ${account.accountCode}`
              );
            })
            .catch((err) => {
              console.error("⚠️ فشل التحديث التلقائي لكود العميل:", err);
            });
        }
      }
    }

    if (!account) {
      return NextResponse.json(
        {
          success: false,
          error: `لم يتم العثور على بيانات مالية لكود الحساب: ${decoded.accountCode}`,
        },
        { status: 404 }
      );
    }

    // جلب تاريخ الفترة وسجل الحساب باستخدام الكود الفعلي للحساب
    const activeCode = account.accountCode || clientCodeStr;
    const userId = decoded.userId || decoded.id;

    // تسجيل فتح كشف الرصيد للعميل في الخلفية
    if (userId && String(decoded.role || "").toLowerCase() === "client") {
      PageVisit.findOneAndUpdate(
        { userId, page: "/client/balance" },
        {
          $inc: { visitCount: 1 },
          $set: { lastVisitedAt: new Date(), username: decoded.username || "", role: "client" },
        },
        { upsert: true }
      ).catch((err) => console.error("Failed to record balance page visit:", err));
    }

    const [dateRangeSetting, balanceHistory] = await Promise.all([
      Settings.findOne({ key: "dateRange" }).lean(),
      getBalanceHistory(activeCode).catch((historyError) => {
        console.error("Failed to load balance history:", historyError);
        return [];
      }),
    ]);

    // 3. إرجاع كافة البيانات المالية والعمليات
    return NextResponse.json({
      success: true,
      hasAccountCode: true,
      accountCode: activeCode,
      accountName: account.account,
      dateRange: dateRangeSetting?.value || "",
      openingBalance: account.openingBalance,
      totals: account.totals,
      closingBalance: account.closingBalance,
      transactions: account.transactions || [],
      balanceHistory,
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
