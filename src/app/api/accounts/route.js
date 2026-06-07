import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import User from "@/models/User";

export const dynamic = "force-dynamic";

/**
 * GET /api/accounts
 * Get all user accounts
 */
export async function GET() {
  try {
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
      isActive: user.isActive,
      lastLogin: user.lastLogin,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    }));

    return NextResponse.json(
      {
        success: true,
        accounts,
        count: accounts.length,
        timestamp: Date.now(),
      },
      {
        headers: {
          "Cache-Control": "no-store, max-age=0, must-revalidate",
          Pragma: "no-cache",
          Expires: "0",
        },
      },
    );
  } catch (error) {
    console.error("GET /api/accounts Error:", error);
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
    const body = await request.json();
    const { username, password, phone, officeName, role, attempts } = body;

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
      isActive: true,
    });

    console.log("💾 Saving user with officeName:", officeName);
    await newUser.save();

    // Return user without password
    const userResponse = {
      id: newUser._id.toString(),
      username: newUser.username,
      phone: newUser.phone,
      officeName: newUser.officeName,
      role: newUser.role,
      attempts: newUser.attempts,
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
