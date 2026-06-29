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

export function InvoicesByDateSection() {
  const [date, setDate] = useState(() => new Date().toISOString().split("T")[0]);
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
        const res = await fetch(`/api/reports?type=invoices-by-date&date=${date}`);
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
      icon={Icon.Hash}
      title="تقرير الفواتير حسب التاريخ"
      subtitle="اختر تاريخاً لعرض من قام بعمل فواتير فيه وعدد كل مستخدم"
      action={
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="admin-input bg-slate-950 border-[1.5px] border-white/10 rounded-lg text-slate-100 text-sm outline-none py-2 px-3 cursor-pointer"
        />
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
      ) : !data || data.totalInvoices === 0 ? (
        <div className="text-center py-8">
          <p className="text-slate-500 text-sm m-0">
            لا توجد فواتير في <span className="text-slate-300 font-semibold">{date}</span>
          </p>
          <p className="text-[11px] text-slate-600 m-0 mt-1">
            ملاحظة: يتم تسجيل الفواتير الجديدة فقط من تاريخ تفعيل هذا التقرير
          </p>
        </div>
      ) : (
        <div>
          {/* Summary badges */}
          <div className="flex items-center gap-3 mb-4 flex-wrap">
            <span className="px-3 py-1.5 rounded-full text-[12px] font-bold text-[#f0b429] bg-[#f0b429]/10 border border-[#f0b429]/25">
              {data.totalInvoices} فاتورة
            </span>
            <span className="px-3 py-1.5 rounded-full text-[12px] font-bold text-sky-400 bg-sky-400/10 border border-sky-400/25">
              {data.totalUsers} مستخدم
            </span>
            <span className="text-[11.5px] text-slate-400">
              في {new Date(data.date + "T00:00:00").toLocaleDateString("ar-EG", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
            </span>
          </div>

          {/* Users table grouped by invoice count */}
          <div className="overflow-x-auto">
            <table className="w-full border-collapse rtl min-w-[500px]">
              <thead>
                <tr className="bg-white/[0.03]">
                  <th className="px-4 py-3 text-right text-xs font-bold text-slate-400 border-b border-white/[0.07] w-10">#</th>
                  <th className="px-4 py-3 text-right text-xs font-bold text-slate-400 border-b border-white/[0.07]">اسم المستخدم</th>
                  <th className="px-4 py-3 text-right text-xs font-bold text-slate-400 border-b border-white/[0.07]">الدور</th>
                  <th className="px-4 py-3 text-right text-xs font-bold text-slate-400 border-b border-white/[0.07]">المكتب</th>
                  <th className="px-4 py-3 text-right text-xs font-bold text-slate-400 border-b border-white/[0.07]">عدد الفواتير</th>
                  <th className="px-4 py-3 text-right text-xs font-bold text-slate-400 border-b border-white/[0.07]">آخر فاتورة</th>
                </tr>
              </thead>
              <tbody>
                {data.users.map((u, idx) => (
                  <tr
                    key={idx}
                    className={`border-b border-white/5 transition-colors duration-150 hover:bg-blue-500/[0.06] ${idx % 2 ? "bg-white/[0.015]" : ""}`}
                  >
                    <td className="px-4 py-3">
                      <span className={`text-xs font-bold ${idx < 3 ? "text-amber-400" : "text-slate-500"}`}>
                        {idx + 1}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div
                          className="w-[30px] h-[30px] rounded-full shrink-0 flex items-center justify-center text-[12px] font-bold"
                          style={{
                            background: getRoleInfo(u.role).bg,
                            border: `1px solid ${getRoleInfo(u.role).color}30`,
                            color: getRoleInfo(u.role).color,
                          }}
                        >
                          {u.username?.[0]?.toUpperCase() || "؟"}
                        </div>
                        <span className="text-sm font-semibold text-slate-100">{u.username}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <RoleBadge role={u.role} />
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-[12px] text-slate-400">{u.officeName || "—"}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-[3px] rounded-full text-[11.5px] font-bold text-[#f0b429] bg-[#f0b429]/10 border border-[#f0b429]/25 whitespace-nowrap">
                        {u.count} {u.count === 1 ? "فاتورة" : "فواتير"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-[12px] text-slate-400 whitespace-nowrap">
                        {new Date(u.lastInvoice).toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit" })}
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