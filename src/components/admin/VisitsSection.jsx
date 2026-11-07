"use client";

import { useEffect, useState } from "react";
import { Icon } from "@/components/Icons";

// Pages clients and employees use. Admin pages are left out because
// owner and admin visits are not counted.
const PAGES = [
  { path: "/Storagecalculator", label: "الأرضيات" },
  { path: "/Storagecalculator/rates", label: "التعريفة" },
  { path: "/client/balance", label: "رصيد الحساب" },
  { path: "/bank-accounts", label: "الحسابات البنكية" },
  { path: "/employees", label: "الموظفين المتاحين" },
  { path: "/", label: "الحسابات (الرئيسية)" },
];

const DAY_MS = 24 * 60 * 60 * 1000;
const STATUS = {
  active: { label: "نشطة", cls: "bg-emerald-500/15 text-emerald-300 border-emerald-500/25" },
  low: { label: "قليلة", cls: "bg-amber-500/15 text-amber-300 border-amber-500/25" },
  none: { label: "لا توجد زيارات", cls: "bg-rose-500/10 text-rose-300 border-rose-500/20" },
};

const relative = new Intl.RelativeTimeFormat("ar", { numeric: "auto" });
function timeAgo(date) {
  if (!date) return "—";
  const minutes = Math.round((Date.now() - new Date(date).getTime()) / 60000);
  if (minutes < 60) return relative.format(-Math.max(minutes, 1), "minute");
  const hours = Math.round(minutes / 60);
  if (hours < 24) return relative.format(-hours, "hour");
  return relative.format(-Math.round(hours / 24), "day");
}

function statusOf(row) {
  const age = row?.lastVisitedAt ? Date.now() - new Date(row.lastVisitedAt).getTime() : Infinity;
  if (age <= 7 * DAY_MS) return "active";
  if (age <= 30 * DAY_MS) return "low";
  return "none";
}

const num = (n) => Number(n || 0).toLocaleString("ar-EG");

export function PageVisitsSection() {
  const [reloadKey, setReloadKey] = useState(0);
  const [state, setState] = useState({ loading: true, error: "", rows: {} });

  useEffect(() => {
    let cancelled = false;
    fetch("/api/page-visits", { cache: "no-store" })
      .then((res) => res.json())
      .then((data) => {
        if (!data.success) throw new Error(data.error || "تعذر تحميل الزيارات");
        if (!cancelled) setState({ loading: false, error: "", rows: Object.fromEntries(data.pages.map((p) => [p.page, p])) });
      })
      .catch((error) => {
        if (!cancelled) setState({ loading: false, error: error.message, rows: {} });
      });
    return () => { cancelled = true; };
  }, [reloadKey]);

  const reload = () => {
    setState((s) => ({ ...s, loading: true, error: "" }));
    setReloadKey((k) => k + 1);
  };

  return (
    <div className="bg-slate-900 rounded-2xl border border-white/[0.08] overflow-hidden">
      <div className="px-5 py-4 border-b border-white/[0.07] flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-slate-200 m-0">زيارات الصفحات</p>
          <p className="text-[11.5px] text-slate-500 mt-1 mb-0">
            هل الصفحة بتتزار فعلًا؟ زيارات العملاء والموظفين بس، من غير الإدارة.
          </p>
        </div>
        <button type="button" onClick={reload} disabled={state.loading}
          className="inline-flex items-center gap-1.5 text-[12.5px] font-semibold text-slate-300 bg-white/5 border border-white/[0.08] rounded-lg px-3 py-2 cursor-pointer hover:bg-white/10 disabled:opacity-50">
          <Icon.Refresh /> تحديث
        </button>
      </div>

      {state.error ? (
        <div className="p-6 text-center">
          <p className="text-rose-300 text-[13px] mb-3">{state.error}</p>
          <button type="button" onClick={reload} className="text-[12.5px] text-slate-200 bg-white/10 border-none rounded-lg px-4 py-2 cursor-pointer">إعادة المحاولة</button>
        </div>
      ) : (
        <ul className={`m-0 p-0 list-none divide-y divide-white/[0.05] ${state.loading ? "opacity-50" : ""}`}>
          {PAGES.map(({ path, label }) => {
            const row = state.rows[path];
            const status = STATUS[statusOf(row)];
            return (
              <li key={path} className="px-5 py-3.5 grid grid-cols-[1fr_auto] sm:grid-cols-[1.4fr_1fr_1fr_auto] gap-x-4 gap-y-1 items-center">
                <div className="min-w-0">
                  <p className="text-[13.5px] font-semibold text-slate-100 m-0 truncate">{label}</p>
                  <p className="text-[11.5px] text-slate-500 m-0 mt-0.5">آخر زيارة: {timeAgo(row?.lastVisitedAt)}</p>
                </div>
                <p className="hidden sm:block text-[12.5px] text-slate-300 m-0">
                  <span className="text-slate-100 font-bold">{num(row?.users7d)}</span> مستخدم آخر 7 أيام
                </p>
                <p className="hidden sm:block text-[12.5px] text-slate-300 m-0">
                  <span className="text-slate-100 font-bold">{num(row?.users30d)}</span> آخر 30 يوم
                </p>
                <span className={`justify-self-end text-[11.5px] font-bold px-2.5 py-1 rounded-full border whitespace-nowrap ${status.cls}`}>
                  {status.label}
                </span>
                <p className="sm:hidden col-span-2 text-[11.5px] text-slate-400 m-0">
                  {num(row?.users7d)} مستخدم آخر 7 أيام · {num(row?.users30d)} آخر 30 يوم
                </p>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
