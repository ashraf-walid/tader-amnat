import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import User from "@/models/User";
import cache, { CacheKeys, CacheTTL, invalidateCache } from "@/lib/cache";
import { requireAdmin } from "@/lib/auth";

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

    // 1️⃣ محاولة القراءة من الذاكرة
    const cachedAccounts = cache.get(CacheKeys.ALL_ACCOUNTS);
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
      lastLogin: user.lastLogin,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    }));

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
    requireAdmin(request);

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
