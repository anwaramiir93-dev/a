/* Final app bootstrap: brand + modern theme + optional feature modules. */
(function () {
  'use strict';
  const VERSION = '10';

  function load(src) {
    return new Promise((resolve) => {
      if (document.querySelector(`script[data-enhancement="${src}"]`)) return resolve();
      const s = document.createElement('script');
      s.src = `${src}?v=${VERSION}`;
      s.dataset.enhancement = src;
      s.onload = resolve;
      s.onerror = resolve;
      document.body.appendChild(s);
    });
  }

  function applyBrand() {
    document.title = 'معلمي | Moallemi';
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', '#0f766e');

    const replacements = [
      ['.sidebar-brand', 'معلمي | Moallemi'],
      ['.splash-title', 'معلمي'],
      ['.splash-subtitle', 'منصة تعليمية حديثة لإدارة الطلاب والمجموعات والحضور والدرجات والمدفوعات'],
      ['.splash-content', null]
    ];
    replacements.forEach(([selector, text]) => {
      if (!text) return;
      document.querySelectorAll(selector).forEach(el => el.textContent = text);
    });

    const splash = document.querySelector('.splash-content');
    if (splash && !splash.querySelector('.splash-brand-en')) {
      const en = document.createElement('div');
      en.className = 'splash-brand-en';
      en.textContent = 'Moallemi';
      const title = splash.querySelector('.splash-title');
      if (title) title.insertAdjacentElement('afterend', en);
    }

    document.querySelectorAll('.splash-logo,.sidebar-logo').forEach(img => {
      img.alt = 'معلمي | Moallemi';
      img.src = `assets/logo.png?v=${VERSION}`;
    });

    const appName = document.getElementById('setting-app-name');
    if (appName && (!appName.value || appName.value === 'إدارة الطلاب')) appName.value = 'معلمي | Moallemi';
    document.querySelectorAll('.app-info-value').forEach(el => {
      if (el.textContent.trim() === 'إدارة الطلاب') el.textContent = 'معلمي | Moallemi';
    });
  }

  async function boot() {
    applyBrand();
    await load('./js/icons.js');
    await load('./js/whatsapp-report.js');
    await load('./js/guardian-whatsapp.js');
    await load('./js/report-downloads.js');
    applyBrand();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, {once:true});
  else boot();
})();
