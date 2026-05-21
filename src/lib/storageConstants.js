/**
 * Constants for Container Storage Calculation
 * This module is designed to be extensible for different container types and shipping directions.
 */

export const STORAGE_CONFIG = {
  // Global Settings
  GLOBAL: {
    VAT_RATE: 0.14, // 14% ضريبة القيمة المضافة
    DEFAULT_EXCHANGE_RATE: Number(process.env.NEXT_PUBLIC_DEFAULT_EXCHANGE_RATE) || 53.1971, // سعر صرف افتراضي (يمكن تحديثه)
    MARTYR_STAMP_FEE: 5, // طابع شهيد (5 جنيهات ثابتة على الفاتورة)
    BASE_CURRENCY: 'EGP',
    STORAGE_CURRENCY: 'USD'
  },

  // Billing Types (أنواع الفواتير)
  BILLING_TYPES: {
    INITIAL: 'INITIAL', // فاتورة أول مرة (تشمل فترة سماح)
    RENEWAL: 'RENEWAL'  // فاتورة تجديد (لا تشمل فترة سماح فى حالة التجديد بعد وقت الوصول بخمس ايام)
  },

  // Additional Services (خدمات إضافية)
  SERVICES: {
    EQUIPMENT: {
      CRANE_3T: { name: 'ونش 3 طن', rate: 13, unit: 'per_container' },
      CRANE_5T: { name: 'ونش 5 طن', rate: 15, unit: 'per_container' },
      FORKLIFT: { name: 'كلارك', rate: 30, unit: 'per_container' }
    },
    SHIFTING: {
      YARD_TO_YARD: { name: 'نقل بين الساحات', rate: 88, unit: 'per_container' }
    },
    DANGER_YARD: {
      // تخزين في ساحة الخطر — يُحسب بالشرائح لكل حاوية
      GRACE_PERIOD_DAYS: 0,
      TIERS: [
        { name: 'الشريحة 1 (خطر)', minDay: 1, maxDay: 3,        rate: 33 },
        { name: 'الشريحة 2 (خطر)', minDay: 4, maxDay: Infinity,  rate: 66 }
      ]
    }
  },

  // Import Containers (الوارد)
  IMPORT: {
    // 20ft Container (حاوية 20 قدم)
    TWENTY_FT: {
      CARGO_SERVICE_FEE: 60, // تفريغ أو شحن المشمول
      FULL: {
        GRACE_PERIOD_DAYS: 5, // فترة السماح (أيام)
        FIXED_SERVICE_FEE: 25, // رسوم خدمات إضافية ثابتة (دولار)
        CURRENCY: 'USD',
        TIERS: [
          {
            name: 'Tier 1',
            minDay: 6,
            maxDay: 20,
            rate: 8 // 8 دولار لكل يوم
          },
          {
            name: 'Tier 2',
            minDay: 21,
            maxDay: Infinity,
            rate: 12 // 12 دولار لكل يوم لما زاد عن 20 يوم
          }
        ]
      },
      REEFER: {
        GRACE_PERIOD_DAYS: 0, // الحاويات المبردة عادة لا يوجد لها سماح أو يختلف
        FIXED_SERVICE_FEE: 25,
        CURRENCY: 'USD',
        TIERS: [
          { name: 'الشريحة 1', minDay: 1, maxDay: 7, rate: 22 },
          { name: 'الشريحة 2', minDay: 8, maxDay: 10, rate: 33 },
          { name: 'الشريحة 3', minDay: 11, maxDay: Infinity, rate: 44 }
        ]
      },
      DANGEROUS: {
        GRACE_PERIOD_DAYS: 0, // الحاويات الخطرة لا يوجد لها فترة سماح
        FIXED_SERVICE_FEE: 25,
        CURRENCY: 'USD',
        TIERS: [
          { name: 'شريحة موحدة', minDay: 1, maxDay: Infinity, rate: 12 }
        ]
      },
      // Non-Standard Containers (غير منتظم)
      NON_STANDARD: {
        OOG: {
          name: 'غير منتظم',
          GRACE_PERIOD_DAYS: 5,
          FIXED_SERVICE_FEE: 25,
          RATE_MULTIPLIER: 2 // السعر * 2
        },
        FLAT_RACK: {
          name: 'هيكل',
          GRACE_PERIOD_DAYS: 5,
          FIXED_SERVICE_FEE: 25,
          RATE_MULTIPLIER: 3 // السعر * 3
        },
        LASHING: {
          name: 'تصبين',
          GRACE_PERIOD_DAYS: 5,
          FIXED_SERVICE_FEE: 25,
          RATE_MULTIPLIER: 4 // السعر * 4
        }
      },
      EMPTY: {
        // Placeholder for future empty container rates
        GRACE_PERIOD_DAYS: 0,
        TIERS: []
      }
    },
    // 40ft Container (حاوية 40 قدم)
    FORTY_FT: {
      CARGO_SERVICE_FEE: 120, // تفريغ أو شحن المشمول
      FULL: {
        GRACE_PERIOD_DAYS: 5,
        FIXED_SERVICE_FEE: 25,
        CURRENCY: 'USD',
        TIERS: [
          {
            name: 'Tier 1',
            minDay: 6,
            maxDay: 20,
            rate: 14 // 14 دولار لكل يوم
          },
          {
            name: 'Tier 2',
            minDay: 21,
            maxDay: Infinity,
            rate: 21 // 21 دولار لكل يوم لما زاد عن 20 يوم
          }
        ]
      },
      REEFER: {
        GRACE_PERIOD_DAYS: 0,
        FIXED_SERVICE_FEE: 25,
        CURRENCY: 'USD',
        TIERS: [
          { name: 'الشريحة 1', minDay: 1, maxDay: 7, rate: 33 },
          { name: 'الشريحة 2', minDay: 8, maxDay: 10, rate: 49.5 },
          { name: 'الشريحة 3', minDay: 11, maxDay: Infinity, rate: 66 }
        ]
      },
      DANGEROUS: {
        GRACE_PERIOD_DAYS: 0,
        FIXED_SERVICE_FEE: 25,
        CURRENCY: 'USD',
        TIERS: [
          { name: 'شريحة موحدة', minDay: 1, maxDay: Infinity, rate: 21 }
        ]
      },
      // Non-Standard Containers (غير منتظم)
      NON_STANDARD: {
        OOG: {
          name: 'غير منتظم',
          GRACE_PERIOD_DAYS: 5,
          FIXED_SERVICE_FEE: 25,
          RATE_MULTIPLIER: 2 // السعر * 2
        },
        FLAT_RACK: {
          name: 'هيكل',
          GRACE_PERIOD_DAYS: 5,
          FIXED_SERVICE_FEE: 25,
          RATE_MULTIPLIER: 3 // السعر * 3
        },
        LASHING: {
          name: 'تصبين',
          GRACE_PERIOD_DAYS: 5,
          FIXED_SERVICE_FEE: 25,
          RATE_MULTIPLIER: 4 // السعر * 4
        }
      }
    }
  },
  
  // Export Containers (الصادر) - Placeholder for expansion
  EXPORT: {
    TWENTY_FT: {
      FULL: {
        GRACE_PERIOD_DAYS: 7,
        TIERS: []
      }
    }
  }
};

export const SERVICES_LIST = [
  { id: "crane3", name: "ونش 3 طن", rate: 13 },
  { id: "crane5", name: "ونش 5 طن", rate: 15 },
  { id: "clark",  name: "كلارك",    rate: 10 },
  { id: "yard",   name: "نقل بين الساحات", rate: 88 },
];
