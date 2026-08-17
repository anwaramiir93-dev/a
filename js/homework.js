/**
 * واجبات الطلاب - Homework Module
 * إدارة الواجبات المنزلية وتتبع حالتها
 */
const HomeworkModule = (() => {

  const STATUS_CYCLE = ['نشط', 'منتهي', 'متأخر'];
  const STATUS_BADGE = {
    'نشط': 'badge-info',
    'منتهي': 'badge-success',
    'متأخر': 'badge-warning'
  };
  const DESC_MAX = 80;

  function getList() {
    return StorageManager.get('sm_homework') || [];
  }

  function saveList(data) {
    StorageManager.set('sm_homework', data);
  }

  function truncate(text, max) {
    if (!text) return '';
    return text.length > max ? text.substring(0, max) + '...' : text;
  }

  function nextStatus(current) {
    const idx = STATUS_CYCLE.indexOf(current);
    return STATUS_CYCLE[(idx + 1) % STATUS_CYCLE.length];
  }

  function render() {
    const list = getList();
    const groupFilter = document.getElementById('filter-homework-group').value;
    const statusFilter = document.getElementById('filter-homework-status').value;

    let filtered = list;
    if (groupFilter) {
      filtered = filtered.filter(hw => hw.groupId === groupFilter);
    }
    if (statusFilter) {
      filtered = filtered.filter(hw => hw.status === statusFilter);
    }

    const container = document.getElementById('homework-list');
    const empty = document.getElementById('homework-empty');

    if (filtered.length === 0) {
      container.innerHTML = '';
      container.style.display = 'none';
      empty.style.display = 'block';
      return;
    }

    empty.style.display = 'none';
    container.style.display = 'flex';

    container.innerHTML = filtered.map(hw => {
      const groupName = GroupsModule.getGroupName(hw.groupId);
      const badgeClass = STATUS_BADGE[hw.status] || 'badge-info';
      const desc = truncate(hw.description, DESC_MAX);

      return `
        <div class="homework-card" data-id="${hw.id}">
          <div class="homework-info">
            <h3>${hw.title}</h3>
            <p class="homework-desc">${desc}</p>
            <div class="homework-meta">
              <span><strong>المجموعة:</strong> ${groupName}</span>
              <span><strong>تاريخ الإنشاء:</strong> ${DemoData.formatDate(hw.createdAt)}</span>
              <span><strong>تاريخ التسليم:</strong> ${DemoData.formatDate(hw.dueDate)}</span>
            </div>
            <span class="badge ${badgeClass}">${hw.status}</span>
          </div>
          <div class="actions">
            <button class="btn btn-sm btn-outline" data-action="toggle-status" data-id="${hw.id}" title="تغيير الحالة">
              <i class="fas fa-sync-alt"></i>
            </button>
            <button class="btn btn-sm btn-outline" data-action="edit" data-id="${hw.id}" title="تعديل">
              <i class="fas fa-edit"></i>
            </button>
            <button class="btn btn-sm btn-outline btn-danger" data-action="delete" data-id="${hw.id}" title="حذف">
              <i class="fas fa-trash"></i>
            </button>
          </div>
        </div>
      `;
    }).join('');

    container.querySelectorAll('[data-action]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const action = btn.getAttribute('data-action');
        const id = btn.getAttribute('data-id');
        if (action === 'edit') editHomework(id);
        else if (action === 'delete') deleteHomework(id);
        else if (action === 'toggle-status') toggleStatus(id);
      });
    });
  }

  function openAddModal() {
    document.getElementById('modal-homework-title').textContent = 'إضافة واجب جديد';
    document.getElementById('homework-id').value = '';
    document.getElementById('homework-title').value = '';
    document.getElementById('homework-description').value = '';
    document.getElementById('homework-status').value = 'نشط';
    document.getElementById('homework-due-date').value = '';

    const groupSelect = document.getElementById('homework-group');
    GroupsModule.populateGroupDropdown(groupSelect, false);

    App.openModal('modal-homework');
  }

  function saveHomework() {
    const title = document.getElementById('homework-title').value.trim();
    if (!title) {
      App.showToast('يرجى إدخال عنوان الواجب', 'error');
      return;
    }

    const list = getList();
    const id = document.getElementById('homework-id').value;
    const now = DemoData.getTodayDate();

    const hwData = {
      title: title,
      description: document.getElementById('homework-description').value.trim(),
      groupId: document.getElementById('homework-group').value,
      status: document.getElementById('homework-status').value,
      dueDate: document.getElementById('homework-due-date').value
    };

    if (id) {
      const idx = list.findIndex(hw => hw.id === id);
      if (idx !== -1) {
        list[idx] = { ...list[idx], ...hwData };
        App.addActivity('تم تعديل الواجب: ' + title, 'edit');
        App.showToast('تم تعديل الواجب بنجاح', 'success');
      }
    } else {
      const newHw = {
        id: DemoData.generateId(),
        ...hwData,
        createdAt: now
      };
      list.unshift(newHw);
      App.addActivity('تم إضافة واجب جديد: ' + title, 'add');
      App.showToast('تم إضافة الواجب بنجاح', 'success');
    }

    saveList(list);
    App.closeModal('modal-homework');
    render();
  }

  function editHomework(hwId) {
    const list = getList();
    const hw = list.find(h => h.id === hwId);
    if (!hw) return;

    document.getElementById('modal-homework-title').textContent = 'تعديل الواجب';
    document.getElementById('homework-id').value = hw.id;
    document.getElementById('homework-title').value = hw.title || '';
    document.getElementById('homework-description').value = hw.description || '';
    document.getElementById('homework-status').value = hw.status || 'نشط';
    document.getElementById('homework-due-date').value = hw.dueDate || '';

    const groupSelect = document.getElementById('homework-group');
    GroupsModule.populateGroupDropdown(groupSelect, false);
    groupSelect.value = hw.groupId || '';

    App.openModal('modal-homework');
  }

  function deleteHomework(hwId) {
    App.showConfirm('هل أنت متأكد من حذف هذا الواجب؟', () => {
      let list = getList();
      const hw = list.find(h => h.id === hwId);
      list = list.filter(h => h.id !== hwId);
      saveList(list);
      App.addActivity('تم حذف الواجب: ' + (hw ? hw.title : ''), 'delete');
      App.showToast('تم حذف الواجب بنجاح', 'success');
      render();
    });
  }

  function toggleStatus(hwId) {
    const list = getList();
    const hw = list.find(h => h.id === hwId);
    if (!hw) return;

    hw.status = nextStatus(hw.status);
    saveList(list);
    App.addActivity('تم تغيير حالة الواجب "' + hw.title + '" إلى ' + hw.status, 'edit');
    App.showToast('تم تغيير الحالة إلى: ' + hw.status, 'success');
    render();
  }

  function init() {
    document.getElementById('filter-homework-group').addEventListener('change', render);
    document.getElementById('filter-homework-status').addEventListener('change', render);
    document.getElementById('btn-save-homework').addEventListener('click', saveHomework);
    document.getElementById('form-homework').addEventListener('submit', (e) => {
      e.preventDefault();
      saveHomework();
    });
    render();
  }

  return {
    init,
    render,
    openAddModal,
    saveHomework,
    editHomework,
    deleteHomework,
    toggleStatus
  };
})();
