/* One-click detailed student report for WhatsApp. Client-side only. */
const WhatsAppReport = {
  normalizePhone(phone) {
    if (!phone) return '';
    let value = String(phone).replace(/[^\d+]/g, '');
    if (value.startsWith('00')) value = '+' + value.slice(2);
    if (/^01\d{9}$/.test(value)) value = '+20' + value.slice(1);
    return value.replace(/\D/g, '');
  },

  getReport(studentId) {
    const students = StorageManager.get('sm_students') || [];
    const groups = StorageManager.get('sm_groups') || [];
    const attendance = (StorageManager.get('sm_attendance') || []).filter(a => a.studentId === studentId);
    const grades = (StorageManager.get('sm_grades') || []).filter(g => g.studentId === studentId);
    const payments = (StorageManager.get('sm_payments') || []).filter(p => p.studentId === studentId);
    const student = students.find(s => s.id === studentId);
    if (!student) return null;

    const group = groups.find(g => g.id === student.groupId);
    const present = attendance.filter(a => a.status === 'حاضر' || a.status === 'متأخر').length;
    const absent = attendance.filter(a => a.status === 'غائب').length;
    const attendanceRate = attendance.length ? Math.round((present / attendance.length) * 100) : 0;
    const percentages = grades.map(g => {
      if (g.percentage != null && !isNaN(Number(g.percentage))) return Number(g.percentage);
      const score = Number(g.score), total = Number(g.total || 100);
      return total > 0 ? (score / total) * 100 : 0;
    });
    const gradeAverage = percentages.length ? Math.round(percentages.reduce((a,b) => a+b, 0) / percentages.length) : 0;
    const paid = payments.filter(p => p.status === 'مدفوع').reduce((sum,p) => sum + Number(p.amount || 0), 0);
    const partial = payments.filter(p => p.status === 'مدفوع جزئياً').reduce((sum,p) => sum + Number(p.amount || 0), 0);
    const outstanding = payments.filter(p => p.status === 'غير مدفوع').reduce((sum,p) => sum + Number(p.amount || 0), 0);

    return { student, group, attendance, grades, payments, present, absent, attendanceRate, gradeAverage, paid, partial, outstanding };
  },

  buildMessage(data) {
    const { student, group, attendance, grades, attendanceRate, gradeAverage, paid, partial, outstanding } = data;
    const date = DemoData.getArabicDate(DemoData.getTodayDate());
    return [
      '📚 *معلمي | تقرير متابعة الطالب*','',
      `👤 *الطالب:* ${student.name}`,
      `📁 *المجموعة:* ${group ? group.name : '-'}`,
      `📅 *تاريخ التقرير:* ${date}`,'',
      '📊 *ملخص الأداء*',
      `• الحضور: ${attendanceRate}% (${attendance.length} سجل)`,
      `• حاضر/متأخر: ${data.present}`,
      `• غياب: ${data.absent}`,
      `• متوسط الدرجات: ${gradeAverage ? gradeAverage + '%' : 'لا توجد درجات'}`,'',
      '📝 *آخر الدرجات*',
      ...(grades.length ? grades.slice(-5).reverse().map(g => `• ${g.examName || 'اختبار'}${g.subject ? ' - ' + g.subject : ''}: ${g.score ?? '-'} / ${g.total || 100} (${g.percentage != null ? g.percentage + '%' : '—'})`) : ['• لا توجد درجات مسجلة']),'',
      '💳 *المدفوعات*',
      `• المدفوع: ${paid.toFixed(2)}`,
      `• مدفوع جزئيًا: ${partial.toFixed(2)}`,
      `• غير مدفوع: ${outstanding.toFixed(2)}`,'',
      '🎯 *ملاحظة المعلم*', student.notes || 'لا توجد ملاحظات إضافية.','',
      'مع تحيات *معلمي | Moallemi* 🌿'
    ].join('\n');
  },

  send(studentId) {
    const data = this.getReport(studentId);
    if (!data) return;
    const phone = this.normalizePhone(data.student.guardianPhone || data.student.parentPhone || data.student.phone);
    if (!phone) {
      App.showToast('أضف رقم ولي الأمر في بيانات الطالب أولاً', 'error');
      return;
    }
    const url = `https://wa.me/${phone}?text=${encodeURIComponent(this.buildMessage(data))}`;
    window.open(url, '_blank', 'noopener,noreferrer');
    if (typeof App.addActivity === 'function') App.addActivity('تم تجهيز تقرير واتساب للطالب: ' + data.student.name, 'report');
  },

  installButton() {
    const modal = document.getElementById('modal-student-details');
    if (!modal || modal.dataset.whatsappReady === '1') return;
    modal.dataset.whatsappReady = '1';
    const header = modal.querySelector('.modal-header');
    if (!header) return;
    const button = document.createElement('button');
    button.type = 'button';
    button.id = 'btn-whatsapp-student-report';
    button.className = 'btn btn-whatsapp-report';
    button.title = 'إرسال تقرير مفصل لولي الأمر عبر واتساب';
    button.innerHTML = '<span aria-hidden="true">◉</span> إرسال التقرير عبر واتساب';
    const close = header.querySelector('.modal-close-btn');
    header.insertBefore(button, close || null);
    button.addEventListener('click', () => {
      const name = (document.getElementById('detail-student-name')?.textContent || '').trim();
      const student = (StorageManager.get('sm_students') || []).find(s => s.name === name);
      if (student) this.send(student.id);
    });
  },

  boot() {
    const style = document.createElement('style');
    style.textContent = `.btn-whatsapp-report{margin-inline-start:auto;margin-inline-end:10px;background:linear-gradient(135deg,#16877e,#0f706b);color:#fff;border:0;border-radius:12px;padding:9px 14px;font-weight:800;box-shadow:0 7px 18px rgba(15,118,110,.18);transition:.2s}.btn-whatsapp-report:hover{transform:translateY(-2px);box-shadow:0 10px 24px rgba(15,118,110,.25)}.btn-whatsapp-report span{display:inline-block;margin-inline-end:6px}@media(max-width:600px){.btn-whatsapp-report{font-size:11px;padding:8px 10px}.btn-whatsapp-report span{display:none}}`;
    document.head.appendChild(style);
    const observer = new MutationObserver(() => {
      const modal = document.getElementById('modal-student-details');
      if (modal && !modal.classList.contains('hidden')) this.installButton();
    });
    observer.observe(document.body, { childList:true, subtree:true, attributes:true, attributeFilter:['class'] });
  }
};

window.WhatsAppReport = WhatsAppReport;
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => WhatsAppReport.boot());
else WhatsAppReport.boot();
