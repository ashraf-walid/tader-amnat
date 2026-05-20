'use client';

import { useState } from "react";
import { format } from "date-fns";
import { STORAGE_CONFIG, SERVICES_LIST } from "@/lib/storageConstants";
import { ArrowLeft } from "lucide-react"
import { calculateFinalInvoice, calculateMultiContainerInvoice } from "@/lib/storageCalculator";
import ArabicDatePicker from "@/components/ArabicDatePicker";

// ─────────────────────────────────────────────
// سعر الصرف اليومي — يأتي من الـ admin (prop أو context)
// هنا قيمة افتراضية للعرض
const DAILY_RATE_FROM_ADMIN = STORAGE_CONFIG.GLOBAL.DEFAULT_EXCHANGE_RATE;
// ─────────────────────────────────────────────

function fmt(n, dec = 2) {
  return Number(n).toLocaleString("ar-EG", { minimumFractionDigits: dec, maximumFractionDigits: dec });
}

// ════════════════════════ CSS ════════════════════════
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Tajawal:wght@300;400;500;700;800&display=swap');

.sc2 *, .sc2 *::before, .sc2 *::after { box-sizing:border-box; margin:0; padding:0; }

.sc2 {
  --bg:     #0b1120;
  --bg2:    #111827;
  --bg3:    #1a2035;
  --bg4:    #1f2847;
  --brd:    rgba(255,255,255,0.07);
  --brd2:   rgba(255,255,255,0.12);
  --acc:    #f0b429;
  --acc-d:  rgba(240,180,41,0.12);
  --acc-g:  rgba(240,180,41,0.20);
  --txt:    #f0f2f8;
  --txt2:   #8892a4;
  --txt3:   #4a5568;
  --green:  #34d399;
  --green-d:rgba(52,211,153,0.1);
  --red:    #f87171;
  --red-d:  rgba(248,113,113,0.09);
  --inp:    #1a2035;
  --muted:  #4a5568;
  --r:      12px;
  --r2:     16px;
  --r3:     20px;
  font-family:'Tajawal',system-ui,sans-serif;
  direction:rtl;
  background:var(--bg);
  min-height:100vh;
  color:var(--txt);
  -webkit-font-smoothing:antialiased;
}

.sc2-page { max-width:700px; margin:0 auto; padding:1.5rem 1rem 5rem; }

/* ── Header ── */
.sc2-header {
  display:flex; align-items:center; gap:14px;
  margin-bottom:2rem; padding-bottom:1.25rem;
  border-bottom:1px solid var(--brd);
}
.sc2-logo {
  width:46px; height:46px; border-radius:13px;
  background:linear-gradient(135deg,#f0b429,#e8940a);
  display:flex; align-items:center; justify-content:center;
  font-size:22px; flex-shrink:0;
  box-shadow:0 4px 16px rgba(240,180,41,.3);
}
.sc2-header-text h1 { font-size:20px; font-weight:800; letter-spacing:-.3px; }
.sc2-header-text p  { font-size:12px; color:var(--txt2); margin-top:2px; }

/* ── Exchange Rate Banner ── */
.sc2-rate-banner {
  display:flex; align-items:center; justify-content:space-between;
  background:var(--bg2); border:1px solid var(--brd2);
  border-radius:var(--r2); padding:14px 18px;
  margin-bottom:1.25rem; gap:12px; flex-wrap:wrap;
}
.sc2-rate-left   { display:flex; align-items:center; gap:10px; }
.sc2-rate-dot    { width:8px; height:8px; border-radius:50%; background:var(--green); flex-shrink:0; box-shadow:0 0 8px var(--green); animation:sc2-pulse 2s infinite; }
@keyframes sc2-pulse { 0%,100%{opacity:1;} 50%{opacity:.4;} }
.sc2-rate-label  { font-size:12px; color:var(--txt2); }
.sc2-rate-val    { font-size:20px; font-weight:800; color:var(--txt); }
.sc2-rate-sub    { font-size:11px; color:var(--txt3); margin-top:1px; }
.sc2-rate-edit   {
  display:flex; align-items:center; gap:6px; font-size:12px;
  color:var(--txt2); background:var(--bg3); border:1px solid var(--brd2);
  border-radius:8px; padding:7px 12px; cursor:pointer;
  transition:all .15s; white-space:nowrap;
}
.sc2-rate-edit:hover { color:var(--acc); border-color:rgba(240,180,41,.3); }

/* Rate override input */
.sc2-rate-override {
  display:flex; align-items:center; gap:8px;
  background:var(--bg3); border:1.5px solid var(--acc);
  border-radius:10px; padding:8px 12px; margin-top:10px;
  box-shadow:0 0 0 3px var(--acc-d);
  width:100%;
}
.sc2-rate-override input {
  flex:1; background:none; border:none; outline:none;
  font-family:inherit; font-size:15px; font-weight:700;
  color:var(--acc); text-align:right; direction:rtl; min-width:0;
}
.sc2-rate-override-cancel {
  background:none; border:none; cursor:pointer;
  color:var(--txt3); font-size:18px; line-height:1; padding:2px 4px;
  transition:color .15s;
}
.sc2-rate-override-cancel:hover { color:var(--red); }
.sc2-rate-override-label { font-size:12px; color:var(--txt2); white-space:nowrap; }

/* ── Primary Card (التواريخ + الحاوية) ── */
.sc2-primary {
  background:var(--bg2); border:1px solid var(--brd2);
  border-radius:var(--r3); padding:1.5rem;
  margin-bottom:1rem;
}

/* ── Section label ── */
.sc2-sec-lbl {
  font-size:10px; font-weight:700; letter-spacing:.1em;
  text-transform:uppercase; color:var(--txt3);
  margin-bottom:.8rem; display:flex; align-items:center; gap:7px;
}
.sc2-sec-lbl::before { content:''; display:block; width:3px; height:14px; background:var(--acc); border-radius:2px; }

/* ── Divider ── */
.sc2-divider { height:1px; background:var(--brd); margin:1.25rem 0; }

/* ── Grids ── */
.g2  { display:grid; grid-template-columns:1fr 1fr; gap:12px; }
.g3  { display:grid; grid-template-columns:1fr 1fr 1fr; gap:10px; }
.gm  { display:grid; grid-template-columns:repeat(auto-fit,minmax(120px,1fr)); gap:10px; }
@media(max-width:500px){
  .g2  { grid-template-columns:1fr; gap:10px; }
  .g3  { grid-template-columns:1fr 1fr; }
}

/* ── Field ── */
.sc2-field { display:flex; flex-direction:column; gap:7px; }
.sc2-lbl   { font-size:11px; font-weight:600; color:var(--txt3); letter-spacing:.05em; text-transform:uppercase; }

.sc2-input, .sc2-select {
  font-family:inherit; font-size:15px; font-weight:500;
  padding:13px 14px; border-radius:var(--r);
  border:1.5px solid var(--brd2); background:var(--inp);
  color:var(--txt); width:100%; text-align:right; direction:rtl;
  outline:none; -webkit-appearance:none; appearance:none;
  transition:border-color .15s,box-shadow .15s;
}
.sc2-input:focus, .sc2-select:focus {
  border-color:var(--acc);
  box-shadow:0 0 0 3px var(--acc-d);
}
.sc2-select {
  background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%234a5568' stroke-width='1.6' fill='none' stroke-linecap='round'/%3E%3C/svg%3E");
  background-repeat:no-repeat; background-position:left 13px center; padding-left:36px;
}
.sc2-select option { background:#1a2035; color:#f0f2f8; }

/* ── Counter ── */
.sc2-counter {
  display:flex; align-items:center; gap:0;
  border:1.5px solid var(--brd2); border-radius:var(--r);
  background:var(--inp); overflow:hidden;
}
.sc2-counter-btn {
  width:46px; height:48px; border:none; background:none;
  color:var(--txt2); font-size:22px; cursor:pointer;
  display:flex; align-items:center; justify-content:center;
  transition:background .15s,color .15s; flex-shrink:0;
}
.sc2-counter-btn:hover { background:var(--bg4); color:var(--acc); }
.sc2-counter-val {
  flex:1; text-align:center; font-size:18px; font-weight:800;
  color:var(--txt); user-select:none;
}
.sc2-counter-sub { font-size:10px; color:var(--txt3); font-weight:400; }

/* ── Billing Tabs ── */
.sc2-tabs { display:flex; gap:0; background:var(--bg); border-radius:var(--r); overflow:hidden; border:1px solid var(--brd); }
.sc2-tab  {
  flex:1; padding:11px; font-family:inherit; font-size:14px;
  font-weight:600; border:none; cursor:pointer;
  transition:all .2s; color:var(--txt2); background:transparent;
  position:relative;
}
.sc2-tab.on { background:var(--acc); color:#0b1120; font-weight:800; }
.sc2-tab:not(.on):hover { background:var(--bg3); color:var(--txt); }

/* ── Size Toggle ── */
.sc2-size-toggle { display:flex; gap:8px; }
.sc2-size-btn {
  flex:1; padding:12px 8px; border-radius:var(--r);
  border:1.5px solid var(--brd2); background:var(--inp);
  font-family:inherit; font-size:13px; font-weight:700;
  color:var(--txt2); cursor:pointer; text-align:center;
  transition:all .15s;
}
.sc2-size-btn:hover { border-color:var(--brd2); color:var(--txt); background:var(--bg4); }
.sc2-size-btn.on { border-color:var(--acc); background:var(--acc-d); color:var(--acc); }
.sc2-size-btn span { display:block; font-size:10px; font-weight:500; color:inherit; opacity:.7; margin-top:2px; }

/* ── Cargo Chips ── */
.sc2-cargo-chips { display:flex; gap:7px; flex-wrap:wrap; }
.sc2-chip {
  padding:8px 14px; border-radius:100px;
  border:1.5px solid var(--brd2); background:var(--inp);
  font-family:inherit; font-size:13px; font-weight:600;
  color:var(--txt2); cursor:pointer; transition:all .15s;
  white-space:nowrap;
}
.sc2-chip:hover { color:var(--txt); border-color:var(--brd2); background:var(--bg4); }
.sc2-chip.on { border-color:var(--acc); background:var(--acc-d); color:var(--acc); }

/* ── Days Pill ── */
.sc2-days-pill {
  display:inline-flex; align-items:center; gap:7px;
  background:var(--acc-d); border:1px solid rgba(240,180,41,.25);
  color:var(--acc); border-radius:100px;
  font-size:13px; font-weight:700; padding:5px 14px; margin-top:14px;
}

/* ── Advanced (accordion) ── */
.sc2-adv-trigger {
  display:flex; align-items:center; justify-content:space-between;
  width:100%; background:var(--bg2); border:1px solid var(--brd);
  border-radius:var(--r2); padding:14px 18px; cursor:pointer;
  font-family:inherit; font-size:14px; font-weight:600; color:var(--txt2);
  transition:all .15s; margin-bottom:0;
}
.sc2-adv-trigger:hover { border-color:var(--brd2); color:var(--txt); }
.sc2-adv-trigger.open { border-radius:var(--r2) var(--r2) 0 0; border-bottom-color:transparent; color:var(--txt); }
.sc2-adv-trigger-arrow { transition:transform .25s; font-size:18px; }
.sc2-adv-trigger.open .sc2-adv-trigger-arrow { transform:rotate(180deg); }

.sc2-adv-body {
  background:var(--bg2); border:1px solid var(--brd); border-top:none;
  border-radius:0 0 var(--r2) var(--r2); padding:1.25rem;
  margin-bottom:1rem;
  animation:sc2-slide-in .2s ease;
}
@keyframes sc2-slide-in { from{opacity:0;transform:translateY(-8px)} to{opacity:1;transform:translateY(0)} }

/* ── Services ── */
.sc2-svcs { display:grid; grid-template-columns:1fr 1fr; gap:8px; }
@media(max-width:380px){ .sc2-svcs { grid-template-columns:1fr; } }
.sc2-svc {
  display:flex; align-items:center; gap:10px;
  padding:11px 12px; border-radius:var(--r);
  border:1.5px solid var(--brd); background:var(--bg3);
  cursor:pointer; user-select:none; transition:all .15s;
}
.sc2-svc:hover { border-color:var(--brd2); }
.sc2-svc.on   { border-color:var(--acc); background:var(--acc-d); }
.sc2-svc input { display:none; }
.sc2-chk {
  width:19px; height:19px; flex-shrink:0; border-radius:6px;
  border:1.5px solid var(--brd2); display:flex; align-items:center;
  justify-content:center; background:var(--bg); transition:all .15s;
}
.sc2-svc.on .sc2-chk { background:var(--acc); border-color:var(--acc); }
.sc2-chk-ico { display:none; }
.sc2-svc.on .sc2-chk-ico { display:block; }
.sc2-svc-name  { font-size:13px; color:var(--txt); flex:1; font-weight:500; }
.sc2-svc-price { font-size:11px; color:var(--txt3); font-weight:700; }

/* ── Calc Button ── */
.sc2-btn {
  width:100%; padding:16px; font-family:inherit; font-size:16px;
  font-weight:800; border-radius:var(--r2); border:none;
  background:linear-gradient(135deg,#f0b429,#e8940a);
  color:#0b1120; cursor:pointer; margin-top:8px;
  letter-spacing:.02em;
  box-shadow:0 4px 24px rgba(240,180,41,.3);
  transition:opacity .15s,transform .1s,box-shadow .15s;
}
.sc2-btn:hover { opacity:.92; box-shadow:0 6px 32px rgba(240,180,41,.4); }
.sc2-btn:active { transform:scale(.99); }

/* ── Error ── */
.sc2-err {
  display:flex; align-items:flex-start; gap:8px;
  color:var(--red); font-size:13px; padding:12px 16px;
  background:var(--red-d); border:1px solid rgba(248,113,113,.2);
  border-radius:var(--r); margin-top:10px; line-height:1.6;
}

/* ── Result ── */
.sc2-result { margin-top:1.5rem; animation:sc2-fadeup .35s ease; }
@keyframes sc2-fadeup { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }

.sc2-result-card {
  background:var(--bg2); border:1px solid var(--brd2);
  border-radius:var(--r3); overflow:hidden;
}
.sc2-result-header {
  padding:16px 20px; background:var(--bg3);
  border-bottom:1px solid var(--brd);
  display:flex; align-items:center; gap:10px;
  font-size:13px; font-weight:700; color:var(--txt2);
  letter-spacing:.06em; text-transform:uppercase;
}

/* Metrics */
.sc2-metrics { display:grid; grid-template-columns:repeat(3,1fr); gap:0; border-bottom:1px solid var(--brd); }
.sc2-metric { padding:16px 12px; text-align:center; border-left:1px solid var(--brd); }
.sc2-metric:last-child { border-left:none; }
.sc2-m-lbl  { font-size:10px; color:var(--txt3); margin-bottom:5px; font-weight:600; letter-spacing:.05em; text-transform:uppercase; }
.sc2-m-val  { font-size:22px; font-weight:800; color:var(--txt); line-height:1; }
.sc2-m-unit { font-size:10px; color:var(--txt3); margin-top:3px; }
@media(max-width:400px){ .sc2-metrics { grid-template-columns:1fr 1fr; } .sc2-metric { border-bottom:1px solid var(--brd); } }

/* Rows */
.sc2-trow {
  display:flex; justify-content:space-between; align-items:center;
  padding:12px 20px; border-bottom:1px solid var(--brd); font-size:14px;
}
.sc2-trow:last-child { border-bottom:none; }
.sc2-trow .tl { color:var(--txt2); }
.sc2-trow .tv { font-weight:700; color:var(--txt); }
.sc2-trow.subtotal { background:var(--bg3); }
.sc2-trow.subtotal .tv { color:var(--acc); }

/* Final */
.sc2-final {
  display:flex; justify-content:space-between; align-items:center;
  padding:20px; background:linear-gradient(135deg,rgba(240,180,41,.15),rgba(240,180,41,.05));
  border-top:1px solid rgba(240,180,41,.3);
}
.sc2-final .tl { font-size:15px; font-weight:700; color:var(--acc); }
.sc2-final .tv { font-size:28px; font-weight:800; color:var(--acc); letter-spacing:-.5px; }

/* Breakdown */
.sc2-brk { padding:14px 20px; background:var(--bg); border-top:1px solid var(--brd); }
.sc2-brk-title { font-size:10px; font-weight:700; color:var(--txt3); letter-spacing:.08em; text-transform:uppercase; margin-bottom:8px; }
.sc2-brk-row {
  display:flex; justify-content:space-between;
  font-size:12px; color:var(--txt3); padding:4px 0;
  border-bottom:1px dashed var(--brd);
}
.sc2-brk-row:last-child { border-bottom:none; }
.sc2-brk-row .bv { color:var(--txt2); font-weight:700; }
`;

function InjectCSS() {
  if (typeof document !== 'undefined' && !document.getElementById('sc2-css')) {
    const s = document.createElement('style');
    s.id = 'sc2-css'; s.textContent = CSS;
    document.head.appendChild(s);
  }
  return null;
}

// ════════════════════════ Component ════════════════════════
export default function StorageCalculator({
  adminExchangeRate = DAILY_RATE_FROM_ADMIN,
}) {
  // ── Primary state ──
  const [arrDate, setArrDate] = useState(null);
  const [relDate, setRelDate] = useState(new Date());
  const [billingType, setBillingType] = useState("INITIAL");
  const [twentyCount, setTwentyCount] = useState(1);
  const [fortyCount, setFortyCount] = useState(0);
  const [cargoType, setCargoType] = useState("FULL");

  // ── Exchange rate ──
  const [isEditingRate, setIsEditingRate] = useState(false);
  const [isRateOverridden, setIsRateOverridden] = useState(false);
  const [customRate, setCustomRate] = useState(String(adminExchangeRate));
  const exchangeRate = isRateOverridden ? (Number(customRate) || adminExchangeRate) : adminExchangeRate;

  // ── Advanced / secondary state ──
  const [advOpen, setAdvOpen] = useState(false);
  const [prevDays, setPrevDays] = useState(0);
  const [nonStdType, setNonStdType] = useState("OOG");
  const [isDangerous, setIsDangerous] = useState(false);
  const [services, setServices] = useState({});

  // ── Result ──
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  function toggleService(id) {
    setServices(prev => ({ ...prev, [id]: !prev[id] }));
  }

  function liveDays() {
    if (!arrDate || !relDate) return null;
    const a = new Date(arrDate); a.setHours(0, 0, 0, 0);
    const r = new Date(relDate); r.setHours(0, 0, 0, 0);
    const d = Math.ceil((r - a) / 86400000) + 1;
    return d > 0 ? d : null;
  }

  function calculate() {
    setError(""); setResult(null);
    if (!arrDate || !relDate) { setError("الرجاء إدخال تاريخ الوصول والصرف."); return; }
    if (twentyCount <= 0 && fortyCount <= 0) { setError("الرجاء إدخال عدد الحاويات (20 أو 40 قدم)."); return; }

    try {
      const arrStr = format(arrDate, 'yyyy-MM-dd');
      const relStr = format(relDate, 'yyyy-MM-dd');

      const containerGroups = [];
      const isDangerousCargo = cargoType === "DANGEROUS";

      // تجهيز بيانات حاويات 20 قدم
      if (twentyCount > 0) {
        const baseConfig = STORAGE_CONFIG.IMPORT.TWENTY_FT;
        let surchargeConfig = null;
        if (cargoType === "REEFER") surchargeConfig = baseConfig.REEFER;
        else if (cargoType === "NON_STANDARD") {
          const nsCfg = baseConfig.NON_STANDARD[nonStdType];
          surchargeConfig = {
            ...baseConfig.FULL,
            TIERS: baseConfig.FULL.TIERS.map(t => ({ ...t, rate: t.rate * (nsCfg.RATE_MULTIPLIER - 1) }))
          };
        }

        containerGroups.push({
          sizeLabel: "٢٠ قدم",
          count: twentyCount,
          config: baseConfig.FULL,
          dangerousConfig: baseConfig.DANGEROUS,
          surchargeConfig,
          isDangerous: isDangerousCargo,
          // note: these could be made per-group in UI if needed, for now global
          hasCargoService: false,
          hasCargoStorage: false
        });
      }

      // تجهيز بيانات حاويات 40 قدم
      if (fortyCount > 0) {
        const baseConfig = STORAGE_CONFIG.IMPORT.FORTY_FT;
        let surchargeConfig = null;
        if (cargoType === "REEFER") surchargeConfig = baseConfig.REEFER;
        else if (cargoType === "NON_STANDARD") {
          const nsCfg = baseConfig.NON_STANDARD[nonStdType];
          surchargeConfig = {
            ...baseConfig.FULL,
            TIERS: baseConfig.FULL.TIERS.map(t => ({ ...t, rate: t.rate * (nsCfg.RATE_MULTIPLIER - 1) }))
          };
        }

        containerGroups.push({
          sizeLabel: "٤٠ قدم",
          count: fortyCount,
          config: baseConfig.FULL,
          dangerousConfig: baseConfig.DANGEROUS,
          surchargeConfig,
          isDangerous: isDangerousCargo,
          hasCargoService: false,
          hasCargoStorage: false
        });
      }

      const selectedServices = SERVICES_LIST.filter(s => services[s.id]);

      const invoice = calculateMultiContainerInvoice(
        arrStr, relStr, containerGroups, STORAGE_CONFIG.GLOBAL,
        {
          exchangeRate,
          billingType,
          previousDays: prevDays,
          isExternalStorage: false, // can be added to UI
          additionalServices: selectedServices,
          isDangerous: isDangerousCargo
        }
      );
      setResult(invoice);
      // scroll to result on mobile
      setTimeout(() => document.getElementById('sc2-result')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);
    } catch (e) {
      setError(e.message);
    }
  }

  const days = liveDays();
  const hasAdvanced = billingType === "RENEWAL" || cargoType !== "FULL" || isDangerous || Object.values(services).some(Boolean);

  return (
    <div className="sc2">
      <InjectCSS />
      <div className="sc2-page">

        {/* ── Header ── */}
        <div className="sc2-header">
          <div className="sc2-logo">⚓</div>
          <div className="sc2-header-text">
            <h1>تقدير فواتير الوارد</h1>
            <p>حاويات ميناء دمياط / ٢٠ قدم & ٤٠ قدم</p>
          </div>
        </div>

        {/* ══════════════════════════════════════════
            سعر الصرف — يومي من الأدمن
        ══════════════════════════════════════════ */}
        <div className="sc2-rate-banner">
          <div className="sc2-rate-left">
            <span className="sc2-rate-dot" style={{ background: isRateOverridden ? 'var(--acc)' : 'var(--green)', boxShadow: isRateOverridden ? '0 0 8px var(--acc)' : '0 0 8px var(--green)' }} />
            <div>
              <div className="sc2-rate-label">{isRateOverridden ? "سعر صرف مخصص" : "سعر الصرف اليوم"}</div>
              <div className="sc2-rate-val">{fmt(isRateOverridden ? exchangeRate : adminExchangeRate)} <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--txt2)' }}>ج.م / $</span></div>
              <div className="sc2-rate-sub">{isRateOverridden ? "تم التعديل بواسطة المستخدم" : "مُسجَّل بواسطة الإدارة"}</div>
            </div>
          </div>
          
          {!isEditingRate ? (
            <div style={{ display: 'flex', gap: 8 }}>
              {isRateOverridden && (
                <button className="sc2-rate-edit" style={{ color: 'var(--red)', borderColor: 'var(--red-d)' }} onClick={() => { setIsRateOverridden(false); setCustomRate(String(adminExchangeRate)); }}>
                  إلغاء المخصص
                </button>
              )}
              <button className="sc2-rate-edit" onClick={() => setIsEditingRate(true)}>
                <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
                  <path d="M11 2l3 3L5 14H2v-3L11 2z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
                </svg>
                تعديل السعر
              </button>
            </div>
          ) : (
            <div style={{ flex: 1, minWidth: 200 }}>
              <div className="sc2-rate-override">
                <span className="sc2-rate-override-label">سعر مخصص</span>
                <input
                  type="number" min={1} step={0.01}
                  value={customRate}
                  onChange={e => setCustomRate(e.target.value)}
                  autoFocus
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      setIsRateOverridden(true);
                      setIsEditingRate(false);
                    }
                  }}
                />
                <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--acc)' }}>ج.م</span>
                
                <button 
                  style={{ background: 'var(--green)', border: 'none', color: '#0b1120', padding: '4px 10px', borderRadius: '4px', cursor: 'pointer', fontSize: 13, fontWeight: '700' }}
                  onClick={() => { setIsRateOverridden(true); setIsEditingRate(false); }} 
                  title="تأكيد التعديل">
                  ✓ تأكيد
                </button>

                <button className="sc2-rate-override-cancel" onClick={() => { setIsEditingRate(false); if(!isRateOverridden) setCustomRate(String(adminExchangeRate)); }} title="إلغاء التعديل">✕</button>
              </div>
            </div>
          )}
        </div>

        {/* ══════════════════════════════════════════
            PRIMARY — الأكثر استخداماً
        ══════════════════════════════════════════ */}
        <div className="sc2-primary">

          {/* التواريخ */}
          <div className="sc2-sec-lbl">تواريخ الوصول والصرف</div>
          <div className="g2">
            <ArabicDatePicker
              id="arr" label="تاريخ الوصول"
              selected={arrDate} onChange={setArrDate}
              maxDate={relDate || undefined}
              placeholderText="يوم / شهر / سنة"
            />
            <ArabicDatePicker
              id="rel" label="تاريخ الصرف"
              selected={relDate} onChange={setRelDate}
              minDate={arrDate || undefined}
              placeholderText="يوم / شهر / سنة"
            />
          </div>
          {days && (
            <div className="sc2-days-pill">
              <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
                <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5" />
                <path d="M8 4.5v4l2.5 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
              {days} يوم — مدة التخزين
            </div>
          )}

          <div className="sc2-divider" />

          {/* نوع الصرف */}
          <div className="sc2-sec-lbl" style={{ marginBottom: '.6rem' }}>نوع الصرف</div>
          <div className="sc2-tabs" style={{ marginBottom: '1.2rem' }}>
            {[["INITIAL", "صرف أول مرة"], ["RENEWAL", "تجديد"]].map(([v, l]) => (
              <button key={v} className={`sc2-tab${billingType === v ? " on" : ""}`} onClick={() => setBillingType(v)}>{l}</button>
            ))}
          </div>

          {/* أعداد الحاويات */}
          <div className="sc2-sec-lbl" style={{ marginBottom: '.8rem' }}>أعداد الحاويات في البوليصة</div>
          <div className="gm" style={{ marginBottom: '1.2rem' }}>
            <div className="sc2-field">
              <label className="sc2-lbl">٢٠ قدم (Twenty-foot)</label>
              <div className="sc2-counter">
                <button className="sc2-counter-btn" onClick={() => setTwentyCount(c => Math.max(0, c - 1))}>−</button>
                <div className="sc2-counter-val">
                  {twentyCount}
                </div>
                <button className="sc2-counter-btn" onClick={() => setTwentyCount(c => c + 1)}>+</button>
              </div>
            </div>
            <div className="sc2-field">
              <label className="sc2-lbl">٤٠ قدم (Forty-foot)</label>
              <div className="sc2-counter">
                <button className="sc2-counter-btn" onClick={() => setFortyCount(c => Math.max(0, c - 1))}>−</button>
                <div className="sc2-counter-val">
                  {fortyCount}
                </div>
                <button className="sc2-counter-btn" onClick={() => setFortyCount(c => c + 1)}>+</button>
              </div>
            </div>
          </div>

          {/* نوع البضاعة */}
          <div className="sc2-sec-lbl" style={{ marginBottom: '.6rem' }}>نوع البضاعة</div>
          <div className="sc2-cargo-chips" style={{ marginBottom: '0.5rem' }}>
            {[
              ["FULL", "عادية"],
              ["REEFER", "ثلاجة ❄️"],
              ["DANGEROUS", "خطرة ⚠️"],
              ["NON_STANDARD", "غير منتظمة"],
            ].map(([v, l]) => (
              <button key={v} className={`sc2-chip${cargoType === v ? " on" : ""}`} onClick={() => setCargoType(v)}>{l}</button>
            ))}
          </div>

        </div>

        {/* ══════════════════════════════════════════
            SECONDARY — خيارات متقدمة (accordion)
        ══════════════════════════════════════════ */}
        <button className={`sc2-adv-trigger${advOpen ? " open" : ""}`} onClick={() => setAdvOpen(o => !o)}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
              <path d="M2 4h12M4 8h8M6 12h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            خيارات متقدمة
            {hasAdvanced && <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--acc)', display: 'inline-block', marginRight: 2 }} />}
          </span>
          <span className="sc2-adv-trigger-arrow">⌄</span>
        </button>

        {advOpen && (
          <div className="sc2-adv-body">

            {/* الأيام السابقة — تظهر فقط عند التجديد */}
            {billingType === "RENEWAL" && (
              <>
                <div className="sc2-sec-lbl">الأيام السابقة (عند التجديد)</div>
                <div className="sc2-field" style={{ marginBottom: '1rem' }}>
                  <input type="number" className="sc2-input" value={prevDays} min={0}
                    onChange={e => setPrevDays(Number(e.target.value))} placeholder="0" />
                </div>
              </>
            )}

            {/* نوع غير المنتظمة */}
            {cargoType === "NON_STANDARD" && (
              <>
                <div className="sc2-sec-lbl">تصنيف الحاوية غير المنتظمة</div>
                <div className="sc2-field" style={{ marginBottom: '1rem' }}>
                  <select className="sc2-select" value={nonStdType} onChange={e => setNonStdType(e.target.value)}>
                    <option value="OOG">غير منتظم (OOG) — السعر × ٢</option>
                    <option value="FLAT_RACK">هيكل (Flat Rack) — السعر × ٣</option>
                    <option value="LASHING">تصبين (Lashing) — السعر × ٤</option>
                  </select>
                </div>
              </>
            )}

            {/* الخدمات الإضافية */}
            <div className="sc2-sec-lbl" style={{ marginBottom: '.6rem' }}>خدمات إضافية</div>
            <div className="sc2-svcs">
              {SERVICES_LIST.map(svc => {
                const on = !!services[svc.id];
                return (
                  <label key={svc.id} className={`sc2-svc${on ? " on" : ""}`}>
                    <input type="checkbox" checked={on} onChange={() => toggleService(svc.id)} />
                    <span className="sc2-chk">
                      <svg className="sc2-chk-ico" width="11" height="9" viewBox="0 0 11 9" fill="none">
                        <path d="M1 4L4 7.5L10 1" stroke="#0b1120" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </span>
                    <span className="sc2-svc-name">{svc.name}</span>
                    <span className="sc2-svc-price">${svc.rate}</span>
                  </label>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Calc Button ── */}
        <button className="sc2-btn flex items-center justify-center gap-2" onClick={calculate} style={{ marginTop: '1.25rem' }}>
          احسب الفاتورة <ArrowLeft className="w-4 h-4" />
        </button>

        {error && <div className="sc2-err"><span>⚠</span><span>{error}</span></div>}

        {/* ════════════════════════════════════════
            النتيجة
        ════════════════════════════════════════ */}
        {result && (
          <div className="sc2-result" id="sc2-result">
            <div className="sc2-result-card">

              <div className="sc2-result-header">
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                  <rect x="2" y="1" width="12" height="14" rx="2" stroke="currentColor" strokeWidth="1.5" />
                  <path d="M5 5h6M5 8h6M5 11h4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
                </svg>
                ملخص الفاتورة
              </div>

              {/* Metrics */}
              <div className="sc2-metrics">
                {[
                  ["الأيام", result.summary.days, "يوم"],
                  ["الحاويات", result.summary.groups.reduce((acc, g) => acc + g.count, 0), "حاوية"],
                  ["سعر الصرف", fmt(result.summary.exchangeRate), "ج.م/$"],
                ].map(([l, v, u]) => (
                  <div key={l} className="sc2-metric">
                    <div className="sc2-m-lbl">{l}</div>
                    <div className="sc2-m-val">{v}</div>
                    <div className="sc2-m-unit">{u}</div>
                  </div>
                ))}
              </div>

              {/* Rows */}
              {[
                ["رسوم التخزين", `$${fmt(result.usd.storageFee)}`, false],
                ["رسوم الخدمات الثابتة", `$${fmt(result.usd.fixedFees)}`, false],
                ...(result.usd.additionalServices > 0
                  ? [["الخدمات الإضافية", `$${fmt(result.usd.additionalServices)}`, false]]
                  : []),
                ["الإجمالي بالدولار", `$${fmt(result.usd.subtotal)}`, true],
                ["الإجمالي بالجنيه", `${fmt(result.egp.subtotal, 0)} ج.م`, false],
                ["ضريبة القيمة المضافة 14%", `${fmt(result.egp.vatAmount, 0)} ج.م`, false],
                ["طابع الشهيد", `${result.egp.martyrStamp} ج.م`, false],
              ].map(([l, v, sub]) => (
                <div key={l} className={`sc2-trow${sub ? " subtotal" : ""}`}>
                  <span className="tl">{l}</span>
                  <span className="tv">{v}</span>
                </div>
              ))}

              <div className="sc2-final">
                <span className="tl">الإجمالي النهائي</span>
                <span className="tv">{fmt(result.egp.total, 0)} ج.م</span>
              </div>

              {result.details.storageBreakdown.length > 0 && (
                <div className="sc2-brk">
                  <div className="sc2-brk-title">تفصيل شرائح التخزين</div>
                  {result.details.storageBreakdown.map((b, i) => (
                    <div key={i} className="sc2-brk-row">
                      <span>{b.tierName} — {b.days} يوم (من {b.fromDay} إلى {b.toDay})</span>
                      <span className="bv">${fmt(b.subtotal)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {result && (
          <button className="sc2-btn" onClick={() => { setResult(null); setArrDate(null); setRelDate(new Date()); setTwentyCount(1); setFortyCount(0); setCargoType("FULL"); }} style={{ marginTop: '1.25rem', background: 'none', border: '1px solid var(--brd2)', color: 'var(--txt2)', boxShadow: 'none' }}>
            {billingType === "RENEWAL" && result.usd.storageFee === 0 ? "بدء حساب بوليصة جديدة" : "إبدأ حساب بوليصه اخرى"}
          </button>
        )}

      </div>
    </div>
  );
}