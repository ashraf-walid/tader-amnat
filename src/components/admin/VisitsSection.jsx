import { useState, useMemo } from "react";
import { Icon } from "@/components/Icons";

// ─── Spinner ──────────────────────────────────────────────────────────────────
function Spinner({ size = 18 }) {
  return (
    <div
      className="rounded-full border-2 border-white/20 border-t-white animate-spin shrink-0"
      style={{ width: size, height: size }}
    />
  );
}

function Section({ icon: IconComp, title, subtitle, children, action }) {
  return (
    <div className="bg-slate-900 rounded-2xl border border-white/[0.08] overflow-hidden">
      <div className="px-5 py-4 border-b border-white/[0.07] flex flex-wrap gap-2.5 items-center">
        <div className="flex-1 min-w-[140px]">
          <div className="flex items-center gap-2">
            {IconComp && (
              <span className="text-sky-400 shrink-0">
                <IconComp />
              </span>
            )}
            <p className="text-sm font-semibold text-slate-300 m-0">{title}</p>
          </div>
          {subtitle && (
            <p className="text-[11px] text-slate-500 m-0 mt-0.5">{subtitle}</p>
          )}
        </div>
        {action}
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

const PAGE_VISITS_CACHE_KEY = "admin_page_visits_cache";

export function PageVisitsSection() {
  const [visits, setVisits] = useState(() => {
    // Load from localStorage on first render
    try {
      const cached = localStorage.getItem(PAGE_VISITS_CACHE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached);
        return parsed.data || [];
      }
    } catch { /* ignore */ }
    return [];
  });
  const [cachedAt, setCachedAt] = useState(() => {
    try {
      const cached = localStorage.getItem(PAGE_VISITS_CACHE_KEY);
      return cached ? JSON.parse(cached).cachedAt : null;
    } catch { return null; }
  });
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState(""); // "up-to-date" | "updated" | "error"
  const [sortBy, setSortBy] = useState("visitCount");
  const [sortDir, setSortDir] = useState("desc");

  const sortedVisits = useMemo(() => {
    const data = [...visits];

    data.sort((a, b) => {
      let valueA;
      let valueB;

      switch (sortBy) {
        case "page":
          valueA = a.page;
          valueB = b.page;
          break;

        case "user":
          valueA = a.username || a.userId?.username || "guest";
          valueB = b.username || b.userId?.username || "guest";
          break;

        case "visitCount":
          valueA = a.visitCount;
          valueB = b.visitCount;
          break;

        case "lastVisitedAt":
          valueA = new Date(a.lastVisitedAt).getTime();
          valueB = new Date(b.lastVisitedAt).getTime();
          break;

        default:
          return 0;
      }

      if (typeof valueA === "number") {
        return sortDir === "asc"
          ? valueA - valueB
          : valueB - valueA;
      }

      return sortDir === "asc"
        ? String(valueA).localeCompare(String(valueB))
        : String(valueB).localeCompare(String(valueA));
    });

    return data;
  }, [visits, sortBy, sortDir]);

  const handleSort = (key) => {
    if (sortBy === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortBy(key); setSortDir("desc"); }
  };

  const COLUMNS = [
    { key: "page", label: "الصفحة" },
    { key: "user", label: "المستخدم" },
    { key: "visitCount", label: "عدد الزيارات" },
    { key: "lastVisitedAt", label: "آخر زيارة" },
  ];

  const handleRefresh = async () => {
    setLoading(true);
    setStatus("");
    try {
      // Step 1: Lightweight check — ask DB for latest updatedAt
      const checkRes = await fetch("/api/page-visits?check=latest");
      const checkData = await checkRes.json();
      if (!checkData.success) {
        setStatus("error");
        return;
      }
      const dbLatest = checkData.latestUpdatedAt
        ? new Date(checkData.latestUpdatedAt).getTime()
        : null;
      // Compare with what's stored in localStorage
      let cachedLatest = null;
      try {
        const cached = localStorage.getItem(PAGE_VISITS_CACHE_KEY);
        if (cached) cachedLatest = JSON.parse(cached).latestUpdatedAt ?? null;
      } catch { /* ignore */ }
      // Step 2: Only fetch full data if DB has newer records
      if (dbLatest && dbLatest === cachedLatest) {
        setStatus("up-to-date");
        return;
      }
      // Step 3: Fetch complete data
      const fullRes = await fetch("/api/page-visits");
      const fullData = await fullRes.json();
      if (!fullData.success) {
        setStatus("error");
        return;
      }
      const now = Date.now();
      const payload = {
        data: fullData.data,
        cachedAt: now,
        latestUpdatedAt: dbLatest,
      };
      localStorage.setItem(PAGE_VISITS_CACHE_KEY, JSON.stringify(payload));
      setVisits(fullData.data);
      setCachedAt(now);
      setStatus("updated");
    } catch {
      setStatus("error");
    } finally {
      setLoading(false);
    }
  };
  // Group visits by page for summary
  const pageGroups = visits.reduce((acc, v) => {
    const key = v.page || "/";
    if (!acc[key]) acc[key] = { page: key, totalVisits: 0, uniqueUsers: 0, lastVisit: null };
    acc[key].totalVisits += v.visitCount || 0;
    acc[key].uniqueUsers += 1;
    if (!acc[key].lastVisit || new Date(v.lastVisitedAt) > new Date(acc[key].lastVisit)) {
      acc[key].lastVisit = v.lastVisitedAt;
    }
    return acc;
  }, {});
  const pageList = Object.values(pageGroups).sort((a, b) => b.totalVisits - a.totalVisits);
  const totalVisits = visits.reduce((s, v) => s + (v.visitCount || 0), 0);
  const uniquePages = pageList.length;

  return (
    <Section
      icon={Icon.Chart}
      title="تحليلات زيارات الصفحات"
      subtitle="بيانات الزيارات محفوظة محليًا — يُجلب من قاعدة البيانات فقط عند وجود بيانات جديدة"
      action={
        <div className="flex items-center gap-2.5">
          {cachedAt && (
            <span className="text-[10.5px] text-slate-500 whitespace-nowrap">
              {status === "up-to-date" ? "✓ محدّث" : `آخر جلب: ${new Date(cachedAt).toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit" })}`}
            </span>
          )}
          {status === "error" && (
            <span className="text-[11px] text-red-400">فشل التحديث</span>
          )}
          <button
            onClick={handleRefresh}
            disabled={loading}
            className="px-3 py-1.5 text-xs font-semibold bg-sky-500/10 text-sky-400 border border-sky-500/25 rounded-lg cursor-pointer hover:bg-sky-500/20 transition-all duration-150 inline-flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? <Spinner size={12} /> : <Icon.Refresh size={13} />}
            {loading ? "يتحقق..." : "تحديث البيانات"}
          </button>
        </div>
      }
    >
      {visits.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 gap-3">
          <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center">
            <Icon.Chart className="text-slate-500" />
          </div>
          <p className="text-slate-500 text-sm m-0">لا توجد بيانات زيارات بعد</p>
          <p className="text-slate-600 text-[11px] m-0">اضغط زر "تحديث البيانات" لجلب أحدث الإحصائيات</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {/* Summary badges */}
          <div className="flex flex-wrap items-center gap-3">
            <span className="px-3 py-1.5 rounded-full text-[12px] font-bold text-sky-400 bg-sky-400/10 border border-sky-400/25">
              {totalVisits} زيارة إجمالية
            </span>
            <span className="px-3 py-1.5 rounded-full text-[12px] font-bold text-violet-400 bg-violet-400/10 border border-violet-400/25">
              {uniquePages} صفحة مُتتبَّعة
            </span>
            <span className="px-3 py-1.5 rounded-full text-[12px] font-bold text-emerald-400 bg-emerald-400/10 border border-emerald-400/25">
              {visits.length} سجل مستخدم
            </span>
          </div>
          {/* Pages summary table */}
          <div className="overflow-x-auto">
            <table className="w-full border-collapse rtl min-w-[480px]">
              <thead>
                <tr className="bg-white/[0.03]">
                  <th className="px-4 py-3 text-right text-xs font-bold text-slate-400 border-b border-white/[0.07] w-8">#</th>
                  <th className="px-4 py-3 text-right text-xs font-bold text-slate-400 border-b border-white/[0.07]">الصفحة</th>
                  <th className="px-4 py-3 text-right text-xs font-bold text-slate-400 border-b border-white/[0.07]">إجمالي الزيارات</th>
                  <th className="px-4 py-3 text-right text-xs font-bold text-slate-400 border-b border-white/[0.07]">عدد المستخدمين</th>
                  <th className="px-4 py-3 text-right text-xs font-bold text-slate-400 border-b border-white/[0.07]">آخر زيارة</th>
                </tr>
              </thead>
              <tbody>
                {pageList.map((pg, idx) => (
                  <tr
                    key={pg.page}
                    className={`border-b border-white/5 transition-colors duration-150 hover:bg-sky-500/[0.05] ${idx % 2 ? "bg-white/[0.015]" : ""}`}
                  >
                    <td className="px-4 py-3">
                      <span className={`text-xs font-bold ${idx < 3 ? "text-amber-400" : "text-slate-500"}`}>
                        {idx + 1}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm font-mono text-sky-300 bg-sky-900/20 px-2 py-0.5 rounded">
                        {pg.page}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-[3px] rounded-full text-[11.5px] font-bold text-sky-400 bg-sky-400/10 border border-sky-400/25 whitespace-nowrap">
                        {pg.totalVisits} زيارة
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-[12px] text-slate-400">
                        {pg.uniqueUsers} مستخدم
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-[12px] text-slate-400 whitespace-nowrap">
                        {pg.lastVisit
                          ? new Date(pg.lastVisit).toLocaleDateString("ar-EG", { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })
                          : "—"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {/* Top visitors per page — detailed breakdown */}
          <details className="group mt-1">
            <summary className="flex items-center gap-2 cursor-pointer text-[12px] text-slate-400 hover:text-slate-200 transition-colors py-1.5 select-none list-none">
              <span className="transition-transform duration-200 group-open:rotate-90">▶</span>
              عرض تفاصيل الزيارات لكل مستخدم ({visits.length} سجل)
            </summary>
            <div className="mt-3 overflow-x-auto">
              <table className="w-full border-collapse rtl min-w-[560px]">
                <thead>
                  <tr className="bg-white/[0.03]">
                    {COLUMNS.map((col) => (
                      <th key={col.key}
                        onClick={ () => handleSort(col.key) }
                        className="px-4 py-3 text-right text-xs font-bold text-slate-400 border-b border-white/[0.07]">
                        <span className="inline-flex items-center gap-1">
                          {col.label}
                          { sortBy === col.key && (
                            <span className="text-sky-400 text-[10px]">{sortDir === "asc" ? "▲" : "▼"}</span>
                          )}
                        </span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {sortedVisits.map((v, idx) => (
                    <tr
                      key={idx}
                      className={`border-b border-white/5 transition-colors duration-150 hover:bg-sky-500/[0.05] ${idx % 2 ? "bg-white/[0.015]" : ""}`}
                    >
                      <td className="px-4 py-3">
                        <span className="text-[12px] font-mono text-sky-300 bg-sky-900/20 px-2 py-0.5 rounded">
                          {v.page}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm font-semibold text-slate-100">
                          {v.username || (v.userId?.username) || "guest"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center gap-1 px-2 py-[2px] rounded-full text-[11px] font-bold text-sky-400 bg-sky-400/10 border border-sky-400/25">
                          {v.visitCount}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-[12px] text-slate-400 whitespace-nowrap">
                          {v.lastVisitedAt
                            ? new Date(v.lastVisitedAt).toLocaleDateString("ar-EG", { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })
                            : "—"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </details>
        </div>
      )}
    </Section>
    );
}