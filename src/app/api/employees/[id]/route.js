import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import EmployeeAvailability from "@/models/EmployeeAvailability";
import { requireAdmin } from "@/lib/auth";

// ─── PUT: Update employee (admin only) ───────────────────────────────────────
export async function PUT(req, { params }) {
  try {
    await requireAdmin(req);
    await connectToDatabase();

    const { id } = await params;
    const body = await req.json();

    // Build update object with only allowed fields
    const update = {};
    if (body.name !== undefined) update.name = body.name.trim();
    if (body.phone !== undefined) {
      if (!/^01[0-9]{9}$/.test(body.phone.trim())) {
        return NextResponse.json(
          { success: false, error: "رقم الهاتف غير صحيح (يجب أن يكون 01xxxxxxxxx)" },
          { status: 400 }
        );
      }
      update.phone = body.phone.trim();
    }
    if (body.role !== undefined) update.role = body.role.trim();
    if (body.isActive !== undefined) update.isActive = !!body.isActive;
    if (body.sortOrder !== undefined) update.sortOrder = Number(body.sortOrder);

    if (Object.keys(update).length === 0) {
      return NextResponse.json(
        { success: false, error: "لا توجد بيانات للتحديث" },
        { status: 400 }
      );
    }

    const employee = await EmployeeAvailability.findByIdAndUpdate(
      id,
      { $set: update },
      { new: true, runValidators: true }
    );

    if (!employee) {
      return NextResponse.json(
        { success: false, error: "الموظف غير موجود" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, employee });
  } catch (error) {
    if (error.name === "AuthError") {
      return NextResponse.json(
        { success: false, error: "غير مصرح" },
        { status: 401 }
      );
    }
    if (error.name === "ForbiddenError") {
      return NextResponse.json(
        { success: false, error: "صلاحيات غير كافية" },
        { status: 403 }
      );
    }
    console.error("PUT /api/employees/[id] error:", error);
    return NextResponse.json(
      { success: false, error: "خطأ في الخادم" },
      { status: 500 }
    );
  }
}

// ─── DELETE: Remove employee (admin only) ────────────────────────────────────
export async function DELETE(req, { params }) {
  try {
    await requireAdmin(req);
    await connectToDatabase();

    const { id } = await params;
    const employee = await EmployeeAvailability.findByIdAndDelete(id);

    if (!employee) {
      return NextResponse.json(
        { success: false, error: "الموظف غير موجود" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, message: "تم حذف الموظف بنجاح" });
  } catch (error) {
    if (error.name === "AuthError") {
      return NextResponse.json(
        { success: false, error: "غير مصرح" },
        { status: 401 }
      );
    }
    if (error.name === "ForbiddenError") {
      return NextResponse.json(
        { success: false, error: "صلاحيات غير كافية" },
        { status: 403 }
      );
    }
    console.error("DELETE /api/employees/[id] error:", error);
    return NextResponse.json(
      { success: false, error: "خطأ في الخادم" },
      { status: 500 }
    );
  }
}
