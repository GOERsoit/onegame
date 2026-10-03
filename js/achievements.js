/* =========================================================
   achievements.js —— 成就页逻辑（树形渲染 + 连线）
   ========================================================= */
(function () {

  const achStats = document.getElementById('achStats');
  const achTree = document.getElementById('achTree');

  const save = loadGame();
  renderNavEnergy(save.energy);

  /* ---------- 时间格式化 ---------- */
  function formatTime(ts) {
    if (!ts || typeof ts !== 'number') return '';
    const d = new Date(ts);
    const pad = function (n) { return n < 10 ? '0' + n : String(n); };
    return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()) +
      ' ' + pad(d.getHours()) + ':' + pad(d.getMinutes());
  }

  /* ---------- 顶部统计 ---------- */
  function renderStats() {
    const unlocked = countUnlocked(save);
    const total = ACHIEVEMENT_ORDER.length;
    const percent = total > 0 ? Math.round(unlocked / total * 100) : 0;

    achStats.innerHTML =
      '<div>' +
        '<div class="stat-label">成就总数</div>' +
        '<div class="stat-value">' + total + '</div>' +
      '</div>' +
      '<div>' +
        '<div class="stat-label">已解锁</div>' +
        '<div class="stat-value accent">' + unlocked + '</div>' +
      '</div>' +
      '<div>' +
        '<div class="stat-label">完成度</div>' +
        '<div class="stat-value">' + percent + '%</div>' +
      '</div>';
  }

  /* ---------- 树形渲染：从根节点递归 ---------- */
  function renderTree() {
    /* 找根节点（parent 为 null） */
    let roots = [];
    for (let i = 0; i < ACHIEVEMENT_ORDER.length; i++) {
      const id = ACHIEVEMENT_ORDER[i];
      if (!ACHIEVEMENTS[id].parent) roots.push(id);
    }

    let html = '<div class="tree-root">';
    for (let i = 0; i < roots.length; i++) {
      html += renderNode(roots[i], 0);
    }
    html += '</div>';
    achTree.innerHTML = html;
  }

  /* ---------- 递归渲染节点 ---------- */
  function renderNode(id, depth) {
    const def = ACHIEVEMENTS[id];
    if (!def) return '';

    const unlockedAt = save.achievements[id];
    const unlocked = !!unlockedAt;

    /* 找子节点 */
    const children = [];
    for (let i = 0; i < ACHIEVEMENT_ORDER.length; i++) {
      const cid = ACHIEVEMENT_ORDER[i];
      if (ACHIEVEMENTS[cid].parent === id) children.push(cid);
    }

    /* 前置检查 */
    const parentOk = !def.parent || !!save.achievements[def.parent];
    const canUnlock = parentOk && !unlocked;

    /* 状态类 */
    let stateClass = 'locked';
    if (unlocked) stateClass = 'unlocked';
    else if (canUnlock) stateClass = 'available';

    /* 进度显示 */
    let progressText = '';
    if (!unlocked && canUnlock) {
      const p = def.progress ? def.progress(save) : [0, 1];
      const cur = Math.min(p[0], p[1]);
      progressText = '<div class="ach-meta">进度：' +
        formatNumber(cur) + ' / ' + formatNumber(p[1]) + '</div>';
    } else if (unlocked) {
      progressText = '<div class="ach-meta">解锁时间：' + formatTime(unlockedAt) + '</div>';
    } else {
      progressText = '<div class="ach-meta">需先解锁：' +
        ACHIEVEMENTS[def.parent].name + '</div>';
    }

    let html =
      '<div class="tree-node ' + stateClass + '" data-id="' + id + '">' +
        '<div class="tree-line-v"></div>' +
        '<div class="tree-node-content">' +
          '<div class="ach-card ' + stateClass + '">' +
            '<div class="ach-icon">' +
              '<span class="icon ' + (unlocked ? def.icon : (canUnlock ? def.icon : 'icon-lock')) + '"></span>' +
            '</div>' +
            '<div class="ach-body">' +
              '<p class="ach-name">' + def.name + '</p>' +
              '<p class="ach-desc">' + def.desc + '</p>' +
              progressText +
            '</div>' +
            '<span class="ach-state">' +
              (unlocked ? '已解锁' : (canUnlock ? '可解锁' : '锁定')) +
            '</span>' +
          '</div>';

    if (children.length > 0) {
      html += '<div class="tree-children">';
      for (let i = 0; i < children.length; i++) {
        html += renderNode(children[i], depth + 1);
      }
      html += '</div>';
    }

    html += '</div></div>';
    return html;
  }

  /* ---------- 启动 ---------- */
  renderStats();
  renderTree();
})();