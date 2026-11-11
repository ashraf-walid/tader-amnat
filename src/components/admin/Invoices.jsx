import { useCallback, useEffect, useState } from "react";
import { Icon } from "@/components/Icons";
import { getRoleInfo } from "@/lib/adminConstants";
import { SERVICES_LIST } from "@/lib/storageConstants";

function Spinner({ size = 18 }) {
  return (
    <div
      className="shrink-0 animate-spin rounded-full border-2 border-white/20 border-t-white"
      style={{ width: size, height: size }}
      aria-label="جاري التحميل"
    />
  );
}

function RoleBadge({ role }) {
  const info = getRoleInfo(role);
  return (
    <span
      className="whitespace-nowrap rounded-full px-2.5 py-[3px] text-[11.5px] font-semibold"
      style={{ color: info.color, background: info.bg, border: `1px solid ${info.color}28` }}
    >
      {info.label}
    </span>
  );
}

function Section({ icon: IconComp, title, subtitle, children, action }) {
  return (
    <section className="overflow-hidden rounded-2xl border border-white/[0.08] bg-slate-900">
      <div className="flex flex-col gap-3 border-b border-white/[0.07] px-4 py-4 sm:flex-row sm:flex-wrap sm:items-center sm:px-5">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            {IconComp && <span className="shrink-0 text-sky-400"><IconComp /></span>}
            <p className="m-0 text-sm font-semibold text-slate-300">{title}</p>
          </div>
          {subtitle && <p className="mb-0 mt-1 text-[11px] text-slate-500">{subtitle}</p>}
        </div>
        {action}
      </div>
      <div className="p-3 sm:p-5">{children}</div>
    </section>
  );
}

function money(value, digits = 2) {
  return Number(value || 0).toLocaleString("ar-EG", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}

function dateTime(value) {
  return new Date(value).toLocaleString("ar-EG", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const CARGO_LABELS = {
  FULL: "عادية",
  REEFER: "ثلاجة",
  DANGEROUS: "خطرة",
  NON_STANDARD: "غير منتظمة",
};
const NON_STANDARD_LABELS = { OOG: "سعر مضاعف ×٢", LASHING: "سعر مضاعف ×٤" };

function InvoiceDetails({ invoice }) {
  const { inputs, result } = invoice;
  if (!inputs || !result) {
    return <p className="m-0 text-xs text-slate-500">هذه فاتورة قديمة ولم تُحفظ تفاصيلها.</p>;
  }

  const containers = [
    ["twentyFoot", "٢٠ قدم"],
    ["fortyFoot", "٤٠ قدم"],
  ].flatMap(([key, label]) => {
    const item = inputs.containers?.[key];
    if (!item?.count) return [];
    const cargo = CARGO_LABELS[item.cargoType] || item.cargoType || "—";
    const type = item.cargoType === "NON_STANDARD" && item.nonStandardType
      ? `، ${NON_STANDARD_LABELS[item.nonStandardType] || item.nonStandardType}`
      : "";
    return [`${label}: ${item.count} (${cargo}${type})`];
  });

  const options = inputs.options || {};
  const serviceNames = Object.entries(options.services || {})
    .filter(([, enabled]) => enabled)
    .map(([id]) => SERVICES_LIST.find((service) => service.id === id)?.name || id);
  const breakdown = [
    ...(result.details?.storageBreakdown || []).map((item) => ({ ...item, label: "تخزين" })),
    ...(result.details?.cargoBreakdown || []).map((item) => ({ ...item, label: "أرضيات المشمول" })),
    ...(result.details?.dangerYardBreakdown || []).map((item) => ({ ...item, label: "ساحة الطوارئ" })),
  ];
  const charges = [
    ["التخزين", result.usd?.storageFee],
    ["الرسوم الإضافية", result.usd?.surchargeFee],
    ["الرسوم الثابتة", result.usd?.fixedFees],
    ["الخدمات الإضافية", result.usd?.additionalServices],
    ["تفريغ المشمول", result.usd?.cargoServiceFee],
    ["أرضيات المشمول", result.usd?.cargoStorageFee],
    ["ساحة الطوارئ", result.usd?.dangerYardFee],
  ].filter(([, value]) => Number(value) > 0);

  return (
    <div className="space-y-4 text-xs text-slate-300">
      <section>
        <h4 className="mb-2 mt-0 text-[11px] font-bold text-slate-400">بيانات الحساب</h4>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <span>نوع الفاتورة: {inputs.billingType === "RENEWAL" ? "تجديد" : "أولية"}</span>
          <span>مدة التخزين: {inputs.days ?? "—"} يوم</span>
          <span>تاريخ الوصول: {inputs.arrivalDate || "—"}</span>
          <span>تاريخ الصرف: {inputs.releaseDate || "—"}</span>
          {inputs.firstInvoiceDate && <span>تاريخ الفاتورة الأولى: {inputs.firstInvoiceDate}</span>}
          <span>سعر الصرف: {money(inputs.exchangeRate)} ج.م/$</span>
          <span className="sm:col-span-2">الحاويات: {containers.join("، ") || "—"}</span>
          {serviceNames.length > 0 && <span className="sm:col-span-2">الخدمات: {serviceNames.join("، ")}</span>}
          {options.isHolidayRelease && <span>صرف يوم عطلة</span>}
          {options.hasCargoStripping && <span>تفريغ مشمول</span>}
          {options.hasCargoStorage && <span>تخزين مشمول</span>}
          {options.isExternalStorage && <span>تخزين خارجي</span>}
          {options.isLCLStorage && <span>بضائع مجزأة</span>}
          {options.hasDangerYard20 || options.hasDangerYard40 ? <span>ساحة طوارئ</span> : null}
        </div>
      </section>

      <section className="border-t border-white/[0.08] pt-3">
        <h4 className="mb-2 mt-0 text-[11px] font-bold text-slate-400">الرسوم والإجماليات</h4>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {charges.map(([label, value]) => <span key={label}>{label}: ${money(value)}</span>)}
          <span>الإجمالي بالدولار: ${money(result.usd?.subtotal)}</span>
          <span>الإجمالي قبل الضريبة: {money(result.egp?.subtotal, 0)} ج.م</span>
          <span>ضريبة القيمة المضافة: {money(result.egp?.vatAmount, 0)} ج.م</span>
          <span>طابع الشهيد: {money(result.egp?.martyrStamp, 0)} ج.م</span>
          <strong className="text-amber-400">الإجمالي النهائي: {money(result.egp?.total, 0)} ج.م</strong>
        </div>
      </section>

      {breakdown.length > 0 && (
        <section className="border-t border-white/[0.08] pt-3">
          <h4 className="mb-2 mt-0 text-[11px] font-bold text-slate-400">شرائح احتساب الرسوم</h4>
          <ul className="m-0 list-none space-y-1 p-0">
            {breakdown.map((item, index) => (
              <li key={`${item.label}-${index}`}>
                {item.label}: {item.tierName}، {item.days} يوم، ${money(item.subtotal)}
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

function InvoiceCard({ invoice, selected, onSelect, canSelect }) {
  const [isOpen, setIsOpen] = useState(false);
  const input = invoice.inputs;
  const containerCount = (input?.containers?.twentyFoot?.count || 0) + (input?.containers?.fortyFoot?.count || 0);
  return (
    <article className="rounded-xl border border-white/[0.08] bg-slate-950/60 p-3 sm:p-4">
      <div className="flex items-start gap-3">
        {canSelect && (
          <input
            type="checkbox"
            checked={selected}
            onChange={() => onSelect(invoice.id)}
            aria-label={`تحديد فاتورة ${dateTime(invoice.createdAt)}`}
            className="mt-1 h-4 w-4 shrink-0 accent-amber-400"
          />
        )}
        <div className="min-w-0 flex-1">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="m-0 text-sm font-bold text-slate-100">
                {input?.billingType === "RENEWAL" ? "فاتورة تجديد" : "فاتورة أولية"}
              </p>
              <p className="mb-0 mt-1 text-[11px] text-slate-500">{dateTime(invoice.createdAt)}</p>
            </div>
            <span className="w-fit rounded-full border border-amber-400/20 bg-amber-400/10 px-3 py-1 text-xs font-bold text-amber-300">
              {invoice.result?.egp?.total != null ? `${money(invoice.result.egp.total, 0)} ج.م` : "تفاصيل قديمة"}
            </span>
          </div>
          <div className="mt-3 flex flex-wrap gap-2 text-[11px] text-slate-400">
            <span className="rounded-md bg-white/[0.04] px-2 py-1">{input?.arrivalDate || "—"} ← {input?.releaseDate || "—"}</span>
            <span className="rounded-md bg-white/[0.04] px-2 py-1">{containerCount || "—"} حاوية</span>
            {input?.days != null && <span className="rounded-md bg-white/[0.04] px-2 py-1">{input.days} يوم</span>}
          </div>
          <div className="mt-3 border-t border-white/[0.07] pt-2">
            <button
              type="button"
              onClick={() => setIsOpen((prev) => !prev)}
              className="flex items-center gap-1.5 text-[10px] font-semibold text-sky-400 select-none transition-colors hover:text-sky-300 cursor-pointer"
            >
              <span>{isOpen ? "إخفاء تفاصيل الفاتورة" : "عرض تفاصيل الفاتورة"}</span>
              <span className={`inline-block text-[9px] transition-transform duration-900 ease-out ${isOpen ? "rotate-180" : ""}`}>
                ▼
              </span>
            </button>
            <div
              className={`grid transition-all duration-300 ease-in-out ${
                isOpen
                  ? "grid-rows-[1fr] opacity-100 mt-3"
                  : "grid-rows-[0fr] opacity-0 mt-0 pointer-events-none"
              }`}
            >
              <div className="overflow-hidden">
                <div className="rounded-lg bg-slate-900/80 p-3 sm:p-4">
                  <InvoiceDetails invoice={invoice} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}

function ClientInvoicesDialog({ client, canDelete, onClose, onInvoicesChanged }) {
  const [selectedIds, setSelectedIds] = useState([]);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const invoices = client?.invoices || [];
  const allSelected = invoices.length > 0 && invoices.every((invoice) => selectedIds.includes(invoice.id));

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const handleKeyDown = (event) => {
      if (event.key === "Escape" && !deleting) onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [deleting, onClose]);

  function toggleInvoice(id) {
    setSelectedIds((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  }

  function toggleAll() {
    setSelectedIds(allSelected ? [] : invoices.map((invoice) => invoice.id));
  }

  async function removeInvoices(deleteAll) {
    const message = deleteAll
      ? `سيتم حذف جميع فواتير ${client.username} من كل التواريخ. لا يمكن التراجع عن الحذف. هل تريد المتابعة؟`
      : `سيتم حذف ${selectedIds.length} فاتورة محددة من ${client.username}. هل تريد المتابعة؟`;
    if (!window.confirm(message)) return;

    setDeleting(true);
    setError("");
    setNotice("");
    try {
      const response = await fetch("/api/reports/invoices", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: client.userId,
          ...(deleteAll ? { deleteAll: true } : { invoiceIds: selectedIds }),
        }),
      });
      const payload = await response.json();
      if (!response.ok || !payload.success) throw new Error(payload.error || "تعذر حذف الفواتير");
      onInvoicesChanged({ clientId: client.userId, invoiceIds: deleteAll ? invoices.map((invoice) => invoice.id) : selectedIds });
      setSelectedIds([]);
      if (deleteAll) onClose();
      else setNotice(`تم حذف ${payload.deletedCount} فاتورة بنجاح.`);
    } catch (deleteError) {
      setError(deleteError.message || "تعذر حذف الفواتير");
    } finally {
      setDeleting(false);
    }
  }

  if (!client) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center bg-black/75 p-0 backdrop-blur-sm sm:items-center sm:p-4"
      onMouseDown={(event) => { if (event.target === event.currentTarget && !deleting) onClose(); }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="client-invoices-title"
        className="flex max-h-[96dvh] w-full max-w-3xl flex-col overflow-hidden rounded-t-3xl border border-white/[0.1] bg-slate-900 shadow-2xl sm:max-h-[90vh] sm:rounded-3xl"
      >
        <header className="flex items-start gap-3 border-b border-white/[0.08] p-4 sm:p-5">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-sky-400/10 text-base font-bold text-sky-300">
            {client.username?.[0]?.toUpperCase() || "؟"}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 id="client-invoices-title" className="m-0 text-base font-bold text-white">فواتير {client.username}</h2>
              <RoleBadge role={client.role} />
            </div>
            <p className="mb-0 mt-1 text-xs text-slate-400">
              {client.officeName || "بدون اسم مكتب"} · {client.count} فاتورة في التاريخ المحدد
            </p>
          </div>
          <button type="button" onClick={onClose} disabled={deleting} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-xl text-slate-400 hover:bg-white/[0.07] hover:text-white" aria-label="إغلاق النافذة">×</button>
        </header>

        {canDelete && (
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.07] px-4 py-3 sm:px-5">
            <label className="flex cursor-pointer items-center gap-2 text-xs text-slate-300">
              <input type="checkbox" checked={allSelected} onChange={toggleAll} className="h-4 w-4 accent-amber-400" />
              تحديد فواتير هذا اليوم
            </label>
            <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
              <button
                type="button"
                onClick={() => removeInvoices(false)}
                disabled={!selectedIds.length || deleting}
                className="min-h-10 rounded-xl border border-red-400/25 bg-red-400/10 px-3 text-xs font-bold text-red-300 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {deleting ? "جاري الحذف…" : `حذف المحدد (${selectedIds.length})`}
              </button>
              <button
                type="button"
                onClick={() => removeInvoices(true)}
                disabled={deleting || !invoices.length}
                className="min-h-10 rounded-xl border border-red-500/40 bg-red-600/15 px-3 text-xs font-bold text-red-200 disabled:cursor-not-allowed disabled:opacity-40"
              >
                حذف كل فواتير العميل
              </button>
            </div>
          </div>
        )}

        <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-3 sm:p-5">
          {error && <p role="alert" className="m-0 rounded-xl border border-red-400/20 bg-red-400/10 p-3 text-xs text-red-300">{error}</p>}
          {notice && <p role="status" className="m-0 rounded-xl border border-emerald-400/20 bg-emerald-400/10 p-3 text-xs text-emerald-300">{notice}</p>}
          {invoices.length ? invoices.map((invoice) => (
            <InvoiceCard key={invoice.id} invoice={invoice} selected={selectedIds.includes(invoice.id)} onSelect={toggleInvoice} canSelect={canDelete} />
          )) : (
            <div className="py-12 text-center text-sm text-slate-500">لا توجد فواتير محفوظة لهذا العميل في هذا اليوم.</div>
          )}
        </div>
        {canDelete && (
          <footer className="border-t border-white/[0.08] px-4 py-3 text-[11px] text-slate-500 sm:px-5">
            الحذف المحدد يخص فواتير التاريخ المعروض فقط. حذف الكل يشمل سجل العميل في جميع التواريخ.
          </footer>
        )}
      </section>
    </div>
  );
}

export function InvoicesByDateSection() {
  const [date, setDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [data, setData] = useState(null);
  const [selectedClientId, setSelectedClientId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const loadReport = useCallback(async (targetDate, cancelled = () => false) => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`/api/reports?type=invoices-by-date&date=${targetDate}`);
      const payload = await response.json();
      if (cancelled()) return;
      if (payload.success) setData(payload);
      else { setError(payload.error || "خطأ في جلب البيانات"); setData(null); }
    } catch {
      if (!cancelled()) { setError("فشل الاتصال بالخادم"); setData(null); }
    } finally {
      if (!cancelled()) setLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    loadReport(date, () => cancelled);
    return () => { cancelled = true; };
  }, [date, loadReport]);

  const selectedClient = data?.users?.find((user) => user.userId === selectedClientId) || null;

  const handleInvoicesChanged = useCallback(({ clientId, invoiceIds }) => {
    const removedIds = new Set(invoiceIds);
    setData((current) => {
      if (!current) return current;
      const users = current.users.map((user) => {
        if (user.userId !== clientId) return user;
        const invoices = user.invoices.filter((invoice) => !removedIds.has(invoice.id));
        return {
          ...user,
          invoices,
          count: invoices.length,
          lastInvoice: invoices[0]?.createdAt || user.firstInvoice,
        };
      }).filter((user) => user.count > 0);
      return {
        ...current,
        users,
        totalInvoices: users.reduce((sum, user) => sum + user.count, 0),
        totalUsers: users.length,
      };
    });
  }, []);

  const openClient = (user) => setSelectedClientId(user.userId);
  const closeClient = useCallback(() => setSelectedClientId(null), []);

  return (
    <Section
      icon={Icon.Hash}
      title="تقرير فواتير العملاء"
      subtitle="اختر تاريخاً، ثم اضغط على صف العميل لعرض فواتيره وإدارتها"
      action={
        <label className="flex w-full items-center gap-2 text-xs text-slate-400 sm:w-auto">
          <span className="shrink-0">التاريخ</span>
          <input
            type="date"
            value={date}
            onChange={(event) => setDate(event.target.value)}
            className="admin-input min-h-10 w-full cursor-pointer rounded-lg border-[1.5px] border-white/10 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none sm:w-auto"
          />
        </label>
      }
    >
      {loading ? (
        <div className="flex items-center justify-center py-12"><Spinner size={24} /></div>
      ) : error ? (
        <div className="py-8 text-center"><p role="alert" className="text-sm text-red-400">{error}</p></div>
      ) : !data || data.totalInvoices === 0 ? (
        <div className="py-10 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-white/[0.04] text-xl text-slate-500">▤</div>
          <p className="m-0 text-sm text-slate-400">لا توجد فواتير محفوظة في هذا التاريخ.</p>
          <p className="mb-0 mt-2 text-[11px] text-slate-600">تظهر تفاصيل الفواتير التي تم حسابها بعد تفعيل الحفظ.</p>
        </div>
      ) : (
        <>
          <div className="mb-4 grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:items-center sm:gap-3">
            <span className="rounded-xl border border-amber-400/20 bg-amber-400/10 px-3 py-2 text-center text-xs font-bold text-amber-300">{data.totalInvoices} فاتورة</span>
            <span className="rounded-xl border border-sky-400/20 bg-sky-400/10 px-3 py-2 text-center text-xs font-bold text-sky-300">{data.totalUsers} عميل</span>
            <span className="col-span-2 py-1 text-center text-[11px] text-slate-500 sm:col-span-1 sm:text-right">
              {new Date(`${data.date}T00:00:00`).toLocaleDateString("ar-EG", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
            </span>
          </div>

          <div className="hidden overflow-x-auto md:block">
            <table className="w-full border-collapse text-right">
              <thead>
                <tr className="bg-white/[0.03]">
                  <th className="w-12 border-b border-white/[0.07] px-4 py-3 text-xs font-bold text-slate-400">#</th>
                  <th className="border-b border-white/[0.07] px-4 py-3 text-xs font-bold text-slate-400">العميل</th>
                  <th className="border-b border-white/[0.07] px-4 py-3 text-xs font-bold text-slate-400">الدور</th>
                  <th className="border-b border-white/[0.07] px-4 py-3 text-xs font-bold text-slate-400">المكتب</th>
                  <th className="border-b border-white/[0.07] px-4 py-3 text-xs font-bold text-slate-400">الفواتير</th>
                  <th className="border-b border-white/[0.07] px-4 py-3 text-xs font-bold text-slate-400">آخر فاتورة</th>
                  <th className="border-b border-white/[0.07] px-4 py-3 text-xs font-bold text-slate-400">الإجراء</th>
                </tr>
              </thead>
              <tbody>
                {data.users.map((user, index) => (
                  <tr
                    key={user.userId || user.username}
                    onClick={() => openClient(user)}
                    onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); openClient(user); } }}
                    tabIndex={0}
                    aria-label={`عرض فواتير ${user.username}`}
                    className="cursor-pointer border-b border-white/5 transition-colors hover:bg-sky-400/[0.06] focus:bg-sky-400/[0.06] focus:outline-none"
                  >
                    <td className="px-4 py-3 text-xs font-bold text-slate-500">{index + 1}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold" style={{ background: getRoleInfo(user.role).bg, border: `1px solid ${getRoleInfo(user.role).color}30`, color: getRoleInfo(user.role).color }}>
                          {user.username?.[0]?.toUpperCase() || "؟"}
                        </span>
                        <span className="text-sm font-semibold text-slate-100">{user.username}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3"><RoleBadge role={user.role} /></td>
                    <td className="px-4 py-3 text-xs text-slate-400">{user.officeName || "—"}</td>
                    <td className="px-4 py-3"><span className="rounded-full border border-amber-400/20 bg-amber-400/10 px-2.5 py-1 text-[11px] font-bold text-amber-300">{user.count}</span></td>
                    <td className="whitespace-nowrap px-4 py-3 text-xs text-slate-400">{new Date(user.lastInvoice).toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit" })}</td>
                    <td className="px-4 py-3 text-[10px] font-semibold text-sky-400">عرض الفواتير</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="space-y-2 md:hidden">
            {data.users.map((user, index) => (
              <button
                type="button"
                key={user.userId || user.username}
                onClick={() => openClient(user)}
                className="flex min-h-[76px] w-full items-center gap-3 rounded-xl border border-white/[0.08] bg-slate-950/60 p-3 text-right transition-colors active:bg-sky-400/[0.08]"
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold" style={{ background: getRoleInfo(user.role).bg, border: `1px solid ${getRoleInfo(user.role).color}30`, color: getRoleInfo(user.role).color }}>
                  {user.username?.[0]?.toUpperCase() || "؟"}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-bold text-slate-100">{user.username}</span>
                  <span className="mt-1 block truncate text-[11px] text-slate-500">{user.officeName || getRoleInfo(user.role).label} · آخر فاتورة {new Date(user.lastInvoice).toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit" })}</span>
                </span>
                <span className="shrink-0 rounded-full border border-amber-400/20 bg-amber-400/10 px-2.5 py-1 text-xs font-bold text-amber-300">{user.count}</span>
                <span className="shrink-0 text-slate-500" aria-hidden="true">‹</span>
              </button>
            ))}
          </div>
        </>
      )}

      {selectedClient && (
        <ClientInvoicesDialog
          client={selectedClient}
          canDelete={data.canDeleteInvoices}
          onClose={closeClient}
          onInvoicesChanged={handleInvoicesChanged}
        />
      )}
    </Section>
  );
}
