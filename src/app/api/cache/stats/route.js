import { NextResponse } from "next/server";
import cache from "@/lib/cache";
import { requireAdmin } from "@/lib/auth";

/**
 * GET /api/cache/stats
 * Get cache statistics (Admin only)
 */
export async function GET(request) {
  try {
    // Only admins can view cache stats
    requireAdmin(request);

    const stats = cache.getStats();

    return NextResponse.json({
      success: true,
      stats: {
        size: stats.size,
        keys: stats.keys,
        timestamp: Date.now(),
      },
    });
  } catch (error) {
    if (error.name === "AuthError" || error.name === "ForbiddenError") {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}

/**
 * DELETE /api/cache/stats
 * Clear all cache (Admin only)
 */
export async function DELETE(request) {
  try {
    // Only admins can clear cache
    requireAdmin(request);

    cache.clear();

    return NextResponse.json({
      success: true,
      message: "تم مسح الذاكرة المؤقتة بنجاح",
    });
  } catch (error) {
    if (error.name === "AuthError" || error.name === "ForbiddenError") {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}
