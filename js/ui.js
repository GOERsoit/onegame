/* =========================================================
   ui.js —— 导航栏、主题、通知、游客拦截
   ========================================================= */

const NAV_ITEMS = [
  { href: 'index.html', label: '首页', icon: 'icon-home', page: 'index' },
  { href: 'game.html', label: '游戏', icon: 'icon-game', page: 'game' },
  { href: 'shop.html', label: '商店', icon: 'icon-shop', page: 'shop' },
  { href: 'finance.html', label: '金融', icon: 'icon-coin', page: 'finance' },
  { href: 'leaderboard.html', label: '排行', icon: 'icon-trophy', page: 'leaderboard' },
  { href: 'achievements.html', label: '成就', icon: 'icon-achievement', page: 'achievements' },
  { href: 'settings.html', label: '设置', icon: 'icon-settings', page: 'settings' },
  { href: 'help.html', label: '帮助', icon: 'icon-help', page: 'help' }
];

/* ---------- 快速检测：是否有存档 ---------- */
function quickHasSave() {
  try {
    return !!localStorage.getItem('css_energy_workshop_save_v2');
  } catch (e) {
    return false;
  }
}

/* ---------- 是否游客（没 playerId 就是游客） ---------- */
function isGuest() {
  try {
    const save = loadGame();
    if (save && save.playerId && save.playerId.trim()) return false;
  } catch (e) {}
  return true;
}

function renderNav() {
  const nav = document.getElementById('mainNav');
  if (!nav) return;
  const current = document.body.dataset.page || '';
  let linksHtml = '';
  for (let i = 0; i < NAV_ITEMS.length; i++) {
    const item = NAV_ITEMS[i];
    const active = (item.page === current) ? ' active' : '';
    linksHtml +=
      '<a class="nav-link' + active + '" href="' + item.href + '"' +
        ' data-page="' + item.page + '">' +
        '<span class="icon ' + item.icon + ' icon-sm"></span>' +
        '<span>' + item.label + '</span>' +
      '</a>';
  }
  nav.innerHTML =
    '<div class="nav-inner">' +
      '<a class="nav-brand" href="index.html">' +
        '<span class="icon icon-core"></span>' +
        '<span>能量工坊</span>' +
      '</a>' +
      '<div class="nav-links">' + linksHtml + '</div>' +
      '<div class="nav-energy">' +
        '<span class="icon icon-coin icon-sm"></span>' +
        '<span id="navEnergyValue">0</span>' +
      '</div>' +
    '</div>';
}

function renderNavEnergy(value) {
  const el = document.getElementById('navEnergyValue');
  if (el) el.textContent = formatNumber(value);
}

function applyTheme(theme) {
  const t = (theme === 'light') ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', t);
}

function notify(message, type) {
  const wrap = document.getElementById('notifyWrap');
  if (!wrap) return;
  while (wrap.children.length >= 3) {
    wrap.removeChild(wrap.firstChild);
  }
  const el = document.createElement('div');
  el.className = 'notify notify-' + (type || 'info');
  el.textContent = message;
  wrap.appendChild(el);
  setTimeout(function () {
    el.classList.add('out');
    setTimeout(function () {
      if (el.parentNode) el.parentNode.removeChild(el);
    }, 320);
  }, 3000);
}

/* =========================================================
   应用游客状态
   - 首页 / 帮助页：body 不加 not-registered → 整页保持全亮
     但 window.__isGuest = true → 导航点击拦截生效
   - 其他页面：body 加 not-registered → 变暗 + 遮罩
   ========================================================= */
function applyGuestState() {
  const page = document.body.dataset.page || '';
  const guest = isGuest();
  window.__isGuest = guest;

  if (guest) {
    if (page === 'index' || page === 'help') {
      document.body.classList.remove('not-registered');
    } else {
      document.body.classList.add('not-registered');
    }
  } else {
    document.body.classList.remove('not-registered');
  }
}

/* =========================================================
   全局点击拦截：游客点击非首页链接 → 拦截
   ========================================================= */
(function interceptNavForGuests() {
  document.addEventListener('click', function (e) {
    if (!window.__isGuest) return;

    /* 弹框、按钮、通知、导入相关 放行 */
    const allowed = e.target.closest(
      '.confirm-box, .notify-wrap, .notify, #btnNew, #btnContinue, #btnImportExternal, #importSaveFile, #importSaveFile2'
    );
    if (allowed) return;

    /* 找最近的链接 */
    const link = e.target.closest('a[href]');
    if (!link) return;

    /* 首页链接放行 */
    const href = link.getAttribute('href') || '';
    if (href === 'index.html' || href === '/' || href === '') return;
    if (link.classList.contains('nav-brand')) return;

    /* 其他 → 拦截 */
    e.preventDefault();
    e.stopPropagation();
    if (typeof notify === 'function') {
      notify('请先在首页创建角色', 'error');
    }
  }, true);
})();

/* ---------- 初始化 ---------- */
(function initUI() {
  function boot() {
    renderNav();
    const save = loadGame();
    applyTheme(save.settings.theme);
    renderNavEnergy(save.energy);

    /* 立即应用游客状态 */
    applyGuestState();

    /* 通知 index.js 更新按钮 */
    document.dispatchEvent(new CustomEvent('ui-ready'));
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();