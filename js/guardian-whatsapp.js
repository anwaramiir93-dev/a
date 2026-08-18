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

  function ensureField() {
    const form = document.getElementById('form-student');
    const phone = document.getElementById('student-phone');
    if (!form || !phone || document.getElementById(FIELD_ID)) return;

    const wrapper = document.createElement('div');
    wrapper.className = 'form-group guardian-phone-group';
    wrapper.innerHTML = `
      <label for="${FIELD_ID}" class="form-label">رقم ولي الأمر <span style="color:#0f766e">(لإرسال التقارير)</span></label>
      <input id="${FIELD_ID}" class="form-input" type="tel" inputmode="tel" autocomplete="tel" dir="ltr" placeholder="01xxxxxxxxx">
      <small class="form-help">سيُستخدم هذا الرقم لإرسال تقرير الطالب عبر واتساب بضغطة واحدة.</small>
    `;

    const phoneGroup = phone.closest('.form-group') || phone.parentElement;
    if (phoneGroup && phoneGroup.parentNode) phoneGroup.parentNode.insertBefore(wrapper, phoneGroup.nextSibling);
    else form.appendChild(wrapper);
  }

  function setGuardianValue(student) {
    const input = document.getElementById(FIELD_ID);
    if (input) input.value = student ? (student.guardianPhone || student.parentPhone || '') : '';
  }

  function saveGuardianPhone(studentId) {
    const input = document.getElementById(FIELD_ID);
    if (!input || !studentId) return;
    const students = StorageManager.get('sm_students') || [];
    const index = students.findIndex(s => s.id === studentId);
    if (index === -1) return;
    students[index].guardianPhone = input.value.trim();
    delete students[index].parentPhone;
    StorageManager.set('sm_students', students);
  }

  function getReport(studentId) {
    const students = StorageManager.get('sm_students') || [];
    const groups = StorageManager.get('sm_groups') || [];
    const attendance = (StorageManager.get('sm_attendance') || []).filter(a => a.studentId === studentId);
    const grades = (StorageManager.get('sm_grades') || []).filter(g => g.studentId === studentId);
    const payments = (StorageManager.get('sm_payments') || []).filter(p => p.studentId === studentId);
    const student = students.find(s => s.id === studentId);
    if (!student) return null;
    const group = groups.find(g => g.id === student.groupId);
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

  function sendReport(studentId) {
    const data = getReport(studentId);
    if (!data) return;
    const phone = normalizePhone(data.student.guardianPhone || data.student.parentPhone);
    if (!phone) {
      App.showToast('أضف رقم ولي الأمر أولاً من بيانات الطالب', 'error');
      return;
    }
    const url = `https://wa.me/${phone}?text=${encodeURIComponent(buildMessage(data))}`;
    window.open(url, '_blank', 'noopener,noreferrer');
    if (typeof App.addActivity === 'function') App.addActivity('تم تجهيز تقرير واتساب للطالب: ' + data.student.name, 'report');
  }

  function addTableButtons() {
    const tbody = document.getElementById('students-tbody');
    if (!tbody) return;
    tbody.querySelectorAll('[data-action="whatsapp-guardian"]').forEach(b => b.remove());
    tbody.querySelectorAll('tr').forEach(row => {
      const view = row.querySelector('[data-action="view-student"]');
      if (!view) return;
      const id = view.dataset.id;
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'btn-icon whatsapp-guardian-btn';
      btn.dataset.action = 'whatsapp-guardian';
      btn.dataset.id = id;
      btn.title = 'إرسال تقرير واتساب لولي الأمر';
      btn.setAttribute('aria-label', 'إرسال تقرير واتساب لولي الأمر');
      btn.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-9 8.5 8.5 8.5 0 0 1-7.2-4L3 21l1-3.7A8.5 8.5 0 1 1 21 11.5Z"></path><path d="M8.5 9.5c.5 2 2 3.5 4 4l1.5-1.5 2 1c-.2 1.2-1 1.8-2.2 1.6-3.8-.7-6.7-3.6-7.4-7.4-.2-1.2.4-2 1.6-2.2l1 2-1.5 1.5Z"></path></svg>';
      row.querySelector('.actions-cell')?.appendChild(btn);
    });
  }

  function addDetailsButton() {
    const modal = document.getElementById('modal-student-details');
    if (!modal || modal.querySelector('#' + REPORT_BTN)) return;
    const header = modal.querySelector('.modal-header');
    if (!header) return;
    const btn = document.createElement('button');
    btn.id = REPORT_BTN;
    btn.type = 'button';
    btn.className = 'btn btn-primary whatsapp-report-btn';
    btn.textContent = 'إرسال التقرير لولي الأمر';
    btn.style.marginInlineStart = 'auto';
    btn.dataset.studentId = '';
    header.appendChild(btn);
    btn.addEventListener('click', () => sendReport(btn.dataset.studentId));
  }

  function install() {
    ensureField();
    addDetailsButton();
    const tbody = document.getElementById('students-tbody');
    if (tbody && !tbody.dataset.guardianWhatsappBound) {
      tbody.dataset.guardianWhatsappBound = '1';
      tbody.addEventListener('click', e => {
        const btn = e.target.closest('[data-action="whatsapp-guardian"]');
        if (btn) { e.preventDefault(); e.stopPropagation(); sendReport(btn.dataset.id); }
      });
    }
  }

  function hookStudents() {
    if (typeof StudentsModule === 'undefined' || StudentsModule.__guardianHooked) return;
    StudentsModule.__guardianHooked = true;
    const originalAdd = StudentsModule.openAddModal.bind(StudentsModule);
    const originalEdit = StudentsModule.openEditModal.bind(StudentsModule);
    const originalSave = StudentsModule.saveStudent.bind(StudentsModule);
    const originalRender = StudentsModule.render.bind(StudentsModule);
    const originalView = StudentsModule.viewStudentDetails.bind(StudentsModule);

    StudentsModule.openAddModal = function () {
      originalAdd(); ensureField(); setGuardianValue(null);
    };
    StudentsModule.openEditModal = function (id) {
      originalEdit(id); ensureField();
      const student = (StorageManager.get('sm_students') || []).find(s => s.id === id);
      setGuardianValue(student);
    };
    StudentsModule.saveStudent = function () {
      const oldStudents = StorageManager.get('sm_students') || [];
      const oldIds = new Set(oldStudents.map(s => s.id));
      const editingId = this.editingId;
      originalSave();
      const students = StorageManager.get('sm_students') || [];
      const targetId = editingId || (students.find(s => !oldIds.has(s.id)) || {}).id;
      if (targetId) saveGuardianPhone(targetId);
      ensureField();
    };
    StudentsModule.render = function () { originalRender(); setTimeout(() => { install(); addTableButtons(); }, 0); };
    StudentsModule.viewStudentDetails = function (id) {
      originalView(id); addDetailsButton();
      const btn = document.getElementById(REPORT_BTN);
      if (btn) btn.dataset.studentId = id;
      const student = (StorageManager.get('sm_students') || []).find(s => s.id === id);
      const detail = document.getElementById('detail-student-phone');
      if (detail && student) detail.insertAdjacentHTML('afterend', `<span class="guardian-inline-phone"><strong>ولي الأمر:</strong> <b dir="ltr">${student.guardianPhone || '-'}</b></span>`);
    };
    install();
  }

  const boot = () => {
    install();
    hookStudents();
    if (typeof StudentsModule !== 'undefined' && StudentsModule.render) addTableButtons();
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
  setTimeout(boot, 500);
  setTimeout(boot, 1500);
})();
