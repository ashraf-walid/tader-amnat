"use client";

import React from "react";
import { X, History } from "lucide-react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export default function TransactionModal({
  isOpen, selectedAccount, onClose }) {
  if (!isOpen || !selectedAccount) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800 animate-in zoom-in duration-300">
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 rounded-xl">
              <History size={20} />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white">
                سجل العمليات
              </h3>
              <p className="text-xs text-slate-500">
                {selectedAccount.account}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
          >
            <X size={20} className="text-slate-400" />
          </button>
        </div>

        <div className="p-6 max-h-[400px] overflow-y-auto">
          {!selectedAccount.transactions ||
            selectedAccount.transactions.length === 0 ? (
            <div className="text-center py-8 text-slate-400 text-sm italic">
              لا توجد عمليات مسجلة لهذا الحساب حتى الآن
            </div>
          ) : (
            <div className="space-y-4">
              {[...selectedAccount.transactions].reverse().map((t, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        "w-2 h-2 rounded-full",
                        t.type === "addition"
                          ? "bg-green-500"
                          : "bg-red-500",
                      )}
                    ></div>
                    <div>
                      <p className="text-sm font-bold text-slate-900 dark:text-white">
                        {t.type === "addition"
                          ? "إضافة رصيد"
                          : "تخصيم رصيد"}
                      </p>
                      <p className="text-[10px] text-slate-500">
                        {new Date(t.date).toLocaleString("ar-EG")}
                      </p>
                    </div>
                  </div>
                  <div
                    className={cn(
                      "font-mono font-bold",
                      t.type === "addition"
                        ? "text-green-600"
                        : "text-red-600",
                    )}
                  >
                    {t.type === "addition" ? "+" : "-"}
                    {t.amount.toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="p-6 bg-slate-50 dark:bg-slate-800/30 border-t border-slate-100 dark:border-slate-800">
          <button
            onClick={onClose}
            className="w-full py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl font-bold text-sm hover:bg-slate-50 transition-colors"
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
}
