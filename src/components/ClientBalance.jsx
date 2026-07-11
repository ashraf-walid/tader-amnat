'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

import { 
  SummaryIcon, 
  InfoIcon, 
  RefreshIcon,
  NavChartIcon,
  PlusIcon,
  NavMonitorIcon
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
        // العميل ليس لديه كود حساب بعد
        if (result.hasAccountCode === false) {
          setData({ hasAccountCode: false, message: result.message });
        } else {
          setData(result);
        }
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
    const timer = setTimeout(fetchBalance, 0);
    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-slate-400 font-medium">جاري تحميل بيانات الحساب...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-red-950/20 border border-red-900/30 rounded-2xl p-6 flex flex-col items-center text-center space-y-4">
          <div className="w-12 h-12 bg-red-900/20 rounded-full flex items-center justify-center text-red-400">
            <InfoIcon size={24} />
          </div>
          <div className="space-y-1">
            <h3 className="text-red-200 font-bold text-lg">خطأ في جلب البيانات</h3>
            <p className="text-red-400">{error}</p>
          </div>
          <button 
            onClick={fetchBalance}
            className="flex items-center gap-2 px-6 py-2 bg-red-700 text-white rounded-xl hover:bg-red-600 transition-colors font-medium cursor-pointer"
          >
            <RefreshIcon size={18} />
            إعادة المحاولة
          </button>
        </div>
      </div>
    );
  }

  // ─── حالة: لا يوجد كود حساب مرتبط ─────────────────────────────────────────────
  if (data?.hasAccountCode === false) {
    if (data?.isStaff) {
      return (
        <div className="max-w-lg mx-auto p-6 mt-16">
          <div className="bg-blue-950/20 border border-blue-900/30 rounded-2xl p-8 flex flex-col items-center text-center space-y-4">
            <div className="w-16 h-16 bg-blue-900/20 rounded-full flex items-center justify-center text-blue-400">
              <InfoIcon size={32} />
            </div>
            <div className="space-y-2">
              <h3 className="text-blue-300 font-bold text-lg">لوحة تحكم الإدارة</h3>
              <p className="text-blue-400 text-sm leading-relaxed">{data.message}</p>
            </div>
            <Link
              href="/"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-500 transition-colors font-medium text-sm no-underline cursor-pointer"
            >
              الانتقال إلى لوحة التحكم
            </Link>
          </div>
        </div>
      );
    }

    return (
      <div className="max-w-lg mx-auto p-6 mt-16">
        <div className="bg-amber-900/10 border border-amber-800/30 rounded-2xl p-8 flex flex-col items-center text-center space-y-4">
          <div className="w-16 h-16 bg-amber-900/20 rounded-full flex items-center justify-center text-amber-500">
            <InfoIcon size={32} />
          </div>
          <div className="space-y-2">
            <h3 className="text-amber-300 font-bold text-lg">يظهر رصيد الحساب للعملاء الذين تم تسجيل مكتب لهم</h3>
            <p className="text-amber-400 text-sm leading-relaxed">{data.message}</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 w-full justify-center"> 
            <Link 
              href="/Storagecalculator"
              className="flex items-center justify-center gap-2 px-5 py-2.5 bg-amber-600 border border-amber-500/30 text-white rounded-xl hover:bg-amber-500 transition-all font-medium text-sm no-underline cursor-pointer w-full sm:w-auto"
            >
              <NavMonitorIcon size={16} />
               الأرضيات
            </Link>
            <button 
              onClick={fetchBalance}
              className="text-xs flex items-center justify-center gap-2 px-5 py-2.5 bg-slate-800 border border-amber-800/30 text-amber-400 rounded-xl hover:bg-slate-700 transition-colors cursor-pointer w-full sm:w-auto"
            >
              <RefreshIcon size={14} />
              إعادة التحميل
            </button>
          </div>
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
  const finalBalance = adjustedClosingDebit - (closingBalance?.credit || 0);
  const finalBalanceAbs = Math.abs(finalBalance);
  const finalBalanceStatus = finalBalance > 0
    ? {
        label: 'ليك',
        cardClass: 'from-emerald-700 to-emerald-950 border-emerald-500/50',
        amountClass: 'text-emerald-50',
        badgeClass: 'bg-emerald-500/20 text-emerald-50 border-emerald-200/10',
      }
    : finalBalance < 0
      ? {
          label: 'عليك',
          cardClass: 'from-rose-700 to-rose-950 border-rose-500/50',
          amountClass: 'text-rose-50',
          badgeClass: 'bg-rose-500/20 text-rose-50 border-rose-200/10',
        }
      : {
          label: 'متوازن',
          cardClass: 'from-slate-700 to-slate-950 border-slate-500/50',
          amountClass: 'text-slate-50',
          badgeClass: 'bg-white/15 text-slate-50 border-white/10',
        };

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-8 space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-white flex items-center gap-3">
            <div className="p-2 bg-blue-900/30 text-blue-400 rounded-xl">
              <NavChartIcon size={28} />
            </div>
            رصيد الحساب
          </h1>
          <div className="mt-1 space-y-1">
            <p className="text-slate-400 font-medium">
              {accountName}
            </p>
            {dateRange && (
              <p className="text-blue-400 text-sm font-bold">
                {dateRange}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Prominent Closing Balance */}
      <div className={`bg-linear-to-br ${finalBalanceStatus.cardClass} rounded-3xl p-8 md:p-10 shadow-xl border flex flex-col items-center justify-center text-white relative overflow-hidden`}>
        {/* Background Decoration */}
        <div className="absolute -top-10 -right-10 opacity-10 rotate-12 pointer-events-none">
          <NavChartIcon size={180} />
        </div>
        
        <div className="relative z-10 flex flex-col items-center">
          <span className={`${finalBalanceStatus.badgeClass} px-4 py-1.5 rounded-full font-medium text-sm mb-6 backdrop-blur-sm border flex items-center gap-2`}>
            <NavChartIcon size={16} />
            الرصيد النهائي
          </span>
          
          <div className="flex items-baseline justify-center gap-2 w-full">
            <span className={`text-4xl md:text-6xl font-black tracking-tight ${finalBalanceStatus.amountClass}`}>
              {fmt(finalBalanceAbs)}
            </span>
            <span className="text-white/80 text-lg font-medium">{finalBalanceStatus.label}</span>
          </div>
        </div>
      </div>

      {/* Secondary Balance Details */}
      <div className="bg-slate-800/40 rounded-2xl p-2 border border-slate-700/50">
        <details className="group">
          <summary className="flex items-center justify-between cursor-pointer list-none text-slate-300 font-medium text-sm p-4 hover:bg-slate-800/60 rounded-xl transition-colors select-none">
            <div className="flex items-center gap-2">
              <InfoIcon size={18} className="text-blue-500" />
              تفاصيل حركة الحساب والرصيد الافتتاحي
            </div>
            <div className="transition-transform duration-300 group-open:rotate-180 text-slate-400 bg-slate-800 rounded-full p-1 shadow-sm">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
            </div>
          </summary>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2 p-2 pt-4 border-t border-slate-700">
            {/* Opening Balance */}
            <div className="bg-slate-800/80 rounded-xl p-5 shadow-sm border border-slate-700 flex flex-col justify-between hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <span className="text-slate-400 font-bold text-xs">الرصيد الإفتتاحي</span>
                <div className="p-1.5 bg-indigo-900/20 text-indigo-400 rounded-lg">
                  <SummaryIcon size={16} />
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-end">
                  <span className="text-slate-400 text-[11px] font-medium">مدين</span>
                  <span className="text-lg font-black text-slate-200">{fmt(openingBalance.debit)}</span>
                </div>
                <div className="flex justify-between items-end">
                  <span className="text-slate-400 text-[11px] font-medium">دائن</span>
                  <span className="text-sm font-bold text-slate-400">{fmt(openingBalance.credit)}</span>
                </div>
              </div>
            </div>

            {/* Totals (Movement) */}
            <div className="bg-slate-800/80 rounded-xl p-5 shadow-sm border border-slate-700 flex flex-col justify-between hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <span className="text-slate-400 font-bold text-xs">إجمالي الحركة</span>
                <div className="p-1.5 bg-emerald-900/20 text-emerald-400 rounded-lg">
                  <PlusIcon size={16} />
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-end">
                  <span className="text-slate-400 text-[11px] font-medium">إجمالي مدين</span>
                  <span className="text-lg font-black text-emerald-400">{fmt(adjustedTotalsDebit)}</span>
                </div>
                <div className="flex justify-between items-end">
                  <span className="text-slate-400 text-[11px] font-medium">إجمالي دائن</span>
                  <span className="text-sm font-bold text-rose-400">{fmt(adjustedTotalsCredit)}</span>
                </div>
              </div>
            </div>
          </div>
        </details>
      </div>

      {/* Transactions Section */}
      <div className="bg-slate-800 rounded-3xl shadow-sm border border-slate-700 overflow-hidden">
        <div className="p-6 border-b border-slate-700 flex items-center justify-between">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            أحدث العمليات
            <span className="text-xs font-normal text-slate-400 bg-slate-700 px-2 py-0.5 rounded-full">
              {transactions.length} عملية
            </span>
          </h2>
        </div>
        
        {transactions.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-right border-collapse">
              <thead>
                <tr className="bg-slate-900/50 text-slate-400 text-sm font-bold">
                  <th className="px-6 py-4">التاريخ</th>
                  <th className="px-6 py-4">النوع</th>
                  <th className="px-6 py-4 text-left">المبلغ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/50">
                {transactions.map((tx, idx) => (
                  <tr key={idx} className="hover:bg-slate-700/30 transition-colors">
                    <td className="px-6 py-4 text-sm text-slate-300">
                      {tx.date ? format(new Date(tx.date), 'yyyy/MM/dd HH:mm', { locale: ar }) : 'غير محدد'}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${
                        tx.type === 'addition' 
                          ? 'bg-emerald-900/30 text-emerald-400' 
                          : 'bg-rose-900/30 text-rose-400'
                      }`}>
                        {tx.type === 'addition' ? 'إضافة' : 'خصم'}
                      </span>
                    </td>
                    <td className={`px-6 py-4 font-bold text-left ${
                      tx.type === 'addition' ? 'text-emerald-400' : 'text-rose-450'
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
            <div className="p-4 bg-slate-900/50 rounded-full text-slate-600">
              <SummaryIcon size={40} />
            </div>
            <p className="text-slate-400 font-medium">لا توجد عمليات مسجلة حالياً</p>
          </div>
        )}
      </div>

      <button 
          onClick={fetchBalance}
          className="flex items-center justify-center w-full gap-2 px-5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl hover:bg-slate-700 transition-all text-slate-200 font-medium shadow-sm cursor-pointer"
        >
          <RefreshIcon size={18} />
          تحديث البيانات
      </button>

      {/* Footer Info */}
      <div className="bg-amber-900/10 border border-amber-900/20 rounded-2xl p-4 flex items-center justify-center gap-3">
        <div className="text-amber-500 shrink-0">
          <InfoIcon size={20} />
        </div>
        <p className="text-sm text-amber-400 leading-relaxed">
          ملاحظة: يتم تجديد رصيد الحساب يومياً في الساعة 15:00 عصراً
        </p>
      </div>
    </div>
  );
}
