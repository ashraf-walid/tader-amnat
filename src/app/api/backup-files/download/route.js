import { get } from "@vercel/blob";
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(request) {
  try {
    requireAdmin(request);

    const { searchParams } = new URL(request.url);
    const pathname = searchParams.get("pathname");
    const downloadName = searchParams.get("filename") || "accounting-backup.html";

    if (!pathname) {
      return NextResponse.json({ error: "Missing pathname" }, { status: 400 });
    }

    const result = await get(pathname, { access: "private" });
    if (!result || result.statusCode !== 200) {
      return new NextResponse("الملف غير موجود في Vercel Blob", { status: 404 });
    }

    const encodedFilename = encodeURIComponent(downloadName);

    return new NextResponse(result.stream, {
      headers: {
        "Content-Type": result.blob?.contentType || "application/octet-stream",
        "Content-Disposition": `attachment; filename="${encodedFilename}"; filename*=UTF-8''${encodedFilename}`,
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (err) {
    console.error("Blob download error:", err);
    if (err.name === "AuthError" || err.name === "ForbiddenError") {
      return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
    }
    return NextResponse.json(
      { error: err.message || "فشل تحميل الملف" },
      { status: 500 }
    );
  }
}
