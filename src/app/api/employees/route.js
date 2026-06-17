import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import EmployeeAvailability from "@/models/EmployeeAvailability";
import { requireAuth, requireAdmin } from "@/lib/auth";

// ─── GET: List employees ──────────────────────────────────────────────────────
// Admin/Owner: returns ALL employees sorted by sortOrder
// Other roles: returns only active employees sorted by sortOrder
export async function GET(req) {
  try {
    const user = await requireAuth(req);
    await connectToDatabase();

    const isAdmin = user.role === "admin" || user.role === "owner";
    const filter = isAdmin ? {} : { isActive: true };

    const employees = await EmployeeAvailability.find(filter).sort({
      sortOrder: 1,
      createdAt: -1,
    });

    return NextResponse.json({ success: true, employees });
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
    console.error("GET /api/employees error:", error);
    return NextResponse.json(
      { success: false, error: "خطأ في الخادم" },
      { status: 500 }
    );
  }
}

// ─── POST: Create employee (admin only) ──────────────────────────────────────
export async function POST(req) {
  try {
    await requireAdmin(req);
    await connectToDatabase();

    const body = await req.json();
    const { name, phone, role, isActive, sortOrder } = body;

    // Validation
    if (!name || !name.trim()) {
      return NextResponse.json(
        { success: false, error: "اسم الموظف مطلوب" },
        { status: 400 }
      );
    }
    if (!phone || !/^01[0-9]{9}$/.test(phone.trim())) {
      return NextResponse.json(
        { success: false, error: "رقم الهاتف غير صحيح (يجب أن يكون 01xxxxxxxxx)" },
        { status: 400 }
      );
    }
    if (!role || !role.trim()) {
      return NextResponse.json(
        { success: false, error: "المسمى الوظيفي مطلوب" },
        { status: 400 }
      );
    }

    const employee = await EmployeeAvailability.create({
      name: name.trim(),
      phone: phone.trim(),
      role: role.trim(),
      isActive: typeof isActive === "boolean" ? isActive : true,
      sortOrder: typeof sortOrder === "number" ? sortOrder : 0,
    });

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
    console.error("POST /api/employees error:", error);
    return NextResponse.json(
      { success: false, error: "خطأ في الخادم" },
      { status: 500 }
    );
  }
}
