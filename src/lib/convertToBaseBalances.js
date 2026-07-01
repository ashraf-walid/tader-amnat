/**
 * 🔄 Convert HTML accounting file to base balances JSON
 * 
 * هذا الملف يحتوي على دالة لتحويل ملف HTML من النظام المحاسبي
 * إلى ملف JSON ثابت للأرصدة الأساسية (base-balances-30-06.json)
 */

import { parseAccountingHTML } from './parser';

/**
 * تحويل ملف HTML إلى JSON ثابت للأرصدة الأساسية
 * @param {File} htmlFile - ملف HTML من النظام المحاسبي
 * @returns {Promise<{success: boolean, jsonData?: Object, fileName?: string, error?: string}>}
 */
export async function convertHTMLToBaseBalances(htmlFile) {
  try {
    // 1. تحليل ملف HTML باستخدام المحلل الموجود
    const { data, dateRange } = await parseAccountingHTML(htmlFile);

    if (!data || data.length === 0) {
      return {
        success: false,
        error: 'لم يتم العثور على بيانات في الملف'
      };
    }

    // 2. بناء كائن JSON للأرصدة الأساسية
    const baseBalances = {
      dateRange: dateRange || '',
      createdAt: new Date().toISOString(),
      accountsCount: data.length,
      data: data.map(account => ({
        accountCode: account.accountCode,
        account: account.account,
        openingBalance: {
          debit: account.openingBalance?.debit || 0,
          credit: account.openingBalance?.credit || 0
        },
        totals: {
          debit: account.totals?.debit || 0,
          credit: account.totals?.credit || 0
        },
        closingBalance: {
          debit: account.closingBalance?.debit || 0,
          credit: account.closingBalance?.credit || 0
        }
      }))
    };

    // 3. إنشاء اسم الملف بناءً على التاريخ
    const fileName = 'base-balances-30-06.json';

    // 4. تحويل إلى JSON منسق
    const jsonContent = JSON.stringify(baseBalances, null, 2);

    // 5. إنشاء Blob وتنزيل الملف
    const blob = new Blob([jsonContent], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    console.log(`✅ تم إنشاء ملف ${fileName} بنجاح`);
    console.log(`📊 عدد الحسابات: ${data.length}`);
    console.log(`📅 نطاق التاريخ: ${dateRange}`);

    return {
      success: true,
      jsonData: baseBalances,
      fileName: fileName
    };

  } catch (error) {
    console.error('❌ خطأ في تحويل الملف:', error);
    return {
      success: false,
      error: error.message || 'حدث خطأ أثناء معالجة الملف'
    };
  }
}

/**
 * دالة مساعدة لقراءة محتوى ملف JSON (للتحقق من الملف المُنشأ)
 * @param {File} jsonFile - ملف JSON
 * @returns {Promise<Object>}
 */
export async function readBaseBalancesFile(jsonFile) {
  try {
    const text = await jsonFile.text();
    const data = JSON.parse(text);
    
    console.log('✅ تم قراءة ملف الأرصدة الأساسية بنجاح');
    console.log(`📊 عدد الحسابات: ${data.accountsCount || data.data?.length || 0}`);
    console.log(`📅 نطاق التاريخ: ${data.dateRange || 'غير محدد'}`);
    
    return data;
  } catch (error) {
    console.error('❌ خطأ في قراءة ملف JSON:', error);
    throw new Error('فشل في قراءة ملف الأرصدة الأساسية');
  }
}
