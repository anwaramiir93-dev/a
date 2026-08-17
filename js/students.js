const StudentsModule = {
    editingId: null,

    init() {
        this.render();
        this.bindEvents();
    },

    bindEvents() {
        // Add student button is handled by App via data-action
        
        // Save button
        const saveBtn = document.getElementById('btn-save-student');
        if (saveBtn) saveBtn.addEventListener('click', (e) => { e.preventDefault(); this.saveStudent(); });

        // Search & filters
        const search = document.getElementById('students-search');
        if (search) search.addEventListener('input', () => this.render());
        const filterGroup = document.getElementById('filter-group-students');
        if (filterGroup) filterGroup.addEventListener('change', () => this.render());
        const filterStatus = document.getElementById('filter-status-students');
        if (filterStatus) filterStatus.addEventListener('change', () => this.render());

        // Student details tabs
        document.querySelectorAll('[data-details-tab]').forEach(tab => {
            tab.addEventListener('click', () => {
                document.querySelectorAll('[data-details-tab]').forEach(t => t.classList.remove('active'));
                document.querySelectorAll('.details-tab-content').forEach(c => c.classList.remove('active'));
                tab.classList.add('active');
                const target = document.getElementById(tab.dataset.detailsTab);
                if (target) target.classList.add('active');
            });
        });

        // Table action delegation
        const tbody = document.getElementById('students-tbody');
        if (tbody) {
            tbody.addEventListener('click', (e) => {
                const btn = e.target.closest('[data-action]');
                if (!btn) return;
                const id = btn.dataset.id;
                switch (btn.dataset.action) {
                    case 'view-student': this.viewStudentDetails(id); break;
                    case 'edit-student': this.openEditModal(id); break;
                    case 'delete-student': this.deleteStudent(id); break;
                    case 'toggle-status': this.changeStatus(id, btn.dataset.status); break;
                }
            });
        }
    },

    render() {
        const students = StorageManager.get('sm_students');
        const groups = StorageManager.get('sm_groups');
        const searchEl = document.getElementById('students-search');
        const filterGroup = document.getElementById('filter-group-students');
        const filterStatus = document.getElementById('filter-status-students');
        
        const search = (searchEl ? searchEl.value : '').toLowerCase();
        const groupFilter = filterGroup ? filterGroup.value : '';
        const statusFilter = filterStatus ? filterStatus.value : '';

        // Populate group filter if empty
        if (filterGroup && filterGroup.options.length <= 1) {
            GroupsModule.populateGroupDropdown(filterGroup, true);
        }

        const filtered = students.filter(s => {
            const matchSearch = !search || s.name.toLowerCase().includes(search) || (s.phone && s.phone.includes(search));
            const matchGroup = !groupFilter || s.groupId === groupFilter;
            const matchStatus = !statusFilter || s.status === statusFilter;
            return matchSearch && matchGroup && matchStatus;
        });

        const tbody = document.getElementById('students-tbody');
        const emptyState = document.getElementById('students-empty');
        const cardsContainer = document.getElementById('students-cards');

        if (filtered.length === 0) {
            if (tbody) tbody.innerHTML = '';
            if (emptyState) emptyState.classList.remove('hidden');
            if (cardsContainer) cardsContainer.innerHTML = '';
            return;
        }

        if (emptyState) emptyState.classList.add('hidden');

        const statusBadges = { 'نشط': 'badge-success', 'متوقف': 'badge-danger', 'مكتمل': 'badge-info' };
        const groupName = (gid) => { const g = groups.find(gr => gr.id === gid); return g ? g.name : '-'; };

        // Desktop table
        if (tbody) {
            tbody.innerHTML = filtered.map((s, i) => `
                <tr>
                    <td>${i + 1}</td>
                    <td>${s.name}</td>
                    <td dir="ltr">${s.phone || '-'}</td>
                    <td>${s.age || '-'}</td>
                    <td>${s.gender || '-'}</td>
                    <td>${groupName(s.groupId)}</td>
                    <td><span class="badge ${statusBadges[s.status] || 'badge-secondary'}">${s.status}</span></td>
                    <td class="actions-cell">
                        <button class="btn-icon view" data-action="view-student" data-id="${s.id}" title="عرض">👁️</button>
                        <button class="btn-icon edit" data-action="edit-student" data-id="${s.id}" title="تعديل">✏️</button>
                        <button class="btn-icon delete" data-action="delete-student" data-id="${s.id}" title="حذف">🗑️</button>
                    </td>
                </tr>
            `).join('');
        }

        // Mobile cards
        if (cardsContainer) {
            cardsContainer.innerHTML = filtered.map(s => `
                <div class="mobile-card">
                    <div class="mobile-card-header">
                        <strong>${s.name}</strong>
                        <span class="badge ${statusBadges[s.status] || 'badge-secondary'}">${s.status}</span>
                    </div>
                    <div class="mobile-card-body">
                        <p>📞 ${s.phone || '-'} | 📁 ${groupName(s.groupId)}</p>
                    </div>
                    <div class="mobile-card-actions">
                        <button class="btn btn-sm btn-outline" data-action="view-student" data-id="${s.id}">عرض</button>
                        <button class="btn btn-sm btn-primary" data-action="edit-student" data-id="${s.id}">تعديل</button>
                    </div>
                </div>
            `).join('');
        }
    },

    openAddModal() {
        this.editingId = null;
        document.getElementById('modal-student-title').textContent = 'إضافة طالب جديد';
        document.getElementById('form-student').reset();
        document.getElementById('student-id').value = '';
        GroupsModule.populateGroupDropdown(document.getElementById('student-group'));
        document.getElementById('student-registration-date').value = DemoData.getTodayDate();
        App.openModal('modal-student');
    },

    openEditModal(studentId) {
        const students = StorageManager.get('sm_students');
        const student = students.find(s => s.id === studentId);
        if (!student) return;

        this.editingId = studentId;
        document.getElementById('modal-student-title').textContent = 'تعديل بيانات الطالب';
        document.getElementById('student-id').value = student.id;
        document.getElementById('student-name').value = student.name;
        document.getElementById('student-phone').value = student.phone || '';
        document.getElementById('student-age').value = student.age || '';
        document.getElementById('student-gender').value = student.gender || '';
        document.getElementById('student-status').value = student.status || 'نشط';
        document.getElementById('student-registration-date').value = student.registeredAt || '';
        document.getElementById('student-notes').value = student.notes || '';
        GroupsModule.populateGroupDropdown(document.getElementById('student-group'));
        document.getElementById('student-group').value = student.groupId || '';
        App.openModal('modal-student');
    },

    saveStudent() {
        const name = document.getElementById('student-name').value.trim();
        if (!name) { App.showToast('يرجى إدخال اسم الطالب', 'error'); return; }

        const students = StorageManager.get('sm_students');
        const data = {
            name: name,
            phone: document.getElementById('student-phone').value.trim(),
            age: parseInt(document.getElementById('student-age').value) || null,
            gender: document.getElementById('student-gender').value,
            groupId: document.getElementById('student-group').value,
            status: document.getElementById('student-status').value || 'نشط',
            registeredAt: document.getElementById('student-registration-date').value || DemoData.getTodayDate(),
            notes: document.getElementById('student-notes').value.trim()
        };

        if (this.editingId) {
            const idx = students.findIndex(s => s.id === this.editingId);
            if (idx !== -1) {
                students[idx] = { ...students[idx], ...data };
                StorageManager.set('sm_students', students);
                App.addActivity('تم تعديل بيانات الطالب: ' + name, 'student');
                App.showToast('تم تعديل بيانات الطالب بنجاح');
            }
        } else {
            data.id = DemoData.generateId();
            students.push(data);
            StorageManager.set('sm_students', students);
            App.addActivity('تم إضافة طالب جديد: ' + name, 'student');
            App.showToast('تم إضافة الطالب بنجاح');
        }

        App.closeModal('modal-student');
        this.render();
        if (typeof DashboardModule !== 'undefined') DashboardModule.refresh();
    },

    deleteStudent(studentId) {
        App.showConfirm('هل أنت متأكد أنك تريد حذف هذا الطالب؟', () => {
            let students = StorageManager.get('sm_students');
            const student = students.find(s => s.id === studentId);
            students = students.filter(s => s.id !== studentId);
            StorageManager.set('sm_students', students);
            App.addActivity('تم حذف الطالب: ' + (student ? student.name : ''), 'student');
            App.showToast('تم حذف الطالب');
            this.render();
            if (typeof DashboardModule !== 'undefined') DashboardModule.refresh();
        });
    },

    viewStudentDetails(studentId) {
        const students = StorageManager.get('sm_students');
        const student = students.find(s => s.id === studentId);
        if (!student) return;

        const groups = StorageManager.get('sm_groups');
        const group = groups.find(g => g.id === student.groupId);

        document.getElementById('student-details-title').textContent = 'تفاصيل الطالب: ' + student.name;
        document.getElementById('detail-student-name').textContent = student.name;
        document.getElementById('detail-student-phone').textContent = student.phone || '-';
        document.getElementById('detail-student-age').textContent = student.age || '-';
        document.getElementById('detail-student-gender').textContent = student.gender || '-';
        document.getElementById('detail-student-group').textContent = group ? group.name : '-';
        document.getElementById('detail-student-status').textContent = student.status;
        document.getElementById('detail-student-regdate').textContent = student.registeredAt ? DemoData.formatDate(student.registeredAt) : '-';
        document.getElementById('detail-student-notes').textContent = student.notes || '-';

        // Reset tabs
        document.querySelectorAll('[data-details-tab]').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.details-tab-content').forEach(c => c.classList.remove('active'));
        document.querySelector('[data-details-tab="attendance-history"]').classList.add('active');
        document.getElementById('student-attendance-history').classList.add('active');

        // Attendance history
        const attendance = StorageManager.get('sm_attendance').filter(a => a.studentId === studentId);
        document.getElementById('detail-attendance-tbody').innerHTML = attendance.length === 0 ? '<tr><td colspan="5" style="text-align:center">لا توجد سجلات</td></tr>' :
            attendance.map(a => `<tr><td>${DemoData.formatDate(a.date)}</td><td><span class="badge ${a.status==='حاضر'?'badge-success':a.status==='غائب'?'badge-danger':a.status==='متأخر'?'badge-warning':'badge-info'}">${a.status}</span></td><td>${a.timeIn||'-'}</td><td>${a.timeOut||'-'}</td><td>${a.notes||'-'}</td></tr>`).join('');

        // Grades history
        const grades = StorageManager.get('sm_grades').filter(g => g.studentId === studentId);
        document.getElementById('detail-grades-tbody').innerHTML = grades.length === 0 ? '<tr><td colspan="6" style="text-align:center">لا توجد درجات</td></tr>' :
            grades.map(g => `<tr><td>${g.examName||'-'}</td><td>${g.subject||'-'}</td><td>${g.score}/${g.total}</td><td>${g.percentage||0}%</td><td>${g.rating||'-'}</td><td>${DemoData.formatDate(g.date)}</td></tr>`).join('');

        // Payments history
        const payments = StorageManager.get('sm_payments').filter(p => p.studentId === studentId);
        document.getElementById('detail-payments-tbody').innerHTML = payments.length === 0 ? '<tr><td colspan="5" style="text-align:center">لا توجد مدفوعات</td></tr>' :
            payments.map(p => `<tr><td>${p.amount}</td><td>${p.month||'-'}</td><td>${p.paymentType||'-'}</td><td><span class="badge ${p.status==='مدفوع'?'badge-success':'badge-danger'}">${p.status}</span></td><td>${DemoData.formatDate(p.date)}</td></tr>`).join('');

        App.openModal('modal-student-details');
    },

    changeStatus(studentId, newStatus) {
        const students = StorageManager.get('sm_students');
        const idx = students.findIndex(s => s.id === studentId);
        if (idx !== -1) {
            students[idx].status = newStatus;
            StorageManager.set('sm_students', students);
            App.showToast('تم تغيير حالة الطالب');
            this.render();
        }
    },

    getStudentName(studentId) {
        const students = StorageManager.get('sm_students');
        const s = students.find(st => st.id === studentId);
        return s ? s.name : '-';
    },

    getStudentsByGroup(groupId) {
        return StorageManager.get('sm_students').filter(s => s.groupId === groupId);
    }
};

window.StudentsModule = StudentsModule;
