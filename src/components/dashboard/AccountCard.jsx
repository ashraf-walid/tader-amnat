"use client";

import React from "react";
import { Check, History } from "lucide-react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export default function AccountCard({
  filteredData,
  pendingChanges,
  updateManualValue,
  commitChanges,
  setSelectedAccount,
  setIsHistoryOpen,
}) {
  return (
    <div className="md:hidden divide-y divide-slate-100 dark:divide-slate-800">
      {filteredData.map((item, idx) => {
        const pending = pendingChanges[item.accountCode] || {};
        const historyAddition = (item.transactions || [])
          .filter((t) => t.type === "addition")
          .reduce((sum, t) => sum + t.amount, 0);
        const historyDeduction = (item.transactions || [])
          .filter((t) => t.type === "deduction")
          .reduce((sum, t) => sum + t.amount, 0);
        const addition = pending.manualAddition || 0;
        const deduction = pending.manualDeduction || 0;
        const baseBalance =
          (item.closingBalance?.debit || 0) -
          (item.closingBalance?.credit || 0);
        const openingBalanceVal =
          (item.openingBalance?.debit || 0) -
          (item.openingBalance?.credit || 0);
        const movementCredit = item.totals?.credit || 0;
        const movementDebit = item.totals?.debit || 0;

        const finalBalance =
          baseBalance +
          historyAddition +
          addition -
          (historyDeduction + deduction);
        const hasChanges = addition > 0 || deduction > 0;
        const transactionCount = (item.transactions || []).length;

        return (
          <div
            key={idx}
            className={cn(
              "p-4 space-y-4",
              hasChanges && "bg-blue-50/20 dark:bg-blue-900/5",
            )}
          >
            <div
              className="flex justify-between items-start"
              onClick={() => {
                setSelectedAccount(item);
                setIsHistoryOpen(true);
              }}
            >
              <div className="space-y-1">
                <h4 className="font-bold text-slate-900 dark:text-white leading-tight">
                  {item.account}
                </h4>
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      navigator.clipboard.writeText(item.accountCode || "");
                    }}
                    className="text-[9px] font-bold px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded border border-slate-200 dark:border-slate-700 cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                    title="انقر لنسخ كود العميل"
                  >
                    {item.accountCode || "---"}
                  </button>
                  <span className="text-[9px] font-bold px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded border border-slate-200 dark:border-slate-700">
                    سابق: {openingBalanceVal.toLocaleString()}
                  </span>
                  <span className="text-[9px] font-bold px-1.5 py-0.5 bg-green-50 dark:bg-green-900/10 text-green-600 rounded border border-green-100 dark:border-green-900/20">
                    إيداع: +{movementDebit.toLocaleString()}
                  </span>
                  <span className="text-[9px] font-bold px-1.5 py-0.5 bg-orange-50 dark:bg-orange-900/10 text-orange-600 rounded border border-orange-100 dark:border-orange-900/20">
                    سحب: -{movementCredit.toLocaleString()}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {transactionCount > 0 && (
                  <span className="bg-blue-100 dark:bg-blue-900/30 text-blue-600 text-[10px] px-1.5 py-0.5 rounded flex items-center gap-1">
                    <History size={10} />
                    {transactionCount}
                  </span>
                )}
                <div
                  className={cn(
                    "px-3 py-1 rounded text-lg font-bold font-mono",
                    finalBalance > 0
                      ? "text-green-600"
                      : "text-red-500",
                  )}
                >
                  {finalBalance.toLocaleString()}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 items-end">
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-blue-600 uppercase">
                  إضافة (+)
                </span>
                <input
                  type="number"
                  placeholder="0"
                  value={pending.manualAddition || ""}
                  onChange={(e) =>
                    updateManualValue(
                      item.accountCode,
                      "manualAddition",
                      e.target.value,
                    )
                  }
                  className="w-full p-2 text-center text-sm font-mono text-blue-600 bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30 rounded-xl focus:outline-none"
                />
              </div>
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-red-600 uppercase">
                  خصم (-)
                </span>
                <input
                  type="number"
                  placeholder="0"
                  value={pending.manualDeduction || ""}
                  onChange={(e) =>
                    updateManualValue(
                      item.accountCode,
                      "manualDeduction",
                      e.target.value,
                    )
                  }
                  className="w-full p-2 text-center text-sm font-mono text-red-600 bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/30 rounded-xl focus:outline-none"
                />
              </div>
            </div>

            {hasChanges && (
              <button
                onClick={() => commitChanges(item.accountCode)}
                className="w-full py-2.5 bg-green-600 text-white rounded-xl font-bold text-sm shadow-lg shadow-green-500/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
              >
                <Check size={16} /> حفظ التعديلات
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}
