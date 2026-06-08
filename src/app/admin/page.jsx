"use client";

import { useState, useEffect } from "react";
import { Icon } from "@/components/Icons";
import { PROJECT_FILES, ROLES, getRoleInfo, EMPTY_FORM } from "@/lib/adminConstants";
import AdminNav from "@/components/AdminNav";

// ─── مكوّن حقل الإدخال ────────────────────────────────────────────────────────
function Field({ label, icon: IconComp, error, children }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-semibold text-[#8892a4] flex items-center gap-1.5">
        {IconComp && <span className="text-blue-400"><IconComp /></span>}
        {label}
      </label>
      {children}
      {error && <span className="text-[11px] text-red-400">{error}</span>}
    </div>
  );
}

// ─── حقل نصي موحّد ────────────────────────────────────────────────────────────
function Input({ value, onChange, placeholder, type = "text", step, min, suffix, focusClass = "admin-input", extraPadLeft }) {
  return (
    <div className="relative flex items-center">
      <input
        className={`no-spinner ${focusClass} w-full bg-[#0d1424] border-[1.5px] border-white/10 rounded-lg text-[#f0f2f8] text-sm rtl outline-none transition-colors duration-200 py-2.5 ${suffix ? "pl-11" : "pl-3"} pr-3`}
        type={type} step={step} min={min}
        value={value} onChange={onChange} placeholder={placeholder}
        style={extraPadLeft ? { paddingLeft: extraPadLeft } : undefined}
      />
      {suffix && (
        <span className="absolute left-3 text-xs text-[#8892a4] pointer-events-none">{suffix}</span>
      )}
    </div>
  );
}

// ─── زر رئيسي ─────────────────────────────────────────────────────────────────
const BTN_BASE = "font-semibold text-white border-none rounded-[7px] inline-flex items-center gap-1.5 transition-all duration-150 whitespace-nowrap disabled:opacity-60 disabled:cursor-not-allowed";
const VARIANTS = {
  primary: "bg-sky-500 shadow-[0_4px_12px_rgba(14,165,233,0.3)] hover:bg-sky-600 active:scale-[0.97]",
  success: "bg-emerald-600 shadow-[0_4px_12px_rgba(5,150,105,0.3)] hover:bg-emerald-700 active:scale-[0.97]",
  danger:  "bg-red-600 shadow-[0_4px_12px_rgba(220,38,38,0.3)] hover:bg-red-700 active:scale-[0.97]",
  ghost:   "bg-white/[0.06] shadow-none hover:bg-white/[0.12] active:scale-[0.97]",
  gold:    "bg-amber-600 shadow-[0_4px_12px_rgba(217,119,6,0.3)] hover:bg-amber-700 active:scale-[0.97]",
};
const SIZES = { xs: "px-2 py-1 text-xs", sm: "px-3 py-1.5 text-xs", md: "px-[18px] py-2.5 text-sm" };

function Btn({ onClick, disabled, children, variant = "primary", size = "md", title }) {
  return (
    <button onClick={onClick} disabled={disabled} title={title}
      className={`${BTN_BASE} ${VARIANTS[variant]} ${SIZES[size]} ${disabled ? "" : "cursor-pointer"}`}>
      {children}
    </button>
  );
}

// ─── Modal ─────────────────────────────────────────────────────────────────────
function Modal({ open, onClose, title, children }) {
  useEffect(() => {
    const handler = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);
  if (!open) return null;
  return (
    <div onClick={onClose} className="fixed inset-0 z-[999] bg-black/65 backdrop-blur-[4px] flex items-center justify-center p-4">
      <div onClick={(e) => e.stopPropagation()}
        className="bg-[#1a2035] border border-white/10 rounded-2xl px-6 py-7 w-full max-w-[480px] rtl shadow-[0_24px_60px_rgba(0,0,0,0.5)] animate-slide-up max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-[22px]">
          <h2 className="text-lg font-bold text-[#f0f2f8] m-0">{title}</h2>
          <button onClick={onClose} className="bg-transparent border-none text-[#8892a4] cursor-pointer p-1 flex">
            <Icon.Close />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

// ─── شارة الدور ───────────────────────────────────────────────────────────────
function RoleBadge({ role }) {
  const r = getRoleInfo(role);
  return (
    <span className="px-2.5 py-[3px] rounded-full text-[11.5px] font-semibold whitespace-nowrap"
      style={{ color: r.color, background: r.bg, border: `1px solid ${r.color}28` }}>
      {r.label}
    </span>
  );
}

// ─── شارة المحاولات ───────────────────────────────────────────────────────────
function AttemptsBadge({ attempts }) {
  const isZero = attempts === 0;
  const isLow = !isZero && attempts <= 3;
  const color = isZero ? "#f87171" : isLow ? "#fbbf24" : "#34d399";
  const bg = isZero ? "rgba(248,113,113,0.1)" : isLow ? "rgba(251,191,36,0.1)" : "rgba(52,211,153,0.1)";
  return (
    <span className="px-2.5 py-[3px] rounded-full text-[11.5px] font-bold"
      style={{ color, background: bg, border: `1px solid ${color}30` }}>
      {isZero ? "منتهية" : `${attempts} محاولة`}
    </span>
  );
}

// ─── نموذج الحساب ─────────────────────────────────────────────────────────────
function AccountForm({ initial, onSubmit, onCancel, isSaving }) {
  const [form, setForm] = useState(() => {
    if (initial) {
      return { ...EMPTY_FORM, ...initial };
    }
    return EMPTY_FORM;
  });
  const [showPass, setShowPass] = useState(false);
  const [errors, setErrors] = useState({});

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const validate = () => {
    const e = {};
    if (!form.username.trim()) e.username = "مطلوب";
    if (!initial && !form.password) e.password = "مطلوب";
    if (form.phone && !/^[0-9+\-\s]{7,15}$/.test(form.phone)) e.phone = "رقم غير صحيح";
    if (!form.attempts || form.attempts < 0) e.attempts = "قيمة غير صحيحة";
    if (form.accountCode && isNaN(Number(form.accountCode))) e.accountCode = "قيمة غير صحيحة";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = () => validate() && onSubmit(form);

  return (
    <div className="flex flex-col gap-3.5">
      <Field label="اسم المستخدم" icon={Icon.User} error={errors.username}>
        <Input value={form.username} onChange={set("username")} placeholder="أدخل اسم المستخدم" />
      </Field>

      <Field
        label={initial ? "كلمة المرور الجديدة (اتركها فارغة إن لم تغيّرها)" : "كلمة المرور"}
        icon={Icon.Lock} error={errors.password}>
        <div className="relative">
          <input type={showPass ? "text" : "password"} value={form.password} onChange={set("password")}
            placeholder="••••••••"
            className="admin-input w-full bg-[#0d1424] border-[1.5px] border-white/10 rounded-lg text-[#f0f2f8] text-sm rtl outline-none py-2.5 px-3 pl-[38px] box-border" />
          <button type="button" onClick={() => setShowPass((v) => !v)}
            className="absolute left-2.5 top-1/2 -translate-y-1/2 bg-transparent border-none text-[#8892a4] cursor-pointer flex">
            {showPass ? <Icon.EyeOff /> : <Icon.Eye />}
          </button>
        </div>
      </Field>

      <Field label="رقم الهاتف" icon={Icon.Phone} error={errors.phone}>
        <Input value={form.phone} onChange={set("phone")} placeholder="01xxxxxxxxx" />
      </Field>

      <Field label="اسم المكتب (اختياري)" icon={Icon.Briefcase}>
        <Input value={form.officeName || ""} onChange={set("officeName")} placeholder="أدخل اسم المكتب" />
      </Field>

      <Field label="كود الحساب (اختياري)" icon={Icon.Hash} error={errors.accountCode}>
        <Input type="number" value={form.accountCode || ""} onChange={set("accountCode")} placeholder="مثال: 12345" />
      </Field>

      <Field label="الدور" icon={Icon.Shield}>
        <select value={form.role} onChange={set("role")}
          className="admin-input w-full bg-[#0d1424] border-[1.5px] border-white/10 rounded-lg text-[#f0f2f8] text-sm rtl outline-none py-2.5 px-3 cursor-pointer">
          {ROLES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
        </select>
      </Field>

      <Field label="عدد المحاولات المتاحة" icon={Icon.Hash} error={errors.attempts}>
        <Input type="number" min="0" step="1" value={form.attempts} onChange={set("attempts")} placeholder="5" suffix="محاولة" />
      </Field>

      <div className="flex gap-2.5 mt-1.5 justify-end">
        <Btn variant="ghost" onClick={onCancel}>إلغاء</Btn>
        <Btn variant="primary" onClick={handleSubmit} disabled={isSaving}>
          {isSaving ? <Spinner /> : <Icon.Check />}
          {isSaving ? "جاري الحفظ..." : initial ? "حفظ التعديلات" : "إضافة الحساب"}
        </Btn>
      </div>
    </div>
  );
}

// ─── مؤشر التحميل ─────────────────────────────────────────────────────────────
function Spinner({ size = 14 }) {
  return (
    <div className="rounded-full border-2 border-white/25 border-t-white shrink-0 animate-spin"
      style={{ width: size, height: size }} />
  );
}

// ─── Toast ────────────────────────────────────────────────────────────────────
function Toast({ msg, onDone }) {
  useEffect(() => {
    const t = setTimeout(onDone, 3200);
    return () => clearTimeout(t);
  }, [msg, onDone]);
  if (!msg.text) return null;
  const isErr = msg.type === "error";
  return (
    <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-[9999] flex items-center gap-2 px-5 py-3 rounded-xl text-[13px] font-semibold whitespace-nowrap animate-slide-up shadow-[0_8px_24px_rgba(0,0,0,0.4)]
      ${isErr ? "bg-[#1f0a0a] border border-red-400/40 text-red-400" : "bg-[#0a1f15] border border-emerald-400/40 text-emerald-400"}`}>
      {isErr ? "✕" : "✓"} {msg.text}
    </div>
  );
}

// ─── الصفحة الرئيسية ──────────────────────────────────────────────────────────
export default function AdminPage() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [authLoaded, setAuthLoaded] = useState(false);
  const [rate, setRate] = useState("");
  const [rateLoading, setRL] = useState(true);
  const [rateSaving, setRS] = useState(false);
  const [accounts, setAccounts] = useState([]);
  const [accLoading, setAL] = useState(true);
  const [tab, setTab] = useState("accounts");
  const [modal, setModal] = useState(null);
  const [selected, setSelected] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [toast, setToast] = useState({ text: "", type: "" });
  const [newAttempts, setNewAttempts] = useState("");
  const [dataClearing, setDataClearing] = useState(false);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [structSearch, setStructSearch] = useState("");
  const [structType, setStructType] = useState("all");

  const notify = (text, type = "success") => setToast({ text, type });

  useEffect(() => {
    fetch("/api/auth/me").then((res) => res.json()).then((data) => {
      if (data.success && (data.user.role === "admin" || data.user.role === "owner")) setIsAdmin(true);
      else window.location.href = "/login";
    }).catch(() => { window.location.href = "/login"; }).finally(() => setAuthLoaded(true));
  }, []);

  useEffect(() => {
    fetch("/api/settings").then((r) => r.json()).then((d) => { if (d.success) setRate(d.exchangeRate); })
      .catch(() => {}).finally(() => setRL(false));
  }, []);

  const loadAccounts = () => {
    setAL(true);
    fetch("/api/accounts").then((r) => r.json()).then((d) => { if (d.success) setAccounts(d.accounts); })
      .catch(() => {}).finally(() => setAL(false));
  };
  useEffect(loadAccounts, []);

  const saveRate = async () => {
    setRS(true);
    try {
      const res = await fetch("/api/settings", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ exchangeRate: Number(rate) }) });
      const d = await res.json();
      d.success ? notify("تم حفظ سعر الصرف بنجاح") : notify(d.error || "خطأ", "error");
    } catch { notify("فشل الاتصال بالخادم", "error"); } finally { setRS(false); }
  };

  const addAccount = async (form) => {
    setIsSaving(true);
    try {
      const res = await fetch("/api/accounts", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      const d = await res.json();
      if (d.success) { notify("تم إضافة الحساب بنجاح"); setModal(null); loadAccounts(); }
      else notify(d.error || "خطأ في الإضافة", "error");
    } catch { notify("فشل الاتصال", "error"); } finally { setIsSaving(false); }
  };

  const editAccount = async (form) => {
    setIsSaving(true);
    try {
      const res = await fetch(`/api/accounts/${selected.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      const d = await res.json();
      if (d.success) { notify("تم تحديث الحساب"); setModal(null); loadAccounts(); }
      else notify(d.error || "خطأ", "error");
    } catch { notify("فشل الاتصال", "error"); } finally { setIsSaving(false); }
  };

  const deleteAccount = async () => {
    setIsSaving(true);
    try {
      const res = await fetch(`/api/accounts/${selected.id}`, { method: "DELETE" });
      const d = await res.json();
      if (d.success) { notify("تم حذف الحساب"); setModal(null); setDeleteConfirm(""); loadAccounts(); }
      else notify(d.error || "خطأ", "error");
    } catch { notify("فشل الاتصال", "error"); } finally { setIsSaving(false); }
  };

  const renewAttempts = async () => {
    const n = Number(newAttempts);
    if (!n || n < 0) return notify("أدخل رقماً صحيحاً", "error");
    setIsSaving(true);
    try {
      const res = await fetch(`/api/accounts/${selected.id}/attempts`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ attempts: n }) });
      const d = await res.json();
      if (d.success) { notify(`تم منح ${n} محاولات للمستخدم ${selected.username}`); setModal(null); setNewAttempts(""); loadAccounts(); }
      else notify(d.error || "خطأ", "error");
    } catch { notify("فشل الاتصال", "error"); } finally { setIsSaving(false); }
  };

  const clearFinancialData = async () => {
    if (!window.confirm('⚠️ تحذير: هل أنت متأكد من مسح جميع البيانات المالية؟')) return;
    setDataClearing(true);
    try {
      const res = await fetch('/api/data', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify([]) });
      const d = await res.json();
      d.success ? notify("تم مسح جميع البيانات المالية بنجاح") : notify(d.error || "خطأ أثناء مسح البيانات", "error");
    } catch { notify("فشل الاتصال بالخادم", "error"); } finally { setDataClearing(false); }
  };

  const filtered = accounts.filter((a) => {
    const matchRole = roleFilter === "all" || a.role === roleFilter;
    const q = search.toLowerCase();
    const matchSearch = !q || a.username.toLowerCase().includes(q) || (a.phone || "").includes(q) || (a.officeName || "").toLowerCase().includes(q);
    return matchRole && matchSearch;
  });

  const stats = {
    total: accounts.length,
    clients: accounts.filter((a) => a.role === "client").length,
    active: accounts.filter((a) => (a.attempts || 0) > 0).length,
    depleted: accounts.filter((a) => (a.attempts || 0) === 0).length,
  };

  if (!authLoaded) return (
    <div className="min-h-screen bg-[#0d1424] flex items-center justify-center"><Spinner size={40} /></div>
  );
  if (!isAdmin) return null;

  const inputCls = "admin-input w-full bg-[#0d1424] border-[1.5px] border-white/10 rounded-lg text-[#f0f2f8] text-sm rtl outline-none transition-colors duration-200";

  return (
    <div dir="rtl" lang="ar" className="min-h-screen bg-[#0d1424] font-sans text-[#f0f2f8]">
      <style>{`
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 4px; }
        select option { background: #1a2035; }
      `}</style>

      <AdminNav />

      <div className="max-w-[960px] mx-auto px-4 py-6">
        {/* ─── رأس الصفحة ─── */}
        <div className="mb-7">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-2.5 md:gap-2.5 mb-1">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-500 to-indigo-400 flex items-center justify-center shadow-[0_4px_16px_rgba(14,165,233,0.3)] shrink-0">
                <Icon.Shield />
              </div>
              <div>
                <h1 className="text-[22px] font-extrabold m-0 text-[#f0f2f8]">لوحة الإدارة</h1>
                <p className="text-[12.5px] text-[#8892a4] m-0">نظام أرضيات الحاويات الواردة</p>
              </div>
            </div>
          </div>
        </div>

        {/* ─── بطاقات الإحصاء ─── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mb-6">
          {[
            { label: "إجمالي الحسابات", value: stats.total, color: "#818cf8", icon: Icon.Users },
            { label: "حسابات العملاء", value: stats.clients, color: "#60a5fa", icon: Icon.User },
            { label: "محاولات متاحة", value: stats.active, color: "#34d399", icon: Icon.Check },
            { label: "محاولات منتهية", value: stats.depleted, color: "#f87171", icon: Icon.Hash },
          ].map((s, i) => (
            <div key={i} className="bg-[#1a2035] rounded-[10px] px-3.5 py-3 border border-white/[0.07] shadow-[0_2px_12px_rgba(0,0,0,0.2)]">
              <div className="flex justify-between items-start gap-2">
                <div className="min-w-0 flex-1">
                  <p className="text-[10.5px] text-[#8892a4] mb-1 font-medium leading-tight break-words">{s.label}</p>
                  <p className="text-2xl font-extrabold m-0 leading-none" style={{ color: s.color }}>{s.value}</p>
                </div>
                <div className="opacity-60 shrink-0 scale-[0.85]" style={{ color: s.color }}><s.icon /></div>
              </div>
            </div>
          ))}
        </div>

        {/* ─── تبويبات ─── */}
        <div className="flex gap-2 mb-5 flex-wrap">
          {[
            { id: "accounts", icon: <Icon.Users />, label: "إدارة الحسابات" },
            { id: "rate", icon: <Icon.Currency />, label: "سعر الصرف" },
            { id: "structure", icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="ml-0.5"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>, label: "هيكل المشروع" },
          ].map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`px-5 py-2.5 text-[13.5px] font-semibold border-none cursor-pointer rounded-lg transition-all duration-150 inline-flex items-center gap-1.5
                ${tab === t.id ? "bg-sky-500 text-white shadow-[0_4px_12px_rgba(14,165,233,0.3)]" : "bg-white/5 text-[#8892a4] shadow-none"}`}>
              {t.icon} {t.label}
            </button>
          ))}
        </div>

        {/* ═══ تبويب: إدارة الحسابات ═══ */}
        {tab === "accounts" && (
          <div className="bg-[#1a2035] rounded-2xl border border-white/[0.08] overflow-hidden">
            <div className="px-5 py-4 border-b border-white/[0.07] flex flex-wrap gap-2.5 items-center">
              <div className="relative flex-1 min-w-[140px]">
                <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[13px]">🔍</span>
                <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
                  placeholder="بحث بالاسم أو الهاتف..." className={`${inputCls} py-2 pr-8 pl-3`} />
              </div>
              <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}
                className={`${inputCls} py-2 px-3 flex-none cursor-pointer w-auto`}>
                <option value="all">كل الأدوار</option>
                {ROLES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
              </select>
              <Btn variant="ghost" size="sm" onClick={loadAccounts}><Icon.Refresh /> تحديث</Btn>
              <Btn variant="primary" size="sm" onClick={() => setModal("add")}><Icon.Plus /> إضافة حساب</Btn>
            </div>

            {accLoading ? (
              <div className="text-center py-12 text-[#8892a4]"><Spinner size={28} /><br /><br />جاري التحميل...</div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-12 text-[#8892a4] text-sm">
                {accounts.length === 0 ? "لا توجد حسابات بعد — أضف حساباً جديداً" : "لا توجد نتائج للبحث"}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse rtl min-w-[640px]">
                  <thead>
                    <tr className="bg-white/[0.03]">
                      {["اسم المستخدم", "رقم الهاتف", "الدور", "المحاولاتالمتبقية", "الفواتير", "الإجراءات"].map((h) => (
                        <th key={h} className="px-4 py-3 text-right text-xs font-bold text-[#8892a4] border-b border-white/[0.07] whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((acc, idx) => (
                      <tr key={acc.id}
                        className={`border-b border-white/5 transition-colors duration-150 hover:bg-blue-500/[0.06] ${idx % 2 ? "bg-white/[0.015]" : ""}`}>
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-2.5">
                            <div className="w-[34px] h-[34px] rounded-full shrink-0 flex items-center justify-center text-[13px] font-bold"
                              style={{ background: getRoleInfo(acc.role).bg, border: `1px solid ${getRoleInfo(acc.role).color}30`, color: getRoleInfo(acc.role).color }}>
                              {acc.username?.[0]?.toUpperCase() || "؟"}
                            </div>
                            <div>
                              <div className="text-sm font-semibold text-[#f0f2f8]">{acc.username}</div>
                              {(acc.officeName || acc.accountCode) && (
                                <div className="text-[11.5px] text-blue-400 font-medium mt-0.5">
                                  {acc.officeName || ""}
                                  {acc.officeName && acc.accountCode && " · "}
                                  {acc.accountCode ? `كود: ${acc.accountCode}` : ""}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3.5 text-[13px] text-slate-400 ltr text-right">{acc.phone || "—"}</td>
                        <td className="px-4 py-3.5"><RoleBadge role={acc.role} /></td>
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-2">
                            <AttemptsBadge attempts={acc.attempts || 0} />
                            <button title="تجديد المحاولات"
                              onClick={() => { setSelected(acc); setNewAttempts(""); setModal("attempts"); }}
                              className="bg-sky-500/[0.12] border-none cursor-pointer text-sky-500 p-[5px] rounded-md flex transition-colors duration-150 hover:bg-sky-500/25">
                              <Icon.Refresh />
                            </button>
                          </div>
                        </td>
                        <td className="px-4 py-3.5">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-[3px] rounded-full text-[11.5px] font-bold text-[#f0b429] bg-[#f0b429]/10 border border-[#f0b429]/25 whitespace-nowrap">
                            {acc.calculationsCount || 0} فاتورة
                          </span>
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="flex gap-1.5">
                            <Btn size="xs" variant="ghost" title="تعديل" onClick={() => { setSelected(acc); setModal("edit"); }}>
                              <Icon.Edit /> تعديل
                            </Btn>
                            {acc.role !== "owner" && (
                              <Btn size="xs" variant="danger" title="حذف" onClick={() => { setSelected(acc); setDeleteConfirm(""); setModal("delete"); }}>
                                <Icon.Trash /> حذف
                              </Btn>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            {!accLoading && accounts.length > 0 && (
              <div className="px-5 py-2.5 border-t border-white/[0.07] text-xs text-[#8892a4] text-left">
                عرض {filtered.length} من {accounts.length} حساب
              </div>
            )}
          </div>
        )}

        {/* ═══ تبويب: سعر الصرف ═══ */}
        {tab === "rate" && (
          <div className="bg-[#1a2035] rounded-2xl border border-white/[0.08] p-7 max-w-[480px]">
            <div className="flex items-center gap-2.5 mb-1.5">
              <div className="text-[#f0b429]"><Icon.Currency /></div>
              <h2 className="text-lg font-bold m-0">إدارة سعر الصرف</h2>
            </div>
            <p className="text-[13px] text-[#8892a4] mb-6 leading-relaxed">
              سعر الصرف الرسمي المستخدم في حساب فواتير أرضيات الحاويات الواردة.
            </p>
            {rateLoading ? <div className="text-center p-6 text-[#8892a4]"><Spinner /></div> : (
              <div className="flex flex-col gap-[18px]">
                <Field label="سعر الصرف الحالي  (ج.م / دولار)" icon={Icon.Currency}>
                  <div className="relative">
                    <input type="number" step="0.0001" min="0.1" value={rate} onChange={(e) => setRate(e.target.value)}
                      className="admin-input-gold w-full bg-[#0d1424] border-[1.5px] border-white/[0.12] rounded-[10px] text-[#f0b429] text-[22px] font-extrabold tracking-wide rtl outline-none py-3.5 px-4 pl-[52px] box-border" />
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[12.5px] text-[#8892a4] font-semibold pointer-events-none">ج.م / $</span>
                  </div>
                </Field>
                <Btn variant="gold" onClick={saveRate} disabled={rateSaving}>
                  {rateSaving ? <Spinner /> : <Icon.Check />}
                  {rateSaving ? "جاري الحفظ..." : "حفظ سعر الصرف"}
                </Btn>
              </div>
            )}

            {/* إدارة البيانات */}
            <div className="bg-[#1a2035] rounded-2xl border border-white/[0.08] p-5 mt-5 flex flex-col gap-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-red-400/[0.12] text-red-400 flex items-center justify-center"><Icon.Trash /></div>
                <div>
                  <h3 className="text-base font-bold m-0">إدارة البيانات</h3>
                  <p className="text-xs text-[#8892a4] mt-0.5">عمليات حساسة لإدارة قاعدة بيانات الحسابات.</p>
                </div>
              </div>
              <div className="p-4 bg-red-400/5 border border-red-400/10 rounded-xl flex items-center justify-between gap-4 flex-wrap">
                <div className="flex-1 min-w-[200px]">
                  <p className="text-[13px] font-semibold text-red-400 mb-1">مسح كافة البيانات المالية</p>
                  <p className="text-[11px] text-[#8892a4] m-0">سيتم حذف جميع الحسابات والمعاملات المالية. هذا الإجراء لا يمكن التراجع عنه.</p>
                </div>
                <Btn variant="danger" onClick={clearFinancialData} disabled={dataClearing}>
                  {dataClearing ? <Spinner /> : <Icon.Trash />}
                  {dataClearing ? "جاري المسح..." : "مسح كافة البيانات"}
                </Btn>
              </div>
            </div>
          </div>
        )}

        {/* ═══ تبويب: هيكل المشروع ═══ */}
        {tab === "structure" && (() => {
          const filteredFiles = PROJECT_FILES.filter((f) => {
            const matchType = structType === "all" || f.type === structType;
            const q = structSearch.toLowerCase();
            return matchType && (!q || f.name.toLowerCase().includes(q) || f.path.toLowerCase().includes(q) || f.desc.toLowerCase().includes(q));
          });
          return (
            <div className="bg-[#1a2035] rounded-2xl border border-white/[0.08] p-5 animate-slide-up">
              <div className="flex items-center gap-3 mb-2 border-b border-white/[0.07] pb-4">
                <div className="w-9 h-9 rounded-[10px] bg-blue-400/[0.12] text-blue-400 flex items-center justify-center">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
                  </svg>
                </div>
                <div>
                  <h2 className="text-[17px] font-bold m-0 text-[#f0f2f8]">دليل ملفات المشروع والـ APIs</h2>
                  <p className="text-xs text-[#8892a4] mt-1">مستند تفصيلي يستعرض الصفحات النشطة والـ APIs والمكتبات الأساسية.</p>
                </div>
              </div>

              <div className="flex flex-wrap gap-3 items-center justify-between mt-4 mb-5">
                <div className="relative flex-1 min-w-[200px]">
                  <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[13px]">🔍</span>
                  <input type="text" value={structSearch} onChange={(e) => setStructSearch(e.target.value)}
                    placeholder="ابحث باسم الملف أو المسار أو الفائدة..."
                    className={`${inputCls} py-2.5 pr-8 pl-3`} />
                  {structSearch && (
                    <button onClick={() => setStructSearch("")} className="absolute left-2.5 top-1/2 -translate-y-1/2 bg-transparent border-none text-[#8892a4] cursor-pointer text-sm">✕</button>
                  )}
                </div>
                <div className="flex gap-1.5 flex-wrap">
                  {[{ value: "all", label: "الكل" }, { value: "page", label: "الصفحات" }, { value: "api", label: "واجهات الـ API" }, { value: "core", label: "مكتبات ونماذج" }].map((t) => (
                    <button key={t.value} onClick={() => setStructType(t.value)}
                      className={`px-3.5 py-2 text-[12.5px] font-semibold border-none cursor-pointer rounded-lg transition-all duration-150
                        ${structType === t.value ? "bg-sky-500/[0.15] text-sky-400 border border-sky-500/30" : "bg-white/[0.03] text-[#8892a4] border border-white/[0.06]"}`}>
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              {filteredFiles.length === 0 ? (
                <div className="text-center py-10 text-[#8892a4] text-[13.5px]">لا توجد نتائج تطابق بحثك الحالي</div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredFiles.map((file, idx) => (
                    <div key={idx}
                      onClick={() => { if (navigator.clipboard) { navigator.clipboard.writeText(file.path); notify("تم نسخ المسار بنجاح"); } }}
                      className="bg-[#0d1424] rounded-xl p-4 border-[1.5px] border-white/[0.04] flex flex-col justify-between gap-3 transition-all duration-200 cursor-pointer relative overflow-hidden hover:border-blue-400/25 hover:-translate-y-0.5 hover:shadow-[0_6px_20px_rgba(0,0,0,0.3)]">
                      <div className="flex flex-col gap-2.5">
                        <div className="flex justify-between items-center">
                          <span className="px-2 py-[3px] rounded-md text-[11px] font-bold text-white"
                            style={{ background: file.badgeColor, boxShadow: `0 2px 8px ${file.badgeColor}25` }}>
                            {file.badge}
                          </span>
                          <span className="text-lg w-[30px] h-[30px] rounded-full bg-white/[0.04] flex items-center justify-center">{file.icon}</span>
                        </div>
                        <h3 className="text-[14.5px] font-bold text-[#f0f2f8] m-0">{file.name}</h3>
                        <p className="text-xs text-[#8892a4] leading-relaxed m-0 h-12 overflow-hidden"
                          style={{ display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical" }}>
                          {file.desc}
                        </p>
                      </div>
                      <div className="bg-white/[0.02] border border-white/5 rounded-md px-2.5 py-2 flex items-center justify-between gap-2 mt-1">
                        <code className={`text-[11px] font-mono ltr whitespace-nowrap overflow-hidden text-ellipsis flex-1 ${file.type === "api" ? "text-emerald-500" : "text-blue-400"}`}>
                          {file.path}
                        </code>
                        <span className="text-[11px] text-[#8892a4] flex items-center" title="نسخ المسار">📋</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })()}
      </div>

      {/* ═══ Modals ═══ */}
      <Modal open={modal === "add"} onClose={() => setModal(null)} title="إضافة حساب جديد">
        <AccountForm onSubmit={addAccount} onCancel={() => setModal(null)} isSaving={isSaving} />
      </Modal>
      <Modal open={modal === "edit"} onClose={() => setModal(null)} title="تعديل الحساب">
        {selected && <AccountForm initial={{ ...selected, password: "" }} onSubmit={editAccount} onCancel={() => setModal(null)} isSaving={isSaving} />}
      </Modal>
      <Modal open={modal === "delete"} onClose={() => setModal(null)} title="تأكيد الحذف">
        {selected && (
          <div>
            <div className="bg-red-400/[0.08] border border-red-400/20 rounded-[10px] px-4 py-3.5 mb-[18px]">
              <p className="m-0 text-sm text-red-400 leading-relaxed">
                هل أنت متأكد من حذف حساب <strong className="text-[#f0f2f8]">«{selected.username}»</strong>؟<br />
                <span className="text-[12.5px] text-[#8892a4]">هذا الإجراء لا يمكن التراجع عنه.</span>
              </p>
            </div>
            <p className="text-[13px] text-[#8892a4] mb-2.5">
              اكتب <strong className="text-[#f0f2f8]">{selected.username}</strong> للتأكيد:
            </p>
            <input type="text" value={deleteConfirm} onChange={(e) => setDeleteConfirm(e.target.value)} placeholder={selected.username}
              className="admin-input-danger w-full bg-[#0d1424] border-[1.5px] border-red-400/30 rounded-lg text-[#f0f2f8] text-sm rtl outline-none py-2.5 px-3 mb-[18px] box-border" />
            <div className="flex gap-2.5 justify-end">
              <Btn variant="ghost" onClick={() => setModal(null)}>إلغاء</Btn>
              <Btn variant="danger" disabled={deleteConfirm !== selected.username || isSaving} onClick={deleteAccount}>
                {isSaving ? <Spinner /> : <Icon.Trash />}
                {isSaving ? "جاري الحذف..." : "تأكيد الحذف"}
              </Btn>
            </div>
          </div>
        )}
      </Modal>
      <Modal open={modal === "attempts"} onClose={() => setModal(null)} title="تجديد المحاولات">
        {selected && (
          <div>
            <div className="bg-blue-400/[0.07] border border-blue-400/20 rounded-[10px] px-4 py-3.5 mb-5 flex justify-between items-center">
              <div>
                <p className="m-0 text-sm font-semibold text-[#f0f2f8]">{selected.username}</p>
                <p className="mt-0.5 m-0"><RoleBadge role={selected.role} /></p>
              </div>
              <div className="text-left">
                <p className="m-0 text-[11px] text-[#8892a4]">المحاولات الحالية</p>
                <AttemptsBadge attempts={selected.attempts || 0} />
              </div>
            </div>
            <Field label="عدد المحاولات الجديدة" icon={Icon.Hash}>
              <Input type="number" min="0" step="1" value={newAttempts} onChange={(e) => setNewAttempts(e.target.value)} placeholder="مثال: 10" suffix="محاولة" />
            </Field>
            <div className="flex gap-1.5 mt-2.5 flex-wrap">
              {[5, 10, 20, 50].map((n) => (
                <button key={n} onClick={() => setNewAttempts(String(n))}
                  className={`px-3 py-[5px] text-xs font-semibold rounded-md cursor-pointer border transition-all duration-150
                    ${newAttempts == n ? "bg-sky-500/25 text-blue-400 border-sky-500/50" : "bg-white/[0.06] text-[#8892a4] border-white/10"}`}>
                  +{n}
                </button>
              ))}
            </div>
            <div className="flex gap-2.5 justify-end mt-5">
              <Btn variant="ghost" onClick={() => setModal(null)}>إلغاء</Btn>
              <Btn variant="success" onClick={renewAttempts} disabled={isSaving || !newAttempts}>
                {isSaving ? <Spinner /> : <Icon.Check />}
                {isSaving ? "جاري المنح..." : "منح المحاولات"}
              </Btn>
            </div>
          </div>
        )}
      </Modal>

      <Toast msg={toast} onDone={() => setToast({ text: "", type: "" })} />
    </div>
  );
}
