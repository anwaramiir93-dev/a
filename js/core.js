/*
 * Moallemi Frontend Core
 * Shared runtime helpers for the vanilla JS application.
 */
(function (window, document) {
  'use strict';

  const Core = {
    version: '2026.08.18',
    ready: false,

    $: (selector, root = document) => root.querySelector(selector),
    $$: (selector, root = document) => Array.from(root.querySelectorAll(selector)),

    on(target, event, handler, options) {
      if (!target) return () => {};
      target.addEventListener(event, handler, options);
      return () => target.removeEventListener(event, handler, options);
    },

    escape(value) {
      const div = document.createElement('div');
      div.textContent = value == null ? '' : String(value);
      return div.innerHTML;
    },

    debounce(fn, wait = 250) {
      let timer;
      return (...args) => {
        clearTimeout(timer);
        timer = setTimeout(() => fn(...args), wait);
      };
    },

    throttle(fn, wait = 100) {
      let last = 0;
      let timer = null;
      return (...args) => {
        const now = Date.now();
        const remaining = wait - (now - last);
        if (remaining <= 0) {
          clearTimeout(timer);
          timer = null;
          last = now;
          fn(...args);
        } else if (!timer) {
          timer = setTimeout(() => {
            last = Date.now();
            timer = null;
            fn(...args);
          }, remaining);
        }
      };
    },

    safe(fn, fallback = null) {
      try { return fn(); } catch (error) {
        console.error('[Moallemi]', error);
        return fallback;
      }
    },

    loadScript(src) {
      return new Promise((resolve) => {
        if (document.querySelector(`script[data-moallemi-src="${src}"]`)) return resolve();
        const script = document.createElement('script');
        script.src = src;
        script.dataset.moallemiSrc = src;
        script.async = true;
        script.onload = () => resolve(true);
        script.onerror = () => resolve(false);
        document.head.appendChild(script);
      });
    },

    formatNumber(value) {
      return new Intl.NumberFormat('ar-EG').format(Number(value) || 0);
    },

    formatCurrency(value) {
      return new Intl.NumberFormat('ar-EG', {
        style: 'currency', currency: 'EGP', maximumFractionDigits: 0
      }).format(Number(value) || 0);
    },

    toast(message, type = 'info') {
      if (typeof window.showToast === 'function') return window.showToast(message, type);
      let host = document.getElementById('moallemi-toast-host');
      if (!host) {
        host = document.createElement('div');
        host.id = 'moallemi-toast-host';
        host.setAttribute('aria-live', 'polite');
        document.body.appendChild(host);
      }
      const item = document.createElement('div');
      item.textContent = message;
      item.dataset.type = type;
      item.style.cssText = 'padding:12px 16px;border-radius:14px;background:#fff;color:#17212b;box-shadow:0 12px 30px rgba(0,0,0,.12);border:1px solid rgba(0,0,0,.08);font-weight:700;';
      host.appendChild(item);
      setTimeout(() => item.remove(), 3200);
    },

    async updateServiceWorker() {
      if (!('serviceWorker' in navigator)) return null;
      try {
        const registration = await navigator.serviceWorker.register('./sw.js?v=14', { updateViaCache: 'none' });
        await registration.update();
        return registration;
      } catch (error) {
        console.warn('[Moallemi] Service worker update skipped:', error);
        return null;
      }
    },

    async init() {
      if (this.ready) return;
      this.ready = true;
      document.documentElement.dataset.appReady = 'true';
      document.documentElement.dataset.appVersion = this.version;
      document.documentElement.style.overflowX = 'hidden';

      this.on(document, 'keydown', (event) => {
        if (event.key !== 'Escape') return;
        this.safe(() => window.App?.closeMoreMenu?.());
        this.safe(() => window.App?.closeSidebar?.());
        this.safe(() => window.App?.closeModal?.());
      });

      this.$$('a[target="_blank"]').forEach((link) => {
        const rel = new Set((link.getAttribute('rel') || '').split(/\s+/).filter(Boolean));
        rel.add('noopener');
        rel.add('noreferrer');
        link.setAttribute('rel', [...rel].join(' '));
      });

      // These modules are optional enhancements; loading them centrally avoids
      // duplicate script tags and keeps the legacy module files independent.
      await this.loadScript('./js/icons.js?v=14');
      await this.loadScript('./js/app-enhancements.js?v=14');
      this.updateServiceWorker();
    }
  };

  window.MoallemiCore = Core;
  window.addEventListener('DOMContentLoaded', () => Core.init(), { once: true });
})(window, document);
