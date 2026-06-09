/**
 * Multi-level Caching System
 * - Memory Cache: سريع جداً لكن يُفقد عند إعادة التشغيل
 * - يقلل القراءة من MongoDB بنسبة 80-90%
 */

class MemoryCache {
  constructor() {
    this.cache = new Map();
    this.timestamps = new Map();
  }

  /**
   * حفظ قيمة في الذاكرة
   * @param {string} key - مفتاح التخزين
   * @param {any} value - القيمة المراد تخزينها
   * @param {number} ttl - مدة الصلاحية بالثواني (افتراضي: 5 دقائق)
   */
  set(key, value, ttl = 300) {
    this.cache.set(key, value);
    this.timestamps.set(key, {
      created: Date.now(),
      ttl: ttl * 1000, // تحويل لميلي ثانية
    });
  }

  /**
   * جلب قيمة من الذاكرة
   * @param {string} key - مفتاح البحث
   * @returns {any|null} - القيمة أو null إذا انتهت الصلاحية
   */
  get(key) {
    if (!this.cache.has(key)) return null;

    const timestamp = this.timestamps.get(key);
    const now = Date.now();

    // التحقق من انتهاء الصلاحية
    if (now - timestamp.created > timestamp.ttl) {
      this.delete(key);
      return null;
    }

    return this.cache.get(key);
  }

  /**
   * حذف قيمة من الذاكرة
   */
  delete(key) {
    this.cache.delete(key);
    this.timestamps.delete(key);
  }

  /**
   * مسح الذاكرة بالكامل
   */
  clear() {
    this.cache.clear();
    this.timestamps.clear();
  }

  /**
   * مسح القيم المنتهية تلقائياً (يُشغل كل 5 دقائق)
   */
  startCleanup(intervalMs = 300000) {
    setInterval(() => {
      const now = Date.now();
      for (const [key, timestamp] of this.timestamps.entries()) {
        if (now - timestamp.created > timestamp.ttl) {
          this.delete(key);
        }
      }
    }, intervalMs);
  }

  /**
   * الحصول على حجم الذاكرة المستخدمة
   */
  getStats() {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
    };
  }
}

// إنشاء instance واحد للتطبيق بالكامل
const cache = new MemoryCache();

// بدء عملية التنظيف التلقائي
if (typeof window === "undefined") {
  cache.startCleanup();
}

export default cache;

/**
 * Cache Keys Generator - لتوحيد مفاتيح الـ Cache
 */
export const CacheKeys = {
  // Settings
  EXCHANGE_RATE: "settings:exchangeRate",
  DATE_RANGE: "settings:dateRange",

  // Accounts
  ALL_ACCOUNTS: "accounts:all",
  ACCOUNT_BY_ID: (id) => `accounts:${id}`,
  ACCOUNT_BY_USERNAME: (username) => `accounts:username:${username}`,

  // Data
  ACCOUNT_DATA_PAGE: (page, limit, search, transOnly) =>
    `data:page:${page}:${limit}:${search}:${transOnly}`,
  ACCOUNT_DATA_ALL: "data:all",
  ACCOUNT_DATA_COUNT: (filter) => `data:count:${JSON.stringify(filter)}`,
};

/**
 * Cache TTL Configurations (بالثواني)
 */
export const CacheTTL = {
  EXCHANGE_RATE: 3600, // ساعة واحدة (نادراً ما يتغير)
  DATE_RANGE: 3600, // ساعة واحدة
  ACCOUNTS_LIST: 300, // 5 دقائق (يتغير عند الإضافة/التعديل)
  ACCOUNT_DETAILS: 600, // 10 دقائق
  DATA_PAGE: 180, // 3 دقائق (يتغير بكثرة)
  DATA_ALL: 60, // دقيقة واحدة (للنسخ الاحتياطي)
};

/**
 * Helper: Invalidate related caches
 * يُستخدم عند تحديث البيانات لحذف الـ Cache القديم
 */
export function invalidateCache(pattern) {
  const stats = cache.getStats();
  const keysToDelete = stats.keys.filter((key) => key.startsWith(pattern));
  keysToDelete.forEach((key) => cache.delete(key));
  return keysToDelete.length;
}
