import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import User from "@/models/User";
import jwt from "jsonwebtoken";
import { JWT_SECRET } from "@/lib/auth";

export const dynamic = "force-dynamic";

/**
 * POST /api/auth/login
 * User login endpoint
 */
export async function POST(request) {
  try {
    const body = await request.json();
    const { username, password, remember } = body;

    // Session duration: 14 days if "remember me", otherwise 7 days
    const sessionDays = remember ? 14 : 7;
    const sessionSeconds = sessionDays * 24 * 60 * 60;

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

    // Find user
    const user = await User.findOne({
      username: username.toLowerCase().trim(),
    });

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: "اسم المستخدم أو كلمة المرور غير صحيحة",
        },
        { status: 401 },
      );
    }

    // Check if account is active
    if (!user.isActive) {
      return NextResponse.json(
        {
          success: false,
          error: "هذا الحساب غير نشط",
        },
        { status: 403 },
      );
    }

    // Verify password
    const isPasswordValid = await user.comparePassword(password);

    if (!isPasswordValid) {

      return NextResponse.json(
        {
          success: false,
          error: "اسم المستخدم أو كلمة المرور غير صحيحة",
          remainingAttempts: user.attempts,
        },
        { status: 401 },
      );
    }

    // Update last login using findByIdAndUpdate to bypass bcrypt pre-save hook
    await User.findByIdAndUpdate(user._id, { $set: { lastLogin: new Date() } });

    // Generate JWT token
    const token = jwt.sign(
      {
        userId: user._id.toString(),
        id: user._id.toString(), // Add id for compatibility with requireAuth/me
        username: user.username,
        role: user.role,
        accountCode: user.accountCode,
      },
      JWT_SECRET,
      { expiresIn: `${sessionDays}d` },
    );

    // Return success with user data
    const userResponse = {
      id: user._id.toString(),
      username: user.username,
      phone: user.phone,
      officeName: user.officeName,
      role: user.role,
      attempts: user.attempts,
      lastLogin: user.lastLogin,
      accountCode: user.accountCode,
    };

    console.log("✅ User logged in:", user.username, `(${user.role})`);

    const response = NextResponse.json({
      success: true,
      user: userResponse,
      message: "تم تسجيل الدخول بنجاح",
    });

    // Set HTTP-only cookie
    response.cookies.set("auth-token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: sessionSeconds, // 7 or 14 days based on "remember me"
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("POST /api/auth/login Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "حدث خطأ أثناء تسجيل الدخول",
        message: error.message,
      },
      { status: 500 },
    );
  }
}
