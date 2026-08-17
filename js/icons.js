/* Modern icon system: Lucide + semantic legacy-icon mapping. */
(function () {
  'use strict';

  const ICONS = {
    '📊': 'chart-no-axes-combined', '👥': 'users-round', '👤': 'user-round', '📁': 'folder',
    '✅': 'circle-check', '❌': 'circle-x', '📝': 'clipboard-list', '📚': 'book-open',
    '💰': 'wallet', '📈': 'chart-line', '🔔': 'bell', '⚙️': 'settings', '⚙': 'settings',
    '🔍': 'search', '👋': 'hand', '📌': 'pin', '🌙': 'moon', '☀️': 'sun', '☀': 'sun',
    '➕': 'plus', '➖': 'minus', '✏️': 'pencil', '✏': 'pencil', '🗑️': 'trash-2', '🗑': 'trash-2',
    '👁️': 'eye', '👁': 'eye', '📅': 'calendar-days', '⏰': 'clock-3', '📋': 'clipboard',
    '💳': 'credit-card', '📤': 'upload', '📥': 'download', '⚠️': 'triangle-alert', '⚠': 'triangle-alert',
    'ℹ️': 'info', 'ℹ': 'info', '❓': 'circle-help', '🏠': 'house', '🎓': 'graduation-cap',
    '🏆': 'trophy', '🔄': 'refresh-cw', '🔒': 'lock', '🔓': 'unlock', '📞': 'phone',
    '✉️': 'mail', '✉': 'mail', '📧': 'mail', '📱': 'smartphone', '🖨️': 'printer', '🖨': 'printer',
    '📄': 'file-text', '📦': 'package', '🔗': 'link', '📢': 'megaphone', '⭐': 'star',
    '❤️': 'heart', '⏳': 'hourglass', '✓': 'check', '×': 'x'
  };

  const ICON_HOST = 'https://unpkg.com/lucide@1.28.0/dist/umd/lucide.min.js';

  function loadLucide() {
    return new Promise((resolve) => {
      if (window.lucide) return resolve();
      const script = document.createElement('script');
      script.src = ICON_HOST;
      script.onload = resolve;
      script.onerror = resolve;
      document.head.appendChild(script);
    });
  }

  function normalize(value) {
    return value.replace(/\uFE0F/g, '').trim();
  }

  function replaceLegacyIcons(root) {
    const scope = root && root.querySelectorAll ? root : document;
    const nodes = scope.querySelectorAll('.nav-icon, .stat-icon, .activity-icon, .empty-icon, .shortcut-icon, .action-icon, .modal-icon, .status-icon, .sub-title, button, a');
    nodes.forEach((el) => {
      if (el.closest('svg, [data-lucide]')) return;
      const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
      const textNodes = [];
      while (walker.nextNode()) textNodes.push(walker.currentNode);
      textNodes.forEach((node) => {
        const raw = node.nodeValue || '';
        const key = normalize(raw);
        const iconName = ICONS[key] || ICONS[raw];
        if (!iconName) return;
        const icon = document.createElement('i');
        icon.setAttribute('data-lucide', iconName);
        icon.className = 'ui-icon';
        node.parentNode.replaceChild(icon, node);
      });
    });

    if (window.lucide && typeof window.lucide.createIcons === 'function') {
      window.lucide.createIcons({ attrs: { 'stroke-width': 1.9 } });
    }
  }

  function boot() {
    const style = document.createElement('style');
    style.textContent = `
      .ui-icon{width:1.12em;height:1.12em;display:inline-block;vertical-align:-.18em;flex:none;stroke-width:1.9;transition:transform .2s ease,opacity .2s ease,color .2s ease;}
      .nav-icon,.stat-icon,.activity-icon,.empty-icon,.shortcut-icon,.action-icon,.modal-icon,.status-icon{display:inline-flex;align-items:center;justify-content:center;}
      .nav-icon .ui-icon{width:20px;height:20px;}
      .stat-icon .ui-icon{width:24px;height:24px;}
      .activity-icon .ui-icon,.shortcut-icon .ui-icon{width:19px;height:19px;}
      button .ui-icon,a .ui-icon{margin-inline-end:.28em;}
      button:hover .ui-icon,a:hover .ui-icon{transform:translateY(-1px);}
      .nav-link:hover .ui-icon{transform:translateX(-2px);}
      .nav-link.active .ui-icon{stroke-width:2.1;}
      .dark-mode-toggle .ui-icon{margin:0;width:19px;height:19px;}
      @media(max-width:600px){.nav-icon .ui-icon{width:18px;height:18px}.stat-icon .ui-icon{width:21px;height:21px}}
    `;
    document.head.appendChild(style);

    loadLucide().then(() => {
      replaceLegacyIcons(document);
      const observer = new MutationObserver((mutations) => {
        mutations.forEach((m) => m.addedNodes.forEach((node) => {
          if (node.nodeType === 1) replaceLegacyIcons(node);
        }));
      });
      observer.observe(document.body, { childList: true, subtree: true });
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
