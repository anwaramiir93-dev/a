/**
 * ============================================
 *  نظام إدارة الطلاب - مدير التخزين المركزي
 *  Student Management System - Storage Manager
 * ============================================
 * 
 *  يوفر هذا الملف طبقة تجريد مركزية للتعامل مع localStorage
 *  ويتضمن جميع المفاتيح المستخدمة في النظام.
 */

/**
 * StorageManager - مدير التخزين المركزي
 * يوفر واجهة موحدة للقراءة والكتابة في localStorage
 * مع معالجة الأخطاء والقيم الافتراضية
 */
const StorageManager = {

  /**
   * مفاتيح التخزين المستخدمة في النظام
   * يتم استخدام البادئة 'sm_' لتمييز بيانات النظام
   */
  KEYS: {
    STUDENTS:       'sm_students',
    GROUPS:         'sm_groups',
    ATTENDANCE:     'sm_attendance',
    GRADES:         'sm_grades',
    HOMEWORK:       'sm_homework',
    PAYMENTS:       'sm_payments',
    SETTINGS:       'sm_settings',
    NOTIFICATIONS:  'sm_notifications',
    ACTIVITIES:     'sm_activities',
    INITIALIZED:    'sm_initialized',
  },

  /**
   * القيم الافتراضية لكل مفتاح
   * تُستخدم عند عدم وجود بيانات في التخزين
   */
  DEFAULTS: {
    sm_students:       [],
    sm_groups:         [],
    sm_attendance:     [],
    sm_grades:         [],
    sm_homework:       [],
    sm_payments:       [],
    sm_settings:       {},
    sm_notifications:  [],
    sm_activities:     [],
    sm_initialized:    false,
  },

  /**
   * استرجاع بيانات من التخزين المحلي
   * @param {string} key - مفتاح التخزين
   * @returns {*} البيانات المخزنة أو القيمة الافتراضية
   */
  get(key) {
    try {
      const raw = localStorage.getItem(key);

      // إذا لم يوجد المفتاح، نرجع القيمة الافتراضية
      if (raw === null || raw === undefined) {
        return this.DEFAULTS[key] !== undefined ? this.DEFAULTS[key] : null;
      }

      // محاولة تحويل النص إلى كائن JSON
      const parsed = JSON.parse(raw);
      return parsed;

    } catch (error) {
      console.error(`[StorageManager] خطأ في قراءة المفتاح "${key}":`, error);
      // في حالة خطأ التحليل، نرجع القيمة الافتراضية
      return this.DEFAULTS[key] !== undefined ? this.DEFAULTS[key] : null;
    }
  },

  /**
   * حفظ بيانات في التخزين المحلي
   * @param {string} key - مفتاح التخزين
   * @param {*} data - البيانات المراد حفظها
   * @returns {boolean} نجاح العملية
   */
  set(key, data) {
    try {
      const serialized = JSON.stringify(data);
      localStorage.setItem(key, serialized);
      return true;
    } catch (error) {
      console.error(`[StorageManager] خطأ في كتابة المفتاح "${key}":`, error);

      // التحقق من أن الخطأ ليس بسبب امتلاء التخزين
      if (error.name === 'QuotaExceededError') {
        console.warn('[StorageManager] التخزين المحلي ممتلئ! حاول حذف بعض البيانات.');
      }

      return false;
    }
  },

  /**
   * حذف مفتاح من التخزين المحلي
   * @param {string} key - مفتاح التخزين المراد حذفه
   * @returns {boolean} نجاح العملية
   */
  remove(key) {
    try {
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      console.error(`[StorageManager] خطأ في حذف المفتاح "${key}":`, error);
      return false;
    }
  },

  /**
   * مسح جميع بيانات النظام من التخزين المحلي
   * يحذف فقط المفاتيح التي تبدأ بـ 'sm_'
   */
  clear() {
    try {
      const keysToRemove = [];

      // البحث عن جميع مفاتيح النظام
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('sm_')) {
          keysToRemove.push(key);
        }
      }

      // حذف جميع المفاتيح التي تم العثور عليها
      keysToRemove.forEach(key => {
        localStorage.removeItem(key);
      });

      console.log(`[StorageManager] تم مسح ${keysToRemove.length} مفتاح من التخزين`);
      return true;

    } catch (error) {
      console.error('[StorageManager] خطأ في مسح التخزين:', error);
      return false;
    }
  },

  /**
   * تصدير جميع بيانات النظام
   * @returns {Object} كائن يحتوي جميع البيانات
   */
  exportAll() {
    try {
      const allData = {};

      // استرجاع البيانات لكل مفتاح معروف
      Object.values(this.KEYS).forEach(key => {
        allData[key] = this.get(key);
      });

      return allData;

    } catch (error) {
      console.error('[StorageManager] خطأ في تصدير البيانات:', error);
      return {};
    }
  },

  /**
   * استيراد جميع بيانات النظام
   * يستبدل جميع البيانات الحالية بالبيانات المستوردة
   * 
   * @param {Object} data - كائن يحتوي البيانات المراد استيرادها
   * @param {Function} [onConfirm] - دالة استدعاء للتأكيد قبل الاستيراد
   *   تستقبل (data) وتُرجع Promise<boolean> أو boolean
   *   إذا رجعت false، لا يتم الاستيراد
   * @returns {Promise<boolean>} نجاح عملية الاستيراد
   */
  async importAll(data, onConfirm) {
    try {
      // التحقق من صحة البيانات
      if (!data || typeof data !== 'object') {
        console.error('[StorageManager] بيانات غير صالحة للاستيراد');
        return false;
      }

      // طلب التأكيد إذا تم توفير دالة التأكيد
      if (typeof onConfirm === 'function') {
        const confirmed = await onConfirm(data);
        if (!confirmed) {
          console.log('[StorageManager] تم إلغاء الاستيراد بواسطة المستخدم');
          return false;
        }
      }

      // استيراد كل مفتاح من البيانات المقدمة
      let importedCount = 0;

      Object.entries(data).forEach(([key, value]) => {
        if (key.startsWith('sm_')) {
          this.set(key, value);
          importedCount++;
        }
      });

      console.log(`[StorageManager] تم استيراد ${importedCount} مفتاح بنجاح`);
      return true;

    } catch (error) {
      console.error('[StorageManager] خطأ في استيراد البيانات:', error);
      return false;
    }
  },

  /**
   * التحقق مما إذا كان النظام قد تم تهيئته مسبقاً
   * @returns {boolean} هل النظام مُهيأ
   */
  isInitialized() {
    try {
      const initialized = localStorage.getItem(this.KEYS.INITIALIZED);
      return initialized === 'true';
    } catch (error) {
      console.error('[StorageManager] خطأ في التحقق من التهيئة:', error);
      return false;
    }
  },

  /**
   * تعليم النظام كمُهيأ
   * يحفظ القيمة true في مفتاح التهيئة
   */
  markInitialized() {
    this.set(this.KEYS.INITIALIZED, true);
    console.log('[StorageManager] تم تعليم النظام كمُهيأ');
  },

  /**
   * إعادة تعيين النظام بالكامل
   * يمسح جميع البيانات ويعيد تهيئة التخزين
   */
  reset() {
    this.clear();
    console.log('[StorageManager] تم إعادة تعيين النظام');
  },

  /**
   * الحصول على حجم التخزين المستخدم (بالبايت)
   * @returns {number} حجم البيانات المخزنة
   */
  getStorageSize() {
    try {
      let total = 0;
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('sm_')) {
          const value = localStorage.getItem(key);
          total += (key.length + value.length) * 2; // UTF-16: كل حرف = 2 بايت
        }
      }
      return total;
    } catch (error) {
      console.error('[StorageManager] خطأ في حساب حجم التخزين:', error);
      return 0;
    }
  },

  /**
   * الحصول على حجم التخزين المستخدم بشكل مقروء
   * @returns {string} الحجم بالنص (KB أو MB)
   */
  getStorageSizeFormatted() {
    const bytes = this.getStorageSize();
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  },
};

// تصدير الكائن للاستخدام العام
window.StorageManager = StorageManager;
