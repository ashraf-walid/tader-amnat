"use client";

import { useMemo, useState, useSyncExternalStore } from "react";
import { Icon } from "@/components/Icons";

const PAGE_NAMES = {
  "/": "الحسابات (الرئيسية)",
  "/admin": "لوحة الإدارة",
  "/Storagecalculator": "الأرضيات",
  "/client/balance": "رصيد الحساب",
  "/employees": "الموظفين المتاحين",
  "/bank-accounts": "الحسابات البنكية",
  "/Storagecalculator/rates": "التعريفة",
  "/login": "تسجيل الدخول",
};

const getPageLabel = (pagePath) => {
  if (!pagePath) return "الرئيسية";
  const cleanPath = pagePath.length > 1 && pagePath.endsWith("/") ? pagePath.slice(0, -1) : pagePath;
  return PAGE_NAMES[cleanPath] || pagePath;
};

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

const DATE_RANGE_OPTIONS = [
  { key: "all", label: "كل الفترات", days: null },
  { key: "7d", label: "آخر 7 أيام", days: 7 },
  { key: "30d", label: "آخر 30 يوم", days: 30 },
  { key: "90d", label: "آخر 90 يوم", days: 90 },
];

const PAGE_STATUS_FILTERS = [
  { key: "all", label: "كل الصفحات" },
  { key: "critical", label: "أساسية" },
  { key: "strong", label: "معتمدة" },
  { key: "active", label: "نشطة" },
  { key: "weak", label: "ضعيفة" },
  { key: "stale", label: "خاملة" },
];

const formatNumber = (value) => new Intl.NumberFormat("ar-EG").format(value || 0);

const getUserLabel = (visit) => {
  const user = visit?.userId;
  const label = visit?.username
    || user?.username
    || user?.name
    || user?._id
    || user?.id
    || (typeof user === "string" ? user : null)
    || "guest";

  return String(label);
};

const getVisitTime = (value) => {
  const time = value ? new Date(value).getTime() : 0;
  return Number.isFinite(time) ? time : 0;
};

const getDaysSince = (value, now = 0) => {
  const time = getVisitTime(value);
  if (!time) return null;
  return Math.max(0, Math.floor((now - time) / 86400000));
};

const formatDateTime = (value) => {
  const time = getVisitTime(value);
  if (!time) return "—";

  return new Date(time).toLocaleDateString("ar-EG", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const formatRecency = (days) => {
  if (days === null) return "غير معروف";
  if (days === 0) return "اليوم";
  if (days === 1) return "منذ يوم";
  if (days < 7) return `منذ ${formatNumber(days)} أيام`;
  if (days < 30) return `منذ ${formatNumber(Math.floor(days / 7))} أسبوع`;
  return `منذ ${formatNumber(Math.floor(days / 30))} شهر`;
};

const getRecencyScore = (days) => {
  if (days === null) return 0;
  if (days <= 1) return 100;
  if (days <= 7) return 80;
  if (days <= 30) return 55;
  if (days <= 90) return 30;
  return 10;
};

const getPageStatus = (score, daysSinceLastVisit) => {
  if (daysSinceLastVisit !== null && daysSinceLastVisit > 45) {
    return {
      key: "stale",
      label: "خاملة",
      tone: "text-slate-400 bg-slate-500/10 border-slate-500/25",
    };
  }

  if (score >= 75) {
    return {
      key: "critical",
      label: "أساسية",
      tone: "text-emerald-400 bg-emerald-400/10 border-emerald-400/25",
    };
  }

  if (score >= 50) {
    return {
      key: "strong",
      label: "معتمدة",
      tone: "text-sky-400 bg-sky-400/10 border-sky-400/25",
    };
  }

  if (score >= 25) {
    return {
      key: "active",
      label: "نشطة",
      tone: "text-amber-400 bg-amber-400/10 border-amber-400/25",
    };
  }

  return {
    key: "weak",
    label: "ضعيفة",
    tone: "text-rose-400 bg-rose-400/10 border-rose-400/25",
  };
};

const EMPTY_CACHE_SNAPSHOT = "";

const getVisitsCacheSnapshot = () => {
  if (typeof window === "undefined") return EMPTY_CACHE_SNAPSHOT;

  try {
    return window.localStorage.getItem(PAGE_VISITS_CACHE_KEY) || EMPTY_CACHE_SNAPSHOT;
  } catch {
    return EMPTY_CACHE_SNAPSHOT;
  }
};

const subscribeVisitsCache = (listener) => {
  if (typeof window === "undefined") return () => {};

  window.addEventListener("storage", listener);
  return () => window.removeEventListener("storage", listener);
};

const parseVisitsCache = (snapshot) => {
  try {
    const parsed = snapshot ? JSON.parse(snapshot) : null;
    return {
      data: Array.isArray(parsed?.data) ? parsed.data : [],
      cachedAt: parsed?.cachedAt || null,
    };
  } catch {
    return { data: [], cachedAt: null };
  }
};

function MetricCell({ label, value, hint, icon: IconComp, accent = "text-sky-400" }) {
  return (
    <div className="min-h-[92px] px-4 py-3 border-b sm:border-l sm:border-b-0 border-white/[0.06] last:border-b-0 sm:last:border-l-0 flex items-start gap-3">
      {IconComp && (
        <span className={`${accent} shrink-0 mt-1`}>
          <IconComp size={16} />
        </span>
      )}
      <div className="min-w-0">
        <p className="text-[11px] text-slate-500 m-0">{label}</p>
        <p className="text-xl font-black text-slate-100 m-0 mt-1 leading-tight truncate">{value}</p>
        {hint && <p className="text-[11px] text-slate-500 m-0 mt-1 leading-5">{hint}</p>}
      </div>
    </div>
  );
}

export function PageVisitsSection() {
  const cacheSnapshot = useSyncExternalStore(
    subscribeVisitsCache,
    getVisitsCacheSnapshot,
    () => EMPTY_CACHE_SNAPSHOT,
  );
  const cachedPayload = useMemo(() => parseVisitsCache(cacheSnapshot), [cacheSnapshot]);
  const [livePayload, setLivePayload] = useState(null);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState(""); // "up-to-date" | "updated" | "error"
  const [sortBy, setSortBy] = useState("visitCount");
  const [sortDir, setSortDir] = useState("desc");
  const [dateRange, setDateRange] = useState("all");
  const [pageStatus, setPageStatus] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

  const visits = livePayload?.data ?? cachedPayload.data;
  const cachedAt = livePayload?.cachedAt ?? cachedPayload.cachedAt;

  const analytics = useMemo(() => {
    const latestVisitTime = visits.reduce((latest, visit) => (
      Math.max(latest, getVisitTime(visit.lastVisitedAt))
    ), 0);
    const referenceTime = cachedAt || latestVisitTime;
    const selectedRange = DATE_RANGE_OPTIONS.find((option) => option.key === dateRange);
    const minTime = referenceTime && selectedRange?.days
      ? referenceTime - selectedRange.days * 86400000
      : 0;
    const normalizedSearch = searchTerm.trim().toLowerCase();

    const rangedVisits = visits.filter((visit) => {
      if (!minTime) return true;
      return getVisitTime(visit.lastVisitedAt) >= minTime;
    });

    const pageMap = new Map();
    const userMap = new Map();

    rangedVisits.forEach((visit) => {
      const page = visit.page || "/";
      const username = String(getUserLabel(visit));
      const visitCount = Number(visit.visitCount) || 0;
      const lastVisitTime = getVisitTime(visit.lastVisitedAt);

      if (!pageMap.has(page)) {
        pageMap.set(page, {
          page,
          totalVisits: 0,
          users: new Set(),
          lastVisit: null,
          records: 0,
        });
      }

      const pageEntry = pageMap.get(page);
      pageEntry.totalVisits += visitCount;
      pageEntry.users.add(username);
      pageEntry.records += 1;

      if (!pageEntry.lastVisit || lastVisitTime > getVisitTime(pageEntry.lastVisit)) {
        pageEntry.lastVisit = visit.lastVisitedAt;
      }

      if (!userMap.has(username)) {
        userMap.set(username, {
          username,
          totalVisits: 0,
          pages: new Map(),
          lastVisit: null,
          records: 0,
        });
      }

      const userEntry = userMap.get(username);
      userEntry.totalVisits += visitCount;
      userEntry.pages.set(page, (userEntry.pages.get(page) || 0) + visitCount);
      userEntry.records += 1;

      if (!userEntry.lastVisit || lastVisitTime > getVisitTime(userEntry.lastVisit)) {
        userEntry.lastVisit = visit.lastVisitedAt;
      }
    });

    const maxVisits = Math.max(...Array.from(pageMap.values()).map((page) => page.totalVisits), 1);
    const maxUsers = Math.max(...Array.from(pageMap.values()).map((page) => page.users.size), 1);

    const pages = Array.from(pageMap.values())
      .map((page) => {
        const daysSinceLastVisit = getDaysSince(page.lastVisit, referenceTime);
        const visitWeight = page.totalVisits / maxVisits;
        const userWeight = page.users.size / maxUsers;
        const recencyWeight = getRecencyScore(daysSinceLastVisit) / 100;
        const dependencyScore = Math.round((visitWeight * 45) + (userWeight * 35) + (recencyWeight * 20));
        const statusInfo = getPageStatus(dependencyScore, daysSinceLastVisit);

        return {
          ...page,
          uniqueUsers: page.users.size,
          avgVisitsPerUser: page.users.size ? page.totalVisits / page.users.size : 0,
          daysSinceLastVisit,
          dependencyScore,
          statusInfo,
        };
      })
      .filter((page) => pageStatus === "all" || page.statusInfo.key === pageStatus)
      .filter((page) => {
        if (!normalizedSearch) return true;
        return `${page.page} ${getPageLabel(page.page)}`.toLowerCase().includes(normalizedSearch);
      })
      .sort((a, b) => b.dependencyScore - a.dependencyScore || b.totalVisits - a.totalVisits);

    const users = Array.from(userMap.values())
      .map((user) => {
        const sortedPages = Array.from(user.pages.entries()).sort((a, b) => b[1] - a[1]);
        const mainPage = sortedPages[0]?.[0] || "/";

        return {
          ...user,
          uniquePages: user.pages.size,
          mainPage,
          mainPageVisits: sortedPages[0]?.[1] || 0,
          daysSinceLastVisit: getDaysSince(user.lastVisit, referenceTime),
        };
      })
      .filter((user) => {
        if (!normalizedSearch) return true;
        const pageText = Array.from(user.pages.keys()).map(getPageLabel).join(" ");
        return `${user.username} ${pageText}`.toLowerCase().includes(normalizedSearch);
      })
      .sort((a, b) => b.totalVisits - a.totalVisits || b.uniquePages - a.uniquePages);

    const filteredPageSet = new Set(pages.map((page) => page.page));
    const filteredUserSet = new Set(users.map((user) => user.username));
    const filteredVisits = rangedVisits.filter((visit) => {
      const page = visit.page || "/";
      const username = String(getUserLabel(visit));

      if (pageStatus !== "all" && !filteredPageSet.has(page)) return false;
      if (!normalizedSearch) return true;

      return filteredPageSet.has(page) || filteredUserSet.has(username);
    });

    const totalVisits = filteredVisits.reduce((sum, visit) => sum + (Number(visit.visitCount) || 0), 0);
    const uniquePages = pages.length;
    const activeUsers = users.length;
    const topPage = pages[0] || null;
    const topUser = users[0] || null;
    const stalePages = pages.filter((page) => page.statusInfo.key === "stale").length;
    const singlePageUsers = users.filter((user) => user.uniquePages === 1).length;
    const avgVisitsPerUser = activeUsers ? Math.round(totalVisits / activeUsers) : 0;

    return {
      filteredVisits,
      pages,
      users,
      totalVisits,
      uniquePages,
      activeUsers,
      topPage,
      topUser,
      stalePages,
      singlePageUsers,
      avgVisitsPerUser,
    };
  }, [cachedAt, dateRange, pageStatus, searchTerm, visits]);

  const sortedVisits = useMemo(() => {
    const data = [...analytics.filteredVisits];

    data.sort((a, b) => {
      let valueA;
      let valueB;

      switch (sortBy) {
        case "page":
          valueA = getPageLabel(a.page);
          valueB = getPageLabel(b.page);
          break;

        case "user":
          valueA = getUserLabel(a);
          valueB = getUserLabel(b);
          break;

        case "visitCount":
          valueA = Number(a.visitCount) || 0;
          valueB = Number(b.visitCount) || 0;
          break;

        case "lastVisitedAt":
          valueA = getVisitTime(a.lastVisitedAt);
          valueB = getVisitTime(b.lastVisitedAt);
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
  }, [analytics.filteredVisits, sortBy, sortDir]);

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
        const cached = window.localStorage.getItem(PAGE_VISITS_CACHE_KEY);
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
      window.localStorage.setItem(PAGE_VISITS_CACHE_KEY, JSON.stringify(payload));
      setLivePayload(payload);
      setStatus("updated");
    } catch {
      setStatus("error");
    } finally {
      setLoading(false);
    }
  };

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
          <p className="text-slate-600 text-[11px] m-0">اضغط زر &quot;تحديث البيانات&quot; لجلب أحدث الإحصائيات</p>
        </div>
      ) : (
        <div className="flex flex-col gap-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 rounded-xl border border-white/[0.07] overflow-hidden">
            <MetricCell
              icon={Icon.Eye}
              label="إجمالي الزيارات"
              value={formatNumber(analytics.totalVisits)}
              hint={`${formatNumber(analytics.filteredVisits.length)} سجل مطابق للفلاتر`}
            />
            <MetricCell
              icon={Icon.Chart}
              label="أعلى صفحة اعتمادًا"
              value={analytics.topPage ? getPageLabel(analytics.topPage.page) : "—"}
              hint={analytics.topPage ? `درجة الاعتماد ${formatNumber(analytics.topPage.dependencyScore)}%` : "لا توجد صفحات"}
              accent="text-emerald-400"
            />
            <MetricCell
              icon={Icon.Users}
              label="المستخدمون النشطون"
              value={formatNumber(analytics.activeUsers)}
              hint={analytics.topUser ? `الأعلى: ${analytics.topUser.username}` : `متوسط ${formatNumber(analytics.avgVisitsPerUser)} زيارة لكل مستخدم`}
              accent="text-violet-400"
            />
            <MetricCell
              icon={Icon.Calendar}
              label="مؤشرات تحتاج متابعة"
              value={`${formatNumber(analytics.stalePages)} صفحة خاملة`}
              hint={`${formatNumber(analytics.singlePageUsers)} مستخدم يعتمد على صفحة واحدة`}
              accent="text-amber-400"
            />
          </div>

          <div className="flex flex-col gap-3 rounded-xl border border-white/[0.07] p-3">
            <div className="flex flex-wrap items-center gap-2">
              {DATE_RANGE_OPTIONS.map((option) => {
                const active = dateRange === option.key;
                return (
                  <button
                    key={option.key}
                    type="button"
                    onClick={() => setDateRange(option.key)}
                    className={`h-8 px-3 rounded-lg text-[11px] font-bold border transition-all duration-150 cursor-pointer ${
                      active
                        ? "bg-sky-500 text-white border-sky-400"
                        : "bg-white/[0.03] text-slate-400 border-white/[0.07] hover:bg-white/[0.07] hover:text-slate-200"
                    }`}
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>

            <div className="flex flex-col lg:flex-row gap-2.5">
              <input
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="بحث باسم الصفحة أو المستخدم"
                className="h-9 flex-1 rounded-lg bg-slate-950/50 border border-white/[0.08] px-3 text-[12px] text-slate-200 outline-none focus:border-sky-500/60 placeholder:text-slate-600"
              />
              <div className="flex flex-wrap gap-2">
                {PAGE_STATUS_FILTERS.map((filter) => {
                  const active = pageStatus === filter.key;
                  return (
                    <button
                      key={filter.key}
                      type="button"
                      onClick={() => setPageStatus(filter.key)}
                      className={`h-9 px-3 rounded-lg text-[11px] font-bold border transition-all duration-150 cursor-pointer ${
                        active
                          ? "bg-slate-200 text-slate-950 border-slate-200"
                          : "bg-white/[0.03] text-slate-400 border-white/[0.07] hover:bg-white/[0.07] hover:text-slate-200"
                      }`}
                    >
                      {filter.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
            <div className="lg:col-span-2 rounded-xl border border-white/[0.07] overflow-hidden">
              <div className="px-4 py-3 border-b border-white/[0.07]">
                <p className="text-[12px] font-bold text-slate-300 m-0">قراءة الاعتماد على الصفحات</p>
                <p className="text-[11px] text-slate-500 m-0 mt-1">الدرجة تجمع حجم الزيارات، انتشار الاستخدام بين المستخدمين، وحداثة آخر نشاط</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse rtl min-w-[760px]">
                  <thead>
                    <tr className="bg-white/[0.03]">
                      <th className="px-4 py-3 text-right text-xs font-bold text-slate-400 border-b border-white/[0.07] w-8">#</th>
                      <th className="px-4 py-3 text-right text-xs font-bold text-slate-400 border-b border-white/[0.07]">الصفحة</th>
                      <th className="px-4 py-3 text-right text-xs font-bold text-slate-400 border-b border-white/[0.07]">الحالة</th>
                      <th className="px-4 py-3 text-right text-xs font-bold text-slate-400 border-b border-white/[0.07]">الزيارات</th>
                      <th className="px-4 py-3 text-right text-xs font-bold text-slate-400 border-b border-white/[0.07]">المستخدمون</th>
                      <th className="px-4 py-3 text-right text-xs font-bold text-slate-400 border-b border-white/[0.07]">متوسط/مستخدم</th>
                      <th className="px-4 py-3 text-right text-xs font-bold text-slate-400 border-b border-white/[0.07]">درجة الاعتماد</th>
                      <th className="px-4 py-3 text-right text-xs font-bold text-slate-400 border-b border-white/[0.07]">آخر نشاط</th>
                    </tr>
                  </thead>
                  <tbody>
                    {analytics.pages.map((pg, idx) => (
                      <tr
                        key={pg.page}
                        className={`border-b border-white/5 transition-colors duration-150 hover:bg-sky-500/[0.05] ${idx % 2 ? "bg-white/[0.015]" : ""}`}
                      >
                        <td className="px-4 py-3">
                          <span className={`text-xs font-bold ${idx < 3 ? "text-amber-400" : "text-slate-500"}`}>
                            {formatNumber(idx + 1)}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-col">
                            <span className="text-sm font-semibold text-slate-200">
                              {getPageLabel(pg.page)}
                            </span>
                            {pg.page !== getPageLabel(pg.page) && (
                              <span className="text-[11px] font-mono text-slate-500">
                                {pg.page}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center px-2.5 py-[3px] rounded-full text-[11px] font-bold border whitespace-nowrap ${pg.statusInfo.tone}`}>
                            {pg.statusInfo.label}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-sm font-bold text-slate-100 whitespace-nowrap">
                            {formatNumber(pg.totalVisits)}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-[12px] text-slate-400 whitespace-nowrap">
                            {formatNumber(pg.uniqueUsers)} مستخدم
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-[12px] text-slate-400 whitespace-nowrap">
                            {formatNumber(Math.round(pg.avgVisitsPerUser))}
                          </span>
                        </td>
                        <td className="px-4 py-3 min-w-[150px]">
                          <div className="flex items-center gap-2">
                            <span className="text-[12px] font-bold text-sky-300 w-9">
                              {formatNumber(pg.dependencyScore)}%
                            </span>
                            <span className="h-1.5 flex-1 rounded-full bg-slate-800 overflow-hidden">
                              <span
                                className="block h-full rounded-full bg-sky-400"
                                style={{ width: `${pg.dependencyScore}%` }}
                              />
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-col">
                            <span className="text-[12px] text-slate-400 whitespace-nowrap">
                              {formatDateTime(pg.lastVisit)}
                            </span>
                            <span className="text-[10.5px] text-slate-600 whitespace-nowrap">
                              {formatRecency(pg.daysSinceLastVisit)}
                            </span>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {analytics.pages.length === 0 && (
                      <tr>
                        <td colSpan={8} className="px-4 py-8 text-center text-sm text-slate-500">
                          لا توجد صفحات مطابقة للفلاتر الحالية
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="rounded-xl border border-white/[0.07] overflow-hidden">
              <div className="px-4 py-3 border-b border-white/[0.07]">
                <p className="text-[12px] font-bold text-slate-300 m-0">أكثر المستخدمين نشاطًا</p>
                <p className="text-[11px] text-slate-500 m-0 mt-1">يوضح من يعتمد على التطبيق وعدد الصفحات التي يستخدمها</p>
              </div>
              <div className="divide-y divide-white/[0.06]">
                {analytics.users.slice(0, 6).map((user, idx) => (
                  <div key={user.username} className="px-4 py-3 flex items-center gap-3">
                    <span className={`w-6 text-xs font-bold ${idx < 3 ? "text-amber-400" : "text-slate-600"}`}>
                      {formatNumber(idx + 1)}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold text-slate-100 m-0 truncate">{user.username}</p>
                      <p className="text-[11px] text-slate-500 m-0 mt-1 truncate">
                        {formatNumber(user.uniquePages)} صفحة | أهمها {getPageLabel(user.mainPage)}
                      </p>
                    </div>
                    <div className="text-left shrink-0">
                      <p className="text-sm font-black text-sky-300 m-0">{formatNumber(user.totalVisits)}</p>
                      <p className="text-[10px] text-slate-600 m-0">زيارة</p>
                    </div>
                  </div>
                ))}
                {analytics.users.length === 0 && (
                  <div className="px-4 py-8 text-center text-sm text-slate-500">
                    لا توجد بيانات مستخدمين مطابقة
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse rtl min-w-[720px]">
              <thead>
                <tr className="bg-white/[0.03]">
                  <th className="px-4 py-3 text-right text-xs font-bold text-slate-400 border-b border-white/[0.07]">مؤشر سريع</th>
                  <th className="px-4 py-3 text-right text-xs font-bold text-slate-400 border-b border-white/[0.07]">القيمة</th>
                  <th className="px-4 py-3 text-right text-xs font-bold text-slate-400 border-b border-white/[0.07]">الدلالة التحليلية</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-white/5">
                  <td className="px-4 py-3 text-sm font-bold text-slate-200">اعتماد التطبيق</td>
                  <td className="px-4 py-3 text-sm text-slate-300">{formatNumber(analytics.uniquePages)} صفحة مستخدمة</td>
                  <td className="px-4 py-3 text-[12px] text-slate-500">كلما زاد انتشار الاستخدام على صفحات متعددة كان الاعتماد أوسع وليس محصورًا في وظيفة واحدة.</td>
                </tr>
                <tr className="border-b border-white/5 bg-white/[0.015]">
                  <td className="px-4 py-3 text-sm font-bold text-slate-200">الصفحة المحورية</td>
                  <td className="px-4 py-3 text-sm text-slate-300">
                    {analytics.topPage ? getPageLabel(analytics.topPage.page) : "—"}
                  </td>
                  <td className="px-4 py-3 text-[12px] text-slate-500">هذه الصفحة تجمع أعلى وزن بين حجم الزيارات وعدد المستخدمين وحداثة النشاط.</td>
                </tr>
                <tr className="border-b border-white/5">
                  <td className="px-4 py-3 text-sm font-bold text-slate-200">الاعتماد الفردي</td>
                  <td className="px-4 py-3 text-sm text-slate-300">{formatNumber(analytics.singlePageUsers)} مستخدم</td>
                  <td className="px-4 py-3 text-[12px] text-slate-500">مستخدمون يتركز نشاطهم في صفحة واحدة؛ هذا يكشف وظائف حرجة أو مستخدمين لم يكتشفوا باقي النظام.</td>
                </tr>
                <tr className="bg-white/[0.015]">
                  <td className="px-4 py-3 text-sm font-bold text-slate-200">صفحات خاملة</td>
                  <td className="px-4 py-3 text-sm text-slate-300">{formatNumber(analytics.stalePages)} صفحة</td>
                  <td className="px-4 py-3 text-[12px] text-slate-500">الخمول يشير إلى صفحة غير مفهومة، غير لازمة، أو تحتاج إبرازًا في مسار العمل.</td>
                </tr>
              </tbody>
            </table>
          </div>

          <details className="group mt-1">
            <summary className="flex items-center gap-2 cursor-pointer text-[12px] text-slate-400 hover:text-slate-200 transition-colors py-1.5 select-none list-none">
              <span className="transition-transform duration-200 group-open:rotate-90">▶</span>
              عرض السجلات التفصيلية لكل مستخدم ({formatNumber(sortedVisits.length)} سجل)
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
                        <div className="flex flex-col">
                          <span className="text-sm font-semibold text-slate-200">
                            {getPageLabel(v.page)}
                          </span>
                          {v.page !== getPageLabel(v.page) && (
                            <span className="text-[10px] font-mono text-slate-500">
                              {v.page}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm font-semibold text-slate-100">
                          {getUserLabel(v)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center gap-1 px-2 py-[2px] rounded-full text-[11px] font-bold text-sky-400 bg-sky-400/10 border border-sky-400/25">
                          {formatNumber(v.visitCount)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-[12px] text-slate-400 whitespace-nowrap">
                          {formatDateTime(v.lastVisitedAt)}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {sortedVisits.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-4 py-8 text-center text-sm text-slate-500">
                        لا توجد سجلات مطابقة للفلاتر الحالية
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </details>
        </div>
      )}
    </Section>
    );
}
