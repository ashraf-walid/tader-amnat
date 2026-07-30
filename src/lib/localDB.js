/**
 * 💾 Local Database Layer using Dexie (IndexedDB)
 * 
 * هذا الملف يوفر واجهة موحدة للتعامل مع قاعدة البيانات المحلية
 * لتخزين حسابات العملاء والمعاملات المالية
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
 * التحقق من أن قاعدة البيانات فارغة
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
 * قراءة جميع الحسابات
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
 * قراءة حساب واحد بناءً على الكود
 * @param {string} accountCode - كود الحساب
 * @returns {Promise<Object|null>}
 */
export async function getAccountByCode(accountCode) {
  try {
    const account = await db.accounts.get(accountCode);
    return account || null;
  } catch (error) {
    console.error(`Error getting account ${accountCode}:`, error);
    return null;
  }
}

/**
 * البحث في الحسابات (بالاسم أو الكود)
 * @param {string} query - نص البحث
 * @returns {Promise<Array>}
 */
export async function searchAccounts(query) {
  try {
    if (!query || query.trim() === '') {
      return await getAllAccounts();
    }

    const normalizedQuery = normalizeArabicText(query);

    // Search in both account name and account code
    const results = await db.accounts
      .filter(account => {
        const normalizedAccountName = normalizeArabicText(account.account || '');
        const normalizedAccountCode = normalizeArabicText(account.accountCode || '');

        return normalizedAccountName.includes(normalizedQuery) ||
          normalizedAccountCode.includes(normalizedQuery);
      })
      .toArray();

    return results;
  } catch (error) {
    console.error('Error searching accounts:', error);
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

/**
 * الحصول على الحسابات مع pagination محلي
 * @param {number} page - رقم الصفحة (يبدأ من 1)
 * @param {number} limit - عدد العناصر في الصفحة
 * @param {string} searchQuery - نص البحث (اختياري)
 * @param {boolean} transactionsOnly - عرض الحسابات التي لديها معاملات فقط
 * @returns {Promise<Object>} - {data, pagination}
 */
export async function getAccountsPaginated(page = 1, limit = 50, searchQuery = '', transactionsOnly = false) {
  try {
    let query = db.accounts;

    // تطبيق الفلاتر
    if (transactionsOnly) {
      query = query.filter(account =>
        account.transactions &&
        Array.isArray(account.transactions) &&
        account.transactions.length > 0
      );
    }

    if (searchQuery && searchQuery.trim() !== '') {
      const normalizedQuery = normalizeArabicText(searchQuery);
      query = query.filter(account => {
        const normalizedAccountName = normalizeArabicText(account.account || '');
        const normalizedAccountCode = normalizeArabicText(account.accountCode || '');

        return normalizedAccountName.includes(normalizedQuery) ||
          normalizedAccountCode.includes(normalizedQuery);
      });
    }

    // Calculate total
    const total = await query.count();
    const totalPages = Math.ceil(total / limit) || 1;

    // حساب offset
    const offset = (page - 1) * limit;

    // جلب البيانات مع pagination
    const data = await query
      .offset(offset)
      .limit(limit)
      .toArray();

    return {
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    };
  } catch (error) {
    console.error('Error getting paginated accounts:', error);
    return {
      data: [],
      pagination: {
        page: 1,
        limit: 50,
        total: 0,
        totalPages: 1,
        hasNextPage: false,
        hasPrevPage: false,
      },
    };
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
 * تحديث حساب واحد
 * @param {string} accountCode - كود الحساب
 * @param {Object} updatedData - البيانات المحدثة
 * @returns {Promise<boolean>}
 */
export async function updateAccount(accountCode, updatedData) {
  try {
    await db.accounts.update(accountCode, updatedData);
    console.log(`✅ تم تحديث الحساب ${accountCode}`);
    return true;
  } catch (error) {
    console.error(`Error updating account ${accountCode}:`, error);
    return false;
  }
}

/**
 * إضافة أو تحديث المعاملات لحساب معين
 * @param {string} accountCode - كود الحساب
 * @param {Array} transactions - مصفوفة المعاملات الجديدة
 * @returns {Promise<boolean>}
 */
export async function updateTransactions(accountCode, transactions) {
  try {
    await db.accounts.update(accountCode, { transactions });
    console.log(`✅ تم تحديث معاملات الحساب ${accountCode}`);
    return true;
  } catch (error) {
    console.error(`Error updating transactions for ${accountCode}:`, error);
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
 * الحصول على إحصائيات قاعدة البيانات
 * @returns {Promise<Object>}
 */
export async function getDatabaseStats() {
  try {
    const accountsCount = await db.accounts.count();
    const withTransactions = await db.accounts
      .filter(acc => acc.transactions && acc.transactions.length > 0)
      .count();
    const lastSync = await getLastSyncTimestamp();
    const dateRange = await getDateRange();

    return {
      totalAccounts: accountsCount,
      accountsWithTransactions: withTransactions,
      lastSync: lastSync ? new Date(lastSync).toLocaleString('ar-EG') : 'لم تتم المزامنة بعد',
      dateRange: dateRange || 'غير محدد',
      databaseSize: await estimateSize(),
    };
  } catch (error) {
    console.error('Error getting database stats:', error);
    return null;
  }
}

/**
 * تقدير حجم قاعدة البيانات (تقريبي)
 * @returns {Promise<string>}
 */
async function estimateSize() {
  try {
    if (navigator.storage && navigator.storage.estimate) {
      const estimate = await navigator.storage.estimate();
      const usageMB = (estimate.usage / (1024 * 1024)).toFixed(2);
      const quotaMB = (estimate.quota / (1024 * 1024)).toFixed(2);
      return `${usageMB} MB / ${quotaMB} MB`;
    }
    return 'غير متوفر';
  } catch (error) {
    return 'غير متوفر';
  }
}

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
