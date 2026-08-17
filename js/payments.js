/**
 * المدفوعات - Payments Module
 * إدارة مدفوعات الطلاب ومتابعتها
 */
const PaymentsModule = (() => {

  const STATUS_BADGE = {
    'مدفوع': 'badge-success',
    'غير مدفوع': 'badge-danger',
    'مدفوع جزئياً': 'badge-warning'
  };

  function getList() {
    return StorageManager.get('sm_payments') || [];
  }

  function saveList(data) {
    StorageManager.set('sm_payments', data);
  }

  function getStudents() {
    return StorageManager.get('sm_students') || [];
  }

  function formatNumber(num) {
    if (!num && num !== 0) return '0';
    return Number(num).toLocaleString('ar-EG');
  }

  function getCurrentMonth() {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
  }

  function updateStats(filtered) {
    const totalPaid = filtered
      .filter(p => p.status === 'مدفوع')
      .reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
    const totalRemaining = filtered
      .filter(p => p.status === 'غير مدفوع')
      .reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
    const overdueCount = filtered
      .filter(p => p.status === 'غير مدفوع' && p.date && p.date < DemoData.getTodayDate())
      .length;
    const totalCount = filtered.length;

    document.getElementById('payment-stat-paid').textContent = formatNumber(totalPaid);
    document.getElementById('payment-stat-remaining').textContent = formatNumber(totalRemaining);
    document.getElementById('payment-stat-overdue').textContent = formatNumber(overdueCount);
    document.getElementById('payment-stat-count').textContent = formatNumber(totalCount);
  }

  function render() {
    const list = getList();
    const groupFilter = document.getElementById('filter-payment-group').value;
    const statusFilter = document.getElementById('filter-payment-status').value;
    const monthFilter = document.getElementById('filter-payment-month').value;

    let filtered = list;
    if (groupFilter) {
      const students = getStudents().filter(s => s.groupId === groupFilter);
      const studentIds = students.map(s => s.id);
      filtered = filtered.filter(p => studentIds.includes(p.studentId));
    }
    if (statusFilter) {
      filtered = filtered.filter(p => p.status === statusFilter);
    }
    if (monthFilter) {
      filtered = filtered.filter(p => p.month === monthFilter);
    }

    updateStats(filtered);

    const tbody = document.getElementById('payments-tbody');
    const empty = document.getElementById('payments-empty');

    if (filtered.length === 0) {
      tbody.innerHTML = '';
      empty.style.display = 'block';
      return;
    }

    empty.style.display = 'none';

    tbody.innerHTML = filtered.map(p => {
      const studentName = StudentsModule.getStudentName(p.studentId);
      const badgeClass = STATUS_BADGE[p.status] || 'badge-info';
      return `
        <tr data-id="${p.id}">
          <td>${studentName}</td>
          <td>${formatNumber(p.amount)}</td>
          <td>${p.month || '-'}</td>
          <td>${DemoData.formatDate(p.date)}</td>
          <td>${p.type || '-'}</td>
          <td><span class="badge ${badgeClass}">${p.status}</span></td>
          <td>${p.notes || '-'}</td>
          <td>
            <div class="actions">
              <button class="btn btn-sm btn-outline" data-action="edit" data-id="${p.id}" title="تعديل">
                <i class="fas fa-edit"></i>
              </button>
              <button class="btn btn-sm btn-outline btn-danger" data-action="delete" data-id="${p.id}" title="حذف">
                <i class="fas fa-trash"></i>
              </button>
            </div>
          </td>
        </tr>
      `;
    }).join('');

    tbody.querySelectorAll('[data-action]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const action = btn.getAttribute('data-action');
        const id = btn.getAttribute('data-id');
        if (action === 'edit') editPayment(id);
        else if (action === 'delete') deletePayment(id);
      });
    });
  }

  function openAddModal() {
    document.getElementById('modal-payment-title').textContent = 'إضافة دفعة جديدة';
    document.getElementById('payment-id').value = '';
    document.getElementById('payment-amount').value = '';
    document.getElementById('payment-type').value = '';
    document.getElementById('payment-status').value = 'غير مدفوع';
    document.getElementById('payment-notes').value = '';
    document.getElementById('payment-date').value = DemoData.getTodayDate();
    document.getElementById('payment-month').value = getCurrentMonth();

    const studentSelect = document.getElementById('payment-student');
    studentSelect.innerHTML = '<option value="">-- اختر الطالب --</option>';
    const students = getStudents();
    students.forEach(s => {
      const opt = document.createElement('option');
      opt.value = s.id;
      opt.textContent = s.name;
      studentSelect.appendChild(opt);
    });

    App.openModal('modal-payment');
  }

  function savePayment() {
    const studentId = document.getElementById('payment-student').value;
    const amount = document.getElementById('payment-amount').value;

    if (!studentId) {
      App.showToast('يرجى اختيار الطالب', 'error');
      return;
    }
    if (!amount || Number(amount) <= 0) {
      App.showToast('يرجى إدخال مبلغ صحيح', 'error');
      return;
    }

    const list = getList();
    const id = document.getElementById('payment-id').value;
    const studentName = StudentsModule.getStudentName(studentId);

    const paymentData = {
      studentId: studentId,
      amount: Number(amount),
      month: document.getElementById('payment-month').value,
      date: document.getElementById('payment-date').value,
      type: document.getElementById('payment-type').value.trim(),
      status: document.getElementById('payment-status').value,
      notes: document.getElementById('payment-notes').value.trim()
    };

    if (id) {
      const idx = list.findIndex(p => p.id === id);
      if (idx !== -1) {
        list[idx] = { ...list[idx], ...paymentData };
        App.addActivity('تم تعديل دفعة الطالب: ' + studentName, 'edit');
        App.showToast('تم تعديل الدفعة بنجاح', 'success');
      }
    } else {
      const newPayment = {
        id: DemoData.generateId(),
        ...paymentData,
        createdAt: DemoData.getTodayDate()
      };
      list.unshift(newPayment);
      App.addActivity('تم إضافة دفعة جديدة للطالب: ' + studentName, 'add');
      App.showToast('تم إضافة الدفعة بنجاح', 'success');
    }

    saveList(list);
    App.closeModal('modal-payment');
    render();
  }

  function editPayment(paymentId) {
    const list = getList();
    const payment = list.find(p => p.id === paymentId);
    if (!payment) return;

    document.getElementById('modal-payment-title').textContent = 'تعديل الدفعة';
    document.getElementById('payment-id').value = payment.id;
    document.getElementById('payment-amount').value = payment.amount || '';
    document.getElementById('payment-type').value = payment.type || '';
    document.getElementById('payment-status').value = payment.status || 'غير مدفوع';
    document.getElementById('payment-notes').value = payment.notes || '';
    document.getElementById('payment-date').value = payment.date || DemoData.getTodayDate();
    document.getElementById('payment-month').value = payment.month || getCurrentMonth();

    const studentSelect = document.getElementById('payment-student');
    studentSelect.innerHTML = '<option value="">-- اختر الطالب --</option>';
    const students = getStudents();
    students.forEach(s => {
      const opt = document.createElement('option');
      opt.value = s.id;
      opt.textContent = s.name;
      studentSelect.appendChild(opt);
    });
    studentSelect.value = payment.studentId || '';

    App.openModal('modal-payment');
  }

  function deletePayment(paymentId) {
    App.showConfirm('هل أنت متأكد من حذف هذه الدفعة؟', () => {
      let list = getList();
      list = list.filter(p => p.id !== paymentId);
      saveList(list);
      App.addActivity('تم حذف دفعة', 'delete');
      App.showToast('تم حذف الدفعة بنجاح', 'success');
      render();
    });
  }

  function init() {
    document.getElementById('filter-payment-group').addEventListener('change', render);
    document.getElementById('filter-payment-status').addEventListener('change', render);
    document.getElementById('filter-payment-month').addEventListener('change', render);
    document.getElementById('btn-save-payment').addEventListener('click', savePayment);
    document.getElementById('form-payment').addEventListener('submit', (e) => {
      e.preventDefault();
      savePayment();
    });
    render();
  }

  return {
    init,
    render,
    openAddModal,
    savePayment,
    editPayment,
    deletePayment
  };
})();
