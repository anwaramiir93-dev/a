/**
 * الإعدادات - Settings Module
 * إدارة إعدادات التطبيق والتفضيلات
 */
const SettingsModule = (() => {

  const STORAGE_KEYS = [
    'sm_students', 'sm_groups', 'sm_attendance', 'sm_grades',
    'sm_payments', 'sm_activities', 'sm_homework', 'sm_settings', 'sm_notifications'
  ];

  function getSettings() {
    return StorageManager.get('sm_settings') || {};
  }

  function saveSetting(key, value) {
    const settings = getSettings();
    settings[key] = value;
    StorageManager.set('sm_settings', settings);
  }

  function loadSettings() {
    const settings = getSettings();

    document.getElementById('setting-app-name').value = settings.appName || '';
    document.getElementById('setting-teacher-name').value = settings.teacherName || '';

    const logoPreview = document.getElementById('logo-preview');
    if (settings.logo) {
      logoPreview.src = settings.logo;
      logoPreview.style.display = 'block';
    } else {
      logoPreview.style.display = 'none';
    }

    const darkModeToggle = document.getElementById('setting-dark-mode');
    if (settings.darkMode) {
      darkModeToggle.checked = true;
      document.documentElement.setAttribute('data-theme', 'dark');
    } else {
      darkModeToggle.checked = false;
      document.documentElement.removeAttribute('data-theme');
    }

    const fontSizeInput = document.getElementById('setting-font-size');
    const fontSizeValue = document.getElementById('font-size-value');
    const currentSize = settings.fontSize || 16;
    fontSizeInput.value = currentSize;
    fontSizeValue.textContent = currentSize + 'px';
    document.body.style.fontSize = currentSize + 'px';

    const notifToggle = document.getElementById('setting-notifications');
    notifToggle.checked = settings.notifications !== false;
  }

  function toggleDarkMode(enabled) {
    if (enabled) {
      document.documentElement.setAttribute('data-theme', 'dark');
    } else {
      document.documentElement.removeAttribute('data-theme');
    }
    saveSetting('darkMode', enabled);
  }

  function changeFontSize(size) {
    document.body.style.fontSize = size + 'px';
    document.getElementById('font-size-value').textContent = size + 'px';
    saveSetting('fontSize', Number(size));
  }

  function exportData() {
    const allData = {};
    STORAGE_KEYS.forEach(key => {
      allData[key] = StorageManager.get(key);
    });

    const json = JSON.stringify(allData, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'backup_' + DemoData.getTodayDate() + '.json';
    link.click();
    URL.revokeObjectURL(link.href);
    App.showToast('تم تصدير البيانات بنجاح', 'success');
    App.addActivity('تم تصدير نسخة احتياطية من البيانات', 'add');
  }

  function importData() {
    const fileInput = document.getElementById('import-file-input');
    fileInput.click();
  }

  function handleImportFile(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(event) {
      try {
        const data = JSON.parse(event.target.result);

        App.showConfirm('سيتم استبدال جميع البيانات الحالية بالبيانات المستوردة. هل أنت متأكد؟', () => {
          STORAGE_KEYS.forEach(key => {
            if (data[key] !== undefined) {
              StorageManager.set(key, data[key]);
            }
          });
          App.showToast('تم استيراد البيانات بنجاح', 'success');
          App.addActivity('تم استيراد بيانات من نسخة احتياطية', 'add');
          location.reload();
        });
      } catch (err) {
        App.showToast('ملف غير صالح. يرجى اختيار ملف JSON صحيح', 'error');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  }

  function deleteAllData() {
    App.showConfirm('هل أنت متأكد من حذف جميع البيانات؟ لا يمكن التراجع عن هذا الإجراء.', () => {
      STORAGE_KEYS.forEach(key => {
        StorageManager.set(key, []);
      });
      App.showToast('تم حذف جميع البيانات', 'success');
      location.reload();
    });
  }

  function resetApp() {
    App.showConfirm('هل أنت متأكد من إعادة تعيين التطبيق بالكامل؟ سيتم حذف جميع البيانات والإعدادات.', () => {
      STORAGE_KEYS.forEach(key => {
        StorageManager.set(key, []);
      });
      StorageManager.set('sm_initialized', false);
      location.reload();
    });
  }

  function init() {
    loadSettings();

    document.getElementById('btn-save-app-info').addEventListener('click', () => {
      const appName = document.getElementById('setting-app-name').value.trim();
      const teacherName = document.getElementById('setting-teacher-name').value.trim();
      saveSetting('appName', appName);
      saveSetting('teacherName', teacherName);
      App.showToast('تم حفظ معلومات التطبيق', 'success');
    });

    document.getElementById('setting-logo-upload').addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = function(event) {
        const dataUrl = event.target.result;
        saveSetting('logo', dataUrl);
        const logoPreview = document.getElementById('logo-preview');
        logoPreview.src = dataUrl;
        logoPreview.style.display = 'block';
        App.showToast('تم تحميل الشعار بنجاح', 'success');
      };
      reader.readAsDataURL(file);
    });

    document.getElementById('setting-dark-mode').addEventListener('change', (e) => {
      toggleDarkMode(e.target.checked);
    });

    document.getElementById('setting-font-size').addEventListener('input', (e) => {
      changeFontSize(e.target.value);
    });

    document.getElementById('setting-notifications').addEventListener('change', (e) => {
      saveSetting('notifications', e.target.checked);
    });

    document.getElementById('btn-export-data').addEventListener('click', exportData);

    document.getElementById('btn-import-data').addEventListener('click', () => {
      document.getElementById('import-file-input').click();
    });

    document.getElementById('import-file-input').addEventListener('change', handleImportFile);

    document.getElementById('btn-delete-all-data').addEventListener('click', deleteAllData);
    document.getElementById('btn-reset-app').addEventListener('click', resetApp);
  }

  return {
    init,
    loadSettings,
    saveSetting,
    toggleDarkMode,
    changeFontSize,
    exportData,
    importData,
    deleteAllData,
    resetApp
  };
})();
