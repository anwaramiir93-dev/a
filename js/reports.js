/**
 * التقارير - Reports Module
 * عرض التقارير وتصديرها بصيغتي PDF وExcel فقط.
 */
const ReportsModule = (() => {
  let currentTab = 'students';
  let xlsxPromise = null;

  const XLSX_URL = 'https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js';

  function toast(message, type = 'success') {
    if (window.App && typeof App.showToast === 'function') App.showToast(message, type);
    else if (typeof window.showToast === 'function') window.showToast(message, type);
    else window.alert(message);
  }

  function getEl(id) {
    return document.getElementById(id);
  }

  function getFilteredStudents() {
    let students = StorageManager.get('sm_students') || [];
    const group = getEl('report-group-filter');
    const from = getEl('report-date-from');
    const to = getEl('report-date-to');
    const groupFilter = group ? group.value : '';
    const dateFrom = from ? from.value : '';
    const dateTo = to ? to.value : '';

    if (groupFilter) students = students.filter(s => String(s.groupId) === String(groupFilter));
    if (dateFrom) students = students.filter(s => !s.createdAt || s.createdAt >= dateFrom);
    if (dateTo) students = students.filter(s => !s.createdAt || s.createdAt <= dateTo);
    return students;
  }

  function getStudentAttendanceRate(studentId) {
    const records = (StorageManager.get('sm_attendance') || []).filter(a => String(a.studentId) === String(studentId));
    if (!records.length) return 0;
    const present = records.filter(a => a.status === 'حاضر').length;
    return DemoData.calculatePercentage(present, records.length);
  }

  function getStudentGradeAverage(studentId) {
    const records = (StorageManager.get('sm_grades') || []).filter(g => String(g.studentId) === String(studentId));
    if (!records.length) return 0;
    const total = records.reduce((sum, g) => sum + DemoData.calculatePercentage(Number(g.score) || 0, Number(g.total) || 100), 0);
    return Math.round(total / records.length);
  }

  function renderStudentsReport() {
    const students = getFilteredStudents();
    let html = `<table class="report-table"><thead><tr><th>الاسم</th><th>الهاتف</th><th>المجموعة</th><th>الحالة</th><th>نسبة الحضور</th><th>متوسط الدرجات</th></tr></thead><tbody>`;
    students.forEach(s => {
      const groupName = GroupsModule.getGroupName(s.groupId);
      html += `<tr><td>${s.name}</td><td>${s.phone || '-'}</td><td>${groupName}</td><td>${s.active === false ? 'غير نشط' : 'نشط'}</td><td>${getStudentAttendanceRate(s.id)}%</td><td>${getStudentGradeAverage(s.id)}%</td></tr>`;
    });
    html += '</tbody></table>';
    return students.length ? html : '<p class="report-empty">لا توجد بيانات لعرض التقرير</p>';
  }

  function renderAttendanceReport(absenceOnly = false) {
    const students = getFilteredStudents();
    const attendance = StorageManager.get('sm_attendance') || [];
    let html = `<table class="report-table"><thead><tr><th>الطالب</th><th>إجمالي الأيام</th><th>أيام الحضور</th><th>أيام الغياب</th><th>نسبة الحضور</th></tr></thead><tbody>`;
    students.forEach(s => {
      const records = attendance.filter(a => String(a.studentId) === String(s.id));
      const total = records.length;
      const present = records.filter(a => a.status === 'حاضر').length;
      const absent = total - present;
      if (absenceOnly && absent === 0) return;
      html += `<tr><td>${s.name}</td><td>${total}</td><td>${present}</td><td>${absent}</td><td>${DemoData.calculatePercentage(present, total)}%</td></tr>`;
    });
    html += '</tbody></table>';
    const hasRows = html.includes('<tr><td>');
    return hasRows ? html : '<p class="report-empty">لا توجد بيانات لعرض التقرير</p>';
  }

  function renderGradesReport() {
    const grades = StorageManager.get('sm_grades') || [];
    const students = getFilteredStudents();
    const studentIds = new Set(students.map(s => String(s.id)));
    const allStudents = StorageManager.get('sm_students') || [];
    const filtered = studentIds.size && studentIds.size < allStudents.length
      ? grades.filter(g => studentIds.has(String(g.studentId)))
      : grades;
    let html = `<table class="report-table"><thead><tr><th>الطالب</th><th>المادة</th><th>الدرجة</th><th>النسبة</th><th>التقدير</th></tr></thead><tbody>`;
    filtered.forEach(g => {
      const studentName = StudentsModule.getStudentName(g.studentId);
      const score = Number(g.score) || 0;
      const total = Number(g.total) || 100;
      html += `<tr><td>${studentName}</td><td>${g.subject || '-'}</td><td>${score} / ${total}</td><td>${DemoData.calculatePercentage(score, total)}%</td><td>${DemoData.calculateRating(score, total)}</td></tr>`;
    });
    html += '</tbody></table>';
    return filtered.length ? html : '<p class="report-empty">لا توجد بيانات لعرض التقرير</p>';
  }

  function renderHomeworkReport() {
    const homework = StorageManager.get('sm_homework') || [];
    const group = getEl('report-group-filter');
    const groupFilter = group ? group.value : '';
    const filtered = groupFilter ? homework.filter(h => String(h.groupId) === String(groupFilter)) : homework;
    let html = `<table class="report-table"><thead><tr><th>العنوان</th><th>المجموعة</th><th>الحالة</th><th>تاريخ التسليم</th></tr></thead><tbody>`;
    filtered.forEach(h => html += `<tr><td>${h.title}</td><td>${GroupsModule.getGroupName(h.groupId)}</td><td>${h.status}</td><td>${DemoData.formatDate(h.dueDate)}</td></tr>`);
    html += '</tbody></table>';
    return filtered.length ? html : '<p class="report-empty">لا توجد بيانات لعرض التقرير</p>';
  }

  function renderPaymentsReport() {
    const payments = StorageManager.get('sm_payments') || [];
    const students = getFilteredStudents();
    const studentIds = new Set(students.map(s => String(s.id)));
    const allStudents = StorageManager.get('sm_students') || [];
    const filtered = studentIds.size && studentIds.size < allStudents.length
      ? payments.filter(p => studentIds.has(String(p.studentId)))
      : payments;
    let totalPaid = 0;
    let totalUnpaid = 0;
    let html = `<table class="report-table"><thead><tr><th>الطالب</th><th>المبلغ</th><th>الشهر</th><th>الحالة</th></tr></thead><tbody>`;
    filtered.forEach(p => {
      const amount = Number(p.amount) || 0;
      if (p.status === 'مدفوع') totalPaid += amount;
      else totalUnpaid += amount;
      html += `<tr><td>${StudentsModule.getStudentName(p.studentId)}</td><td>${amount.toLocaleString('ar-EG')}</td><td>${p.month || '-'}</td><td>${p.status}</td></tr>`;
    });
    html += '</tbody></table>';
    if (filtered.length) html += `<div class="report-summary"><p>إجمالي المدفوع: <strong>${totalPaid.toLocaleString('ar-EG')}</strong></p><p>إجمالي غير المدفوع: <strong>${totalUnpaid.toLocaleString('ar-EG')}</strong></p></div>`;
    return filtered.length ? html : '<p class="report-empty">لا توجد بيانات لعرض التقرير</p>';
  }

  function renderReport(type = currentTab) {
    currentTab = type;
    const content = getEl('report-content');
    if (!content) return;
    switch (type) {
      case 'attendance': content.innerHTML = renderAttendanceReport(false); break;
      case 'absence': content.innerHTML = renderAttendanceReport(true); break;
      case 'grades': content.innerHTML = renderGradesReport(); break;
      case 'homework': content.innerHTML = renderHomeworkReport(); break;
      case 'payments': content.innerHTML = renderPaymentsReport(); break;
      default: content.innerHTML = renderStudentsReport(); break;
    }
  }

  function switchTab(type) {
    currentTab = type;
    document.querySelectorAll('#section-reports .tab-btn').forEach(btn => btn.classList.toggle('active', btn.getAttribute('data-report') === type));
    renderReport(type);
  }

  function currentReportName() {
    const active = document.querySelector('#section-reports .tab-btn.active');
    return active ? active.textContent.trim() : 'تقرير';
  }

  function safeFileName(value) {
    return String(value || 'تقرير').replace(/[\\/:*?"<>|]/g, '-').replace(/\s+/g, '-');
  }

  function getReportTable() {
    const content = getEl('report-content');
    return content ? content.querySelector('table') : null;
  }

  function loadXLSX() {
    if (window.XLSX) return Promise.resolve(window.XLSX);
    if (xlsxPromise) return xlsxPromise;
    xlsxPromise = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = XLSX_URL;
      script.async = true;
      script.onload = () => window.XLSX ? resolve(window.XLSX) : reject(new Error('XLSX unavailable'));
      script.onerror = reject;
      document.head.appendChild(script);
    });
    return xlsxPromise;
  }

  function downloadExcel() {
    const table = getReportTable();
    if (!table) return toast('لا توجد بيانات في التقرير الحالي', 'error');
    loadXLSX().then(XLSX => {
      const workbook = XLSX.utils.table_to_book(table, { sheet: 'التقرير' });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      sheet['!cols'] = Array.from({ length: Math.max(6, Object.keys(sheet).length) }, () => ({ wch: 20 }));
      XLSX.writeFile(workbook, `تقرير_${safeFileName(currentReportName())}_${new Date().toISOString().slice(0, 10)}.xlsx`);
      toast('تم تحميل تقرير Excel بنجاح', 'success');
    }).catch(() => toast('تعذر تجهيز ملف Excel، تحقق من اتصال الإنترنت ثم حاول مرة أخرى', 'error'));
  }

  function downloadPdf() {
    const table = getReportTable();
    if (!table) return toast('لا توجد بيانات في التقرير الحالي', 'error');
    const report = getEl('report-content');
    const title = currentReportName();
    const originalTitle = document.title;
    const printStyle = document.createElement('style');
    printStyle.id = 'report-pdf-print-style';
    printStyle.textContent = `@media print {
      @page { size: A4 portrait; margin: 12mm; }
      body * { visibility: hidden !important; }
      #report-content, #report-content * { visibility: visible !important; }
      #report-content { position: absolute !important; inset: 0 !important; width: 100% !important; padding: 0 !important; background: #fff !important; color: #111 !important; }
      #report-content::before { content: '${title.replace(/'/g, "\\'")}'; display:block; font-size:22px; font-weight:800; margin-bottom:18px; text-align:center; }
      #report-content table { width:100% !important; border-collapse:collapse !important; direction:rtl !important; font-family:Tahoma,Arial,sans-serif !important; font-size:11px !important; }
      #report-content th, #report-content td { border:1px solid #d7d7d7 !important; padding:7px !important; text-align:right !important; }
      #report-content th { background:#f2f2f2 !important; font-weight:800 !important; }
      .report-summary { margin-top:14px !important; }
      .report-actions, .tabs, .filters-bar, .sidebar, #main-header { display:none !important; }
    }`;
    document.head.appendChild(printStyle);
    document.title = `تقرير_${safeFileName(title)}`;
    let cleaned = false;
    const cleanup = () => {
      if (cleaned) return;
      cleaned = true;
      printStyle.remove();
      document.title = originalTitle;
      window.removeEventListener('afterprint', cleanup);
    };
    window.addEventListener('afterprint', cleanup);
    window.print();
    setTimeout(cleanup, 2500);
  }

  function createDownloadButton(id, label, icon, handler) {
    const button = document.createElement('button');
    button.type = 'button';
    button.id = id;
    button.className = 'btn btn-outline report-download-btn';
    button.setAttribute('aria-label', label);
    button.innerHTML = `<span class="report-download-icon" aria-hidden="true">${icon}</span><span>${label}</span>`;
    button.addEventListener('click', handler);
    return button;
  }

  function setupDownloadActions() {
    const section = getEl('section-reports');
    const actions = section && section.querySelector('.report-actions');
    if (!actions) return;
    if (actions.dataset.downloadsReady === '1') return;
    actions.dataset.downloadsReady = '1';
    actions.innerHTML = '';
    actions.append(
      createDownloadButton('btn-download-report-pdf', 'تحميل PDF', 'PDF', downloadPdf),
      createDownloadButton('btn-download-report-excel', 'تحميل Excel', 'XLSX', downloadExcel)
    );
  }

  function init() {
    document.querySelectorAll('#section-reports .tab-btn').forEach(btn => {
      btn.addEventListener('click', () => switchTab(btn.getAttribute('data-report')));
    });
    ['report-group-filter', 'report-date-from', 'report-date-to'].forEach(id => {
      const el = getEl(id);
      if (el) el.addEventListener('change', () => renderReport(currentTab));
    });
    setupDownloadActions();
    switchTab('students');
  }

  return {
    init,
    switchTab,
    renderReport,
    downloadPdf,
    downloadExcel
  };
})();
