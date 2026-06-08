'use client';

import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { 
  SummaryIcon, 
  InfoIcon, 
  RefreshIcon,
  NavChartIcon,
  PlusIcon
} from './Icons';

function fmt(n, dec = 2) {
  if (n === undefined || n === null) return '0.00';
  return Number(n).toLocaleString('ar-EG', { minimumFractionDigits: dec, maximumFractionDigits: dec });
}

export default function ClientBalance() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchBalance = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/client/balance');
      const result = await res.json();
      if (result.success) {
        setData(result);
      } else {
        setError(result.error || 'فشل في جلب بيانات الحساب');
      }
    } catch (err) {
      setError('حدث خطأ في الاتصال بالخادم');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBalance();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-slate-500 font-medium">جاري تحميل بيانات الحساب...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-red-50 border border-red-200 rounded-2xl p-6 flex flex-col items-center text-center space-y-4">
          <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center text-red-600">
            <InfoIcon size={24} />
          </div>
          <div className="space-y-1">
            <h3 className="text-red-800 font-bold text-lg">خطأ في جلب البيانات</h3>
            <p className="text-red-600">{error}</p>
          </div>
          <button 
            onClick={fetchBalance}
            className="flex items-center gap-2 px-6 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors font-medium"
          >
            <RefreshIcon size={18} />
            إعادة المحاولة
          </button>
        </div>
      </div>
    );
  }

  const { accountName, accountCode, dateRange, openingBalance, totals, closingBalance, transactions } = data;

  // حساب إجمالي الإضافات والخصومات من العمليات اليدوية
  const manualAdditions = transactions
    .filter(t => t.type === 'addition')
    .reduce((sum, t) => sum + (t.amount || 0), 0);
    
  const manualDeductions = transactions
    .filter(t => t.type === 'deduction')
    .reduce((sum, t) => sum + (t.amount || 0), 0);

  // الرصيد النهائي المعدل: الإضافة تزيد المدين والخصم ينقصه
  const adjustedClosingDebit = (closingBalance?.debit || 0) + manualAdditions - manualDeductions;
  
  // تحديث إجمالي الحركة للعرض المتناسق
  const adjustedTotalsDebit = (totals?.debit || 0) + manualAdditions;
  const adjustedTotalsCredit = (totals?.credit || 0) + manualDeductions;

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-8 space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-xl">
              <NavChartIcon size={28} />
            </div>
            رصيد الحساب
          </h1>
          <div className="mt-1 space-y-1">
            <p className="text-slate-500 dark:text-slate-400 font-medium">
              {accountName}
            </p>
            {dateRange && (
              <p className="text-blue-600 dark:text-blue-400 text-sm font-bold">
                {dateRange}
              </p>
            )}
          </div>
        </div>
        <button 
          onClick={fetchBalance}
          className="flex items-center justify-center gap-2 px-5 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-all text-slate-700 dark:text-slate-200 font-medium shadow-sm"
        >
          <RefreshIcon size={18} />
          تحديث البيانات
        </button>
      </div>

      {/* Balance Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Opening Balance */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-slate-700 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <span className="text-slate-500 dark:text-slate-400 font-medium text-sm">الرصيد الإفتتاحي</span>
            <div className="p-2 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-lg">
              <SummaryIcon size={20} />
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between items-end">
              <span className="text-slate-400 text-xs">مدين</span>
              <span className="text-2xl font-bold text-slate-900 dark:text-white">{fmt(openingBalance.debit)}</span>
            </div>
            <div className="flex justify-between items-end">
              <span className="text-slate-400 text-xs">دائن</span>
              <span className="text-lg font-semibold text-slate-600 dark:text-slate-300">{fmt(openingBalance.credit)}</span>
            </div>
          </div>
        </div>

        {/* Totals (Movement) */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-slate-700 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <span className="text-slate-500 dark:text-slate-400 font-medium text-sm">إجمالي الحركة</span>
            <div className="p-2 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 rounded-lg">
              <PlusIcon size={20} />
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between items-end">
              <span className="text-slate-400 text-xs">إجمالي مدين</span>
              <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{fmt(adjustedTotalsDebit)}</span>
            </div>
            <div className="flex justify-between items-end">
              <span className="text-slate-400 text-xs">إجمالي دائن</span>
              <span className="text-lg font-semibold text-rose-600 dark:text-rose-400">{fmt(adjustedTotalsCredit)}</span>
            </div>
          </div>
        </div>

        {/* Closing Balance */}
        <div className="bg-blue-600 dark:bg-blue-700 rounded-2xl p-6 shadow-lg border border-blue-500 flex flex-col justify-between text-white">
          <div className="flex items-center justify-between mb-4">
            <span className="text-blue-100 font-medium text-sm">الرصيد النهائي</span>
            <div className="p-2 bg-white/20 text-white rounded-lg">
              <NavChartIcon size={20} />
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between items-end">
              <span className="text-blue-200 text-xs">مدين</span>
              <span className="text-3xl font-black">{fmt(adjustedClosingDebit)}</span>
            </div>
            <div className="flex justify-between items-end">
              <span className="text-blue-200 text-xs">دائن</span>
              <span className="text-xl font-bold opacity-80">{fmt(closingBalance?.credit)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Transactions Section */}
      <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden">
        <div className="p-6 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            أحدث العمليات
            <span className="text-xs font-normal text-slate-400 bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded-full">
              {transactions.length} عملية
            </span>
          </h2>
        </div>
        
        {transactions.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-right border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-900/50 text-slate-500 dark:text-slate-400 text-sm font-bold">
                  <th className="px-6 py-4">التاريخ</th>
                  <th className="px-6 py-4">النوع</th>
                  <th className="px-6 py-4 text-left">المبلغ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-slate-700/50">
                {transactions.map((tx, idx) => (
                  <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                    <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-300">
                      {tx.date ? format(new Date(tx.date), 'yyyy/MM/dd HH:mm', { locale: ar }) : 'غير محدد'}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${
                        tx.type === 'addition' 
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' 
                          : 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400'
                      }`}>
                        {tx.type === 'addition' ? 'إضافة' : 'خصم'}
                      </span>
                    </td>
                    <td className={`px-6 py-4 font-bold text-left ${
                      tx.type === 'addition' ? 'text-emerald-600' : 'text-rose-600'
                    }`}>
                      {tx.type === 'addition' ? '+' : '-'}{fmt(tx.amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-12 flex flex-col items-center justify-center text-center space-y-3">
            <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-full text-slate-300 dark:text-slate-600">
              <SummaryIcon size={40} />
            </div>
            <p className="text-slate-500 dark:text-slate-400 font-medium">لا توجد عمليات مسجلة حالياً</p>
          </div>
        )}
      </div>

      {/* Footer Info */}
      <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/20 rounded-2xl p-4 flex gap-3">
        <div className="text-amber-600 dark:text-amber-500 shrink-0">
          <InfoIcon size={20} />
        </div>
        <p className="text-sm text-amber-800 dark:text-amber-400 leading-relaxed">
          هذه البيانات مستخرجة من النظام المحاسبي وتخضع للمراجعة. في حال وجود أي استفسار يرجى مراجعة إدارة الحسابات.
        </p>
      </div>
    </div>
  );
}
