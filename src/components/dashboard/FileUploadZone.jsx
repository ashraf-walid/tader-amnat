"use client";

import React from "react";
import { Upload, RefreshCw } from "lucide-react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { useAccountData } from "@/hooks/useAccountData";

function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export default function FileUploadZone({
  isDragging,
  onDragOver,
  onDragLeave,
  onDrop,
  handleFileUpload,
}) {
  const { fetchDataFromMongoDB, loading } = useAccountData();
  return (
    <div
      className={cn(
        "relative group h-75 md:h-100 border-2 border-dashed rounded-3xl flex flex-col items-center justify-center transition-all animate-in duration-700 mx-4 md:mx-0",
        isDragging
          ? "border-blue-500 bg-blue-900/10 scale-[0.99]"
          : "border-slate-800 hover:border-blue-400",
      )}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
    >
      <div className="p-4 md:p-6 rounded-full bg-blue-900/30 text-blue-400 mb-4 md:mb-6 group-hover:scale-110 transition-transform">
        <Upload strokeWidth={1.5} className="w-8 h-8 md:w-12 md:h-12" />
      </div>
      <h2 className="text-lg md:text-xl font-semibold mb-2">
        اسحب وأفلت الملف هنا
      </h2>
      <p className="text-xs md:text-base text-slate-500 mb-6 md:mb-8 text-center px-4">
        يدعم ملفات HTML المستخرجة من برنامج الحسابات
      </p>


      <div className="flex flex-col sm:flex-row gap-3 md:gap-4 items-center justify-center w-1/2">
        <label className="inline-flex items-center justify-center cursor-pointer px-6 md:px-8 py-2 md:py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium shadow-lg shadow-blue-500/25 transition-all active:scale-95 w-full sm:w-auto text-center">
          اختيار الملف من الجهاز
          <input
            type="file"
            className="hidden"
            accept=".html,.htm,.json"
            onChange={handleFileUpload}
          />
        </label>
        <button
          onClick={async () => {
            const success = await fetchDataFromMongoDB();
            if (success) {
              window.location.reload();
            }
          }}
          disabled={loading}
          className={cn(
            "inline-flex items-center justify-center gap-2 cursor-pointer px-6 md:px-8 py-2 md:py-3 rounded-xl font-medium border transition-all active:scale-95 w-full sm:w-auto",
            loading
              ? "bg-slate-800 text-slate-500 border-slate-700 cursor-not-allowed"
              : "bg-slate-900 text-blue-400 border-blue-900/30 hover:bg-slate-800 hover:text-blue-300 shadow-lg shadow-slate-950/20",
          )}
          title="جلب أحدث البيانات من السيرفر"
        >
          <RefreshCw
            size={16}
            className={cn(loading && "animate-spin")}
          />
          تحديث من السيرفر
        </button>
      </div>
    </div>
  );
}
