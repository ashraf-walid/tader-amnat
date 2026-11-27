import { normalizeArabicText } from "./search-utils";

/**
 * Shared helpers for the owner-managed "excluded accounts" list.
 * Excluded accounts are parsed and shown locally like any other account,
 * but they are never uploaded to MongoDB (enforced in POST /api/data).
 *
 * Storage: a single Settings document with key "excludedAccounts",
 * whose value is an array of { code, name, addedBy, addedAt }.
 */

export const EXCLUDED_ACCOUNTS_KEY = "excludedAccounts";

/** Normalize an account code for comparison: trim, unify Arabic digits, drop spaces. */
export function normalizeAccountCode(code) {
  if (code === null || code === undefined) return "";
  return String(code)
    .trim()
    .replace(/[٠-٩]/g, (d) => "٠١٢٣٤٥٦٧٨٩".indexOf(d))
    .replace(/\s+/g, "");
}

/** Normalize an account name for comparison using the project's Arabic normalizer. */
export function normalizeAccountName(name) {
  return normalizeArabicText(name || "").trim().replace(/\s+/g, " ");
}

/**
 * An account is excluded when its code matches an entry's code,
 * or — for entries that carry no code — when its normalized name matches.
 */
export function isAccountExcluded(account, excludedList) {
  if (!account || !Array.isArray(excludedList) || excludedList.length === 0) {
    return false;
  }
  const code = normalizeAccountCode(account.accountCode);
  const name = normalizeAccountName(account.account);
  return excludedList.some((entry) => {
    const entryCode = normalizeAccountCode(entry?.code);
    if (entryCode && code) return entryCode === code;
    if (!entryCode && entry?.name) {
      return normalizeAccountName(entry.name) === name && name !== "";
    }
    return false;
  });
}

/** Split a list of accounts into { included, excluded } using the exclusion list. */
export function partitionAccounts(accounts, excludedList) {
  const included = [];
  const excluded = [];
  for (const account of accounts || []) {
    if (isAccountExcluded(account, excludedList)) excluded.push(account);
    else included.push(account);
  }
  return { included, excluded };
}

/** Validate and clean a raw exclusion entry coming from the client. */
export function sanitizeExcludedEntry(raw, actorName = "") {
  const code = normalizeAccountCode(raw?.code);
  const name = typeof raw?.name === "string" ? raw.name.trim() : "";
  if (!code && !name) return null;
  return {
    code,
    name,
    addedBy: actorName || "",
    addedAt: new Date().toISOString(),
  };
}

/** Clean a stored list: drop invalid entries and duplicates (by code, else by name). */
export function sanitizeExcludedList(list) {
  if (!Array.isArray(list)) return [];
  const seen = new Set();
  const clean = [];
  for (const entry of list) {
    if (!entry || typeof entry !== "object") continue;
    const code = normalizeAccountCode(entry.code);
    const name = typeof entry.name === "string" ? entry.name.trim() : "";
    if (!code && !name) continue;
    const key = code ? `code:${code}` : `name:${normalizeAccountName(name)}`;
    if (seen.has(key)) continue;
    seen.add(key);
    clean.push({
      code,
      name,
      addedBy: typeof entry.addedBy === "string" ? entry.addedBy : "",
      addedAt: typeof entry.addedAt === "string" ? entry.addedAt : "",
    });
  }
  return clean;
}
