'use client';

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { STORAGE_CONFIG, SERVICES_LIST } from "@/lib/storageConstants";
import { ArrowLeft } from "lucide-react"
import { calculateMultiContainerInvoice, calculateStorageFee } from "@/lib/storageCalculator";
import ArabicDatePicker from "@/components/ArabicDatePicker";
import {
  EditIcon,
  ClockIcon,
  OptionsIcon,
  CheckIcon,
  SummaryIcon,
  InfoIcon
} from "../../components/Icons";
import Link from "next/link";

// ─────────────────────────────────────────────
// Daily exchange rate — comes from admin (prop or context)
// This is a default display value
const DAILY_RATE_FROM_ADMIN = STORAGE_CONFIG.GLOBAL.DEFAULT_EXCHANGE_RATE;
// ─────────────────────────────────────────────

function fmt(n, dec = 2) {
  return Number(n).toLocaleString("ar-EG", { minimumFractionDigits: dec, maximumFractionDigits: dec });
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
  const [dynamicAdminRate, setDynamicAdminRate] = useState(adminExchangeRate);
  const [isEditingRate, setIsEditingRate] = useState(false);
  const [isRateOverridden, setIsRateOverridden] = useState(false);
  const [customRate, setCustomRate] = useState(String(adminExchangeRate));
  const exchangeRate = isRateOverridden ? (Number(customRate) || dynamicAdminRate) : dynamicAdminRate;

  useEffect(() => {
    fetch('/api/settings')
      .then(res => res.json())
      .then(data => {
        if (data.success && data.exchangeRate) {
          setDynamicAdminRate(data.exchangeRate);
          setCustomRate(prev => isRateOverridden ? prev : String(data.exchangeRate));
        }
      })
      .catch(err => console.error("Failed to fetch exchange rate", err));
  }, [isRateOverridden]);

  // ── Advanced / secondary state ──
  const [advOpen, setAdvOpen] = useState(false);
  const [prevDays, setPrevDays] = useState(0);
  const [nonStdType, setNonStdType] = useState("OOG");
  const [isDangerous, setIsDangerous] = useState(false);

  // ── New Appended Features ──
  const [isHolidayRelease, setIsHolidayRelease] = useState(false);
  const [hasCargoStripping, setHasCargoStripping] = useState(false);
  const [hasDangerYard, setHasDangerYard] = useState(false);
  const [hasCargoStorage, setHasCargoStorage] = useState(false);
  const [cargoExitDate, setCargoExitDate] = useState(null);
  const [isExternalStorage, setIsExternalStorage] = useState(false);
  const [isLCLStorage, setIsLCLStorage] = useState(false);

  const [services, setServices] = useState({});
  const [serviceQuantities, setServiceQuantities] = useState({});

  // الربط التلقائي: عند تفعيل تفريغ بالساحة، يتم تلقائياً تفعيل تفريغ مشمول
  useEffect(() => {
    if (hasCargoStorage && !hasCargoStripping) {
      setHasCargoStripping(true);
    }
  }, [hasCargoStorage]);

  // الربط التلقائي: عند تفعيل LCL، يتم تلقائياً تفعيل تفريغ المشمول ونقل بين الساحات
  useEffect(() => {
    if (isLCLStorage) {
      setHasCargoStripping(true);
      setServices(prev => ({ ...prev, yard: true }));
    }
  }, [isLCLStorage]);

  // ── Attempts ──
  const [remainingAttempts, setRemainingAttempts] = useState(null);
  const [attemptsLoading, setAttemptsLoading] = useState(false);

  // Fetch remaining attempts on mount
  useEffect(() => {
    fetch('/api/attempts/consume')
      .then(res => res.json())
      .then(data => {
        if (data.success) setRemainingAttempts(data.remainingAttempts);
      })
      .catch(err => console.error('Failed to fetch attempts', err));
  }, []);

  // ── Result ──
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  function toggleService(id) {
    setServices(prev => {
      const isNowOn = !prev[id];
      if (!isNowOn) {
        setServiceQuantities(q => { const newQ = { ...q }; delete newQ[id]; return newQ; });
      }
      return { ...prev, [id]: isNowOn };
    });
  }

  function liveDays() {
    if (!arrDate || !relDate) return null;
    const a = new Date(arrDate); a.setHours(0, 0, 0, 0);
    const r = new Date(relDate); r.setHours(0, 0, 0, 0);
    const d = Math.ceil((r - a) / 86400000) + 1;
    return d > 0 ? d : null;
  }

  async function calculate() {
    setError(""); setResult(null);
    if (!arrDate || !relDate) { setError("الرجاء إدخال تاريخ الوصول والصرف."); return; }
    if (twentyCount <= 0 && fortyCount <= 0) { setError("الرجاء إدخال عدد الحاويات (20 أو 40 قدم)."); return; }

    // التحقق من تاريخ خروج المشمول
    if (hasCargoStorage && !cargoExitDate) {
      setError("الرجاء تحديد تاريخ خروج المشمول من الحاوية.");
      return;
    }

    // Consume attempt before calculating
    setAttemptsLoading(true);
    try {
      const attemptRes = await fetch('/api/attempts/consume', { method: 'POST' });
      const attemptData = await attemptRes.json();
      if (!attemptRes.ok || !attemptData.success) {
        setError(attemptData.error || 'لا توجد محاولات كافية. يرجى الاتصال بالإدارة.');
        setAttemptsLoading(false);
        return;
      }
      setRemainingAttempts(attemptData.remainingAttempts);
    } catch (err) {
      setError('حدث خطأ في الاتصال بالخادم أثناء التحقق من المحاولات.');
      setAttemptsLoading(false);
      return;
    }
    setAttemptsLoading(false);

    const maxDays = liveDays() || 0;
    if (billingType === "RENEWAL" && prevDays > maxDays) {
      setError(`الأيام المسددة سابقاً (${prevDays} يوم) لا يمكن أن تتجاوز إجمالي مدة التخزين (${maxDays} يوم).`);
      return;
    }

    try {
      const arrStr = format(arrDate, 'yyyy-MM-dd');
      const relStr = format(relDate, 'yyyy-MM-dd');

      // حساب أيام تخزين الحاوية (من arrivalDate إلى releaseDate)
      const days = maxDays;

      // حساب أيام تخزين المشمول (من cargoExitDate إلى releaseDate)
      let cargoDays = 0;
      if (hasCargoStorage && cargoExitDate) {
        const cargoExit = new Date(cargoExitDate);
        cargoExit.setHours(0, 0, 0, 0);
        const release = new Date(relDate);
        release.setHours(0, 0, 0, 0);
        cargoDays = Math.ceil((release - cargoExit) / 86400000) + 1;
        cargoDays = cargoDays > 0 ? cargoDays : 0;
      }

      const containerGroups = [];
      const isDangerousCargo = cargoType === "DANGEROUS";
      const totalConts = twentyCount + fortyCount;

      // Extract quantities for special services
      const strippedQty = serviceQuantities['stripping'] !== undefined ? Number(serviceQuantities['stripping']) : totalConts;
      const holidayQty = serviceQuantities['holiday'] !== undefined ? Number(serviceQuantities['holiday']) : totalConts;
      const dangerYardQty = serviceQuantities['dangeryard'] !== undefined ? Number(serviceQuantities['dangeryard']) : totalConts;
      const cargoStorageQty = serviceQuantities['cargostorage'] !== undefined ? Number(serviceQuantities['cargostorage']) : totalConts;

      // Distribute stripping qty (prioritize 40ft as standard, then 20ft)
      let remStripped = strippedQty;
      const stripping40 = fortyCount > 0 ? Math.min(remStripped, fortyCount) : 0;
      remStripped -= stripping40;
      const stripping20 = twentyCount > 0 ? Math.min(remStripped, twentyCount) + Math.max(0, remStripped - twentyCount) : remStripped;

      // Distribute cargo storage qty
      let remCargoStorage = cargoStorageQty;
      const cargoStorage40 = fortyCount > 0 ? Math.min(remCargoStorage, fortyCount) : 0;
      remCargoStorage -= cargoStorage40;
      const cargoStorage20 = twentyCount > 0 ? Math.min(remCargoStorage, twentyCount) + Math.max(0, remCargoStorage - twentyCount) : remCargoStorage;

      const nsMultiplier = cargoType === "NON_STANDARD"
        ? (STORAGE_CONFIG.IMPORT.TWENTY_FT.NON_STANDARD[nonStdType]?.RATE_MULTIPLIER || 1)
        : 1;

      // Prepare 20-foot container data
      if (twentyCount > 0) {
        const baseConfig = STORAGE_CONFIG.IMPORT.TWENTY_FT;
        let surchargeConfig = null;
        let rateMultiplier = 1;

        if (cargoType === "REEFER") {
          surchargeConfig = baseConfig.REEFER;
        } else if (cargoType === "NON_STANDARD") {
          rateMultiplier = baseConfig.NON_STANDARD[nonStdType].RATE_MULTIPLIER;
        }

        containerGroups.push({
          sizeLabel: "٢٠ قدم",
          count: twentyCount,
          config: { ...baseConfig.FULL, CARGO_SERVICE_FEE: baseConfig.CARGO_SERVICE_FEE * nsMultiplier },
          dangerousConfig: { ...baseConfig.DANGEROUS, CARGO_SERVICE_FEE: baseConfig.CARGO_SERVICE_FEE * nsMultiplier },
          surchargeConfig,
          rateMultiplier,
          isDangerous: isDangerousCargo,
          hasCargoService: hasCargoStripping && stripping20 > 0,
          cargoServiceCount: stripping20,
          hasCargoStorage: hasCargoStorage && cargoStorage20 > 0,
          cargoStorageCount: cargoStorage20
        });
      }

      // Prepare 40-foot container data
      if (fortyCount > 0) {
        const baseConfig = STORAGE_CONFIG.IMPORT.FORTY_FT;
        let surchargeConfig = null;
        let rateMultiplier = 1;

        if (cargoType === "REEFER") {
          surchargeConfig = baseConfig.REEFER;
        } else if (cargoType === "NON_STANDARD") {
          rateMultiplier = baseConfig.NON_STANDARD[nonStdType].RATE_MULTIPLIER;
        }

        containerGroups.push({
          sizeLabel: "٤٠ قدم",
          count: fortyCount,
          config: { ...baseConfig.FULL, CARGO_SERVICE_FEE: baseConfig.CARGO_SERVICE_FEE * nsMultiplier },
          dangerousConfig: { ...baseConfig.DANGEROUS, CARGO_SERVICE_FEE: baseConfig.CARGO_SERVICE_FEE * nsMultiplier },
          surchargeConfig,
          rateMultiplier,
          isDangerous: isDangerousCargo,
          hasCargoService: hasCargoStripping && stripping40 > 0,
          cargoServiceCount: stripping40,
          hasCargoStorage: hasCargoStorage && cargoStorage40 > 0,
          cargoStorageCount: cargoStorage40
        });
      }

      // Apply special service rules if holiday release is selected
      const selectedServices = SERVICES_LIST.filter(s => services[s.id]).map(s => {
        let finalRate = s.rate * nsMultiplier;

        // Calculate variable transport rate based on size
        if (s.id === 'yard') {
          const shiftCfg = STORAGE_CONFIG.SERVICES.SHIFTING.YARD_TO_YARD;
          const totalC = twentyCount + fortyCount;
          if (totalC > 0) {
            // Weighted rate based on policy size distribution with non-standard multiplier applied
            finalRate = ((shiftCfg.rate20 * twentyCount + shiftCfg.rate40 * fortyCount) / totalC) * nsMultiplier;
          } else {
            finalRate = shiftCfg.rate40 * nsMultiplier; // default 
          }

          if (isHolidayRelease) {
            finalRate = finalRate * 1.5;
          }
        }

        return {
          ...s,
          rate: finalRate,
          quantity: serviceQuantities[s.id] !== undefined && serviceQuantities[s.id] !== ""
            ? Number(serviceQuantities[s.id])
            : (twentyCount + fortyCount)
        };
      });

      // Add holiday release service if enabled
      if (isHolidayRelease) {
        selectedServices.push({
          name: "صرف يوم العطلة",
          rate: 10,
          quantity: holidayQty
        });
      }

      // Calculate danger yard storage (tiered) if enabled
      let dangerYardUSD = 0;
      let dangerYardBreakdown = [];
      if (hasDangerYard) {
        const dyConfig = STORAGE_CONFIG.SERVICES.DANGER_YARD;
        const dyRes = calculateStorageFee(days, dyConfig, {});
        dangerYardUSD = dyRes.storageFeeUSD * dangerYardQty;
        dangerYardBreakdown = dyRes.breakdown;
      }

      const invoice = calculateMultiContainerInvoice(
        arrStr, relStr, containerGroups, STORAGE_CONFIG.GLOBAL,
        {
          exchangeRate,
          billingType,
          previousDays: prevDays,
          isExternalStorage,
          isLCLStorage,
          additionalServices: selectedServices,
          isDangerous: isDangerousCargo,
          isHolidayRelease,
          cargoStorageDays: cargoDays
        }
      );

      // Override cargo stripping cost if we're on a holiday release (+50%)
      if (isHolidayRelease && hasCargoStripping) {
        invoice.usd.cargoServiceFee = invoice.usd.cargoServiceFee * 1.5;
        invoice.usd.subtotal =
          (invoice.usd.storageFee || 0) +
          (invoice.usd.surchargeFee || 0) +
          (invoice.usd.cargoStorageFee || 0) +
          (invoice.usd.fixedFees || 0) +
          (invoice.usd.additionalServices || 0) +
          (invoice.usd.cargoServiceFee || 0);

        const newEgpSubtotal = invoice.usd.subtotal * exchangeRate;
        const vatRate = STORAGE_CONFIG.GLOBAL.VAT_RATE || 0.14;
        const martyrStamp = STORAGE_CONFIG.GLOBAL.MARTYR_STAMP_FEE || 5;
        const vatAmount = newEgpSubtotal * vatRate;

        invoice.egp.subtotal = newEgpSubtotal;
        invoice.egp.vatAmount = vatAmount;
        invoice.egp.total = Math.ceil(newEgpSubtotal + vatAmount + martyrStamp);
      }

      // Merge danger yard cost into final invoice
      if (hasDangerYard && dangerYardUSD > 0) {
        const dyFee = dangerYardUSD;
        invoice.usd.dangerYardFee = dyFee;
        invoice.usd.subtotal += dyFee;
        if (dangerYardBreakdown.length) {
          invoice.details.dangerYardBreakdown = dangerYardBreakdown;
        }
        const newEgpSubtotal2 = invoice.usd.subtotal * exchangeRate;
        const vatRate2 = STORAGE_CONFIG.GLOBAL.VAT_RATE || 0.14;
        const martyrStamp2 = STORAGE_CONFIG.GLOBAL.MARTYR_STAMP_FEE || 5;
        const vatAmount2 = newEgpSubtotal2 * vatRate2;
        invoice.egp.subtotal = newEgpSubtotal2;
        invoice.egp.vatAmount = vatAmount2;
        invoice.egp.total = Math.ceil(newEgpSubtotal2 + vatAmount2 + martyrStamp2);
      }
      setResult(invoice);
      console.log("invoice created successfully");
      // Track successful calculation (fire-and-forget)
      fetch('/api/attempts/track', { method: 'POST' }).catch(() => {});
      setTimeout(() => document.getElementById('result-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);
    } catch (e) {
      setError(e.message);
    }
  }

  const days = liveDays();
  const nsMultiplier = cargoType === "NON_STANDARD"
    ? (STORAGE_CONFIG.IMPORT.TWENTY_FT.NON_STANDARD[nonStdType]?.RATE_MULTIPLIER || 1)
    : 1;
  const hasAdvanced =
    billingType === "RENEWAL" ||
    cargoType !== "FULL" ||
    isDangerous ||
    hasCargoStripping ||
    hasCargoStorage ||
    hasDangerYard ||
    isHolidayRelease ||
    isExternalStorage ||
    isLCLStorage ||
    Object.values(services).some(Boolean);

  return (
    <div className="min-h-screen bg-[#0b1120] text-[#f0f2f8]" dir="rtl" style={{ fontFamily: "'Tajawal', system-ui, sans-serif" }}>
      <div className="max-w-[700px] mx-auto px-4 py-6 pb-20">

        {/* ── Header ── */}
        <div className="flex items-center justify-between mb-8 pb-5 border-b border-white/[0.07]">
          <div className="flex items-center gap-3">
            <div className="w-[46px] h-[46px] rounded-[13px] bg-linear-to-br from-[#f0b429] to-[#e8940a] flex items-center justify-center text-[22px] shrink-0 shadow-[0_4px_16px_rgba(240,180,41,0.3)]">
              ⚓
            </div>
            <div>
              <h1 className="text-xl font-extrabold tracking-tight">تقدير فواتير الوارد</h1>
              <p className="text-xs text-[#8892a4] mt-0.5">ميناء دمياط / ٢٠ قدم & ٤٠ قدم</p>
            </div>
          </div>
          <Link
            href="/Storagecalculator/rates"
            className="flex items-center gap-1.5 bg-blue-500/10 text-blue-400 text-xs font-bold px-3.5 py-2 rounded-xl border border-blue-500/20 transition-all hover:bg-blue-500/15 no-underline">
            <InfoIcon />
            التعريفات
          </Link>
        </div>

        {/* ══════════════════════════════════════════
            Exchange rate — daily from admin
        ══════════════════════════════════════════ */}
        <div className="flex items-center justify-between bg-[#111827] border border-white/[0.12] rounded-2xl px-[18px] py-3.5 mb-5 gap-3 flex-wrap">
          <div className="flex items-center gap-2.5">
            <span
              className="w-2 h-2 rounded-full shrink-0 shadow-[0_0_8px] animate-[pulse-dot_2s_infinite]"
              style={{
                background: isRateOverridden ? '#f0b429' : '#34d399',
                boxShadow: `0 0 8px ${isRateOverridden ? '#f0b429' : '#34d399'}`
              }}
            />
            <div>
              <div className="text-xs text-[#8892a4]">{isRateOverridden ? "سعر صرف مخصص" : "سعر الصرف اليوم"}</div>
              <div className="text-xl font-extrabold text-[#f0f2f8]">
                {fmt(isRateOverridden ? exchangeRate : dynamicAdminRate)}
                <span className="text-[13px] font-medium text-[#8892a4]"> ج.م / $</span>
              </div>
              <div className="text-[11px] text-[#4a5568] mt-0.5">{isRateOverridden ? "تم التعديل بواسطة المستخدم" : "مُسجَّل بواسطة الإدارة"}</div>
            </div>
          </div>

          {!isEditingRate ? (
            <div className="flex gap-2">
              {isRateOverridden && (
                <button
                  className="flex items-center gap-1.5 text-xs text-[#f87171] bg-[#1a2035] border border-red-500/20 rounded-lg px-3 py-1.5 cursor-pointer transition-all hover:text-[#f87171] hover:border-red-500/30 whitespace-nowrap"
                  onClick={() => { setIsRateOverridden(false); setCustomRate(String(dynamicAdminRate)); }}>
                  إلغاء المخصص
                </button>
              )}
              <button
                className="flex items-center gap-1.5 text-xs text-[#8892a4] bg-[#1a2035] border border-white/[0.12] rounded-lg px-3 py-1.5 cursor-pointer transition-all hover:text-[#f0b429] hover:border-[rgba(240,180,41,0.3)] whitespace-nowrap"
                onClick={() => setIsEditingRate(true)}>
                <EditIcon />
                تعديل السعر
              </button>
            </div>
          ) : (
            <div className="flex-1 min-w-[200px]">
              <div className="flex items-center gap-2 bg-[#1a2035] border-[1.5px] border-[#f0b429] rounded-[10px] px-3 py-2 mt-2.5 shadow-[0_0_0_3px_rgba(240,180,41,0.12)] w-full">
                <span className="text-xs text-[#8892a4] whitespace-nowrap">سعر مخصص</span>
                <input
                  type="number"
                  min={1}
                  step={0.01}
                  value={customRate}
                  onChange={e => setCustomRate(e.target.value)}
                  autoFocus
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      setIsRateOverridden(true);
                      setIsEditingRate(false);
                    }
                  }}
                  className="flex-1 bg-transparent border-none outline-none text-[15px] font-bold text-[#f0b429] text-right min-w-0"
                  style={{ direction: 'rtl' }}
                />
                <span className="text-[13px] font-semibold text-[#f0b429]">ج.م</span>

                <button
                  className="bg-[#34d399] border-none text-[#0b1120] px-2.5 py-1 rounded cursor-pointer text-[13px] font-bold"
                  onClick={() => { setIsRateOverridden(true); setIsEditingRate(false); }}
                  title="تأكيد التعديل">
                  ✓ تأكيد
                </button>

                <button
                  className="bg-transparent border-none cursor-pointer text-[#4a5568] text-lg leading-none px-1 py-0.5 transition-colors hover:text-[#f87171]"
                  onClick={() => { setIsEditingRate(false); if (!isRateOverridden) setCustomRate(String(dynamicAdminRate)); }}
                  title="إلغاء التعديل">
                  ✕
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ══════════════════════════════════════════
            PRIMARY — most used
        ══════════════════════════════════════════ */}
        <div className="bg-[#111827] border border-white/[0.12] rounded-[20px] p-6 mb-4">

          {/* Dates */}
          <div className="flex items-center gap-2 text-[10px] font-bold tracking-widest uppercase text-[#4a5568] mb-3">
            <span className="w-0.5 h-3.5 bg-[#f0b429] rounded-sm" />
            تواريخ الوصول والصرف
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <ArabicDatePicker
              id="arr"
              label="تاريخ الوصول"
              selected={arrDate}
              onChange={setArrDate}
              maxDate={relDate || undefined}
              placeholderText="يوم / شهر / سنة"
            />
            <ArabicDatePicker
              id="rel"
              label="تاريخ الصرف"
              selected={relDate}
              onChange={setRelDate}
              minDate={arrDate || undefined}
              placeholderText="يوم / شهر / سنة"
            />
          </div>
          {days && (
            <div className="inline-flex items-center gap-2 bg-[rgba(240,180,41,0.12)] border border-[rgba(240,180,41,0.25)] text-[#f0b429] rounded-full text-[13px] font-bold px-3.5 py-1 mt-3.5">
              <ClockIcon />
              {days} يوم — مدة التخزين
            </div>
          )}

          <div className="h-px bg-white/[0.07] my-5" />

          {/* Release type */}
          <div className="flex items-center gap-2 text-[10px] font-bold tracking-widest uppercase text-[#4a5568] mb-2">
            <span className="w-0.5 h-3.5 bg-[#f0b429] rounded-sm" />
            نوع الصرف
          </div>
          <div className="flex gap-0 bg-[#0b1120] rounded-xl overflow-hidden border border-white/[0.07] mb-5">
            {[["INITIAL", "صرف أول مرة"], ["RENEWAL", "تجديد"]].map(([v, l]) => (
              <button
                key={v}
                className={`flex-1 py-3 px-4 text-sm font-semibold border-none cursor-pointer transition-all ${billingType === v
                  ? 'bg-[#f0b429] text-[#0b1120] font-extrabold'
                  : 'bg-transparent text-[#8892a4] hover:bg-[#1a2035] hover:text-[#f0f2f8]'
                  }`}
                onClick={() => setBillingType(v)}>
                {l}
              </button>
            ))}
          </div>

          {/* Previous days — shown only for renewal */}
          {billingType === "RENEWAL" && (
            <>
              <div className="flex items-center gap-2 text-[10px] font-bold tracking-widest uppercase text-[#4a5568] mb-3">
                <span className="w-0.5 h-3.5 bg-[#f0b429] rounded-sm" />
                الأيام المسددة سابقاً (في الفاتورة الأولى)
              </div>
              <div className="flex flex-col gap-2 mb-4">
                <input
                  type="number"
                  className="w-full py-3 px-3.5 rounded-xl border-[1.5px] border-white/[0.12] bg-[#1a2035] text-[#f0f2f8] text-[15px] font-medium text-right outline-none transition-all focus:border-[#f0b429] focus:shadow-[0_0_0_3px_rgba(240,180,41,0.12)]"
                  style={{ direction: 'rtl' }}
                  value={prevDays}
                  min={0}
                  max={days || undefined}
                  onChange={e => {
                    const val = Number(e.target.value);
                    const maxDays = days || 0;
                    setPrevDays(val > maxDays ? maxDays : (val < 0 ? 0 : val));
                  }}
                  placeholder="0"
                />
              </div>
            </>
          )}

          {/* Container counts */}
          <div className="flex items-center gap-2 text-[10px] font-bold tracking-widest uppercase text-[#4a5568] mb-3">
            <span className="w-0.5 h-3.5 bg-[#f0b429] rounded-sm" />
            أعداد الحاويات في البوليصة
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 mb-5">
            <div className="flex flex-col gap-2">
              <label className="text-[11px] font-semibold text-[#4a5568] tracking-wider uppercase">٢٠ قدم (Twenty-foot)</label>
              <div className="flex items-center gap-0 border-[1.5px] border-white/[0.12] rounded-xl bg-[#1a2035] overflow-hidden">
                <button
                  className="w-[46px] h-12 border-none bg-transparent text-[#8892a4] text-[22px] cursor-pointer flex items-center justify-center transition-all hover:bg-[#1f2847] hover:text-[#f0b429] shrink-0"
                  onClick={() => setTwentyCount(c => Math.max(0, c - 1))}>
                  −
                </button>
                <div className="flex-1 text-center text-lg font-extrabold text-[#f0f2f8] select-none">
                  {twentyCount}
                </div>
                <button
                  className="w-[46px] h-12 border-none bg-transparent text-[#8892a4] text-[22px] cursor-pointer flex items-center justify-center transition-all hover:bg-[#1f2847] hover:text-[#f0b429] shrink-0"
                  onClick={() => setTwentyCount(c => c + 1)}>
                  +
                </button>
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-[11px] font-semibold text-[#4a5568] tracking-wider uppercase">٤٠ قدم (Forty-foot)</label>
              <div className="flex items-center gap-0 border-[1.5px] border-white/[0.12] rounded-xl bg-[#1a2035] overflow-hidden">
                <button
                  className="w-[46px] h-12 border-none bg-transparent text-[#8892a4] text-[22px] cursor-pointer flex items-center justify-center transition-all hover:bg-[#1f2847] hover:text-[#f0b429] shrink-0"
                  onClick={() => setFortyCount(c => Math.max(0, c - 1))}>
                  −
                </button>
                <div className="flex-1 text-center text-lg font-extrabold text-[#f0f2f8] select-none">
                  {fortyCount}
                </div>
                <button
                  className="w-[46px] h-12 border-none bg-transparent text-[#8892a4] text-[22px] cursor-pointer flex items-center justify-center transition-all hover:bg-[#1f2847] hover:text-[#f0b429] shrink-0"
                  onClick={() => setFortyCount(c => c + 1)}>
                  +
                </button>
              </div>
            </div>
          </div>

          {/* Cargo type */}
          <div className="flex items-center gap-2 text-[10px] font-bold tracking-widest uppercase text-[#4a5568] mb-2">
            <span className="w-0.5 h-3.5 bg-[#f0b429] rounded-sm" />
            نوع البضاعة
          </div>
          <div className="flex gap-2 flex-wrap mb-2">
            {[
              ["FULL", "عادية"],
              ["REEFER", "ثلاجة ❄️"],
              ["DANGEROUS", "خطرة ⚠️"],
              ["NON_STANDARD", "غير منتظمة"],
            ].map(([v, l]) => (
              <button
                key={v}
                className={`py-2 px-3.5 rounded-full border-[1.5px] text-[13px] font-semibold cursor-pointer transition-all whitespace-nowrap ${cargoType === v
                  ? 'border-[#f0b429] bg-[rgba(240,180,41,0.12)] text-[#f0b429]'
                  : 'border-white/[0.12] bg-[#1a2035] text-[#8892a4] hover:text-[#f0f2f8] hover:border-white/[0.12] hover:bg-[#1f2847]'
                  }`}
                onClick={() => {
                  setCargoType(v);
                  if (v === "NON_STANDARD") {
                    setHasDangerYard(false);
                  }
                }}
              >
                {l}
              </button>
            ))}
            
          </div>
          {cargoType === "DANGEROUS" && (
            <p className="text-[11px] text-amber-400/80 mt-1 mb-1 flex items-center gap-1.5">
              <span>⚠️</span>
              الحساب مبني على درجات الخطورة 3، 4، 5، 8، 9
            </p>
          )}

        </div>

        {/* ══════════════════════════════════════════
            SECONDARY — advanced options (accordion)
        ══════════════════════════════════════════ */}
        <button
          className={`flex items-center justify-between w-full bg-[#111827] border border-white/[0.07] rounded-2xl px-[18px] py-3.5 cursor-pointer text-sm font-semibold text-[#8892a4] transition-all mb-0 hover:border-white/[0.12] hover:text-[#f0f2f8] ${advOpen ? 'rounded-b-none border-b-transparent text-[#f0f2f8]' : ''
            }`}
          onClick={() => setAdvOpen(o => !o)}>
          <span className="flex items-center gap-2">
            <OptionsIcon />
            خيارات متقدمة
            {hasAdvanced && <span className="w-[7px] h-[7px] rounded-full bg-[#f0b429] inline-block mr-0.5" />}
          </span>
          <span className={`text-lg transition-transform ${advOpen ? 'rotate-180' : ''}`}>⌄</span>
        </button>

        {advOpen && (
          <div className="bg-[#111827] border border-white/[0.07] border-t-0 rounded-b-2xl p-5 mb-4 animate-[slide-in_0.2s_ease]">

            {/* Non-standard type */}
            {cargoType === "NON_STANDARD" && (
              <>
                <div className="flex items-center gap-2 text-[10px] font-bold tracking-widest uppercase text-[#4a5568] mb-3">
                  <span className="w-0.5 h-3.5 bg-[#f0b429] rounded-sm" />
                  تصنيف الحاوية غير المنتظمة
                </div>
                <div className="flex flex-col gap-2 mb-4">
                  <select
                    className="w-full py-3 px-3.5 pr-9 rounded-xl border-[1.5px] border-white/[0.12] bg-[#1a2035] text-[#f0f2f8] text-[15px] font-medium text-right outline-none transition-all appearance-none focus:border-[#f0b429] focus:shadow-[0_0_0_3px_rgba(240,180,41,0.12)]"
                    style={{
                      direction: 'rtl',
                      backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%234a5568' stroke-width='1.6' fill='none' stroke-linecap='round'/%3E%3C/svg%3E")`,
                      backgroundRepeat: 'no-repeat',
                      backgroundPosition: 'left 13px center'
                    }}
                    value={nonStdType}
                    onChange={e => setNonStdType(e.target.value)}>
                    <option value="OOG">غير منتظم (الاسبريدر العادى) (OOG) — السعر × ٢</option>
                    <option value="LASHING">تصبين (بالويرات) (Lashing) — السعر × ٤</option>
                  </select>
                </div>
              </>
            )}

            {/* ── Group 1: خدمات المشمول ── */}
            <div className="mb-4">
              <div className="flex items-center gap-2 text-[10px] font-bold tracking-widest uppercase text-[#4a5568] mb-2">
                <span className="w-0.5 h-3.5 bg-[#f0b429] rounded-sm" />
                خدمات المشمول
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">

                {/* تفريغ مشمول */}
                <div className="flex gap-1.5 items-stretch">
                  <label className={`flex items-center gap-2.5 py-3 px-3 rounded-xl border-[1.5px] cursor-pointer select-none transition-all flex-1 ${hasCargoStripping ? 'border-[#f0b429] bg-[rgba(240,180,41,0.12)]' : 'border-white/[0.07] bg-[#1a2035] hover:border-white/[0.12]'}`}>
                    <input type="checkbox" checked={hasCargoStripping} onChange={() => setHasCargoStripping(!hasCargoStripping)} className="hidden" />
                    <span className={`w-[19px] h-[19px] shrink-0 rounded-md border-[1.5px] flex items-center justify-center transition-all ${hasCargoStripping ? 'bg-[#f0b429] border-[#f0b429]' : 'bg-[#0b1120] border-white/[0.12]'}`}>
                      {hasCargoStripping && <CheckIcon />}
                    </span>
                    <span className="text-[13px] text-[#f0f2f8] flex-1 font-medium">تفريغ مشمول</span>
                  </label>
                  {hasCargoStripping && (
                    <div className="flex items-center gap-0 w-[90px] rounded-xl border-[1.5px] border-[#f0b429] overflow-hidden">
                      <button className="w-[30px] h-full border-none bg-transparent text-[#8892a4] text-lg cursor-pointer flex items-center justify-center transition-all hover:bg-[#1f2847] hover:text-[#f0b429]"
                        onClick={() => setServiceQuantities(p => ({ ...p, stripping: Math.max(1, Number(serviceQuantities['stripping'] !== undefined ? serviceQuantities['stripping'] : (twentyCount + fortyCount)) - 1) }))}>−</button>
                      <div className="flex-1 text-center text-sm font-extrabold text-[#f0f2f8] select-none">
                        {serviceQuantities['stripping'] !== undefined ? serviceQuantities['stripping'] : (twentyCount + fortyCount)}
                      </div>
                      <button className="w-[30px] h-full border-none bg-transparent text-[#8892a4] text-lg cursor-pointer flex items-center justify-center transition-all hover:bg-[#1f2847] hover:text-[#f0b429]"
                        onClick={() => setServiceQuantities(p => ({ ...p, stripping: Number(serviceQuantities['stripping'] !== undefined ? serviceQuantities['stripping'] : (twentyCount + fortyCount)) + 1 }))}>+</button>
                    </div>
                  )}
                </div>

                {/* أرضيات المشمول */}
                <div className="flex gap-1.5 items-stretch">
                  <label className={`flex items-center gap-2.5 py-3 px-3 rounded-xl border-[1.5px] cursor-pointer select-none transition-all flex-1 ${hasCargoStorage ? 'border-[#f0b429] bg-[rgba(240,180,41,0.12)]' : 'border-white/[0.07] bg-[#1a2035] hover:border-white/[0.12]'}`}>
                    <input type="checkbox" checked={hasCargoStorage} onChange={() => setHasCargoStorage(!hasCargoStorage)} className="hidden" />
                    <span className={`w-[19px] h-[19px] shrink-0 rounded-md border-[1.5px] flex items-center justify-center transition-all ${hasCargoStorage ? 'bg-[#f0b429] border-[#f0b429]' : 'bg-[#0b1120] border-white/[0.12]'}`}>
                      {hasCargoStorage && <CheckIcon />}
                    </span>
                    <span className="text-[12px] text-[#f0f2f8] flex-1 font-medium truncate">أرضيات المشمول (تفريغ بالساحة)</span>
                  </label>
                  {hasCargoStorage && (
                    <div className="flex items-center gap-0 w-[90px] rounded-xl border-[1.5px] border-[#f0b429] overflow-hidden">
                      <button className="w-[30px] h-full border-none bg-transparent text-[#8892a4] text-lg cursor-pointer flex items-center justify-center transition-all hover:bg-[#1f2847] hover:text-[#f0b429]"
                        onClick={() => setServiceQuantities(p => ({ ...p, cargostorage: Math.max(1, Number(serviceQuantities['cargostorage'] !== undefined ? serviceQuantities['cargostorage'] : (twentyCount + fortyCount)) - 1) }))}>−</button>
                      <div className="flex-1 text-center text-sm font-extrabold text-[#f0f2f8] select-none">
                        {serviceQuantities['cargostorage'] !== undefined ? serviceQuantities['cargostorage'] : (twentyCount + fortyCount)}
                      </div>
                      <button className="w-[30px] h-full border-none bg-transparent text-[#8892a4] text-lg cursor-pointer flex items-center justify-center transition-all hover:bg-[#1f2847] hover:text-[#f0b429]"
                        onClick={() => setServiceQuantities(p => ({ ...p, cargostorage: Number(serviceQuantities['cargostorage'] !== undefined ? serviceQuantities['cargostorage'] : (twentyCount + fortyCount)) + 1 }))}>+</button>
                    </div>
                  )}
                </div>

                {/* تاريخ خروج المشمول */}
                {hasCargoStorage && (
                  <div className="mt-1 p-4 bg-blue-500/5 rounded-xl border border-blue-500/15 md:col-span-2">
                    <label className="block mb-2 text-sm font-semibold text-[#f0f2f8]">تاريخ خروج المشمول من الحاوية</label>
                    <ArabicDatePicker
                      selected={cargoExitDate}
                      onChange={(date) => setCargoExitDate(date)}
                      placeholderText="اختر تاريخ خروج المشمول"
                      minDate={arrDate}
                      maxDate={relDate}
                    />
                    <div className="text-xs text-[#4a5568] mt-2">
                      💡 يتم حساب أرضيات المشمول من هذا التاريخ حتى تاريخ الصرف بفترة سماح يوم واحد
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* ── Group 2: نوع الصرف ── */}
            <div className="h-px bg-white/[0.05] my-3" />
            <div className="mb-4">
              <div className="flex items-center gap-2 text-[10px] font-bold tracking-widest uppercase text-[#4a5568] mb-2">
                <span className="w-0.5 h-3.5 bg-[#f0b429] rounded-sm" />
                نوع الصرف
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">

                {/* صرف للتخزين الخارجي */}
                <div className="flex gap-1.5 items-stretch">
                  <label className={`flex items-center gap-2.5 py-3 px-3 rounded-xl border-[1.5px] cursor-pointer select-none transition-all flex-1 ${isExternalStorage ? 'border-[#f0b429] bg-[rgba(240,180,41,0.12)]' : 'border-white/[0.07] bg-[#1a2035] hover:border-white/[0.12]'}`}>
                    <input type="checkbox" checked={isExternalStorage} onChange={() => setIsExternalStorage(!isExternalStorage)} className="hidden" />
                    <span className={`w-[19px] h-[19px] shrink-0 rounded-md border-[1.5px] flex items-center justify-center transition-all ${isExternalStorage ? 'bg-[#f0b429] border-[#f0b429]' : 'bg-[#0b1120] border-white/[0.12]'}`}>
                      {isExternalStorage && <CheckIcon />}
                    </span>
                    <span className="text-[13px] text-[#f0f2f8] flex-1 font-medium">صرف للتخزين الخارجي
                      <span className="text-[10px] block text-[#4a5568] mt-0.5">يلغي فترة السماح</span>
                    </span>
                  </label>
                </div>

                {/* التخزين بالمخزن المشترك LCL */}
                <div className="flex gap-1.5 items-stretch">
                  <label className={`flex items-center gap-2.5 py-3 px-3 rounded-xl border-[1.5px] cursor-pointer select-none transition-all flex-1 ${isLCLStorage ? 'border-[#f0b429] bg-[rgba(240,180,41,0.12)]' : 'border-white/[0.07] bg-[#1a2035] hover:border-white/[0.12]'}`}>
                    <input type="checkbox" checked={isLCLStorage} onChange={() => setIsLCLStorage(!isLCLStorage)} className="hidden" />
                    <span className={`w-[19px] h-[19px] shrink-0 rounded-md border-[1.5px] flex items-center justify-center transition-all ${isLCLStorage ? 'bg-[#f0b429] border-[#f0b429]' : 'bg-[#0b1120] border-white/[0.12]'}`}>
                      {isLCLStorage && <CheckIcon />}
                    </span>
                    <span className="text-[13px] text-[#f0f2f8] flex-1 font-medium">مخزن مشترك (LCL)
                      <span className="text-[10px] block text-[#4a5568] mt-0.5">سماح 3 أيام + تفريغ بنصف السعر + نقل</span>
                    </span>
                  </label>
                </div>

                {/* صرف يوم عطلة */}
                <div className="flex gap-1.5 items-stretch">
                  <label className={`flex items-center gap-2.5 py-3 px-3 rounded-xl border-[1.5px] cursor-pointer select-none transition-all flex-1 ${isHolidayRelease ? 'border-[#f0b429] bg-[rgba(240,180,41,0.12)]' : 'border-white/[0.07] bg-[#1a2035] hover:border-white/[0.12]'}`}>
                    <input type="checkbox" checked={isHolidayRelease} onChange={() => setIsHolidayRelease(!isHolidayRelease)} className="hidden" />
                    <span className={`w-[19px] h-[19px] shrink-0 rounded-md border-[1.5px] flex items-center justify-center transition-all ${isHolidayRelease ? 'bg-[#f0b429] border-[#f0b429]' : 'bg-[#0b1120] border-white/[0.12]'}`}>
                      {isHolidayRelease && <CheckIcon />}
                    </span>
                    <span className="text-[13px] text-[#f0f2f8] flex-1 font-medium">صرف يوم عطلة
                      <span className="text-[10px] block text-[#4a5568] mt-0.5">رسوم إضافية ٥٠٪ على الخدمات</span>
                    </span>
                  </label>
                  {isHolidayRelease && (
                    <div className="flex items-center gap-0 w-[90px] rounded-xl border-[1.5px] border-[#f0b429] overflow-hidden">
                      <button className="w-[30px] h-full border-none bg-transparent text-[#8892a4] text-lg cursor-pointer flex items-center justify-center transition-all hover:bg-[#1f2847] hover:text-[#f0b429]"
                        onClick={() => setServiceQuantities(p => ({ ...p, holiday: Math.max(1, Number(serviceQuantities['holiday'] !== undefined ? serviceQuantities['holiday'] : (twentyCount + fortyCount)) - 1) }))}>−</button>
                      <div className="flex-1 text-center text-sm font-extrabold text-[#f0f2f8] select-none">
                        {serviceQuantities['holiday'] !== undefined ? serviceQuantities['holiday'] : (twentyCount + fortyCount)}
                      </div>
                      <button className="w-[30px] h-full border-none bg-transparent text-[#8892a4] text-lg cursor-pointer flex items-center justify-center transition-all hover:bg-[#1f2847] hover:text-[#f0b429]"
                        onClick={() => setServiceQuantities(p => ({ ...p, holiday: Number(serviceQuantities['holiday'] !== undefined ? serviceQuantities['holiday'] : (twentyCount + fortyCount)) + 1 }))}>+</button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* ── Group 3: خدمات الساحة ── */}
            <div className="h-px bg-white/[0.05] my-3" />
            <div>
              <div className="flex items-center gap-2 text-[10px] font-bold tracking-widest uppercase text-[#4a5568] mb-2">
                <span className="w-0.5 h-3.5 bg-[#f0b429] rounded-sm" />
                خدمات الساحة
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">

                {/* تخزين ساحة الطوارئ */}
                <div className="flex gap-1.5 items-stretch" style={{ opacity: cargoType === "NON_STANDARD" ? 0.5 : 1 }}>
                  <label className={`flex items-center gap-2.5 py-3 px-3 rounded-xl border-[1.5px] cursor-pointer select-none transition-all flex-1 ${hasDangerYard ? 'border-[#f0b429] bg-[rgba(240,180,41,0.12)]' : 'border-white/[0.07] bg-[#1a2035] hover:border-white/[0.12]'}`}
                    style={{ cursor: cargoType === "NON_STANDARD" ? 'not-allowed' : 'pointer' }}>
                    <input type="checkbox" checked={hasDangerYard} onChange={() => setHasDangerYard(!hasDangerYard)} disabled={cargoType === "NON_STANDARD"} className="hidden" />
                    <span className={`w-[19px] h-[19px] shrink-0 rounded-md border-[1.5px] flex items-center justify-center transition-all ${hasDangerYard ? 'bg-[#f0b429] border-[#f0b429]' : 'bg-[#0b1120] border-white/[0.12]'}`}>
                      {hasDangerYard && <CheckIcon />}
                    </span>
                    <span className="text-[13px] text-[#f0f2f8] flex-1 font-medium">ساحة الطوارئ
                      {/* {cargoType === "NON_STANDARD"
                        ? <span className="text-[10px] block text-[#4a5568]">غير متاح للحاويات غير المنتظمة</span>
                        : <span className="text-[10px] block text-[#4a5568] mt-0.5">تخزين بتعريفة مستقلة</span>
                      } */}
                    </span>
                  </label>
                  {hasDangerYard && (
                    <div className="flex items-center gap-0 w-[90px] rounded-xl border-[1.5px] border-[#f0b429] overflow-hidden">
                      <button className="w-[30px] h-full border-none bg-transparent text-[#8892a4] text-lg cursor-pointer flex items-center justify-center transition-all hover:bg-[#1f2847] hover:text-[#f0b429]"
                        onClick={() => setServiceQuantities(p => ({ ...p, dangeryard: Math.max(1, Number(serviceQuantities['dangeryard'] !== undefined ? serviceQuantities['dangeryard'] : (twentyCount + fortyCount)) - 1) }))}>−</button>
                      <div className="flex-1 text-center text-sm font-extrabold text-[#f0f2f8] select-none">
                        {serviceQuantities['dangeryard'] !== undefined ? serviceQuantities['dangeryard'] : (twentyCount + fortyCount)}
                      </div>
                      <button className="w-[30px] h-full border-none bg-transparent text-[#8892a4] text-lg cursor-pointer flex items-center justify-center transition-all hover:bg-[#1f2847] hover:text-[#f0b429]"
                        onClick={() => setServiceQuantities(p => ({ ...p, dangeryard: Number(serviceQuantities['dangeryard'] !== undefined ? serviceQuantities['dangeryard'] : (twentyCount + fortyCount)) + 1 }))}>+</button>
                    </div>
                  )}
                </div>

                {/* SERVICES_LIST mapping */}
                {SERVICES_LIST.map(svc => {
                  const on = !!services[svc.id];
                  const qty = serviceQuantities[svc.id] !== undefined ? serviceQuantities[svc.id] : (twentyCount + fortyCount);
                  return (
                    <div key={svc.id} className="flex gap-1.5 items-stretch">
                      <label className={`flex items-center gap-2.5 py-3 px-3 rounded-xl border-[1.5px] cursor-pointer select-none transition-all flex-1 ${on ? 'border-[#f0b429] bg-[rgba(240,180,41,0.12)]' : 'border-white/[0.07] bg-[#1a2035] hover:border-white/[0.12]'}`}>
                        <input type="checkbox" checked={on} onChange={() => toggleService(svc.id)} className="hidden" />
                        <span className={`w-[19px] h-[19px] shrink-0 rounded-md border-[1.5px] flex items-center justify-center transition-all ${on ? 'bg-[#f0b429] border-[#f0b429]' : 'bg-[#0b1120] border-white/[0.12]'}`}>
                          {on && <CheckIcon />}
                        </span>
                        <span className="text-[13px] text-[#f0f2f8] flex-1 font-medium">{svc.name}</span>
                        <span className="text-[11px] text-[#4a5568] font-bold">
                          ${svc.id === 'yard'
                            ? (((STORAGE_CONFIG.SERVICES.SHIFTING.YARD_TO_YARD.rate20 * twentyCount + STORAGE_CONFIG.SERVICES.SHIFTING.YARD_TO_YARD.rate40 * fortyCount) / Math.max(1, (twentyCount + fortyCount))) * nsMultiplier * (isHolidayRelease ? 1.5 : 1)).toFixed(1)
                            : (svc.rate * nsMultiplier).toFixed(1)
                          }
                        </span>
                      </label>
                      {on && (
                        <div className="flex items-center gap-0 w-[90px] rounded-xl border-[1.5px] border-[#f0b429] overflow-hidden">
                          <button className="w-[30px] h-full border-none bg-transparent text-[#8892a4] text-lg cursor-pointer flex items-center justify-center transition-all hover:bg-[#1f2847] hover:text-[#f0b429]"
                            onClick={() => setServiceQuantities(p => ({ ...p, [svc.id]: Math.max(1, Number(qty) - 1) }))}>−</button>
                          <div className="flex-1 text-center text-sm font-extrabold text-[#f0f2f8] select-none">{qty}</div>
                          <button className="w-[30px] h-full border-none bg-transparent text-[#8892a4] text-lg cursor-pointer flex items-center justify-center transition-all hover:bg-[#1f2847] hover:text-[#f0b429]"
                            onClick={() => setServiceQuantities(p => ({ ...p, [svc.id]: Number(qty) + 1 }))}>+</button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ── Attempts badge ── */}
        {/* {remainingAttempts !== null && (
          <div className={`flex items-center justify-between px-4 py-2.5 rounded-xl mb-4 text-sm font-bold border ${
            remainingAttempts > 0
              ? 'bg-[#111827] border-white/[0.12] text-[#f0f2f8]'
              : 'bg-red-500/10 border-red-500/25 text-[#f87171]'
          }`}>
            <span>المحاولات المتبقية</span>
            <span className="text-lg">{remainingAttempts}</span>
          </div>
        )} */}

        {/* ── Calc Button ── */}
        <button
          className="w-full py-4 text-base font-extrabold rounded-2xl border-none bg-linear-to-br from-[#f0b429] to-[#e8940a] text-[#0b1120] cursor-pointer mt-5 tracking-wide shadow-[0_4px_24px_rgba(240,180,41,0.3)] transition-all hover:opacity-90 hover:shadow-[0_6px_32px_rgba(240,180,41,0.4)] active:scale-[0.99] flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          onClick={calculate}
          disabled={attemptsLoading || remainingAttempts === 0}>
          {attemptsLoading ? (
            <div className="w-5 h-5 border-2 border-[#0b1120]/30 border-t-[#0b1120] rounded-full animate-spin" />
          ) : (
            <>احسب الفاتورة <ArrowLeft className="w-4 h-4" /></>
          )}
        </button>

        {error && (
          <div className="flex items-start gap-2 text-[#f87171] text-[13px] py-3 px-4 bg-[rgba(248,113,113,0.09)] border border-red-500/20 rounded-xl mt-2.5 leading-relaxed">
            <span>⚠</span>
            <span>{error}</span>
          </div>
        )}

        {/* ════════════════════════════════════════
            النتيجة
        ════════════════════════════════════════ */}
        {result && (
          <div className="mt-6 animate-[fadeup_0.35s_ease]" id="result-section">
            <div className="bg-[#111827] border border-white/[0.12] rounded-[20px] overflow-hidden">

              <div className="py-4 px-5 bg-[#1a2035] border-b border-white/[0.07] flex items-center gap-2.5 text-[13px] font-bold text-[#8892a4] tracking-widest uppercase">
                <SummaryIcon />
                ملخص الفاتورة
              </div>

              {/* Metrics */}
              <div className="grid grid-cols-3 gap-0 border-b border-white/[0.07]">
                {[
                  ["الأيام", result.summary.days, "يوم"],
                  ["الحاويات", result.summary.groups.reduce((acc, g) => acc + g.count, 0), "حاوية"],
                  ["سعر الصرف", fmt(result.summary.exchangeRate), "ج.م/$"],
                ].map(([l, v, u], idx) => (
                  <div key={l} className={`py-4 px-3 text-center ${idx < 2 ? 'border-l border-white/[0.07]' : ''}`}>
                    <div className="text-[10px] text-[#4a5568] mb-1 font-semibold tracking-wider uppercase">{l}</div>
                    <div className="text-[22px] font-extrabold text-[#f0f2f8] leading-none">{v}</div>
                    <div className="text-[10px] text-[#4a5568] mt-1">{u}</div>
                  </div>
                ))}
              </div>

              {/* Rows */}
              {[
                [
                  cargoType === "NON_STANDARD"
                    ? `رسوم التخزين (${nonStdType === "OOG" ? "سعر مضاعف ×٢" : "سعر مضاعف ×٤"})`
                    : "رسوم التخزين",
                  `${fmt(result.usd.storageFee + (result.usd.surchargeFee || 0))}`,
                  false
                ],
                ["رسوم الخدمات الثابتة", `${fmt(result.usd.fixedFees)}`, false],
                ...(result.usd.additionalServices > 0
                  ? [["الخدمات الإضافية", `${fmt(result.usd.additionalServices)}`, false]]
                  : []),
                ...(result.usd.cargoServiceFee > 0
                  ? [["تفريغ مشمول", `${fmt(result.usd.cargoServiceFee)}`, false]]
                  : []),
                ...(result.usd.cargoStorageFee > 0
                  ? [["أرضيات المشمول", `${fmt(result.usd.cargoStorageFee)}`, false]]
                  : []),
                ...(result.usd.dangerYardFee > 0
                  ? [["تخزين ساحة الطوارئ", `${fmt(result.usd.dangerYardFee)}`, false]]
                  : []),
                ["الإجمالي بالدولار", `${fmt(result.usd.subtotal)}`, true],
                ["الإجمالي بالجنيه", `${fmt(result.egp.subtotal, 0)} ج.م`, false],
                ["ضريبة القيمة المضافة 14%", `${fmt(result.egp.vatAmount, 0)} ج.م`, false],
                ["طابع الشهيد", `${result.egp.martyrStamp} ج.م`, false],
              ].map(([l, v, sub]) => (
                <div key={l} className={`flex justify-between items-center py-3 px-5 border-b border-white/[0.07] text-sm last:border-b-0 ${sub ? 'bg-[#1a2035]' : ''}`}>
                  <span className={sub ? 'text-[#8892a4]' : 'text-[#8892a4]'}>{l}</span>
                  <span className={`font-bold ${sub ? 'text-[#f0b429]' : 'text-[#f0f2f8]'}`}>{v}</span>
                </div>
              ))}

              <div className="flex justify-between items-center py-5 px-5 bg-linear-to-l from-[rgba(240,180,41,0.15)] to-[rgba(240,180,41,0.05)] border-t border-[rgba(240,180,41,0.3)]">
                <span className="text-[15px] font-bold text-[#f0b429]">الإجمالي النهائي</span>
                <span className="text-[28px] font-extrabold text-[#f0b429] tracking-tight">{fmt(result.egp.total, 0)} ج.م</span>
              </div>

              {result.details.storageBreakdown.length > 0 && (
                <div className="py-3.5 px-5 bg-[#0b1120] border-t border-white/[0.07]">
                  <div className="text-[10px] font-bold text-[#4a5568] tracking-widest uppercase mb-2">تفصيل شرائح التخزين</div>
                  {result.details.storageBreakdown.map((b, i) => (
                    <div key={i} className="flex justify-between text-xs text-[#4a5568] py-1 border-b border-dashed border-white/[0.07] last:border-b-0">
                      <span>{b.tierName} — {b.days} يوم (من {b.fromDay} إلى {b.toDay})</span>
                      <span className="text-[#8892a4] font-bold">${fmt(b.subtotal)}</span>
                    </div>
                  ))}
                </div>
              )}

              {result.details.cargoBreakdown?.length > 0 && (
                <div className="py-3.5 px-5 bg-[#0b1120] border-t border-white/[0.07]">
                  <div className="text-[10px] font-bold text-[#4a5568] tracking-widest uppercase mb-2">تفصيل شرائح أرضيات المشمول</div>
                  {result.details.cargoBreakdown.map((b, i) => (
                    <div key={i} className="flex justify-between text-xs text-[#4a5568] py-1 border-b border-dashed border-white/[0.07] last:border-b-0">
                      <span>{b.tierName} — {b.days} يوم (من {b.fromDay} إلى {b.toDay})</span>
                      <span className="text-[#8892a4] font-bold">${fmt(b.subtotal)}</span>
                    </div>
                  ))}
                </div>
              )}

              {result.details.dangerYardBreakdown?.length > 0 && (
                <div className="py-3.5 px-5 bg-[#0b1120] border-t border-white/[0.07]">
                  <div className="text-[10px] font-bold text-[#4a5568] tracking-widest uppercase mb-2">تفصيل شرائح ساحة الطوارئ</div>
                  {result.details.dangerYardBreakdown.map((b, i) => (
                    <div key={i} className="flex justify-between text-xs text-[#4a5568] py-1 border-b border-dashed border-white/[0.07] last:border-b-0">
                      <span>{b.tierName} — {b.days} يوم (من {b.fromDay} إلى {b.toDay})</span>
                      <span className="text-[#8892a4] font-bold">${fmt(b.subtotal)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {result && (
          <button
            className="w-full py-4 text-base font-extrabold rounded-2xl border border-white/[0.12] bg-transparent text-[#8892a4] cursor-pointer mt-5 shadow-none transition-all hover:bg-[#111827] hover:text-[#f0f2f8]"
            onClick={() => {
              setResult(null);
              setArrDate(null);
              setRelDate(new Date());
              setTwentyCount(1);
              setFortyCount(0);
              setCargoType("FULL");
              setPrevDays(0);
              setCargoExitDate(null);
              setIsLCLStorage(false);
              setHasCargoStripping(false);
              setHasCargoStorage(false);
              setIsExternalStorage(false);
              setIsHolidayRelease(false);
              setHasDangerYard(false);
              setNonStdType("OOG");
              setServices({});
              setServiceQuantities({});
            }}>
            {billingType === "RENEWAL" && result.usd.storageFee === 0 ? "بدء حساب بوليصة جديدة" : "إبدأ حساب بوليصه اخرى"}
          </button>
        )}

      </div>
    </div>
  );
}
