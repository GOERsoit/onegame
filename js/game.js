/* =========================================================
   game.js —— 主游戏页（点击音效 + 云端同步）
   ========================================================= */
(function () {

  /* ---------- 元素引用 ---------- */
  const statEnergy = document.getElementById('statEnergy');
  const statAuto = document.getElementById('statAuto');
  const statClick = document.getElementById('statClick');
  const coreButton = document.getElementById('coreButton');
  const floatLayer = document.getElementById('floatLayer');
  const progressPanel = document.getElementById('progressPanel');
  const recentPanel = document.getElementById('recentPanel');

  /* ---------- 读取存档 ---------- */
  const save = loadGame();
  renderNavEnergy(save.energy);

  /* =========================================================
     云端同步
     ========================================================= */

  let lastSyncTime = 0;
  const SYNC_THROTTLE_MS = 3000;

  let debugShown = {
    notReady: false,
    notDefined: false
  };

  function syncMyScoreToCloud(silent) {
    if (typeof syncScoreToCloud !== 'function') {
      if (!debugShown.notDefined) {
        debugShown.notDefined = true;
        notify('❌ supabase-config.js 未加载', 'error');
      }
      return;
    }

    if (typeof isSupabaseReady !== 'function' || !isSupabaseReady()) {
      if (!debugShown.notReady) {
        debugShown.notReady = true;
        notify('❌ Supabase 未就绪，请检查 URL 和 Key', 'error');
      }
      return;
    }

    const playerId = save.playerId;
    if (!playerId) {
      if (!silent) notify('❌ 没有玩家 ID', 'error');
      return;
    }

    const capital = calcCapital(save);
    const title = getCapitalTitle(capital);

    if (!silent) notify('正在上传：' + playerId + ' / ' + Math.floor(capital), 'info');

    syncScoreToCloud(
      playerId, capital, title.name,
      save.clickCount, save.totalEnergy
    ).then(function (ok) {
      if (ok) {
        if (!silent) notify('✅ 云端同步成功', 'success');
      } else {
        notify('❌ 云端同步失败（检查 RLS 策略）', 'error');
      }
    }).catch(function (e) {
      notify('❌ 云端异常：' + (e.message || e), 'error');
    });
  }

  function throttledSync() {
    const now = Date.now();
    if (now - lastSyncTime < SYNC_THROTTLE_MS) return;
    lastSyncTime = now;
    syncMyScoreToCloud(true);
  }

  /* =========================================================
     离线收益
     ========================================================= */
  (function applyOfflineEarnings() {
    const now = Date.now();
    const capHours = calcOfflineCap(save.upgrades);
    const eff = calcOfflineEff(save.upgrades);

    if (save.lastTime > 0 && save.autoPower > 0) {
      let seconds = Math.floor((now - save.lastTime) / 1000);
      if (seconds > 0) {
        const capped = (capHours === Infinity)
          ? seconds
          : Math.min(seconds, capHours * 3600);
        const gain = capped * save.autoPower * eff;
        if (gain > 0) {
          save.energy += gain;
          save.totalEnergy += gain;
          const hours = Math.floor(capped / 3600);
          const mins = Math.floor((capped % 3600) / 60);
          let timeText = '';
          if (hours > 0) timeText += hours + ' 小时 ';
          timeText += mins + ' 分钟';
          setTimeout(function () {
            notify('离线收益 +' + formatNumber(gain) + '（' + timeText + '）', 'success');
          }, 400);
        }
      }
    }
    save.lastTime = now;
    saveGame(save);
  })();

  const recentList = [];

  /* ---------- 还贷 ---------- */
  function handleLoanRepay(gain) {
    if (!save.bank || save.bank.loan <= 0) return gain;
    const repay = gain * BANK_CONFIG.loanRepayPercent;
    const actual = Math.min(repay, save.bank.loan);
    if (actual > 0) {
      save.bank.loan -= actual;
      return gain - actual;
    }
    return gain;
  }

  /* ---------- 状态渲染 ---------- */
  function renderStats() {
    statEnergy.textContent = formatNumber(save.energy);
    statAuto.textContent = formatNumber(save.autoPower) + ' / 秒';
    const critRate = calcCritRate(save.upgrades);
    const autoClick = calcAutoClickRate(save.upgrades);
    let clickText = formatNumber(save.clickPower);
    if (critRate > 0.05 || autoClick > 0) {
      clickText += '（暴击 ' + (critRate * 100).toFixed(0) + '%）';
    }
    statClick.textContent = clickText;
    renderNavEnergy(save.energy);
  }

  /* ---------- 进度提示 ---------- */
  function renderProgress() {
    let html = '';

    let best = null;
    for (let i = 0; i < UPGRADE_ORDER.length; i++) {
      const id = UPGRADE_ORDER[i];
      const u = UPGRADES[id];
      const lv = save.upgrades[id] || 0;
      if (u.maxLevel > 0 && lv >= u.maxLevel) continue;
      if (!checkUpgradePrereq(save, id)) continue;
      const price = getUpgradePrice(id, lv);
      if (price > save.energy) {
        if (!best || price < best.price) {
          best = { id: id, price: price };
        }
      }
    }

    if (best) {
      const u = UPGRADES[best.id];
      const gap = best.price - save.energy;
      html +=
        '<div class="progress-item">' +
          '<span class="icon icon-coin"></span>' +
          '<span>下一个升级：<strong>' + u.name + '</strong>，需要 ' +
          formatNumber(best.price) + ' 能量，还差 ' + formatNumber(gap) + '</span>' +
        '</div>';
    } else {
      html +=
        '<div class="progress-item">' +
          '<span class="icon icon-check"></span>' +
          '<span>目前所有可购买的升级都能买得起了，去商店看看！</span>' +
        '</div>';
    }

    if (save.bank && save.bank.loan > 0) {
      html +=
        '<div class="progress-item">' +
          '<span class="icon icon-lock"></span>' +
          '<span>当前欠款：<strong>' + formatNumber(save.bank.loan) +
          '</strong>，每次获得能量会自动扣 10% 还贷</span>' +
        '</div>';
    }

    let nextAch = null;
    for (let i = 0; i < ACHIEVEMENT_ORDER.length; i++) {
      const id = ACHIEVEMENT_ORDER[i];
      if (save.achievements[id]) continue;
      const def = ACHIEVEMENTS[id];
      if (def.parent && !save.achievements[def.parent]) continue;
      nextAch = def;
      break;
    }

    if (nextAch) {
      const p = nextAch.progress(save);
      const cur = Math.min(p[0], p[1]);
      html +=
        '<div class="progress-item">' +
          '<span class="icon icon-achievement"></span>' +
          '<span>下一个成就：<strong>' + nextAch.name + '</strong>（' +
          formatNumber(cur) + ' / ' + formatNumber(p[1]) + '）</span>' +
        '</div>';
    } else {
      html +=
        '<div class="progress-item">' +
          '<span class="icon icon-trophy"></span>' +
          '<span>所有成就均已解锁，恭喜你成为能量大师！</span>' +
        '</div>';
    }

    progressPanel.innerHTML = html;
  }

  /* ---------- 最近解锁成就 ---------- */
  function renderRecent() {
    if (recentList.length === 0) {
      recentPanel.innerHTML =
        '<div class="recent-item">' +
          '<span class="icon icon-trophy icon-sm"></span>' +
          '<span>最近还没有解锁新的成就。</span>' +
        '</div>';
      return;
    }
    let html = '<div class="recent-item"><span class="icon icon-trophy icon-sm"></span>' +
      '<span>最近解锁的成就：</span></div>';
    for (let i = 0; i < recentList.length; i++) {
      const def = ACHIEVEMENTS[recentList[i]];
      if (!def) continue;
      html +=
        '<div class="recent-item">' +
          '<span class="icon icon-check icon-sm"></span>' +
          '<span>' + def.name + ' —— ' + def.desc + '</span>' +
        '</div>';
    }
    recentPanel.innerHTML = html;
  }

  /* ---------- 飘字 ---------- */
  function spawnFloat(text, evt, isCrit) {
    const rect = floatLayer.getBoundingClientRect();
    let x = rect.width / 2;
    let y = rect.height / 2;

    if (evt && typeof evt.clientX === 'number' && typeof evt.clientY === 'number') {
      const cx = evt.clientX;
      const cy = evt.clientY;
      if (cx > 0 || cy > 0) {
        x = cx - rect.left;
        y = cy - rect.top;
      }
    }

    const el = document.createElement('span');
    el.className = 'float-num' + (isCrit ? ' crit' : '');
    el.textContent = text;
    el.style.left = x + 'px';
    el.style.top = y + 'px';
    floatLayer.appendChild(el);

    setTimeout(function () {
      if (el.parentNode) el.parentNode.removeChild(el);
    }, 980);
  }

  /* ---------- 点击核心 ---------- */
  function performClick(evt, isAuto) {
    const critRate = calcCritRate(save.upgrades);
    const critDmg = calcCritDmg(save.upgrades);
    const baseGain = save.clickPower;

    let gain = baseGain;
    let isCrit = false;

    if (Math.random() < critRate) {
      isCrit = true;
      gain = baseGain * critDmg;
      save.critCount = (save.critCount || 0) + 1;
    }

    const echoLevel = save.upgrades.echoClick || 0;
    if (echoLevel > 0 && Math.random() < 0.05 * echoLevel) {
      gain *= 2;
    }

    const chainLevel = save.upgrades.chainClick || 0;
    if (chainLevel > 0) {
      gain += save.autoPower * chainLevel;
    }

    if ((save.upgrades.milestoneDouble || 0) >= 1) {
      gain += save.autoPower * 0.1;
    }

    const refinePercent = calcRefinePercent(save.upgrades);
    if (refinePercent > 0) {
      const toDeposit = gain * refinePercent;
      save.bank.deposit += toDeposit;
      gain -= toDeposit;
    }

    gain = handleLoanRepay(gain);

    save.energy += gain;
    save.totalEnergy += gain;
    save.clickCount += 1;

    /* ---------- 播放点击音效（自动点击器不发声） ---------- */
    if (!isAuto && typeof playClickSound === 'function') {
      playClickSound();
    }

    const text = (isCrit ? '暴击 +' : '+') + formatNumber(gain);
    spawnFloat(text, isAuto ? null : evt, isCrit);

    if (!isAuto) {
      coreButton.classList.remove('pop');
      void coreButton.offsetWidth;
      coreButton.classList.add('pop');
    }

    renderStats();
    throttledSync();

    const newly = handleAchievements(save);
    if (newly.length > 0) {
      for (let i = 0; i < newly.length; i++) {
        if (recentList.indexOf(newly[i]) === -1) recentList.unshift(newly[i]);
      }
      recentList.splice(4);
      renderRecent();
    }
  }

  coreButton.addEventListener('click', function (evt) {
    performClick(evt, false);
  });

  /* ---------- 主循环 ---------- */
  let tickCount = 0;
  let autoClickAccum = 0;
  let currentInterval = calcTickInterval(save.upgrades);

  function gameTick() {
    const interval = calcTickInterval(save.upgrades);
    const dt = interval / 1000;

    if (save.autoPower > 0) {
      let gain = save.autoPower * dt;
      gain = handleLoanRepay(gain);
      save.energy += gain;
      save.totalEnergy += gain;
    }

    const acRate = calcAutoClickRate(save.upgrades);
    if (acRate > 0) {
      autoClickAccum += acRate * dt;
      while (autoClickAccum >= 1) {
        autoClickAccum -= 1;
        performClick(null, true);
      }
    }

    renderStats();

    tickCount++;
    if (tickCount % Math.max(1, Math.round(1000 / interval)) === 0) {
      renderProgress();
      const newly = handleAchievements(save);
      if (newly.length > 0) {
        for (let i = 0; i < newly.length; i++) {
          if (recentList.indexOf(newly[i]) === -1) recentList.unshift(newly[i]);
        }
        recentList.splice(4);
        renderRecent();
      }
    }
  }

  function scheduleTick() {
    const interval = calcTickInterval(save.upgrades);
    if (interval !== currentInterval) {
      currentInterval = interval;
      clearInterval(tickTimer);
      tickTimer = setInterval(gameTick, interval);
    }
  }

  let tickTimer = setInterval(gameTick, currentInterval);

  /* ---------- 每 5 秒保存 + 静默同步 ---------- */
  setInterval(function () {
    scheduleTick();
    saveGame(save);
    syncMyScoreToCloud(true);
  }, 5000);

  window.addEventListener('beforeunload', function () {
    saveGame(save);
  });

  document.addEventListener('visibilitychange', function () {
    if (document.visibilityState === 'visible') {
      const now = Date.now();
      const capHours = calcOfflineCap(save.upgrades);
      const eff = calcOfflineEff(save.upgrades);

      if (save.lastTime > 0 && save.autoPower > 0) {
        let seconds = Math.floor((now - save.lastTime) / 1000);
        if (seconds > 30) {
          const capped = (capHours === Infinity)
            ? seconds
            : Math.min(seconds, capHours * 3600);
          const gain = capped * save.autoPower * eff;
          if (gain > 0) {
            save.energy += gain;
            save.totalEnergy += gain;
            notify('离开期间获得 +' + formatNumber(gain) + ' 能量', 'success');
          }
        }
      }
      save.lastTime = now;
      saveGame(save);
      renderStats();
      syncMyScoreToCloud(true);
    }
  });

  /* =========================================================
     初始化
     ========================================================= */
  renderStats();
  renderProgress();
  renderRecent();
  handleAchievements(save);

  if (save.clickCount === 0 && save.energy === 0) {
    setTimeout(function () {
      notify('点击中央的能量核心开始收集能量吧！', 'info');
    }, 500);
  }

  setTimeout(function () {
    syncMyScoreToCloud(true);
  }, 2000);
})();