import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import User from "@/models/User";
import CalculationLog from "@/models/CalculationLog";
import { requireOwner } from "@/lib/auth";

export const dynamic = "force-dynamic";

/**
 * GET /api/reports
 * Owner-only aggregation reports for the admin dashboard.
 *
 * Query params:
 *   type = "overview"              → summary stats
 *   type = "accounts-by-date"      → accounts created on ?date=YYYY-MM-DD
 *   type = "invoice-leaderboard"   → users ranked by calculationsCount
 *   type = "invoices-by-date"      → invoices created on ?date=YYYY-MM-DD
 */
export async function GET(request) {
  try {
    requireOwner(request);

    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type");

    await connectToDatabase();

    switch (type) {
      // ─── Overview Statistics ──────────────────────────────────────────────
      case "overview": {
        const now = new Date();
        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const startOfWeek = new Date(startOfToday);
        startOfWeek.setDate(startOfWeek.getDate() - 7);
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

        const [agg] = await User.aggregate([
          {
            $group: {
              _id: null,
              totalInvoices: { $sum: { $ifNull: ["$calculationsCount", 0] } },
              totalAccounts: { $sum: 1 },
              newToday: {
                $sum: { $cond: [{ $gte: ["$createdAt", startOfToday] }, 1, 0] },
              },
              newWeek: {
                $sum: { $cond: [{ $gte: ["$createdAt", startOfWeek] }, 1, 0] },
              },
              newMonth: {
                $sum: { $cond: [{ $gte: ["$createdAt", startOfMonth] }, 1, 0] },
              },
            },
          },
        ]);

        return NextResponse.json({
          success: true,
          data: agg || {
            totalInvoices: 0,
            totalAccounts: 0,
            newToday: 0,
            newWeek: 0,
            newMonth: 0,
          },
        });
      }

      // ─── Accounts Created on a Specific Date ──────────────────────────────
      case "accounts-by-date": {
        const dateStr = searchParams.get("date");
        if (!dateStr || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
          return NextResponse.json(
            { success: false, error: "صيغة التاريخ غير صحيحة. استخدم YYYY-MM-DD" },
            { status: 400 },
          );
        }

        const dayStart = new Date(dateStr + "T00:00:00.000Z");
        const dayEnd = new Date(dateStr + "T23:59:59.999Z");

        if (isNaN(dayStart.getTime())) {
          return NextResponse.json(
            { success: false, error: "تاريخ غير صالح" },
            { status: 400 },
          );
        }

        const accounts = await User.find({
          createdAt: { $gte: dayStart, $lte: dayEnd },
        })
          .select("username role phone officeName createdAt calculationsCount")
          .sort({ createdAt: -1 })
          .lean();

        return NextResponse.json({
          success: true,
          date: dateStr,
          count: accounts.length,
          accounts: accounts.map((a) => ({
            username: a.username,
            role: a.role,
            phone: a.phone || "",
            officeName: a.officeName || "",
            calculationsCount: a.calculationsCount || 0,
            createdAt: a.createdAt,
          })),
        });
      }

      // ─── Invoices Created on a Specific Date ────────────────────────────
      case "invoices-by-date": {
        const dateStr = searchParams.get("date");
        if (!dateStr || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
          return NextResponse.json(
            { success: false, error: "صيغة التاريخ غير صحيحة. استخدم YYYY-MM-DD" },
            { status: 400 },
          );
        }

        const dayStart = new Date(dateStr + "T00:00:00.000Z");
        const dayEnd = new Date(dateStr + "T23:59:59.999Z");

        if (isNaN(dayStart.getTime())) {
          return NextResponse.json(
            { success: false, error: "تاريخ غير صالح" },
            { status: 400 },
          );
        }

        // Get all invoices for that date
        const invoices = await CalculationLog.find({
          createdAt: { $gte: dayStart, $lte: dayEnd },
        })
          .sort({ createdAt: -1 })
          .lean();

        // Group by user
        const userMap = {};
        for (const inv of invoices) {
          const key = inv.userId?.toString() || inv.username;
          if (!userMap[key]) {
            userMap[key] = {
              userId: inv.userId,
              username: inv.username,
              role: inv.role || "client",
              officeName: inv.officeName || "",
              count: 0,
              firstInvoice: inv.createdAt,
              lastInvoice: inv.createdAt,
            };
          }
          userMap[key].count += 1;
          userMap[key].lastInvoice = inv.createdAt;
        }

        const users = Object.values(userMap).sort((a, b) => b.count - a.count);

        return NextResponse.json({
          success: true,
          date: dateStr,
          totalInvoices: invoices.length,
          totalUsers: users.length,
          users,
        });
      }

      // ─── Invoice Leaderboard ──────────────────────────────────────────────
      case "invoice-leaderboard": {
        const users = await User.find({})
          .select("username role officeName calculationsCount lastLogin")
          .sort({ calculationsCount: -1 })
          .lean();

        return NextResponse.json({
          success: true,
          users: users.map((u) => ({
            username: u.username,
            role: u.role,
            officeName: u.officeName || "",
            calculationsCount: u.calculationsCount || 0,
            lastLogin: u.lastLogin,
          })),
        });
      }

      // ─── Unknown Type ─────────────────────────────────────────────────────
      default:
        return NextResponse.json(
          { success: false, error: "نوع التقرير غير معروف" },
          { status: 400 },
        );
    }
  } catch (error) {
    if (error.name === "AuthError" || error.name === "ForbiddenError") {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: error.name === "ForbiddenError" ? 403 : 401 },
      );
    }
    console.error("GET /api/reports Error:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}
