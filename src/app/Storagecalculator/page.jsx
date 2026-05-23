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
  SummaryIcon 
} from "./Icons";

// ─────────────────────────────────────────────
// سعر الصرف اليومي — يأتي من الـ admin (prop أو context)
// هنا قيمة افتراضية للعرض
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

  const [services, setServices] = useState({});
  const [serviceQuantities, setServiceQuantities] = useState({});

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

  function calculate() {
    setError(""); setResult(null);
    if (!arrDate || !relDate) { setError("الرجاء إدخال تاريخ الوصول والصرف."); return; }
    if (twentyCount <= 0 && fortyCount <= 0) { setError("الرجاء إدخال عدد الحاويات (20 أو 40 قدم)."); return; }

    try {
      const arrStr = format(arrDate, 'yyyy-MM-dd');
      const relStr = format(relDate, 'yyyy-MM-dd');

      const containerGroups = [];
      const isDangerousCargo = cargoType === "DANGEROUS";
      const totalConts = twentyCount + fortyCount;

      // Extract quantities for special services
      const strippedQty = serviceQuantities['stripping'] !== undefined ? Number(serviceQuantities['stripping']) : totalConts;
      const holidayQty  = serviceQuantities['holiday']  !== undefined ? Number(serviceQuantities['holiday'])  : totalConts;
      const dangerYardQty = serviceQuantities['dangeryard'] !== undefined ? Number(serviceQuantities['dangeryard']) : totalConts;

      // Distribute stripping qty (prioritize 40ft as standard, then 20ft)
      let remStripped = strippedQty;
      const stripping40 = fortyCount > 0 ? Math.min(remStripped, fortyCount) : 0;
      remStripped -= stripping40;
      const stripping20 = twentyCount > 0 ? Math.min(remStripped, twentyCount) + Math.max(0, remStripped - twentyCount) : remStripped;

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
          config: { ...baseConfig.FULL, CARGO_SERVICE_FEE: baseConfig.CARGO_SERVICE_FEE },
          dangerousConfig: { ...baseConfig.DANGEROUS, CARGO_SERVICE_FEE: baseConfig.CARGO_SERVICE_FEE },
          surchargeConfig,
          isDangerous: isDangerousCargo,
          hasCargoService: hasCargoStripping && stripping20 > 0,
          cargoServiceCount: stripping20,
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
          config: { ...baseConfig.FULL, CARGO_SERVICE_FEE: baseConfig.CARGO_SERVICE_FEE },
          dangerousConfig: { ...baseConfig.DANGEROUS, CARGO_SERVICE_FEE: baseConfig.CARGO_SERVICE_FEE },
          surchargeConfig,
          isDangerous: isDangerousCargo,
          hasCargoService: hasCargoStripping && stripping40 > 0,
          cargoServiceCount: stripping40,
          hasCargoStorage: false
        });
      }

      // تطبيق القواعد الخاصة على الخدمات إذا تم اختيار يوم عطلة
      const selectedServices = SERVICES_LIST.filter(s => services[s.id]).map(s => {
        let finalRate = s.rate;
        
        // حساب سعر النقل المتغير بناءً على الحجم
        if (s.id === 'yard') {
          const shiftCfg = STORAGE_CONFIG.SERVICES.SHIFTING.YARD_TO_YARD;
          const totalC = twentyCount + fortyCount;
          if (totalC > 0) {
            // السعر المرجح (Weighted Average) بناءً على توزيع الأحجام في البوليصة
            finalRate = (shiftCfg.rate20 * twentyCount + shiftCfg.rate40 * fortyCount) / totalC;
          } else {
            finalRate = shiftCfg.rate40; // افتراضي 
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

      // إضافة خدمة يوم العطلة إذا تم تفعيلها
      if (isHolidayRelease) {
        selectedServices.push({
           name: "صرف يوم العطلة",
           rate: 10,
           quantity: holidayQty
        });
      }

      // حساب تخزين ساحة الخطر (بالشرائح) إذا تم تفعيله
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
          isExternalStorage: false, // can be added to UI
          additionalServices: selectedServices,
          isDangerous: isDangerousCargo,
          isHolidayRelease // Pass this if needed down the line, but cargo stripping is handled via config in storageCalculator override
        }
      );
      
      // Override cargo stripping cost if we're on a holiday release (+50%)
      if (isHolidayRelease && hasCargoStripping) {
        // Find existing cargo stripping costs and add 50%
        invoice.usd.cargoServiceFee = invoice.usd.cargoServiceFee * 1.5;
        // Also update subtotal
        invoice.usd.subtotal = invoice.usd.storageFee + invoice.usd.fixedFees + invoice.usd.additionalServices + invoice.usd.cargoServiceFee;
        
        // Recalculate EGP
        const newEgpSubtotal = invoice.usd.subtotal * exchangeRate;
        const vatRate = STORAGE_CONFIG.GLOBAL.VAT_RATE || 0.14;
        const martyrStamp = STORAGE_CONFIG.GLOBAL.MARTYR_STAMP_FEE || 5;
        const vatAmount = newEgpSubtotal * vatRate;
        
        invoice.egp.subtotal = newEgpSubtotal;
        invoice.egp.vatAmount = vatAmount;
        invoice.egp.total = Math.ceil(newEgpSubtotal + vatAmount + martyrStamp);
      }

      // دمج تكلفة ساحة الخطر في الفاتورة النهائية
      if (hasDangerYard && dangerYardUSD > 0) {
        // إضافة 50% إذا كان يوم عطلة
        const dyFee = isHolidayRelease ? dangerYardUSD * 1.5 : dangerYardUSD;
        invoice.usd.dangerYardFee = dyFee;
        invoice.usd.subtotal += dyFee;
        if (dangerYardBreakdown.length) {
          invoice.details.dangerYardBreakdown = dangerYardBreakdown;
        }
        // إعادة حساب الإجماليات
        const newEgpSubtotal2 = invoice.usd.subtotal * exchangeRate;
        const vatRate2 = STORAGE_CONFIG.GLOBAL.VAT_RATE || 0.14;
        const martyrStamp2 = STORAGE_CONFIG.GLOBAL.MARTYR_STAMP_FEE || 5;
        const vatAmount2 = newEgpSubtotal2 * vatRate2;
        invoice.egp.subtotal = newEgpSubtotal2;
        invoice.egp.vatAmount = vatAmount2;
        invoice.egp.total = Math.ceil(newEgpSubtotal2 + vatAmount2 + martyrStamp2);
      }
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
              <div className="sc2-rate-val">{fmt(isRateOverridden ? exchangeRate : dynamicAdminRate)} <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--txt2)' }}>ج.م / $</span></div>
              <div className="sc2-rate-sub">{isRateOverridden ? "تم التعديل بواسطة المستخدم" : "مُسجَّل بواسطة الإدارة"}</div>
            </div>
          </div>
          
          {!isEditingRate ? (
            <div style={{ display: 'flex', gap: 8 }}>
              {isRateOverridden && (
                <button className="sc2-rate-edit" style={{ color: 'var(--red)', borderColor: 'var(--red-d)' }} onClick={() => { setIsRateOverridden(false); setCustomRate(String(dynamicAdminRate)); }}>
                  إلغاء المخصص
                </button>
              )}
              <button className="sc2-rate-edit" onClick={() => setIsEditingRate(true)}>
                <EditIcon />
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

                <button className="sc2-rate-override-cancel" onClick={() => { setIsEditingRate(false); if(!isRateOverridden) setCustomRate(String(dynamicAdminRate)); }} title="إلغاء التعديل">✕</button>
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
              <ClockIcon />
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
            <OptionsIcon />
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
              
              {/* خيارات جديدة: تفريغ مشمول وصرف يوم عطلة */}
              <div style={{ display: 'flex', gap: 6, alignItems: 'stretch' }}>
                <label className={`sc2-svc${hasCargoStripping ? " on" : ""}`} style={{ flex: 1, margin: 0 }}>
                  <input type="checkbox" checked={hasCargoStripping} onChange={() => setHasCargoStripping(!hasCargoStripping)} />
                  <span className="sc2-chk">
                    <CheckIcon />
                  </span>
                  <span className="sc2-svc-name">تفريغ مشمول</span>
                </label>
                {hasCargoStripping && (
                  <div className="sc2-counter" style={{ width: '90px', borderRadius: 'var(--r)',  border: '1.5px solid var(--acc)' }}>
                    <button 
                      className="sc2-counter-btn" 
                      style={{ width: '30px', height: '100%', fontSize: '18px' }}
                      onClick={() => setServiceQuantities(p => ({...p, stripping: Math.max(1, Number(serviceQuantities['stripping'] !== undefined ? serviceQuantities['stripping'] : (twentyCount + fortyCount)) - 1)}))}
                    >−</button>
                    <div className="sc2-counter-val" style={{ fontSize: '14px' }}>
                      {serviceQuantities['stripping'] !== undefined ? serviceQuantities['stripping'] : (twentyCount + fortyCount)}
                    </div>
                    <button 
                      className="sc2-counter-btn" 
                      style={{ width: '30px', height: '100%', fontSize: '18px' }}
                      onClick={() => setServiceQuantities(p => ({...p, stripping: Number(serviceQuantities['stripping'] !== undefined ? serviceQuantities['stripping'] : (twentyCount + fortyCount)) + 1}))}
                    >+</button>
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', gap: 6, alignItems: 'stretch' }}>
                <label className={`sc2-svc${isHolidayRelease ? " on" : ""}`} style={{ flex: 1, margin: 0 }}>
                  <input type="checkbox" checked={isHolidayRelease} onChange={() => setIsHolidayRelease(!isHolidayRelease)} />
                  <span className="sc2-chk">
                    <CheckIcon />
                  </span>
                  <span className="sc2-svc-name">صرف يوم عطلة</span>
                </label>
                {isHolidayRelease && (
                  <div className="sc2-counter" style={{ width: '90px', borderRadius: 'var(--r)',  border: '1.5px solid var(--acc)' }}>
                    <button 
                      className="sc2-counter-btn" 
                      style={{ width: '30px', height: '100%', fontSize: '18px' }}
                      onClick={() => setServiceQuantities(p => ({...p, holiday: Math.max(1, Number(serviceQuantities['holiday'] !== undefined ? serviceQuantities['holiday'] : (twentyCount + fortyCount)) - 1)}))}
                    >−</button>
                    <div className="sc2-counter-val" style={{ fontSize: '14px' }}>
                      {serviceQuantities['holiday'] !== undefined ? serviceQuantities['holiday'] : (twentyCount + fortyCount)}
                    </div>
                    <button 
                      className="sc2-counter-btn" 
                      style={{ width: '30px', height: '100%', fontSize: '18px' }}
                      onClick={() => setServiceQuantities(p => ({...p, holiday: Number(serviceQuantities['holiday'] !== undefined ? serviceQuantities['holiday'] : (twentyCount + fortyCount)) + 1}))}
                    >+</button>
                  </div>
                )}
              </div>

              {/* تخزين ساحة الخطر */}
              <div style={{ display: 'flex', gap: 6, alignItems: 'stretch' }}>
                <label className={`sc2-svc${hasDangerYard ? " on" : ""}`} style={{ flex: 1, margin: 0 }}>
                  <input type="checkbox" checked={hasDangerYard} onChange={() => setHasDangerYard(!hasDangerYard)} />
                  <span className="sc2-chk">
                    <CheckIcon />
                  </span>
                  <span className="sc2-svc-name">تخزين ساحة الخطر</span>
                </label>
                {hasDangerYard && (
                  <div className="sc2-counter" style={{ width: '90px', borderRadius: 'var(--r)', border: '1.5px solid var(--acc)' }}>
                    <button
                      className="sc2-counter-btn"
                      style={{ width: '30px', height: '100%', fontSize: '18px' }}
                      onClick={() => setServiceQuantities(p => ({...p, dangeryard: Math.max(1, Number(serviceQuantities['dangeryard'] !== undefined ? serviceQuantities['dangeryard'] : (twentyCount + fortyCount)) - 1)}))}
                    >−</button>
                    <div className="sc2-counter-val" style={{ fontSize: '14px' }}>
                      {serviceQuantities['dangeryard'] !== undefined ? serviceQuantities['dangeryard'] : (twentyCount + fortyCount)}
                    </div>
                    <button
                      className="sc2-counter-btn"
                      style={{ width: '30px', height: '100%', fontSize: '18px' }}
                      onClick={() => setServiceQuantities(p => ({...p, dangeryard: Number(serviceQuantities['dangeryard'] !== undefined ? serviceQuantities['dangeryard'] : (twentyCount + fortyCount)) + 1}))}
                    >+</button>
                  </div>
                )}
              </div>

              {SERVICES_LIST.map(svc => {
                const on = !!services[svc.id];
                const qty = serviceQuantities[svc.id] !== undefined ? serviceQuantities[svc.id] : (twentyCount + fortyCount);
                return (
                  <div key={svc.id} style={{ display: 'flex', gap: 6, alignItems: 'stretch' }}>
                    <label className={`sc2-svc${on ? " on" : ""}`} style={{ flex: 1, margin: 0 }}>
                      <input type="checkbox" checked={on} onChange={() => toggleService(svc.id)} />
                      <span className="sc2-chk">
                        <CheckIcon />
                      </span>
                      <span className="sc2-svc-name">{svc.name}</span>
                      <span className="sc2-svc-price">
                        ${svc.id === 'yard' 
                          ? ((STORAGE_CONFIG.SERVICES.SHIFTING.YARD_TO_YARD.rate20 * twentyCount + STORAGE_CONFIG.SERVICES.SHIFTING.YARD_TO_YARD.rate40 * fortyCount) / Math.max(1, (twentyCount + fortyCount)) * (isHolidayRelease ? 1.5 : 1)).toFixed(1)
                          : svc.rate
                        }
                      </span>
                    </label>
                    {on && (
                      <div className="sc2-counter" style={{ width: '90px', borderRadius: 'var(--r)',  border: '1.5px solid var(--acc)' }}>
                        <button 
                          className="sc2-counter-btn" 
                          style={{ width: '30px', height: '100%', fontSize: '18px' }}
                          onClick={() => setServiceQuantities(p => ({...p, [svc.id]: Math.max(1, Number(qty) - 1)}))}
                        >−</button>
                        <div className="sc2-counter-val" style={{ fontSize: '14px' }}>
                          {qty}
                        </div>
                        <button 
                          className="sc2-counter-btn" 
                          style={{ width: '30px', height: '100%', fontSize: '18px' }}
                          onClick={() => setServiceQuantities(p => ({...p, [svc.id]: Number(qty) + 1}))}
                        >+</button>
                      </div>
                    )}
                  </div>
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
                <SummaryIcon />
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
                ["رسوم التخزين",             `$${fmt(result.usd.storageFee)}`,       false],
                ["رسوم الخدمات الثابتة",     `$${fmt(result.usd.fixedFees)}`,         false],
                ...(result.usd.additionalServices > 0
                  ? [["الخدمات الإضافية",    `$${fmt(result.usd.additionalServices)}`, false]]
                  : []),
                ...(result.usd.cargoServiceFee > 0
                  ? [["تفريغ مشمول",          `$${fmt(result.usd.cargoServiceFee)}`,   false]]
                  : []),
                ...(result.usd.dangerYardFee > 0
                  ? [["تخزين ساحة الخطر",    `$${fmt(result.usd.dangerYardFee)}`,     false]]
                  : []),
                ["الإجمالي بالدولار",        `$${fmt(result.usd.subtotal)}`,           true],
                ["الإجمالي بالجنيه",         `${fmt(result.egp.subtotal, 0)} ج.م`,    false],
                ["ضريبة القيمة المضافة 14%", `${fmt(result.egp.vatAmount, 0)} ج.م`,   false],
                ["طابع الشهيد",              `${result.egp.martyrStamp} ج.م`,         false],
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

              {result.details.dangerYardBreakdown?.length > 0 && (
                <div className="sc2-brk">
                  <div className="sc2-brk-title">تفصيل شرائح ساحة الخطر</div>
                  {result.details.dangerYardBreakdown.map((b, i) => (
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