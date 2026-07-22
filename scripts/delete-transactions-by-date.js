
// write the following script to run th code
// npm run delete-transactions

import mongoose from 'mongoose';
import { connectToDatabase } from '../src/lib/mongodb.js';
import AccountData from '../src/models/AccountData.js';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

// قراءة متغيرات البيئة يدوياً
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
// 🗑️ سكريبت لحذف المعاملات بتاريخ معين مع إعادة حساب الأرصدة
// ════════════════════════════════════════════════════════════════════════════════

// 📅 ضع التاريخ المطلوب حذف معاملاته هنا (بصيغة YYYY-MM-DD)
const TARGET_DATE = '2026-07-21'; // غيّر هذا التاريخ حسب الحاجة

// ════════════════════════════════════════════════════════════════════════════════

/**
 * يحسب التوازنات المحدثة بعد إزالة المعاملات
 * يتبع نفس منطق حساب الأرصدة في النظام الأساسي
 */
function recalculateBalances(account) {
  const transactions = account.transactions || [];

  // حساب مجموع الإضافات والخصومات من المعاملات المتبقية
  const manualAdditions = transactions
    .filter(t => t.type === 'addition')
    .reduce((sum, t) => sum + (t.amount || 0), 0);

  const manualDeductions = transactions
    .filter(t => t.type === 'deduction')
    .reduce((sum, t) => sum + (t.amount || 0), 0);

  // تحديث حقول totals لتعكس المعاملات المتبقية
  account.totals = {
    debit: manualAdditions,
    credit: manualDeductions
  };

  // لا نغير closingBalance لأنه يحسب تلقائياً في العرض
  // النظام يحسب الرصيد النهائي كالتالي:
  // adjustedClosingDebit = closingBalance.debit + manualAdditions - manualDeductions
  // finalBalance = adjustedClosingDebit - closingBalance.credit

  return account;
}

async function deleteTransactionsByDate() {
  try {
    // الاتصال بقاعدة البيانات باستخدام نفس نظام المشروع
    await connectToDatabase();
    console.log('✅ تم الاتصال بقاعدة البيانات بنجاح');

    // تحويل التاريخ المطلوب إلى تاريخ بداية ونهاية اليوم
    const startOfDay = new Date(TARGET_DATE);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(TARGET_DATE);
    endOfDay.setHours(23, 59, 59, 999);

    console.log(`🔍 البحث عن المعاملات في التاريخ: ${TARGET_DATE}`);
    console.log(`📅 من: ${startOfDay.toISOString()}`);
    console.log(`📅 إلى: ${endOfDay.toISOString()}`);

    // العثور على جميع الحسابات التي تحتوي على معاملات في هذا التاريخ
    const accountsWithTransactions = await AccountData.find({
      'transactions.date': {
        $gte: startOfDay,
        $lte: endOfDay
      }
    });

    console.log(`📊 تم العثور على ${accountsWithTransactions.length} حساب يحتوي على معاملات في هذا التاريخ`);

    if (accountsWithTransactions.length === 0) {
      console.log('ℹ️  لا توجد معاملات للحذف في هذا التاريخ');
      return;
    }

    let totalDeletedTransactions = 0;
    let totalDeletedAmount = { additions: 0, deductions: 0 };

    // حذف المعاملات من كل حساب وإعادة حساب الأرصدة
    for (const account of accountsWithTransactions) {
      const originalTransactions = [...account.transactions];

      // حساب المعاملات التي سيتم حذفها للإحصائيات
      const transactionsToDelete = account.transactions.filter(transaction => {
        const transactionDate = new Date(transaction.date);
        return transactionDate >= startOfDay && transactionDate <= endOfDay;
      });

      // حساب مجموع المبالغ المحذوفة
      transactionsToDelete.forEach(t => {
        if (t.type === 'addition') {
          totalDeletedAmount.additions += t.amount || 0;
        } else if (t.type === 'deduction') {
          totalDeletedAmount.deductions += t.amount || 0;
        }
      });

      // فلترة المعاملات لإزالة المعاملات في التاريخ المحدد
      account.transactions = account.transactions.filter(transaction => {
        const transactionDate = new Date(transaction.date);
        return !(transactionDate >= startOfDay && transactionDate <= endOfDay);
      });

      const deletedCount = originalTransactions.length - account.transactions.length;
      totalDeletedTransactions += deletedCount;

      if (deletedCount > 0) {
        // إعادة حساب الأرصدة
        recalculateBalances(account);

        // حفظ التغييرات
        await account.save();

        console.log(`🗑️  حذف ${deletedCount} معاملة من الحساب: ${account.account} (${account.accountCode})`);
        console.log(`   📈 المعاملات المتبقية: ${account.transactions.length}`);
        console.log(`   💰 المجاميع الجديدة: إضافات ${account.totals.debit}, خصومات ${account.totals.credit}`);
      }
    }

    console.log('═══════════════════════════════════════════════════════════');
    console.log('✅ تمت العملية بنجاح!');
    console.log(`📊 إجمالي المعاملات المحذوفة: ${totalDeletedTransactions}`);
    console.log(`📊 الحسابات المتأثرة: ${accountsWithTransactions.length}`);
    console.log(`💰 مجموع الإضافات المحذوفة: ${totalDeletedAmount.additions}`);
    console.log(`💰 مجموع الخصومات المحذوفة: ${totalDeletedAmount.deductions}`);
    console.log(`💱 صافي التأثير: ${totalDeletedAmount.additions - totalDeletedAmount.deductions}`);
    console.log('═══════════════════════════════════════════════════════════');

    // إرسال إشعار للأجهزة المحلية لتحديث IndexedDB
    // try {
    //   console.log('\n🔔 إرسال إشعار مزامنة للأجهزة المحلية...');

    //   const notificationPayload = {
    //     title: 'تحديث البيانات',
    //     message: `تم حذف ${totalDeletedTransactions} معاملة من تاريخ ${TARGET_DATE}. يرجى تحديث التطبيق.`,
    //     data: {
    //       type: 'TRANSACTIONS_DELETED',
    //       targetDate: TARGET_DATE,
    //       deletedCount: totalDeletedTransactions,
    //       affectedAccounts: accountsWithTransactions.map(acc => acc.accountCode)
    //     }
    //   };

    //   // إرسال إشعار عبر push notifications لجميع المستخدمين
    //   const response = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/push/send`, {
    //     method: 'POST',
    //     headers: {
    //       'Content-Type': 'application/json',
    //       'Authorization': `Bearer ${process.env.JWT_SECRET}` // أو أي authentication مطلوب
    //     },
    //     body: JSON.stringify(notificationPayload)
    //   });

    //   if (response.ok) {
    //     console.log('✅ تم إرسال إشعار المزامنة بنجاح');
    //   } else {
    //     console.log('⚠️  فشل في إرسال إشعار المزامنة (غير مطلوب للنجاح)');
    //   }
    // } catch (error) {
    //   console.log('⚠️  فشل في إرسال إشعار المزامنة:', error.message);
    //   console.log('ℹ️  هذا لا يؤثر على نجاح عملية الحذف من قاعدة البيانات');
    // }

  } catch (error) {
    console.error('❌ حدث خطأ أثناء تنفيذ العملية:', error);
    console.error('📋 تفاصيل الخطأ:', error.message);
  } finally {
    // إغلاق الاتصال بقاعدة البيانات
    await mongoose.disconnect();
    console.log('🔌 تم قطع الاتصال بقاعدة البيانات');
    process.exit();
  }
}

// تشغيل السكريبت
console.log('🚀 بدء عملية حذف المعاملات...');
console.log(`🎯 التاريخ المستهدف: ${TARGET_DATE}`);
console.log('⚠️  سيتم إعادة حساب الأرصدة تلقائياً بعد الحذف');
deleteTransactionsByDate();