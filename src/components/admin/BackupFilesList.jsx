"use client";

import { useState, useEffect, useCallback } from "react";

function formatBytes(bytes) {
  if (!bytes || bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
}

function formatDate(isoStr) {
  if (!isoStr) return "—";
  const d = new Date(isoStr);
  return `${d.toLocaleDateString("ar-EG", { year: "numeric", month: "short", day: "numeric" })} - ${d.toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit" })}`;
}

export default function BackupFilesList({ userRole }) {
  const [backups, setBackups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);
  const [error, setError] = useState(null);

  const fetchBackups = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/backup-files", { cache: "no-store" });
      const data = await res.json();
      if (res.ok && data.success) {
        setBackups(data.backups || []);
      } else {
        setError(data.error || "فشل تحميل قائمة الملفات");
      }
    } catch (e) {
      setError(e.message || "خطأ في الاتصال");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBackups();
  }, [fetchBackups]);

  const handleDelete = async (backup) => {
    if (!window.confirm(`هل أنت متأكد من حذف الملف «${backup.originalName}» نهائياً من السحابة؟`)) {
      return;
    }
    setDeletingId(backup._id);
    try {
      const res = await fetch(`/api/backup-files?id=${backup._id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setBackups((prev) => prev.filter((b) => b._id !== backup._id));
      } else {
        alert(data.error || "فشل حذف الملف");
      }
    } catch (e) {
      alert("خطأ أثناء الحذف");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="bg-slate-900 rounded-2xl border border-white/[0.08] p-5 flex flex-col gap-4 rtl">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 flex-wrap border-b border-white/[0.07] pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-sky-500/10 text-sky-400 flex items-center justify-center shrink-0">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-100 m-0">
              ملفات الحسابات الأصلية السحابية (Vercel Blob)
            </h3>
            <p className="text-xs text-slate-400 mt-0.5 m-0">
              يتم حفظ نسخة طبق الأصل من كل ملف HTML/JSON يتم رفعه تلقائياً في السحابة للرجوع إليه عند الحاجة.
            </p>
          </div>
        </div>

        <button
          onClick={fetchBackups}
          disabled={loading}
          className="px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-white/[0.06] border border-white/10 text-slate-300 hover:text-white hover:bg-white/[0.12] transition-all cursor-pointer inline-flex items-center gap-1.5"
        >
          <svg
            className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
          >
            <polyline points="23 4 23 10 17 10" />
            <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
          </svg>
          تحديث
        </button>
      </div>

      {/* Content */}
      {loading && backups.length === 0 ? (
        <div className="py-12 text-center text-slate-400 text-sm">
          جاري تحميل قائمة الملفات السحابية...
        </div>
      ) : error ? (
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
          ⚠️ {error}
        </div>
      ) : backups.length === 0 ? (
        <div className="py-10 text-center text-slate-500 text-sm">
          لم يتم رفع أي ملفات سحابية بعد. عند قيام أي مستخدم برفع ملف محاسبي جديد، ستُحفظ نسخته الأصلية هنا تلقائياً.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse rtl min-w-[700px]">
            <thead>
              <tr className="bg-white/[0.03] border-b border-white/[0.07]">
                <th className="px-4 py-3 text-right text-xs font-bold text-slate-400">اسم الملف الأصلي</th>
                <th className="px-4 py-3 text-right text-xs font-bold text-slate-400">تاريخ الرفع</th>
                <th className="px-4 py-3 text-right text-xs font-bold text-slate-400">الفترة</th>
                <th className="px-4 py-3 text-right text-xs font-bold text-slate-400">الحجم</th>
                <th className="px-4 py-3 text-right text-xs font-bold text-slate-400">بواسطة</th>
                <th className="px-4 py-3 text-center text-xs font-bold text-slate-400">الإجراءات</th>
              </tr>
            </thead>
            <tbody>
              {backups.map((b, idx) => (
                <tr
                  key={b._id}
                  className={`border-b border-white/5 transition-colors duration-150 hover:bg-sky-500/[0.05] ${
                    idx % 2 ? "bg-white/[0.015]" : ""
                  }`}
                >
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-slate-200" title={b.originalName}>
                        {b.originalName}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3.5 text-xs text-slate-400 whitespace-nowrap">
                    {formatDate(b.createdAt)}
                  </td>
                  <td className="px-4 py-3.5 text-xs text-slate-300 max-w-[160px] truncate" title={b.dateRange}>
                    {b.dateRange || "—"}
                  </td>
                  <td className="px-4 py-3.5 text-xs text-slate-400 font-mono" dir="ltr">
                    {formatBytes(b.size)}
                  </td>
                  <td className="px-4 py-3.5">
                    <span className="text-xs text-blue-400 font-medium">
                      {b.uploadedBy}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-center whitespace-nowrap">
                    <div className="flex items-center justify-center gap-2">
                      <a
                        href={`/api/backup-files/download?pathname=${encodeURIComponent(
                          b.pathname
                        )}&filename=${encodeURIComponent(b.originalName)}`}
                        download={b.originalName}
                        className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-sky-500 text-white hover:bg-sky-600 transition-all shadow-[0_2px_8px_rgba(14,165,233,0.3)] inline-flex items-center gap-1.5 no-underline"
                        title="تحميل الملف الأصلي"
                      >
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                          <polyline points="7 10 12 15 17 10" />
                          <line x1="12" y1="15" x2="12" y2="3" />
                        </svg>
                        تحميل
                      </a>

                      {userRole === "owner" && (
                        <button
                          onClick={() => handleDelete(b)}
                          disabled={deletingId === b._id}
                          className="px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-white/[0.05] border border-white/10 text-slate-400 hover:text-red-400 hover:border-red-400/30 hover:bg-red-400/[0.08] transition-all cursor-pointer disabled:opacity-50"
                          title="حذف من السحابة"
                        >
                          {deletingId === b._id ? "..." : "حذف"}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
