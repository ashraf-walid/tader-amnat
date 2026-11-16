import { del } from "@vercel/blob";
import { NextResponse } from "next/server";
import { requireAdmin, requireOwner } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import FileBackup from "@/models/FileBackup";

export const dynamic = "force-dynamic";

export async function GET(request) {
  try {
    requireAdmin(request);
    await connectToDatabase();

    const backups = await FileBackup.find({}).sort({ createdAt: -1 }).limit(50).lean();

    return NextResponse.json({
      success: true,
      backups,
    });
  } catch (err) {
    if (err.name === "AuthError" || err.name === "ForbiddenError") {
      return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
    }
    return NextResponse.json({ error: err.message || "حدث خطأ" }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    requireOwner(request);
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    const pathname = searchParams.get("pathname");

    if (!id && !pathname) {
      return NextResponse.json({ error: "معرف الملف مطلوب" }, { status: 400 });
    }

    await connectToDatabase();
    const backup = id
      ? await FileBackup.findById(id)
      : await FileBackup.findOne({ pathname });

    if (!backup) {
      return NextResponse.json({ error: "الملف غير موجود" }, { status: 404 });
    }

    // Delete from Vercel Blob
    try {
      await del(backup.pathname);
    } catch (blobErr) {
      console.warn("Could not delete from Vercel Blob:", blobErr.message);
    }

    // Delete from DB
    await FileBackup.findByIdAndDelete(backup._id);

    return NextResponse.json({ success: true });
  } catch (err) {
    if (err.name === "AuthError" || err.name === "ForbiddenError") {
      return NextResponse.json({ error: "غير مصرح - للمالك فقط" }, { status: 403 });
    }
    return NextResponse.json({ error: err.message || "فشل حذف الملف" }, { status: 500 });
  }
}
