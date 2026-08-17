/**
 * ============================================
 *  نظام إدارة الطلاب - البيانات التجريبية والأدوات
 *  Student Management System - Demo Data & Utilities
 * ============================================
 * 
 *  يحتوي على البيانات التجريبية الأولية وأدوات مساعدة
 *  للتعامل مع البيانات وتنسيقها.
 */

/**
 * DemoData - البيانات التجريبية وأدوات البيانات
 * يوفر بيانات تجريبية أولية وأدوات مساعدة للنظام
 */
const DemoData = {

  // ==========================================
  //  أدوات مساعدة - Utility Functions
  // ==========================================

  /**
   * توليد معرف فريد
   * يستخدم الوقت الحالي مع رقم عشوائي لضمان التفرد
   * @returns {string} معرف فريد
   */
  generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substring(2, 9);
  },

  /**
   * الحصول على تاريخ اليوم بصيغة YYYY-MM-DD
   * @returns {string} تاريخ اليوم
   */
  getTodayDate() {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  },

  /**
   * الحصول على تاريخ بالأمس بصيغة YYYY-MM-DD
   * @returns {string} تاريخ الأمس
   */
  getYesterdayDate() {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const year = yesterday.getFullYear();
    const month = String(yesterday.getMonth() + 1).padStart(2, '0');
    const day = String(yesterday.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  },

  /**
   * تنسيق التاريخ للعرض بصيغة DD/MM/YYYY
   * @param {string} dateStr - التاريخ بصيغة YYYY-MM-DD
   * @returns {string} التاريخ المنسق
   */
  formatDate(dateStr) {
    if (!dateStr) return '';
    try {
      const parts = dateStr.split('-');
      if (parts.length !== 3) return dateStr;
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    } catch (e) {
      return dateStr;
    }
  },

  /**
   * تنسيق التاريخ بالعربية
   * @param {string} dateStr - التاريخ بصيغة YYYY-MM-DD
   * @returns {string} التاريخ بالصيغة العربية
   */
  getArabicDate(dateStr) {
    if (!dateStr) return '';
    try {
      const months = [
        'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
        'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
      ];
      const parts = dateStr.split('-');
      if (parts.length !== 3) return dateStr;
      const year = parts[0];
      const month = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      return `${day} ${months[month]} ${year}`;
    } catch (e) {
      return dateStr;
    }
  },

  /**
   * الحصول على التاريخ والوقت الحالي
   * @returns {string} التاريخ والوقت بصيغة ISO
   */
  getNow() {
    return new Date().toISOString();
  },

  /**
   * حساب النسبة المئوية
   * @param {number} score - الدرجة المحصلة
   * @param {number} total - الدرجة الكلية
   * @returns {number} النسبة المئوية (مُقربة لعدد صحيح)
   */
  calculatePercentage(score, total) {
    if (!total || total === 0) return 0;
    return Math.round((score / total) * 100);
  },

  /**
   * حساب التقدير بناءً على النسبة المئوية
   * @param {number} score - الدرجة المحصلة
   * @param {number} total - الدرجة الكلية
   * @returns {string} التقدير بالعربية
   */
  calculateRating(score, total) {
    const percentage = this.calculatePercentage(score, total);

    if (percentage >= 90) return 'ممتاز';
    if (percentage >= 80) return 'جيد جداً';
    if (percentage >= 70) return 'جيد';
    if (percentage >= 60) return 'مقبول';
    return 'ضعيف';
  },

  /**
   * توليد رسالة نشاط بالعربية
   * @param {string} type - نوع النشاط (student|attendance|grade|payment|group)
   * @param {string} detail - تفاصيل النشاط
   * @returns {string} رسالة النشاط
   */
  generateActivityMessage(type, detail) {
    const messages = {
      student:    `تم إضافة طالب جديد: ${detail}`,
      attendance:  `تم تسجيل حضور: ${detail}`,
      grade:      `تم تسجيل درجات: ${detail}`,
      payment:    `تم تسجيل دفعة: ${detail}`,
      group:      `تم إنشاء مجموعة: ${detail}`,
    };
    return messages[type] || detail;
  },

  // ==========================================
  //  تهيئة البيانات التجريبية
  // ==========================================

  /**
   * تهيئة البيانات التجريبية للنظام
   * تُستدعى فقط عند أول تشغيل للنظام (إذا لم يكن مُهيأ)
   */
  initDemoData() {
    // التحقق مما إذا كان النظام مُهيأ مسبقاً
    if (StorageManager.isInitialized()) {
      console.log('[DemoData] النظام مُهيأ مسبقاً، لن يتم إضافة بيانات تجريبية.');
      return;
    }

    console.log('[DemoData] بدء تهيئة البيانات التجريبية...');

    const today = this.getTodayDate();
    const yesterday = this.getYesterdayDate();
    const now = this.getNow();

    // ------------------------------------------
    //  1. المجموعات
    // ------------------------------------------
    const group1Id = this.generateId();
    const group2Id = this.generateId();

    const groups = [
      {
        id: group1Id,
        name: 'المجموعة أ',
        teacher: 'أحمد محمد',
        days: ['السبت', 'الثلاثاء'],
        time: '16:00',
        description: 'مجموعة المرحلة المتوسطة',
        createdAt: today,
      },
      {
        id: group2Id,
        name: 'المجموعة ب',
        teacher: 'سارة أحمد',
        days: ['الأحد', 'الأربعاء'],
        time: '18:00',
        description: 'مجموعة المرحلة الابتدائية',
        createdAt: today,
      },
    ];

    // ------------------------------------------
    //  2. الطلاب
    // ------------------------------------------
    const student1Id = this.generateId();
    const student2Id = this.generateId();
    const student3Id = this.generateId();
    const student4Id = this.generateId();
    const student5Id = this.generateId();

    const students = [
      {
        id: student1Id,
        name: 'محمد أحمد علي',
        phone: '0512345678',
        age: 12,
        gender: 'ذكر',
        groupId: group1Id,
        status: 'نشط',
        notes: '',
        registeredAt: today,
      },
      {
        id: student2Id,
        name: 'فاطمة سعيد محمد',
        phone: '0523456789',
        age: 10,
        gender: 'أنثى',
        groupId: group1Id,
        status: 'نشط',
        notes: 'طالبة متفوقة',
        registeredAt: today,
      },
      {
        id: student3Id,
        name: 'عبدالله خالد',
        phone: '0534567890',
        age: 14,
        gender: 'ذكر',
        groupId: group2Id,
        status: 'نشط',
        notes: '',
        registeredAt: today,
      },
      {
        id: student4Id,
        name: 'نورة عبدالرحمن',
        phone: '0545678901',
        age: 11,
        gender: 'أنثى',
        groupId: group2Id,
        status: 'نشط',
        notes: '',
        registeredAt: today,
      },
      {
        id: student5Id,
        name: 'عمر حسن',
        phone: '0556789012',
        age: 13,
        gender: 'ذكر',
        groupId: group1Id,
        status: 'متوقف',
        notes: 'توقف بسبب النقل',
        registeredAt: today,
      },
    ];

    // ------------------------------------------
    //  3. سجل الحضور
    // ------------------------------------------
    const attendance = [
      // حضور اليوم
      {
        id: this.generateId(),
        studentId: student1Id,
        studentName: 'محمد أحمد علي',
        groupId: group1Id,
        date: today,
        status: 'حاضر',
        timeIn: '15:55',
        timeOut: '17:05',
        notes: '',
      },
      {
        id: this.generateId(),
        studentId: student2Id,
        studentName: 'فاطمة سعيد محمد',
        groupId: group1Id,
        date: today,
        status: 'حاضر',
        timeIn: '16:00',
        timeOut: '17:00',
        notes: '',
      },
      {
        id: this.generateId(),
        studentId: student3Id,
        studentName: 'عبدالله خالد',
        groupId: group2Id,
        date: today,
        status: 'غائب',
        timeIn: '',
        timeOut: '',
        notes: '',
      },
      {
        id: this.generateId(),
        studentId: student4Id,
        studentName: 'نورة عبدالرحمن',
        groupId: group2Id,
        date: today,
        status: 'متأخر',
        timeIn: '18:20',
        timeOut: '19:00',
        notes: '',
      },
      {
        id: this.generateId(),
        studentId: student5Id,
        studentName: 'عمر حسن',
        groupId: group1Id,
        date: today,
        status: 'إجازة',
        timeIn: '',
        timeOut: '',
        notes: '',
      },

      // حضور الأمس
      {
        id: this.generateId(),
        studentId: student1Id,
        studentName: 'محمد أحمد علي',
        groupId: group1Id,
        date: yesterday,
        status: 'حاضر',
        timeIn: '15:58',
        timeOut: '17:00',
        notes: '',
      },
      {
        id: this.generateId(),
        studentId: student2Id,
        studentName: 'فاطمة سعيد محمد',
        groupId: group1Id,
        date: yesterday,
        status: 'متأخر',
        timeIn: '16:15',
        timeOut: '17:05',
        notes: 'تأخرت بسبب ظروف عائلية',
      },
      {
        id: this.generateId(),
        studentId: student3Id,
        studentName: 'عبدالله خالد',
        groupId: group2Id,
        date: yesterday,
        status: 'حاضر',
        timeIn: '17:55',
        timeOut: '19:00',
        notes: '',
      },
      {
        id: this.generateId(),
        studentId: student4Id,
        studentName: 'نورة عبدالرحمن',
        groupId: group2Id,
        date: yesterday,
        status: 'حاضر',
        timeIn: '18:00',
        timeOut: '19:00',
        notes: '',
      },
      {
        id: this.generateId(),
        studentId: student5Id,
        studentName: 'عمر حسن',
        groupId: group1Id,
        date: yesterday,
        status: 'غائب',
        timeIn: '',
        timeOut: '',
        notes: '',
      },
    ];

    // ------------------------------------------
    //  4. الدرجات
    // ------------------------------------------
    const gradesRaw = [
      { studentId: student1Id, studentName: 'محمد أحمد علي', groupId: group1Id, subject: 'الرياضيات', score: 92, total: 100 },
      { studentId: student2Id, studentName: 'فاطمة سعيد محمد', groupId: group1Id, subject: 'العلوم', score: 88, total: 100 },
      { studentId: student3Id, studentName: 'عبدالله خالد', groupId: group2Id, subject: 'اللغة العربية', score: 75, total: 100 },
      { studentId: student4Id, studentName: 'نورة عبدالرحمن', groupId: group2Id, subject: 'الرياضيات', score: 58, total: 100 },
      { studentId: student1Id, studentName: 'محمد أحمد علي', groupId: group1Id, subject: 'العلوم', score: 85, total: 100 },
    ];

    const grades = gradesRaw.map(item => ({
      id: this.generateId(),
      ...item,
      percentage: this.calculatePercentage(item.score, item.total),
      rating: this.calculateRating(item.score, item.total),
      examName: 'اختبار شهري',
      date: today,
      notes: '',
    }));

    // ------------------------------------------
    //  5. الواجبات
    // ------------------------------------------
    const homework = [
      {
        id: this.generateId(),
        title: 'حل تمارين الرياضيات',
        description: 'حل التمارين من صفحة 20 إلى 25',
        groupId: group1Id,
        createdAt: yesterday,
        dueDate: today,
        status: 'نشط',
        submissions: [
          { studentId: student1Id, studentName: 'محمد أحمد علي', status: 'تم التسليم' },
          { studentId: student2Id, studentName: 'فاطمة سعيد محمد', status: 'تم التسليم' },
          { studentId: student5Id, studentName: 'عمر حسن', status: 'لم يتم التسليم' },
        ],
      },
      {
        id: this.generateId(),
        title: 'تقرير العلوم',
        description: 'كتابة تقرير عن دورة حياة النبات',
        groupId: group2Id,
        createdAt: yesterday,
        dueDate: today,
        status: 'نشط',
        submissions: [
          { studentId: student3Id, studentName: 'عبدالله خالد', status: 'متأخر' },
          { studentId: student4Id, studentName: 'نورة عبدالرحمن', status: 'تم التسليم' },
        ],
      },
      {
        id: this.generateId(),
        title: 'قصيدة اللغة العربية',
        description: 'حفظ قصيدة "الأمل" وكتابة شرحها',
        groupId: group1Id,
        createdAt: today,
        dueDate: '2025-02-15',
        status: 'نشط',
        submissions: [
          { studentId: student1Id, studentName: 'محمد أحمد علي', status: 'لم يتم التسليم' },
          { studentId: student2Id, studentName: 'فاطمة سعيد محمد', status: 'لم يتم التسليم' },
          { studentId: student5Id, studentName: 'عمر حسن', status: 'لم يتم التسليم' },
        ],
      },
    ];

    // ------------------------------------------
    //  6. المدفوعات
    // ------------------------------------------
    const payments = [
      {
        id: this.generateId(),
        studentId: student1Id,
        studentName: 'محمد أحمد علي',
        amount: 200,
        month: 'يناير 2025',
        date: today,
        paymentType: 'نقدي',
        status: 'مدفوع',
        notes: '',
      },
      {
        id: this.generateId(),
        studentId: student2Id,
        studentName: 'فاطمة سعيد محمد',
        amount: 200,
        month: 'يناير 2025',
        date: today,
        paymentType: 'تحويل',
        status: 'مدفوع',
        notes: '',
      },
      {
        id: this.generateId(),
        studentId: student3Id,
        studentName: 'عبدالله خالد',
        amount: 200,
        month: 'فبراير 2025',
        date: today,
        paymentType: 'نقدي',
        status: 'غير مدفوع',
        notes: 'لم يسدد بعد',
      },
      {
        id: this.generateId(),
        studentId: student4Id,
        studentName: 'نورة عبدالرحمن',
        amount: 200,
        month: 'يناير 2025',
        date: today,
        paymentType: 'تحويل',
        status: 'مدفوع',
        notes: '',
      },
      {
        id: this.generateId(),
        studentId: student5Id,
        studentName: 'عمر حسن',
        amount: 200,
        month: 'فبراير 2025',
        date: today,
        paymentType: 'نقدي',
        status: 'مدفوع جزئياً',
        notes: 'سدد 100 ريال من أصل 200',
      },
    ];

    // ------------------------------------------
    //  7. الإشعارات
    // ------------------------------------------
    const notifications = [
      {
        id: this.generateId(),
        message: 'طالب غائب اليوم: عبدالله خالد',
        type: 'warning',
        read: false,
        createdAt: now,
      },
      {
        id: this.generateId(),
        message: 'تم تسجيل حضور 3 طلاب في المجموعة أ',
        type: 'info',
        read: false,
        createdAt: now,
      },
      {
        id: this.generateId(),
        message: 'تنبيه: لديك 3 مدفوعات غير مكتملة هذا الشهر',
        type: 'danger',
        read: false,
        createdAt: now,
      },
    ];

    // ------------------------------------------
    //  8. سجل النشاطات
    // ------------------------------------------
    const activities = [
      {
        id: this.generateId(),
        message: 'تم إضافة طالب جديد: محمد أحمد علي',
        type: 'student',
        timestamp: now,
      },
      {
        id: this.generateId(),
        message: 'تم تسجيل حضور 5 طلاب',
        type: 'attendance',
        timestamp: now,
      },
      {
        id: this.generateId(),
        message: 'تم تسجيل درجات اختبار شهري - الرياضيات',
        type: 'grade',
        timestamp: now,
      },
      {
        id: this.generateId(),
        message: 'تم تسجيل دفعة: محمد أحمد علي - 200 ريال',
        type: 'payment',
        timestamp: now,
      },
      {
        id: this.generateId(),
        message: 'تم إنشاء مجموعة: المجموعة أ',
        type: 'group',
        timestamp: now,
      },
    ];

    // ------------------------------------------
    //  9. الإعدادات
    // ------------------------------------------
    const settings = {
      appName: 'إدارة الطلاب',
      teacherName: 'المعلم',
      darkMode: false,
      fontSize: 16,
      notificationsEnabled: true,
    };

    // ==========================================
    //  حفظ جميع البيانات في التخزين
    // ==========================================
    StorageManager.set(StorageManager.KEYS.GROUPS, groups);
    StorageManager.set(StorageManager.KEYS.STUDENTS, students);
    StorageManager.set(StorageManager.KEYS.ATTENDANCE, attendance);
    StorageManager.set(StorageManager.KEYS.GRADES, grades);
    StorageManager.set(StorageManager.KEYS.HOMEWORK, homework);
    StorageManager.set(StorageManager.KEYS.PAYMENTS, payments);
    StorageManager.set(StorageManager.KEYS.NOTIFICATIONS, notifications);
    StorageManager.set(StorageManager.KEYS.ACTIVITIES, activities);
    StorageManager.set(StorageManager.KEYS.SETTINGS, settings);

    // تعليم النظام كمُهيأ
    StorageManager.markInitialized();

    console.log('[DemoData] تم تهيئة البيانات التجريبية بنجاح!');
    console.log(`  - المجموعات: ${groups.length}`);
    console.log(`  - الطلاب: ${students.length}`);
    console.log(`  - سجل الحضور: ${attendance.length}`);
    console.log(`  - الدرجات: ${grades.length}`);
    console.log(`  - الواجبات: ${homework.length}`);
    console.log(`  - المدفوعات: ${payments.length}`);
    console.log(`  - الإشعارات: ${notifications.length}`);
    console.log(`  - النشاطات: ${activities.length}`);
  },
};

// تصدير الكائن للاستخدام العام
window.DemoData = DemoData;
