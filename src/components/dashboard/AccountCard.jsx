"use client";

import React, { useState } from "react";
import { Check, History, Copy } from "lucide-react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { formatLargeNumber, getFullNumberTooltip } from "@/lib/formatUtils";

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
  const [copiedCode, setCopiedCode] = useState(null);

  const handleCopyCode = (e, code) => {
    e.stopPropagation();
    navigator.clipboard.writeText(code || "");
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 1800);
  };

  return (
    <div className="md:hidden divide-y divide-slate-800">
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
              hasChanges && "bg-blue-900/5",
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
                <h4 className="font-bold text-white leading-tight">
                  {item.account}
                </h4>
                <button
                  onClick={(e) => handleCopyCode(e, item.accountCode)}
                  className={cn(
                    "group/btn relative px-2 py-0.5 w-fit text-[10px] font-bold rounded uppercase tracking-wider cursor-pointer transition-all duration-200 flex items-center gap-1",
                    copiedCode === item.accountCode
                      ? "bg-emerald-900/30 text-emerald-400 scale-[1.05]"
                      : "bg-slate-800 text-slate-500 hover:bg-sky-900/20 hover:text-sky-400"
                  )}
                >
                  {copiedCode === item.accountCode ? (
                    <>
                      <Check size={10} className="text-emerald-500" />
                      <span>تم</span>
                    </>
                  ) : (
                    <>
                      <span>{item.accountCode || "---"}</span>
                      <Copy size={9} className="opacity-80 group-hover/btn:opacity-70 transition-opacity duration-150" />
                    </>
                  )}
                </button>
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <span
                    className="text-[9px] font-bold px-1.5 py-0.5 bg-slate-800 text-slate-400 rounded border border-slate-700"
                    title={getFullNumberTooltip(openingBalanceVal)}
                  >
                    سابق: {formatLargeNumber(openingBalanceVal)}
                  </span>
                  <span
                    className="text-[9px] font-bold px-1.5 py-0.5 bg-green-900/10 text-green-500 rounded border border-green-900/20"
                    title={getFullNumberTooltip(movementDebit)}
                  >
                    إيداع: +{formatLargeNumber(movementDebit)}
                  </span>
                  <span
                    className="text-[9px] font-bold px-1.5 py-0.5 bg-orange-900/10 text-orange-500 rounded border border-orange-900/20"
                    title={getFullNumberTooltip(movementCredit)}
                  >
                    سحب: -{formatLargeNumber(movementCredit)}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {transactionCount > 0 && (
                  <span className="bg-blue-900/30 text-blue-400 text-[10px] px-1.5 py-0.5 rounded flex items-center gap-1">
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
                  title={getFullNumberTooltip(finalBalance)}
                >
                  {formatLargeNumber(finalBalance)}
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
                  className="w-full p-2 text-center text-sm font-mono text-blue-400 bg-blue-900/10 border border-blue-900/30 rounded-xl focus:outline-none"
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
                  className="w-full p-2 text-center text-sm font-mono text-red-400 bg-red-900/10 border border-red-900/30 rounded-xl focus:outline-none"
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
