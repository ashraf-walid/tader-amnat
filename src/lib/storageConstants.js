/**
 * Constants for Container Storage Calculation
 * This module is designed to be extensible for different container types and shipping directions.
 */

export const STORAGE_CONFIG = {
  // Global Settings
  GLOBAL: {
    VAT_RATE: 0.14, // 14% Value Added Tax
    DEFAULT_EXCHANGE_RATE: Number(process.env.NEXT_PUBLIC_DEFAULT_EXCHANGE_RATE),
    MARTYR_STAMP_FEE: 5, // Martyr Stamp Fee (5 EGP fixed on the invoice)
    BASE_CURRENCY: 'EGP',
    STORAGE_CURRENCY: 'USD'
  },

  // Billing Types
  BILLING_TYPES: {
    INITIAL: 'INITIAL', // First invoice (includes grace period)
    RENEWAL: 'RENEWAL'  // Renewal invoice (does not include grace period in case of renewal after arrival time by five days)
  },

  // Additional Services
  SERVICES: {
    SHIFTING: {
      YARD_TO_YARD: { 
        name: 'نقل بين الساحات', 
        rate20: 44, 
        rate40: 88, 
        unit: 'per_container' 
      }
    },
    DANGER_YARD: {
      // Storage in the danger yard — calculated in tiers per container
      GRACE_PERIOD_DAYS: 0,
      TIERS: [
        { name: 'الشريحة 1 (خطر)', minDay: 1, maxDay: 3,        rate: 33 },
        { name: 'الشريحة 2 (خطر)', minDay: 4, maxDay: Infinity,  rate: 66 }
      ]
    }
  },

  // Import Containers
  IMPORT: {
    // 20ft Container
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
            rate: 8
          },
          {
            name: 'Tier 2',
            minDay: 21,
            maxDay: Infinity,
            rate: 12
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
          { name: 'شريحة 1', minDay: 1, maxDay: 20, rate: 12 },
          { name: 'شريحة 2', minDay: 21, maxDay: Infinity, rate: 18 }
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
          { name: 'شريحة 1', minDay: 1, maxDay: 20, rate: 21 },
          { name: 'شريحة 2', minDay: 21, maxDay: Infinity, rate: 31.5 }
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
  { id: "crane25",  name: "ونش 25 طن",    rate: 85 },
  { id: "yard",   name: "نقل بين الساحات", rate: 0, isVariable: true },
];
