/**
 * التقارير - Reports Module
 * عرض وتصدير التقارير المختلفة
 */
const ReportsModule = (() => {

  let currentTab = 'students';

  function getFilteredStudents() {
    let students = StorageManager.get('sm_students') || [];
    const groupFilter = document.getElementById('report-group-filter').value;
    const dateFrom = document.getElementById('report-date-from').value;
    const dateTo = document.getElementById('report-date-to').value;

    if (groupFilter) {
      students = students.filter(s => s.groupId === groupFilter);
    }
    if (dateFrom) {
      students = students.filter(s => s.createdAt >= dateFrom);
    }
    if (dateTo) {
      students = students.filter(s => s.createdAt <= dateTo);
    }
    return students;
  }

  function getStudentAttendanceRate(studentId) {
    const attendance = StorageManager.get('sm_attendance') || [];
    const records = attendance.filter(a => a.studentId === studentId);
    if (records.length === 0) return 0;
    const present = records.filter(a => a.status === 'حاضر').length;
    return DemoData.calculatePercentage(present, records.length);
  }

  function getStudentGradeAverage(studentId) {
    const grades = StorageManager.get('sm_grades') || [];
    const records = grades.filter(g => g.studentId === studentId);
    if (records.length === 0) return 0;
    const total = records.reduce((sum, g) => sum + DemoData.calculatePercentage(Number(g.score) || 0, Number(g.total) || 100), 0);
    return Math.round(total / records.length);
  }

  function renderStudentsReport() {
    const students = getFilteredStudents();
    const attendance = StorageManager.get('sm_attendance') || [];
    const grades = StorageManager.get('sm_grades') || [];

    let html = `
      <table class="report-table">
        <thead>
          <tr>
            <th>الاسم</th>
            <th>الهاتف</th>
            <th>المجموعة</th>
            <th>الحالة</th>
            <th>نسبة الحضور</th>
            <th>متوسط الدرجات</th>
          </tr>
        </thead>
        <tbody>
    `;

    students.forEach(s => {
      const groupName = GroupsModule.getGroupName(s.groupId);
      const attRate = getStudentAttendanceRate(s.id);
      const avgGrade = getStudentGradeAverage(s.id);
      const status = s.active === false ? 'غير نشط' : 'نشط';

      html += `
        <tr>
          <td>${s.name}</td>
          <td>${s.phone || '-'}</td>
          <td>${groupName}</td>
          <td>${status}</td>
          <td>${attRate}%</td>
          <td>${avgGrade}%</td>
        </tr>
      `;
    });

    html += `</tbody></table>`;
    if (students.length === 0) {
      html = '<p class="report-empty">لا توجد بيانات لعرض التقرير</p>';
    }
    return html;
  }

  function renderAttendanceReport() {
    const students = getFilteredStudents();
    const attendance = StorageManager.get('sm_attendance') || [];

    let html = `
      <table class="report-table">
        <thead>
          <tr>
            <th>الطالب</th>
            <th>إجمالي الأيام</th>
            <th>أيام الحضور</th>
            <th>أيام الغياب</th>
            <th>نسبة الحضور</th>
          </tr>
        </thead>
        <tbody>
    `;

    students.forEach(s => {
      const records = attendance.filter(a => a.studentId === s.id);
      const total = records.length;
      const present = records.filter(a => a.status === 'حاضر').length;
      const absent = total - present;
      const rate = DemoData.calculatePercentage(present, total);

      html += `
        <tr>
          <td>${s.name}</td>
          <td>${total}</td>
          <td>${present}</td>
          <td>${absent}</td>
          <td>${rate}%</td>
        </tr>
      `;
    });

    html += `</tbody></table>`;
    if (students.length === 0) {
      html = '<p class="report-empty">لا توجد بيانات لعرض التقرير</p>';
    }
    return html;
  }

  function renderGradesReport() {
    const grades = StorageManager.get('sm_grades') || [];
    const students = getFilteredStudents();
    const studentIds = students.map(s => s.id);

    let filtered = grades;
    if (studentIds.length > 0 && studentIds.length < (StorageManager.get('sm_students') || []).length) {
      filtered = grades.filter(g => studentIds.includes(g.studentId));
    }

    let html = `
      <table class="report-table">
        <thead>
          <tr>
            <th>الطالب</th>
            <th>المادة</th>
            <th>الدرجة</th>
            <th>النسبة</th>
            <th>التقدير</th>
          </tr>
        </thead>
        <tbody>
    `;

    filtered.forEach(g => {
      const studentName = StudentsModule.getStudentName(g.studentId);
      const score = Number(g.score) || 0;
      const total = Number(g.total) || 100;
      const pct = DemoData.calculatePercentage(score, total);
      const rating = DemoData.calculateRating(score, total);

      html += `
        <tr>
          <td>${studentName}</td>
          <td>${g.subject || '-'}</td>
          <td>${score} / ${total}</td>
          <td>${pct}%</td>
          <td>${rating}</td>
        </tr>
      `;
    });

    html += `</tbody></table>`;
    if (filtered.length === 0) {
      html = '<p class="report-empty">لا توجد بيانات لعرض التقرير</p>';
    }
    return html;
  }

  function renderHomeworkReport() {
    const homework = StorageManager.get('sm_homework') || [];
    const groupFilter = document.getElementById('report-group-filter').value;

    let filtered = homework;
    if (groupFilter) {
      filtered = filtered.filter(h => h.groupId === groupFilter);
    }

    let html = `
      <table class="report-table">
        <thead>
          <tr>
            <th>العنوان</th>
            <th>المجموعة</th>
            <th>الحالة</th>
            <th>تاريخ التسليم</th>
          </tr>
        </thead>
        <tbody>
    `;

    filtered.forEach(h => {
      const groupName = GroupsModule.getGroupName(h.groupId);
      html += `
        <tr>
          <td>${h.title}</td>
          <td>${groupName}</td>
          <td>${h.status}</td>
          <td>${DemoData.formatDate(h.dueDate)}</td>
        </tr>
      `;
    });

    html += `</tbody></table>`;
    if (filtered.length === 0) {
      html = '<p class="report-empty">لا توجد بيانات لعرض التقرير</p>';
    }
    return html;
  }

  function renderPaymentsReport() {
    const payments = StorageManager.get('sm_payments') || [];
    const students = getFilteredStudents();
    const studentIds = students.map(s => s.id);

    let filtered = payments;
    if (studentIds.length > 0 && studentIds.length < (StorageManager.get('sm_students') || []).length) {
      filtered = payments.filter(p => studentIds.includes(p.studentId));
    }

    let html = `
      <table class="report-table">
        <thead>
          <tr>
            <th>الطالب</th>
            <th>المبلغ</th>
            <th>الشهر</th>
            <th>الحالة</th>
          </tr>
        </thead>
        <tbody>
    `;

    let totalPaid = 0;
    let totalUnpaid = 0;

    filtered.forEach(p => {
      const studentName = StudentsModule.getStudentName(p.studentId);
      const amount = Number(p.amount) || 0;
      if (p.status === 'مدفوع') totalPaid += amount;
      else totalUnpaid += amount;

      html += `
        <tr>
          <td>${studentName}</td>
          <td>${amount.toLocaleString('ar-EG')}</td>
          <td>${p.month || '-'}</td>
          <td>${p.status}</td>
        </tr>
      `;
    });

    html += `</tbody></table>`;

    if (filtered.length > 0) {
      html += `
        <div class="report-summary">
          <p>إجمالي المدفوع: <strong>${totalPaid.toLocaleString('ar-EG')}</strong></p>
          <p>إجمالي غير المدفوع: <strong>${totalUnpaid.toLocaleString('ar-EG')}</strong></p>
        </div>
      `;
    }

    if (filtered.length === 0) {
      html = '<p class="report-empty">لا توجد بيانات لعرض التقرير</p>';
    }
    return html;
  }

  function renderReport(type) {
    const content = document.getElementById('report-content');
    switch (type) {
      case 'students': content.innerHTML = renderStudentsReport(); break;
      case 'attendance': content.innerHTML = renderAttendanceReport(); break;
      case 'grades': content.innerHTML = renderGradesReport(); break;
      case 'homework': content.innerHTML = renderHomeworkReport(); break;
      case 'payments': content.innerHTML = renderPaymentsReport(); break;
      default: content.innerHTML = renderStudentsReport();
    }
  }

  function switchTab(type) {
    currentTab = type;
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.classList.toggle('active', btn.getAttribute('data-report') === type);
    });
    renderReport(type);
  }

  function printReport() {
    window.print();
  }

  function exportReport() {
    const content = document.getElementById('report-content');
    const table = content.querySelector('table');
    if (!table) {
      App.showToast('لا توجد بيانات للتصدير', 'error');
      return;
    }

    const rows = table.querySelectorAll('tr');
    let csv = '\uFEFF';

    rows.forEach(row => {
      const cells = row.querySelectorAll('th, td');
      const rowData = [];
      cells.forEach(cell => {
        let text = cell.textContent.trim();
        text = text.replace(/"/g, '""');
        rowData.push('"' + text + '"');
      });
      csv += rowData.join(',') + '\n';
    });

    const summary = content.querySelector('.report-summary');
    if (summary) {
      csv += '\n';
      summary.querySelectorAll('p').forEach(p => {
        let text = p.textContent.trim();
        text = text.replace(/"/g, '""');
        csv += '"' + text + '"\n';
      });
    }

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'تقرير_' + currentTab + '_' + DemoData.getTodayDate() + '.csv';
    link.click();
    URL.revokeObjectURL(link.href);
    App.showToast('تم تصدير التقرير بنجاح', 'success');
  }

  function init() {
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const type = btn.getAttribute('data-report');
        switchTab(type);
      });
    });

    document.getElementById('report-group-filter').addEventListener('change', () => {
      renderReport(currentTab);
    });
    document.getElementById('report-date-from').addEventListener('change', () => {
      renderReport(currentTab);
    });
    document.getElementById('report-date-to').addEventListener('change', () => {
      renderReport(currentTab);
    });

    document.getElementById('btn-print-report').addEventListener('click', printReport);
    document.getElementById('btn-export-report').addEventListener('click', exportReport);

    switchTab('students');
  }

  return {
    init,
    switchTab,
    renderReport,
    printReport,
    exportReport
  };
})();
