/* Premium icon system + guaranteed visual theme loader. */
(function () {
  'use strict';

  const ICONS = {
    '📊':'chart-no-axes-combined','👥':'users-round','👤':'user-round','📁':'folder','✅':'circle-check',
    '❌':'circle-x','📝':'clipboard-list','📚':'book-open','💰':'wallet','📈':'chart-line','🔔':'bell',
    '⚙️':'settings','⚙':'settings','🔍':'search','👋':'hand','📌':'pin','🌙':'moon','☀️':'sun','☀':'sun',
    '➕':'plus','➖':'minus','✏️':'pencil','✏':'pencil','🗑️':'trash-2','🗑':'trash-2','👁️':'eye','👁':'eye',
    '📅':'calendar-days','⏰':'clock-3','📋':'clipboard','💳':'credit-card','📤':'upload','📥':'download',
    '⚠️':'triangle-alert','⚠':'triangle-alert','ℹ️':'info','ℹ':'info','❓':'circle-help','🏠':'house',
    '🎓':'graduation-cap','🏆':'trophy','🔄':'refresh-cw','🔒':'lock','🔓':'unlock','📞':'phone',
    '✉️':'mail','✉':'mail','📧':'mail','📱':'smartphone','🖨️':'printer','🖨':'printer','📄':'file-text',
    '📦':'package','🔗':'link','📢':'megaphone','⭐':'star','❤️':'heart','⏳':'hourglass','✓':'check','×':'x',
    '🔽':'chevron-down','▶️':'play','⏸️':'pause','⏹️':'square','↗️':'arrow-up-right','↙️':'arrow-down-left',
    '📍':'map-pin','🎯':'target','🏅':'medal','📖':'book-open','🧑‍🏫':'presentation','👨‍🎓':'graduation-cap',
    '📣':'megaphone','🔎':'search','🛡️':'shield-check','🔐':'shield-check','🗂️':'folders','🧾':'receipt',
    '🧮':'calculator','📆':'calendar-check','⏱️':'timer','💡':'lightbulb','❤️‍🔥':'heart'
  };

  const ICON_HOST = 'https://unpkg.com/lucide@1.28.0/dist/umd/lucide.min.js';
  const ICON_TONE = {
    'chart-no-axes-combined':'mint','chart-line':'lavender','users-round':'lavender','user-round':'lavender',
    'folder':'blush','circle-check':'mint','clipboard-list':'sky','book-open':'butter','wallet':'mint',
    'bell':'blush','settings':'lavender','search':'butter','pin':'sky','moon':'lavender','sun':'blush',
    'calendar-days':'butter','clock-3':'sky','credit-card':'blush','lock':'lavender','house':'mint',
    'trophy':'sky','mail':'butter','star':'lavender','trash-2':'mint','plus':'mint','pencil':'sky',
    'printer':'sky','file-text':'blush','receipt':'blush','shield-check':'mint','graduation-cap':'butter',
    'target':'sky','medal':'butter','calculator':'lavender','timer':'sky','lightbulb':'butter'
  };

  function loadStyles() {
    if (document.getElementById('premium-andalusian-theme')) return;
    ['css/andalusian.css','css/premium-andalusian.css'].forEach((href, index) => {
      const link = document.createElement('link');
      link.id = index === 0 ? 'andalusian-theme' : 'premium-andalusian-theme';
      link.rel = 'stylesheet';
      link.href = href + '?v=2026-08-18-premium';
      document.head.appendChild(link);
    });
  }

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

  function normalize(value) { return value.replace(/\uFE0F/g, '').trim(); }

  function iconForName(name) {
    const icon = document.createElement('i');
    icon.setAttribute('data-lucide', name);
    icon.className = 'ui-icon';
    icon.dataset.iconTone = ICON_TONE[name] || 'mint';
    return icon;
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
        node.parentNode.replaceChild(iconForName(iconName), node);
      });
    });
    if (window.lucide && typeof window.lucide.createIcons === 'function') {
      window.lucide.createIcons({ attrs: { 'stroke-width': 1.85 } });
    }
  }

  function boot() {
    loadStyles();
    const style = document.createElement('style');
    style.textContent = `
      .ui-icon{width:1.08em;height:1.08em;display:inline-block;vertical-align:-.18em;flex:none;stroke-width:1.85;transition:transform .2s ease,opacity .2s ease,color .2s ease;}
      .nav-icon,.stat-icon,.activity-icon,.empty-icon,.shortcut-icon,.action-icon,.modal-icon,.status-icon{display:inline-flex;align-items:center;justify-content:center;}
      .nav-icon .ui-icon{width:20px;height:20px}.stat-icon .ui-icon{width:24px;height:24px}.activity-icon .ui-icon,.shortcut-icon .ui-icon{width:19px;height:19px}.action-icon .ui-icon,.modal-icon .ui-icon,.status-icon .ui-icon{width:18px;height:18px}
      button .ui-icon,a .ui-icon{margin-inline-end:.28em} button:hover .ui-icon,a:hover .ui-icon{transform:translateY(-1px)} .nav-link:hover .ui-icon{transform:translateX(-2px)} .nav-link.active .ui-icon{stroke-width:2}
      .dark-mode-toggle .ui-icon{margin:0;width:19px;height:19px}.icon-tile,.stat-icon,.shortcut-icon,.activity-icon,.empty-icon{border-radius:15px}
      .icon-tile[data-icon-tone="mint"],.stat-icon[data-icon-tone="mint"]{background:#eaf6ee;color:#4d9070}.icon-tile[data-icon-tone="lavender"],.stat-icon[data-icon-tone="lavender"]{background:#f0ebf7;color:#78649c}.icon-tile[data-icon-tone="blush"],.stat-icon[data-icon-tone="blush"]{background:#fbecef;color:#b86c7b}.icon-tile[data-icon-tone="butter"],.stat-icon[data-icon-tone="butter"]{background:#fff5dc;color:#b98222}.icon-tile[data-icon-tone="sky"],.stat-icon[data-icon-tone="sky"]{background:#eaf3f9;color:#47779d}
      @media(max-width:600px){.nav-icon .ui-icon{width:18px;height:18px}.stat-icon .ui-icon{width:21px;height:21px}}
    `;
    document.head.appendChild(style);
    loadLucide().then(() => {
      replaceLegacyIcons(document);
      const observer = new MutationObserver((mutations) => mutations.forEach((m) => m.addedNodes.forEach((node) => { if (node.nodeType === 1) replaceLegacyIcons(node); })));
      observer.observe(document.body, { childList:true, subtree:true });
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
