"use client";

import { useState } from "react";
import { CopyIcon } from "@/components/Icons";

// ─── بيانات الحسابات البنكية ─────────────────────────────────────────────────
const BANK_ACCOUNTS = [
  {
    id: 1,
    bank: "البنك الأهلي المصري",
    account: "4083070470074700013",
    currency: "جنيه مصري",
    accent: "#3b82f6",
  },
  {
    id: 2,
    bank: "بنك مصر",
    account: "2650199000000041",
    currency: "جنيه مصري",
    accent: "#10b981",
  },
  {
    id: 3,
    bank: "بنك قناة السويس — فرع ميناء دمياط",
    account: "3130001010100101",
    currency: "جنيه مصري",
    accent: "#f59e0b",
  },
  {
    id: 4,
    bank: "البنك القطري الوطني الأهلي",
    account: "2031572401836",
    currency: "جنيه مصري",
    accent: "#06b6d4",
  },
  {
    id: 5,
    bank: "البنك العربي الإفريقي الدولي",
    account: "1007219410020201",
    currency: "جنيه مصري",
    accent: "#8b5cf6",
  },
  {
    id: 6,
    bank: "بنك الإسكندرية",
    account: "331002993001",
    currency: "جنيه مصري",
    accent: "#ec4899",
  },
  {
    id: 7,
    bank: "البنك التجاري الدولي (CIB)",
    account: "100005383085",
    currency: "جنيه مصري",
    accent: "#14b8a6",
  },
  {
    id: 8,
    bank: "البنك الأهلي المصري",
    account: "4083070743303600012",
    currency: "جنيه مصري",
    accent: "#3b82f6",
  },
];

// ─── Bank Card Component ─────────────────────────────────────────────────────
function BankCard({ bank, copiedId, copiedField, onCopy }) {
  const isAccountCopied = copiedId === bank.id && copiedField === "account";
  const isBankCopied = copiedId === bank.id && copiedField === "bank";

  return (
    <div
      className="group relative overflow-hidden rounded-2xl border border-white/[0.08] bg-slate-900/70 transition-all duration-200 hover:border-white/[0.18] hover:shadow-[0_8px_32px_rgba(0,0,0,0.35)]"
      style={{
        "--accent": bank.accent,
      }}
    >
      {/* Colored top bar */}
      <div
        className="h-1 w-full opacity-60 group-hover:opacity-100 transition-opacity duration-200"
        style={{ background: `linear-gradient(90deg, transparent 5%, ${bank.accent} 50%, transparent 95%)` }}
      />

      <div className="p-5">
        {/* Bank Header */}
        <div className="flex items-start gap-3 mb-4">
          <div
            className="w-11 h-11 rounded-xl flex items-center justify-center text-lg shrink-0 transition-transform duration-200 group-hover:scale-105"
            style={{
              background: `${bank.accent}18`,
              border: `1.5px solid ${bank.accent}35`,
            }}
          >
            🏦
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-[14px] font-bold text-slate-100 m-0 leading-snug">
              {bank.bank}
            </h3>
            <p className="text-[11.5px] text-slate-500 m-0 mt-1 flex items-center gap-1">
              <span className="inline-block w-1.5 h-1.5 rounded-full" style={{ background: bank.accent }} />
              {bank.currency}
            </p>
          </div>
        </div>

        {/* Account Number Display */}
        <div className="flex items-center gap-2.5 bg-slate-950/80 border border-white/[0.07] rounded-xl px-4 py-3 mb-4 group-hover:border-white/[0.12] transition-colors duration-200">
          <span className="text-[10.5px] text-slate-500 font-semibold uppercase tracking-wider shrink-0">
            رقم الحساب
          </span>
          <span
            className="flex-1 text-[15px] font-extrabold tracking-[0.06em] ltr text-right select-all"
            dir="ltr"
            style={{ color: bank.accent }}
          >
            {bank.account}
          </span>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          {/* Copy Account Number */}
          <button
            onClick={() => onCopy(bank, "account")}
            className={`flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-[12.5px] font-semibold border cursor-pointer transition-all duration-200 active:scale-[0.97]
              ${
                isAccountCopied
                  ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/35 shadow-[0_0_12px_rgba(16,185,129,0.15)]"
                  : "text-slate-300 border-white/10 hover:border-white/25 hover:bg-white/[0.06]"
              }`}
          >
            {isAccountCopied ? (
              <>
                <span className="text-[14px]">✓</span>
                <span>تم نسخ الرقم</span>
              </>
            ) : (
              <>
                <CopyIcon size={14} />
                <span>نسخ رقم الحساب</span>
              </>
            )}
          </button>

          {/* Copy Bank Name */}
          <button
            onClick={() => onCopy(bank, "bank")}
            title="نسخ اسم البنك"
            className={`flex items-center justify-center px-3 py-2.5 rounded-xl text-[12.5px] font-semibold border cursor-pointer transition-all duration-200 active:scale-[0.97]
              ${
                isBankCopied
                  ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/35 shadow-[0_0_12px_rgba(16,185,129,0.15)]"
                  : "text-slate-400 border-white/[0.08] hover:border-white/20 hover:bg-white/[0.05]"
              }`}
          >
            {isBankCopied ? (
              <span className="text-[14px]">✓</span>
            ) : (
              <CopyIcon size={14} />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Client Component ───────────────────────────────────────────────────
export default function BankAccountsClient() {

  const [search, setSearch] = useState("");
  const [copiedId, setCopiedId] = useState(null);
  const [copiedField, setCopiedField] = useState("");

  const copyToClipboard = async (bank, field) => {
    const text = field === "account" ? bank.account : bank.bank;
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // Fallback for non-HTTPS contexts
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.style.cssText = "position:fixed;opacity:0";
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
    }
    setCopiedId(bank.id);
    setCopiedField(field);
    setTimeout(() => {
      setCopiedId(null);
      setCopiedField("");
    }, 2200);
  };

  const filtered = BANK_ACCOUNTS.filter(
    (b) => !search || b.bank.includes(search) || b.account.includes(search)
  );

  return (
    <div className="max-w-[1100px] mx-auto px-4 sm:px-6 py-8">
      {/* Page Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-sky-500 to-indigo-500 flex items-center justify-center shadow-[0_4px_16px_rgba(59,130,246,0.35)] shrink-0">
            <span className="text-xl">🏦</span>
          </div>
          <div>
            <h1 className="text-[22px] font-extrabold text-slate-100 m-0">
              الحسابات البنكية
            </h1>
            <p className="text-[13px] text-slate-400 m-0">
              حسابات الشركة البنكية — اضغط على الرقم أو اسم البنك لنسخه بسهولة
            </p>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative max-w-sm">
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none text-[14px]">
            🔍
          </span>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="ابحث باسم البنك أو رقم الحساب..."
            className="w-full bg-slate-900 border-[1.5px] border-white/10 rounded-xl text-slate-100 text-sm rtl outline-none transition-colors duration-200 py-2.5 pr-9 pl-4 placeholder:text-slate-500 focus:border-sky-500/60 focus:shadow-[0_0_0_3px_rgba(59,130,246,0.1)]"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 bg-transparent border-none cursor-pointer text-xs px-1 transition-colors"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Bank Cards Grid */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 px-4">
          <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center mb-4">
            <span className="text-2xl opacity-50">🏦</span>
          </div>
          <p className="text-base font-semibold text-slate-400 mb-1">
            لا توجد نتائج
          </p>
          <p className="text-sm text-slate-500">
            جرّب البحث بكلمة مختلفة
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((bank) => (
            <BankCard
              key={bank.id}
              bank={bank}
              copiedId={copiedId}
              copiedField={copiedField}
              onCopy={copyToClipboard}
            />
          ))}
        </div>
      )}

      {/* Footer count */}
      {filtered.length > 0 && (
        <p className="mt-6 text-center text-[12px] text-slate-500">
          عرض {filtered.length} من {BANK_ACCOUNTS.length} بنك
        </p>
      )}

      {/* Footer */}
      <footer className="mt-10 text-center text-slate-600 text-[11px]">
        نظام أمانات &copy; {new Date().getFullYear()}
      </footer>
    </div>
  );
}
