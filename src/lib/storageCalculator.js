/**
 * Date Helper
 * Calculates total days between two dates (Arrival and Release).
 * Includes both days in the calculation.
 */
export function calculateDaysBetweenDates(arrivalDate, releaseDate) {
  // Function to handle both DD/MM/YYYY and YYYY-MM-DD
  const parseDate = (str) => {
    if (!str || typeof str !== 'string') return new Date(str);
    if (str.includes('/')) {
      const [day, month, year] = str.split('/').map(Number);
      return new Date(year, month - 1, day);
    }
    return new Date(str); // Handles YYYY-MM-DD
  };

  const arrival = parseDate(arrivalDate);
  const release = parseDate(releaseDate);

  // Reset hours to ensure clean day calculation
  arrival.setHours(0, 0, 0, 0);
  release.setHours(0, 0, 0, 0);

  const diffTime = release.getTime() - arrival.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // +1 لتشمل يوم الوصول ويوم الصرف

  return diffDays > 0 ? diffDays : 0;
}

/**
 * Validation Layer
 * Ensures inputs and configuration are sane before processing.
 */
export function validateInputs(days, config, options = {}) {
  const errors = [];

  // 1. Basic Input Validation
  if (typeof days !== 'number' || days < 0) {
    errors.push('عدد الأيام يجب أن يكون رقماً موجباً.');
  }

  if (options.exchangeRate <= 0) {
    errors.push('سعر الصرف يجب أن يكون أكبر من الصفر.');
  }

  if (options.containerCount <= 0) {
    errors.push('عدد الحاويات يجب أن يكون 1 على الأقل.');
  }

  // 2. Configuration (Tiers) Validation
  if (!config || !Array.isArray(config.TIERS) || config.TIERS.length === 0) {
    errors.push('إعدادات الشرائح (TIERS) غير موجودة أو فارغة.');
  } else {
    let lastMaxDay = config.GRACE_PERIOD_DAYS || 0;

    config.TIERS.forEach((tier, index) => {
      if (tier.minDay > tier.maxDay) {
        errors.push(`خطأ في الشريحة ${index + 1}: بداية الشريحة (${tier.minDay}) أكبر من نهايتها (${tier.maxDay}).`);
      }

      // Check for Gaps or Overlaps
      if (tier.minDay !== lastMaxDay + 1) {
        const type = tier.minDay < lastMaxDay + 1 ? 'تداخل (Overlap)' : 'فجوة (Gap)';
        errors.push(`تم اكتشاف ${type} بين الشرائح: الشريحة ${index + 1} تبدأ من يوم ${tier.minDay} بينما انتهت السابقة عند يوم ${lastMaxDay}.`);
      }
      lastMaxDay = tier.maxDay;
    });
  }

  if (errors.length > 0) {
    throw new Error(errors.join('\n'));
  }

  return true;
}

/**
 * Storage Fee Calculator Module (USD)
 */
export function calculateStorageFee(days, config, options = {}) {
  const {
    billingType = 'INITIAL',
    previousDays = 0,
    rateMultiplier = 1
  } = options;

  if (!config || typeof days !== 'number' || days <= 0) {
    return { storageFeeUSD: 0, breakdown: [] };
  }

  const { GRACE_PERIOD_DAYS, TIERS } = config;
  let totalUSD = 0;
  const breakdown = [];

  // Days to calculate is the difference between total and previously paid days
  const daysToCalculate = Math.max(0, days - previousDays);
  let calculationStartDay = previousDays + 1;

  if (daysToCalculate > 0) {
    let daysToDistribute = daysToCalculate;

    // 1. Handle grace period if calculation falls within it
    if (calculationStartDay <= GRACE_PERIOD_DAYS) {
      const daysInGrace = Math.min(daysToDistribute, GRACE_PERIOD_DAYS - calculationStartDay + 1);
      if (daysInGrace > 0) {
        breakdown.push({
          tierName: 'فترة سماح',
          days: daysInGrace,
          rate: 0,
          originalRate: 0,
          multiplier: rateMultiplier,
          subtotal: 0,
          fromDay: calculationStartDay,
          toDay: calculationStartDay + daysInGrace - 1
        });
        daysToDistribute -= daysInGrace;
        calculationStartDay += daysInGrace;
      }
    }

    // 2. Distribute remaining days across tiers
    for (const tier of TIERS) {
      if (daysToDistribute <= 0) break;

      const tierMax = tier.maxDay;
      const tierMin = tier.minDay;

      if (calculationStartDay <= tierMax) {
        const actualStartInTier = Math.max(tierMin, calculationStartDay);
        if (actualStartInTier <= tierMax) {
          const potentialDaysInTier = tierMax === Infinity ? daysToDistribute : (tierMax - actualStartInTier + 1);
          const daysInThisTier = Math.min(daysToDistribute, potentialDaysInTier);

          if (daysInThisTier > 0) {
            const finalTierRate = tier.rate * rateMultiplier;
            const subtotal = daysInThisTier * finalTierRate;
            totalUSD += subtotal;
            breakdown.push({
              tierName: tier.name,
              days: daysInThisTier,
              rate: finalTierRate,
              originalRate: tier.rate,
              multiplier: rateMultiplier,
              subtotal,
              fromDay: calculationStartDay,
              toDay: calculationStartDay + daysInThisTier - 1
            });
            daysToDistribute -= daysInThisTier;
            calculationStartDay += daysInThisTier;
          }
        }
      }
    }
  }

  return { storageFeeUSD: totalUSD, breakdown };
}

/**
 * Service Fee Calculator Module (USD)
 */
export function calculateServiceFee(config, options = {}) {
  const {
    containerCount = 1,
    isDangerous = false,
    additionalServices = [] // e.g., [{ name: 'ونش 3 طن', rate: 13 }]
  } = options;

  const FIXED_SERVICE_FEE = config?.FIXED_SERVICE_FEE || 0;
  const serviceMultiplier = isDangerous ? 1.5 : 1;

  let totalUSD = 0;
  const totalFixedFeesUSD = FIXED_SERVICE_FEE * containerCount;

  const servicesBreakdown = additionalServices.map(service => {
    const finalRate = service.rate * serviceMultiplier;
    // إذا تم توفير كمية (quantity) للخدمة نستخدمها، وإلا نستخدم عدد الحاويات كافتراضي
    const serviceQty = typeof service.quantity === 'number' ? service.quantity : containerCount;
    const subtotal = finalRate * serviceQty;

    totalUSD += subtotal;
    return {
      name: service.name,
      originalRate: service.rate,
      multiplier: serviceMultiplier,
      finalRate: finalRate,
      quantity: serviceQty,
      subtotal: subtotal
    };
  });

  return {
    fixedFeesUSD: totalFixedFeesUSD,
    additionalServicesUSD: totalUSD,
    servicesBreakdown
  };
}

/**
 * Currency Calculator Module (USD -> EGP)
 */
export function convertToEGP(amountUSD, exchangeRate) {
  return amountUSD * exchangeRate;
}

/**
 * Tax & Stamp Calculator Module (EGP)
 */
export function calculateTaxAndStamps(amountEGP, globalConfig) {
  const vatRate = globalConfig?.VAT_RATE || 0.14;
  const martyrStamp = globalConfig?.MARTYR_STAMP_FEE || 5;

  const vatAmount = amountEGP * vatRate;
  const totalWithTax = amountEGP + vatAmount;

  // التقريب للأعلى دائماً كما طلب المستخدم (500.01 تصبح 501)
  const finalTotal = Math.ceil(totalWithTax + martyrStamp);

  return {
    vatAmount,
    martyrStamp,
    finalTotal
  };
}

/**
 * Multi-Container Orchestrator
 * Handles invoices with different container sizes/types.
 */
export function calculateMultiContainerInvoice(arrivalDate, releaseDate, containerGroups, globalConfig, options = {}) {
  const {
    exchangeRate = 48.50,
    isExternalStorage = false,
    isLCLStorage = false,
    additionalServices = [] // Services for the whole invoice or specific ones? 
  } = options;

  let totalStorageUSD = 0;
  let totalSurchargeUSD = 0;
  let totalCargoStorageUSD = 0;
  let totalFixedFeesUSD = 0;
  let totalCargoServiceFeeUSD = 0;
  let totalAdditionalServicesUSD = 0;

  const allDetails = {
    storageBreakdown: [],
    surchargeBreakdown: [],
    cargoBreakdown: [],
    servicesBreakdown: []
  };

  const days = calculateDaysBetweenDates(arrivalDate, releaseDate);

  // 1. Process each container group
  containerGroups.forEach((group, index) => {
    const {
      config,
      surchargeConfig,
      count,
      sizeLabel,
      isDangerous = false,
      hasCargoService = false,
      hasCargoStorage = false,
      rateMultiplier = 1
    } = group;

    // Adjust config for External Storage or LCL Storage
    let adjustedConfig = config;
    if (isExternalStorage) {
      adjustedConfig = {
        ...config,
        GRACE_PERIOD_DAYS: 0,
        TIERS: config.TIERS.map((tier, i) => i === 0 ? { ...tier, minDay: 1 } : tier)
      };
    } else if (isLCLStorage) {
      // LCL: فترة سماح 3 أيام بدلاً من 5
      adjustedConfig = {
        ...config,
        GRACE_PERIOD_DAYS: 3,
        TIERS: config.TIERS.map((tier, i) => i === 0 ? { ...tier, minDay: 4, maxDay: 20 } : tier)
      };
    }

    // A. Main Storage
    const isActuallyDangerous = isDangerous || options.isDangerous;
    const baseStorageConfig = isActuallyDangerous ? group.dangerousConfig : adjustedConfig;

    const storageRes = calculateStorageFee(days, baseStorageConfig, {
      rateMultiplier,
      billingType: options.billingType,
      previousDays: options.previousDays
    });
    const groupStorageUSD = storageRes.storageFeeUSD * count;
    totalStorageUSD += groupStorageUSD;
    allDetails.storageBreakdown.push(...storageRes.breakdown.map(b => ({ ...b, tierName: `${sizeLabel} - ${b.tierName}` })));

    // B. Surcharge
    if (surchargeConfig && !isActuallyDangerous) {
      const surchargeGrace = isExternalStorage ? 0 : (isLCLStorage ? 3 : (surchargeConfig.GRACE_PERIOD_DAYS || 0));
      const adjustedSurchargeConfig = {
        ...surchargeConfig,
        GRACE_PERIOD_DAYS: surchargeGrace,
        TIERS: surchargeConfig.TIERS?.map((tier, i) => {
          if (i === 0) {
            if (surchargeGrace === 0) return { ...tier, minDay: 1 };
            if (surchargeGrace === 3) return { ...tier, minDay: 4 };
          }
          return tier;
        })
      };
      const surRes = calculateStorageFee(days, adjustedSurchargeConfig, { rateMultiplier });
      const groupSurchargeUSD = surRes.storageFeeUSD * count;
      totalSurchargeUSD += groupSurchargeUSD;
      allDetails.surchargeBreakdown.push(...surRes.breakdown.map(b => ({ ...b, tierName: `${sizeLabel} - إضافي ${b.tierName}` })));
    }

    // C. Cargo Storage
    if (hasCargoStorage && group.cargoStorageCount > 0) {
      const cargoConfig = {
        ...adjustedConfig,
        GRACE_PERIOD_DAYS: 1,
        TIERS: adjustedConfig.TIERS.map((tier, i) => i === 0 ? { ...tier, minDay: 2 } : tier)
      };
      const cargoDays = options.cargoStorageDays || days;
      const cargoRes = calculateStorageFee(cargoDays, cargoConfig, { rateMultiplier: rateMultiplier * 2 });
      const activeCargoCount = group.cargoStorageCount;
      const groupCargoStorageUSD = cargoRes.storageFeeUSD * activeCargoCount;
      totalCargoStorageUSD += groupCargoStorageUSD;
      allDetails.cargoBreakdown.push(...cargoRes.breakdown.map(b => ({ ...b, tierName: `${sizeLabel} - مشمول ${b.tierName}` })));
    }

    // D. Fixed Services
    if (options.billingType !== 'RENEWAL') {
      const serviceRes = calculateServiceFee(adjustedConfig, { containerCount: count, isDangerous: isActuallyDangerous });
      totalFixedFeesUSD += serviceRes.fixedFeesUSD;
    }

    // E. Cargo Service Fee
    if (hasCargoService && adjustedConfig.CARGO_SERVICE_FEE) {
      const activeCount = group.cargoServiceCount !== undefined ? group.cargoServiceCount : count;
      // LCL: نصف السعر لتفريغ المشمول
      const cargoServiceRate =
          adjustedConfig.CARGO_SERVICE_FEE *
          (isLCLStorage ? 0.5 : 1) *
          (isActuallyDangerous ? 1.5 : 1);
      totalCargoServiceFeeUSD += cargoServiceRate * activeCount;
    }
  });

  // 2. Process Shared Additional Services
  const sharedServiceRes = calculateServiceFee(null, {
    containerCount: 1,
    isDangerous: options.isDangerous || false,
    additionalServices
  });
  totalAdditionalServicesUSD = sharedServiceRes.additionalServicesUSD;
  allDetails.servicesBreakdown.push(...sharedServiceRes.servicesBreakdown);

  // 3. Final Calculations
  const totalUSD = totalStorageUSD + totalSurchargeUSD + totalCargoStorageUSD + totalFixedFeesUSD + totalCargoServiceFeeUSD + totalAdditionalServicesUSD;
  const subtotalEGP = convertToEGP(totalUSD, exchangeRate);
  const taxResult = calculateTaxAndStamps(subtotalEGP, globalConfig);

  return {
    summary: {
      arrivalDate,
      releaseDate,
      days,
      groups: containerGroups.map(g => ({ label: g.sizeLabel, count: g.count })),
      exchangeRate,
    },
    usd: {
      storageFee: totalStorageUSD,
      surchargeFee: totalSurchargeUSD,
      cargoStorageFee: totalCargoStorageUSD,
      fixedFees: totalFixedFeesUSD,
      additionalServices: totalAdditionalServicesUSD,
      cargoServiceFee: totalCargoServiceFeeUSD,
      subtotal: totalUSD
    },
    egp: {
      subtotal: subtotalEGP,
      vatAmount: taxResult.vatAmount,
      martyrStamp: taxResult.martyrStamp,
      total: taxResult.finalTotal
    },
    details: allDetails
  };
}

/**
 * Main Orchestrator Function (Legacy Support)
 */
export function calculateFinalInvoice(arrivalDate, releaseDate, config, globalConfig, options = {}) {
  const {
    containerCount = 1,
    exchangeRate = 48.50,
    hasCargoService = false, // تفريغ/شحن المشمول
    hasCargoStorage = false, // أرضيات المشمول (ضعف الحاوية)
    isExternalStorage = false, // خروج لتخزين خارجي (يلغي فترة السماح)
    surchargeConfig = null     // إعدادات إضافية لنوع الحاوية (مبرد/خطر)
  } = options;

  // 1. Calculate Days automatically from dates
  const days = calculateDaysBetweenDates(arrivalDate, releaseDate);

  // 2. Adjust config for External Storage
  let adjustedConfig = config;
  if (isExternalStorage) {
    adjustedConfig = {
      ...config,
      GRACE_PERIOD_DAYS: 0,
      // تعديل الشريحة الأولى لتبدأ من اليوم 1 بدلاً من اليوم 6
      TIERS: config.TIERS.map((tier, index) =>
        index === 0 ? { ...tier, minDay: 1 } : tier
      )
    };
  }

  // 3. Validation Layer
  validateInputs(days, adjustedConfig, options);

  // 4. Calculate Main Container Storage (FULL)
  // ملاحظة: الحاويات الخطرة لا تتمتع بفترة سماح حتى في التخزين الأساسي
  const baseStorageConfig = options.isDangerous
    ? { ...config, GRACE_PERIOD_DAYS: 0, TIERS: config.TIERS.map((t, i) => i === 0 ? { ...t, minDay: 1 } : t) }
    : adjustedConfig;

  const storageResult = calculateStorageFee(days, baseStorageConfig, options);
  const totalStorageUSD = storageResult.storageFeeUSD * containerCount;

  // 5. Calculate Type Surcharge (REEFER/DANGEROUS/NON_STANDARD) if applicable
  // تحسب كإضافة على التخزين الأساسي
  let surchargeUSD = 0;
  let surchargeBreakdown = [];

  if (surchargeConfig) {
    // في حالة التخزين الخارجي أو الحاويات الخطرة، نلغي السماح للصنف أيضاً
    const surchargeGrace = (isExternalStorage || options.isDangerous) ? 0 : (surchargeConfig.GRACE_PERIOD_DAYS || 0);

    const adjustedSurchargeConfig = {
      ...surchargeConfig,
      GRACE_PERIOD_DAYS: surchargeGrace,
      TIERS: surchargeConfig.TIERS?.map((tier, index) =>
        (index === 0 && surchargeGrace === 0) ? { ...tier, minDay: 1 } : tier
      )
    };

    const surRes = calculateStorageFee(days, adjustedSurchargeConfig, options);
    surchargeUSD = surRes.storageFeeUSD * containerCount;
    surchargeBreakdown = surRes.breakdown.map(b => ({ ...b, tierName: `إضافي صنف - ${b.tierName}` }));
  }

  // 6. Calculate Cargo Storage (if applicable)
  let cargoStorageUSD = 0;
  let cargoBreakdown = [];
  if (hasCargoStorage) {
    // المشمول: سماح يوم واحد + ضعف سعر الشريحة
    const cargoConfig = {
      ...adjustedConfig,
      GRACE_PERIOD_DAYS: 1,
      TIERS: adjustedConfig.TIERS.map((tier, i) => i === 0 ? { ...tier, minDay: 2 } : tier)
    };
    const cargoDays = options.cargoStorageDays || days;
    const cargoRes = calculateStorageFee(cargoDays, cargoConfig, {
      ...options,
      rateMultiplier: (options.rateMultiplier || 1) * 2
    });
    cargoStorageUSD = cargoRes.storageFeeUSD * containerCount;
    cargoBreakdown = cargoRes.breakdown.map(b => ({ ...b, tierName: `أرضيات مشمول - ${b.tierName}` }));
  }

  // 6. Calculate Services
  const serviceResult = calculateServiceFee(adjustedConfig, options);

  // ملاحظة: الرسوم الثابتة ($25) لا تفرض في حالة التجديد
  const fixedFeesUSD = options.billingType === 'RENEWAL' ? 0 : serviceResult.fixedFeesUSD;

  // إضافة رسوم خدمة المشمول الثابتة (60$ أو 120$)
  let cargoServiceFeeUSD = 0;
  if (hasCargoService && adjustedConfig.CARGO_SERVICE_FEE) {
    const cargoServiceMultiplier = options.isDangerous ? 1.5 : 1;
    cargoServiceFeeUSD = adjustedConfig.CARGO_SERVICE_FEE * containerCount * cargoServiceMultiplier;
  }

  const totalUSD = totalStorageUSD + surchargeUSD + cargoStorageUSD + fixedFeesUSD + serviceResult.additionalServicesUSD + cargoServiceFeeUSD;

  // 6. Convert to EGP
  const subtotalEGP = convertToEGP(totalUSD, exchangeRate);

  // 7. Calculate Taxes
  const taxResult = calculateTaxAndStamps(subtotalEGP, globalConfig);

  return {
    summary: {
      arrivalDate,
      releaseDate,
      days,
      containerCount,
      exchangeRate,
      isDangerous: options.isDangerous || false,
      billingType: options.billingType || 'INITIAL',
      hasCargoService,
      hasCargoStorage
    },
    usd: {
      storageFee: totalStorageUSD,
      surchargeFee: surchargeUSD,
      cargoStorageFee: cargoStorageUSD,
      fixedFees: fixedFeesUSD,
      additionalServices: serviceResult.additionalServicesUSD,
      cargoServiceFee: cargoServiceFeeUSD,
      subtotal: totalUSD
    },
    egp: {
      subtotal: subtotalEGP,
      vatAmount: taxResult.vatAmount,
      martyrStamp: taxResult.martyrStamp,
      total: taxResult.finalTotal
    },
    details: {
      storageBreakdown: storageResult.breakdown,
      surchargeBreakdown: surchargeBreakdown,
      cargoBreakdown: cargoBreakdown,
      servicesBreakdown: serviceResult.servicesBreakdown
    }
  };
}
