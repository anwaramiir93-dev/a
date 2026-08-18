(() => {
  'use strict';

  const STUDENTS_KEY = 'sm_students';
  const GROUPS_KEY = 'sm_groups';
  const $ = (s, root = document) => root.querySelector(s);
  const $$ = (s, root = document) => [...root.querySelectorAll(s)];
  const esc = (v) => String(v ?? '').replace(/[&<>\"]/g, (m) => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;' }[m]));
  const read = (key, fallback = []) => {
    try { const v = localStorage.getItem(key); return v === null ? fallback : JSON.parse(v); }
    catch { return fallback; }
  };
  const write = (key, value) => localStorage.setItem(key, JSON.stringify(value));

  function getData() {
    return { students: read(STUDENTS_KEY), groups: read(GROUPS_KEY) };
  }

  function findGroup(id) {
    return getData().groups.find(g => String(g.id) === String(id));
  }

  function findStudent(id) {
    return getData().students.find(s => String(s.id) === String(id));
  }

  function injectStyles() {
    if ($('#group-members-style')) return;
    const style = document.createElement('style');
    style.id = 'group-members-style';
    style.textContent = `
      .group-members-btn{display:inline-flex;align-items:center;justify-content:center;gap:7px}
      .group-members-btn svg{width:16px;height:16px}
      .gm-backdrop{position:fixed;inset:0;z-index:5000;display:grid;place-items:center;padding:18px;background:rgba(17,32,33,.48);backdrop-filter:blur(5px)}
      .gm-modal{width:min(680px,100%);max-height:min(88vh,760px);overflow:auto;background:var(--paper,#fff);border:1px solid var(--border,rgba(0,0,0,.08));border-radius:22px;box-shadow:0 24px 70px rgba(0,0,0,.18);direction:rtl}
      .gm-head{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:20px 22px;border-bottom:1px solid var(--border,rgba(0,0,0,.08));position:sticky;top:0;background:inherit;z-index:2}
      .gm-head h3{margin:0;font-size:20px}.gm-head p{margin:4px 0 0;color:var(--muted,#777);font-size:13px}
      .gm-close{width:38px;height:38px;border:0;border-radius:12px;background:var(--primary-soft,#eef8f6);color:var(--primary,#0f766e);cursor:pointer;display:grid;place-items:center}
      .gm-body{padding:18px 22px}.gm-section{margin-bottom:20px}.gm-section:last-child{margin-bottom:0}
      .gm-label{display:block;margin-bottom:8px;font-weight:800;font-size:13px}.gm-select{width:100%;min-height:46px;padding:9px 12px;border:1px solid var(--border,rgba(0,0,0,.1));border-radius:12px;background:var(--paper,#fff);color:inherit}
      .gm-list{display:grid;gap:8px}.gm-row{display:flex;align-items:center;gap:10px;padding:11px 12px;border:1px solid var(--border,rgba(0,0,0,.08));border-radius:14px;background:rgba(127,127,127,.035)}
      .gm-avatar{width:38px;height:38px;flex:0 0 38px;border-radius:12px;display:grid;place-items:center;background:var(--primary-soft,#eef8f6);color:var(--primary,#0f766e);font-weight:800}.gm-info{min-width:0;flex:1}.gm-info strong{display:block}.gm-info small{display:block;color:var(--muted,#777);margin-top:2px}.gm-remove{border:0;background:transparent;color:var(--danger,#c75d51);cursor:pointer;padding:8px;border-radius:9px}.gm-empty{padding:20px;text-align:center;color:var(--muted,#777);border:1px dashed var(--border,rgba(0,0,0,.12));border-radius:14px}.gm-footer{display:flex;justify-content:flex-start;gap:8px;padding:16px 22px;border-top:1px solid var(--border,rgba(0,0,0,.08));position:sticky;bottom:0;background:inherit}
      @media(max-width:600px){.gm-backdrop{padding:0;align-items:end}.gm-modal{width:100%;max-height:92vh;border-radius:22px 22px 0 0}.gm-head,.gm-body,.gm-footer{padding-left:16px;padding-right:16px}.gm-footer .btn{flex:1}}
    `;
    document.head.appendChild(style);
  }

  function icon(name) {
    const i = document.createElement('i');
    i.dataset.lucide = name;
    return i;
  }

  function refreshIcons() {
    try { if (typeof window.icons === 'function') window.icons(); else if (window.lucide?.createIcons) window.lucide.createIcons(); } catch (_) {}
  }

  function openMembers(groupId) {
    const group = findGroup(groupId);
    if (!group) return;
    const { students } = getData();
    const members = students.filter(s => String(s.groupId) === String(groupId));
    const available = students.filter(s => !s.groupId || String(s.groupId) !== String(groupId));

    const backdrop = document.createElement('div');
    backdrop.className = 'gm-backdrop';
    backdrop.innerHTML = `
      <div class="gm-modal" role="dialog" aria-modal="true" aria-labelledby="gm-title">
        <div class="gm-head">
          <div><h3 id="gm-title">طلاب مجموعة ${esc(group.name)}</h3><p>أضف الطلاب إلى المجموعة أو أزلهم منها بدون حذف بيانات الطالب.</p></div>
          <button class="gm-close" type="button" aria-label="إغلاق"><i data-lucide="x"></i></button>
        </div>
        <div class="gm-body">
          <div class="gm-section">
            <label class="gm-label" for="gm-student-select">إضافة طالب إلى المجموعة</label>
            <select id="gm-student-select" class="gm-select">
              <option value="">اختر طالبًا</option>
              ${available.map(s => `<option value="${esc(s.id)}">${esc(s.name)}${s.phone ? ` — ${esc(s.phone)}` : ''}</option>`).join('')}
            </select>
            <button class="btn btn-primary" id="gm-add" type="button" style="margin-top:10px;width:100%"><i data-lucide="user-plus"></i> إضافة الطالب للمجموعة</button>
          </div>
          <div class="gm-section">
            <span class="gm-label">طلاب المجموعة (${members.length})</span>
            <div class="gm-list" id="gm-list">
              ${members.length ? members.map(s => `<div class="gm-row"><span class="gm-avatar">${esc(String(s.name || '؟').trim().split(/\s+/).slice(0,2).map(x=>x[0]).join(''))}</span><div class="gm-info"><strong>${esc(s.name)}</strong><small>${esc(s.phone || 'لا يوجد هاتف')}</small></div><button class="gm-remove" type="button" data-remove="${esc(s.id)}" title="إزالة من المجموعة"><i data-lucide="user-minus"></i></button></div>`).join('') : '<div class="gm-empty">لا يوجد طلاب في هذه المجموعة حتى الآن.</div>'}
            </div>
          </div>
        </div>
        <div class="gm-footer"><button class="btn btn-soft gm-done" type="button"><i data-lucide="check"></i> تم</button></div>
      </div>`;

    document.body.appendChild(backdrop);
    refreshIcons();

    const close = () => backdrop.remove();
    $('.gm-close', backdrop).addEventListener('click', close);
    $('.gm-done', backdrop).addEventListener('click', close);
    backdrop.addEventListener('click', e => { if (e.target === backdrop) close(); });
    document.addEventListener('keydown', function escHandler(e) { if (e.key === 'Escape') { close(); document.removeEventListener('keydown', escHandler); } }, { once: true });

    $('#gm-add', backdrop).addEventListener('click', () => {
      const id = $('#gm-student-select', backdrop).value;
      if (!id) return;
      const studentsNow = read(STUDENTS_KEY);
      const target = studentsNow.find(s => String(s.id) === String(id));
      if (!target) return;
      target.groupId = groupId;
      write(STUDENTS_KEY, studentsNow);
      close();
      window.location.reload();
    });

    $$('.gm-remove', backdrop).forEach(btn => btn.addEventListener('click', () => {
      const id = btn.dataset.remove;
      const studentsNow = read(STUDENTS_KEY);
      const target = studentsNow.find(s => String(s.id) === String(id));
      if (!target) return;
      target.groupId = '';
      write(STUDENTS_KEY, studentsNow);
      close();
      window.location.reload();
    }));
  }

  function addButtons() {
    $$('.group-card').forEach(card => {
      if (card.querySelector('.group-members-btn')) return;
      const detail = card.querySelector('[data-action="details-group"]');
      const groupId = detail?.dataset.id;
      if (!groupId) return;
      const actions = card.querySelector('.card-actions');
      if (!actions) return;
      const btn = document.createElement('button');
      btn.className = 'btn btn-primary group-members-btn';
      btn.type = 'button';
      btn.title = 'إدارة طلاب المجموعة';
      btn.append(icon('users-round'));
      btn.append(document.createTextNode('طلاب المجموعة'));
      btn.addEventListener('click', () => openMembers(groupId));
      actions.prepend(btn);
    });
    refreshIcons();
  }

  function init() {
    injectStyles();
    addButtons();
    new MutationObserver(() => addButtons()).observe(document.body, { childList: true, subtree: true });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
