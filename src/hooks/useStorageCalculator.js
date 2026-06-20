'use client';

import { useState, useEffect, useCallback } from 'react';
import { format } from 'date-fns';
import { STORAGE_CONFIG, SERVICES_LIST } from '@/lib/storageConstants';
import { calculateMultiContainerInvoice, calculateStorageFee } from '@/lib/storageCalculator';
import { useCalculatorStore } from '@/store/useCalculatorStore';

function formatNumber(n, dec = 2) {
  return Number(n).toLocaleString('ar-EG', { minimumFractionDigits: dec, maximumFractionDigits: dec });
}

// Calculate days between two dates
function calculateLiveDays(arrDate, relDate) {
  if (!arrDate || !relDate) return null;
  const a = new Date(arrDate); a.setHours(0, 0, 0, 0);
  const r = new Date(relDate); r.setHours(0, 0, 0, 0);
  const d = Math.ceil((r - a) / 86400000) + 1;
  return d > 0 ? d : null;
}

// Calculate ns multiplier for a given size
function calculateNsMultiplier(cargoType, nonStdType, sizeCfg) {
  if (cargoType === "NON_STANDARD") {
    return sizeCfg?.NON_STANDARD?.[nonStdType]?.RATE_MULTIPLIER || 1;
  }
  return 1;
}

export function useStorageCalculator(adminExchangeRate) {
  // ── Primary state ──
  const [arrDate, setArrDate] = useState(null);
  const [relDate, setRelDate] = useState(new Date());
  const [billingType, setBillingType] = useState("INITIAL");
  const [twentyCount, setTwentyCount] = useState(1);
  const [fortyCount, setFortyCount] = useState(0);

  // ── Per-size cargo type ──
  const [twentyCargoType, setTwentyCargoType] = useState("FULL");
  const [fortyCargoType, setFortyCargoType] = useState("FULL");

  // ── Per-size non-standard sub-type ──
  const [nonStdType20, setNonStdType20] = useState("OOG");
  const [nonStdType40, setNonStdType40] = useState("OOG");

  // ── Exchange rate ──
  const [isEditingRate, setIsEditingRate] = useState(false);
  const [isRateOverridden, setIsRateOverridden] = useState(false);
  const [customRate, setCustomRate] = useState(String(adminExchangeRate));
  const exchangeRate = isRateOverridden ? (Number(customRate) || adminExchangeRate) : adminExchangeRate;

  // ── Init state ──
  const [isInitializing, setIsInitializing] = useState(true);
  const [initError, setInitError] = useState('');

  // ── Attempts ──
  const [remainingAttempts, setRemainingAttempts] = useState(null);
  const [attemptsLoading, setAttemptsLoading] = useState(false);

  // ── Advanced / secondary state ──
  const [advOpen, setAdvOpen] = useState(false);
  const [prevDays, setPrevDays] = useState(0);

  // ── New Appended Features ──
  const [isHolidayRelease, setIsHolidayRelease] = useState(false);
  const [hasCargoStripping, setHasCargoStripping] = useState(false);

  // ── Per-size danger yard ──
  const [hasDangerYard20, setHasDangerYard20] = useState(false);
  const [hasDangerYard40, setHasDangerYard40] = useState(false);

  const [hasCargoStorage, setHasCargoStorage] = useState(false);
  const [cargoExitDate, setCargoExitDate] = useState(null);
  const [isExternalStorage, setIsExternalStorage] = useState(false);
  const [isLCLStorage, setIsLCLStorage] = useState(false);

  const [services, setServices] = useState({});
  const [serviceQuantities, setServiceQuantities] = useState({});

  // ── Result from Store ──
  const result = useCalculatorStore((state) => state.result);
  const setResult = useCalculatorStore((state) => state.setResult);
  const clearResult = useCalculatorStore((state) => state.clearResult);
  const [error, setError] = useState("");

  // Derived state
  const days = calculateLiveDays(arrDate, relDate);

  // Per-size multipliers (using respective size config)
  const nsMultiplier20 = calculateNsMultiplier(
    twentyCargoType, nonStdType20, STORAGE_CONFIG.IMPORT.TWENTY_FT
  );
  const nsMultiplier40 = calculateNsMultiplier(
    fortyCargoType, nonStdType40, STORAGE_CONFIG.IMPORT.FORTY_FT
  );

  // For backward compat in AdvancedOptions — use 20ft as primary for shared services display
  const nsMultiplier = nsMultiplier20;

  const hasAdvanced =
    billingType === "RENEWAL" ||
    twentyCargoType !== "FULL" ||
    fortyCargoType !== "FULL" ||
    hasCargoStripping ||
    hasCargoStorage ||
    hasDangerYard20 ||
    hasDangerYard40 ||
    isHolidayRelease ||
    isExternalStorage ||
    isLCLStorage ||
    Object.values(services).some(Boolean);

  // Initialize attempts
  const initializeAttempts = useCallback(async () => {
    setIsInitializing(true);
    setInitError('');
    try {
      const res = await fetch('/api/calculator/init');
      const data = await res.json();
      if (data.success) {
        setRemainingAttempts(data.remainingAttempts);
      } else {
        setInitError(data.error || 'فشل في تحميل البيانات');
      }
    } catch (err) {
      setInitError('حدث خطأ في الاتصال بالخادم');
    } finally {
      setIsInitializing(false);
    }
  }, []);

  useEffect(() => {
    initializeAttempts();
  }, [initializeAttempts]);

  // Service toggle
  function toggleService(id) {
    setServices(prev => {
      const isNowOn = !prev[id];
      if (!isNowOn) {
        setServiceQuantities(p => { const newQ = { ...p }; delete newQ[id]; return newQ; });
      }
      return { ...prev, [id]: isNowOn };
    });
  }

  // Reset form
  function resetForm() {
    clearResult();
    setArrDate(null);
    setRelDate(new Date());
    setTwentyCount(1);
    setFortyCount(0);
    setTwentyCargoType("FULL");
    setFortyCargoType("FULL");
    setNonStdType20("OOG");
    setNonStdType40("OOG");
    setPrevDays(0);
    setCargoExitDate(null);
    setIsLCLStorage(false);
    setHasCargoStripping(false);
    setHasCargoStorage(false);
    setIsExternalStorage(false);
    setIsHolidayRelease(false);
    setHasDangerYard20(false);
    setHasDangerYard40(false);
    setServices({});
    setServiceQuantities({});
  }

  // Calculate invoice
  const calculate = useCallback(async () => {
    setError("");
    setResult(null);

    if (!arrDate || !relDate) {
      setError("الرجاء إدخال تاريخ الوصول والصرف.");
      return;
    }

    if (twentyCount <= 0 && fortyCount <= 0) {
      setError("الرجاء إدخال عدد الحاويات (20 أو 40 قدم).");
      return;
    }

    // التحقق من تاريخ خروج المشمول
    if (hasCargoStorage && !cargoExitDate) {
      setError("الرجاء تحديد تاريخ خروج المشمول من الحاوية.");
      return;
    }

    // Use one attempt and track calculation (combined API)
    setAttemptsLoading(true);
    try {
      const attemptRes = await fetch('/api/attempts/use', { method: 'POST' });
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

    const maxDays = days || 0;
    if (billingType === "RENEWAL" && prevDays > maxDays) {
      setError(`الأيام المسددة سابقاً (${prevDays} يوم) لا يمكن أن تتجاوز إجمالي مدة التخزين (${maxDays} يوم).`);
      return;
    }

    try {
      const arrStr = format(arrDate, 'yyyy-MM-dd');
      const relStr = format(relDate, 'yyyy-MM-dd');

      const daysCalc = maxDays;

      // حساب أيام تخزين المشمول
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
      const totalConts = twentyCount + fortyCount;

      // Extract quantities for special services
      const strippedQty = serviceQuantities['stripping'] !== undefined ? Number(serviceQuantities['stripping']) : totalConts;
      const holidayQty = serviceQuantities['holiday'] !== undefined ? Number(serviceQuantities['holiday']) : totalConts;
      const cargoStorageQty = serviceQuantities['cargostorage'] !== undefined ? Number(serviceQuantities['cargostorage']) : totalConts;

      // Distribute stripping qty (prioritize 40ft, then 20ft)
      let remStripped = strippedQty;
      const stripping40 = fortyCount > 0 ? Math.min(remStripped, fortyCount) : 0;
      remStripped -= stripping40;
      const stripping20 = twentyCount > 0 ? Math.min(remStripped, twentyCount) + Math.max(0, remStripped - twentyCount) : remStripped;

      // Distribute cargo storage qty
      let remCargoStorage = cargoStorageQty;
      const cargoStorage40 = fortyCount > 0 ? Math.min(remCargoStorage, fortyCount) : 0;
      remCargoStorage -= cargoStorage40;
      const cargoStorage20 = twentyCount > 0 ? Math.min(remCargoStorage, twentyCount) + Math.max(0, remCargoStorage - twentyCount) : remCargoStorage;

      // ── 20-foot container group ──
      if (twentyCount > 0) {
        const baseConfig = STORAGE_CONFIG.IMPORT.TWENTY_FT;
        let surchargeConfig = null;
        let rateMultiplier = 1;

        if (twentyCargoType === "REEFER") {
          surchargeConfig = baseConfig.REEFER;
        } else if (twentyCargoType === "NON_STANDARD") {
          rateMultiplier = baseConfig.NON_STANDARD[nonStdType20]?.RATE_MULTIPLIER || 1;
        }

        containerGroups.push({
          sizeLabel: "٢٠ قدم",
          count: twentyCount,
          config: { ...baseConfig.FULL, CARGO_SERVICE_FEE: baseConfig.CARGO_SERVICE_FEE * nsMultiplier20 },
          dangerousConfig: { ...baseConfig.DANGEROUS, CARGO_SERVICE_FEE: baseConfig.CARGO_SERVICE_FEE * nsMultiplier20 },
          surchargeConfig,
          rateMultiplier,
          isDangerous: twentyCargoType === "DANGEROUS",
          hasCargoService: hasCargoStripping && stripping20 > 0,
          cargoServiceCount: stripping20,
          hasCargoStorage: hasCargoStorage && cargoStorage20 > 0,
          cargoStorageCount: cargoStorage20
        });
      }

      // ── 40-foot container group ──
      if (fortyCount > 0) {
        const baseConfig = STORAGE_CONFIG.IMPORT.FORTY_FT;
        let surchargeConfig = null;
        let rateMultiplier = 1;

        if (fortyCargoType === "REEFER") {
          surchargeConfig = baseConfig.REEFER;
        } else if (fortyCargoType === "NON_STANDARD") {
          rateMultiplier = baseConfig.NON_STANDARD[nonStdType40]?.RATE_MULTIPLIER || 1;
        }

        containerGroups.push({
          sizeLabel: "٤٠ قدم",
          count: fortyCount,
          config: { ...baseConfig.FULL, CARGO_SERVICE_FEE: baseConfig.CARGO_SERVICE_FEE * nsMultiplier40 },
          dangerousConfig: { ...baseConfig.DANGEROUS, CARGO_SERVICE_FEE: baseConfig.CARGO_SERVICE_FEE * nsMultiplier40 },
          surchargeConfig,
          rateMultiplier,
          isDangerous: fortyCargoType === "DANGEROUS",
          hasCargoService: hasCargoStripping && stripping40 > 0,
          cargoServiceCount: stripping40,
          hasCargoStorage: hasCargoStorage && cargoStorage40 > 0,
          cargoStorageCount: cargoStorage40
        });
      }

      // Build selected services list
      const selectedServices = SERVICES_LIST.filter(s => services[s.id]).map(s => {
        let finalRate = s.rate * nsMultiplier20; // use 20ft multiplier as baseline for shared services

        if (s.id === 'yard') {
          const shiftCfg = STORAGE_CONFIG.SERVICES.SHIFTING.YARD_TO_YARD;
          const totalC = twentyCount + fortyCount;
          if (totalC > 0) {
            finalRate = (
              (shiftCfg.rate20 * twentyCount * nsMultiplier20 + shiftCfg.rate40 * fortyCount * nsMultiplier40) / totalC
            );
          } else {
            finalRate = shiftCfg.rate40 * nsMultiplier40;
          }
          if (isHolidayRelease) finalRate *= 1.5;
        }

        return {
          ...s,
          rate: finalRate,
          quantity: serviceQuantities[s.id] !== undefined && serviceQuantities[s.id] !== ""
            ? Number(serviceQuantities[s.id])
            : totalConts
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

      // ── Per-size danger yard calculation ──
      let dangerYardUSD = 0;
      let dangerYardBreakdown = [];

      const hasDangerYardAny = hasDangerYard20 || hasDangerYard40;

      if (hasDangerYardAny) {
        const dyConfig = STORAGE_CONFIG.SERVICES.DANGER_YARD;
        const dyRes = calculateStorageFee(daysCalc, dyConfig, {});

        const dangerYardQty20 = serviceQuantities['dangeryard20'] !== undefined
          ? Number(serviceQuantities['dangeryard20'])
          : (hasDangerYard20 ? twentyCount : 0);

        const dangerYardQty40 = serviceQuantities['dangeryard40'] !== undefined
          ? Number(serviceQuantities['dangeryard40'])
          : (hasDangerYard40 ? fortyCount : 0);

        const totalDangerQty = dangerYardQty20 + dangerYardQty40;

        dangerYardUSD = dyRes.storageFeeUSD * totalDangerQty;
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
          isDangerous: twentyCargoType === "DANGEROUS" || fortyCargoType === "DANGEROUS",
          isHolidayRelease,
          cargoStorageDays: cargoDays
        }
      );

      // Override cargo stripping cost if holiday release (+50%)
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
      if (hasDangerYardAny && dangerYardUSD > 0) {
        invoice.usd.dangerYardFee = dangerYardUSD;
        invoice.usd.subtotal += dangerYardUSD;
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
    } catch (err) {
      setError(err.message);
    }
  }, [
    arrDate, relDate, billingType, twentyCount, fortyCount,
    twentyCargoType, fortyCargoType, nonStdType20, nonStdType40,
    hasCargoStripping, hasCargoStorage, isExternalStorage, isLCLStorage,
    isHolidayRelease, hasDangerYard20, hasDangerYard40,
    services, serviceQuantities,
    exchangeRate, days, prevDays, nsMultiplier20, nsMultiplier40, cargoExitDate
  ]);

  // Auto effects
  useEffect(() => {
    if (hasCargoStorage && !hasCargoStripping) {
      setHasCargoStripping(true);
    }
  }, [hasCargoStorage]);

  useEffect(() => {
    if (isLCLStorage) {
      setHasCargoStripping(true);
    }
  }, [isLCLStorage]);

  // Reset danger yard if cargo type changes away from a compatible type
  useEffect(() => {
    if (twentyCargoType === "NON_STANDARD") setHasDangerYard20(false);
  }, [twentyCargoType]);

  useEffect(() => {
    if (fortyCargoType === "NON_STANDARD") setHasDangerYard40(false);
  }, [fortyCargoType]);

  return {
    // Primary
    arrDate, setArrDate,
    relDate, setRelDate,
    billingType, setBillingType,
    twentyCount, setTwentyCount,
    fortyCount, setFortyCount,

    // Per-size cargo type
    twentyCargoType, setTwentyCargoType,
    fortyCargoType, setFortyCargoType,

    // Per-size non-standard type
    nonStdType20, setNonStdType20,
    nonStdType40, setNonStdType40,

    // Exchange rate
    isEditingRate, setIsEditingRate,
    isRateOverridden, setIsRateOverridden,
    customRate, setCustomRate,
    exchangeRate,

    // Init
    isInitializing,
    initError,
    initializeAttempts,

    // Attempts
    remainingAttempts,
    attemptsLoading,

    // Advanced
    advOpen, setAdvOpen,
    prevDays, setPrevDays,

    // Features
    isHolidayRelease, setIsHolidayRelease,
    hasCargoStripping, setHasCargoStripping,
    hasDangerYard20, setHasDangerYard20,
    hasDangerYard40, setHasDangerYard40,
    hasCargoStorage, setHasCargoStorage,
    cargoExitDate, setCargoExitDate,
    isExternalStorage, setIsExternalStorage,
    isLCLStorage, setIsLCLStorage,
    services, setServices,
    serviceQuantities, setServiceQuantities,

    // Result
    result, setResult,
    error, setError,

    // Derived
    days,
    nsMultiplier20, nsMultiplier40,
    nsMultiplier, // backward compat alias for shared services display
    hasAdvanced,

    // Methods
    calculate,
    toggleService,
    resetForm,
    formatNumber
  };
}
