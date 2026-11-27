import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import Settings from "@/models/Settings";
import AccountData from "@/models/AccountData";
import { requireAdmin, requireOwner } from "@/lib/auth";
import { logActivity } from "@/lib/activityLog";
import { invalidateCache } from "@/lib/cache";
import {
  EXCLUDED_ACCOUNTS_KEY,
  normalizeAccountCode,
  normalizeAccountName,
  sanitizeExcludedEntry,
  sanitizeExcludedList,
} from "@/lib/excludedAccounts";

export const dynamic = "force-dynamic";

async function readExcludedList() {
  const doc = await Settings.findOne({ key: EXCLUDED_ACCOUNTS_KEY }).lean();
  return sanitizeExcludedList(doc?.value);
}

async function writeExcludedList(list) {
  await Settings.findOneAndUpdate(
    { key: EXCLUDED_ACCOUNTS_KEY },
    { value: list },
    { upsert: true, new: true }
  );
}

function authErrorResponse(error) {
  if (error.name === "AuthError") {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }
  if (error.name === "ForbiddenError") {
    return NextResponse.json(
      { success: false, error: "Forbidden - Owner only" },
      { status: 403 }
    );
  }
  return null;
}

/**
 * GET /api/settings/excluded-accounts
 * Staff (owner/admin/employee) can read the list so the UI can mark
 * excluded accounts and filter uploads.
 */
export async function GET(request) {
  try {
    requireAdmin(request);
    await connectToDatabase();
    const excludedAccounts = await readExcludedList();
    return NextResponse.json({ success: true, excludedAccounts });
  } catch (error) {
    const authRes = authErrorResponse(error);
    if (authRes) return authRes;
    console.error("GET /api/settings/excluded-accounts Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

/**
 * POST /api/settings/excluded-accounts  — owner only
 * Body: { code, name, deleteExisting?: boolean }
 * Adds an account to the exclusion list. When deleteExisting is true and a
 * code is given, the account's current copy in MongoDB is deleted as well;
 * otherwise it stays until the next bulk upload replaces all data anyway.
 */
export async function POST(request) {
  try {
    const actor = requireOwner(request);
    const body = await request.json();
    const entry = sanitizeExcludedEntry(body, actor.username);
    if (!entry) {
      return NextResponse.json(
        { success: false, error: "Account code or name is required" },
        { status: 400 }
      );
    }

    await connectToDatabase();
    const list = await readExcludedList();
    const alreadyExists = list.some((e) =>
      entry.code
        ? normalizeAccountCode(e.code) === entry.code
        : normalizeAccountName(e.name) === normalizeAccountName(entry.name)
    );
    if (!alreadyExists) {
      list.push(entry);
      await writeExcludedList(list);
    }

    let deletedExisting = 0;
    if (body?.deleteExisting === true && entry.code) {
      const result = await AccountData.deleteOne({ accountCode: entry.code });
      deletedExisting = result.deletedCount || 0;
      if (deletedExisting > 0) invalidateCache("data:");
    }

    await logActivity(actor, "accounts.exclude", {
      target: { kind: "account", id: entry.code || entry.name, name: entry.name },
      details: { code: entry.code, name: entry.name, deletedExisting },
    });

    return NextResponse.json({
      success: true,
      excludedAccounts: list,
      deletedExisting,
      alreadyExists,
    });
  } catch (error) {
    const authRes = authErrorResponse(error);
    if (authRes) return authRes;
    console.error("POST /api/settings/excluded-accounts Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

/**
 * DELETE /api/settings/excluded-accounts  — owner only
 * Body: { code } or { name } — removes the entry, so the account is
 * included again from the next upload onward.
 */
export async function DELETE(request) {
  try {
    const actor = requireOwner(request);
    const body = await request.json().catch(() => ({}));
    const code = normalizeAccountCode(body?.code);
    const name = normalizeAccountName(body?.name);
    if (!code && !name) {
      return NextResponse.json(
        { success: false, error: "Account code or name is required" },
        { status: 400 }
      );
    }

    await connectToDatabase();
    const list = await readExcludedList();
    const next = list.filter((e) => {
      if (code) return normalizeAccountCode(e.code) !== code;
      return normalizeAccountName(e.name) !== name;
    });
    const removed = list.length - next.length;
    if (removed > 0) await writeExcludedList(next);

    await logActivity(actor, "accounts.include", {
      target: { kind: "account", id: code || body?.name || "", name: body?.name || "" },
      details: { code, removed },
    });

    return NextResponse.json({ success: true, excludedAccounts: next, removed });
  } catch (error) {
    const authRes = authErrorResponse(error);
    if (authRes) return authRes;
    console.error("DELETE /api/settings/excluded-accounts Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
