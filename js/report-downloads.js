/* Report downloads: PDF + Excel only. Keeps the existing report data and filters. */
(function () {
  'use strict';

  const XLSX_URL = 'https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js';
  let xlsxPromise = null;

  function toast(message, type) {
    if (window.App && typeof App.showToast === 'function') App.showToast(message, type || 'success');
    else window.alert(message);
  }

  function loadXLSX() {
    if (window.XLSX) return Promise.resolve(window.XLSX);
    if (xlsxPromise) return xlsxPromise;
    xlsxPromise = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = XLSX_URL;
      script.async = true;
      script.onload = () => window.XLSX ? resolve(window.XLSX) : reject(new Error('XLSX unavailable'));
      script.onerror = reject;
      document.head.appendChild(script);
    });
    return xlsxPromise;
  }

  function getReportTable() {
    const content = document.getElementById('report-content');
    return content ? content.querySelector('table') : null;
  }

  function currentReportName() {
    const active = document.querySelector('#section-reports .tab-btn.active');
    return active ? active.textContent.trim() : 'تقرير';
  }

  function safeFileName(value) {
    return value.replace(/[\\/:*?"<>|]/g, '-').replace(/\s+/g, '-');
  }

  function downloadExcel() {
    const table = getReportTable();
    if (!table) return toast('لا توجد بيانات في التقرير الحالي', 'error');

    loadXLSX().then(XLSX => {
      const workbook = XLSX.utils.table_to_book(table, { sheet: 'التقرير' });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      sheet['!cols'] = Array.from({ length: 12 }, () => ({ wch: 20 }));
      XLSX.writeFile(workbook, `تقرير_${safeFileName(currentReportName())}_${new Date().toISOString().slice(0,10)}.xlsx`);
      toast('تم تحميل تقرير Excel بنجاح', 'success');
    }).catch(() => toast('تعذر تجهيز ملف Excel، تحقق من اتصال الإنترنت ثم حاول مرة أخرى', 'error'));
  }

  function downloadPdf() {
    const table = getReportTable();
    if (!table) return toast('لا توجد بيانات في التقرير الحالي', 'error');

    const report = document.getElementById('report-content');
    const title = currentReportName();
    const originalTitle = document.title;
    const printStyle = document.createElement('style');
    printStyle.id = 'report-pdf-print-style';
    printStyle.textContent = `
      @media print {
        @page { size: A4 portrait; margin: 12mm; }
        body * { visibility: hidden !important; }
        #report-content, #report-content * { visibility: visible !important; }
        #report-content { position: absolute !important; inset: 0 !important; width: 100% !important; padding: 0 !important; background: #fff !important; color: #111 !important; }
        #report-content::before { content: '${title.replace(/'/g, "\\'")}'; display:block; font-size:22px; font-weight:800; margin-bottom:18px; text-align:center; }
        #report-content table { width:100% !important; border-collapse:collapse !important; direction:rtl !important; font-family:Tahoma,Arial,sans-serif !important; font-size:11px !important; }
        #report-content th, #report-content td { border:1px solid #d7d7d7 !important; padding:7px !important; text-align:right !important; }
        #report-content th { background:#f2f2f2 !important; font-weight:800 !important; }
        .report-summary { margin-top:14px !important; }
        .report-actions, .tabs, .filters-bar, .sidebar, #main-header { display:none !important; }
      }
    `;
    document.head.appendChild(printStyle);
    document.title = `تقرير_${safeFileName(title)}`;

    const cleanup = () => {
      printStyle.remove();
      document.title = originalTitle;
      window.removeEventListener('afterprint', cleanup);
    };
    window.addEventListener('afterprint', cleanup);
    window.print();

    // Some mobile browsers do not emit afterprint consistently.
    setTimeout(() => {
      if (document.getElementById('report-pdf-print-style')) cleanup();
    }, 2000);
  }

  function setup() {
    const section = document.getElementById('section-reports');
    if (!section || section.dataset.downloadsReady === '1') return;
    section.dataset.downloadsReady = '1';

    const oldPrint = document.getElementById('btn-print-report');
    const oldExport = document.getElementById('btn-export-report');
    const actions = section.querySelector('.report-actions');
    if (!actions) return;

    actions.innerHTML = '';

    const pdf = document.createElement('button');
    pdf.type = 'button';
    pdf.id = 'btn-download-report-pdf';
    pdf.className = 'btn btn-outline';
    pdf.setAttribute('aria-label', 'تحميل التقرير PDF');
    pdf.innerHTML = '<span aria-hidden="true">PDF</span> تحميل PDF';
    pdf.addEventListener('click', downloadPdf);

    const excel = document.createElement('button');
    excel.type = 'button';
    excel.id = 'btn-download-report-excel';
    excel.className = 'btn btn-outline';
    excel.setAttribute('aria-label', 'تحميل التقرير Excel');
    excel.innerHTML = '<span aria-hidden="true">XLSX</span> تحميل Excel';
    excel.addEventListener('click', downloadExcel);

    actions.append(pdf, excel);
    if (oldPrint) oldPrint.remove();
    if (oldExport) oldExport.remove();
  }

  function boot() {
    setup();
    const observer = new MutationObserver(setup);
    observer.observe(document.body, { childList: true, subtree: true });
    setTimeout(() => observer.disconnect(), 15000);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
