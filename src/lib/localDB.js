/**
 * 💾 Local Database Layer using Dexie (IndexedDB)
 * 
 * This file provides a unified interface for interacting with the local database
 * for storing customer accounts and financial transactions
 */

import Dexie from 'dexie';
import { normalizeArabicText } from './search-utils';

// ─── Database Creation ────────────────────────────────────────────────────
const db = new Dexie('amanat_db');

// ─── Tables and Schema Definition ────────────────────────────────────────────────
db.version(1).stores({
  // Accounts table
  accounts: 'accountCode, account, *transactions.date', // accountCode = Primary Key

  // Metadata table
  metadata: 'key', // key = Primary Key (e.g.: lastSync, dateRange)
});

// ═══════════════════════════════════════════════════════════════════════════════
// 📖 Read Operations
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Check if the database is empty
 * @returns {Promise<boolean>}
 */
export async function isDBEmpty() {
  try {
    const count = await db.accounts.count();
    return count === 0;
  } catch (error) {
    console.error('Error checking if DB is empty:', error);
    return true;
  }
}

/**
 * Get all accounts
 * @returns {Promise<Array>}
 */
export async function getAllAccounts() {
  try {
    const accounts = await db.accounts.toArray();
    return accounts;
  } catch (error) {
    console.error('Error getting all accounts:', error);
    return [];
  }
}

/**
 * الحصول على الحسابات التي لديها معاملات فقط
 * @returns {Promise<Array>}
 */
export async function getAccountsWithTransactions() {
  try {
    const accounts = await db.accounts
      .filter(account =>
        account.transactions &&
        Array.isArray(account.transactions) &&
        account.transactions.length > 0
      )
      .toArray();

    return accounts;
  } catch (error) {
    console.error('Error getting accounts with transactions:', error);
    return [];
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// ✏️ Write operations (Write Operations)
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * حفظ جميع الحسابات (استبدال كامل - عند رفع ملف جديد)
 * @param {Array} accounts - مصفوفة الحسابات
 * @returns {Promise<boolean>} - true إذا نجح
 */
export async function saveAllAccounts(accounts) {
  try {
    // Clear old data first
    await db.accounts.clear();

    // Add new data
    await db.accounts.bulkAdd(accounts);

    console.log(`✅ تم حفظ ${accounts.length} حساب في IndexedDB`);
    return true;
  } catch (error) {
    console.error('Error saving all accounts:', error);
    return false;
  }
}

/**
 * إضافة أو تحديث المعاملات لحساب معين
 * @param {string} accountCode - كود الحساب
 * @param {Array} transactions - مصفوفة المعاملات الجديدة
 * @param {string} [accountName] - اسم الحساب كخيار بديل في حال عدم توفر الكود
 * @returns {Promise<boolean>}
 */
export async function updateTransactions(accountCode, transactions, accountName) {
  try {
    if (accountCode) {
      await db.accounts.update(accountCode, { transactions });
      console.log(`✅ تم تحديث معاملات الحساب ${accountCode}`);
      return true;
    } else if (accountName) {
      await db.accounts.where('account').equals(accountName).modify({ transactions });
      console.log(`✅ تم تحديث معاملات الحساب محلياً بالاسم: ${accountName}`);
      return true;
    }
    return false;
  } catch (error) {
    console.error(`Error updating transactions for ${accountCode || accountName}:`, error);
    return false;
  }
}

/**
 * مسح جميع البيانات (الحسابات والـ metadata)
 * @returns {Promise<boolean>}
 */
export async function clearAllData() {
  try {
    await db.accounts.clear();
    await db.metadata.clear();
    console.log('🗑️ تم مسح جميع البيانات من IndexedDB');
    return true;
  } catch (error) {
    console.error('Error clearing all data:', error);
    return false;
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// 🔄 عمليات الـ Metadata والمزامنة
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * حفظ قيمة metadata
 * @param {string} key - المفتاح (مثل: dateRange, lastSync)
 * @param {any} value - القيمة
 * @returns {Promise<boolean>}
 */
export async function setMetadata(key, value) {
  try {
    await db.metadata.put({ key, value });
    return true;
  } catch (error) {
    console.error(`Error setting metadata ${key}:`, error);
    return false;
  }
}

/**
 * قراءة قيمة metadata
 * @param {string} key - المفتاح
 * @returns {Promise<any|null>}
 */
export async function getMetadata(key) {
  try {
    const record = await db.metadata.get(key);
    return record ? record.value : null;
  } catch (error) {
    console.error(`Error getting metadata ${key}:`, error);
    return null;
  }
}

/**
 * حفظ timestamp آخر مزامنة
 * @param {number} timestamp - الوقت (Date.now())
 * @returns {Promise<boolean>}
 */
export async function setLastSyncTimestamp(timestamp) {
  return await setMetadata('lastSync', timestamp);
}

/**
 * قراءة timestamp آخر مزامنة
 * @returns {Promise<number>}
 */
export async function getLastSyncTimestamp() {
  const timestamp = await getMetadata('lastSync');
  return timestamp || 0;
}

/**
 * حفظ نطاق التاريخ (dateRange)
 * @param {string} dateRange - نطاق التاريخ
 * @returns {Promise<boolean>}
 */
export async function setDateRange(dateRange) {
  return await setMetadata('dateRange', dateRange);
}

/**
 * قراءة نطاق التاريخ
 * @returns {Promise<string>}
 */
export async function getDateRange() {
  const dateRange = await getMetadata('dateRange');
  return dateRange || '';
}

// ═══════════════════════════════════════════════════════════════════════════════
// 🛠️ عمليات الصيانة والتشخيص
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Check for IndexedDB support in your browser
 * @returns {boolean}
 */
export function isIndexedDBSupported() {
  return 'indexedDB' in window;
}

// ═══════════════════════════════════════════════════════════════════════════════
// 🔧 Exports
// ═══════════════════════════════════════════════════════════════════════════════

export default db;
