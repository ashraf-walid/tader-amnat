"use client";

import React from "react";
import { Search, X, History } from "lucide-react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export default function SearchBar({
  search,
  setSearch,
  searchInputRef,
  isEnglishKeyboard,
  setIsEnglishKeyboard,
  isTransactionsOnlyActive,
  setIsTransactionsOnlyActive,
  filteredData,
}) {
  return (
    <div className="p-4 md:p-6 border-b border-slate-100 dark:border-slate-800 flex flex-col gap-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-col">
          <h3 className="font-semibold text-lg whitespace-nowrap text-center md:text-right">
            تفاصيل حسابات العملاء
          </h3>
          <span className="text-xs text-slate-500 font-medium text-center md:text-right">
            إجمالي المعروض: {filteredData.length}
          </span>
        </div>
        <div className="flex flex-wrap items-center justify-center md:justify-end gap-2">
          <button
            onClick={() =>
              setIsTransactionsOnlyActive(!isTransactionsOnlyActive)
            }
            className={cn(
              "flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] md:text-xs font-bold transition-all",
              isTransactionsOnlyActive
                ? "bg-orange-600 text-white shadow-lg shadow-orange-500/30"
                : "bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200",
            )}
          >
            <History size={12} />
            المعاملات
          </button>
        </div>
      </div>

      <div className="relative w-full">
        <Search
          size={18}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
        />
        <input
          ref={searchInputRef}
          type="text"
          lang="ar"
          dir="rtl"
          placeholder="ابحث باسم العميل أو الكود..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => {
            if (e.key.length === 1) {
              setIsEnglishKeyboard(/[a-zA-Z]/.test(e.key));
            }
          }}
          className="w-full pr-10 pl-10 py-3 md:py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all text-sm"
        />
        {search && (
          <button
            onClick={() => {
              setSearch("");
              searchInputRef.current?.focus();
            }}
            className="absolute left-3 top-1/2 -translate-y-1/2 p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X size={14} />
          </button>
        )}
      </div>
      {isEnglishKeyboard && (
        <p className="text-[11px] text-slate-400 mt-1 mr-1">
          حول اللغة
        </p>
      )}
    </div>
  );
}
