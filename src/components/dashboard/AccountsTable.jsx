"use client";

import React, { useState } from "react";
import { Check, History, Copy } from "lucide-react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export default function AccountsTable({
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
    <div className="hidden md:block overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="bg-slate-800/50 text-slate-400 text-sm">
            <th className="px-6 py-4 text-right font-medium">
              العميل / الحساب
            </th>
            <th className="px-4 py-4 text-center font-medium">
              الرصيد الإفتتاحي
            </th>
            <th className="px-4 py-4 text-center font-medium text-green-600">
              دائن
            </th>
            <th className="px-4 py-4 text-center font-medium text-orange-600">
              مدين
            </th>
            <th className="px-6 py-4 text-center font-medium text-blue-600">
              إضافة مبلغ (+)
            </th>
            <th className="px-6 py-4 text-center font-medium text-red-600">
              تخصيم مبلغ (-)
            </th>
            <th className="px-6 py-4 text-center w-4"></th>
            <th className="px-6 py-4 text-left font-medium">
              الرصيد النهائي
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-800">
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
              <tr
                key={idx}
                className={cn(
                  "hover:bg-slate-800/30 border-r-4 transition-all",
                  hasChanges
                    ? "border-r-blue-500 bg-blue-900/5"
                    : "border-r-transparent",
                )}
              >
                <td
                  className="px-6 py-4 max-w-80 cursor-pointer group/cell"
                  onClick={() => {
                    setSelectedAccount(item);
                    setIsHistoryOpen(true);
                  }}
                >
                  <div className="flex flex-col gap-1 overflow-hidden">
                    <div className="font-semibold text-white flex items-center gap-2 group-hover/cell:text-blue-400 transition-colors">
                      <span
                        className="truncate whitespace-nowrap"
                        title={item.account}
                      >
                        {item.account}
                      </span>
                      {transactionCount > 0 && (
                        <span className="shrink-0 text-[10px] px-1.5 py-0.5 bg-blue-900/30 rounded text-blue-400 flex items-center gap-1">
                          <History size={10} />
                          {transactionCount}
                        </span>
                      )}
                    </div>
                    <button
                      onClick={(e) => handleCopyCode(e, item.accountCode)}
                      className={cn(
                        "group/btn relative px-2 py-0.5 w-fit text-[10px] font-bold rounded uppercase tracking-wider cursor-pointer transition-all duration-200 flex items-center gap-1",
                        copiedCode === item.accountCode
                          ? "bg-emerald-900/30 text-emerald-400 scale-[1.05]"
                          : "bg-slate-800 text-slate-500 hover:bg-sky-900/20 hover:text-sky-400"
                      )}
                      title="انقر لنسخ كود العميل"
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
                  </div>
                </td>

                <td className="px-4 py-4 text-center font-mono text-sm whitespace-nowrap">
                  <span
                    className={cn(
                      "px-2 py-0.5 rounded",
                      openingBalanceVal > 0
                        ? "text-slate-400"
                        : "text-red-400 bg-red-950/20",
                    )}
                  >
                    {openingBalanceVal.toLocaleString()}
                  </span>
                </td>

                <td className="px-4 py-4 text-center font-mono text-sm whitespace-nowrap">
                  <span
                    className={cn(
                      "px-2 py-0.5 rounded",
                      movementDebit > 0
                        ? "text-green-400 bg-green-900/20"
                        : "text-slate-700",
                    )}
                  >
                    {movementDebit > 0 ? "+" : ""}
                    {movementDebit.toLocaleString()}
                  </span>
                </td>

                <td className="px-4 py-4 text-center font-mono text-sm whitespace-nowrap">
                  <span
                    className={cn(
                      "px-2 py-0.5 rounded",
                      movementCredit > 0
                        ? "text-orange-500 bg-orange-950/20"
                        : "text-slate-700",
                    )}
                  >
                    {movementCredit > 0 ? "-" : ""}
                    {movementCredit.toLocaleString()}
                  </span>
                </td>

                <td className="px-6 py-4 text-center">
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
                    className="w-24 px-2 py-1 text-center text-sm font-mono text-blue-400 bg-blue-900/10 border border-blue-900/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 no-spinner"
                  />
                </td>
                <td className="px-6 py-4 text-center">
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
                    className="w-24 px-2 py-1 text-center text-sm font-mono text-red-400 bg-red-900/10 border border-red-900/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500/20 no-spinner"
                  />
                </td>
                <td className="w-28 text-center">
                  {hasChanges && (
                    <button
                      onClick={() => commitChanges(item.accountCode)}
                      className="px-2 py-1 bg-green-600 text-white rounded-lg shadow-sm flex items-center gap-1 mx-auto text-xs"
                    >
                      <Check size={12} /> حفظ
                    </button>
                  )}
                </td>
                <td className="px-6 py-4 text-left font-bold font-mono whitespace-nowrap">
                  <div
                    className={cn(
                      "inline-block px-3 py-1 rounded-lg text-lg",
                      finalBalance > 0
                        ? "bg-green-600 text-white"
                        : "bg-red-600 text-white shadow-lg",
                    )}
                  >
                    {finalBalance.toLocaleString()}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
