/* Guardian phone + one-click WhatsApp report enhancement. */
(function () {
  'use strict';

  const FIELD_ID = 'student-guardian-phone';
  const REPORT_BTN = 'send-whatsapp-student-report';

  function normalizePhone(phone) {
    if (!phone) return '';
    let value = String(phone).trim().replace(/[^\d+]/g, '');
    if (value.startsWith('00')) value = '+' + value.slice(2);
    if (/^01\d{9}$/.test(value)) value = '+20' + value.slice(1);
    if (value.startsWith('+')) value = value.slice(1);
    return value.replace(/\D/g, '');
  }

  function getStudents() {
    return (typeof StorageManager !== 'undefined' && StorageManager.get('sm_students')) || [];
  }

  function getStudent(id) {
    return getStudents().find(s => String(s.id) === String(id));
  }

  function ensureField() {
    const form = document.getElementById('form-student');
    const phone = document.getElementById('student-phone');
    if (!form || !phone || document.getElementById(FIELD_ID)) return;

    const wrapper = document.createElement('div');
    wrapper.className = 'form-group guardian-phone-group';
    wrapper.innerHTML = `
      <label for="${FIELD_ID}" class="form-label">رقم ولي الأمر <span class="guardian-label-accent">(لإرسال التقارير)</span></label>
      <input id="${FIELD_ID}" class="form-input" type="tel" inputmode="tel" autocomplete="tel" dir="ltr" placeholder="01xxxxxxxxx">
      <small class="form-help">سيُستخدم هذا الرقم لإرسال تقرير الطالب عبر واتساب بضغطة واحدة.</small>
    `;

    const phoneGroup = phone.closest('.form-group') || phone.parentElement;
    if (phoneGroup?.parentNode) phoneGroup.parentNode.insertBefore(wrapper, phoneGroup.nextSibling);
    else form.appendChild(wrapper);
  }

  function setGuardianValue(student) {
    const input = document.getElementById(FIELD_ID);
    if (input) input.value = student ? (student.guardianPhone || student.parentPhone || '') : '';
  }

  function saveGuardianPhone(studentId) {
    const input = document.getElementById(FIELD_ID);
    if (!input || !studentId || typeof StorageManager === 'undefined') return;
    const students = getStudents();
    const index = students.findIndex(s => String(s.id) === String(studentId));
    if (index === -1) return;
    const value = input.value.trim();
    students[index].guardianPhone = value;
    if ('parentPhone' in students[index]) delete students[index].parentPhone;
    StorageManager.set('sm_students', students);
  }

  function getReport(studentId) {
    const students = getStudents();
    const groups = (StorageManager.get('sm_groups') || []);
    const attendance = (StorageManager.get('sm_attendance') || []).filter(a => String(a.studentId) === String(studentId));
    const grades = (StorageManager.get('sm_grades') || []).filter(g => String(g.studentId) === String(studentId));
    const payments = (StorageManager.get('sm_payments') || []).filter(p => String(p.studentId) === String(studentId));
    const student = students.find(s => String(s.id) === String(studentId));
    if (!student) return null;

    const group = groups.find(g => String(g.id) === String(student.groupId));
    const present = attendance.filter(a => a.status === 'حاضر' || a.status === 'متأخر').length;
    const absent = attendance.filter(a => a.status === 'غائب').length;
    const rate = attendance.length ? Math.round((present / attendance.length) * 100) : 0;
    const percentages = grades.map(g => g.percentage != null ? Number(g.percentage) : (Number(g.total || 100) ? Number(g.score || 0) / Number(g.total || 100) * 100 : 0));
    const average = percentages.length ? Math.round(percentages.reduce((a, b) => a + b, 0) / percentages.length) : 0;
    const paid = payments.filter(p => p.status === 'مدفوع').reduce((s, p) => s + Number(p.amount || 0), 0);
    const partial = payments.filter(p => p.status === 'مدفوع جزئياً').reduce((s, p) => s + Number(p.amount || 0), 0);
    const outstanding = payments.filter(p => p.status === 'غير مدفوع').reduce((s, p) => s + Number(p.amount || 0), 0);
    return { student, group, attendance, grades, present, absent, rate, average, paid, partial, outstanding };
  }

  function buildMessage(data) {
    const s = data.student;
    const date = typeof DemoData !== 'undefined' && DemoData.getArabicDate ? DemoData.getArabicDate(DemoData.getTodayDate()) : new Date().toLocaleDateString('ar-EG');
    return [
      '📚 *معلمي | تقرير متابعة الطالب*','',
      `👤 *الطالب:* ${s.name}`,
      `📁 *المجموعة:* ${data.group ? data.group.name : '-'}`,
      `📅 *تاريخ التقرير:* ${date}`,'',
      '📊 *ملخص الأداء*',
      `• الحضور: ${data.rate}% (${data.attendance.length} سجل)`,
      `• حاضر/متأخر: ${data.present}`,
      `• غياب: ${data.absent}`,
      `• متوسط الدرجات: ${data.average ? data.average + '%' : 'لا توجد درجات'}`,'',
      '📝 *آخر الدرجات*',
      ...(data.grades.length ? data.grades.slice(-5).reverse().map(g => `• ${g.examName || 'اختبار'}${g.subject ? ' - ' + g.subject : ''}: ${g.score ?? '-'} / ${g.total || 100} (${g.percentage != null ? g.percentage + '%' : '—'})`) : ['• لا توجد درجات مسجلة']),'',
      '💳 *المدفوعات*',
      `• المدفوع: ${data.paid.toFixed(2)}`,
      `• مدفوع جزئيًا: ${data.partial.toFixed(2)}`,
      `• غير مدفوع: ${data.outstanding.toFixed(2)}`,'',
      '🎯 *ملاحظة المعلم*', s.notes || 'لا توجد ملاحظات إضافية.','',
      'مع تحيات *معلمي | Moallemi* 🌿'
    ].join('\n');
  }

  function toast(message, type = 'error') {
    if (typeof App !== 'undefined' && typeof App.showToast === 'function') App.showToast(message, type);
    else window.alert(message);
  }

  function sendReport(studentId) {
    const data = getReport(studentId);
    if (!data) return toast('تعذر العثور على بيانات الطالب', 'error');
    const phone = normalizePhone(data.student.guardianPhone || data.student.parentPhone);
    if (!phone) return toast('أضف رقم ولي الأمر أولاً من بيانات الطالب', 'error');

    const url = `https://wa.me/${phone}?text=${encodeURIComponent(buildMessage(data))}`;
    window.open(url, '_blank', 'noopener,noreferrer');
    if (typeof App !== 'undefined' && typeof App.addActivity === 'function') App.addActivity('تم تجهيز تقرير واتساب للطالب: ' + data.student.name, 'report');
  }

  function whatsappIcon() {
    return '<svg class="icon icon-whatsapp" aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M20.5 11.4a8.4 8.4 0 0 1-12.8 7.2L3.5 20l1.4-4A8.4 8.4 0 1 1 20.5 11.4Z"/><path d="M8.2 8.2c.4 2 1.9 3.8 4 4.5l1.3-1.2 2 1c-.2 1.1-.9 1.8-2.1 1.6-3.5-.7-6.2-3.4-6.9-6.9-.2-1.2.5-1.9 1.6-2.1l1 2-1.3 1.1Z"/></svg>';
  }

  function addTableButtons() {
    const tbody = document.getElementById('students-tbody');
    if (!tbody) return;
    tbody.querySelectorAll('[data-action="whatsapp-guardian"]').forEach(b => b.remove());

    tbody.querySelectorAll('tr').forEach(row => {
      const view = row.querySelector('[data-action="view-student"]');
      if (!view?.dataset.id) return;
      const id = view.dataset.id;
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'btn-icon whatsapp-guardian-btn';
      btn.dataset.action = 'whatsapp-guardian';
      btn.dataset.id = id;
      btn.title = 'إرسال تقرير واتساب لولي الأمر';
      btn.setAttribute('aria-label', 'إرسال تقرير واتساب لولي الأمر');
      btn.innerHTML = whatsappIcon();
      row.querySelector('.actions-cell')?.appendChild(btn);
    });
  }

  function addDetailsButton(studentId) {
    const modal = document.getElementById('modal-student-details');
    if (!modal) return;
    const header = modal.querySelector('.modal-header');
    if (!header) return;

    let btn = modal.querySelector('#' + REPORT_BTN);
    if (!btn) {
      btn = document.createElement('button');
      btn.id = REPORT_BTN;
      btn.type = 'button';
      btn.className = 'btn btn-primary whatsapp-report-btn';
      btn.innerHTML = `${whatsappIcon()}<span>إرسال التقرير لولي الأمر</span>`;
      header.appendChild(btn);
      btn.addEventListener('click', () => {
        const id = btn.dataset.studentId;
        if (id) sendReport(id);
      });
    }
    btn.dataset.studentId = String(studentId || '');
  }

  function addGuardianInline(student) {
    const detail = document.getElementById('detail-student-phone');
    if (!detail || !student) return;
    detail.parentElement?.querySelector('.guardian-inline-phone')?.remove();
    const el = document.createElement('span');
    el.className = 'guardian-inline-phone';
    el.innerHTML = `<strong>ولي الأمر:</strong> <b dir="ltr">${String(student.guardianPhone || '-')}</b>`;
    detail.insertAdjacentElement('afterend', el);
  }

  function install() {
    ensureField();
    const tbody = document.getElementById('students-tbody');
    if (tbody && !tbody.dataset.guardianWhatsappBound) {
      tbody.dataset.guardianWhatsappBound = '1';
      tbody.addEventListener('click', e => {
        const btn = e.target.closest('[data-action="whatsapp-guardian"]');
        if (!btn) return;
        e.preventDefault();
        e.stopPropagation();
        sendReport(btn.dataset.id);
      });
    }
    addTableButtons();
  }

  function hookStudents() {
    if (typeof StudentsModule === 'undefined' || StudentsModule.__guardianHooked) return;
    StudentsModule.__guardianHooked = true;

    const originalAdd = StudentsModule.openAddModal?.bind(StudentsModule);
    const originalEdit = StudentsModule.openEditModal?.bind(StudentsModule);
    const originalSave = StudentsModule.saveStudent?.bind(StudentsModule);
    const originalRender = StudentsModule.render?.bind(StudentsModule);
    const originalView = StudentsModule.viewStudentDetails?.bind(StudentsModule);

    if (originalAdd) StudentsModule.openAddModal = function () { originalAdd(); ensureField(); setGuardianValue(null); };
    if (originalEdit) StudentsModule.openEditModal = function (id) { originalEdit(id); ensureField(); setGuardianValue(getStudent(id)); };

    if (originalSave) StudentsModule.saveStudent = function () {
      const before = getStudents();
      const beforeIds = new Set(before.map(s => String(s.id)));
      const editingId = this.editingId;
      originalSave();
      const after = getStudents();
      const targetId = editingId || after.find(s => !beforeIds.has(String(s.id)))?.id;
      if (targetId) saveGuardianPhone(targetId);
      ensureField();
    };

    if (originalRender) StudentsModule.render = function () {
      originalRender();
      requestAnimationFrame(() => { install(); addTableButtons(); });
    };

    if (originalView) StudentsModule.viewStudentDetails = function (id) {
      // Keep the original module responsible for rendering all student details.
      originalView(id);
      requestAnimationFrame(() => {
        addDetailsButton(id);
        addGuardianInline(getStudent(id));
      });
    };

    install();
  }

  function boot() {
    install();
    hookStudents();
    if (typeof StudentsModule !== 'undefined') addTableButtons();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true });
  else boot();
  setTimeout(boot, 500);
  setTimeout(boot, 1500);
})();
