"use client";

import { useState, useEffect } from "react";
import { Icon } from "@/components/Icons";
import { ROLES, getRoleInfo, EMPTY_FORM } from "@/lib/adminConstants";

import ReportsTab from "@/components/admin/ReportsTab";
import ActivityLogTab from "@/components/admin/ActivityLogTab";
import NavisInvoices from "@/components/admin/NavisInvoices";
import BackupFilesList from "@/components/admin/BackupFilesList";
import { useAccountsStore } from "@/store/useAccountsStore";

// ─── Input Field ────────────────────────────────────────────────────────
function Field({ label, icon: IconComp, error, children }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
        {IconComp && <span className="text-blue-400"><IconComp /></span>}
        {label}
      </label>
      {children}
      {error && <span className="text-[11px] text-red-400">{error}</span>}
    </div>
  );
}

// ─── Input Field ────────────────────────────────────────────────────────────
function Input({ value, onChange, placeholder, type = "text", step, min, suffix, focusClass = "admin-input", extraPadLeft }) {
  return (
    <div className="relative flex items-center">
      <input
        className={`no-spinner ${focusClass} w-full bg-slate-950 border-[1.5px] border-white/10 rounded-lg text-slate-100 text-sm rtl outline-none transition-colors duration-200 py-2.5 ${suffix ? "pl-11" : "pl-3"} pr-3`}
        type={type} step={step} min={min}
        value={value} onChange={onChange} placeholder={placeholder}
        style={extraPadLeft ? { paddingLeft: extraPadLeft } : undefined}
      />
      {suffix && (
        <span className="absolute left-3 text-xs text-slate-400 pointer-events-none">{suffix}</span>
      )}
    </div>
  );
}

// ─── Main Button ─────────────────────────────────────────────────────────────────
const BTN_BASE = "font-semibold text-white border-none rounded-[7px] inline-flex items-center gap-1.5 transition-all duration-150 whitespace-nowrap disabled:opacity-60 disabled:cursor-not-allowed";
const VARIANTS = {
  primary: "bg-sky-500 shadow-[0_4px_12px_rgba(14,165,233,0.3)] hover:bg-sky-600 active:scale-[0.97]",
  success: "bg-emerald-600 shadow-[0_4px_12px_rgba(5,150,105,0.3)] hover:bg-emerald-700 active:scale-[0.97]",
  danger: "bg-red-600 shadow-[0_4px_12px_rgba(220,38,38,0.3)] hover:bg-red-700 active:scale-[0.97]",
  ghost: "bg-white/[0.06] shadow-none hover:bg-white/[0.12] active:scale-[0.97]",
  gold: "bg-amber-600 shadow-[0_4px_12px_rgba(217,119,6,0.3)] hover:bg-amber-700 active:scale-[0.97]",
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
        className="bg-slate-900 border border-white/10 rounded-2xl px-6 py-7 w-full max-w-[480px] rtl shadow-[0_24px_60px_rgba(0,0,0,0.5)] animate-slide-up max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-[22px]">
          <h2 className="text-lg font-bold text-slate-100 m-0">{title}</h2>
          <button onClick={onClose} className="bg-transparent border-none text-slate-400 cursor-pointer p-1 flex">
            <Icon.Close />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

// ─── Role Badge ───────────────────────────────────────────────────────────────
function RoleBadge({ role }) {
  const r = getRoleInfo(role);
  return (
    <span className="px-2.5 py-[3px] rounded-full text-[11.5px] font-semibold whitespace-nowrap"
      style={{ color: r.color, background: r.bg, border: `1px solid ${r.color}28` }}>
      {r.label}
    </span>
  );
}

// ─── Attempts Badge ───────────────────────────────────────────────────────────
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

function formatDateTime(value) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return `${date.toLocaleDateString("ar-EG", { year: "numeric", month: "short", day: "numeric" })} - ${date.toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit" })}`;
}

function DetailRow({ label, children }) {
  return (
    <div className="flex items-start justify-between gap-3 py-2.5 border-b border-white/[0.06] last:border-b-0">
      <span className="text-[12px] text-slate-500 shrink-0">{label}</span>
      <div className="text-[13px] text-slate-200 font-semibold text-left break-words min-w-0">{children || "—"}</div>
    </div>
  );
}

function AccountDetails({ account }) {
  if (!account) return null;
  return (
    <div className="flex flex-col gap-4">
      <div className="bg-slate-950/60 border border-white/[0.08] rounded-xl px-4 py-3.5">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="m-0 text-base font-bold text-slate-100 break-words">{account.username}</p>
            <p className="m-0 mt-1 text-[11.5px] text-slate-500">بيانات الحساب المسجلة في النظام</p>
          </div>
          <RoleBadge role={account.role} />
        </div>
      </div>

      <div className="bg-white/[0.03] border border-white/[0.07] rounded-xl px-4">
        <DetailRow label="اسم المستخدم">{account.username}</DetailRow>
        <DetailRow label="الدور"><RoleBadge role={account.role} /></DetailRow>
        <DetailRow label="رقم الهاتف">
          <span dir="ltr" className="block">{account.phone || "—"}</span>
        </DetailRow>
        <DetailRow label="اسم المكتب">{account.officeName || "—"}</DetailRow>
        <DetailRow label="كود الحساب">{account.accountCode || "—"}</DetailRow>
        <DetailRow label="عمليات الحساب">{account.calculationsCount || 0} عملية</DetailRow>
        {/* <DetailRow label="المحاولات">{account.attempts ?? "غير محددة"}</DetailRow> */}
        <DetailRow label="حالة الحساب">{account.isActive === false ? "غير مفعل" : "مفعل"}</DetailRow>
        <DetailRow label="آخر دخول">{formatDateTime(account.lastLogin)}</DetailRow>
        <DetailRow label="آخر فاتورة">{formatDateTime(account.lastCalculation)}</DetailRow>
        <DetailRow label="آخر كشف حساب">{formatDateTime(account.lastBalanceView)}</DetailRow>
        <DetailRow label="عدد فتح كشف الحساب">{account.balanceViewsCount ? `${account.balanceViewsCount} مرة` : "لم يفتح بعد"}</DetailRow>
        <DetailRow label="تاريخ الإنشاء">{formatDateTime(account.createdAt)}</DetailRow>
        <DetailRow label="آخر تحديث">{formatDateTime(account.updatedAt)}</DetailRow>
        {/* <DetailRow label="معرف الحساب">{account.id || "—"}</DetailRow> */}
      </div>
    </div>
  );
}

// ─── Account Form ─────────────────────────────────────────────────────────────
function AccountForm({ initial, onSubmit, onCancel, isSaving, visibleRoles }) {
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
    // if (!form.attempts || form.attempts < 0) e.attempts = "قيمة غير صحيحة";
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
            className="admin-input w-full bg-slate-950 border-[1.5px] border-white/10 rounded-lg text-slate-100 text-sm rtl outline-none py-2.5 px-3 pl-[38px] box-border" />
          <button type="button" onClick={() => setShowPass((v) => !v)}
            className="absolute left-2.5 top-1/2 -translate-y-1/2 bg-transparent border-none text-slate-400 cursor-pointer flex">
            {showPass ? <Icon.EyeOff /> : <Icon.Eye />}
          </button>
        </div>
      </Field>

      {(!initial || form.password) && (
        <p className="text-[11px] text-amber-400/80 bg-amber-400/[0.06] border border-amber-400/15 rounded-lg px-3 py-2 leading-relaxed -mt-1">
          ⚠️ سجّل كلمة المرور بدقة — يجب على المستخدم إدخالها مطابقة تماماً (حرفاً حرفاً) عند تسجيل الدخول.
        </p>
      )}

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
          className="admin-input w-full bg-slate-950 border-[1.5px] border-white/10 rounded-lg text-slate-100 text-sm rtl outline-none py-2.5 px-3 cursor-pointer">
          {(visibleRoles || ROLES).map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
        </select>
      </Field>

      {/* <Field label="عدد المحاولات المتاحة" icon={Icon.Hash} error={errors.attempts}>
        <Input type="number" min="0" step="1" value={form.attempts} onChange={set("attempts")} placeholder="5" suffix="محاولة" />
      </Field> */}

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

// ─── Loading Spinner ─────────────────────────────────────────────────────────────
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

// ─── Admin Page ──────────────────────────────────────────────────────────
export default function AdminPage() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [userRole, setUserRole] = useState(null);
  const [authLoaded, setAuthLoaded] = useState(false);
  const [rate, setRate] = useState("");
  const [rateUpdatedAt, setRateUpdatedAt] = useState(null);
  const [rateHistory, setRateHistory] = useState([]);
  const [rateLoading, setRL] = useState(true);
  const [rateSaving, setRS] = useState(false);
  const accounts = useAccountsStore((s) => s.accounts);
  const accLoading = useAccountsStore((s) => s.accLoading);
  const fetchAccounts = useAccountsStore((s) => s.loadAccounts);
  const [tab, setTab] = useState("accounts");
  const [modal, setModal] = useState(null);
  const [selected, setSelected] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [toast, setToast] = useState({ text: "", type: "" });
  const [newAttempts, setNewAttempts] = useState("");
  const [dataClearing, setDataClearing] = useState(false);
  const [ledgerClearing, setLedgerClearing] = useState(false);
  const [ledgerClientCode, setLedgerClientCode] = useState("");
  const [ledgerClearConfirm, setLedgerClearConfirm] = useState("");
  const [ledgerAccountName, setLedgerAccountName] = useState(null); // null=لم يُبحث, ""=غير موجود, "..."=اسم الحساب
  const [ledgerNameLoading, setLedgerNameLoading] = useState(false);
  const [statsClearing, setStatsClearing] = useState(false);
  const [statsTargetClient, setStatsTargetClient] = useState("");
  const [statsSearchUser, setStatsSearchUser] = useState("");
  const [statsTargetType, setStatsTargetType] = useState("calculationsCount"); // "calculationsCount" | "lastCalculation" | "lastBalanceView"
  const [statsClearAllModal, setStatsClearAllModal] = useState(null); // null or targetType
  const [statsClearAllConfirm, setStatsClearAllConfirm] = useState("");
  const [dataSubTab, setDataSubTab] = useState("backups"); // "backups" | "stats" | "danger"
  const [statsMode, setStatsMode] = useState("single"); // "single" | "bulk"
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("client");
  const [pwaFilter, setPwaFilter] = useState("all");
  const [notificationsFilter, setNotificationsFilter] = useState("all");
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [clearConfirm, setClearConfirm] = useState("");
  const [sortBy, setSortBy] = useState("calculationsCount");
  const [sortDir, setSortDir] = useState("desc");
  // ─── Employee Availability State ────────────────────────────────────────────
  const [empList, setEmpList] = useState([]);
  const [empLoading, setEmpLoading] = useState(false);
  const [empForm, setEmpForm] = useState({ name: "", phone: "", role: "", isActive: true, sortOrder: 0 });
  const [empModal, setEmpModal] = useState(null); // "addEmp" | "editEmp" | "deleteEmp" | null
  const [empSelected, setEmpSelected] = useState(null);
  const [empDeleteConfirm, setEmpDeleteConfirm] = useState("");
  const [empSaving, setEmpSaving] = useState(false);

  const notify = (text, type = "success") => setToast({ text, type });

  const handleSort = (key) => {
    if (sortBy === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortBy(key); setSortDir("desc"); }
  };

  const COLUMNS = [
    { key: "index", label: "م", sortable: false },
    { key: "username", label: "الاسم", sortable: true },
    { key: "accountCode", label: "الكود", sortable: true },
    { key: "role", label: "الدور", sortable: true },
    { key: "appStatus", label: "مثبت/ الإشعارات", sortable: false },
    { key: "calculationsCount", label: "الحساب", sortable: true },
    { key: "lastCalculation", label: "آخر فاتورة", sortable: true },
    { key: "lastBalanceView", label: "صفحة الحساب", sortable: true },
    { key: "actions", label: "الإجراءات", sortable: false },
  ];

  useEffect(() => {
    fetch("/api/auth/me").then((res) => res.json()).then((data) => {
      if (data.success && (data.user.role === "admin" || data.user.role === "owner")) { setIsAdmin(true); setUserRole(data.user.role); }
      else window.location.href = "/login";
    }).catch(() => { window.location.href = "/login"; }).finally(() => setAuthLoaded(true));
  }, []);

  useEffect(() => {
    fetch("/api/settings").then((r) => r.json()).then((d) => {
      if (d.success) {
        setRate(d.exchangeRate);
        setRateUpdatedAt(d.updatedAt || null);
        if (d.history) setRateHistory(d.history);
      }
    })
      .catch(() => { }).finally(() => setRL(false));
  }, []);

  // ─── Fetch Accounts Data ──────────────────────────────────────────────────
  useEffect(() => {
    if (accounts.length === 0) fetchAccounts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ─── Employee CRUD ─────────────────────────────────────────────────────────
  const loadEmployees = () => {
    setEmpLoading(true);
    fetch("/api/employees").then(r => r.json()).then(d => { if (d.success) setEmpList(d.employees); })
      .catch(() => { }).finally(() => setEmpLoading(false));
  };

  const addEmployee = async () => {
    if (!empForm.name.trim()) return notify("اسم الموظف مطلوب", "error");
    if (!empForm.phone.trim() || !/^01[0-9]{9}$/.test(empForm.phone.trim())) return notify("رقم الهاتف غير صحيح", "error");
    if (!empForm.role.trim()) return notify("المسمى الوظيفي مطلوب", "error");
    setEmpSaving(true);
    try {
      const res = await fetch("/api/employees", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(empForm) });
      const d = await res.json();
      d.success ? (notify("تم إضافة الموظف بنجاح"), setEmpModal(null), setEmpForm({ name: "", phone: "", role: "", isActive: true, sortOrder: 0 }), loadEmployees()) : notify(d.error || "خطأ", "error");
    } catch { notify("فشل الاتصال", "error"); } finally { setEmpSaving(false); }
  };

  const editEmployee = async () => {
    if (!empForm.name.trim()) return notify("اسم الموظف مطلوب", "error");
    if (!empForm.phone.trim() || !/^01[0-9]{9}$/.test(empForm.phone.trim())) return notify("رقم الهاتف غير صحيح", "error");
    if (!empForm.role.trim()) return notify("المسمى الوظيفي مطلوب", "error");
    setEmpSaving(true);
    try {
      const res = await fetch(`/api/employees/${empSelected._id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(empForm) });
      const d = await res.json();
      d.success ? (notify("تم تحديث بيانات الموظف"), setEmpModal(null), loadEmployees()) : notify(d.error || "خطأ", "error");
    } catch { notify("فشل الاتصال", "error"); } finally { setEmpSaving(false); }
  };

  const deleteEmployee = async () => {
    setEmpSaving(true);
    try {
      const res = await fetch(`/api/employees/${empSelected._id}`, { method: "DELETE" });
      const d = await res.json();
      d.success ? (notify("تم حذف الموظف بنجاح"), setEmpModal(null), setEmpDeleteConfirm(""), loadEmployees()) : notify(d.error || "خطأ", "error");
    } catch { notify("فشل الاتصال", "error"); } finally { setEmpSaving(false); }
  };

  const toggleEmployeeActive = async (emp) => {
    try {
      const res = await fetch(`/api/employees/${emp._id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ isActive: !emp.isActive }) });
      const d = await res.json();
      d.success ? (notify(emp.isActive ? `تم إلغاء تفعيل ${emp.name}` : `تم تفعيل ${emp.name}`), loadEmployees()) : notify(d.error || "خطأ", "error");
    } catch { notify("فشل الاتصال", "error"); }
  };

  useEffect(() => {
    (async () => {
      setEmpLoading(true);
      try {
        const res = await fetch("/api/employees");
        const d = await res.json();
        if (d.success) setEmpList(d.employees);
      } catch { /* ignore */ }
      finally { setEmpLoading(false); }
    })();
  }, []);

  const cleanRateInput = (raw) => {
    if (!raw) return "";
    let val = String(raw)
      .replace(/[\u200B-\u200D\uFEFF\u00A0\u200E\u200F]/g, "") // إزالة الرموز الخفية ورموز اتجاه النص
      .replace(/\s+/g, "") // إزالة جميع أنواع المسافات
      .replace(/[٠-٩]/g, (d) => "٠١٢٣٤٥٦٧٨٩".indexOf(d)) // تحويل الأرقام العربية
      .replace(/,/g, ".") // تحويل الفاصلة إلى نقطة
      .replace(/[^0-9.]/g, ""); // حذف أي أحرف أو رموز أخرى
    const parts = val.split(".");
    if (parts.length > 2) {
      val = parts[0] + "." + parts.slice(1).join("");
    }
    return val;
  };

  const saveRate = async () => {
    const cleaned = cleanRateInput(rate);
    const num = parseFloat(cleaned);
    if (!cleaned || isNaN(num) || num <= 0) {
      notify("يرجى إدخال سعر صرف صحيح", "error");
      return;
    }
    setRate(cleaned);
    setRS(true);
    try {
      const res = await fetch("/api/settings", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ exchangeRate: num }) });
      const d = await res.json();
      if (d.success) {
        notify("تم حفظ سعر الصرف بنجاح");
        setRateUpdatedAt(d.updatedAt || null);
        if (d.history) setRateHistory(d.history);
      } else {
        notify(d.error || "خطأ", "error");
      }
    } catch { notify("فشل الاتصال بالخادم", "error"); } finally { setRS(false); }
  };

  const addAccount = async (form) => {
    setIsSaving(true);
    try {
      const res = await fetch("/api/accounts", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      const d = await res.json();
      if (d.success) { notify("تم إضافة الحساب بنجاح"); setModal(null); fetchAccounts(); }
      else notify(d.error || "خطأ في الإضافة", "error");
    } catch { notify("فشل الاتصال", "error"); } finally { setIsSaving(false); }
  };

  const editAccount = async (form) => {
    setIsSaving(true);
    try {
      const res = await fetch(`/api/accounts/${selected.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      const d = await res.json();
      if (d.success) { notify("تم تحديث الحساب"); setModal(null); fetchAccounts(); }
      else notify(d.error || "خطأ", "error");
    } catch { notify("فشل الاتصال", "error"); } finally { setIsSaving(false); }
  };

  const deleteAccount = async () => {
    setIsSaving(true);
    try {
      const res = await fetch(`/api/accounts/${selected.id}`, { method: "DELETE" });
      const d = await res.json();
      if (d.success) { notify("تم حذف الحساب"); setModal(null); setDeleteConfirm(""); fetchAccounts(); }
      else notify(d.error || "خطأ", "error");
    } catch { notify("فشل الاتصال", "error"); } finally { setIsSaving(false); }
  };

  // Attempts renewal (Temporarily suspended)
  /*
  const renewAttempts = async () => {
    const n = Number(newAttempts);
    if (!n || n < 0) return notify("أدخل رقماً صحيحاً", "error");
    setIsSaving(true);
    try {
      const res = await fetch(`/api/accounts/${selected.id}/attempts`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ attempts: n }) });
      const d = await res.json();
      if (d.success) { notify(`تم منح ${n} محاولات للمستخدم ${selected.username}`); setModal(null); setNewAttempts(""); fetchAccounts(); }
      else notify(d.error || "خطأ", "error");
    } catch { notify("فشل الاتصال", "error"); } finally { setIsSaving(false); }
  };
  */

  const clearFinancialData = async () => {
    setDataClearing(true);
    try {
      const res = await fetch('/api/data', { method: 'DELETE' });
      const d = await res.json();
      if (d.success) { notify("تم مسح جميع البيانات المالية بنجاح"); setModal(null); setClearConfirm(""); }
      else notify(d.error || "خطأ أثناء مسح البيانات", "error");
    } catch { notify("فشل الاتصال بالخادم", "error"); } finally { setDataClearing(false); }
  };

  const deleteClientLedger = async () => {
    const code = ledgerClientCode.trim();
    if (!code) return notify("يرجى إدخال كود العميل", "error");
    setLedgerClearing(true);
    try {
      const res = await fetch(`/api/data/ledger?accountCode=${encodeURIComponent(code)}`, { method: "DELETE" });
      const d = await res.json();
      if (d.success) {
        notify(d.message || `تم حذف سجل العميل ${code}`);
        setLedgerClientCode("");
      } else {
        notify(d.error || "خطأ أثناء حذف السجل", "error");
      }
    } catch {
      notify("فشل الاتصال بالخادم", "error");
    } finally {
      setLedgerClearing(false);
    }
  };

  const clearAllLedger = async () => {
    setLedgerClearing(true);
    try {
      const res = await fetch("/api/data/ledger", { method: "DELETE" });
      const d = await res.json();
      if (d.success) {
        notify(d.message || "تم مسح حركة الرصيد التاريخية لجميع العملاء");
        setModal(null);
        setLedgerClearConfirm("");
      } else {
        notify(d.error || "خطأ أثناء مسح السجلات", "error");
      }
    } catch {
      notify("فشل الاتصال بالخادم", "error");
    } finally {
      setLedgerClearing(false);
    }
  };

  const deleteStatsForClient = async (target, userId) => {
    if (!target || !userId) return;
    setStatsClearing(true);
    try {
      const res = await fetch(`/api/accounts/stats?target=${encodeURIComponent(target)}&userId=${encodeURIComponent(userId)}`, { method: "DELETE" });
      const d = await res.json();
      if (d.success) {
        notify(d.message || "تم حذف البيانات بنجاح");
        fetchAccounts(true);
      } else {
        notify(d.error || "خطأ أثناء الحذف", "error");
      }
    } catch {
      notify("فشل الاتصال بالخادم", "error");
    } finally {
      setStatsClearing(false);
    }
  };

  const clearAllStats = async (target) => {
    if (!target) return;
    setStatsClearing(true);
    try {
      const res = await fetch(`/api/accounts/stats?target=${encodeURIComponent(target)}`, { method: "DELETE" });
      const d = await res.json();
      if (d.success) {
        notify(d.message || "تم مسح البيانات لجميع العملاء بنجاح");
        setStatsClearAllModal(null);
        setStatsClearAllConfirm("");
        fetchAccounts(true);
      } else {
        notify(d.error || "خطأ أثناء مسح البيانات", "error");
      }
    } catch {
      notify("فشل الاتصال بالخادم", "error");
    } finally {
      setStatsClearing(false);
    }
  };

  // ─── Ledger account name lookup (debounced) ─────────────────────────────────
  useEffect(() => {
    const code = ledgerClientCode.trim();
    const timer = setTimeout(() => {
      if (!code) { setLedgerAccountName(null); setLedgerNameLoading(false); return; }
      setLedgerNameLoading(true);
      fetch(`/api/data/${encodeURIComponent(code)}`)
        .then((r) => r.json())
        .then((d) => setLedgerAccountName(d.success ? d.accountName : ""))
        .catch(() => setLedgerAccountName(""))
        .finally(() => setLedgerNameLoading(false));
    }, 400);
    return () => clearTimeout(timer);
  }, [ledgerClientCode]);

  const filtered = accounts.filter((a) => {
    if (userRole !== "owner" && a.role === "owner") return false;
    const matchRole = roleFilter === "all" || a.role === roleFilter;
    const matchPwa = pwaFilter === "all" ||
      (pwaFilter === "installed" && a.isPwaInstalled) ||
      (pwaFilter === "not-installed" && !a.isPwaInstalled);
    const matchNotifications = notificationsFilter === "all" ||
      (notificationsFilter === "enabled" && a.hasNotifications) ||
      (notificationsFilter === "disabled" && !a.hasNotifications);
    const q = search.toLowerCase();
    const matchSearch = !q || a.username.toLowerCase().includes(q) || (a.phone || "").includes(q) || (a.officeName || "").toLowerCase().includes(q) || (a.accountCode && a.accountCode.toString().includes(q));
    return matchRole && matchPwa && matchNotifications && matchSearch;
  }).sort((a, b) => {
    let va, vb;
    switch (sortBy) {
      case "username": va = a.username || ""; vb = b.username || ""; break;
      case "accountCode": va = Number(a.accountCode) || 0; vb = Number(b.accountCode) || 0; break;
      case "role": va = a.role || ""; vb = b.role || ""; break;
      case "calculationsCount": va = a.calculationsCount || 0; vb = b.calculationsCount || 0; break;
      case "lastCalculation": va = a.lastCalculation ? new Date(a.lastCalculation).getTime() : 0; vb = b.lastCalculation ? new Date(b.lastCalculation).getTime() : 0; break;
      case "lastBalanceView": va = a.lastBalanceView ? new Date(a.lastBalanceView).getTime() : 0; vb = b.lastBalanceView ? new Date(b.lastBalanceView).getTime() : 0; break;
      case "lastLogin": va = a.lastLogin ? new Date(a.lastLogin).getTime() : 0; vb = b.lastLogin ? new Date(b.lastLogin).getTime() : 0; break;
      default: return 0;
    }
    if (typeof va === "string") return sortDir === "asc" ? va.localeCompare(vb, "ar") : vb.localeCompare(va, "ar");
    return sortDir === "asc" ? va - vb : vb - va;
  });

  const clientAccounts = accounts.filter((a) => a.role === "client");
  const stats = {
    clients: clientAccounts.length,
    engagedClients: clientAccounts.filter((a) => (a.calculationsCount || 0) > 0).length,
    unusedClients: clientAccounts.filter((a) => (a.calculationsCount || 0) === 0).length,
    totalCalculations: accounts.reduce((sum, a) => sum + (a.calculationsCount || 0), 0),
  };

  if (!authLoaded) return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center"><Spinner size={40} /></div>
  );
  if (!isAdmin) return null;

  const inputCls = "admin-input w-full max-w-full min-w-0 box-border bg-slate-950 border-[1.5px] border-white/10 rounded-lg text-slate-100 text-sm rtl outline-none transition-colors duration-200";

  return (
    <div dir="rtl" lang="ar" className="min-h-screen bg-slate-950 font-sans text-slate-100">
      <style>{`
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 4px; }
        select option { background: #0f172a; }
      `}</style>



      <div className="max-w-[960px] mx-auto px-4 py-6">
        {/* ─── Page Header ─── */}
        <div className="mb-7">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-2.5 md:gap-2.5 mb-1">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-500 to-indigo-400 flex items-center justify-center shadow-[0_4px_16px_rgba(14,165,233,0.3)] shrink-0">
                <Icon.Shield />
              </div>
              <div>
                <h1 className="text-[22px] font-extrabold m-0 text-slate-100">لوحة الإدارة</h1>
                <p className="text-[12.5px] text-slate-400 m-0">مؤشرات اعتماد العملاء على حاسبة أرضيات الحاويات</p>
              </div>
            </div>
          </div>
        </div>

        {/* ─── Statistics Cards ─── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mb-6">
          {[
            { label: "عملاء مسجلون", value: stats.clients, color: "#60a5fa", icon: Icon.User, unit: "عميل" },
            { label: "اعتمدوا على الحاسبة", value: stats.engagedClients, color: "#34d399", icon: Icon.Check, unit: "عميل" },
            { label: "لم يستخدموها بعد", value: stats.unusedClients, color: "#f87171", icon: Icon.Hash, unit: "عميل" },
            { label: "عمليات حساب الفواتير", value: stats.totalCalculations, color: "#f0b429", icon: Icon.Chart, unit: "عملية" },
          ].map((s, i) => (
            <div key={i} className="bg-slate-900 rounded-[10px] px-3.5 py-3 border border-white/[0.07] shadow-[0_2px_12px_rgba(0,0,0,0.2)]">
              <div className="flex justify-between items-start gap-2">
                <div className="min-w-0 flex-1">
                  <p className="text-[10.5px] text-slate-400 mb-1 font-medium leading-tight break-words">{s.label}</p>
                  <p className="text-2xl font-extrabold m-0 leading-none" style={{ color: s.color }}>
                    {s.value}
                    {s.unit && <span className="text-[11px] font-semibold text-slate-500 mr-1">{s.unit}</span>}
                  </p>
                </div>
                <div className="opacity-60 shrink-0 scale-[0.85]" style={{ color: s.color }}><s.icon /></div>
              </div>
            </div>
          ))}
        </div>

        {/* ─── Taps ─── */}
        <div className="flex gap-2 mb-5 overflow-x-auto pb-1 -mx-1 px-1" role="tablist">
          {[
            { id: "accounts", icon: <Icon.Users />, label: "إدارة الحسابات" },
            { id: "reports", icon: <Icon.Chart />, label: "التقارير" },
            { id: "rate", icon: <Icon.Currency />, label: "سعر الصرف" },
            { id: "employees", icon: <Icon.Users />, label: "الموظفين" },
            ...(userRole === "owner" ? [
              { id: "navis", icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /></svg>, label: "فواتير Navis" },
              { id: "activity", icon: <Icon.Shield size={15} />, label: "سجل الأحداث" },
              { id: "data", icon: <Icon.Structure className="ml-0.5" />, label: "بيانات المشروع" },
            ] : []),
          ].map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} role="tab" aria-selected={tab === t.id}
              className={`shrink-0 whitespace-nowrap px-5 py-2.5 text-[13.5px] font-semibold border-none cursor-pointer rounded-lg transition-all duration-150 inline-flex items-center gap-1.5
                ${tab === t.id ? "bg-sky-500 text-white shadow-[0_4px_12px_rgba(14,165,233,0.3)]" : "bg-white/5 text-slate-400 shadow-none"}`}>
              {t.icon} {t.label}
            </button>
          ))}
        </div>

        {/* ═══ Accounts Management ═══ */}
        {tab === "accounts" && (
          <div className="bg-slate-900 rounded-2xl border border-white/[0.08] overflow-hidden">
            <div className="px-5 py-4 border-b border-white/[0.07]">
              <div className="relative flex-1 min-w-[140px] mb-2">
                <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[13px]">🔍</span>
                <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
                  placeholder="بحث بالاسم، الهاتف أو كود الحساب..." className={`${inputCls} py-2 pr-8 pl-3`} />
              </div>
              <div className="flex gap-2.5 mb-2">
                <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}
                  className={`${inputCls} py-2 px-3 flex-1 cursor-pointer w-full`}>
                  <option value="all">كل الأدوار</option>
                  {(userRole === "owner" ? ROLES : ROLES.filter(r => r.value !== "owner")).map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
                </select>
                <select value={pwaFilter} onChange={(e) => setPwaFilter(e.target.value)}
                  className={`${inputCls} py-2 px-3 flex-1 cursor-pointer w-full`}>
                  <option value="all">كل حالات PWA</option>
                  <option value="installed">مثبت 📱</option>
                  <option value="not-installed">غير مثبت ❌</option>
                </select>
                <select value={notificationsFilter} onChange={(e) => setNotificationsFilter(e.target.value)}
                  className={`${inputCls} py-2 px-3 flex-1 cursor-pointer w-full`}>
                  <option value="all">كل حالات الإشعارات</option>
                  <option value="enabled">مفعل 🔔</option>
                  <option value="disabled">غير مفعل 🔕</option>
                </select>
              </div>
              <Btn variant="ghost" size="sm" onClick={() => fetchAccounts()}><Icon.Refresh /> تحديث</Btn>
              <Btn variant="primary" size="sm" onClick={() => setModal("add")}><Icon.Plus /> إضافة حساب</Btn>
            </div>

            {accLoading ? (
              <div className="text-center py-12 text-slate-400"><Spinner size={28} /><br /><br />جاري التحميل...</div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-12 text-slate-400 text-sm">
                {accounts.length === 0 ? "لا توجد حسابات بعد — أضف حساباً جديداً" : "لا توجد نتائج للبحث"}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse rtl min-w-[700px]">
                  <thead>
                    <tr className="bg-white/[0.03]">
                      {COLUMNS.map((col) => (
                        <th key={col.key}
                          onClick={col.sortable ? () => handleSort(col.key) : undefined}
                          className={`px-4 py-3 text-right text-xs font-bold text-slate-400 border-b border-white/[0.07] whitespace-nowrap select-none ${col.sortable ? "cursor-pointer hover:text-slate-200 transition-colors duration-150" : ""}`}>
                          <span className="inline-flex items-center gap-1">
                            {col.label}
                            {col.sortable && sortBy === col.key && (
                              <span className="text-sky-400 text-[10px]">{sortDir === "asc" ? "▲" : "▼"}</span>
                            )}
                          </span>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((acc, idx) => (
                      <tr key={acc.id}
                        className={`border-b border-white/5 transition-colors duration-150 hover:bg-blue-500/[0.06] ${idx % 2 ? "bg-white/[0.015]" : ""}`}>
                        <td className="px-4 py-3.5 text-xs text-slate-400 font-semibold text-center w-12">
                          {idx + 1}
                        </td>
                        <td className="px-4 py-3.5">
                          <button
                            type="button"
                            onClick={() => { setSelected(acc); setModal("details"); }}
                            className="bg-transparent border-none p-0 m-0 text-sm font-semibold text-slate-100 cursor-pointer hover:text-sky-400 transition-colors duration-150 text-right"
                            title="عرض تفاصيل الحساب"
                          >
                            {acc.username}
                          </button>
                        </td>
                        <td className="px-4 py-3.5">
                          {acc.accountCode ? (
                            <span className="font-mono text-xs font-bold text-sky-400 bg-sky-950/40 border border-sky-800/40 px-2 py-0.5 rounded">
                              {acc.accountCode}
                            </span>
                          ) : (
                            <span className="text-slate-600 text-xs font-mono">--</span>
                          )}
                        </td>
                        <td className="px-4 py-3.5"><RoleBadge role={acc.role} /></td>
                        <td className="px-3 py-3.5">
                          <div className="flex items-center justify-center gap-2">
                            {acc.isPwaInstalled ? (
                              <span className="text-green-500 text-base leading-none" title="مثبت على الجهاز (PWA)">
                                📱
                              </span>
                            ) : (
                              <span className="text-slate-600 text-xs font-mono" title="لم يتم التثبيت بعد">
                                --
                              </span>
                            )}
                            <span className="text-white/10 select-none">|</span>
                            {acc.hasNotifications ? (
                              <span className="text-blue-400 text-base leading-none" title="مفعل الإشعارات">
                                🔔
                              </span>
                            ) : (
                              <span className="text-slate-600 text-base leading-none" title="غير مفعل الإشعارات">
                                🔕
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3.5">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-[3px] rounded-full text-[11.5px] font-bold text-[#f0b429] bg-[#f0b429]/10 border border-[#f0b429]/25 whitespace-nowrap">
                            {acc.calculationsCount || 0}
                          </span>
                        </td>
                        <td className="px-4 py-3.5">
                          {acc.lastCalculation ? (
                            <span className="text-[12px] text-slate-300 whitespace-nowrap">
                              {new Date(acc.lastCalculation).toLocaleDateString("ar-EG-u-nu-latn", { day: "numeric", month: "long" })}
                            </span>
                          ) : (
                            <span className="text-[11.5px] text-slate-500 font-mono">--</span>
                          )}
                        </td>
                        <td className="px-4 py-3.5">
                          {acc.lastBalanceView ? (
                            <span className="text-[12px] text-slate-300 whitespace-nowrap" title={formatDateTime(acc.lastBalanceView)}>
                              {new Date(acc.lastBalanceView).toLocaleDateString("ar-EG-u-nu-latn", { day: "numeric", month: "long" })}
                            </span>
                          ) : !acc.accountCode ? (
                            <span className="text-[11px] text-slate-500 font-mono tracking-wider" title="العميل غير مربوط بكود">no code</span>
                          ) : (
                            <span className="text-[11.5px] text-slate-500 font-mono">--</span>
                          )}
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="flex gap-1.5">
                            {/* <Btn size="xs" variant="ghost" title="تجديد المحاولات" onClick={() => { setSelected(acc); setNewAttempts(""); setModal("attempts"); }}>
                              <Icon.Refresh />
                            </Btn> */}
                            <Btn size="xs" variant="ghost" title="تعديل" onClick={() => { setSelected(acc); setModal("edit"); }}>
                              <Icon.Edit />
                            </Btn>
                            {userRole === "owner" && acc.role !== "owner" && (
                              <Btn size="xs" variant="danger" title="حذف" onClick={() => { setSelected(acc); setDeleteConfirm(""); setModal("delete"); }}>
                                <Icon.Trash />
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
              <div className="px-5 py-2.5 border-t border-white/[0.07] text-xs text-slate-400 text-left">
                عرض {filtered.length} من {accounts.length} حساب
              </div>
            )}
          </div>
        )}

        {/* ═══ Exchange Rate ═══ */}
        {tab === "rate" && (
          <div className="bg-slate-900 rounded-2xl border border-white/[0.08] p-7 max-w-[480px]">
            <div className="flex items-center gap-2.5 mb-1.5">
              <div className="text-[#f0b429]"><Icon.Currency /></div>
              <h2 className="text-lg font-bold m-0">إدارة سعر الصرف</h2>
            </div>
            <p className="text-[13px] text-slate-400 mb-3 leading-relaxed">
              سعر الصرف الرسمي المستخدم في حساب فواتير أرضيات الحاويات الواردة.
            </p>
            <a href="https://www.cbe.org.eg/ar/economic-research/statistics/cbe-exchange-rates" target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-2 text-[11.5px] text-sky-400 hover:text-sky-300 bg-sky-400/[0.06] hover:bg-sky-400/10 border border-sky-400/15 rounded-lg px-3 py-2 mb-6 transition-colors duration-150 no-underline">
              <span className="text-[13px]">🏦</span>
              <span>رابط صفحة: البنك المركزي</span>
            </a>
            {rateLoading ? <div className="text-center p-6 text-slate-400"><Spinner /></div> : (
              <div className="flex flex-col gap-[18px]">
                <Field label="سعر الصرف الحالي  (ج.م / دولار)" icon={Icon.Currency}>
                  <div className="relative">
                    <input
                      type="text"
                      inputMode="decimal"
                      value={rate}
                      onChange={(e) => setRate(cleanRateInput(e.target.value))}
                      onPaste={(e) => {
                        e.preventDefault();
                        const text = e.clipboardData.getData("text") || "";
                        setRate(cleanRateInput(text));
                      }}
                      placeholder="0.0000"
                      className="admin-input-gold w-full bg-slate-950 border-[1.5px] border-white/[0.12] rounded-[10px] text-[#f0b429] text-[22px] font-extrabold tracking-wide rtl outline-none py-3.5 px-4 pl-[52px] box-border"
                    />
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[12.5px] text-slate-400 font-semibold pointer-events-none">ج.م / $</span>
                  </div>
                </Field>
                <Btn variant="gold" onClick={saveRate} disabled={rateSaving}>
                  {rateSaving ? <Spinner /> : <Icon.Check />}
                  {rateSaving ? "جاري الحفظ..." : "حفظ سعر الصرف"}
                </Btn>
                {rateUpdatedAt && (
                  <p className="text-[11.5px] text-slate-500 text-center m-0">
                    آخر تعديل: {new Date(rateUpdatedAt).toLocaleDateString("ar-EG", { weekday: "long", year: "numeric", month: "2-digit", day: "2-digit" })} — {new Date(rateUpdatedAt).toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit" })}
                  </p>
                )}

                {rateHistory && rateHistory.length > 0 && (
                  <div className="mt-1 pt-4 border-t border-white/[0.08]">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-[12px] font-bold text-slate-300">سجل آخر أسعار الصرف:</span>
                      <span className="text-[10px] text-slate-400 font-semibold bg-white/[0.04] px-2 py-0.5 rounded-full border border-white/[0.06]">
                        آخر 3 أسعار
                      </span>
                    </div>
                    <div className="flex flex-col gap-2">
                      {rateHistory.slice(0, 3).map((item, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/60 border border-white/[0.06] text-[12px] transition-colors hover:border-white/[0.12]"
                        >
                          <div className="flex items-center gap-2">
                            <span className={`w-2 h-2 rounded-full ${idx === 0 ? "bg-[#f0b429] shadow-[0_0_8px_rgba(240,180,41,0.6)]" : "bg-slate-600"}`} />
                            <span className="font-extrabold text-[#f0b429]">
                              {Number(item.rate).toFixed(4)}{" "}
                              <span className="text-[10px] text-slate-400 font-normal">ج.م</span>
                            </span>
                            {idx === 0 && (
                              <span className="text-[9.5px] bg-[#f0b429]/15 text-[#f0b429] border border-[#f0b429]/25 px-1.5 py-0.5 rounded font-bold">
                                الحالي
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] text-slate-500">
                            {item.date
                              ? new Date(item.date).toLocaleDateString("ar-EG", {
                                month: "short",
                                day: "numeric",
                              }) +
                              " — " +
                              new Date(item.date).toLocaleTimeString("ar-EG", {
                                hour: "2-digit",
                                minute: "2-digit",
                              })
                              : "—"}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

          </div>
        )}

        {/* ═══ Available Employees ═══ */}
        {tab === "employees" && (
          <div className="bg-slate-900 rounded-2xl border border-white/[0.08] overflow-hidden">
            <div className="px-5 py-4 border-b border-white/[0.07] flex flex-wrap gap-2.5 items-center">
              <div className="flex-1 min-w-[140px]">
                <p className="text-sm font-semibold text-slate-300 m-0">إدارة قائمة الموظفين الظاهرين للعملاء</p>
                <p className="text-[11px] text-slate-500 m-0 mt-0.5">فعّل الموظف المتاح اليوم وألغِ تفعيل غير المتاح</p>
              </div>
              <Btn variant="ghost" size="sm" onClick={loadEmployees}><Icon.Refresh /> تحديث</Btn>
              <Btn variant="primary" size="sm" onClick={() => { setEmpForm({ name: "", phone: "", role: "", isActive: true, sortOrder: 0 }); setEmpModal("addEmp"); }}><Icon.Plus /> إضافة موظف</Btn>
            </div>

            {empLoading ? (
              <div className="text-center py-12 text-slate-400"><Spinner size={28} /><br /><br />جاري التحميل...</div>
            ) : empList.length === 0 ? (
              <div className="text-center py-12 text-slate-400 text-sm">
                لا يوجد موظفين — أضف موظفاً جديداً
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse rtl min-w-[600px]">
                  <thead>
                    <tr className="bg-white/[0.03]">
                      <th className="px-4 py-3 text-right text-xs font-bold text-slate-400 border-b border-white/[0.07]">الاسم</th>
                      <th className="px-4 py-3 text-right text-xs font-bold text-slate-400 border-b border-white/[0.07]">الهاتف</th>
                      <th className="px-4 py-3 text-right text-xs font-bold text-slate-400 border-b border-white/[0.07]">المسمى</th>
                      <th className="px-4 py-3 text-right text-xs font-bold text-slate-400 border-b border-white/[0.07]">الحالة</th>
                      <th className="px-4 py-3 text-right text-xs font-bold text-slate-400 border-b border-white/[0.07]">الترتيب</th>
                      <th className="px-4 py-3 text-right text-xs font-bold text-slate-400 border-b border-white/[0.07]">الإجراءات</th>
                    </tr>
                  </thead>
                  <tbody>
                    {empList.map((emp, idx) => (
                      <tr key={emp._id} className={`border-b border-white/5 transition-colors duration-150 hover:bg-blue-500/[0.06] ${idx % 2 ? "bg-white/[0.015]" : ""}`}>
                        <td className="px-4 py-3.5">
                          <span className="text-sm font-semibold text-slate-100">{emp.name}</span>
                        </td>
                        <td className="px-4 py-3.5">
                          <span className="text-[12px] text-slate-400 ltr text-right block" dir="ltr">{emp.phone}</span>
                        </td>
                        <td className="px-4 py-3.5">
                          <span className="text-[12px] text-blue-400 font-medium">{emp.role}</span>
                        </td>
                        <td className="px-4 py-3.5">
                          <button onClick={() => toggleEmployeeActive(emp)}
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11.5px] font-semibold cursor-pointer border transition-all duration-200 ${emp.isActive ? "text-emerald-300 bg-emerald-500/15 border-emerald-500/30 hover:bg-emerald-500/25" : "text-slate-400 bg-white/[0.04] border-white/10 hover:bg-white/[0.08]"}`}>
                            <span className={`relative inline-flex w-7 h-4 rounded-full transition-colors duration-200 shrink-0 ${emp.isActive ? "bg-emerald-500/60" : "bg-slate-600"}`}>
                              <span className={`absolute top-0.5 w-3 h-3 rounded-full bg-white shadow-sm transition-all duration-200 ${emp.isActive ? "right-0.5" : "right-[15px]"}`} />
                            </span>
                            {emp.isActive ? "متاح" : "غير متاح"}
                          </button>
                        </td>
                        <td className="px-4 py-3.5">
                          <span className="text-[12px] text-slate-400">{emp.sortOrder}</span>
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="flex gap-1.5">
                            <Btn size="xs" variant="ghost" title="تعديل" onClick={() => { setEmpSelected(emp); setEmpForm({ name: emp.name, phone: emp.phone, role: emp.role, isActive: emp.isActive, sortOrder: emp.sortOrder || 0 }); setEmpModal("editEmp"); }}>
                              <Icon.Edit /> تعديل
                            </Btn>
                            {userRole === "owner" && (
                              <Btn size="xs" variant="danger" title="حذف" onClick={() => { setEmpSelected(emp); setEmpDeleteConfirm(""); setEmpModal("deleteEmp"); }}>
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
            {!empLoading && empList.length > 0 && (
              <div className="px-5 py-2.5 border-t border-white/[0.07] text-xs text-slate-400 text-left">
                {empList.filter(e => e.isActive).length} متاح من {empList.length} موظف
              </div>
            )}
          </div>
        )}

        {/* ═══ Reports Tab ═══ */}
        {tab === "reports" && <ReportsTab />}

        {/* ═══ Activity Log Tab (owner only) ═══ */}
        {tab === "activity" && userRole === "owner" && <ActivityLogTab />}

        {/* ═══ Navis Invoices Tab (owner only) ═══ */}
        {tab === "navis" && userRole === "owner" && <NavisInvoices />}

        {/* ═══ Project Data Tab ═══ */}
        {tab === "data" && (
          <div className="flex flex-col gap-5">
            {/* ── شريط التنقل الفرعي لبيانات المشروع ── */}
            <div className="flex items-center gap-2 p-1.5 bg-slate-900 border border-white/[0.08] rounded-xl overflow-x-auto">
              <button
                onClick={() => setDataSubTab("backups")}
                className={`flex-1 shrink-0 px-4 py-2 text-xs font-semibold rounded-lg transition-all border-none cursor-pointer flex items-center justify-center gap-2 ${
                  dataSubTab === "backups"
                    ? "bg-sky-500 text-white shadow-[0_2px_8px_rgba(14,165,233,0.3)]"
                    : "bg-transparent text-slate-400 hover:text-slate-200 hover:bg-white/5"
                }`}
              >
                <span>📂</span>
                <span>ملفات النسخ الاحتياطي</span>
              </button>

              <button
                onClick={() => setDataSubTab("stats")}
                className={`flex-1 shrink-0 px-4 py-2 text-xs font-semibold rounded-lg transition-all border-none cursor-pointer flex items-center justify-center gap-2 ${
                  dataSubTab === "stats"
                    ? "bg-sky-500 text-white shadow-[0_2px_8px_rgba(14,165,233,0.3)]"
                    : "bg-transparent text-slate-400 hover:text-slate-200 hover:bg-white/5"
                }`}
              >
                <span>📊</span>
                <span>سجلات النشاط والأرصدة</span>
              </button>

              <button
                onClick={() => setDataSubTab("danger")}
                className={`flex-1 shrink-0 px-4 py-2 text-xs font-semibold rounded-lg transition-all border-none cursor-pointer flex items-center justify-center gap-2 ${
                  dataSubTab === "danger"
                    ? "bg-red-500/20 text-red-400 border border-red-500/30"
                    : "bg-transparent text-slate-400 hover:text-red-300 hover:bg-red-500/10"
                }`}
              >
                <span>⚠️</span>
                <span>العمليات الحساسة</span>
              </button>
            </div>

            {/* 1️⃣ القسم الأول: ملفات النسخ الاحتياطي */}
            {dataSubTab === "backups" && (
              <BackupFilesList userRole={userRole} />
            )}

            {/* 2️⃣ القسم الثاني: سجلات النشاط والأرصدة التاريخية */}
            {dataSubTab === "stats" && (
              <div className="flex flex-col gap-5">
                {/* ═══ حذف بيانات نشاط العملاء ═══ */}
                <div className="bg-slate-900 rounded-2xl border border-white/[0.08] p-5 flex flex-col gap-4">
                  <div className="flex items-center justify-between gap-4 flex-wrap pb-3 border-b border-white/5">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-sky-400/[0.12] text-sky-400 flex items-center justify-center">
                        <Icon.Chart />
                      </div>
                      <div>
                        <h3 className="text-base font-bold m-0">بيانات نشاط الحسابات</h3>
                        <p className="text-xs text-slate-400 mt-0.5">حذف وتصفير (عدد العمليات، آخر فاتورة، فتح كشف الحساب).</p>
                      </div>
                    </div>

                    {/* تبديل الوضع: حساب محدد أو الجميع */}
                    <div className="flex items-center p-1 bg-slate-950 border border-white/10 rounded-lg">
                      <button
                        onClick={() => setStatsMode("single")}
                        className={`px-3 py-1 text-xs rounded-md font-medium border-none cursor-pointer transition-all ${
                          statsMode === "single" ? "bg-sky-500 text-white" : "bg-transparent text-slate-400 hover:text-slate-200"
                        }`}
                      >
                        حساب محدد
                      </button>
                      <button
                        onClick={() => setStatsMode("bulk")}
                        className={`px-3 py-1 text-xs rounded-md font-medium border-none cursor-pointer transition-all ${
                          statsMode === "bulk" ? "bg-red-500 text-white" : "bg-transparent text-slate-400 hover:text-slate-200"
                        }`}
                      >
                        كافة الحسابات
                      </button>
                    </div>
                  </div>

                  {/* وضع حساب محدد */}
                  {statsMode === "single" && (() => {
                    const targetObj = accounts.find((a) => a.id === statsTargetClient);
                    const q = statsSearchUser.trim().toLowerCase();
                    const filteredUsers = accounts.filter((a) => {
                      if (!q) return true;
                      return (
                        a.username.toLowerCase().includes(q) ||
                        (a.accountCode && String(a.accountCode).includes(q)) ||
                        (a.officeName && a.officeName.toLowerCase().includes(q)) ||
                        (a.role && a.role.toLowerCase().includes(q))
                      );
                    });

                    const getRoleBadgeText = (role) => {
                      switch (role) {
                        case "owner": return "مالك";
                        case "admin": return "مدير";
                        case "employee": return "موظف";
                        case "client": return "عميل";
                        default: return role;
                      }
                    };

                    return (
                      <div className="p-4 bg-white/[0.02] border border-white/[0.06] rounded-xl flex flex-col gap-3">
                        <div className="flex items-center gap-2.5 flex-wrap">
                          {/* حقل البحث لتصفية القائمة */}
                          <div className="relative min-w-[160px]">
                            <input
                              type="text"
                              value={statsSearchUser}
                              onChange={(e) => setStatsSearchUser(e.target.value)}
                              placeholder="بحث بالاسم أو الكود..."
                              className="w-full bg-slate-950 border border-white/10 rounded-lg text-slate-100 text-xs py-2 pr-7 pl-2.5 outline-none focus:border-sky-400/50"
                            />
                            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-slate-500">🔍</span>
                          </div>

                          {/* قائمة اختيار المستخدم من جميع الفئات */}
                          <select
                            value={statsTargetClient}
                            onChange={(e) => setStatsTargetClient(e.target.value)}
                            className="bg-slate-950 border border-white/10 rounded-lg text-slate-100 text-xs py-2 px-3 outline-none focus:border-sky-400/50 min-w-[220px] max-w-[320px]"
                          >
                            <option value="">-- اختر الحساب ({filteredUsers.length}) --</option>
                            {filteredUsers.map((u) => (
                              <option key={u.id} value={u.id}>
                                [{getRoleBadgeText(u.role)}] {u.username} {u.accountCode ? `(كود: ${u.accountCode})` : ""} {u.officeName ? `[${u.officeName}]` : ""}
                              </option>
                            ))}
                          </select>

                          {/* نوع البيان */}
                          <select
                            value={statsTargetType}
                            onChange={(e) => setStatsTargetType(e.target.value)}
                            className="bg-slate-950 border border-white/10 rounded-lg text-slate-100 text-xs py-2 px-3 outline-none focus:border-sky-400/50"
                          >
                            <option value="calculationsCount">عدد الحساب (تصفير العداد)</option>
                            <option value="lastCalculation">تاريخ آخر فاتورة (مسح السجلات)</option>
                            <option value="lastBalanceView">تاريخ فتح صفحة الحساب (مسح الزيارة)</option>
                          </select>

                          <Btn
                            variant="gold"
                            size="sm"
                            onClick={() => deleteStatsForClient(statsTargetType, statsTargetClient)}
                            disabled={statsClearing || !statsTargetClient}
                          >
                            {statsClearing ? <Spinner size={14} /> : <Icon.Trash size={14} />}
                            حذف {targetObj ? `لحساب «${targetObj.username}»` : ""}
                          </Btn>
                        </div>

                        {targetObj && (
                          <div className="flex items-center gap-2 text-xs text-slate-400 bg-white/[0.015] px-3 py-1.5 rounded-lg border border-white/5 w-fit">
                            <span>الحساب المحدد: <strong className="text-slate-200">{targetObj.username}</strong></span>
                            <span className="text-white/10">|</span>
                            <span>الفئة: <strong className="text-sky-400">{getRoleBadgeText(targetObj.role)}</strong></span>
                            {targetObj.accountCode && (
                              <>
                                <span className="text-white/10">|</span>
                                <span>كود: <strong className="text-amber-400">{targetObj.accountCode}</strong></span>
                              </>
                            )}
                            {targetObj.officeName && (
                              <>
                                <span className="text-white/10">|</span>
                                <span>مكتب: <strong className="text-slate-300">{targetObj.officeName}</strong></span>
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })()}

                  {/* وضع الحذف الجماعي */}
                  {statsMode === "bulk" && (
                    <div className="p-4 bg-red-400/5 border border-red-400/10 rounded-xl flex flex-col gap-3">
                      <div>
                        <p className="text-[13px] font-semibold text-red-400 mb-1">مسح بيانات لكافة الحسابات في النظام</p>
                        <p className="text-[11px] text-slate-400 m-0">اختر نوع البيان المطلوب مسحه أو تصفيره دفعة واحدة لجميع المستخدمين.</p>
                      </div>
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <Btn
                          variant="danger"
                          size="sm"
                          onClick={() => { setStatsClearAllModal("calculationsCount"); setStatsClearAllConfirm(""); }}
                          disabled={statsClearing}
                        >
                          <Icon.Trash size={14} />
                          تصفير عدد الحساب للجميع
                        </Btn>

                        <Btn
                          variant="danger"
                          size="sm"
                          onClick={() => { setStatsClearAllModal("lastCalculation"); setStatsClearAllConfirm(""); }}
                          disabled={statsClearing}
                        >
                          <Icon.Trash size={14} />
                          مسح تاريخ آخر فاتورة للجميع
                        </Btn>

                        <Btn
                          variant="danger"
                          size="sm"
                          onClick={() => { setStatsClearAllModal("lastBalanceView"); setStatsClearAllConfirm(""); }}
                          disabled={statsClearing}
                        >
                          <Icon.Trash size={14} />
                          مسح تاريخ فتح صفحة الحساب للجميع
                        </Btn>
                      </div>
                    </div>
                  )}
                </div>

                {/* ═══ حركة الرصيد التاريخية ═══ */}
                <div className="bg-slate-900 rounded-2xl border border-white/[0.08] p-5 flex flex-col gap-4">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-amber-400/[0.12] text-amber-400 flex items-center justify-center">
                      <Icon.Structure />
                    </div>
                    <div>
                      <h3 className="text-base font-bold m-0">حركة الرصيد التاريخية</h3>
                      <p className="text-xs text-slate-400 mt-0.5">حذف لقطات الرصيد التاريخية المسجلة عند تجديد أو رفع الملفات (ClientLedgerEntry).</p>
                    </div>
                  </div>

                  {/* حذف لعميل محدد */}
                  {(() => {
                    const hasCode = !!ledgerClientCode.trim();
                    const accountFound = !!(ledgerAccountName && ledgerAccountName.length > 0);
                    return (
                      <div className="p-4 bg-white/[0.02] border border-white/[0.06] rounded-xl flex flex-col gap-3">
                        <div>
                          <p className="text-[13px] font-semibold text-slate-200 mb-1">حذف سجل حساب محدد</p>
                          <p className="text-[11px] text-slate-400 m-0">أدخل كود الحساب لحذف كافة لقطات الرصيد التاريخية الخاصة به فقط.</p>
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <input
                            type="text"
                            value={ledgerClientCode}
                            onChange={(e) => { setLedgerClientCode(e.target.value); setLedgerAccountName(null); }}
                            placeholder="كود الحساب (مثال: 101)"
                            className={`w-44 bg-slate-950 rounded-lg text-slate-100 text-xs py-2 px-3 outline-none border transition-colors ${
                              hasCode && ledgerAccountName === ""
                                ? "border-red-500/50 focus:border-red-400"
                                : accountFound
                                ? "border-emerald-500/40 focus:border-emerald-400"
                                : "border-white/10 focus:border-amber-400/50"
                            }`}
                          />
                          {hasCode && ledgerNameLoading && (
                            <span className="text-slate-400 text-xs flex items-center gap-1.5"><Spinner size={12} /> جاري البحث...</span>
                          )}
                          {hasCode && !ledgerNameLoading && accountFound && (
                            <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-emerald-500/10 border border-emerald-500/25 rounded-lg">
                              <span className="text-xs">🏢</span>
                              <span className="text-emerald-300 text-xs font-semibold">{ledgerAccountName}</span>
                            </div>
                          )}
                          {hasCode && !ledgerNameLoading && ledgerAccountName === "" && (
                            <span className="text-[11.5px] text-red-400 flex items-center gap-1">⚠️ لا يوجد حساب بهذا الكود</span>
                          )}
                        </div>
                        <div className="flex justify-end">
                          <Btn variant="gold" size="sm" onClick={deleteClientLedger} disabled={ledgerClearing || !accountFound || ledgerNameLoading}>
                            {ledgerClearing ? <Spinner size={14} /> : <Icon.Trash size={14} />}
                            حذف سجل {accountFound ? `«${ledgerAccountName}»` : "الحساب"}
                          </Btn>
                        </div>
                      </div>
                    );
                  })()}

                  {/* حذف لكافة العملاء */}
                  <div className="p-4 bg-red-400/5 border border-red-400/10 rounded-xl flex items-center justify-between gap-4 flex-wrap">
                    <div className="flex-1 min-w-[200px]">
                      <p className="text-[13px] font-semibold text-red-400 mb-1">مسح سجل كافة العملاء دفعة واحدة</p>
                      <p className="text-[11px] text-slate-400 m-0">سيتم مسح سجلات حركة الرصيد التاريخية لجميع العملاء نهائياً.</p>
                    </div>
                    <Btn variant="danger" size="sm" onClick={() => { setLedgerClearConfirm(""); setModal("clearLedger"); }} disabled={ledgerClearing}>
                      {ledgerClearing ? <Spinner size={14} /> : <Icon.Trash size={14} />}
                      مسح سجل كافة العملاء
                    </Btn>
                  </div>
                </div>
              </div>
            )}

            {/* 3️⃣ القسم الثالث: العمليات الحساسة (Danger Zone) */}
            {dataSubTab === "danger" && (
              <div className="bg-slate-900 rounded-2xl border border-red-500/20 p-5 flex flex-col gap-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-red-400/[0.12] text-red-400 flex items-center justify-center">
                    <Icon.Trash />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-red-400 m-0">منطقة العمليات الحساسة</h3>
                    <p className="text-xs text-slate-400 mt-0.5">عمليات لا رجعة فيها لإدارة ومسح قاعدة البيانات المالية.</p>
                  </div>
                </div>
                <div className="p-4 bg-red-400/5 border border-red-400/15 rounded-xl flex items-center justify-between gap-4 flex-wrap">
                  <div className="flex-1 min-w-[200px]">
                    <p className="text-[13px] font-semibold text-red-400 mb-1">مسح كافة البيانات المالية</p>
                    <p className="text-[11px] text-slate-400 m-0">سيتم حذف جميع الحسابات والمعاملات المالية نهائياً من قاعدة البيانات.</p>
                  </div>
                  <Btn variant="danger" onClick={() => { setClearConfirm(""); setModal("clearData"); }} disabled={dataClearing}>
                    {dataClearing ? <Spinner /> : <Icon.Trash />}
                    {dataClearing ? "جاري المسح..." : "مسح كافة البيانات"}
                  </Btn>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ═══ Modals ═══ */}
      <Modal open={modal === "add"} onClose={() => setModal(null)} title="إضافة حساب جديد">
        <AccountForm onSubmit={addAccount} onCancel={() => setModal(null)} isSaving={isSaving} visibleRoles={userRole === "owner" ? ROLES : ROLES.filter(r => r.value !== "owner")} />
      </Modal>
      <Modal open={modal === "edit"} onClose={() => setModal(null)} title="تعديل الحساب">
        {selected && <AccountForm initial={{ ...selected, password: "" }} onSubmit={editAccount} onCancel={() => setModal(null)} isSaving={isSaving} visibleRoles={userRole === "owner" ? ROLES : ROLES.filter(r => r.value !== "owner")} />}
      </Modal>
      <Modal open={modal === "details"} onClose={() => setModal(null)} title={selected?.role === "client" ? "تفاصيل العميل" : "تفاصيل الحساب"}>
        {selected && <AccountDetails account={selected} />}
      </Modal>
      <Modal open={modal === "delete"} onClose={() => setModal(null)} title="تأكيد الحذف">
        {selected && (
          <div>
            <div className="bg-red-400/[0.08] border border-red-400/20 rounded-[10px] px-4 py-3.5 mb-[18px]">
              <p className="m-0 text-sm text-red-400 leading-relaxed">
                هل أنت متأكد من حذف حساب <strong className="text-slate-100">«{selected.username}»</strong>؟<br />
                <span className="text-[12.5px] text-slate-400">هذا الإجراء لا يمكن التراجع عنه.</span>
              </p>
            </div>
            <p className="text-[13px] text-slate-400 mb-2.5">
              اكتب <strong className="text-slate-100">{selected.username}</strong> للتأكيد:
            </p>
            <input type="text" value={deleteConfirm} onChange={(e) => setDeleteConfirm(e.target.value)} placeholder={selected.username}
              className="admin-input-danger w-full bg-slate-950 border-[1.5px] border-red-400/30 rounded-lg text-slate-100 text-sm rtl outline-none py-2.5 px-3 mb-[18px] box-border" />
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
      <Modal open={modal === "clearData"} onClose={() => setModal(null)} title="تأكيد مسح البيانات">
        <div>
          <div className="bg-red-400/[0.08] border border-red-400/20 rounded-[10px] px-4 py-3.5 mb-[18px]">
            <p className="m-0 text-sm text-red-400 leading-relaxed">
              ⚠️ تحذير: سيتم <strong className="text-slate-100">مسح جميع البيانات المالية</strong> والحسابات نهائياً.<br />
              <span className="text-[12.5px] text-slate-400">هذا الإجراء لا يمكن التراجع عنه. تأكد من وجود نسخة احتياطية قبل المتابعة.</span>
            </p>
          </div>
          <p className="text-[13px] text-slate-400 mb-2.5">
            اكتب <strong className="text-red-400">مسح البيانات</strong> للتأكيد:
          </p>
          <input type="text" value={clearConfirm} onChange={(e) => setClearConfirm(e.target.value)} placeholder="مسح البيانات"
            className="admin-input-danger w-full bg-slate-950 border-[1.5px] border-red-400/30 rounded-lg text-slate-100 text-sm rtl outline-none py-2.5 px-3 mb-[18px] box-border" />
          <div className="flex gap-2.5 justify-end">
            <Btn variant="ghost" onClick={() => setModal(null)}>إلغاء</Btn>
            <Btn variant="danger" disabled={clearConfirm !== "مسح البيانات" || dataClearing} onClick={clearFinancialData}>
              {dataClearing ? <Spinner /> : <Icon.Trash />}
              {dataClearing ? "جاري المسح..." : "تأكيد المسح"}
            </Btn>
          </div>
        </div>
      </Modal>
      <Modal open={modal === "clearLedger"} onClose={() => setModal(null)} title="تأكيد مسح حركة الرصيد التاريخية">
        <div>
          <div className="bg-red-400/[0.08] border border-red-400/20 rounded-[10px] px-4 py-3.5 mb-[18px]">
            <p className="m-0 text-sm text-red-400 leading-relaxed">
              ⚠️ تحذير: سيتم <strong className="text-slate-100">مسح حركة الرصيد التاريخية لجميع العملاء</strong> نهائياً.<br />
              <span className="text-[12.5px] text-slate-400">هذا الإجراء لا يمكن التراجع عنه. لن تتأثر الأرصدة الحالية، بل التاريخية فقط.</span>
            </p>
          </div>
          <p className="text-[13px] text-slate-400 mb-2.5">
            اكتب <strong className="text-red-400">مسح السجل التاريخي</strong> للتأكيد:
          </p>
          <input
            type="text"
            value={ledgerClearConfirm}
            onChange={(e) => setLedgerClearConfirm(e.target.value)}
            placeholder="مسح السجل التاريخي"
            className="admin-input-danger w-full bg-slate-950 border-[1.5px] border-red-400/30 rounded-lg text-slate-100 text-sm rtl outline-none py-2.5 px-3 mb-[18px] box-border"
          />
          <div className="flex gap-2.5 justify-end">
            <Btn variant="ghost" onClick={() => setModal(null)}>إلغاء</Btn>
            <Btn
              variant="danger"
              disabled={ledgerClearConfirm !== "مسح السجل التاريخي" || ledgerClearing}
              onClick={clearAllLedger}
            >
              {ledgerClearing ? <Spinner /> : <Icon.Trash />}
              {ledgerClearing ? "جاري المسح..." : "تأكيد المسح"}
            </Btn>
          </div>
        </div>
      </Modal>

      {/* مودال تأكيد مسح بيانات النشاط لكافة العملاء */}
      <Modal
        open={!!statsClearAllModal}
        onClose={() => setStatsClearAllModal(null)}
        title={
          statsClearAllModal === "calculationsCount"
            ? "تأكيد تصفير عدد الحساب للجميع"
            : statsClearAllModal === "lastCalculation"
            ? "تأكيد مسح تاريخ آخر فاتورة للجميع"
            : "تأكيد مسح تاريخ فتح صفحة الحساب للجميع"
        }
      >
        <div>
          <div className="bg-red-400/[0.08] border border-red-400/20 rounded-[10px] px-4 py-3.5 mb-[18px]">
            <p className="m-0 text-sm text-red-400 leading-relaxed">
              ⚠️ تحذير: سيتم{" "}
              <strong className="text-slate-100">
                {statsClearAllModal === "calculationsCount"
                  ? "تصفير عداد عمليات الحساب لجميع الحسابات"
                  : statsClearAllModal === "lastCalculation"
                  ? "مسح سجلات فواتير جميع المستخدمين"
                  : "مسح سجلات فتح كشف الرصيد لجميع المستخدمين"}
              </strong>
              .<br />
              <span className="text-[12.5px] text-slate-400">هذا الإجراء لا يمكن التراجع عنه.</span>
            </p>
          </div>
          <p className="text-[13px] text-slate-400 mb-2.5">
            اكتب <strong className="text-red-400">تأكيد المسح</strong> للتأكيد:
          </p>
          <input
            type="text"
            value={statsClearAllConfirm}
            onChange={(e) => setStatsClearAllConfirm(e.target.value)}
            placeholder="تأكيد المسح"
            className="admin-input-danger w-full bg-slate-950 border-[1.5px] border-red-400/30 rounded-lg text-slate-100 text-sm rtl outline-none py-2.5 px-3 mb-[18px] box-border"
          />
          <div className="flex gap-2.5 justify-end">
            <Btn variant="ghost" onClick={() => setStatsClearAllModal(null)}>
              إلغاء
            </Btn>
            <Btn
              variant="danger"
              disabled={statsClearAllConfirm !== "تأكيد المسح" || statsClearing}
              onClick={() => clearAllStats(statsClearAllModal)}
            >
              {statsClearing ? <Spinner /> : <Icon.Trash />}
              {statsClearing ? "جاري المسح..." : "تأكيد المسح"}
            </Btn>
          </div>
        </div>
      </Modal>
      {/* Attempts Modal (Temporarily suspended) */}
      {/*
      <Modal open={modal === "attempts"} onClose={() => setModal(null)} title="تجديد المحاولات">
        {selected && (
          <div>
            <div className="bg-blue-400/[0.07] border border-blue-400/20 rounded-[10px] px-4 py-3.5 mb-5 flex justify-between items-center">
              <div>
                <p className="m-0 text-sm font-semibold text-slate-100">{selected.username}</p>
                <p className="mt-0.5 m-0"><RoleBadge role={selected.role} /></p>
              </div>
              <div className="text-left">
                <p className="m-0 text-[11px] text-slate-400">المحاولات الحالية</p>
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
                    ${newAttempts == n ? "bg-sky-500/25 text-blue-400 border-sky-500/50" : "bg-white/[0.06] text-slate-400 border-white/10"}`}>
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
      */}

      {/* ═══ Employee Modals ═══ */}
      <Modal open={empModal === "addEmp" || empModal === "editEmp"} onClose={() => setEmpModal(null)} title={empModal === "addEmp" ? "إضافة موظف جديد" : "تعديل بيانات الموظف"}>
        <div className="flex flex-col gap-3.5">
          <Field label="اسم الموظف" icon={Icon.User}>
            <Input value={empForm.name} onChange={(e) => setEmpForm(f => ({ ...f, name: e.target.value }))} placeholder="أدخل اسم الموظف" />
          </Field>
          <Field label="رقم الهاتف" icon={Icon.Phone}>
            <Input value={empForm.phone} onChange={(e) => setEmpForm(f => ({ ...f, phone: e.target.value }))} placeholder="01xxxxxxxxx" />
          </Field>
          <Field label="المسمى الوظيفي" icon={Icon.Briefcase}>
            <Input value={empForm.role} onChange={(e) => setEmpForm(f => ({ ...f, role: e.target.value }))} placeholder="مثال: خدمة عملاء، محاسب" />
          </Field>
          <Field label="ترتيب الظهور (اختياري)" icon={Icon.Hash}>
            <Input type="number" min="0" step="1" value={empForm.sortOrder} onChange={(e) => setEmpForm(f => ({ ...f, sortOrder: Number(e.target.value) }))} placeholder="0" suffix="ترتيب" />
          </Field>
          <div className="flex items-center justify-between bg-white/[0.04] rounded-lg px-3 py-2.5 border border-white/[0.08]">
            <span className="text-xs font-semibold text-slate-400">متاح حالياً (يظهر للعملاء)</span>
            <button onClick={() => setEmpForm(f => ({ ...f, isActive: !f.isActive }))}
              className={`relative w-11 h-6 rounded-full cursor-pointer border-none transition-colors duration-200 ${empForm.isActive ? "bg-emerald-500" : "bg-slate-600"}`}>
              <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all duration-200 ${empForm.isActive ? "right-0.5" : "right-[22px]"}`} />
            </button>
          </div>
          <div className="flex gap-2.5 mt-1.5 justify-end">
            <Btn variant="ghost" onClick={() => setEmpModal(null)}>إلغاء</Btn>
            <Btn variant="primary" onClick={empModal === "addEmp" ? addEmployee : editEmployee} disabled={empSaving}>
              {empSaving ? <Spinner /> : <Icon.Check />}
              {empSaving ? "جاري الحفظ..." : empModal === "addEmp" ? "إضافة الموظف" : "حفظ التعديلات"}
            </Btn>
          </div>
        </div>
      </Modal>
      <Modal open={empModal === "deleteEmp"} onClose={() => setEmpModal(null)} title="تأكيد حذف الموظف">
        {empSelected && (
          <div>
            <div className="bg-red-400/[0.08] border border-red-400/20 rounded-[10px] px-4 py-3.5 mb-[18px]">
              <p className="m-0 text-sm text-red-400 leading-relaxed">
                هل أنت متأكد من حذف الموظف <strong className="text-slate-100">«{empSelected.name}»</strong>؟<br />
                <span className="text-[12.5px] text-slate-400">هذا الإجراء لا يمكن التراجع عنه.</span>
              </p>
            </div>
            <p className="text-[13px] text-slate-400 mb-2.5">
              اكتب <strong className="text-slate-100">{empSelected.name}</strong> للتأكيد:
            </p>
            <input type="text" value={empDeleteConfirm} onChange={(e) => setEmpDeleteConfirm(e.target.value)} placeholder={empSelected.name}
              className="admin-input-danger w-full bg-slate-950 border-[1.5px] border-red-400/30 rounded-lg text-slate-100 text-sm rtl outline-none py-2.5 px-3 mb-[18px] box-border" />
            <div className="flex gap-2.5 justify-end">
              <Btn variant="ghost" onClick={() => setEmpModal(null)}>إلغاء</Btn>
              <Btn variant="danger" disabled={empDeleteConfirm !== empSelected.name || empSaving} onClick={deleteEmployee}>
                {empSaving ? <Spinner /> : <Icon.Trash />}
                {empSaving ? "جاري الحذف..." : "تأكيد الحذف"}
              </Btn>
            </div>
          </div>
        )}
      </Modal>

      <Toast msg={toast} onDone={() => setToast({ text: "", type: "" })} />
    </div>
  );
}
