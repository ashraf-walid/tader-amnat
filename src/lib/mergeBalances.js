/**
 * 🔄 Merge base balances (30/06) with new HTML file balances
 * 
 * هذا الملف يحتوي على منطق دمج أرصدة ملف 30/06 الأساسي
 * مع الأرصدة المستخرجة من ملف HTML جديد
 * 
 * ⚠️ ملاحظة مهمة: عند استخدام الدمج، سيتم حذف جميع المعاملات اليدوية القديمة (transactions)
 * والبدء من جديد مع الأرصدة المدمجة فقط.
 */

import { parseAccountingHTML } from './parser';

/**
 * تحميل ملف الأرصدة الأساسية (30/06) من public folder
 * @returns {Promise<Object>}
 */
async function loadBaseBalances() {
  try {
    const response = await fetch('/base-balances-30-06.json');
    if (!response.ok) {
      throw new Error('فشل في تحميل ملف الأرصدة الأساسية');
    }
    const baseData = await response.json();
    console.log('✅ تم تحميل ملف الأرصدة الأساسية:', {
      accountsCount: baseData.accountsCount || baseData.data?.length || 0,
      dateRange: baseData.dateRange
    });
    return baseData;
  } catch (error) {
    console.error('❌ خطأ في تحميل ملف الأرصدة الأساسية:', error);
    throw error;
  }
}

/**
 * دمج رصيدين (جمع جميع الحقول)
 * @param {Object} baseBalance - الرصيد الأساسي من ملف 30/06
 * @param {Object} newBalance - الرصيد الجديد من الملف المرفوع
 * @returns {Object} - الرصيد المدمج
 */
function mergeBalanceFields(baseBalance, newBalance) {
  return {
    debit: (baseBalance?.debit || 0) + (newBalance?.debit || 0),
    credit: (baseBalance?.credit || 0) + (newBalance?.credit || 0)
  };
}

/**
 * دمج حساب واحد (الأرصدة الأساسية + الأرصدة الجديدة)
 * @param {Object} baseAccount - الحساب من ملف 30/06
 * @param {Object} newAccount - الحساب من الملف الجديد (إذا كان موجوداً)
 * @returns {Object} - الحساب المدمج
 */
function mergeAccount(baseAccount, newAccount) {
  // إذا لم يكن الحساب موجوداً في الملف الجديد، نستخدم أرصدة 30/06 كما هي
  if (!newAccount) {
    console.log(`📌 الحساب ${baseAccount.accountCode} موجود فقط في 30/06، سيتم الاحتفاظ بأرصدته`);
    return { ...baseAccount };
  }

  // دمج الأرصدة (جمع جميع الحقول)
  const mergedAccount = {
    accountCode: baseAccount.accountCode,
    account: baseAccount.account, // نستخدم اسم الحساب من الملف الأساسي
    openingBalance: mergeBalanceFields(
      baseAccount.openingBalance,
      newAccount.openingBalance
    ),
    totals: mergeBalanceFields(
      baseAccount.totals,
      newAccount.totals
    ),
    closingBalance: mergeBalanceFields(
      baseAccount.closingBalance,
      newAccount.closingBalance
    )
  };

  console.log(`✅ تم دمج الحساب ${baseAccount.accountCode}:`, {
    base: baseAccount.closingBalance,
    new: newAccount.closingBalance,
    merged: mergedAccount.closingBalance
  });

  return mergedAccount;
}

/**
 * دمج ملف HTML جديد مع الأرصدة الأساسية (30/06)
 * @param {File} htmlFile - ملف HTML الجديد من النظام المحاسبي
 * @returns {Promise<{data: Array, dateRange: string, mergeInfo: Object}>}
 */
export async function mergeHTMLWithBaseBalances(htmlFile) {
  try {
    console.log('🔄 بدء عملية الدمج...');

    // 1. Load base balances (30/06)
    const baseBalancesData = await loadBaseBalances();
    const baseAccounts = baseBalancesData.data || [];

    if (!baseAccounts || baseAccounts.length === 0) {
      throw new Error('لا توجد حسابات في ملف الأرصدة الأساسية');
    }

    // 2. Parse new HTML file
    const { data: newAccounts, dateRange: newDateRange } = await parseAccountingHTML(htmlFile);

    if (!newAccounts || newAccounts.length === 0) {
      throw new Error('لم يتم العثور على حسابات في الملف الجديد');
    }

    console.log('📊 إحصائيات قبل الدمج:', {
      baseAccountsCount: baseAccounts.length,
      newAccountsCount: newAccounts.length
    });

    // 3. إنشاء خريطة (Map) للحسابات الجديدة لسهولة البحث
    const newAccountsMap = new Map();
    newAccounts.forEach(account => {
      newAccountsMap.set(account.accountCode, account);
    });

    // 4. Merge accounts
    const mergedAccounts = [];
    let mergedCount = 0;
    let onlyInBaseCount = 0;

    for (const baseAccount of baseAccounts) {
      const newAccount = newAccountsMap.get(baseAccount.accountCode);
      
      if (newAccount) {
        // الحساب موجود في كلا الملفين → دمج
        mergedAccounts.push(mergeAccount(baseAccount, newAccount));
        mergedCount++;
      } else {
        // الحساب موجود فقط في 30/06 → احتفظ به كما هو
        mergedAccounts.push({ ...baseAccount });
        onlyInBaseCount++;
      }
    }

    // 5. إضافة الحسابات الجديدة الموجودة فقط في الملف الجديد (إن وجدت)
    let onlyInNewCount = 0;
    const baseAccountCodes = new Set(baseAccounts.map(acc => acc.accountCode));
    
    for (const newAccount of newAccounts) {
      if (!baseAccountCodes.has(newAccount.accountCode)) {
        console.log(`🆕 حساب جديد: ${newAccount.accountCode} موجود فقط في الملف الجديد`);
        mergedAccounts.push({ ...newAccount });
        onlyInNewCount++;
      }
    }

    // 6. معلومات الدمج
    const mergeInfo = {
      totalAccounts: mergedAccounts.length,
      mergedAccounts: mergedCount,
      onlyInBase: onlyInBaseCount,
      onlyInNew: onlyInNewCount,
      baseDateRange: baseBalancesData.dateRange,
      newDateRange: newDateRange
    };

    console.log('✅ اكتملت عملية الدمج بنجاح:', mergeInfo);

    // 7. Create combined date range
    const combinedDateRange = `${baseBalancesData.dateRange} + ${newDateRange}`;

    return {
      data: mergedAccounts,
      dateRange: combinedDateRange,
      mergeInfo
    };

  } catch (error) {
    console.error('❌ خطأ في عملية الدمج:', error);
    throw error;
  }
}

/**
 * دالة مساعدة للتحقق من وجود ملف الأرصدة الأساسية
 * @returns {Promise<boolean>}
 */
export async function checkBaseBalancesExists() {
  try {
    const response = await fetch('/base-balances-30-06.json', { method: 'HEAD' });
    return response.ok;
  } catch (error) {
    return false;
  }
}
