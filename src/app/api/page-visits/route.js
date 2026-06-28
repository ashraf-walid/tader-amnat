import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { getTokenFromReq, verifyToken, requireAdmin } from "@/lib/auth";
import PageVisit from "@/models/PageVisit";

export const dynamic = "force-dynamic";

/**
 * POST /api/page-visits
 * Records a page visit, incrementing the count if the user visited it recently.
 */
export async function POST(request) {
  try {
    await connectToDatabase();

    const body = await request.json();
    const { page } = body;

    if (!page) {
      return NextResponse.json(
        { success: false, error: "اسم الصفحة مطلوب (page is required)" },
        { status: 400 }
      );
    }

    // Try to get authenticated user info. If not authenticated, we handle it as a guest visit.
    let userId = null;
    let username = "guest";

    try {
      const token = getTokenFromReq(request);
      if (token) {
        const decoded = verifyToken(token);
        userId = decoded.id || decoded.userId;
        username = decoded.username || "user";
      }
    } catch (authErr) {
      // Not authenticated, proceed as guest
      console.log(`[Analytics] Anonymous access or expired token: ${page}`);
    }

    // Upsert the page visit
    const pageVisit = await PageVisit.findOneAndUpdate(
      { userId, page },
      {
        $inc: { visitCount: 1 },
        $set: { lastVisitedAt: new Date(), username }
      },
      { new: true, upsert: true }
    );

    return NextResponse.json({
      success: true,
      data: pageVisit,
    });
  } catch (error) {
    console.error("POST /api/page-visits Error:", error);
    return NextResponse.json(
      { success: false, error: "حدث خطأ أثناء تسجيل زيارة الصفحة" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/page-visits
 * Get all page visit statistics (restricted to Admins / Owners)
 */
export async function GET(request) {
  try {
    // Ensure user has admin privileges to view visit logs
    requireAdmin(request);

    await connectToDatabase();

    // Fetch visits sorted by lastVisitedAt (newest first)
    const visits = await PageVisit.find()
      .populate("userId", "username role officeName") // details from the referenced User
      .sort({ lastVisitedAt: -1 })
      .limit(500); // safety cap

    return NextResponse.json({
      success: true,
      data: visits,
    });
  } catch (error) {
    console.error("GET /api/page-visits Error:", error);
    
    // Check if it's a forbidden/unauthorized error
    if (error.name === "AuthError") {
      return NextResponse.json(
        { success: false, error: "غير مصرح لك بالوصول (Unauthorized)" },
        { status: 401 }
      );
    }
    if (error.name === "ForbiddenError") {
      return NextResponse.json(
        { success: false, error: "ليس لديك الصلاحيات الكافية (Forbidden)" },
        { status: 403 }
      );
    }
    
    return NextResponse.json(
      { success: false, error: "حدث خطأ أثناء جلب إحصائيات الصفحة" },
      { status: 500 }
    );
  }
}
