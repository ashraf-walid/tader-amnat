"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { RefreshCw, Upload, Trash2, CalendarX, X, AlertTriangle } from "lucide-react";
import { clearAllData } from "@/lib/localDB";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import ArabicDatePicker from "@/components/ArabicDatePicker";

function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export default function DashboardHeader({
  dateRange,
  errorStatus,
  lastUpdated,
  loading,
  fetchDataFromMongoDB,
  handleFileUpload,
  handleFileUploadWithMerge,
  allAccounts,
  search,
}) {
  const [clearing, setClearing] = useState(false);
  const [isDeleteDateModalOpen, setIsDeleteDateModalOpen] = useState(false);
  const [selectedTargetDate, setSelectedTargetDate] = useState(null);
  const [isDeletingDate, setIsDeletingDate] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // دالة حذف المعاملات بتاريخ محدد
  const handleDeleteByDate = async (e) => {
    e.preventDefault();
    if (!selectedTargetDate) {
      alert("⚠️ يرجى اختيار التاريخ أولاً.");
      return;
    }

    // تحويل Date إلى صيغة YYYY-MM-DD
    const dateStr = selectedTargetDate.toLocaleDateString("en-CA"); // en-CA → YYYY-MM-DD

    const confirmDelete = window.confirm(
      `⚠️ تأكيد حذف المعاملات\n\n` +
      `هل أنت متأكد من حذف جميع المعاملات (الإضافات والخصومات) بتاريخ:\n` +
      `📅 ${dateStr}\n\n` +
      `سيتم إعادة حساب مجاميع وأرصدة الحسابات تلقائياً. لا يمكن التراجع عن هذا الإجراء.`
    );

    if (!confirmDelete) return;

    setIsDeletingDate(true);
    try {
      const response = await fetch("/api/data/delete-transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetDate: dateStr }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || "فشلت عملية الحذف");
      }

      if (result.totalDeletedTransactions === 0) {
        alert(`ℹ️ لم يتم العثور على أي معاملات مسجلة في تاريخ ${dateStr}.`);
      } else {
        const additions = (result.totalDeletedAmount?.additions || 0).toLocaleString("ar-EG");
        const deductions = (result.totalDeletedAmount?.deductions || 0).toLocaleString("ar-EG");
        alert(
          `✅ تم مسح المعاملات بنجاح!\n\n` +
          `📊 إجمالي المعاملات المحذوفة: ${result.totalDeletedTransactions}\n` +
          `👥 عدد الحسابات المتأثرة: ${result.affectedAccountsCount}\n` +
          `➕ إجمالي الإضافات المحذوفة: ${additions}\n` +
          `➖ إجمالي الخصومات المحذوفة: ${deductions}`
        );

        setIsDeleteDateModalOpen(false);
        // جلب البيانات المحدثة وإعادة تحميل الصفحة
        await fetchDataFromMongoDB();
        window.location.reload();
      }
    } catch (err) {
      console.error("Error deleting transactions by date:", err);
      alert(`❌ حدث خطأ: ${err.message}`);
    } finally {
      setIsDeletingDate(false);
    }
  };

  // دالة حذف قاعدة البيانات المحلية
  const handleClearDB = async () => {
    const firstConfirm = window.confirm(
      "🗑️ حذف قاعدة البيانات المحلية\n\n" +
      "سيتم حذف جميع البيانات المخزنة محلياً بما فيها:\n" +
      "• جميع حسابات العملاء\n" +
      "• جميع المعاملات والأرصدة\n" +
      "• بيانات المزامنة\n\n" +
      "هل أنت متأكد من المتابعة؟"
    );
    if (!firstConfirm) return;

    const secondConfirm = window.confirm(
      "⚠️ تأكيد نهائي\n\n" +
      "لا يمكن التراجع عن هذه العملية.\n" +
      "اضغط موافق للحذف النهائي."
    );
    if (!secondConfirm) return;

    setClearing(true);
    try {
      const success = await clearAllData();
      if (success) {
        alert("✅ تم مسح قاعدة البيانات المحلية بنجاح.");
        window.location.reload();
      } else {
        alert("❌ حدث خطأ أثناء الحذف. حاول مرة أخرى.");
      }
    } catch (err) {
      console.error(err);
      alert("❌ حدث خطأ غير متوقع.");
    } finally {
      setClearing(false);
    }
  };

  // دالة للتعامل مع رفع الملف مع التحذير
  const handleMergeWithWarning = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const confirmed = window.confirm(
      "⚠️ تحذير: عملية الدمج ستؤدي إلى:\n\n" +
      "1️⃣ دمج الأرصدة المالية (30/06 + الملف الجديد)\n" +
      "2️⃣ حذف جميع المعاملات اليدوية القديمة (الإضافات والخصومات)\n" +
      "3️⃣ البدء من جديد مع الأرصدة المدمجة فقط\n\n" +
      "هل تريد المتابعة؟"
    );

    if (confirmed) {
      handleFileUploadWithMerge(e);
    } else {
      // إعادة تعيين الإدخال
      e.target.value = '';
    }
  };

  return (
    <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 animate-in">
      <div>
        <h1 className="text-xl sm:text-3xl font-bold bg-clip-text text-transparent bg-linear-to-r from-blue-400 to-indigo-400">
          أمانات | تحليل حسابات العملاء
        </h1>
        {dateRange && (
          <p className="text-slate-300 font-medium mt-1">
            {dateRange}
          </p>
        )}
        <div className="flex flex-wrap items-center gap-4 mt-2">
          <div className="flex items-center gap-2 max-sm:hidden">
            <div
              className={cn(
                "w-2 h-2 rounded-full animate-pulse",
                errorStatus ? "bg-red-500" : "bg-green-500",
              )}
            ></div>
            <p className="text-slate-400 text-sm font-medium">
              {errorStatus
                ? `خطأ في الاتصال: ${errorStatus}`
                : "⚡  تخزين محلى (متزامن)"}
            </p>
          </div>

          {lastUpdated && (
            <span className="text-xs px-2 py-1 bg-slate-800 rounded-md text-slate-500 max-sm:hidden">
              آخر تحديث: {lastUpdated}
            </span>
          )}

          {errorStatus && (
            <button
              onClick={() => fetchDataFromMongoDB()}
              className="text-xs p-1 bg-blue-900/30 text-blue-400 rounded"
            >
              إعادة محاولة
            </button>
          )}
        </div>
      </div>

      {(allAccounts.length > 0 || search) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
          <button
            onClick={() => fetchDataFromMongoDB()}
            disabled={loading}
            className={cn(
              "px-3 py-2.5 sm:py-3 text-xs font-bold rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 border",
              loading
                ? "bg-slate-800 text-slate-500 border-slate-700 cursor-not-allowed"
                : "bg-slate-900 text-blue-400 border-blue-900/30 hover:bg-slate-800",
            )}
            title="جلب أحدث البيانات من السيرفر"
          >
            <RefreshCw
              size={14}
              className={cn(loading && "animate-spin")}
            />
            تحديث من السيرفر
          </button>

          <label
            className={cn(
              "px-3 py-2.5 sm:py-2 text-xs font-bold rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 border cursor-pointer",
              loading
                ? "bg-slate-800 text-slate-500 border-slate-700 cursor-not-allowed"
                : "bg-slate-900 text-amber-400 border-amber-900/30 hover:bg-slate-800",
            )}
            title="استبدال الحسابات الحالية بملف جديد"
          >
            <Upload size={14} />
            استبدال بالملف الجديد
            <input
              type="file"
              className="hidden"
              accept=".html,.htm,.json"
              onChange={handleFileUpload}
              disabled={loading}
            />
          </label>

          <button
            onClick={() => setIsDeleteDateModalOpen(true)}
            disabled={loading || clearing || isDeletingDate}
            className={cn(
              "px-3 py-2.5 sm:py-2 text-xs font-bold rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 border",
              loading || clearing || isDeletingDate
                ? "bg-slate-800 text-slate-500 border-slate-700 cursor-not-allowed"
                : "bg-slate-900 text-rose-400 border-rose-900/30 hover:bg-slate-800 hover:text-rose-300",
            )}
            title="حذف جميع المعاملات بتاريخ محدد"
          >
            <CalendarX size={14} />
            حذف معاملات تاريخ
          </button>

          <button
            onClick={handleClearDB}
            disabled={clearing || loading}
            className={cn(
              "px-3 py-2.5 sm:py-2 text-xs font-bold rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 border",
              clearing || loading
                ? "bg-slate-800 text-slate-500 border-slate-700 cursor-not-allowed"
                : "bg-slate-900 text-red-400 border-red-900/30 hover:bg-red-950/40",
            )}
            title="مسح جميع البيانات من قاعدة البيانات المحلية"
          >
            <Trash2 size={14} className={cn(clearing && "animate-pulse")} />
            {clearing ? "جارٍ الحذف..." : "حذف البيانات المحليه"}
          </button>
        </div>
      )}

      {/* ─── saved for future use ───────────────────────────────────────────────────────────────── */}
      {/* <label>
        <Upload size={14} />
        الجديد
        <input
          type="file"
          className="hidden"
          accept=".html,.htm,.json"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) {
              convertHTML(file);

              e.target.value = '';
            }
          }}
        />
      </label> */}

      {/* <label
        className={cn(
          "px-3 py-2.5 sm:py-2 text-xs font-bold rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 border cursor-pointer",
          loading
            ? "bg-slate-800 text-slate-500 border-slate-700 cursor-not-allowed"
            : "bg-slate-900 text-emerald-400 border-emerald-900/30 hover:bg-slate-800",
        )}
        title="دمج ملف HTML جديد مع أرصدة 30/06 (⚠️ سيتم حذف المعاملات اليدوية القديمة)"
      >
        <Upload size={14} />
        دمج مع أرصدة 30/06
        <input
          type="file"
          className="hidden"
          accept=".html,.htm"
          onChange={handleMergeWithWarning}
          disabled={loading}
        />
      </label> */}
      {/* ──────────────────────────────────────────────────────────────────────────── */}

      {/* Delete Transactions by Date Modal */}
      {mounted && isDeleteDateModalOpen && createPortal(
        <div dir='rtl' className="fixed inset-0 z-[999999] flex items-center justify-center bg-slate-950/80 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 w-full max-w-md shadow-2xl relative">
            <button
              onClick={() => !isDeletingDate && setIsDeleteDateModalOpen(false)}
              className="absolute top-4 left-4 p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
              disabled={isDeletingDate}
            >
              <X size={18} />
            </button>

            <div className="flex items-center gap-3 text-rose-400 mb-4">
              <div className="p-3 bg-rose-950/40 border border-rose-900/30 rounded-2xl">
                <CalendarX size={24} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">
                  حذف المعاملات بتاريخ محدد
                </h3>
                <p className="text-xs text-slate-400">
                  إزالة العمليات اليدوية وإعادة حساب الأرصدة
                </p>
              </div>
            </div>

            <form onSubmit={handleDeleteByDate} className="space-y-4">
              <div style={{ "--acc": "#fb7185", "--inp": "#0f172a", "--brd": "rgba(251,113,133,0.25)", "--txt": "#f1f5f9", "--muted": "#64748b" }}>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  اختر التاريخ المطلوب حذفه:
                </label>
                <ArabicDatePicker
                  id="delete-target-date"
                  selected={selectedTargetDate}
                  onChange={(date) => setSelectedTargetDate(date)}
                  placeholderText="يوم / شهر / سنة"
                />
              </div>

              <div className="bg-rose-950/20 border border-rose-900/30 rounded-xl p-3 flex gap-2.5 text-xs text-rose-300">
                <AlertTriangle size={16} className="shrink-0 mt-0.5" />
                <p>
                  تحذير: سيتم حذف كافة الإضافات والخصومات المسجلة في هذا التاريخ من السيرفر، وإعادة احتساب أرصدة الحسابات تلقائياً.
                </p>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={isDeletingDate || !selectedTargetDate}
                  className={cn(
                    "flex-1 py-3 px-4 rounded-xl font-bold text-white transition-all shadow-lg flex items-center justify-center gap-2",
                    isDeletingDate || !selectedTargetDate
                      ? "bg-slate-800 text-slate-500 cursor-not-allowed"
                      : "bg-rose-600 hover:bg-rose-700 shadow-rose-900/30 active:scale-95 cursor-pointer"
                  )}
                >
                  <Trash2 size={16} className={cn(isDeletingDate && "animate-spin")} />
                  {isDeletingDate ? "جارٍ الحذف..." : "تأكيد ومسح المعاملات"}
                </button>
                <button
                  type="button"
                  onClick={() => setIsDeleteDateModalOpen(false)}
                  disabled={isDeletingDate}
                  className="py-3 px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium rounded-xl transition-colors cursor-pointer"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
    </header>
  );
}



