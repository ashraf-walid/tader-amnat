import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import User from "@/models/User";
import PushSubscription from "@/models/PushSubscription";
import CalculationLog from "@/models/CalculationLog";
import PageVisit from "@/models/PageVisit";
import cache, { CacheKeys, CacheTTL, invalidateCache } from "@/lib/cache";
import { logActivity } from "@/lib/activityLog";
import { requireAdmin, requireOwnerOrAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

/**
 * GET /api/accounts
 * Get all user accounts with caching
 */
export async function GET(request) {
  try {
    // 🔒 تحقق من صلاحيات المدير
    const decoded = requireAdmin(request);
    const isOwner = decoded.role === "owner";
    const { searchParams } = new URL(request.url);
    const forceFresh = searchParams.has("t");

    // 1️⃣ محاولة القراءة من الذاكرة (إلا إذا تم طلب تحديث فوري)
    const cachedAccounts = forceFresh ? null : cache.get(CacheKeys.ALL_ACCOUNTS);
    if (cachedAccounts !== null) {
      const visible = isOwner ? cachedAccounts : cachedAccounts.filter(a => a.role !== "owner");
      console.log("✅ Accounts from cache:", visible.length);
      return NextResponse.json(
        {
          success: true,
          accounts: visible,
          count: visible.length,
          timestamp: Date.now(),
          fromCache: true,
        },
        {
          headers: {
            "Cache-Control": "private, max-age=60, stale-while-revalidate=30",
          },
        },
      );
    }

    // 2️⃣ إذا لم توجد، اقرأ من MongoDB
    await connectToDatabase();

    const users = await User.find({})
      .select("-password") // Exclude password from response
      .sort({ createdAt: -1 })
      .lean();

    // Transform _id to id for frontend compatibility
    const accounts = users.map((user) => ({
      id: user._id.toString(),
      username: user.username,
      phone: user.phone || "",
      officeName: user.officeName || "",
      role: user.role,
      attempts: user.attempts,
      calculationsCount: user.calculationsCount || 0,
      accountCode: user.accountCode,
      isActive: user.isActive,
      isPwaInstalled: user.isPwaInstalled || false,
      lastLogin: user.lastLogin,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      hasNotifications: false,
    }));

    // 3️⃣ احسب حالة الإشعارات وتاريخ آخر فاتورة وزيارات كشف الرصيد لكل حساب
    const userIds = users.map(u => u._id);
    const [subs, lastCalculations, balanceVisits] = await Promise.all([
      PushSubscription.find({ userId: { $in: userIds } }).select('userId').lean(),
      CalculationLog.aggregate([
        { $match: { userId: { $in: userIds } } },
        { $group: { _id: "$userId", lastCalculation: { $max: "$createdAt" } } },
      ]),
      PageVisit.find({
        userId: { $in: userIds },
        page: "/client/balance",
      }).select("userId lastVisitedAt visitCount").lean(),
    ]);

    const subSet = new Set(subs.map(s => s.userId.toString()));
    const calcDateMap = new Map(lastCalculations.map(c => [c._id.toString(), c.lastCalculation]));
    const balanceVisitMap = new Map(
      balanceVisits.map(v => [
        v.userId.toString(),
        { lastVisitedAt: v.lastVisitedAt, visitCount: v.visitCount || 0 },
      ])
    );

    accounts.forEach(acc => {
      acc.hasNotifications = subSet.has(acc.id);
      acc.lastCalculation = calcDateMap.get(acc.id) || null;
      // لا يُحسب كشف الرصيد إلا للعملاء المربوطين بكود فعلي
      if (acc.accountCode) {
        const bVisit = balanceVisitMap.get(acc.id);
        acc.lastBalanceView = bVisit?.lastVisitedAt || null;
        acc.balanceViewsCount = bVisit?.visitCount || 0;
      } else {
        acc.lastBalanceView = null;
        acc.balanceViewsCount = 0;
      }
    });

    // 3️⃣ احفظ في الذاكرة لمدة 5 دقائق
    cache.set(CacheKeys.ALL_ACCOUNTS, accounts, CacheTTL.ACCOUNTS_LIST);
    console.log("📦 Accounts cached:", accounts.length);

    const visible = isOwner ? accounts : accounts.filter(a => a.role !== "owner");

    return NextResponse.json(
      {
        success: true,
        accounts: visible,
        count: visible.length,
        timestamp: Date.now(),
        fromCache: false,
      },
      {
        headers: {
          "Cache-Control": "private, max-age=60, stale-while-revalidate=30",
        },
      },
    );
  } catch (error) {
    console.error("GET /api/accounts Error:", error);
    if (error.name === "AuthError" || error.name === "ForbiddenError") {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }
    return NextResponse.json(
      {
        success: false,
        error: "فشل في تحميل الحسابات",
        message: error.message,
      },
      { status: 500 },
    );
  }
}

/**
 * POST /api/accounts
 * Create a new user account
 */
export async function POST(request) {
  try {
    // 🔒 تحقق من صلاحيات المدير
    const actor = requireOwnerOrAdmin(request);

    const body = await request.json();
    const { username, password, phone, officeName, role, attempts, accountCode } = body;

    // Validation
    if (!username || !password) {
      return NextResponse.json(
        {
          success: false,
          error: "اسم المستخدم وكلمة المرور مطلوبان",
        },
        { status: 400 },
      );
    }

    await connectToDatabase();

    // Check if username already exists
    const existingUser = await User.findOne({
      username: username.toLowerCase().trim(),
    });

    if (existingUser) {
      return NextResponse.json(
        {
          success: false,
          error: "اسم المستخدم موجود بالفعل",
        },
        { status: 409 },
      );
    }

    // Create new user
    const newUser = new User({
      username: username.toLowerCase().trim(),
      password, // Will be hashed by pre-save middleware
      phone: phone || "",
      officeName: officeName || "",
      role: role || "client",
      attempts: typeof attempts === "number" ? attempts : 5,
      accountCode: accountCode ? Number(accountCode) : null,
      isActive: true,
    });

    console.log("💾 Saving user with officeName:", officeName);
    await newUser.save();

    // 🔥 مسح الـ Cache لأن البيانات تغيرت
    invalidateCache("accounts:");
    console.log("🗑️ Accounts cache invalidated");

    // Return user without password
    const userResponse = {
      id: newUser._id.toString(),
      username: newUser.username,
      phone: newUser.phone,
      officeName: newUser.officeName,
      role: newUser.role,
      attempts: newUser.attempts,
      accountCode: newUser.accountCode,
      isActive: newUser.isActive,
      createdAt: newUser.createdAt,
    };

    console.log("✅ New user created:", newUser.username);

    await logActivity(actor, "account.create", {
      target: { kind: "user", id: userResponse.id, name: newUser.username },
      details: { role: newUser.role, officeName: newUser.officeName },
    });

    return NextResponse.json(
      {
        success: true,
        account: userResponse,
        message: "تم إضافة الحساب بنجاح",
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("POST /api/accounts Error:", error);
    if (error.name === "AuthError" || error.name === "ForbiddenError") {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }
    return NextResponse.json(
      {
        success: false,
        error: "فشل في إضافة الحساب",
        message: error.message,
      },
      { status: 500 },
    );
  }
}
