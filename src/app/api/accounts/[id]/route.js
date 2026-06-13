import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import User from "@/models/User";
import bcrypt from "bcrypt";
import mongoose from "mongoose";
import { invalidateCache } from "@/lib/cache";
import { requireAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

/**
 * PUT /api/accounts/[id]
 * Update a user account
 */
export async function PUT(request, { params }) {
  try {
    // 🔒 تحقق من صلاحيات المدير
    requireAdmin(request);

    const { id } = await params;
    const body = await request.json();
    const { username, password, phone, officeName, role, attempts, accountCode } = body;

    // Validate MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        {
          success: false,
          error: "معرف الحساب غير صحيح",
        },
        { status: 400 },
      );
    }

    await connectToDatabase();

    // Check if new username conflicts with another user
    if (username) {
      const existingUser = await User.findOne({
        username: username.toLowerCase().trim(),
        _id: { $ne: id },
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
    }

    // Build update object — only include fields that were sent
    const updateFields = {};
    if (username) updateFields.username = username.toLowerCase().trim();
    if (phone !== undefined) updateFields.phone = phone;
    if (officeName !== undefined) updateFields.officeName = officeName;
    if (role) updateFields.role = role;
    if (typeof attempts === "number") updateFields.attempts = attempts;
    if (accountCode !== undefined) {
      updateFields.accountCode = accountCode ? Number(accountCode) : null;
    }

    // Hash password manually ONLY when a new plaintext password is provided
    // This avoids the pre-save hook double-hashing the already-hashed value
    if (password && password !== "") {
      const salt = await bcrypt.genSalt(10);
      updateFields.password = await bcrypt.hash(password, salt);
    }

    // Use findByIdAndUpdate with { strict: false } to bypass pre-save hook
    console.log("💾 Updating user fields:", updateFields);
    const user = await User.findByIdAndUpdate(
      id,
      { $set: updateFields },
      { returnDocument: "after", runValidators: true, select: "-password" },
    );

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: "الحساب غير موجود",
        },
        { status: 404 },
      );
    }

    const userResponse = {
      id: user._id.toString(),
      username: user.username,
      phone: user.phone,
      officeName: user.officeName,
      role: user.role,
      attempts: user.attempts,
      accountCode: user.accountCode,
      isActive: user.isActive,
      updatedAt: user.updatedAt,
    };

    console.log("✅ User updated:", user.username);

    // 🔥 مسح الـ Cache بعد التحديث
    invalidateCache("accounts:");
    console.log("🗑️ Accounts cache invalidated after update");

    return NextResponse.json({
      success: true,
      account: userResponse,
      message: "تم تحديث الحساب بنجاح",
    });
  } catch (error) {
    console.error("PUT /api/accounts/[id] Error:", error);
    if (error.name === "AuthError" || error.name === "ForbiddenError") {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }
    return NextResponse.json(
      {
        success: false,
        error: "فشل في تحديث الحساب",
        message: error.message,
      },
      { status: 500 },
    );
  }
}

/**
 * DELETE /api/accounts/[id]
 * Delete a user account
 */
export async function DELETE(request, { params }) {
  try {
    // 🔒 تحقق من صلاحيات المدير
    requireAdmin(request);

    const { id } = await params;

    // Validate MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        {
          success: false,
          error: "معرف الحساب غير صحيح",
        },
        { status: 400 },
      );
    }

    await connectToDatabase();

    // Prevent deleting owner accounts
    const targetUser = await User.findById(id).select("role");
    if (targetUser && targetUser.role === "owner") {
      return NextResponse.json(
        {
          success: false,
          error: "لا يمكن حذف حساب المالك",
        },
        { status: 403 },
      );
    }

    // Find and delete user
    const user = await User.findByIdAndDelete(id);

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: "الحساب غير موجود",
        },
        { status: 404 },
      );
    }

    console.log("✅ User deleted:", user.username);

    // 🔥 مسح الـ Cache بعد الحذف
    invalidateCache("accounts:");
    console.log("🗑️ Accounts cache invalidated after deletion");

    return NextResponse.json({
      success: true,
      message: "تم حذف الحساب بنجاح",
    });
  } catch (error) {
    console.error("DELETE /api/accounts/[id] Error:", error);
    if (error.name === "AuthError" || error.name === "ForbiddenError") {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }
    return NextResponse.json(
      {
        success: false,
        error: "فشل في حذف الحساب",
        message: error.message,
      },
      { status: 500 },
    );
  }
}
