/*
 * Moallemi Frontend Core
 * Shared runtime helpers for the vanilla JS application.
 * Keeps modules independent while providing consistent UX, safety and performance.
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
      return function (...args) {
        clearTimeout(timer);
        timer = setTimeout(() => fn.apply(this, args), wait);
      };
    },

    throttle(fn, wait = 100) {
      let last = 0;
      let timer;
      return function (...args) {
        const now = Date.now();
        const remaining = wait - (now - last);
        if (remaining <= 0) {
          clearTimeout(timer);
          timer = null;
          last = now;
          fn.apply(this, args);
        } else if (!timer) {
          timer = setTimeout(() => {
            last = Date.now();
            timer = null;
            fn.apply(this, args);
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

    formatNumber(value) {
      const number = Number(value) || 0;
      return new Intl.NumberFormat('ar-EG').format(number);
    },

    formatCurrency(value) {
      const number = Number(value) || 0;
      return new Intl.NumberFormat('ar-EG', {
        style: 'currency',
        currency: 'EGP',
        maximumFractionDigits: 0
      }).format(number);
    },

    toast(message, type = 'info') {
      if (typeof window.showToast === 'function') {
        window.showToast(message, type);
        return;
      }
      let host = document.getElementById('moallemi-toast-host');
      if (!host) {
        host = document.createElement('div');
        host.id = 'moallemi-toast-host';
        host.setAttribute('aria-live', 'polite');
        host.style.cssText = 'position:fixed;z-index:99999;bottom:24px;right:24px;display:grid;gap:10px;max-width:min(380px,calc(100vw - 32px));';
        document.body.appendChild(host);
      }
      const item = document.createElement('div');
      item.textContent = message;
      item.style.cssText = 'padding:12px 16px;border-radius:14px;background:#fff;color:#17212b;box-shadow:0 12px 30px rgba(0,0,0,.12);border:1px solid rgba(0,0,0,.08);font-weight:700;';
      item.dataset.type = type;
      host.appendChild(item);
      setTimeout(() => item.remove(), 3200);
    },

    async updateServiceWorker() {
      if (!('serviceWorker' in navigator)) return;
      try {
        const registration = await navigator.serviceWorker.register('./sw.js?v=13', { updateViaCache: 'none' });
        await registration.update();
        return registration;
      } catch (error) {
        console.warn('[Moallemi] Service worker update skipped:', error);
        return null;
      }
    },

    init() {
      if (this.ready) return;
      this.ready = true;
      document.documentElement.dataset.appReady = 'true';
      document.documentElement.dataset.appVersion = this.version;

      // Prevent accidental horizontal overflow caused by third-party widgets.
      document.documentElement.style.overflowX = 'hidden';

      // Close menus/modals with Escape where the existing application exposes close methods.
      this.on(document, 'keydown', (event) => {
        if (event.key !== 'Escape') return;
        this.safe(() => window.App?.closeMoreMenu?.());
        this.safe(() => window.App?.closeSidebar?.());
        this.safe(() => window.App?.closeModal?.());
      });

      // Make external links safer without changing internal navigation.
      this.$$('a[target="_blank"]').forEach((link) => {
        const rel = new Set((link.getAttribute('rel') || '').split(/\s+/).filter(Boolean));
        rel.add('noopener');
        rel.add('noreferrer');
        link.setAttribute('rel', Array.from(rel).join(' '));
      });

      this.updateServiceWorker();
    }
  };

  window.MoallemiCore = Core;
  window.addEventListener('DOMContentLoaded', () => Core.init(), { once: true });
})(window, document);
