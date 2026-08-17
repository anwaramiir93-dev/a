const GroupsModule = {
    editingId: null,

    init() {
        this.render();
        this.bindEvents();
    },

    bindEvents() {
        const saveBtn = document.getElementById('btn-save-group');
        if (saveBtn) saveBtn.addEventListener('click', (e) => { e.preventDefault(); this.saveGroup(); });

        // Grid action delegation
        const grid = document.getElementById('groups-grid');
        if (grid) {
            grid.addEventListener('click', (e) => {
                const btn = e.target.closest('[data-action]');
                if (!btn) return;
                const id = btn.dataset.id;
                switch (btn.dataset.action) {
                    case 'view-group': this.viewGroupDetails(id); break;
                    case 'edit-group': this.openEditModal(id); break;
                    case 'delete-group': this.deleteGroup(id); break;
                }
            });
        }
    },

    render() {
        const groups = StorageManager.get('sm_groups');
        const students = StorageManager.get('sm_students');
        const grid = document.getElementById('groups-grid');
        const emptyState = document.getElementById('groups-empty');

        if (groups.length === 0) {
            if (grid) grid.innerHTML = '';
            if (emptyState) emptyState.classList.remove('hidden');
            return;
        }
        if (emptyState) emptyState.classList.add('hidden');

        if (grid) {
            grid.innerHTML = groups.map(g => {
                const count = students.filter(s => s.groupId === g.id).length;
                return `
                <div class="group-card">
                    <div class="group-card-header">
                        <h4 class="group-name">${g.name}</h4>
                        <div class="group-actions">
                            <button class="btn-icon view" data-action="view-group" data-id="${g.id}" title="عرض">👁️</button>
                            <button class="btn-icon edit" data-action="edit-group" data-id="${g.id}" title="تعديل">✏️</button>
                            <button class="btn-icon delete" data-action="delete-group" data-id="${g.id}" title="حذف">🗑️</button>
                        </div>
                    </div>
                    <div class="group-info">
                        <div class="group-detail">👨‍🏫 ${g.teacher || '-'}</div>
                        <div class="group-detail">📅 ${g.days ? g.days.join(', ') : '-'}</div>
                        <div class="group-detail">⏰ ${g.time || '-'}</div>
                        <div class="group-detail">👥 <strong>${count}</strong> طالب</div>
                    </div>
                    ${g.description ? `<p style="margin-top:8px;font-size:13px;color:var(--text-secondary);">${g.description}</p>` : ''}
                </div>`;
            }).join('');
        }
    },

    openAddModal() {
        this.editingId = null;
        document.getElementById('modal-group-title').textContent = 'إضافة مجموعة جديدة';
        document.getElementById('form-group').reset();
        document.getElementById('group-id').value = '';
        App.openModal('modal-group');
    },

    openEditModal(groupId) {
        const groups = StorageManager.get('sm_groups');
        const group = groups.find(g => g.id === groupId);
        if (!group) return;

        this.editingId = groupId;
        document.getElementById('modal-group-title').textContent = 'تعديل المجموعة';
        document.getElementById('group-id').value = group.id;
        document.getElementById('group-name').value = group.name;
        document.getElementById('group-teacher').value = group.teacher || '';
        document.getElementById('group-time').value = group.time || '';
        document.getElementById('group-description').value = group.description || '';

        // Check appropriate day checkboxes
        document.querySelectorAll('input[name="days"]').forEach(cb => {
            cb.checked = group.days && group.days.includes(cb.value);
        });

        App.openModal('modal-group');
    },

    saveGroup() {
        const name = document.getElementById('group-name').value.trim();
        if (!name) { App.showToast('يرجى إدخال اسم المجموعة', 'error'); return; }

        const days = Array.from(document.querySelectorAll('input[name="days"]:checked')).map(cb => cb.value);
        const groups = StorageManager.get('sm_groups');
        const data = {
            name: name,
            teacher: document.getElementById('group-teacher').value.trim(),
            days: days,
            time: document.getElementById('group-time').value,
            description: document.getElementById('group-description').value.trim()
        };

        if (this.editingId) {
            const idx = groups.findIndex(g => g.id === this.editingId);
            if (idx !== -1) {
                groups[idx] = { ...groups[idx], ...data };
                StorageManager.set('sm_groups', groups);
                App.addActivity('تم تعديل المجموعة: ' + name, 'group');
                App.showToast('تم تعديل المجموعة بنجاح');
            }
        } else {
            data.id = DemoData.generateId();
            data.createdAt = DemoData.getTodayDate();
            groups.push(data);
            StorageManager.set('sm_groups', groups);
            App.addActivity('تم إضافة مجموعة جديدة: ' + name, 'group');
            App.showToast('تم إضافة المجموعة بنجاح');
        }

        App.closeModal('modal-group');
        this.render();
        if (typeof DashboardModule !== 'undefined') DashboardModule.refresh();
    },

    deleteGroup(groupId) {
        const students = StorageManager.get('sm_students');
        const count = students.filter(s => s.groupId === groupId).length;
        const msg = count > 0 
            ? `هذه المجموعة تحتوي على ${count} طالب. هل أنت متأكد من الحذف؟` 
            : 'هل أنت متأكد أنك تريد حذف هذه المجموعة؟';
        
        App.showConfirm(msg, () => {
            let groups = StorageManager.get('sm_groups');
            const group = groups.find(g => g.id === groupId);
            groups = groups.filter(g => g.id !== groupId);
            StorageManager.set('sm_groups', groups);
            App.addActivity('تم حذف المجموعة: ' + (group ? group.name : ''), 'group');
            App.showToast('تم حذف المجموعة');
            this.render();
            if (typeof DashboardModule !== 'undefined') DashboardModule.refresh();
        });
    },

    viewGroupDetails(groupId) {
        const groups = StorageManager.get('sm_groups');
        const group = groups.find(g => g.id === groupId);
        if (!group) return;

        const students = StorageManager.get('sm_students').filter(s => s.groupId === groupId);

        document.getElementById('group-details-title').textContent = 'تفاصيل المجموعة: ' + group.name;
        document.getElementById('detail-group-name').textContent = group.name;
        document.getElementById('detail-group-teacher').textContent = group.teacher || '-';
        document.getElementById('detail-group-days').textContent = group.days ? group.days.join(', ') : '-';
        document.getElementById('detail-group-time').textContent = group.time || '-';
        document.getElementById('detail-group-count').textContent = students.length;

        const statusBadges = { 'نشط': 'badge-success', 'متوقف': 'badge-danger', 'مكتمل': 'badge-info' };
        document.getElementById('detail-group-students-tbody').innerHTML = students.length === 0 
            ? '<tr><td colspan="4" style="text-align:center">لا يوجد طلاب في هذه المجموعة</td></tr>'
            : students.map((s, i) => `<tr><td>${i+1}</td><td>${s.name}</td><td dir="ltr">${s.phone||'-'}</td><td><span class="badge ${statusBadges[s.status]||'badge-secondary'}">${s.status}</span></td></tr>`).join('');

        App.openModal('modal-group-details');
    },

    getGroupName(groupId) {
        const groups = StorageManager.get('sm_groups');
        const g = groups.find(gr => gr.id === groupId);
        return g ? g.name : '-';
    },

    populateGroupDropdown(selectEl, includeAll) {
        if (!selectEl) return;
        const groups = StorageManager.get('sm_groups');
        const currentVal = selectEl.value;
        selectEl.innerHTML = includeAll ? '<option value="">كل المجموعات</option>' : '<option value="">اختر المجموعة</option>';
        groups.forEach(g => {
            const opt = document.createElement('option');
            opt.value = g.id;
            opt.textContent = g.name;
            selectEl.appendChild(opt);
        });
        if (currentVal) selectEl.value = currentVal;
    }
};

window.GroupsModule = GroupsModule;
