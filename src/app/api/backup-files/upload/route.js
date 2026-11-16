import { put } from "@vercel/blob";
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import FileBackup from "@/models/FileBackup";

export const dynamic = "force-dynamic";

export async function POST(request) {
  try {
    const actor = requireAdmin(request);
    const { searchParams } = new URL(request.url);
    const rawFilename = searchParams.get("filename") || "accounting-backup.html";
    const dateRange = searchParams.get("dateRange") || "";
    const accountsCount = parseInt(searchParams.get("accountsCount") || "0", 10);

    const safeFilename = rawFilename.replace(/[^a-zA-Z0-9._\-أ-ي]/g, "_");
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const blobPath = `backups/${timestamp}_${safeFilename}`;

    // Upload raw stream to Vercel Blob (Private store)
    const blob = await put(blobPath, request.body, {
      access: "private",
    });

    // Save metadata in MongoDB
    try {
      await connectToDatabase();
      await FileBackup.create({
        originalName: rawFilename,
        pathname: blob.pathname,
        blobUrl: blob.url,
        size: blob.size || 0,
        uploadedBy: actor.username || actor.name || "admin",
        uploadedByRole: actor.role || "admin",
        dateRange,
        accountsCount,
      });
    } catch (dbErr) {
      console.error("Failed to log file backup to MongoDB:", dbErr);
    }

    return NextResponse.json({
      success: true,
      blob,
    });
  } catch (err) {
    console.error("Blob upload error:", err);
    if (err.name === "AuthError" || err.name === "ForbiddenError") {
      return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
    }
    return NextResponse.json(
      { error: err.message || "فشل رفع الملف إلى Vercel Blob" },
      { status: 500 }
    );
  }
}
