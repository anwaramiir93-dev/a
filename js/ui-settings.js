(() => {
  'use strict';
  const SETTINGS_KEY = 'sm_settings';
  const readSettings = () => { try { return JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}'); } catch (_) { return {}; } };
  const saveSettings = (v) => localStorage.setItem(SETTINGS_KEY, JSON.stringify(v));
  const esc = (v) => String(v ?? '').replace(/[&<>\"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#039;'}[m]));

  function settingsMarkup() {
    const s = readSettings();
    const name = s.teacherName || s.name || '';
    const subject = s.subject || '';
    const section = document.querySelector('#section-settings');
    if (!section) return;
    section.innerHTML = `
      <div class="section-head">
        <div><span class="eyebrow">التخصيص</span><h2>الإعدادات</h2></div>
      </div>
      <div class="settings-grid">
        <article class="panel settings-card">
          <div class="panel-head"><div><span class="eyebrow">بيانات التطبيق</span><h3>بيانات المدرس</h3></div></div>
          <form id="teacher-settings-form" class="settings-form">
            <label class="field"><span>اسم المدرس</span><input id="teacher-name-setting" type="text" value="${esc(name)}" placeholder="اكتب اسم المدرس" autocomplete="name" required></label>
            <label class="field"><span>المادة</span><input id="teacher-subject-setting" type="text" value="${esc(subject)}" placeholder="مثال: اللغة الإنجليزية" required></label>
            <div class="settings-actions"><button type="submit" class="btn btn-primary"><i data-lucide="save"></i> حفظ الإعدادات</button></div>
            <p id="settings-saved" class="settings-note" hidden>تم حفظ البيانات بنجاح.</p>
          </form>
        </article>
        <article class="panel settings-card settings-preview">
          <div class="panel-head"><div><span class="eyebrow">معاينة</span><h3>هوية التطبيق</h3></div></div>
          <div class="teacher-preview"><div class="avatar" id="settings-avatar">م</div><div><strong id="settings-preview-name">${esc(name || 'اسم المدرس')}</strong><span id="settings-preview-subject">${esc(subject || 'المادة')}</span></div></div>
          <p>سيظهر اسم المدرس والمادة في واجهة التطبيق بدل البيانات الثابتة.</p>
        </article>
      </div>`;
    if (window.lucide?.createIcons) window.lucide.createIcons();

    const form = document.querySelector('#teacher-settings-form');
    const nameInput = document.querySelector('#teacher-name-setting');
    const subjectInput = document.querySelector('#teacher-subject-setting');
    const previewName = document.querySelector('#settings-preview-name');
    const previewSubject = document.querySelector('#settings-preview-subject');
    const avatar = document.querySelector('#settings-avatar');
    const updatePreview = () => {
      const n = nameInput.value.trim() || 'اسم المدرس';
      const sub = subjectInput.value.trim() || 'المادة';
      previewName.textContent = n; previewSubject.textContent = sub; avatar.textContent = n.charAt(0) || 'م';
    };
    nameInput.addEventListener('input', updatePreview); subjectInput.addEventListener('input', updatePreview);
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const teacherName = nameInput.value.trim();
      const subject = subjectInput.value.trim();
      if (!teacherName || !subject) return;
      const current = readSettings();
      saveSettings({...current, teacherName, name: teacherName, subject});
      const header = document.querySelector('#header-teacher-name');
      if (header) header.textContent = teacherName;
      const note = document.querySelector('#settings-saved');
      if (note) { note.hidden = false; setTimeout(() => note.hidden = true, 2200); }
      window.dispatchEvent(new CustomEvent('moallemi:settings-updated', { detail: {teacherName, subject} }));
    });
  }

  function applyIdentity() {
    const s = readSettings();
    if (s.teacherName || s.name) {
      const el = document.querySelector('#header-teacher-name');
      if (el) el.textContent = s.teacherName || s.name;
    }
    const subject = s.subject || '';
    if (subject) document.querySelectorAll('[data-teacher-subject]').forEach(el => el.textContent = subject);
  }

  function makeThreeMonthExpenses() {
    const canvas = document.querySelector('#revenue-bar-chart');
    if (!canvas || !window.Chart) return;
    const panel = canvas.closest('.chart-panel');
    const title = panel?.querySelector('h3');
    if (title) title.textContent = 'المصاريف — آخر 3 شهور';
    const labels = [];
    const values = [];
    let payments = [];
    try { payments = JSON.parse(localStorage.getItem('sm_payments') || '[]'); } catch (_) {}
    for (let i = 2; i >= 0; i--) {
      const d = new Date(); d.setMonth(d.getMonth() - i);
      const key = d.toISOString().slice(0,7);
      labels.push(new Intl.DateTimeFormat('ar-EG', {month:'long', year:'numeric'}).format(new Date(key + '-01T00:00:00')));
      values.push(payments.filter(p => p.month === key).reduce((sum,p) => sum + Number(p.amount || 0), 0));
    }
    const old = window.Chart.getChart(canvas);
    if (old) old.destroy();
    new window.Chart(canvas, {type:'bar', data:{labels, datasets:[{label:'المصاريف',data:values,backgroundColor:'#0f766e',borderRadius:8,maxBarThickness:42}]}, options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false}},scales:{y:{beginAtZero:true,ticks:{font:{family:'Cairo'}}},x:{grid:{display:false},ticks:{font:{family:'Cairo'}}}}}});
  }

  function boot() {
    applyIdentity();
    const nav = document.querySelector('[data-section="settings"]');
    if (nav) nav.addEventListener('click', () => setTimeout(settingsMarkup, 40));
    const settingsSection = document.querySelector('#section-settings');
    if (settingsSection && settingsSection.classList.contains('active')) settingsMarkup();
    setTimeout(makeThreeMonthExpenses, 500);
    window.addEventListener('moallemi:settings-updated', applyIdentity);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
