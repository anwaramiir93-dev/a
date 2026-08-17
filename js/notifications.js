/**
 * الإشعارات - Notifications Module
 * إدارة إشعارات النظام والإشعارات التلقائية
 */
const NotificationsModule = (() => {

  const TYPE_ICONS = {
    'info': 'fas fa-info-circle',
    'warning': 'fas fa-exclamation-triangle',
    'success': 'fas fa-check-circle',
    'error': 'fas fa-times-circle',
    'absent': 'fas fa-user-times',
    'homework': 'fas fa-book',
    'payment': 'fas fa-money-bill-wave'
  };

  const TYPE_COLORS = {
    'info': '#3b82f6',
    'warning': '#f59e0b',
    'success': '#10b981',
    'error': '#ef4444',
    'absent': '#ef4444',
    'homework': '#8b5cf6',
    'payment': '#f59e0b'
  };

  function getList() {
    return StorageManager.get('sm_notifications') || [];
  }

  function saveList(data) {
    StorageManager.set('sm_notifications', data);
  }

  function relativeTime(dateStr) {
    if (!dateStr) return '';
    const now = new Date();
    const date = new Date(dateStr);
    const diffMs = now - date;
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHr = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHr / 24);

    if (diffSec < 60) return 'الآن';
    if (diffMin < 60) return `منذ ${diffMin} دقيقة`;
    if (diffHr < 24) return `منذ ${diffHr} ساعة`;
    if (diffDay < 7) return `منذ ${diffDay} يوم`;
    return DemoData.formatDate(dateStr.split('T')[0]);
  }

  function render() {
    const list = getList();
    const container = document.getElementById('notifications-list');
    const empty = document.getElementById('notifications-empty');

    if (list.length === 0) {
      container.innerHTML = '';
      container.style.display = 'none';
      empty.style.display = 'block';
      updateBadge();
      return;
    }

    empty.style.display = 'none';
    container.style.display = 'block';

    container.innerHTML = list.map(n => {
      const icon = TYPE_ICONS[n.type] || TYPE_ICONS['info'];
      const color = TYPE_COLORS[n.type] || TYPE_COLORS['info'];
      const unreadClass = n.read ? '' : 'notification-unread';
      const time = relativeTime(n.date);

      return `
        <div class="notification-item ${unreadClass}" data-id="${n.id}">
          <div class="notification-icon" style="color: ${color}">
            <i class="${icon}"></i>
          </div>
          <div class="notification-body">
            <p class="notification-message">${n.message}</p>
            <span class="notification-time">${time}</span>
          </div>
          <div class="notification-actions">
            ${!n.read ? `<button class="btn btn-sm btn-outline" data-action="mark-read" data-id="${n.id}" title="تحديد كمقروء">
              <i class="fas fa-check"></i>
            </button>` : ''}
            <button class="btn btn-sm btn-outline btn-danger" data-action="delete" data-id="${n.id}" title="حذف">
              <i class="fas fa-trash"></i>
            </button>
          </div>
        </div>
      `;
    }).join('');

    updateBadge();
  }

  function addNotification(message, type) {
    const list = getList();
    const notification = {
      id: DemoData.generateId(),
      message: message,
      type: type || 'info',
      date: new Date().toISOString(),
      read: false
    };
    list.unshift(notification);
    saveList(list);
    updateBadge();
    return notification;
  }

  function markAsRead(id) {
    const list = getList();
    const item = list.find(n => n.id === id);
    if (item) {
      item.read = true;
      saveList(list);
      updateBadge();
    }
  }

  function markAllRead() {
    const list = getList();
    list.forEach(n => n.read = true);
    saveList(list);
    render();
    App.showToast('تم تحديد جميع الإشعارات كمقروءة', 'success');
  }

  function deleteNotification(id) {
    let list = getList();
    list = list.filter(n => n.id !== id);
    saveList(list);
    render();
  }

  function getUnreadCount() {
    const list = getList();
    return list.filter(n => !n.read).length;
  }

  function updateBadge() {
    const badge = document.getElementById('notification-badge');
    if (!badge) return;
    const count = getUnreadCount();
    if (count > 0) {
      badge.textContent = count;
      badge.style.display = 'inline-flex';
    } else {
      badge.style.display = 'none';
    }
  }

  function generateAutoNotifications() {
    const settings = StorageManager.get('sm_settings') || {};
    if (settings.notifications === false) return;

    const today = DemoData.getTodayDate();
    const list = getList();
    const newNotifications = [];

    const existingMessages = new Set(list.map(n => n.message));

    const attendance = StorageManager.get('sm_attendance') || [];
    const todayAttendance = attendance.filter(a => a.date === today && a.status === 'غائب');
    const absentStudentIds = [...new Set(todayAttendance.map(a => a.studentId))];

    absentStudentIds.forEach(sid => {
      const name = StudentsModule.getStudentName(sid);
      const msg = `الطالب ${name} غائب اليوم`;
      if (!existingMessages.has(msg)) {
        newNotifications.push({ message: msg, type: 'absent' });
        existingMessages.add(msg);
      }
    });

    const homework = StorageManager.get('sm_homework') || [];
    const twoDaysLater = new Date();
    twoDaysLater.setDate(twoDaysLater.getDate() + 2);
    const twoDaysStr = twoDaysLater.toISOString().split('T')[0];

    homework.filter(h => h.status === 'نشط' && h.dueDate && h.dueDate <= twoDaysStr && h.dueDate >= today).forEach(h => {
      const msg = `الواجب "${h.title}" يسلم قريباً (${DemoData.formatDate(h.dueDate)})`;
      if (!existingMessages.has(msg)) {
        newNotifications.push({ message: msg, type: 'homework' });
        existingMessages.add(msg);
      }
    });

    const payments = StorageManager.get('sm_payments') || [];
    payments.filter(p => p.status === 'غير مدفوع' && p.date && p.date < today).forEach(p => {
      const name = StudentsModule.getStudentName(p.studentId);
      const msg = `دفعة متأخرة للطالب ${name} - شهر ${p.month || ''}`;
      if (!existingMessages.has(msg)) {
        newNotifications.push({ message: msg, type: 'payment' });
        existingMessages.add(msg);
      }
    });

    if (newNotifications.length > 0) {
      const now = new Date().toISOString();
      newNotifications.forEach(n => {
        list.unshift({
          id: DemoData.generateId(),
          message: n.message,
          type: n.type,
          date: now,
          read: false
        });
      });
      saveList(list);
    }
  }

  function init() {
    generateAutoNotifications();
    render();

    document.getElementById('btn-mark-all-read').addEventListener('click', markAllRead);

    document.getElementById('notifications-list').addEventListener('click', (e) => {
      const btn = e.target.closest('[data-action]');
      if (!btn) return;
      const action = btn.getAttribute('data-action');
      const id = btn.getAttribute('data-id');
      if (action === 'mark-read') markAsRead(id);
      else if (action === 'delete') deleteNotification(id);
    });
  }

  return {
    init,
    render,
    addNotification,
    markAsRead,
    markAllRead,
    deleteNotification,
    getUnreadCount,
    updateBadge,
    generateAutoNotifications
  };
})();
