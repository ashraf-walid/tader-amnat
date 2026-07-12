import User from "@/models/User";
import PushSubscription from "@/models/PushSubscription";
import webpush from "@/lib/webpush";

/**
 * Calculates the net balance of an account based on values and custom transactions list.
 * Match formula from ClientBalance frontend component.
 */
export function calculateNetBalance(account) {
  if (!account) return 0;

  const transactions = account.transactions || [];
  const manualAdditions = transactions
    .filter((t) => t.type === "addition")
    .reduce((sum, t) => sum + (t.amount || 0), 0);
    
  const manualDeductions = transactions
    .filter((t) => t.type === "deduction")
    .reduce((sum, t) => sum + (t.amount || 0), 0);

  const adjustedClosingDebit = (account.closingBalance?.debit || 0) + manualAdditions - manualDeductions;
  const finalBalance = adjustedClosingDebit - (account.closingBalance?.credit || 0);

  return finalBalance;
}

/**
 * Sends a push notification to user when their balance changes.
 */
export async function sendBalanceNotification(accountCode, newBalance) {
  try {
    if (!accountCode) return;

    // Load User mappings based on accountCode
    const users = await User.find({ accountCode: Number(accountCode) });
    if (users.length === 0) {
      console.log(`ℹ️ [Balance Notification] No matching User found for accountCode: ${accountCode}`);
      return;
    }

    // Format new balance for display
    const balanceAbs = Math.abs(newBalance).toLocaleString("ar-EG", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
    const balanceStatus = newBalance > 0 ? "ليك" : newBalance < 0 ? "عليك" : "متوازن";

    const payload = JSON.stringify({
      title: "تحديث رصيد الحساب 💰",
      body: `تم تحديث رصيدك. الرصيد الحالي: ${balanceAbs} (${balanceStatus}).`,
      url: "/client/balance",
    });

    for (const user of users) {
      // Load push subscriptions
      const subscriptions = await PushSubscription.find({ userId: user._id });
      if (subscriptions.length === 0) {
        console.log(`ℹ️ [Balance Notification] User ${user.username} (code: ${accountCode}) has no push subscriptions.`);
        continue;
      }

      console.log(`✉️ Sending balance update notification to user ${user.username} (${subscriptions.length} device(s)): ${balanceAbs} (${balanceStatus})`);

      await Promise.allSettled(
        subscriptions.map(async (sub) => {
          try {
            await webpush.sendNotification(
              { endpoint: sub.endpoint, keys: sub.keys },
              payload
            );
          } catch (err) {
            // If the subscription is no longer valid, delete it
            if (err.statusCode === 410 || err.statusCode === 404) {
              await PushSubscription.deleteOne({ _id: sub._id });
              console.log(`🗑️ Deleted expired subscription instance for user ${user.username}`);
            } else {
              console.error(`❌ Failed to send notification to one subscription for ${user.username}:`, err.message);
            }
          }
        })
      );
    }
  } catch (err) {
    console.error("❌ Failed to process balance update notification:", err);
  }
}
