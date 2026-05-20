'use client';

import React, { useState, useMemo } from 'react';
import { 
  Upload, 
  Search, 
  FileText, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Wallet, 
  TrendingUp,
  X,
  Check,
  Filter,
  History
} from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { parseAccountingHTML } from '@/lib/parser';

function cn(...inputs) {
  return twMerge(clsx(inputs));
}

const PRIORITY_CODES = [
  '1714986', '1714994', '17142002', '17142003', '17142005', '17142006', 
  '17142007', '17142008', '17142009', '17142010', '17142011', '17142012', '17142013', 
  '17142015', '17142016', '17142019', '17142020', '17142021', '17142022', '17142023', 
  '17142024', '17142025', '17142026', '17142027', '17142028', '17142029', '17142030', 
  '17142033', '17142034', '17142035', '17142036', '17142037', '17142038', '17142039', 
  '17142040', '17142042', '17142047', '17142048', '17142055', '17142056', '17142059', 
  '17142060', '17142063', '17142067', '17142074', '17142075', '17142076', '17142077', 
  '17142083', '17142084', '17142090', '17142093', '17142094', '17142095', '17142098', 
  '17142099', '17142100', '17142105', '17142108', '17142114', '17142117', '17142118', 
  '17142121', '17142122', '17142123', '17142124', '17142126', '17142127', '17142128', 
  '17142131', '17142135', '17142138', '17142143', '17142144', '17142147', '17142150', 
  '17142151', '17142152', '17142154', '17142158', '17142165', '1714893', '17142167'
];

export default function AccountsDashboard() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [errorStatus, setErrorStatus] = useState(null);
  const [isPriorityActive, setIsPriorityActive] = useState(true);
  const [isTransactionsOnlyActive, setIsTransactionsOnlyActive] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  // Load data on start and poll every 10 seconds
  React.useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    try {
      const res = await fetch('/api/data', { cache: 'no-store' });
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      const result = await res.json();
      
      if (result && Array.isArray(result.data)) {
        setData(result.data);
        setLastUpdated(new Date(result.timestamp).toLocaleTimeString());
        setErrorStatus(null);
      }
    } catch (err) {
      console.error('Error fetching data:', err);
      setErrorStatus(err.message);
    }
  };

  const filteredData = useMemo(() => {
    let filtered = data;
    
    // Apply Priority Code Filter if active
    if (isPriorityActive) {
      filtered = filtered.filter(item => PRIORITY_CODES.includes(item.accountCode));
    }

    // Apply Transactions Only Filter
    if (isTransactionsOnlyActive) {
      filtered = filtered.filter(item => item.transactions && item.transactions.length > 0);
    }

    // Apply Text Search
    if (search) {
      filtered = filtered.filter(item => 
        item.account.toLowerCase().includes(search.toLowerCase()) ||
        item.accountCode.toLowerCase().includes(search.toLowerCase())
      );
    }

    return filtered;
  }, [data, search, isPriorityActive, isTransactionsOnlyActive]);

  const stats = useMemo(() => {
    return data.reduce((acc, curr) => ({
      totalDebit: acc.totalDebit + curr.closingBalance.debit,
      totalCredit: acc.totalCredit + curr.closingBalance.credit,
      count: acc.count + 1
    }), { totalDebit: 0, totalCredit: 0, count: 0 });
  }, [data]);

  const saveDataToServer = async (newData) => {
    try {
      await fetch('/api/data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newData)
      });
    } catch (err) {
      console.error('Error saving data:', err);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    processFile(file);
  };

  const processFile = async (file) => {
    setLoading(true);
    try {
      const results = await parseAccountingHTML(file);
      
      // Preserve existing transactions when uploading a new file
      const mergedResults = results.map(newRecord => {
        const oldRecord = data.find(r => r.accountCode === newRecord.accountCode);
        return {
          ...newRecord,
          transactions: oldRecord?.transactions || []
        };
      });

      setData(mergedResults);
      await saveDataToServer(mergedResults); // Global sync
    } catch (err) {
      alert('حدث خطأ أثناء معالجة الملف. يرجى التأكد من أنه ملف حسابات صحيح.');
    } finally {
      setLoading(false);
    }
  };

  const [pendingChanges, setPendingChanges] = useState({});

  const updateManualValue = (accountCode, field, amount) => {
    setPendingChanges(prev => ({
      ...prev,
      [accountCode]: {
        ...(prev[accountCode] || {}),
        [field]: parseFloat(amount) || 0
      }
    }));
  };

  const commitChanges = async (accountCode) => {
    const changes = pendingChanges[accountCode];
    if (!changes) return;

    const updatedData = data.map(item => {
      if (item.accountCode === accountCode) {
        const newTransactions = [...(item.transactions || [])];
        if (changes.manualAddition > 0) {
          newTransactions.push({ type: 'addition', amount: changes.manualAddition, date: new Date().toISOString() });
        }
        if (changes.manualDeduction > 0) {
          newTransactions.push({ type: 'deduction', amount: changes.manualDeduction, date: new Date().toISOString() });
        }
        return { ...item, transactions: newTransactions };
      }
      return item;
    });

    setData(updatedData);
    setPendingChanges(prev => {
      const next = { ...prev };
      delete next[accountCode];
      return next;
    });
    
    await saveDataToServer(updatedData);
  };

  const clearData = async () => {
    if (window.confirm('هل أنت متأكد من مسح جميع البيانات؟ سيتم حذف كافة السجلات والمعاملات لجميع المستخدمين.')) {
      setData([]);
      await saveDataToServer([]);
    }
  };

  const onDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const onDragLeave = () => setIsDragging(false);

  const onDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-4 md:p-8 dir-rtl" dir="rtl">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header Section */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 animate-in">
          <div>
            <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400">
              أمانات | تحليل حسابات العملاء
            </h1>
            <div className="flex flex-wrap items-center gap-4 mt-2">
               <div className="flex items-center gap-2">
                 <div className={cn("w-2 h-2 rounded-full animate-pulse", errorStatus ? "bg-red-500" : "bg-green-500")}></div>
                 <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">
                   {errorStatus ? `خطأ في الاتصال: ${errorStatus}` : "مزامنة مباشرة عبر الشبكة"}
                 </p>
               </div>
               
               {lastUpdated && (
                 <span className="text-xs px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded-md text-slate-500">
                   آخر تحديث: {lastUpdated}
                 </span>
               )}

               {errorStatus && (
                 <button onClick={fetchData} className="text-xs p-1 bg-blue-50 text-blue-600 rounded">
                   إعادة محاولة
                 </button>
               )}
            </div>
          </div>
          
          {data.length > 0 && (
            <button 
              onClick={clearData}
              className="px-4 py-2 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-full transition-colors flex items-center gap-2"
            >
              <X size={16} />
              مسح البيانات من الجميع
            </button>
          )}
        </header>

        {data.length === 0 ? (
          /* Empty State / Upload Zone */
          <div 
            className={cn(
              "relative group h-[400px] border-2 border-dashed rounded-3xl flex flex-col items-center justify-center transition-all animate-in duration-700",
              isDragging ? "border-blue-500 bg-blue-50/50 dark:bg-blue-900/10 scale-[0.99]" : "border-slate-200 dark:border-slate-800 hover:border-blue-400"
            )}
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onDrop={onDrop}
          >
            <div className="p-6 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 mb-6 group-hover:scale-110 transition-transform">
              <Upload size={48} strokeWidth={1.5} />
            </div>
            <h2 className="text-xl font-semibold mb-2">اسحب وأفلت الملف هنا</h2>
            <p className="text-slate-500 mb-8">يدعم ملفات HTML المستخرجة من نظام المحاسبة</p>
            
            <label className="cursor-pointer px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium shadow-lg shadow-blue-500/25 transition-all active:scale-95">
              اختيار الملف من الجهاز
              <input type="file" className="hidden" accept=".html,.htm" onChange={handleFileUpload} />
            </label>
          </div>
        ) : (
          /* Analysis View */
          <div className="space-y-6 animate-in">
            {/* Stats Grid */}
            {/* <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <StatCard 
                title="إجمالي المدين" 
                value={stats.totalDebit.toLocaleString()} 
                icon={<ArrowUpRight className="text-green-500" />}
                subtitle="أرصدة نهائية"
              />
              <StatCard 
                title="إجمالي الدائن" 
                value={stats.totalCredit.toLocaleString()} 
                icon={<ArrowDownLeft className="text-red-500" />}
                subtitle="أرصدة نهائية"
              />
              <StatCard 
                title="عدد العملاء" 
                value={stats.count} 
                icon={<Wallet className="text-blue-500" />}
                subtitle="حسابات نشطة"
              />
            </div> */}

            {/* List & Search */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
              <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="flex flex-col">
                    <h3 className="font-semibold text-lg whitespace-nowrap">تفاصيل حسابات العملاء</h3>
                    <span className="text-xs text-slate-500 font-medium">
                      إجمالي المعروض: {filteredData.length} من {data.length}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => setIsPriorityActive(!isPriorityActive)}
                      className={cn(
                        "flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold transition-all",
                        isPriorityActive 
                          ? "bg-blue-600 text-white shadow-lg shadow-blue-500/30" 
                          : "bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200"
                      )}
                    >
                      <Filter size={14} />
                      {isPriorityActive ? "المكاتب التي تتعامل معنا بشكل مستمر" : "جميع العملاء"}
                    </button>

                    <button 
                      onClick={() => setIsTransactionsOnlyActive(!isTransactionsOnlyActive)}
                      className={cn(
                        "flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold transition-all",
                        isTransactionsOnlyActive 
                          ? "bg-orange-600 text-white shadow-lg shadow-orange-500/30" 
                          : "bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200"
                      )}
                    >
                      <History size={14} />
                      {isTransactionsOnlyActive ? "المعاملات فقط" : "كل العملاء"}
                    </button>
                  </div>
                </div>
                <div className="relative w-full md:w-96">
                  <Search size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input 
                    type="text"
                    placeholder="ابحث باسم العميل أو الكود..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full pr-10 pl-10 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                  />
                  {search && (
                    <button 
                      onClick={() => setSearch('')}
                      className="absolute left-3 top-1/2 -translate-y-1/2 p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full text-slate-400 hover:text-slate-600 transition-colors"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 text-sm">
                      <th className="px-6 py-4 text-right font-medium">العميل / الحساب</th>
                      <th className="px-6 py-4 text-center font-medium">الرصيد الافتتاحي</th>
                      <th className="px-6 py-4 text-center font-medium">المجاميع</th>
                      <th className="px-6 py-4 text-center font-medium text-blue-600">إضافة مبلغ (+)</th>
                      <th className="px-6 py-4 text-center font-medium text-red-600">تخصيم مبلغ (-)</th>
                      <th className="px-6 py-4 text-center w-4"></th>
                      <th className="px-6 py-4 text-left font-medium">الرصيد النهائي</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {filteredData.map((item, idx) => {
                      const pending = pendingChanges[item.accountCode] || {};
                      
                      // Calculate from history
                      const historyAddition = (item.transactions || [])
                        .filter(t => t.type === 'addition')
                        .reduce((sum, t) => sum + t.amount, 0);
                      
                      const historyDeduction = (item.transactions || [])
                        .filter(t => t.type === 'deduction')
                        .reduce((sum, t) => sum + t.amount, 0);

                      const addition = pending.manualAddition || 0;
                      const deduction = pending.manualDeduction || 0;
                      
                      const baseBalance = item.closingBalance.debit - item.closingBalance.credit;
                      const finalBalance = baseBalance + historyAddition + addition - (historyDeduction + deduction);
                      const hasChanges = addition > 0 || deduction > 0;
                      const transactionCount = (item.transactions || []).length;

                      return (
                        <tr key={idx} className={cn(
                          "hover:bg-slate-50/50 dark:hover:bg-slate-800/30 border-r-4 transition-all",
                          hasChanges ? "border-r-blue-500 bg-blue-50/30 dark:bg-blue-900/5" : "border-r-transparent"
                        )}>
                          <td className="px-6 py-4 max-w-80 cursor-pointer group/cell" onClick={() => {
                            setSelectedAccount(item);
                            setIsHistoryOpen(true);
                          }}>
                            <div className="flex flex-col gap-1 overflow-hidden">
                              <div className="font-semibold text-slate-900 dark:text-white flex items-center gap-2 group-hover/cell:text-blue-600 transition-colors">
                                <span className="truncate whitespace-nowrap" title={item.account}>
                                  {item.account}
                                </span>
                                {transactionCount > 0 && (
                                  <span className="shrink-0 text-[10px] px-1.5 py-0.5 bg-blue-100 dark:bg-blue-900/30 rounded text-blue-600 flex items-center gap-1">
                                    <History size={10} />
                                    {transactionCount}
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="px-2 py-0.5 text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-500 rounded uppercase tracking-wider">
                                  {item.accountCode || '---'}
                                </span>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-center text-sm font-mono whitespace-nowrap">
                            <div className="flex flex-col">
                              <span className="text-green-600">{item.openingBalance.debit.toLocaleString()}</span>
                              <span className="text-red-500">{item.openingBalance.credit.toLocaleString()}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-center text-sm font-mono whitespace-nowrap">
                            <div className="flex flex-col text-xs">
                               <div className="flex justify-between gap-4 text-slate-500">
                                 <span>الأساسي:</span>
                                 <span>{(item.closingBalance.debit - item.closingBalance.credit).toLocaleString()}</span>
                               </div>
                               {(historyAddition > 0 || historyDeduction > 0) && (
                                 <div className="flex justify-between gap-4 text-orange-500 font-medium">
                                   <span>تسويات:</span>
                                   <span>{(historyAddition - historyDeduction).toLocaleString()}</span>
                                 </div>
                               )}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <div className="flex items-center justify-center gap-1 group">
                              <input 
                                type="number"
                                placeholder="0.00"
                                value={pending.manualAddition || ''}
                                onChange={(e) => updateManualValue(item.accountCode, 'manualAddition', e.target.value)}
                                className="w-24 px-2 py-1 text-center text-sm font-mono text-blue-600 bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 no-spinner focus:placeholder:text-transparent"
                              />
                            </div>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <div className="flex items-center justify-center gap-1 group">
                              <input 
                                type="number"
                                placeholder="0.00"
                                value={pending.manualDeduction || ''}
                                onChange={(e) => updateManualValue(item.accountCode, 'manualDeduction', e.target.value)}
                                className="w-24 px-2 py-1 text-center text-sm font-mono text-red-600 bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500/20 no-spinner focus:placeholder:text-transparent"
                              />
                            </div>
                          </td>
                          <td className="w-28">
                            <div className="h-8 flex items-center justify-center">
                              {hasChanges && (
                                <button 
                                  onClick={() => commitChanges(item.accountCode)}
                                  className="px-2 py-1 bg-green-600 hover:bg-green-700 text-white rounded-lg shadow-sm transition-all active:scale-95 animate-in flex items-center gap-1 whitespace-nowrap"
                                >
                                  <Check size={12} />
                                  <span className="text-sm font-bold">حفظ</span>
                                </button>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-left text-sm font-bold font-mono whitespace-nowrap">
                            <div className={cn(
                              "inline-block px-3 py-1 rounded-lg text-lg",
                              finalBalance > 0 ? "bg-green-600 text-white" : "bg-red-600 text-white shadow-lg"
                            )}>
                              {finalBalance.toLocaleString()}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* History Modal */}
      {isHistoryOpen && selectedAccount && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800 animate-in zoom-in duration-300">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 rounded-xl">
                  <History size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white">سجل العمليات</h3>
                  <p className="text-xs text-slate-500">{selectedAccount.account}</p>
                </div>
              </div>
              <button 
                onClick={() => setIsHistoryOpen(false)}
                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
              >
                <X size={20} className="text-slate-400" />
              </button>
            </div>
            
            <div className="p-6 max-h-[400px] overflow-y-auto">
              {!selectedAccount.transactions || selectedAccount.transactions.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-sm italic">
                  لا توجد عمليات مسجلة لهذا الحساب حتى الآن
                </div>
              ) : (
                <div className="space-y-4">
                  {[...selectedAccount.transactions].reverse().map((t, i) => (
                    <div key={i} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "w-2 h-2 rounded-full",
                          t.type === 'addition' ? "bg-green-500" : "bg-red-500"
                        )}></div>
                        <div>
                          <p className="text-sm font-bold text-slate-900 dark:text-white">
                            {t.type === 'addition' ? "إضافة رصيد" : "تخصيم رصيد"}
                          </p>
                          <p className="text-[10px] text-slate-500">
                            {new Date(t.date).toLocaleString('ar-EG')}
                          </p>
                        </div>
                      </div>
                      <div className={cn(
                        "font-mono font-bold",
                        t.type === 'addition' ? "text-green-600" : "text-red-600"
                      )}>
                        {t.type === 'addition' ? "+" : "-"}{t.amount.toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            <div className="p-6 bg-slate-50 dark:bg-slate-800/30 border-t border-slate-100 dark:border-slate-800">
              <button 
                onClick={() => setIsHistoryOpen(false)}
                className="w-full py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl font-bold text-sm hover:bg-slate-50 transition-colors"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}

      <footer className="mt-12 text-center text-slate-400 text-sm">
        نظام أمانات لتحليل البيانات الحسابية &copy; 2026
      </footer>
    </div>
  );
}

function StatCard({ title, value, icon, subtitle }) {
  return (
    <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800">{icon}</div>
        <TrendingUp size={16} className="text-slate-300" />
      </div>
      <div className="text-2xl font-bold mb-1">{value}</div>
      <div className="text-sm font-medium text-slate-900 dark:text-slate-200 mb-1">{title}</div>
      <div className="text-xs text-slate-500 dark:text-slate-400">{subtitle}</div>
    </div>
  );
}
