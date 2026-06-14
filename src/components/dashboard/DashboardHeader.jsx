"use client";

import React from "react";
import { RefreshCw, Download } from "lucide-react";
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
  data,
  search,
}) {
  return (
    <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 animate-in">
      <div>
        <h1 className="text-xl sm:text-3xl font-bold bg-clip-text text-transparent bg-linear-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400">
          أمانات | تحليل حسابات العملاء
        </h1>
        {dateRange && (
          <p className="text-slate-600 dark:text-slate-300 font-medium mt-1">
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
            <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">
              {errorStatus
                ? `خطأ في الاتصال: ${errorStatus}`
                : "⚡  تخزين محلى (متزامن)"}
            </p>
          </div>

          {lastUpdated && (
            <span className="text-xs px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded-md text-slate-500 max-sm:hidden">
              آخر تحديث: {lastUpdated}
            </span>
          )}

          {errorStatus && (
            <button
              onClick={() => fetchDataFromMongoDB()}
              className="text-xs p-1 bg-blue-50 text-blue-600 rounded"
            >
              إعادة محاولة
            </button>
          )}
        </div>
      </div>

      {(data.length > 0 || search) && (
        <div className="flex flex-wrap items-center gap-2 md:gap-3">
          <button
            onClick={() => fetchDataFromMongoDB()}
            disabled={loading}
            className={cn(
              "flex-1 md:flex-none px-3 py-2 text-xs md:text-sm font-bold rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 border",
              loading
                ? "bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed"
                : "bg-white dark:bg-slate-900 text-blue-600 border-blue-100 dark:border-blue-900/30 hover:bg-blue-50",
            )}
            title="جلب أحدث البيانات من السيرفر"
          >
            <RefreshCw
              size={14}
              className={cn(loading && "animate-spin")}
            />
            تحديث من السيرفر
          </button>

          <button
            onClick={downloadData}
            className="flex-1 md:flex-none px-3 py-2 text-xs md:text-sm font-bold text-slate-600 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 rounded-xl transition-all shadow-sm flex items-center justify-center gap-2"
          >
            <Download size={14} className="text-blue-500" />
            نسخة احتياطية
          </button>
        </div>
      )}
    </header>
  );
}
