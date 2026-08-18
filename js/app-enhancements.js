/*
 * Moallemi enhancement bootstrap.
 * Loads branding and optional feature modules once, after the base app is ready.
 */
(function () {
  'use strict';

  const VERSION = '14';
  const loaded = new Set();

  function load(src) {
    if (loaded.has(src) || document.querySelector(`script[data-enhancement="${src}"]`)) {
      return Promise.resolve(true);
    }

    return new Promise((resolve) => {
      const script = document.createElement('script');
      script.src = `${src}?v=${VERSION}`;
      script.dataset.enhancement = src;
      script.async = true;
      script.onload = () => { loaded.add(src); resolve(true); };
      script.onerror = () => resolve(false);
      document.head.appendChild(script);
    });
  }

  function applyBrand() {
    document.title = 'معلمي | Moallemi';

    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', '#087d83');

    const brand = document.querySelector('.sidebar-brand');
    if (brand) brand.textContent = 'معلمي | Moallemi';

    const splashTitle = document.querySelector('.splash-title');
    if (splashTitle) splashTitle.textContent = 'معلمي';

    const splashSubtitle = document.querySelector('.splash-subtitle');
    if (splashSubtitle) {
      splashSubtitle.textContent = 'منصة تعليمية حديثة لإدارة الطلاب والمجموعات والحضور والدرجات والمدفوعات';
    }

    const splash = document.querySelector('.splash-content');
    if (splash && !splash.querySelector('.splash-brand-en')) {
      const en = document.createElement('div');
      en.className = 'splash-brand-en';
      en.textContent = 'Moallemi';
      const title = splash.querySelector('.splash-title');
      if (title) title.insertAdjacentElement('afterend', en);
    }

    document.querySelectorAll('.splash-logo,.sidebar-logo').forEach((img) => {
      img.alt = 'معلمي | Moallemi';
      img.src = `assets/logo.png?v=${VERSION}`;
    });

    const appName = document.getElementById('setting-app-name');
    if (appName && (!appName.value || appName.value === 'إدارة الطلاب')) {
      appName.value = 'معلمي | Moallemi';
    }

    document.querySelectorAll('.app-info-value').forEach((el) => {
      if (el.textContent.trim() === 'إدارة الطلاب') el.textContent = 'معلمي | Moallemi';
    });
  }

  async function boot() {
    applyBrand();
    await load('./js/whatsapp-report.js');
    await load('./js/guardian-whatsapp.js');
    await load('./js/report-downloads.js');
    applyBrand();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot, { once: true });
  } else {
    boot();
  }
})();
