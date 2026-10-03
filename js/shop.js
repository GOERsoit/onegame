/* =========================================================
   shop.js —— 商店页逻辑（灰色可点 + 购买失败原因提示）
   ========================================================= */
(function () {

  const shopEnergy = document.getElementById('shopEnergy');
  const shopCapital = document.getElementById('shopCapital');
  const tabBar = document.getElementById('shopTabs');
  const groupPanel = document.getElementById('shopGroup');

  const save = loadGame();
  renderNavEnergy(save.energy);

  let activeGroup = SHOP_GROUPS[0].key;

  /* ---------- 资本显示 ---------- */
  function renderCapital() {
    if (shopCapital) {
      shopCapital.textContent = formatNumber(calcCapital(save));
    }
  }

  /* ---------- 分区标签栏 ---------- */
  function renderTabs() {
    let html = '';
    for (let i = 0; i < SHOP_GROUPS.length; i++) {
      const g = SHOP_GROUPS[i];
      const active = (g.key === activeGroup) ? ' active' : '';
      let dot = '';
      for (let j = 0; j < g.items.length; j++) {
        const id = g.items[j];
        const lv = save.upgrades[id] || 0;
        const price = getUpgradePrice(id, lv);
        const cap = calcCapital(save);
        const capitalOk = cap >= (UPGRADES[id].capitalReq || 0);
        if (save.energy >= price && checkUpgradePrereq(save, id) && capitalOk) {
          dot = '<span class="tab-dot"></span>';
          break;
        }
      }
      html +=
        '<button class="shop-tab' + active + '" data-group="' + g.key + '" type="button">' +
          '<span class="icon ' + g.icon + ' icon-sm"></span>' +
          '<span>' + g.name + '</span>' +
          dot +
        '</button>';
    }
    tabBar.innerHTML = html;

    const btns = tabBar.querySelectorAll('.shop-tab');
    for (let i = 0; i < btns.length; i++) {
      btns[i].addEventListener('click', function () {
        activeGroup = this.getAttribute('data-group');
        renderTabs();
        renderGroup();
      });
    }
  }

  /* ---------- 单张卡片 ---------- */
  function buildCard(id) {
    const u = UPGRADES[id];
    const level = save.upgrades[id] || 0;
    const price = getUpgradePrice(id, level);
    const prereqOk = checkUpgradePrereq(save, id);
    const capital = calcCapital(save);
    const capitalReq = u.capitalReq || 0;
    const capitalOk = capital >= capitalReq;
    const maxed = u.maxLevel > 0 && level >= u.maxLevel;
    const affordable = save.energy >= price && prereqOk && capitalOk && !maxed;

    /* 状态徽章 */
    let statusBadge = '';
    if (maxed) {
      statusBadge = '<span class="badge badge-done">已满级</span>';
    } else if (!prereqOk) {
      statusBadge = '<span class="badge badge-lock">需先解锁前置</span>';
    } else if (!capitalOk) {
      statusBadge = '<span class="badge badge-lock">资本不足</span>';
    }

    /* 累计效果 */
    let effectText = '';
    if (id === 'click') {
      effectText = '总加成：+' + formatNumber(calcClickBonus(level));
    } else if (id === 'auto') {
      effectText = '总加成：+' + formatNumber(calcAutoBonus(level)) + ' / 秒';
    } else if (id === 'clickMult') {
      effectText = '当前倍率：×' + Math.pow(1.08, level).toFixed(2);
    } else if (id === 'autoMult') {
      effectText = '当前倍率：×' + Math.pow(1.08, level).toFixed(2);
    } else if (id === 'globalMult') {
      effectText = '当前倍率：×' + Math.pow(1.05, level).toFixed(2);
    } else if (id === 'critRate') {
      effectText = '当前暴击率：' + (calcCritRate(save.upgrades) * 100).toFixed(1) + '%';
    } else if (id === 'critDmg') {
      effectText = '当前暴击倍率：×' + calcCritDmg(save.upgrades).toFixed(1);
    } else if (id === 'autoClicker') {
      effectText = '当前自动点击：' + calcAutoClickRate(save.upgrades).toFixed(1) + ' 次/秒';
    } else if (id === 'offlineCap') {
      const cap = calcOfflineCap(save.upgrades);
      effectText = '离线上限：' + (cap === Infinity ? '无限制' : cap + ' 小时');
    } else if (id === 'offlineEff') {
      effectText = '当前效率：' + (calcOfflineEff(save.upgrades) * 100).toFixed(0) + '%';
    } else if (id === 'timeFlow') {
      effectText = '结算间隔：' + Math.round(calcTickInterval(save.upgrades)) + ' ms';
    } else if (id === 'speedGear') {
      effectText = '投资周期缩减：' + (Math.min(0.02 * level, 0.5) * 100).toFixed(0) + '%';
    } else if (id === 'luckyCoin') {
      effectText = '成功率加成：×' + calcInvestLuckBonus(save.upgrades).toFixed(2);
    } else if (id === 'fateDice') {
      effectText = '暴击率额外加成：+' + (level * 1) + '%';
    } else if (id === 'refine') {
      effectText = '点击转入存款：' + (calcRefinePercent(save.upgrades) * 100).toFixed(0) + '%';
    } else if (id === 'depositBoost') {
      effectText = '存款利率：' + (calcDepositRate(save.upgrades) * 100).toFixed(4) + '% / 秒';
    }

    /* 按钮：永远可点，不可购买时用 btn-locked 灰掉 */
    const btnClass = affordable ? 'btn btn-primary btn-buy' : 'btn btn-locked btn-buy';
    const btnText = maxed ? '已满级' : '购买';

    const card = document.createElement('div');
    card.className = 'upgrade-card' + (affordable ? ' affordable' : '');

    card.innerHTML =
      '<div class="upgrade-icon"><span class="icon ' + u.icon + '"></span></div>' +
      '<div class="upgrade-body">' +
        '<div class="upgrade-head">' +
          '<h3>' + u.name + '</h3>' +
          '<span class="badge">Lv.' + level +
            (u.maxLevel > 0 ? ' / ' + u.maxLevel : '') + '</span>' +
          statusBadge +
        '</div>' +
        '<p class="upgrade-desc">' + u.desc + '</p>' +
        (effectText ? '<p class="upgrade-effect">' + effectText + '</p>' : '') +
        '<div class="upgrade-foot">' +
          '<span class="price' + (affordable ? '' : ' poor') + '">' +
            (maxed ? '已满级' :
              '<span class="icon icon-coin icon-sm"></span>' + formatNumber(price)) +
          '</span>' +
          '<button class="' + btnClass + '" type="button">' + btnText + '</button>' +
        '</div>' +
      '</div>';

    const buyBtn = card.querySelector('.btn-buy');
    buyBtn.addEventListener('click', function () {
      buyUpgrade(id);
    });

    return card;
  }

  /* ---------- 当前分区渲染 ---------- */
  function renderGroup() {
    let group = null;
    for (let i = 0; i < SHOP_GROUPS.length; i++) {
      if (SHOP_GROUPS[i].key === activeGroup) { group = SHOP_GROUPS[i]; break; }
    }
    if (!group) return;

    groupPanel.innerHTML = '';
    for (let i = 0; i < group.items.length; i++) {
      groupPanel.appendChild(buildCard(group.items[i]));
    }
  }

  /* ---------- 购买（失败原因按优先级提示） ---------- */
  function buyUpgrade(id) {
    const u = UPGRADES[id];
    const level = save.upgrades[id] || 0;
    const price = getUpgradePrice(id, level);
    const capital = calcCapital(save);

    /* 1. 前置未解锁 */
    if (!checkUpgradePrereq(save, id)) {
      const preName = u.prereq ? UPGRADES[u.prereq].name : '前置升级';
      notify('购买不了：需要先解锁「' + preName + '」', 'error');
      return;
    }

    /* 2. 已满级 */
    if (u.maxLevel > 0 && level >= u.maxLevel) {
      notify('购买不了：该升级已满级', 'error');
      return;
    }

    /* 3. 资本不足 */
    const capitalReq = u.capitalReq || 0;
    if (capital < capitalReq) {
      notify('购买不了：需要资本 ' + formatNumber(capitalReq) +
        '，当前 ' + formatNumber(capital), 'error');
      return;
    }

    /* 4. 能量不足 */
    if (save.energy < price) {
      const gap = price - save.energy;
      notify('购买不了：需要 ' + formatNumber(price) + ' 能量，还差 ' +
        formatNumber(gap), 'error');
      return;
    }

    /* 全部通过 → 执行购买 */
    save.energy -= price;
    save.upgrades[id] = level + 1;
    recalcSave(save);
    saveGame(save);

    renderAll();
    notify('购买成功：' + u.name + ' 升至 Lv.' + (level + 1), 'success');
    handleAchievements(save);
    renderAll();
  }

  /* ---------- 全局刷新 ---------- */
  function renderAll() {
    shopEnergy.textContent = formatNumber(save.energy);
    renderNavEnergy(save.energy);
    renderCapital();
    renderTabs();
    renderGroup();
  }

  renderAll();
})();