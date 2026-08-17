/**
 * GradesModule — وحدة إدارة الدرجات
 */
const GradesModule = (() => {
  let editingId = null;

  // --------------------------------------------------
  // التهيئة
  // --------------------------------------------------

  function init() {
    bindEvents();
    render();
  }

  function bindEvents() {
    const btnSave = document.getElementById('btn-save-grade');
    if (btnSave) btnSave.addEventListener('click', saveGrade);

    const tbody = document.getElementById('grades-tbody');
    if (tbody) tbody.addEventListener('click', handleTableAction);
  }

  // --------------------------------------------------
  // تفويض أحداث الجدول
  // --------------------------------------------------

  function handleTableAction(e) {
    const btn = e.target.closest('[data-action]');
    if (!btn) return;

    const action = btn.dataset.action;
    const gradeId = btn.dataset.id;

    if (action === 'edit') {
      editGrade(gradeId);
    } else if (action === 'delete') {
      deleteGrade(gradeId);
    }
  }

  // --------------------------------------------------
  // لون النسبة المئوية
  // --------------------------------------------------

  function getPercentageColor(percentage) {
    if (percentage >= 80) return '#198754';
    if (percentage >= 60) return '#fd7e14';
    return '#dc3545';
  }

  // --------------------------------------------------
  // شارة التقدير
  // --------------------------------------------------

  function getRatingBadgeClass(rating) {
    const map = {
      'ممتاز': 'badge-success',
      'جيد جداً': 'badge-primary',
      'جيد': 'badge-info',
      'مقبول': 'badge-warning',
      'ضعيف': 'badge-danger',
    };
    return map[rating] || 'badge-secondary';
  }

  // --------------------------------------------------
  // العرض
  // --------------------------------------------------

  function render() {
    const grades = StorageManager.get('sm_grades') || [];
    const tbody = document.getElementById('grades-tbody');
    const emptyEl = document.getElementById('grades-empty');

    // ترتيب حسب التاريخ (الأحدث أولاً)
    const sorted = [...grades].sort((a, b) => (b.date || '').localeCompare(a.date || ''));

    if (!tbody) return;

    if (sorted.length === 0) {
      tbody.innerHTML = '';
      if (emptyEl) emptyEl.style.display = 'flex';
      return;
    }

    if (emptyEl) emptyEl.style.display = 'none';

    tbody.innerHTML = sorted.map(grade => {
      const percentage = grade.percentage || DemoData.calculatePercentage(grade.score, grade.total);
      const rating = grade.rating || DemoData.calculateRating(grade.score, grade.total);
      const ratingBadge = getRatingBadgeClass(rating);
      const pctColor = getPercentageColor(percentage);

      return `
        <tr>
          <td>
            <div class="student-cell-name">
              <span class="student-avatar-sm">${(grade.studentName || '?').charAt(0)}</span>
              <span>${grade.studentName || '-'}</span>
            </div>
          </td>
          <td>${grade.examName || '-'}</td>
          <td>${grade.subject || '-'}</td>
          <td dir="ltr" class="text-end">
            <strong>${grade.score}</strong> / ${grade.total}
          </td>
          <td>
            <strong style="color: ${pctColor}">${percentage}%</strong>
          </td>
          <td><span class="badge ${ratingBadge}">${rating}</span></td>
          <td>${DemoData.formatDate(grade.date)}</td>
          <td>${grade.notes || '-'}</td>
          <td>
            <div class="action-buttons">
              <button class="btn btn-sm btn-outline-warning" data-action="edit" data-id="${grade.id}" title="تعديل">
                <i class="fas fa-pen"></i>
              </button>
              <button class="btn btn-sm btn-outline-danger" data-action="delete" data-id="${grade.id}" title="حذف">
                <i class="fas fa-trash"></i>
              </button>
            </div>
          </td>
        </tr>
      `;
    }).join('');
  }

  // --------------------------------------------------
  // فتح نافذة إضافة درجة
  // --------------------------------------------------

  function openAddModal() {
    editingId = null;

    // إعادة تعيين النموذج
    const form = document.getElementById('form-grade');
    if (form) form.reset();

    // تعيين تاريخ اليوم
    const dateInput = document.getElementById('grade-date');
    if (dateInput) dateInput.value = DemoData.getTodayDate();

    // إخفاء معرف التعديل
    const idInput = document.getElementById('grade-id');
    if (idInput) idInput.value = '';

    // تعبئة قائمة الطلاب
    const studentSelect = document.getElementById('grade-student');
    if (studentSelect) {
      const students = StorageManager.get('sm_students') || [];
      const groupedStudents = {};

      students.forEach(s => {
        const gName = GroupsModule.getGroupName(s.groupId);
        if (!groupedStudents[gName]) groupedStudents[gName] = [];
        groupedStudents[gName].push(s);
      });

      let html = '<option value="">اختر طالب</option>';
      Object.entries(groupedStudents).forEach(function (entry) {
        var groupName = entry[0];
        var list = entry[1];
        html += '<optgroup label="' + groupName + '">';
        list.forEach(function (s) {
          html += '<option value="' + s.id + '">' + s.name + '</option>';
        });
        html += '</optgroup>';
      });
      studentSelect.innerHTML = html;
    }

    // عنوان النافذة
    const titleEl = document.getElementById('modal-grade-title');
    if (titleEl) titleEl.textContent = 'تسجيل درجة جديدة';

    App.openModal('modal-grade');
  }

  // --------------------------------------------------
  // حفظ درجة
  // --------------------------------------------------

  function saveGrade() {
    const studentId = (document.getElementById('grade-student') || {}).value || '';
    const examName = (document.getElementById('grade-exam') || {}).value || '';
    const subject = (document.getElementById('grade-subject') || {}).value || '';
    const scoreRaw = (document.getElementById('grade-score') || {}).value || '';
    const totalRaw = (document.getElementById('grade-total') || {}).value || '';
    const date = (document.getElementById('grade-date') || {}).value || '';
    const notes = (document.getElementById('grade-notes') || {}).value || '';

    const score = parseFloat(scoreRaw);
    const total = parseFloat(totalRaw);

    // التحقق من الحقول المطلوبة
    if (!studentId) {
      App.showToast('يرجى اختيار الطالب', 'error');
      return;
    }

    if (!subject) {
      App.showToast('يرجى إدخال المادة', 'error');
      return;
    }

    if (isNaN(score) || isNaN(total)) {
      App.showToast('يرجى إدخال الدرجة والدرجة الكلية بشكل صحيح', 'error');
      return;
    }

    if (score < 0 || total <= 0) {
      App.showToast('الدرجة يجب أن تكون 0 أو أكبر، والدرجة الكلية يجب أن تكون أكبر من 0', 'error');
      return;
    }

    if (score > total) {
      App.showToast('الدرجة المحصلة لا يمكن أن تتجاوز الدرجة الكلية', 'error');
      return;
    }

    // حساب النسبة والتقدير
    const percentage = DemoData.calculatePercentage(score, total);
    const rating = DemoData.calculateRating(score, total);

    const grades = StorageManager.get('sm_grades') || [];
    const studentName = StudentsModule.getStudentName(studentId);

    // الحصول على معرف المجموعة
    const students = StorageManager.get('sm_students') || [];
    const studentData = students.find(s => s.id === studentId);
    const groupId = studentData ? studentData.groupId : '';

    if (editingId) {
      // تعديل درجة موجودة
      const index = grades.findIndex(g => g.id === editingId);
      if (index !== -1) {
        grades[index] = {
          ...grades[index],
          studentId: studentId,
          studentName: studentName,
          groupId: groupId,
          subject: subject,
          examName: examName || grades[index].examName,
          score: score,
          total: total,
          percentage: percentage,
          rating: rating,
          date: date || grades[index].date,
          notes: notes,
        };
      }

      StorageManager.set('sm_grades', grades);
      App.addActivity(
        'تعديل درجة: ' + studentName + ' - ' + subject + ' (' + score + '/' + total + ')'
      );
      App.showToast('تم تعديل الدرجة بنجاح', 'success');
    } else {
      // إضافة درجة جديدة
      grades.push({
        id: DemoData.generateId(),
        studentId: studentId,
        studentName: studentName,
        groupId: groupId,
        subject: subject,
        examName: examName || '-',
        score: score,
        total: total,
        percentage: percentage,
        rating: rating,
        date: date || DemoData.getTodayDate(),
        notes: notes,
      });

      StorageManager.set('sm_grades', grades);
      App.addActivity(
        'تسجيل درجة: ' + studentName + ' - ' + subject + ' (' + score + '/' + total + ')' +
        (examName ? ' - ' + examName : ' - بدون اختبار')
      );
      App.showToast('تم تسجيل الدرجة بنجاح', 'success');
    }

    App.closeModal('modal-grade');
    editingId = null;
    render();
  }

  // --------------------------------------------------
  // تعديل درجة
  // --------------------------------------------------

  function editGrade(gradeId) {
    const grades = StorageManager.get('sm_grades') || [];
    const grade = grades.find(g => g.id === gradeId);

    if (!grade) {
      App.showToast('لم يتم العثور على سجل الدرجة', 'error');
      return;
    }

    editingId = gradeId;

    // تعبئة قائمة الطلاب
    const studentSelect = document.getElementById('grade-student');
    if (studentSelect) {
      const students = StorageManager.get('sm_students') || [];
      const groupedStudents = {};

      students.forEach(s => {
        const gName = GroupsModule.getGroupName(s.groupId);
        if (!groupedStudents[gName]) groupedStudents[gName] = [];
        groupedStudents[gName].push(s);
      });

      let html = '<option value="">اختر طالب</option>';
      Object.entries(groupedStudents).forEach(function (entry) {
        var groupName = entry[0];
        var list = entry[1];
        html += '<optgroup label="' + groupName + '">';
        list.forEach(function (s) {
          html += '<option value="' + s.id + '">' + s.name + '</option>';
        });
        html += '</optgroup>';
      });
      studentSelect.innerHTML = html;
    }

    // تعبئة الحقول ببيانات الدرجة
    const idInput = document.getElementById('grade-id');
    if (idInput) idInput.value = grade.id;

    if (studentSelect) studentSelect.value = grade.studentId;

    const examInput = document.getElementById('grade-exam');
    if (examInput) examInput.value = grade.examName || '';

    const subjectInput = document.getElementById('grade-subject');
    if (subjectInput) subjectInput.value = grade.subject || '';

    const scoreInput = document.getElementById('grade-score');
    if (scoreInput) scoreInput.value = grade.score;

    const totalInput = document.getElementById('grade-total');
    if (totalInput) totalInput.value = grade.total;

    const dateInput = document.getElementById('grade-date');
    if (dateInput) dateInput.value = grade.date || '';

    const notesInput = document.getElementById('grade-notes');
    if (notesInput) notesInput.value = grade.notes || '';

    // عنوان النافذة
    const titleEl = document.getElementById('modal-grade-title');
    if (titleEl) titleEl.textContent = 'تعديل الدرجة';

    App.openModal('modal-grade');
  }

  // --------------------------------------------------
  // حذف درجة
  // --------------------------------------------------

  function deleteGrade(gradeId) {
    const grades = StorageManager.get('sm_grades') || [];
    const grade = grades.find(g => g.id === gradeId);

    if (!grade) return;

    App.showConfirm(
      'هل أنت متأكد أنك تريد حذف درجة "' + grade.studentName +
      '" في مادة "' + grade.subject + '" (' + grade.score + '/' + grade.total + ')؟',
      function () {
        const updated = grades.filter(g => g.id !== gradeId);
        StorageManager.set('sm_grades', updated);
        App.addActivity(
          'حذف درجة: ' + grade.studentName + ' - ' + grade.subject +
          ' (' + grade.score + '/' + grade.total + ')'
        );
        App.showToast('تم حذف الدرجة بنجاح', 'success');
        render();
      }
    );
  }

  // --------------------------------------------------
  // مساعدات عامة
  // --------------------------------------------------

  function getStudentGrades(studentId) {
    const grades = StorageManager.get('sm_grades') || [];
    return grades.filter(g => g.studentId === studentId);
  }

  function getStudentAverage(studentId) {
    const studentGrades = getStudentGrades(studentId);
    if (studentGrades.length === 0) return 0;

    const totalPercentage = studentGrades.reduce(function (sum, g) {
      const p = g.percentage || DemoData.calculatePercentage(g.score, g.total);
      return sum + p;
    }, 0);

    return Math.round(totalPercentage / studentGrades.length);
  }

  // --------------------------------------------------
  // الواجهة العامة
  // --------------------------------------------------

  return {
    init: init,
    render: render,
    openAddModal: openAddModal,
    saveGrade: saveGrade,
    editGrade: editGrade,
    deleteGrade: deleteGrade,
    getStudentGrades: getStudentGrades,
    getStudentAverage: getStudentAverage,
  };
})();
