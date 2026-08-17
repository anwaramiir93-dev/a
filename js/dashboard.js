const DashboardModule = {
    pieChart: null,
    barChart: null,
    
    init() {
        this.refresh();
    },
    
    refresh() {
        this.renderStats();
        this.renderCharts();
        this.renderActivities();
    },
    
    setStat(id, value) {
        const el = document.getElementById(id);
        if (el) el.textContent = value;
    },
    
    renderStats() {
        const students = StorageManager.get('sm_students');
        const groups = StorageManager.get('sm_groups');
        const attendance = StorageManager.get('sm_attendance');
        const homework = StorageManager.get('sm_homework');
        const payments = StorageManager.get('sm_payments');
        const today = DemoData.getTodayDate();
        
        const todayAttendance = attendance.filter(a => a.date === today);
        const present = todayAttendance.filter(a => a.status === 'حاضر').length;
        const absent = todayAttendance.filter(a => a.status === 'غائب').length;
        const total = todayAttendance.length;
        const rate = total > 0 ? ((present / total) * 100).toFixed(1) + '%' : '0%';
        
        const activeHw = homework.filter(h => h.status === 'نشط').length;
        const revenue = payments.filter(p => p.status === 'مدفوع').reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);
        const overdue = payments.filter(p => p.status === 'غير مدفوع' || p.status === 'مدفوع جزئياً').length;
        
        this.setStat('stat-total-students', students.length);
        this.setStat('stat-total-groups', groups.length);
        this.setStat('stat-today-present', present);
        this.setStat('stat-today-absent', absent);
        this.setStat('stat-active-homework', activeHw);
        this.setStat('stat-total-revenue', revenue.toLocaleString('ar-SA'));
        this.setStat('stat-overdue', overdue);
        this.setStat('stat-attendance-rate', rate);
    },
    
    renderCharts() {
        if (typeof Chart === 'undefined') return;
        
        const attendance = StorageManager.get('sm_attendance');
        const payments = StorageManager.get('sm_payments');
        const today = DemoData.getTodayDate();
        const todayAtt = attendance.filter(a => a.date === today);
        
        // Pie chart - attendance
        const pieCtx = document.getElementById('attendance-pie-chart');
        if (pieCtx) {
            if (this.pieChart) this.pieChart.destroy();
            this.pieChart = new Chart(pieCtx, {
                type: 'doughnut',
                data: {
                    labels: ['حاضر', 'غائب', 'متأخر', 'إجازة'],
                    datasets: [{
                        data: [
                            todayAtt.filter(a => a.status === 'حاضر').length,
                            todayAtt.filter(a => a.status === 'غائب').length,
                            todayAtt.filter(a => a.status === 'متأخر').length,
                            todayAtt.filter(a => a.status === 'إجازة').length
                        ],
                        backgroundColor: ['#22c55e', '#ef4444', '#f59e0b', '#3b82f6']
                    }]
                },
                options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom', rtl: true } } }
            });
        }
        
        // Bar chart - payments
        const barCtx = document.getElementById('revenue-bar-chart');
        if (barCtx) {
            if (this.barChart) this.barChart.destroy();
            const paid = payments.filter(p => p.status === 'مدفوع').reduce((s, p) => s + (parseFloat(p.amount) || 0), 0);
            const unpaid = payments.filter(p => p.status !== 'مدفوع').reduce((s, p) => s + (parseFloat(p.amount) || 0), 0);
            this.barChart = new Chart(barCtx, {
                type: 'bar',
                data: {
                    labels: ['مدفوعات', 'غير مدفوعات'],
                    datasets: [{
                        data: [paid, unpaid],
                        backgroundColor: ['#22c55e', '#ef4444'],
                        borderRadius: 8
                    }]
                },
                options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }
            });
        }
    },
    
    renderActivities() {
        const list = document.getElementById('recent-activities');
        if (!list) return;
        
        const activities = StorageManager.get('sm_activities');
        if (activities.length === 0) {
            list.innerHTML = '<li class="activity-item"><span class="activity-icon">👋</span><span class="activity-text">مرحباً بك في نظام إدارة الطلاب</span><span class="activity-time">الآن</span></li>';
            return;
        }
        
        const icons = { student: '👤', attendance: '✅', grade: '📝', payment: '💰', group: '📁', homework: '📚' };
        
        list.innerHTML = activities.slice(0, 10).map(a => {
            const time = this.formatRelativeTime(a.timestamp);
            return `<li class="activity-item"><span class="activity-icon">${icons[a.type] || '📌'}</span><span class="activity-text">${a.message}</span><span class="activity-time">${time}</span></li>`;
        }).join('');
    },
    
    formatRelativeTime(timestamp) {
        if (!timestamp) return '';
        const now = new Date();
        const date = new Date(timestamp);
        const diff = Math.floor((now - date) / 1000);
        
        if (diff < 60) return 'الآن';
        if (diff < 3600) return 'منذ ' + Math.floor(diff / 60) + ' دقائق';
        if (diff < 86400) return 'منذ ' + Math.floor(diff / 3600) + ' ساعة';
        if (diff < 172800) return 'أمس';
        return DemoData.formatDate(date.toISOString().split('T')[0]);
    }
};

window.DashboardModule = DashboardModule;