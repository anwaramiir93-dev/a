const App = {
    currentSection: 'dashboard',
    confirmCallback: null,
    
    init() {
        // Init demo data
        if (typeof DemoData !== 'undefined') DemoData.initDemoData();
        
        // Load settings immediately (dark mode, font)
        if (typeof SettingsModule !== 'undefined') SettingsModule.init();
        
        // Splash screen
        this.setupSplash();
    },
    
    setupSplash() {
        const splash = document.getElementById('splash-screen');
        const app = document.getElementById('app');
        const enterBtn = document.getElementById('enter-btn');
        let entered = false;
        
        const enter = () => {
            if (entered) return;
            entered = true;
            splash.classList.add('fade-out');
            setTimeout(() => {
                splash.style.display = 'none';
                app.classList.remove('hidden');
                this.initApp();
            }, 500);
        };
        
        if (enterBtn) enterBtn.addEventListener('click', enter);
        setTimeout(enter, 3000);
    },
    
    initApp() {
        // Init all modules
        if (typeof DashboardModule !== 'undefined') DashboardModule.init();
        if (typeof StudentsModule !== 'undefined') StudentsModule.init();
        if (typeof GroupsModule !== 'undefined') GroupsModule.init();
        if (typeof AttendanceModule !== 'undefined') AttendanceModule.init();
        if (typeof GradesModule !== 'undefined') GradesModule.init();
        if (typeof HomeworkModule !== 'undefined') HomeworkModule.init();
        if (typeof PaymentsModule !== 'undefined') PaymentsModule.init();
        if (typeof ReportsModule !== 'undefined') ReportsModule.init();
        if (typeof NotificationsModule !== 'undefined') NotificationsModule.init();
        
        this.setupNavigation();
        this.setupGlobalSearch();
        this.setupHeaderButtons();
        this.setupDataActions();
        this.setupKeyboardShortcuts();
        
        // Auto notifications
        if (typeof NotificationsModule !== 'undefined') NotificationsModule.generateAutoNotifications();
        
        // Refresh dashboard
        if (typeof DashboardModule !== 'undefined') DashboardModule.refresh();
    },
    
    sectionTitles: {
        dashboard: 'لوحة التحكم',
        students: 'الطلاب',
        groups: 'المجموعات',
        attendance: 'الحضور والغياب',
        grades: 'الدرجات',
        homework: 'الواجبات',
        payments: 'المدفوعات',
        reports: 'التقارير',
        notifications: 'الإشعارات',
        settings: 'الإعدادات'
    },
    
    navigate(sectionName) {
        this.currentSection = sectionName;
        
        // Hide all sections
        document.querySelectorAll('.content-section').forEach(s => s.classList.remove('active'));
        
        // Show target
        const target = document.getElementById('section-' + sectionName);
        if (target) target.classList.add('active');
        
        // Update sidebar active
        document.querySelectorAll('.nav-link').forEach(l => {
            l.classList.toggle('active', l.dataset.section === sectionName);
        });
        
        // Update bottom nav active
        document.querySelectorAll('.bottom-nav-item[data-section]').forEach(l => {
            l.classList.toggle('active', l.dataset.section === sectionName);
        });
        
        // Update page title
        const titleEl = document.getElementById('page-title');
        if (titleEl) titleEl.textContent = this.sectionTitles[sectionName] || '';
        
        // Close sidebar & more menu on mobile
        this.closeSidebar();
        this.closeMoreMenu();
        
        // Refresh section data
        this.refreshSection(sectionName);
        
        // Scroll to top
        window.scrollTo(0, 0);
    },
    
    refreshSection(section) {
        switch(section) {
            case 'dashboard': if (typeof DashboardModule !== 'undefined') DashboardModule.refresh(); break;
            case 'students': if (typeof StudentsModule !== 'undefined') StudentsModule.render(); break;
            case 'groups': if (typeof GroupsModule !== 'undefined') GroupsModule.render(); break;
            case 'attendance': if (typeof AttendanceModule !== 'undefined') AttendanceModule.render(); break;
            case 'grades': if (typeof GradesModule !== 'undefined') GradesModule.render(); break;
            case 'homework': if (typeof HomeworkModule !== 'undefined') HomeworkModule.render(); break;
            case 'payments': if (typeof PaymentsModule !== 'undefined') PaymentsModule.render(); break;
            case 'reports': if (typeof ReportsModule !== 'undefined') ReportsModule.switchTab('students'); break;
            case 'notifications': if (typeof NotificationsModule !== 'undefined') NotificationsModule.render(); break;
        }
    },
    
    setupNavigation() {
        // Sidebar nav links
        document.querySelectorAll('.nav-link[data-section]').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                this.navigate(link.dataset.section);
            });
        });
        
        // Bottom nav
        document.querySelectorAll('.bottom-nav-item[data-section]').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                this.navigate(link.dataset.section);
            });
        });
        
        // More menu items
        document.querySelectorAll('.more-menu-item[data-section]').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                this.navigate(link.dataset.section);
            });
        });
        
        // Hamburger
        const hamburger = document.getElementById('hamburger-btn');
        if (hamburger) hamburger.addEventListener('click', () => this.toggleSidebar());
        
        // Sidebar overlay
        const overlay = document.getElementById('sidebar-overlay');
        if (overlay) overlay.addEventListener('click', () => this.closeSidebar());
        
        // More menu button
        const moreBtn = document.getElementById('bottom-nav-more');
        if (moreBtn) moreBtn.addEventListener('click', (e) => {
            e.preventDefault();
            this.toggleMoreMenu();
        });
        
        // More menu overlay
        const moreOverlay = document.querySelector('.more-menu-overlay');
        if (moreOverlay) moreOverlay.addEventListener('click', () => this.closeMoreMenu());
    },
    
    toggleSidebar() {
        document.getElementById('sidebar').classList.toggle('open');
        document.getElementById('sidebar-overlay').classList.toggle('active');
    },
    
    closeSidebar() {
        document.getElementById('sidebar').classList.remove('open');
        document.getElementById('sidebar-overlay').classList.remove('active');
    },
    
    toggleMoreMenu() {
        document.getElementById('more-menu').classList.toggle('hidden');
    },
    
    closeMoreMenu() {
        document.getElementById('more-menu').classList.add('hidden');
    },
    
    setupGlobalSearch() {
        const searchInput = document.getElementById('global-search');
        if (!searchInput) return;
        
        let debounceTimer;
        searchInput.addEventListener('input', () => {
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(() => {
                const query = searchInput.value.trim();
                if (query.length >= 2) {
                    this.globalSearch(query);
                }
            }, 300);
        });
    },
    
    globalSearch(query) {
        const q = query.toLowerCase();
        const results = { students: [], groups: [], attendance: [], payments: [] };
        
        // Search students
        const students = StorageManager.get('sm_students');
        results.students = students.filter(s => s.name.toLowerCase().includes(q) || (s.phone && s.phone.includes(q)));
        
        // Search groups
        const groups = StorageManager.get('sm_groups');
        results.groups = groups.filter(g => g.name.toLowerCase().includes(q) || (g.teacher && g.teacher.toLowerCase().includes(q)));
        
        // Search attendance
        const attendance = StorageManager.get('sm_attendance');
        results.attendance = attendance.filter(a => (a.studentName && a.studentName.toLowerCase().includes(q)));
        
        // Search payments
        const payments = StorageManager.get('sm_payments');
        results.payments = payments.filter(p => (p.studentName && p.studentName.toLowerCase().includes(q)));
        
        // Render results
        this.renderSearchResults(results, query);
        
        // Open search modal
        this.openModal('modal-search-results');
    },
    
    renderSearchResults(results, query) {
        const studentsList = document.getElementById('search-results-students-list');
        const groupsList = document.getElementById('search-results-groups-list');
        const attendanceList = document.getElementById('search-results-attendance-list');
        const paymentsList = document.getElementById('search-results-payments-list');
        const noResults = document.getElementById('search-no-results');
        
        const studentsCat = document.getElementById('search-results-students');
        const groupsCat = document.getElementById('search-results-groups');
        const attendanceCat = document.getElementById('search-results-attendance');
        const paymentsCat = document.getElementById('search-results-payments');
        
        const hasResults = results.students.length || results.groups.length || results.attendance.length || results.payments.length;
        
        if (noResults) noResults.classList.toggle('hidden', hasResults);
        if (studentsCat) studentsCat.style.display = results.students.length ? '' : 'none';
        if (groupsCat) groupsCat.style.display = results.groups.length ? '' : 'none';
        if (attendanceCat) attendanceCat.style.display = results.attendance.length ? '' : 'none';
        if (paymentsCat) paymentsCat.style.display = results.payments.length ? '' : 'none';
        
        if (studentsList) studentsList.innerHTML = results.students.map(s => `<li><a href="#" data-action="view-student" data-id="${s.id}">${s.name} - ${s.phone || ''}</a></li>`).join('');
        if (groupsList) groupsList.innerHTML = results.groups.map(g => `<li><a href="#" data-action="view-group" data-id="${g.id}">${g.name} - ${g.teacher || ''}</a></li>`).join('');
        if (attendanceList) attendanceList.innerHTML = results.attendance.slice(0, 5).map(a => `<li>${a.studentName} - ${a.date} - ${a.status}</li>`).join('');
        if (paymentsList) paymentsList.innerHTML = results.payments.slice(0, 5).map(p => `<li>${p.studentName} - ${p.amount} - ${p.status}</li>`).join('');
    },
    
    setupHeaderButtons() {
        // Dark mode toggle
        const darkToggle = document.getElementById('dark-mode-toggle');
        if (darkToggle) {
            darkToggle.addEventListener('click', () => {
                const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
                if (typeof SettingsModule !== 'undefined') SettingsModule.toggleDarkMode(!isDark);
            });
        }
        
        // Notification bell
        const notifBtn = document.getElementById('notification-bell-btn');
        if (notifBtn) {
            notifBtn.addEventListener('click', () => this.navigate('notifications'));
        }
    },
    
    setupDataActions() {
        // Handle data-action attributes on buttons/elements
        document.addEventListener('click', (e) => {
            const target = e.target.closest('[data-action]');
            if (!target) return;
            
            const action = target.dataset.action;
            
            switch(action) {
                case 'close-modal':
                    const modal = target.closest('.modal');
                    if (modal) this.closeModal(modal.id);
                    break;
                case 'open-modal':
                    const modalName = target.dataset.modal;
                    if (modalName) this.handleOpenModal(modalName);
                    break;
                case 'open-more-menu':
                    this.toggleMoreMenu();
                    break;
                case 'close-more-menu':
                    this.closeMoreMenu();
                    break;
                case 'view-student':
                    e.preventDefault();
                    const studentId = target.dataset.id;
                    this.closeModal('modal-search-results');
                    if (typeof StudentsModule !== 'undefined') StudentsModule.viewStudentDetails(studentId);
                    break;
                case 'view-group':
                    e.preventDefault();
                    const groupId = target.dataset.id;
                    this.closeModal('modal-search-results');
                    if (typeof GroupsModule !== 'undefined') GroupsModule.viewGroupDetails(groupId);
                    break;
                case 'add-student':
                    if (typeof StudentsModule !== 'undefined') StudentsModule.openAddModal();
                    break;
                case 'add-group':
                    if (typeof GroupsModule !== 'undefined') GroupsModule.openAddModal();
                    break;
                case 'record-attendance':
                    if (typeof AttendanceModule !== 'undefined') AttendanceModule.openAddModal();
                    break;
                case 'add-grade':
                    if (typeof GradesModule !== 'undefined') GradesModule.openAddModal();
                    break;
                case 'add-homework':
                    if (typeof HomeworkModule !== 'undefined') HomeworkModule.openAddModal();
                    break;
                case 'add-payment':
                    if (typeof PaymentsModule !== 'undefined') PaymentsModule.openAddModal();
                    break;
            }
        });
    },
    
    handleOpenModal(modalName) {
        const modalMap = {
            student: () => { if (typeof StudentsModule !== 'undefined') StudentsModule.openAddModal(); },
            group: () => { if (typeof GroupsModule !== 'undefined') GroupsModule.openAddModal(); },
            attendance: () => { if (typeof AttendanceModule !== 'undefined') AttendanceModule.openAddModal(); },
            grade: () => { if (typeof GradesModule !== 'undefined') GradesModule.openAddModal(); },
            homework: () => { if (typeof HomeworkModule !== 'undefined') HomeworkModule.openAddModal(); },
            payment: () => { if (typeof PaymentsModule !== 'undefined') PaymentsModule.openAddModal(); }
        };
        if (modalMap[modalName]) modalMap[modalName]();
    },
    
    // Modal management
    openModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) modal.classList.add('active');
    },
    
    closeModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) modal.classList.remove('active');
    },
    
    closeModalAll() {
        document.querySelectorAll('.modal.active').forEach(m => m.classList.remove('active'));
    },
    
    // Toast notifications
    showToast(message, type = 'success') {
        const container = document.getElementById('toast-container');
        if (!container) return;
        
        const icons = { success: '✅', error: '❌', warning: '⚠️', info: 'ℹ️' };
        const toast = document.createElement('div');
        toast.className = 'toast toast-' + type;
        toast.innerHTML = `<span class="toast-icon">${icons[type] || '✅'}</span><span class="toast-message">${message}</span><button class="toast-close">&times;</button>`;
        
        container.appendChild(toast);
        
        const closeBtn = toast.querySelector('.toast-close');
        closeBtn.addEventListener('click', () => this.removeToast(toast));
        
        setTimeout(() => this.removeToast(toast), 4000);
    },
    
    removeToast(toast) {
        if (!toast || !toast.parentNode) return;
        toast.classList.add('hiding');
        setTimeout(() => { if (toast.parentNode) toast.parentNode.removeChild(toast); }, 300);
    },
    
    // Confirm dialog
    showConfirm(message, onConfirm) {
        const msgEl = document.getElementById('confirm-message');
        if (msgEl) msgEl.textContent = message;
        this.confirmCallback = onConfirm;
        this.openModal('modal-confirm');
        
        // Bind confirm button
        const confirmBtn = document.getElementById('btn-confirm-action');
        if (confirmBtn) {
            const newBtn = confirmBtn.cloneNode(true);
            confirmBtn.parentNode.replaceChild(newBtn, confirmBtn);
            newBtn.id = 'btn-confirm-action';
            newBtn.addEventListener('click', () => {
                this.closeModal('modal-confirm');
                if (this.confirmCallback) this.confirmCallback();
                this.confirmCallback = null;
            });
        }
    },
    
    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeModalAll();
                this.closeSidebar();
                this.closeMoreMenu();
            }
        });
    },
    
    // Add activity log
    addActivity(message, type = 'student') {
        const activities = StorageManager.get('sm_activities');
        activities.unshift({
            id: DemoData.generateId(),
            message: message,
            type: type,
            timestamp: new Date().toISOString()
        });
        // Keep only last 50
        if (activities.length > 50) activities.length = 50;
        StorageManager.set('sm_activities', activities);
    }
};

// Expose globals
window.showToast = (msg, type) => App.showToast(msg, type);
window.showConfirm = (msg, cb) => App.showConfirm(msg, cb);
window.App = App;

// Init on DOMContentLoaded
document.addEventListener('DOMContentLoaded', () => App.init());
