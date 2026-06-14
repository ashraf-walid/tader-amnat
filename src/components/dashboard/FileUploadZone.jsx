"use client";

import React from "react";
import { Upload } from "lucide-react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

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
  return (
    <div
      className={cn(
        "relative group h-75 md:h-100 border-2 border-dashed rounded-3xl flex flex-col items-center justify-center transition-all animate-in duration-700 mx-4 md:mx-0",
        isDragging
          ? "border-blue-500 bg-blue-50/50 dark:bg-blue-900/10 scale-[0.99]"
          : "border-slate-200 dark:border-slate-800 hover:border-blue-400",
      )}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
    >
      <div className="p-4 md:p-6 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 mb-4 md:mb-6 group-hover:scale-110 transition-transform">
        <Upload strokeWidth={1.5} className="w-8 h-8 md:w-12 md:h-12" />
      </div>
      <h2 className="text-lg md:text-xl font-semibold mb-2">
        اسحب وأفلت الملف هنا
      </h2>
      <p className="text-xs md:text-base text-slate-500 mb-6 md:mb-8 text-center px-4">
        يدعم ملفات HTML المستخرجة من برنامج الحسابات
      </p>

      <label className="cursor-pointer px-6 md:px-8 py-2 md:py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium shadow-lg shadow-blue-500/25 transition-all active:scale-95">
        اختيار الملف من الجهاز
        <input
          type="file"
          className="hidden"
          accept=".html,.htm,.json"
          onChange={handleFileUpload}
        />
      </label>
    </div>
  );
}
