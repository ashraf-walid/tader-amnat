"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { saveNavisInvoices, getNavisData, clearNavisData } from "@/lib/navisDB";

// ─── Helpers ──────────────────────────────────────────────────────────────────
function fmt(val) {
  if (val === null || val === undefined || val === "") return "—";
  return val;
}

function fmtNum(val) {
  if (val === null || val === undefined || val === "") return "—";
  const n = parseFloat(val);
  if (isNaN(n)) return val;
  return n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function fmtDate(val) {
  if (!val || val === "") return "—";
  return val;
}

function elapsed(isoStr) {
  if (!isoStr) return "";
  const diff = Date.now() - new Date(isoStr).getTime();
  const mins  = Math.floor(diff / 60000);
  const hours = Math.floor(mins / 60);
  const days  = Math.floor(hours / 24);
  if (days > 0)  return `منذ ${days} يوم`;
  if (hours > 0) return `منذ ${hours} ساعة`;
  if (mins > 0)  return `منذ ${mins} دقيقة`;
  return "الآن";
}

function StatusBadge({ status }) {
  const isDraft = status?.toLowerCase() === "draft";
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold whitespace-nowrap
      ${isDraft
        ? "bg-amber-400/15 text-amber-300 border border-amber-400/30"
        : "bg-emerald-400/15 text-emerald-300 border border-emerald-400/30"
      }`}>
      {isDraft ? "مسودة" : "نهائية"}
    </span>
  );
}

function PaidBadge({ val }) {
  const isPaid = val === "true" || val === "1" || val?.toLowerCase() === "true";
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold
      ${isPaid
        ? "bg-emerald-400/15 text-emerald-300 border border-emerald-400/30"
        : "bg-slate-400/10 text-slate-400 border border-white/10"
      }`}>
      {isPaid ? "مدفوعة" : "غير مدفوعة"}
    </span>
  );
}

const PAGE_SIZE = 100;

// ─── Detail Panel ──────────────────────────────────────────────────────────────
function DetailPanel({ inv, onClose }) {
  const fields = [
    ["رقم المسودة",         inv["Draft Nbr"]],
    ["رقم نهائي",           inv["Final Nbr"]],
    ["الحالة",              inv["Status"]],
    ["كود الدافع",          inv["Payee"]],
    ["اسم الدافع",          inv["Payee Name"]],
    ["العميل (Contract)",   inv["Contract Customer"]],
    ["اسم العميل",          inv["Contract Customer Name"]],
    ["نوع الفاتورة",        inv["Invoice Type"]],
    ["العملة",              inv["Currency"]],
    ["إجمالي الرسوم",       inv["Total Charges"]],
    ["الضرائب",             inv["Taxes"]],
    ["الخصومات",            inv["Credits"]],
    ["المدفوع",             inv["Paid"]],
    ["المتبقي",             inv["Owed"]],
    ["مدفوعة بالكامل",      inv["PaidInFull"]],
    ["سعر الصرف",           inv["Exchange Rate"]],
    ["إجمالي الفاتورة",     inv["Invoice Total"]],
    ["كود الخصم",           inv["Debit Code"]],
    ["بوليصة الشحن",        inv["Key Word 2"]],
    ["الخط الملاحي",        inv["Key Word 3"]],
    ["كلمة مفتاحية 1",      inv["Key Word 1"]],
    ["ATA السفينة",         inv["Vessel ATA"]],
    ["اسم السفينة",         inv["Vessel Name"]],
    ["تاريخ الختم",         inv["Final_Date"]],
    ["أمر العمل",           inv["Work Order"]],
    ["رقم الأمانة",         inv["رقم الامانة"]],
    ["المستخدم (ختم)",      inv["Final_User"]],
    ["تاريخ السريان",       inv["Effective Date"]],
    ["تاريخ الاستحقاق",     inv["Due Date"]],
    ["ملاحظات",             inv["Notes"]],
  ];

  return (
    <div className="fixed inset-0 z-[1000] bg-black/70 backdrop-blur-[6px] flex items-end sm:items-center justify-center p-0 sm:p-4"
      onClick={onClose}>
      <div
        className="bg-slate-900 border border-white/10 rounded-t-2xl sm:rounded-2xl w-full sm:max-w-[600px] max-h-[85vh] overflow-y-auto shadow-[0_24px_60px_rgba(0,0,0,0.6)] animate-slide-up"
        onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="sticky top-0 bg-slate-900 border-b border-white/[0.08] px-5 py-4 flex items-center justify-between gap-3 z-10">
          <div>
            <p className="text-xs text-slate-400 m-0">تفاصيل الفاتورة</p>
            <h3 className="text-base font-bold text-slate-100 m-0">
              {inv["Final Nbr"] || inv["Draft Nbr"] || "—"}
            </h3>
          </div>
          <button onClick={onClose}
            className="bg-white/[0.06] border border-white/10 rounded-lg p-2 cursor-pointer text-slate-400 hover:text-white hover:bg-white/[0.12] transition-all">
            ✕
          </button>
        </div>
        {/* Body */}
        <div className="px-5 py-4 flex flex-col divide-y divide-white/[0.06]">
          {fields.map(([label, val]) => (
            val !== undefined && val !== null && val !== "" ? (
              <div key={label} className="flex items-start justify-between gap-4 py-2.5">
                <span className="text-[12px] text-slate-500 shrink-0 min-w-[130px]">{label}</span>
                <span className="text-[13px] text-slate-200 font-medium text-left break-all"
                  dir={/^[A-Za-z0-9\s\-\/.,]+$/.test(val) ? "ltr" : "rtl"}>
                  {val || "—"}
                </span>
              </div>
            ) : null
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────
export default function NavisInvoices() {
  const [invoices,   setInvoices]   = useState([]);
  const [fetchedAt,  setFetchedAt]  = useState(null);
  const [totalCount, setTotalCount] = useState(0);
  const [loading,    setLoading]    = useState(true);   // loading from IndexedDB
  const [fetching,   setFetching]   = useState(false);  // fetching from Navis
  const [fetchPhase, setFetchPhase] = useState("");      // phase text
  const [error,      setError]      = useState(null);
  const [search,     setSearch]     = useState("");
  const [statusFilter,   setStatusFilter]   = useState("all");
  const [typeFilter,     setTypeFilter]     = useState("all");
  const [lineFilter,     setLineFilter]     = useState("all");
  const [page,           setPage]           = useState(1);
  const [selected,       setSelected]       = useState(null);
  const [showConfirm,    setShowConfirm]    = useState(false);
  const [fetchSuccess,   setFetchSuccess]   = useState(null); // null | true | false

  const fetchTimer = useRef(null);

  // ── Load from IndexedDB on mount ──
  useEffect(() => {
    (async () => {
      try {
        const data = await getNavisData();
        if (data) {
          setInvoices(data.invoices);
          setFetchedAt(data.fetchedAt);
          setTotalCount(data.count);
        }
      } catch (e) {
        console.error("navisDB load error:", e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // ── Derived filter options ──
  const statusOptions = useMemo(() => {
    const s = new Set(invoices.map(i => i["Status"]).filter(Boolean));
    return [...s].sort();
  }, [invoices]);

  const typeOptions = useMemo(() => {
    const s = new Set(invoices.map(i => i["Invoice Type"]).filter(Boolean));
    return [...s].sort();
  }, [invoices]);

  const lineOptions = useMemo(() => {
    const s = new Set(invoices.map(i => i["Key Word 3"]).filter(Boolean));
    return [...s].sort();
  }, [invoices]);

  // ── Filtered + searched invoices ──
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return invoices.filter(inv => {
      if (statusFilter !== "all" && inv["Status"] !== statusFilter) return false;
      if (typeFilter   !== "all" && inv["Invoice Type"] !== typeFilter)   return false;
      if (lineFilter   !== "all" && inv["Key Word 3"]   !== lineFilter)   return false;
      if (!q) return true;
      return (
        inv["Draft Nbr"]?.toLowerCase().includes(q)        ||
        inv["Final Nbr"]?.toLowerCase().includes(q)        ||
        inv["Payee Name"]?.toLowerCase().includes(q)       ||
        inv["Contract Customer Name"]?.toLowerCase().includes(q) ||
        inv["Key Word 2"]?.toLowerCase().includes(q)       ||
        inv["Key Word 3"]?.toLowerCase().includes(q)       ||
        inv["Vessel Name"]?.toLowerCase().includes(q)      ||
        inv["Payee"]?.toLowerCase().includes(q)
      );
    });
  }, [invoices, search, statusFilter, typeFilter, lineFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated  = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // reset page when filters change
  useEffect(() => { setPage(1); }, [search, statusFilter, typeFilter, lineFilter]);

  // ── Fetch from Navis ──
  const doFetch = useCallback(async () => {
    setFetching(true);
    setError(null);
    setFetchSuccess(null);
    setFetchPhase("جاري الاتصال بـ Navis...");

    // Animated phase messages
    const phases = [
      [3000,  "جاري تحميل البيانات..."],
      [15000, "البيانات كثيرة، يرجى الانتظار..."],
      [35000, "لا تزال البيانات تُحمّل..."],
      [60000, "اقترب الانتهاء..."],
    ];
    const timers = phases.map(([ms, msg]) =>
      setTimeout(() => setFetchPhase(msg), ms)
    );

    try {
      const res = await fetch("/api/navis", { cache: "no-store" });
      timers.forEach(clearTimeout);

      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data.error || "فشل جلب البيانات من Navis");
        setFetchSuccess(false);
        return;
      }

      setFetchPhase("جاري حفظ البيانات...");
      await saveNavisInvoices(data.invoices, data.fetchedAt, data.columns);

      setInvoices(data.invoices);
      setFetchedAt(data.fetchedAt);
      setTotalCount(data.count);
      setFetchSuccess(true);
      setSearch("");
      setStatusFilter("all");
      setTypeFilter("all");
      setLineFilter("all");
      setPage(1);
    } catch (e) {
      timers.forEach(clearTimeout);
      setError(e.message || "خطأ في الاتصال");
      setFetchSuccess(false);
    } finally {
      setFetching(false);
      setFetchPhase("");
    }
  }, []);

  const handleFetchClick = () => {
    if (invoices.length > 0) {
      setShowConfirm(true);
    } else {
      doFetch();
    }
  };

  const handleConfirmRefresh = () => {
    setShowConfirm(false);
    doFetch();
  };

  // ── Clear local data ──
  const handleClear = async () => {
    await clearNavisData();
    setInvoices([]);
    setFetchedAt(null);
    setTotalCount(0);
    setSearch("");
    setPage(1);
    setFetchSuccess(null);
    setError(null);
  };

  // ─── Columns config ───────────────────────────────────────────────────────
  const TABLE_COLS = [
    { key: "Draft Nbr",             label: "مسودة",     cls: "min-w-[80px]" },
    { key: "Final Nbr",             label: "نهائي",     cls: "min-w-[90px]" },
    { key: "Status",                label: "الحالة",    cls: "min-w-[80px]", render: (v) => <StatusBadge status={v} /> },
    { key: "Payee Name",            label: "اسم الدافع",   cls: "min-w-[160px] max-w-[200px]" },
    { key: "Invoice Type",          label: "نوع الفاتورة", cls: "min-w-[120px] max-w-[150px]" },
    { key: "Currency",              label: "عملة",      cls: "min-w-[55px]" },
    { key: "Total Charges",         label: "إجمالي الرسوم",cls: "min-w-[110px] text-right ltr", render: fmtNum },
    { key: "Owed",                  label: "المتبقي",   cls: "min-w-[100px] text-right ltr", render: fmtNum },
    { key: "PaidInFull",            label: "مدفوعة",    cls: "min-w-[80px]", render: (v) => <PaidBadge val={v} /> },
    { key: "Key Word 2",            label: "بوليصة",    cls: "min-w-[110px] max-w-[150px]" },
    { key: "Key Word 3",            label: "خط ملاحي",  cls: "min-w-[80px] max-w-[120px]" },
    { key: "Vessel Name",           label: "السفينة",   cls: "min-w-[120px] max-w-[160px]" },
    { key: "Final_Date",            label: "تاريخ الختم", cls: "min-w-[100px]", render: fmtDate },
  ];

  // ── Render: Loading skeleton ──
  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-slate-400 gap-3">
        <svg className="animate-spin w-6 h-6 text-sky-400" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
        </svg>
        <span className="text-sm">جاري تحميل البيانات المحفوظة...</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 rtl">

      {/* ─── Header Card ─────────────────────────────────────────────────── */}
      <div className="bg-slate-900 rounded-2xl border border-white/[0.08] p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          {/* Title & Meta */}
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-sky-500/15 flex items-center justify-center shrink-0 text-sky-400">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
                <line x1="16" y1="13" x2="8" y2="13"/>
                <line x1="16" y1="17" x2="8" y2="17"/>
                <polyline points="10 9 9 9 8 9"/>
              </svg>
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100 m-0">فواتير Navis N4</h2>
              <p className="text-xs text-slate-500 mt-0.5 m-0">
                بيانات محفوظة محلياً — تُجلب يدوياً من نظام Navis
              </p>
              {fetchedAt && (
                <div className="flex items-center gap-2 mt-1.5">
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-[11.5px] text-slate-400">
                    آخر تحديث: {new Date(fetchedAt).toLocaleString("ar-EG", {
                      year: "numeric", month: "short", day: "numeric",
                      hour: "2-digit", minute: "2-digit"
                    })} — {elapsed(fetchedAt)}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-2 items-center">
            {invoices.length > 0 && (
              <button onClick={handleClear}
                className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-white/[0.05] border border-white/10 text-slate-400 hover:text-red-400 hover:border-red-400/30 hover:bg-red-400/[0.08] transition-all cursor-pointer">
                مسح المحفوظ
              </button>
            )}
            <button onClick={handleFetchClick} disabled={fetching}
              className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg transition-all cursor-pointer border-none
                ${fetching
                  ? "bg-sky-600/60 text-sky-200 cursor-not-allowed"
                  : "bg-sky-500 text-white shadow-[0_4px_14px_rgba(14,165,233,0.35)] hover:bg-sky-600 active:scale-[0.97]"
                }`}>
              {fetching ? (
                <>
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                  </svg>
                  {fetchPhase || "جاري الجلب..."}
                </>
              ) : (
                <>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <polyline points="23 4 23 10 17 10"/>
                    <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
                  </svg>
                  {invoices.length > 0 ? "تحديث البيانات" : "جلب من Navis"}
                </>
              )}
            </button>
          </div>
        </div>

        {/* Fetch progress bar */}
        {fetching && (
          <div className="mt-4">
            <div className="h-1 bg-white/[0.06] rounded-full overflow-hidden">
              <div className="h-full bg-sky-500 rounded-full animate-pulse" style={{ width: "100%" }} />
            </div>
            <p className="text-[11px] text-slate-500 mt-1.5">{fetchPhase}</p>
          </div>
        )}

        {/* Success / Error banner */}
        {fetchSuccess === true && !fetching && (
          <div className="mt-3 bg-emerald-400/[0.08] border border-emerald-400/20 rounded-xl px-4 py-2.5 flex items-center gap-2 text-emerald-300 text-[12.5px]">
            <span>✓</span>
            <span>تم جلب البيانات بنجاح — {totalCount.toLocaleString("ar-EG")} فاتورة محفوظة</span>
          </div>
        )}
        {error && !fetching && (
          <div className="mt-3 bg-red-400/[0.08] border border-red-400/20 rounded-xl px-4 py-2.5 text-red-300 text-[12.5px]">
            ⚠️ {error}
          </div>
        )}
      </div>

      {/* ─── Stats Row ───────────────────────────────────────────────────── */}
      {invoices.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "إجمالي الفواتير",   value: invoices.length.toLocaleString("ar-EG"),   color: "#38bdf8" },
            { label: "نتائج البحث",        value: filtered.length.toLocaleString("ar-EG"),   color: "#a78bfa" },
            { label: "فواتير نهائية",      value: invoices.filter(i => i["Status"]?.toLowerCase() === "final").length.toLocaleString("ar-EG"), color: "#34d399" },
            { label: "مسودات",            value: invoices.filter(i => i["Status"]?.toLowerCase() === "draft").length.toLocaleString("ar-EG"), color: "#fbbf24" },
          ].map((s, i) => (
            <div key={i} className="bg-slate-900 rounded-xl border border-white/[0.07] px-4 py-3">
              <p className="text-[10.5px] text-slate-500 m-0 mb-1">{s.label}</p>
              <p className="text-xl font-extrabold m-0" style={{ color: s.color }}>{s.value}</p>
            </div>
          ))}
        </div>
      )}

      {/* ─── Empty State ─────────────────────────────────────────────────── */}
      {!loading && invoices.length === 0 && !fetching && (
        <div className="bg-slate-900 rounded-2xl border border-white/[0.07] p-12 text-center">
          <div className="w-16 h-16 rounded-2xl bg-sky-500/[0.08] flex items-center justify-center mx-auto mb-4 text-sky-400">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
              <line x1="16" y1="13" x2="8" y2="13"/>
              <line x1="16" y1="17" x2="8" y2="17"/>
            </svg>
          </div>
          <h3 className="text-base font-bold text-slate-200 m-0 mb-2">لا توجد بيانات محفوظة</h3>
          <p className="text-sm text-slate-500 m-0 mb-6">
            اضغط «جلب من Navis» لجلب فواتير النظام وحفظها محلياً
          </p>
          <button onClick={handleFetchClick}
            className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold rounded-xl bg-sky-500 text-white border-none cursor-pointer hover:bg-sky-600 shadow-[0_4px_14px_rgba(14,165,233,0.3)] transition-all">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points="23 4 23 10 17 10"/>
              <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
            </svg>
            جلب من Navis
          </button>
        </div>
      )}

      {/* ─── Search & Filters ─────────────────────────────────────────────── */}
      {invoices.length > 0 && (
        <div className="bg-slate-900 rounded-2xl border border-white/[0.08] px-5 py-4 flex flex-col gap-3">
          {/* Search */}
          <div className="relative">
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
            </span>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="بحث برقم الفاتورة، اسم العميل، البوليصة، الخط الملاحي، السفينة..."
              className="w-full bg-slate-950 border border-white/[0.1] rounded-xl text-slate-100 text-sm rtl outline-none py-2.5 pr-9 pl-3 placeholder:text-slate-600 focus:border-sky-500/50 transition-colors"
            />
            {search && (
              <button onClick={() => setSearch("")}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white cursor-pointer bg-transparent border-none p-0">
                ✕
              </button>
            )}
          </div>

          {/* Filter dropdowns */}
          <div className="flex flex-wrap gap-2">
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-slate-950 border border-white/[0.1] rounded-lg text-sm text-slate-300 rtl outline-none py-2 px-3 cursor-pointer flex-1 min-w-[120px] focus:border-sky-500/50 transition-colors">
              <option value="all">كل الحالات</option>
              {statusOptions.map(s => <option key={s} value={s}>{s === "Draft" ? "مسودة" : s === "Final" ? "نهائية" : s}</option>)}
            </select>

            <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}
              className="bg-slate-950 border border-white/[0.1] rounded-lg text-sm text-slate-300 rtl outline-none py-2 px-3 cursor-pointer flex-1 min-w-[120px] focus:border-sky-500/50 transition-colors">
              <option value="all">كل الأنواع</option>
              {typeOptions.map(t => <option key={t} value={t}>{t}</option>)}
            </select>

            <select value={lineFilter} onChange={(e) => setLineFilter(e.target.value)}
              className="bg-slate-950 border border-white/[0.1] rounded-lg text-sm text-slate-300 rtl outline-none py-2 px-3 cursor-pointer flex-1 min-w-[140px] focus:border-sky-500/50 transition-colors">
              <option value="all">كل الخطوط الملاحية</option>
              {lineOptions.map(l => <option key={l} value={l}>{l}</option>)}
            </select>

            {(search || statusFilter !== "all" || typeFilter !== "all" || lineFilter !== "all") && (
              <button onClick={() => { setSearch(""); setStatusFilter("all"); setTypeFilter("all"); setLineFilter("all"); }}
                className="px-3 py-2 text-xs font-semibold rounded-lg bg-white/[0.04] border border-white/10 text-slate-400 hover:text-white cursor-pointer transition-all whitespace-nowrap">
                مسح الفلاتر
              </button>
            )}
          </div>

          {/* Results summary */}
          <p className="text-[11.5px] text-slate-500 m-0">
            عرض {((page - 1) * PAGE_SIZE + 1).toLocaleString("ar-EG")} – {Math.min(page * PAGE_SIZE, filtered.length).toLocaleString("ar-EG")} من {filtered.length.toLocaleString("ar-EG")} نتيجة
          </p>
        </div>
      )}

      {/* ─── Table ───────────────────────────────────────────────────────── */}
      {invoices.length > 0 && (
        <div className="bg-slate-900 rounded-2xl border border-white/[0.08] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse ltr min-w-[1000px]">
              <thead>
                <tr className="bg-white/[0.03] border-b border-white/[0.07]">
                  <th className="px-3 py-3 text-right text-[11px] font-bold text-slate-500 w-10">#</th>
                  {TABLE_COLS.map(col => (
                    <th key={col.key}
                      className={`px-3 py-3 text-right text-[11px] font-bold text-slate-400 whitespace-nowrap ${col.cls || ""}`}>
                      {col.label}
                    </th>
                  ))}
                  <th className="px-3 py-3 text-right text-[11px] font-bold text-slate-500 w-14">تفاصيل</th>
                </tr>
              </thead>
              <tbody>
                {paginated.length === 0 ? (
                  <tr>
                    <td colSpan={TABLE_COLS.length + 2} className="text-center py-16 text-slate-500 text-sm">
                      لا توجد نتائج مطابقة
                    </td>
                  </tr>
                ) : paginated.map((inv, idx) => (
                  <tr key={idx}
                    className={`border-b border-white/[0.04] transition-colors duration-100 hover:bg-sky-500/[0.05]
                      ${idx % 2 === 1 ? "bg-white/[0.015]" : ""}`}>
                    <td className="px-3 py-2.5 text-[11px] text-slate-600 text-right">
                      {((page - 1) * PAGE_SIZE + idx + 1).toLocaleString("ar-EG")}
                    </td>
                    {TABLE_COLS.map(col => (
                      <td key={col.key}
                        className={`px-3 py-2.5 text-[12.5px] text-slate-300 ${col.cls || ""}`}>
                        {col.render
                          ? col.render(inv[col.key])
                          : <span className="block truncate max-w-[180px]" title={inv[col.key]}>{fmt(inv[col.key])}</span>
                        }
                      </td>
                    ))}
                    <td className="px-3 py-2.5 text-right">
                      <button onClick={() => setSelected(inv)}
                        className="px-2.5 py-1 text-[11px] font-semibold rounded-md bg-white/[0.05] border border-white/10 text-slate-400 hover:text-sky-300 hover:border-sky-500/40 hover:bg-sky-500/[0.08] cursor-pointer transition-all whitespace-nowrap">
                        عرض
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-5 py-3.5 border-t border-white/[0.07] flex items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-1.5">
                <button onClick={() => setPage(1)} disabled={page === 1}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold bg-white/[0.04] border border-white/10 text-slate-400 disabled:opacity-30 hover:bg-white/[0.1] transition-all cursor-pointer disabled:cursor-not-allowed">
                  «
                </button>
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold bg-white/[0.04] border border-white/10 text-slate-400 disabled:opacity-30 hover:bg-white/[0.1] transition-all cursor-pointer disabled:cursor-not-allowed">
                  ‹
                </button>

                {/* Page numbers */}
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let p;
                  if (totalPages <= 5) p = i + 1;
                  else if (page <= 3) p = i + 1;
                  else if (page >= totalPages - 2) p = totalPages - 4 + i;
                  else p = page - 2 + i;
                  return (
                    <button key={p} onClick={() => setPage(p)}
                      className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold border transition-all cursor-pointer
                        ${page === p
                          ? "bg-sky-500 border-sky-500 text-white shadow-[0_2px_8px_rgba(14,165,233,0.35)]"
                          : "bg-white/[0.04] border-white/10 text-slate-400 hover:bg-white/[0.1]"
                        }`}>
                      {p}
                    </button>
                  );
                })}

                <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold bg-white/[0.04] border border-white/10 text-slate-400 disabled:opacity-30 hover:bg-white/[0.1] transition-all cursor-pointer disabled:cursor-not-allowed">
                  ›
                </button>
                <button onClick={() => setPage(totalPages)} disabled={page === totalPages}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold bg-white/[0.04] border border-white/10 text-slate-400 disabled:opacity-30 hover:bg-white/[0.1] transition-all cursor-pointer disabled:cursor-not-allowed">
                  »
                </button>
              </div>
              <span className="text-[11.5px] text-slate-500">
                صفحة {page.toLocaleString("ar-EG")} من {totalPages.toLocaleString("ar-EG")}
              </span>
            </div>
          )}
        </div>
      )}

      {/* ─── Refresh Confirm Dialog ───────────────────────────────────────── */}
      {showConfirm && (
        <div className="fixed inset-0 z-[1001] bg-black/70 backdrop-blur-[6px] flex items-center justify-center p-4"
          onClick={() => setShowConfirm(false)}>
          <div className="bg-slate-900 border border-white/10 rounded-2xl p-6 w-full max-w-[400px] shadow-[0_24px_60px_rgba(0,0,0,0.6)]"
            onClick={(e) => e.stopPropagation()}>
            <div className="w-12 h-12 rounded-xl bg-amber-400/[0.1] flex items-center justify-center mb-4 text-amber-400">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                <line x1="12" y1="9" x2="12" y2="13"/>
                <line x1="12" y1="17" x2="12.01" y2="17"/>
              </svg>
            </div>
            <h3 className="text-base font-bold text-slate-100 m-0 mb-2">تأكيد تحديث البيانات</h3>
            <p className="text-sm text-slate-400 m-0 mb-5">
              سيتم <strong className="text-amber-300">حذف البيانات المحفوظة حالياً</strong> ({totalCount.toLocaleString("ar-EG")} فاتورة) واستبدالها بالبيانات الجديدة من Navis — فقط في حال نجاح الجلب.
            </p>
            <div className="flex gap-2.5 justify-end">
              <button onClick={() => setShowConfirm(false)}
                className="px-4 py-2 text-sm font-semibold rounded-lg bg-white/[0.06] border border-white/10 text-slate-300 cursor-pointer hover:bg-white/[0.12] transition-all">
                إلغاء
              </button>
              <button onClick={handleConfirmRefresh}
                className="px-4 py-2 text-sm font-semibold rounded-lg bg-sky-500 text-white border-none cursor-pointer hover:bg-sky-600 shadow-[0_4px_12px_rgba(14,165,233,0.3)] transition-all">
                تأكيد التحديث
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Detail Panel ─────────────────────────────────────────────────── */}
      {selected && <DetailPanel inv={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}

