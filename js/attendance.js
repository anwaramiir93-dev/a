/**
 * AttendanceModule — وحدة إدارة الحضور والغياب
 */
const AttendanceModule = (() => {
  let editingId = null;
  let isGroupMode = false;

  // --------------------------------------------------
  // التهيئة
  // --------------------------------------------------

  function init() {
    bindEvents();
    render();
  }

  function bindEvents() {
    const filterDate = document.getElementById('filter-attendance-date');
    if (filterDate) filterDate.addEventListener('change', render);

    const filterGroup = document.getElementById('filter-attendance-group');
    if (filterGroup) filterGroup.addEventListener('change', render);

    const filterStatus = document.getElementById('filter-attendance-status');
    if (filterStatus) filterStatus.addEventListener('change', render);

    const btnSave = document.getElementById('btn-save-attendance');
    if (btnSave) btnSave.addEventListener('click', saveStudent);

    const tbody = document.getElementById('attendance-tbody');
    if (tbody) tbody.addEventListener('click', handleTableAction);
  }

  // --------------------------------------------------
  // تفويض أحداث الجدول
  // --------------------------------------------------

  function handleTableAction(e) {
    const btn = e.target.closest('[data-action]');
    if (!btn) return;

    const action = btn.dataset.action;
    const id = btn.dataset.id;

    if (action === 'edit') {
      const newStatus = btn.dataset.status;
      editAttendance(id, newStatus);
    } else if (action === 'delete') {
      deleteAttendance(id);
    }
  }

  // --------------------------------------------------
  // شارة الحالة
  // --------------------------------------------------

  function getStatusBadge(status) {
    const map = {
      'حاضر': 'badge-success',
      'غائب': 'badge-danger',
      'متأخر': 'badge-warning',
      'إجازة': 'badge-info',
    };
    return map[status] || 'badge-secondary';
  }

  // --------------------------------------------------
  // العرض
  // --------------------------------------------------

  function render() {
    const attendance = StorageManager.get('sm_attendance') || [];
    const tbody = document.getElementById('attendance-tbody');
    const emptyEl = document.getElementById('attendance-empty');

    const filterDate = document.getElementById('filter-attendance-date');
    const filterGroup = document.getElementById('filter-attendance-group');
    const filterStatus = document.getElementById('filter-attendance-status');

    const fDate = filterDate ? filterDate.value : '';
    const fGroup = filterGroup ? filterGroup.value : '';
    const fStatus = filterStatus ? filterStatus.value : '';

    // تصفية السجلات
    let filtered = [...attendance];

    if (fDate) {
      filtered = filtered.filter(r => r.date === fDate);
    }

    if (fGroup) {
      filtered = filtered.filter(r => r.groupId === fGroup);
    }

    if (fStatus) {
      filtered = filtered.filter(r => r.status === fStatus);
    }

    // ترتيب حسب التاريخ ثم الوقت (الأحدث أولاً)
    filtered.sort((a, b) => {
      if (b.date !== a.date) return b.date.localeCompare(a.date);
      return (b.timeIn || '').localeCompare(a.timeIn || '');
    });

    // تحديث الإحصائيات بناءً على التاريخ المُفلتر (أو اليوم)
    const statsDate = fDate || DemoData.getTodayDate();
    const statsRecords = attendance.filter(r => r.date === statsDate);
    updateStats(statsRecords);

    if (!tbody) return;

    if (filtered.length === 0) {
      tbody.innerHTML = '';
      if (emptyEl) emptyEl.style.display = 'flex';
      return;
    }

    if (emptyEl) emptyEl.style.display = 'none';

    tbody.innerHTML = filtered.map(record => {
      const groupName = GroupsModule.getGroupName(record.groupId);
      const badgeClass = getStatusBadge(record.status);

      // خيارات تغيير الحالة (الأوضاع الأخرى)
      const allStatuses = ['حاضر', 'غائب', 'متأخر', 'إجازة'];
      const otherStatuses = allStatuses.filter(s => s !== record.status);
      const statusOptions = otherStatuses
        .map(s => `<option value="${s}">${s}</option>`)
        .join('');

      return `
        <tr>
          <td>${DemoData.formatDate(record.date)}</td>
          <td>
            <div class="student-cell-name">
              <span class="student-avatar-sm">${(record.studentName || '?').charAt(0)}</span>
              <span>${record.studentName || '-'}</span>
            </div>
          </td>
          <td>${groupName}</td>
          <td><span class="badge ${badgeClass}">${record.status}</span></td>
          <td dir="ltr" class="text-end">${record.timeIn || '-'}</td>
          <td dir="ltr" class="text-end">${record.timeOut || '-'}</td>
          <td>${record.notes || '-'}</td>
          <td>
            <div class="action-buttons">
              <select class="form-select form-select-sm"
                      style="width:auto;display:inline-block;"
                      onchange="AttendanceModule.editAttendance('${record.id}', this.value)"
                      title="تغيير الحالة">
                <option value="">${record.status}</option>
                ${statusOptions}
              </select>
              <button class="btn btn-sm btn-outline-danger"
                      data-action="delete"
                      data-id="${record.id}"
                      title="حذف">
                <i class="fas fa-trash"></i>
              </button>
            </div>
          </td>
        </tr>
      `;
    }).join('');
  }

  // --------------------------------------------------
  // تحديث عدادات الإحصائيات
  // --------------------------------------------------

  function updateStats(records) {
    const present = records.filter(r => r.status === 'حاضر').length;
    const absent = records.filter(r => r.status === 'غائب').length;
    const late = records.filter(r => r.status === 'متأخر').length;
    const leave = records.filter(r => r.status === 'إجازة').length;

    const elPresent = document.getElementById('attendance-stat-present');
    const elAbsent = document.getElementById('attendance-stat-absent');
    const elLate = document.getElementById('attendance-stat-late');
    const elLeave = document.getElementById('attendance-stat-leave');

    if (elPresent) elPresent.textContent = present;
    if (elAbsent) elAbsent.textContent = absent;
    if (elLate) elLate.textContent = late;
    if (elLeave) elLeave.textContent = leave;
  }

  // --------------------------------------------------
  // فتح نافذة إضافة الحضور
  // --------------------------------------------------

  function openAddModal() {
    editingId = null;
    isGroupMode = false;

    // إعادة تعيين النموذج
    const form = document.getElementById('form-attendance');
    if (form) form.reset();

    // تعيين تاريخ اليوم
    const dateInput = document.getElementById('attendance-date');
    if (dateInput) dateInput.value = DemoData.getTodayDate();

    // إخفاء معرف التعديل
    const idInput = document.getElementById('attendance-id');
    if (idInput) idInput.value = '';

    // تعبئة قائمة الطلاب (مجمّعة حسب المجموعة عبر optgroup)
    const studentSelect = document.getElementById('attendance-student');
    if (studentSelect) {
      const students = StorageManager.get('sm_students') || [];
      const groupedStudents = {};

      students.forEach(s => {
        if (s.status === 'نشط') {
          const gName = GroupsModule.getGroupName(s.groupId);
          if (!groupedStudents[gName]) groupedStudents[gName] = [];
          groupedStudents[gName].push(s);
        }
      });

      let html = '<option value="">اختر طالب</option>';
      Object.entries(groupedStudents).forEach(([groupName, list]) => {
        html += `<optgroup label="${groupName}">`;
        list.forEach(s => {
          html += `<option value="${s.id}">${s.name}</option>`;
        });
        html += '</optgroup>';
      });
      studentSelect.innerHTML = html;
    }

    // تعبئة قائمة المجموعات
    const groupSelect = document.getElementById('attendance-group');
    if (groupSelect) {
      GroupsModule.populateGroupDropdown(groupSelect, false);
    }

    // ربط خانة تبديل وضع المجموعة
    const groupToggle = document.getElementById('attendance-group-toggle');
    const groupSelectWrapper = document.getElementById('attendance-group-select-wrapper');

    if (groupToggle) {
      groupToggle.checked = false;
      // إزالة المستمع القديم
      const newToggle = groupToggle.cloneNode(true);
      groupToggle.parentNode.replaceChild(newToggle, groupToggle);

      newToggle.addEventListener('change', function () {
        isGroupMode = this.checked;
        if (groupSelectWrapper) {
          groupSelectWrapper.style.display = isGroupMode ? '' : 'none';
        }
        // إخفاء/إظهار حقل الطالب حسب الوضع
        const studentEl = document.getElementById('attendance-student');
        if (studentEl) {
          studentEl.closest('.form-group, .mb-3, div').style.display = isGroupMode ? 'none' : '';
        }
        // إخفاء حالة الطالب عند تسجيل مجموعة (الكل حاضر افتراضياً)
        const statusEl = document.getElementById('attendance-status');
        if (statusEl) {
          statusEl.closest('.form-group, .mb-3, div').style.display = isGroupMode ? 'none' : '';
        }
      });
    }

    // إخفاء حقل المجموعة وإظهار حقل الطالب عند الفتح
    if (groupSelectWrapper) groupSelectWrapper.style.display = 'none';

    // عنوان النافذة
    const titleEl = document.getElementById('modal-attendance-title');
    if (titleEl) titleEl.textContent = 'تسجيل حضور جديد';

    App.openModal('modal-attendance');
  }

  // --------------------------------------------------
  // حفظ الحضور (فردي أو مجموعة)
  // --------------------------------------------------

  function saveStudent() {
    const attendance = StorageManager.get('sm_attendance') || [];

    const date = (document.getElementById('attendance-date') || {}).value || '';
    const notes = (document.getElementById('attendance-notes') || {}).value || '';

    if (!date) {
      App.showToast('يرجى تحديد التاريخ', 'error');
      return;
    }

    const now = new Date();
    const timeStr = String(now.getHours()).padStart(2, '0') + ':' + String(now.getMinutes()).padStart(2, '0');

    if (isGroupMode) {
      // --- وضع تسجيل مجموعة كاملة ---
      const groupId = (document.getElementById('attendance-group') || {}).value || '';

      if (!groupId) {
        App.showToast('يرجى اختيار المجموعة', 'error');
        return;
      }

      const students = StorageManager.get('sm_students') || [];
      const activeStudents = students.filter(s => s.groupId === groupId && s.status === 'نشط');

      if (activeStudents.length === 0) {
        App.showToast('لا يوجد طلاب نشطون في هذه المجموعة', 'error');
        return;
      }

      let addedCount = 0;
      activeStudents.forEach(student => {
        const exists = attendance.find(r => r.studentId === student.id && r.date === date);
        if (!exists) {
          attendance.push({
            id: DemoData.generateId(),
            studentId: student.id,
            studentName: student.name,
            groupId: groupId,
            date: date,
            status: 'حاضر',
            timeIn: timeStr,
            timeOut: '',
            notes: notes,
          });
          addedCount++;
        }
      });

      StorageManager.set('sm_attendance', attendance);
      App.addActivity(
        'تسجيل حضور مجموعة: ' + GroupsModule.getGroupName(groupId) +
        ' - ' + addedCount + ' طالب (' + DemoData.formatDate(date) + ')'
      );
      App.showToast('تم تسجيل حضور ' + addedCount + ' طالب بنجاح', 'success');
    } else {
      // --- وضع تسجيل فردي ---
      const studentId = (document.getElementById('attendance-student') || {}).value || '';
      const status = (document.getElementById('attendance-status') || {}).value || '';
      const timeIn = (document.getElementById('attendance-time-in') || {}).value || '';
      const timeOut = (document.getElementById('attendance-time-out') || {}).value || '';

      if (!studentId) {
        App.showToast('يرجى اختيار الطالب', 'error');
        return;
      }

      if (!status) {
        App.showToast('يرجى تحديد حالة الحضور', 'error');
        return;
      }

      // التحقق من عدم وجود سجل مكرر
      const exists = attendance.find(r => r.studentId === studentId && r.date === date);
      if (exists) {
        App.showToast('يوجد سجل حضور لهذا الطالب في هذا التاريخ بالفعل', 'error');
        return;
      }

      const studentName = StudentsModule.getStudentName(studentId);
      const students = StorageManager.get('sm_students') || [];
      const studentData = students.find(s => s.id === studentId);
      const groupId = studentData ? studentData.groupId : '';

      attendance.push({
        id: DemoData.generateId(),
        studentId: studentId,
        studentName: studentName,
        groupId: groupId,
        date: date,
        status: status,
        timeIn: status !== 'غائب' ? (timeIn || timeStr) : '',
        timeOut: timeOut || '',
        notes: notes,
      });

      StorageManager.set('sm_attendance', attendance);
      App.addActivity(
        'تسجيل حضور: ' + studentName + ' - ' + status + ' (' + DemoData.formatDate(date) + ')'
      );
      App.showToast('تم تسجيل الحضور بنجاح', 'success');
    }

    App.closeModal('modal-attendance');
    isGroupMode = false;
    render();
  }

  // --------------------------------------------------
  // تعديل حالة الحضور (تغيير مباشر)
  // --------------------------------------------------

  function editAttendance(recordId, newStatus) {
    if (!newStatus) return;

    const attendance = StorageManager.get('sm_attendance') || [];
    const index = attendance.findIndex(r => r.id === recordId);

    if (index === -1) {
      App.showToast('لم يتم العثور على سجل الحضور', 'error');
      return;
    }

    const oldStatus = attendance[index].status;
    attendance[index].status = newStatus;

    // تحديث وقت الدخول عند التحول من غائب إلى حاضر/متأخر
    if (oldStatus === 'غائب' && (newStatus === 'حاضر' || newStatus === 'متأخر')) {
      const now = new Date();
      attendance[index].timeIn =
        String(now.getHours()).padStart(2, '0') + ':' + String(now.getMinutes()).padStart(2, '0');
    }

    // مسح الأوقات عند الغياب أو الإجازة
    if (newStatus === 'غائب' || newStatus === 'إجازة') {
      attendance[index].timeIn = '';
      attendance[index].timeOut = '';
    }

    StorageManager.set('sm_attendance', attendance);
    App.addActivity(
      'تعديل حالة الحضور: ' + attendance[index].studentName +
      ' من ' + oldStatus + ' إلى ' + newStatus
    );
    App.showToast('تم تحديث حالة الحضور', 'success');
    render();
  }

  // --------------------------------------------------
  // حذف سجل الحضور
  // --------------------------------------------------

  function deleteAttendance(recordId) {
    const attendance = StorageManager.get('sm_attendance') || [];
    const record = attendance.find(r => r.id === recordId);

    if (!record) return;

    App.showConfirm(
      'هل أنت متأكد أنك تريد حذف سجل حضور "' + record.studentName +
      '" بتاريخ ' + DemoData.formatDate(record.date) + '؟',
      function () {
        const updated = attendance.filter(r => r.id !== recordId);
        StorageManager.set('sm_attendance', updated);
        App.addActivity(
          'حذف سجل حضور: ' + record.studentName +
          ' (' + DemoData.formatDate(record.date) + ')'
        );
        App.showToast('تم حذف سجل الحضور', 'success');
        render();
      }
    );
  }

  // --------------------------------------------------
  // مساعدات عامة
  // --------------------------------------------------

  function getTodayAttendance() {
    const attendance = StorageManager.get('sm_attendance') || [];
    const today = DemoData.getTodayDate();
    return attendance.filter(r => r.date === today);
  }

  function getAttendanceRate(studentId) {
    const records = getStudentAttendance(studentId);
    if (records.length === 0) return 0;

    const presentCount = records.filter(r => r.status === 'حاضر').length;
    return Math.round((presentCount / records.length) * 100);
  }

  function getStudentAttendance(studentId) {
    const attendance = StorageManager.get('sm_attendance') || [];
    return attendance.filter(r => r.studentId === studentId);
  }

  // --------------------------------------------------
  // الواجهة العامة
  // --------------------------------------------------

  return {
    init: init,
    render: render,
    openAddModal: openAddModal,
    saveStudent: saveStudent,
    deleteAttendance: deleteAttendance,
    editAttendance: editAttendance,
    getTodayAttendance: getTodayAttendance,
    getAttendanceRate: getAttendanceRate,
    getStudentAttendance: getStudentAttendance,
  };
})();
