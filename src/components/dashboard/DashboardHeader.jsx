"use client";

import React from "react";
import { RefreshCw, Download, Upload } from "lucide-react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export default function DashboardHeader({
  dateRange,
  errorStatus,
  lastUpdated,
  loading,
  fetchDataFromMongoDB,
  downloadData,
  handleFileUpload,
  handleFileUploadWithMerge,
  data,
  search,
}) {
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

      {(data.length > 0 || search) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 md:gap-3">
          <button
            onClick={() => fetchDataFromMongoDB()}
            disabled={loading}
            className={cn(
              "px-3 py-2.5 sm:py-2 text-sm md:text-sm font-bold rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 border",
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
            استبدال الحسابات بالملف الجديد
            <input
              type="file"
              className="hidden"
              accept=".html,.htm,.json"
              onChange={handleFileUpload}
              disabled={loading}
            />
          </label>

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

          <button
            onClick={downloadData}
            className="px-3 py-2.5 sm:py-2 text-sm md:text-sm font-bold text-slate-300 bg-slate-900 border border-slate-800 hover:bg-slate-800 rounded-xl transition-all shadow-sm flex items-center justify-center gap-2"
          >
            <Download size={14} className="text-blue-400" />
            نسخة احتياطية
          </button>
        </div>
      )}
    </header>
  );
}


// import { convertHTMLToBaseBalances } from '@/lib/convertToBaseBalances';


// async function convertHTML(file) {
//   if (!file) return;
  
//   try {
//     await convertHTMLToBaseBalances(file);
//     // يمكنك إضافة رسالة نجاح هنا
//     console.log('تم تحويل الملف بنجاح');
//   } catch (error) {
//     console.error('خطأ أثناء التحويل:', error);
//   }
// }

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