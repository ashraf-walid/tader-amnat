import ClientLedgerEntry from "@/models/ClientLedgerEntry";

const ACCOUNTS_MODULE = "accounts-module";

/** Closing balance from the accounting file only, ignoring manual transactions. */
export function closingNetBalance(account) {
  const debit = Number(account?.closingBalance?.debit) || 0;
  const credit = Number(account?.closingBalance?.credit) || 0;
  return Math.round((debit - credit) * 100) / 100;
}

/**
 * Saves each client's closing balance after a renewal from the accounts
 * module. A client whose balance did not change since its last entry is
 * skipped, so daily renewals do not repeat the same line.
 *
 * @returns {Promise<number>} how many entries were written
 */
export async function recordBalanceSnapshots(accounts, { dateRange = "", recordedBy = "" } = {}) {
  const lastBalances = await ClientLedgerEntry.aggregate([
    { $match: { kind: "balance", source: ACCOUNTS_MODULE } },
    { $sort: { accountCode: 1, recordedAt: -1 } },
    { $group: { _id: "$accountCode", balance: { $first: "$balance" } } },
  ]);
  const lastByCode = new Map(lastBalances.map((b) => [b._id, b.balance]));

  const recordedAt = new Date();
  const entries = [];
  for (const account of accounts) {
    const accountCode = String(account?.accountCode ?? "").trim();
    if (!accountCode) continue;

    const balance = closingNetBalance(account);
    const last = lastByCode.get(accountCode);
    if (last !== undefined && Math.abs(last - balance) < 0.005) continue;

    entries.push({
      accountCode,
      accountName: account.account || "",
      kind: "balance",
      source: ACCOUNTS_MODULE,
      balance,
      dateRange: dateRange || "",
      recordedAt,
      recordedBy,
    });
  }

  if (entries.length > 0) {
    await ClientLedgerEntry.insertMany(entries);
  }
  return entries.length;
}

/** Latest balance entries for one client, newest first. */
export async function getBalanceHistory(accountCode, limit = 30) {
  return ClientLedgerEntry.find({
    accountCode: String(accountCode),
    kind: "balance",
    source: ACCOUNTS_MODULE,
  })
    .sort({ recordedAt: -1 })
    .limit(limit)
    .select("balance dateRange recordedAt -_id")
    .lean();
}
