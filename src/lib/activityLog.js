import ActivityLog from "@/models/ActivityLog";

/**
 * Records who did a sensitive action. A failure here is logged and
 * swallowed so it never blocks the action itself.
 *
 * @param {object} actor - decoded token from requireAdmin/requireOwner
 * @param {string} action - e.g. "account.create", "balance.change"
 */
export async function logActivity(actor, action, { target, details } = {}) {
  try {
    await ActivityLog.create({
      actorId: actor?.userId || actor?.id || null,
      actorName: actor?.username || "غير معروف",
      actorRole: actor?.role || "",
      action,
      target,
      details: details || {},
    });
  } catch (error) {
    console.error(`Failed to write activity log (${action}):`, error);
  }
}

const transactionKey = (t) => {
  const time = new Date(t?.date).getTime();
  return `${t?.type}|${Number(t?.amount) || 0}|${Number.isNaN(time) ? "" : time}`;
};

/**
 * Compares a client's transactions before and after a save.
 * The client always sends the whole array, so this works out what changed.
 * New transactions get `createdBy`; kept ones keep their original `createdBy`.
 */
export function diffTransactions(oldTransactions = [], newTransactions = [], actorName) {
  const unmatched = new Map();
  for (const t of oldTransactions) {
    const key = transactionKey(t);
    if (!unmatched.has(key)) unmatched.set(key, []);
    unmatched.get(key).push(t);
  }

  const added = [];
  const transactions = newTransactions.map((t) => {
    const match = unmatched.get(transactionKey(t))?.shift();
    if (match) return { ...t, createdBy: match.createdBy ?? t.createdBy };
    added.push(t);
    return { ...t, createdBy: actorName };
  });

  const removed = [...unmatched.values()].flat();
  const summarize = (list) => list.map((t) => ({ type: t.type, amount: Number(t.amount) || 0 }));

  return { transactions, added: summarize(added), removed: summarize(removed) };
}
