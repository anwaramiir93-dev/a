(() => {
  'use strict';

  const LESSONS_KEY = 'sm_lessons';
  const STUDENTS_KEY = 'sm_students';
  const GROUPS_KEY = 'sm_groups';
  const SETTINGS_KEY = 'sm_settings';
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const read = (k, fallback = []) => { try { const v = localStorage.getItem(k); return v === null ? fallback : JSON.parse(v); } catch { return fallback; } };
  const write = (k, v) => localStorage.setItem(k, JSON.stringify(v));
  const esc = v => String(v ?? '').replace(/[&<>\"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#039;'}[m]));
  const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2,8);
  const initials = n => String(n || 'ط').trim().split(/\s+/).slice(0,2).map(x => x[0]).join('') || 'ط';
  const settings = () => read(SETTINGS_KEY, {});

  function smartLevel(score, attendance, previous = []) {
    const numeric = Number(score || 0);
    const attendanceBonus = attendance === 'حاضر' ? 5 : attendance === 'متأخر' ? 2 : attendance === 'غائب' ? -8 : 0;
    const previousScores = previous.map(Number).filter(Number.isFinite);
    const trend = previousScores.length ? previousScores.reduce((a,b)=>a+b,0) / previousScores.length : numeric;
    const blended = Math.max(0, Math.min(100, numeric * .72 + trend * .18 + 50 * .10 + attendanceBonus));
    let level = 'A1';
    if (blended >= 85) level = 'C1';
    else if (blended >= 75) level = 'B2';
    else if (blended >= 65) level = 'B1';
    else if (blended >= 50) level = 'A2';
    const confidence = Math.round(Math.min(96, 55 + Math.abs(blended - 50) * .55 + (previousScores.length ? 12 : 0)));
    return { level, score: Math.round(blended), confidence };
  }

  function getStudent(id) { return read(STUDENTS_KEY).find(s => String(s.id) === String(id)); }
  function getGroup(id) { return read(GROUPS_KEY).find(g => String(g.id) === String(id)); }
  function getMembers(groupId) { return read(STUDENTS_KEY).filter(s => String(s.groupId) === String(groupId)); }

  function previousScores(studentId) {
    return read(LESSONS_KEY).filter(l => String(l.studentId) === String(studentId) && Number.isFinite(Number(l.score))).slice(-8).map(l => Number(l.score));
  }

  function waNumber(phone) {
    let p = String(phone || '').replace(/[^\d+]/g, '');
    if (p.startsWith('+')) return p.slice(1);
    if (p.startsWith('0')) return '20' + p.slice(1);
    if (p.startsWith('20')) return p;
    return p;
  }

  function reportText(lesson, student, group) {
    const s = settings();
    const teacher = s.teacherName || s.teacher || 'المدرس';
    const subject = s.subject || s.material || 'المادة';
    return `السلام عليكم،
تقرير حصة الطالب: ${student.name}

📚 المادة: ${subject}
👨‍🏫 المدرس: ${teacher}
👥 المجموعة: ${group?.name || '—'}
📅 الحصة: ${lesson.title || 'حصة تعليمية'}
📆 التاريخ: ${lesson.date}

الحضور: ${lesson.attendance}
الدرجة/التقييم: ${lesson.score}%
المستوى التقديري: ${lesson.level}
درجة الثقة في التحليل: ${lesson.confidence}%

ملاحظات المدرس:
${lesson.notes || 'لا توجد ملاحظات'}

هذا التقرير متابعة تعليمية للحصة، والمستوى تقديري مبني على نتائج الأداء المسجلة وليس بديلاً عن التقييم الأكاديمي الكامل.
— معلمي | Moallemi`;
  }

  function sendWhatsApp(lesson, student, group) {
    const phone = waNumber(student?.phone || student?.guardianPhone || student?.parentPhone);
    if (!phone) { alert('لا يوجد رقم ولي أمر محفوظ لهذا الطالب.'); return; }
    const url = `https://wa.me/${phone}?text=${encodeURIComponent(reportText(lesson, student, group))}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  }

  function styles() {
    if ($('#lesson-reports-style')) return;
    const st = document.createElement('style'); st.id = 'lesson-reports-style';
    st.textContent = `
      .lesson-report-btn{display:inline-flex;align-items:center;gap:7px}
      .lr-backdrop{position:fixed;inset:0;z-index:6000;display:grid;place-items:center;padding:18px;background:rgba(13,30,29,.52);backdrop-filter:blur(6px)}
      .lr-modal{width:min(900px,100%);max-height:92vh;overflow:auto;background:var(--paper,#fff);color:inherit;border:1px solid var(--border,rgba(0,0,0,.08));border-radius:24px;box-shadow:0 30px 90px rgba(0,0,0,.22);direction:rtl}
      .lr-head{display:flex;justify-content:space-between;gap:16px;align-items:center;padding:20px 22px;border-bottom:1px solid var(--border,rgba(0,0,0,.08));position:sticky;top:0;background:inherit;z-index:3}.lr-head h3{margin:0}.lr-head p{margin:4px 0 0;color:var(--muted,#777);font-size:13px}.lr-close{width:38px;height:38px;border:0;border-radius:12px;background:var(--primary-soft,#eef8f6);color:var(--primary,#0f766e);cursor:pointer}
      .lr-body{padding:20px 22px}.lr-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px;margin-bottom:18px}.lr-field{display:grid;gap:7px}.lr-field label{font-weight:800;font-size:13px}.lr-field input,.lr-field select,.lr-field textarea{width:100%;box-sizing:border-box;padding:11px 12px;border:1px solid var(--border,rgba(0,0,0,.1));border-radius:12px;background:var(--paper,#fff);color:inherit;font:inherit}.lr-field textarea{min-height:74px;resize:vertical}
      .lr-student{display:grid;grid-template-columns:1.4fr .8fr .8fr 1.2fr 1fr auto;gap:8px;align-items:center;padding:10px;border:1px solid var(--border,rgba(0,0,0,.08));border-radius:15px;margin-bottom:8px}.lr-student .name{display:flex;align-items:center;gap:9px;font-weight:800}.lr-avatar{width:36px;height:36px;border-radius:11px;display:grid;place-items:center;background:var(--primary-soft,#eef8f6);color:var(--primary,#0f766e)}.lr-level{font-weight:800;color:var(--primary,#0f766e)}.lr-mini{font-size:11px;color:var(--muted,#777)}.lr-actions{display:flex;gap:5px}.lr-actions button{border:0;border-radius:10px;padding:9px;cursor:pointer;background:#e9f7f4;color:#0f766e}.lr-footer{display:flex;justify-content:flex-start;gap:9px;padding:16px 22px;border-top:1px solid var(--border,rgba(0,0,0,.08));position:sticky;bottom:0;background:inherit}.lr-hint{font-size:12px;color:var(--muted,#777);margin:0 0 12px}.lr-status{display:inline-flex;padding:4px 8px;border-radius:99px;background:rgba(15,118,110,.1);color:#0f766e;font-size:11px;font-weight:800}
      @media(max-width:760px){.lr-backdrop{padding:0;align-items:end}.lr-modal{width:100%;max-height:94vh;border-radius:22px 22px 0 0}.lr-grid{grid-template-columns:1fr 1fr}.lr-student{grid-template-columns:1fr 1fr}.lr-student .name{grid-column:1/-1}.lr-student .notes{grid-column:1/-1}.lr-actions{justify-content:flex-end}.lr-footer{flex-wrap:wrap}.lr-footer .btn{flex:1}}
      @media(max-width:460px){.lr-grid{grid-template-columns:1fr}.lr-student{grid-template-columns:1fr 1fr}.lr-student select,.lr-student input{width:100%}}
    `; document.head.appendChild(st);
  }

  function icons() { try { if (window.lucide?.createIcons) window.lucide.createIcons(); } catch {} }

  function openLesson(groupId) {
    const group = getGroup(groupId); if (!group) return;
    const members = getMembers(groupId);
    if (!members.length) { alert('أضف الطلاب إلى المجموعة أولاً.'); return; }
    const backdrop = document.createElement('div'); backdrop.className = 'lr-backdrop';
    const today = new Date().toISOString().slice(0,10);
    backdrop.innerHTML = `<div class="lr-modal" role="dialog" aria-modal="true"><div class="lr-head"><div><h3>تقرير حصة — ${esc(group.name)}</h3><p>سجّل أداء كل طالب ثم أرسل تقريره لولي الأمر عبر WhatsApp.</p></div><button class="lr-close" type="button" aria-label="إغلاق"><i data-lucide="x"></i></button></div><div class="lr-body"><div class="lr-grid"><div class="lr-field"><label>اسم الحصة</label><input id="lr-title" value="الحصة التعليمية"></div><div class="lr-field"><label>التاريخ</label><input id="lr-date" type="date" value="${today}"></div><div class="lr-field"><label>مدة الحصة</label><input id="lr-duration" placeholder="مثال: 60 دقيقة"></div></div><p class="lr-hint">المستوى يتم حسابه تلقائيًا من نتيجة الحصة + الحضور + نتائج الحصص السابقة. هذا <strong>تحليل ذكي تقديري</strong> وليس تشخيصًا أكاديميًا نهائيًا.</p><div id="lr-students"></div></div><div class="lr-footer"><button class="btn btn-primary" id="lr-save" type="button"><i data-lucide="save"></i> حفظ الحصة</button><button class="btn btn-soft" id="lr-send-all" type="button"><i data-lucide="send"></i> إرسال التقارير للجميع</button><button class="btn btn-soft lr-close2" type="button">إلغاء</button></div></div>`;
    document.body.appendChild(backdrop); styles(); icons();

    const container = $('#lr-students', backdrop);
    const row = s => `<div class="lr-student" data-student="${esc(s.id)}"><div class="name"><span class="lr-avatar">${esc(initials(s.name))}</span><span>${esc(s.name)}</span></div><select class="lr-att"><option>حاضر</option><option>متأخر</option><option>غائب</option><option>إجازة</option></select><input class="lr-score" type="number" min="0" max="100" value="0" placeholder="0-100" aria-label="الدرجة"><div><span class="lr-level">A1</span><div class="lr-mini">الثقة <span class="lr-conf">55</span>%</div></div><input class="lr-notes" type="text" placeholder="ملاحظة قصيرة"><div class="lr-actions"><button type="button" class="lr-analyze" title="تحليل المستوى"><i data-lucide="sparkles"></i></button><button type="button" class="lr-wa" title="إرسال WhatsApp"><i data-lucide="message-circle"></i></button></div></div>`;
    container.innerHTML = members.map(row).join(''); icons();

    function analyze(r) {
      const score = Number($('.lr-score',r).value || 0); const att = $('.lr-att',r).value; const result = smartLevel(score, att, previousScores(r.dataset.student)); $('.lr-level',r).textContent=result.level; $('.lr-conf',r).textContent=result.confidence; return result;
    }
    $$('.lr-student', backdrop).forEach(r => {
      $('.lr-score',r).addEventListener('input', () => analyze(r)); $('.lr-att',r).addEventListener('change', () => analyze(r)); $('.lr-analyze',r).addEventListener('click', () => analyze(r));
    });

    const close = () => backdrop.remove(); $('.lr-close',backdrop).addEventListener('click',close); $('.lr-close2',backdrop).addEventListener('click',close); backdrop.addEventListener('click',e=>{if(e.target===backdrop)close()});

    function collect(saveIt = true) {
      const lessons = read(LESSONS_KEY); const title=$('#lr-title',backdrop).value.trim() || 'الحصة التعليمية'; const date=$('#lr-date',backdrop).value || today; const duration=$('#lr-duration',backdrop).value.trim(); const created=[];
      $$('.lr-student',backdrop).forEach(r => { const s=getStudent(r.dataset.student); if(!s)return; const ai=analyze(r); const lesson={id:uid(),studentId:s.id,groupId:group.id,title,date,duration,attendance:$('.lr-att',r).value,score:Number($('.lr-score',r).value||0),level:ai.level,confidence:ai.confidence,notes:$('.lr-notes',r).value.trim(),createdAt:new Date().toISOString()}; created.push({lesson,student:s}); if(saveIt)lessons.push(lesson); }); if(saveIt){write(LESSONS_KEY,lessons); try{window.dispatchEvent(new CustomEvent('moallemi:lesson-saved',{detail:{groupId:group.id}}))}catch{}} return created;
    }
    $('#lr-save',backdrop).addEventListener('click',()=>{collect(true); alert('تم حفظ الحصة وتقارير الطلاب.');});
    $('#lr-send-all',backdrop).addEventListener('click',()=>{const items=collect(true); items.forEach(({lesson,student})=>sendWhatsApp(lesson,student,group));});
    $$('.lr-wa',backdrop).forEach(btn=>btn.addEventListener('click',()=>{const r=btn.closest('.lr-student'); const s=getStudent(r.dataset.student); const ai=analyze(r); const lesson={title:$('#lr-title',backdrop).value.trim()||'الحصة التعليمية',date:$('#lr-date',backdrop).value||today,duration:$('#lr-duration',backdrop).value.trim(),attendance:$('.lr-att',r).value,score:Number($('.lr-score',r).value||0),level:ai.level,confidence:ai.confidence,notes:$('.lr-notes',r).value.trim()}; sendWhatsApp(lesson,s,group);}));
  }

  function addButtons() {
    $$('.group-card').forEach(card => {
      if (card.querySelector('.lesson-report-btn')) return;
      const detail = card.querySelector('[data-action="details-group"]'); const id=detail?.dataset.id; const actions=card.querySelector('.card-actions'); if(!id||!actions)return;
      const b=document.createElement('button'); b.className='btn btn-primary lesson-report-btn'; b.type='button'; b.innerHTML='<i data-lucide="message-square-text"></i> تقرير الحصة'; b.addEventListener('click',()=>openLesson(id)); actions.prepend(b);
    }); icons();
  }

  function init(){styles(); addButtons(); new MutationObserver(addButtons).observe(document.body,{childList:true,subtree:true});}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true}); else init();
})();
