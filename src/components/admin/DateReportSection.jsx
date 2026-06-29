import { useState, useEffect } from "react";
import { Icon } from "@/components/Icons";
import { getRoleInfo } from "@/lib/adminConstants";


// ─── Spinner ──────────────────────────────────────────────────────────────────
function Spinner({ size = 18 }) {
  return (
    <div
      className="rounded-full border-2 border-white/20 border-t-white animate-spin shrink-0"
      style={{ width: size, height: size }}
    />
  );
}

// ─── Role Badge (reused from admin patterns) ──────────────────────────────────
function RoleBadge({ role }) {
  const r = getRoleInfo(role);
  return (
    <span
      className="px-2.5 py-[3px] rounded-full text-[11.5px] font-semibold whitespace-nowrap"
      style={{ color: r.color, background: r.bg, border: `1px solid ${r.color}28` }}
    >
      {r.label}
    </span>
  );
}

// ─── Section Wrapper ──────────────────────────────────────────────────────────
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

// ─── Date-Based Account Report ────────────────────────────────────────────────
export function DateReportSection() {
  const [date, setDate] = useState(() => {
    const d = new Date();
    return d.toISOString().split("T")[0];
  });
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!date) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError("");
      try {
        const res = await fetch(`/api/reports?type=accounts-by-date&date=${date}`);
        const d = await res.json();
        if (!cancelled) {
          if (d.success) setData(d);
          else { setError(d.error || "خطأ في جلب البيانات"); setData(null); }
        }
      } catch {
        if (!cancelled) { setError("فشل الاتصال بالخادم"); setData(null); }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [date]);

  return (
    <Section
      icon={Icon.Calendar}
      title="تقرير الحسابات الجديدة حسب التاريخ"
      subtitle="اختر تاريخاً لعرض الحسابات التي تم إنشاؤها فيه"
      action={
        <div className="flex items-center gap-2">
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="admin-input bg-slate-950 border-[1.5px] border-white/10 rounded-lg text-slate-100 text-sm outline-none py-2 px-3 cursor-pointer"
          />
        </div>
      }
    >
      {loading ? (
        <div className="flex items-center justify-center py-8">
          <Spinner size={24} />
        </div>
      ) : error ? (
        <div className="text-center py-6">
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      ) : !data || data.count === 0 ? (
        <div className="text-center py-8">
          <p className="text-slate-500 text-sm m-0">
            لا توجد حسابات تم إنشاؤها في <span className="text-slate-300 font-semibold">{date}</span>
          </p>
        </div>
      ) : (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <span className="px-2.5 py-1 rounded-full text-[11.5px] font-bold text-emerald-400 bg-emerald-400/10 border border-emerald-400/25">
              {data.count} حساب
            </span>
            <span className="text-[11.5px] text-slate-400">
              تم إنشاؤها في {new Date(data.date + "T00:00:00").toLocaleDateString("ar-EG", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse rtl min-w-[500px]">
              <thead>
                <tr className="bg-white/[0.03]">
                  <th className="px-4 py-3 text-right text-xs font-bold text-slate-400 border-b border-white/[0.07]">اسم المستخدم</th>
                  <th className="px-4 py-3 text-right text-xs font-bold text-slate-400 border-b border-white/[0.07]">الدور</th>
                  <th className="px-4 py-3 text-right text-xs font-bold text-slate-400 border-b border-white/[0.07]">الهاتف</th>
                  <th className="px-4 py-3 text-right text-xs font-bold text-slate-400 border-b border-white/[0.07]">المكتب</th>
                  <th className="px-4 py-3 text-right text-xs font-bold text-slate-400 border-b border-white/[0.07]">الفواتير</th>
                </tr>
              </thead>
              <tbody>
                {data.accounts.map((acc, idx) => (
                  <tr
                    key={idx}
                    className={`border-b border-white/5 transition-colors duration-150 hover:bg-blue-500/[0.06] ${idx % 2 ? "bg-white/[0.015]" : ""}`}
                  >
                    <td className="px-4 py-3">
                      <span className="text-sm font-semibold text-slate-100">{acc.username}</span>
                    </td>
                    <td className="px-4 py-3">
                      <RoleBadge role={acc.role} />
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-[12px] text-slate-400 ltr text-right block" dir="ltr">
                        {acc.phone || "—"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-[12px] text-slate-400">{acc.officeName || "—"}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1 px-2 py-[2px] rounded-full text-[11px] font-bold text-[#f0b429] bg-[#f0b429]/10 border border-[#f0b429]/25">
                        {acc.calculationsCount} فاتورة
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </Section>
  );
}