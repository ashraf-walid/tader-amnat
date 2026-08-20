
// write the following script to run th code
// npm run delete-transactions

import mongoose from 'mongoose';
import { connectToDatabase } from '../src/lib/mongodb.js';
import AccountData from '../src/models/AccountData.js';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

// read environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const envPath = join(__dirname, '..', '.env.local');

if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  const envLines = envContent.split('\n');

  envLines.forEach(line => {
    const [key, value] = line.split('=');
    if (key && value) {
      process.env[key.trim()] = value.trim().replace(/^['"]|['"]$/g, '');
    }
  });
}

// ════════════════════════════════════════════════════════════════════════════════
// script to delete transactions from a specific date and recalculate the balances
// ════════════════════════════════════════════════════════════════════════════════

// 📅 set the date you want to delete transactions from here (in YYYY-MM-DD format)
const TARGET_DATE = '2026-08-18'; // change this date as needed

// ════════════════════════════════════════════════════════════════════════════════

/**
 * calculates the updated balances after removing the transactions
 * follows the same logic of calculating the balances in the main system
 */
function recalculateBalances(account) {
  const transactions = account.transactions || [];

  // calculating the sum of additions and deductions from the remaining transactions
  const manualAdditions = transactions
    .filter(t => t.type === 'addition')
    .reduce((sum, t) => sum + (t.amount || 0), 0);

  const manualDeductions = transactions
    .filter(t => t.type === 'deduction')
    .reduce((sum, t) => sum + (t.amount || 0), 0);

  // updating the totals fields to reflect the remaining transactions
  account.totals = {
    debit: manualAdditions,
    credit: manualDeductions
  };

  // we don't change closingBalance because it is calculated automatically in the display
  // the system calculates the final balance as follows:
  // adjustedClosingDebit = closingBalance.debit + manualAdditions - manualDeductions
  // finalBalance = adjustedClosingDebit - closingBalance.credit

  return account;
}

async function deleteTransactionsByDate() {
  try {
    // connecting to the database using the same system project
    await connectToDatabase();
    console.log('✅ تم الاتصال بقاعدة البيانات بنجاح');

    // converting the target date to the start and end of the day
    const startOfDay = new Date(TARGET_DATE);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(TARGET_DATE);
    endOfDay.setHours(23, 59, 59, 999);

    console.log(`🔍 searching for transactions in the date: ${TARGET_DATE}`);
    console.log(`📅 from: ${startOfDay.toISOString()}`);
    console.log(`📅 to: ${endOfDay.toISOString()}`);

    // finding all accounts that contain transactions in this date
    const accountsWithTransactions = await AccountData.find({
      'transactions.date': {
        $gte: startOfDay,
        $lte: endOfDay
      }
    });

    console.log(`📊 found ${accountsWithTransactions.length} accounts containing transactions in this date`);

    if (accountsWithTransactions.length === 0) {
      console.log('ℹ️  no transactions found in this date');
      return;
    }

    let totalDeletedTransactions = 0;
    let totalDeletedAmount = { additions: 0, deductions: 0 };

    // deleting transactions from each account and recalculating the balances
    for (const account of accountsWithTransactions) {
      const originalTransactions = [...account.transactions];

      // calculating the transactions to be deleted for statistics
      const transactionsToDelete = account.transactions.filter(transaction => {
        const transactionDate = new Date(transaction.date);
        return transactionDate >= startOfDay && transactionDate <= endOfDay;
      });

      // calculating the sum of additions and deductions from the remaining transactions
      transactionsToDelete.forEach(t => {
        if (t.type === 'addition') {
          totalDeletedAmount.additions += t.amount || 0;
        } else if (t.type === 'deduction') {
          totalDeletedAmount.deductions += t.amount || 0;
        }
      });

      // filtering transactions to remove transactions on the specified date
      account.transactions = account.transactions.filter(transaction => {
        const transactionDate = new Date(transaction.date);
        return !(transactionDate >= startOfDay && transactionDate <= endOfDay);
      });

      const deletedCount = originalTransactions.length - account.transactions.length;
      totalDeletedTransactions += deletedCount;

      if (deletedCount > 0) {
        // recalculate the balances
        recalculateBalances(account);

        // save the changes
        await account.save();

        console.log(`🗑️  deleted ${deletedCount} transactions from the account: ${account.account} (${account.accountCode})`);
        console.log(`   📈 remaining transactions: ${account.transactions.length}`);
        console.log(`   💰 new totals: additions ${account.totals.debit}, deductions ${account.totals.credit}`);
      }
    }

    console.log('═══════════════════════════════════════════════════════════');
    console.log('✅ process completed successfully!');
    console.log(`📊 total deleted transactions: ${totalDeletedTransactions}`);
    console.log(`📊 affected accounts: ${accountsWithTransactions.length}`);
    console.log(`💰 total additions deleted: ${totalDeletedAmount.additions}`);
    console.log(`💰 total deductions deleted: ${totalDeletedAmount.deductions}`);
    console.log(`💱 net effect: ${totalDeletedAmount.additions - totalDeletedAmount.deductions}`);
    console.log('═══════════════════════════════════════════════════════════');

  } catch (error) {
    console.error('❌ an error occurred during the execution of the process:', error);
    console.error('📋 error details:', error.message);
  } finally {
    // closing the database connection
    await mongoose.disconnect();
    console.log('🔌 database connection closed');
    process.exit();
  }
}

// running the script
console.log('🚀 starting the process of deleting transactions...');
console.log(`🎯 target date: ${TARGET_DATE}`);
console.log('⚠️  the balances will be recalculated automatically after deletion');
deleteTransactionsByDate();