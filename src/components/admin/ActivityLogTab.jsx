"use client";

import { useEffect, useMemo, useState } from "react";
import { Icon } from "@/components/Icons";

const PERIODS = [
  { days: 1, label: "اليوم" },
  { days: 7, label: "7 أيام" },
  { days: 30, label: "30 يوم" },
  { days: 90, label: "90 يوم" },
];

const ROLE_LABELS = { owner: "مالك", admin: "مدير", employee: "موظف", client: "عميل" };
const FIELD_LABELS = {
  username: "اسم المستخدم",
  phone: "الهاتف",
  officeName: "اسم المكتب",
  role: "الدور",
  attempts: "المحاولات",
  accountCode: "كود الحساب",
};
const UPLOAD_SOURCES = {
  "accounting-file": "من ملف المحاسبة",
  "merge-30-06": "بالدمج مع أرصدة 30/06",
  "backup-restore": "من نسخة احتياطية",
};
const NAMES_PREVIEW = 6;

const num = (n) => Number(n || 0).toLocaleString("ar-EG", { maximumFractionDigits: 2 });
const when = (d) =>
  new Date(d).toLocaleString("ar-EG", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
const fieldValue = (field, value) =>
  value === null || value === undefined || value === "" ? "فارغ" : field === "role" ? ROLE_LABELS[value] || value : value;

function describe(log) {
  const d = log.details || {};
  const name = log.target?.name || "";
  switch (log.action) {
    case "account.create":
      return `أضاف حساب ${name} (${ROLE_LABELS[d.role] || d.role || "عميل"})`;
    case "account.delete":
      return `حذف حساب ${name}`;
    case "account.update": {
      const parts = (d.changes || []).map((c) =>
        c.field === "password"
          ? "غيّر كلمة المرور"
          : `${FIELD_LABELS[c.field] || c.field}: ${fieldValue(c.field, c.from)} ← ${fieldValue(c.field, c.to)}`,
      );
      return `عدّل حساب ${name} — ${parts.join("، ")}`;
    }
    case "balance.change": {
      const parts = [];
      const additions = d.additions ?? (d.added || []).filter((t) => t.type === "addition").length;
      const deductions = d.deductions ?? (d.added || []).filter((t) => t.type === "deduction").length;
      const removed = typeof d.removed === "number" ? d.removed : (d.removed || []).length;

      if (additions) parts.push(`${num(additions)} إضافة`);
      if (deductions) parts.push(`${num(deductions)} خصم`);
      if (removed) parts.push(`${num(removed)} حذف`);
      return `عمليات رصيد — ${parts.join(" · ") || "بدون تغيير"}`;
    }
    case "data.upload":
      return `جدّد بيانات الحسابات ${UPLOAD_SOURCES[d.source] || ""} (${num(d.accounts)} حساب)`;
    case "data.clear":
      return `مسح كل البيانات المالية (${num(d.accounts)} حساب)`;
    case "data.deleteTransactions":
      return `مسح عمليات يوم ${d.date} (${num(d.transactions)} عملية على ${num(d.accounts)} عميل)`;
    case "rate.update":
      return `غيّر سعر الصرف من ${d.from ?? "—"} إلى ${d.to}`;
    default:
      return log.action;
  }
}

const isRisky = (action) => ["account.delete", "data.clear", "data.deleteTransactions"].includes(action);

function summarize(logs) {
  const byActor = new Map();
  for (const log of logs) {
    const key = log.actorId || log.actorName;
    if (!byActor.has(key)) {
      byActor.set(key, {
        key,
        name: log.actorName,
        role: log.actorRole,
        lastAt: log.createdAt,
        created: [],
        updated: new Set(),
        additions: 0,
        deductions: 0,
        other: {},
        logs: [],
      });
    }
    const a = byActor.get(key);
    a.logs.push(log);
    if (new Date(log.createdAt) > new Date(a.lastAt)) a.lastAt = log.createdAt;
    if (log.action === "account.create") a.created.push(log.target?.name);
    else if (log.action === "account.update") a.updated.add(log.target?.id || log.target?.name);
    else if (log.action === "balance.change") {
      const additions = log.details?.additions ?? (log.details?.added || []).filter((t) => t.type === "addition").length;
      const deductions = log.details?.deductions ?? (log.details?.added || []).filter((t) => t.type === "deduction").length;
      a.additions += additions;
      a.deductions += deductions;
    } else a.other[log.action] = (a.other[log.action] || 0) + 1;
  }
  return [...byActor.values()].sort((x, y) => new Date(y.lastAt) - new Date(x.lastAt));
}

// Actions outside the three main counters, shown as small badges
const OTHER_LABELS = {
  "account.delete": "حذف حساب",
  "data.upload": "تجديد بيانات الحسابات",
  "data.clear": "مسح كل البيانات",
  "data.deleteTransactions": "مسح عمليات يوم",
  "rate.update": "تغيير سعر الصرف",
};

function Stat({ value, label, accent }) {
  return (
    <div className={`min-w-0 rounded-xl border px-2.5 py-2.5 ${value ? "border-white/[0.08] bg-white/[0.03]" : "border-white/[0.04] bg-transparent"}`}>
      <p className={`text-xl font-extrabold leading-none ${value ? accent : "text-slate-600"}`}>{num(value)}</p>
      <p className="text-[11px] text-slate-400 mt-1.5 leading-tight">{label}</p>
    </div>
  );
}

function ActorCard({ actor }) {
  const [open, setOpen] = useState(false);
  const [showAllNames, setShowAllNames] = useState(false);
  const names = showAllNames ? actor.created : actor.created.slice(0, NAMES_PREVIEW);
  const hiddenNames = actor.created.length - NAMES_PREVIEW;

  return (
    <div className="bg-slate-900 rounded-2xl border border-white/[0.08] overflow-hidden">
      <div className="p-4 sm:p-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-sky-500/15 text-sky-300 font-bold flex items-center justify-center shrink-0">
            {actor.name?.charAt(0)?.toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[15px] font-bold text-slate-100 truncate">
              {actor.name}
              <span className="mr-2 text-[11px] font-semibold text-slate-400 bg-white/5 px-2 py-0.5 rounded-full">
                {ROLE_LABELS[actor.role] || actor.role}
              </span>
            </p>
            <p className="text-[11.5px] text-slate-500 mt-0.5">آخر نشاط: {when(actor.lastAt)}</p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <Stat value={actor.created.length} label="حساب أضافه" accent="text-emerald-400" />
          <Stat value={actor.additions + actor.deductions} label="عملية رصيد نفّذها" accent="text-sky-400" />
          <Stat value={actor.updated.size} label="حساب عدّله" accent="text-amber-400" />
        </div>

        {Object.keys(actor.other).length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-3">
            {Object.entries(actor.other).map(([action, count]) => (
              <span key={action}
                className={`text-[11.5px] font-semibold px-2 py-0.5 rounded-md border ${isRisky(action) ? "text-rose-300 bg-rose-500/10 border-rose-500/20" : "text-slate-300 bg-white/5 border-white/[0.08]"}`}>
                {OTHER_LABELS[action] || action} × {num(count)}
              </span>
            ))}
          </div>
        )}

        {(actor.additions > 0 || actor.deductions > 0) && (
          <p className="text-[12px] text-slate-400 mt-3">
            عمليات الرصيد: <span className="text-emerald-400 font-semibold">{num(actor.additions)} إضافة</span>
            {" · "}
            <span className="text-rose-400 font-semibold">{num(actor.deductions)} خصم</span>
          </p>
        )}

        {actor.created.length > 0 && (
          <div className="mt-3">
            <p className="text-[11.5px] text-slate-500 mb-1.5">الحسابات المضافة:</p>
            <div className="flex flex-wrap gap-1.5">
              {names.map((n, i) => (
                <span key={`${n}-${i}`} className="text-[12px] text-slate-200 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-md">
                  {n}
                </span>
              ))}
              {!showAllNames && hiddenNames > 0 && (
                <button type="button" onClick={() => setShowAllNames(true)}
                  className="text-[12px] text-sky-400 bg-transparent border-none cursor-pointer px-1">
                  و{num(hiddenNames)} آخرين
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      <button type="button" onClick={() => setOpen((o) => !o)} aria-expanded={open}
        className="w-full flex items-center justify-between px-5 py-3 border-t border-white/[0.06] bg-white/[0.02] text-[12.5px] font-semibold text-slate-300 cursor-pointer hover:bg-white/[0.05] border-x-0 border-b-0">
        <span>كل العمليات ({num(actor.logs.length)})</span>
        <span className={`transition-transform ${open ? "rotate-180" : ""}`}><Icon.ChevronDown /></span>
      </button>

      {open && (
        <ul className="divide-y divide-white/[0.05] max-h-[420px] overflow-y-auto m-0 p-0 list-none">
          {actor.logs.map((log) => (
            <li key={log.id} className="px-5 py-3 flex gap-3 items-start">
              <span className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${isRisky(log.action) ? "bg-rose-400" : "bg-sky-400"}`} />
              <div className="min-w-0">
                <p className="text-[13px] text-slate-200 leading-relaxed break-words">{describe(log)}</p>
                <p className="text-[11px] text-slate-500 mt-0.5">{when(log.createdAt)}</p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default function ActivityLogTab() {
  const [days, setDays] = useState(7);
  const [search, setSearch] = useState("");
  const [reloadKey, setReloadKey] = useState(0);
  const [state, setState] = useState({ loading: true, error: "", logs: [], truncated: false });

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/activity-log?days=${days}`, { cache: "no-store" })
      .then((res) => res.json())
      .then((data) => {
        if (!data.success) throw new Error(data.error || "تعذر تحميل السجل");
        if (!cancelled) setState({ loading: false, error: "", logs: data.logs, truncated: data.truncated });
      })
      .catch((error) => {
        if (!cancelled) setState({ loading: false, error: error.message, logs: [], truncated: false });
      });
    // A slower answer for an older period must not replace a newer one
    return () => { cancelled = true; };
  }, [days, reloadKey]);

  const reload = () => {
    setState((s) => ({ ...s, loading: true, error: "" }));
    setReloadKey((k) => k + 1);
  };
  const changePeriod = (value) => {
    if (value === days) return;
    setState((s) => ({ ...s, loading: true, error: "" }));
    setDays(value);
  };

  const actors = useMemo(() => {
    const term = search.trim().toLowerCase();
    return summarize(state.logs).filter((a) => !term || a.name?.toLowerCase().includes(term));
  }, [state.logs, search]);

  return (
    <div className="flex flex-col gap-4">
      <div className="bg-slate-900 rounded-2xl border border-white/[0.08] p-4 sm:p-5">
        <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
          <div>
            <h2 className="text-[17px] font-bold text-slate-100 m-0">سجل الأحداث</h2>
            <p className="text-[12.5px] text-slate-400 mt-1 mb-0">مين أضاف أو عدّل حسابات، ومين نفّذ عمليات خصم وإضافة على العملاء.</p>
          </div>
          <button type="button" onClick={reload} disabled={state.loading}
            className="inline-flex items-center gap-1.5 text-[12.5px] font-semibold text-slate-300 bg-white/5 border border-white/[0.08] rounded-lg px-3 py-2 cursor-pointer hover:bg-white/10 disabled:opacity-50">
            <Icon.Refresh /> تحديث
          </button>
        </div>

        <div className="flex flex-col sm:flex-row gap-2.5">
          <div className="flex gap-1.5 overflow-x-auto" role="group" aria-label="الفترة">
            {PERIODS.map((p) => (
              <button key={p.days} type="button" onClick={() => changePeriod(p.days)} aria-pressed={days === p.days}
                className={`shrink-0 px-3.5 py-2 text-[12.5px] font-semibold rounded-lg border cursor-pointer transition-colors
                  ${days === p.days ? "bg-sky-500 text-white border-sky-400" : "bg-white/[0.04] text-slate-400 border-white/[0.07] hover:text-slate-200"}`}>
                {p.label}
              </button>
            ))}
          </div>
          <input type="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="بحث باسم المستخدم..."
            className="flex-1 min-w-0 bg-slate-950/60 border border-white/[0.08] rounded-lg px-3 py-2 text-[13px] text-slate-100 placeholder:text-slate-500 outline-none focus:border-sky-500/60" />
        </div>
      </div>

      {state.loading ? (
        <div className="text-center text-slate-400 text-[13px] py-12">جاري تحميل السجل...</div>
      ) : state.error ? (
        <div className="bg-rose-950/20 border border-rose-900/30 rounded-2xl p-6 text-center">
          <p className="text-rose-300 text-[13px] mb-3">{state.error}</p>
          <button type="button" onClick={reload} className="text-[12.5px] text-slate-200 bg-white/10 border-none rounded-lg px-4 py-2 cursor-pointer">إعادة المحاولة</button>
        </div>
      ) : actors.length === 0 ? (
        <div className="bg-slate-900 rounded-2xl border border-white/[0.08] p-10 text-center">
          <p className="text-slate-300 text-[14px] font-semibold mb-1">{search ? "لا يوجد مستخدم بهذا الاسم" : "لا توجد أحداث في هذه الفترة"}</p>
          <p className="text-slate-500 text-[12.5px] m-0">السجل يبدأ من يوم تفعيله، والعمليات الأقدم غير مسجلة.</p>
        </div>
      ) : (
        <>
          {state.truncated && (
            <p className="text-[12px] text-amber-400 bg-amber-900/10 border border-amber-900/20 rounded-xl px-4 py-2.5 m-0">
              الفترة فيها عمليات كتير، والمعروض أحدث 3000 عملية بس. اختار فترة أقصر عشان تشوف الكل.
            </p>
          )}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">
            {actors.map((actor) => <ActorCard key={actor.key} actor={actor} />)}
          </div>
        </>
      )}
    </div>
  );
}
