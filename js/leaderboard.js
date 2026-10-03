/* =========================================================
   leaderboard.js —— 资本排行榜（带 SDK 加载等待）
   ========================================================= */
(function () {

  const save = loadGame();
  renderNavEnergy(save.energy);

  const myCapital = calcCapital(save);
  const myTitle = getCapitalTitle(myCapital);
  const myId = save.playerId || '未命名玩家';

  const COLLAPSE_LIMIT = 20;
  let expanded = false;
  let allPlayers = [];
  let loading = false;

  const btnRefresh = document.getElementById('btnRefresh');
  const btnCloudTest = document.getElementById('btnCloudTest');
  const lbLoading = document.getElementById('lbLoading');
  const lbLoadingText = document.getElementById('lbLoadingText');

  /* ---------- loading ---------- */
  function showLoading(text) {
    if (lbLoadingText) lbLoadingText.textContent = text || '正在加载…';
    if (lbLoading) lbLoading.hidden = false;
    if (btnRefresh) btnRefresh.disabled = true;
  }
  function hideLoading() {
    if (lbLoading) lbLoading.hidden = true;
    if (btnRefresh) btnRefresh.disabled = false;
  }
  function setCloudStatus(text, color) {
    const el = document.getElementById('cloudStatus');
    if (!el) return;
    el.textContent = text;
    el.style.color = color || 'var(--muted)';
  }

  /* ---------- 等 SDK 就绪 ---------- */
  async function waitForSDK(maxWaitMs) {
    const maxWait = maxWaitMs || 8000;
    let waited = 0;
    while (waited < maxWait) {
      if (window.__supabaseStatus === 'ok') return true;
      if (window.__supabaseStatus === 'fail') return false;
      await sleep(150);
      waited += 150;
    }
    return false;
  }

  /* ---------- 我的资本卡片 ---------- */
  function renderMyRank() {
    let myRank = 0;
    for (let i = 0; i < allPlayers.length; i++) {
      if (allPlayers[i].isMe) { myRank = i + 1; break; }
    }
    if (myRank === 0) myRank = allPlayers.length + 1;

    const next = getNextCapitalTitle(myCapital);
    let progressHtml = '';
    if (next) {
      const prev = getCapitalTitle(myCapital);
      const cur = myCapital - prev.min;
      const total = next.min - prev.min;
      const percent = Math.max(0, Math.min(100, (cur / total) * 100));
      progressHtml =
        '<div class="title-progress-label">距离「' + next.name + '」还差 ' +
          formatNumber(next.min - myCapital) + ' 资本</div>' +
        '<div class="title-progress-bar">' +
          '<div class="title-progress-fill" style="width:' + percent.toFixed(1) +
            '%;background:' + next.color + '"></div>' +
        '</div>';
    } else {
      progressHtml = '<div class="title-progress-label">🏆 你已达到最高称号！</div>';
    }

    document.getElementById('myRankCard').innerHTML =
      '<div class="my-rank-top">' +
        '<div class="my-title-badge" style="border-color:' + myTitle.color +
          ';color:' + myTitle.color + '">' +
          '<span class="icon ' + myTitle.icon + '"></span>' +
          '<span class="my-title-name">' + myTitle.name + '</span>' +
        '</div>' +
        '<div class="my-capital">' +
          '<div class="stat-label">当前资本</div>' +
          '<div class="stat-value" style="color:' + myTitle.color + '">' +
            formatNumber(myCapital) + '</div>' +
        '</div>' +
      '</div>' +
      '<div class="my-rank-info">' +
        '<span class="badge">玩家：' + escapeHtml(myId) + '</span>' +
        '<span class="badge">排名 #' + myRank + ' / ' + allPlayers.length + '</span>' +
      '</div>' +
      '<div class="title-progress">' + progressHtml + '</div>';
  }

  /* ---------- 排行榜列表 ---------- */
  function renderLeaderboard() {
    const list = document.getElementById('leaderboardList');
    const toggleWrap = document.getElementById('lbToggleWrap');

    if (allPlayers.length === 0) {
      list.innerHTML = '<p class="hint" style="text-align:center;padding:20px 0;">' +
        '暂无数据，点击右上角「刷新」加载</p>';
      toggleWrap.innerHTML = '';
      return;
    }

    const showAll = expanded || allPlayers.length <= COLLAPSE_LIMIT;
    const displayList = showAll ? allPlayers : allPlayers.slice(0, COLLAPSE_LIMIT);

    let html = '';
    for (let i = 0; i < displayList.length; i++) {
      const p = displayList[i];
      const title = getCapitalTitle(p.capital);
      const rank = i + 1;
      let rankClass = '';
      if (rank === 1) rankClass = ' rank-gold';
      else if (rank === 2) rankClass = ' rank-silver';
      else if (rank === 3) rankClass = ' rank-bronze';
      const meClass = p.isMe ? ' is-me' : '';
      html +=
        '<div class="lb-row' + rankClass + meClass + '">' +
          '<div class="lb-rank">#' + rank + '</div>' +
          '<div class="lb-info">' +
            '<div class="lb-name">' + escapeHtml(p.name) + '</div>' +
            '<div class="lb-title" style="color:' + title.color + '">' +
              '<span class="icon ' + title.icon + ' icon-sm"></span>' +
              title.name +
            '</div>' +
          '</div>' +
          '<div class="lb-capital">' + formatNumber(p.capital) + '</div>' +
        '</div>';
    }
    list.innerHTML = html;

    if (allPlayers.length <= COLLAPSE_LIMIT) {
      toggleWrap.innerHTML = '';
      return;
    }
    if (expanded) {
      toggleWrap.innerHTML =
        '<button class="btn btn-ghost" id="lbToggleBtn">收起，只看前 ' +
          COLLAPSE_LIMIT + ' 名</button>';
    } else {
      const hiddenCount = allPlayers.length - COLLAPSE_LIMIT;
      toggleWrap.innerHTML =
        '<button class="btn" id="lbToggleBtn">展开全部（还有 ' + hiddenCount + ' 名）</button>';
    }
    const toggleBtn = document.getElementById('lbToggleBtn');
    if (toggleBtn) {
      toggleBtn.addEventListener('click', function () {
        expanded = !expanded;
        renderLeaderboard();
      });
    }
  }

  function escapeHtml(s) {
    if (!s) return '';
    return String(s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  /* ---------- 刷新排行榜 ---------- */
  async function refreshLeaderboard() {
    if (loading) return;
    loading = true;

    /* 等 SDK 加载完成 */
    if (window.__supabaseStatus !== 'ok') {
      showLoading('正在加载云端 SDK…');
      setCloudStatus('⏳ 正在加载云端 SDK…', 'var(--muted)');
      const ready = await waitForSDK(8000);
      if (!ready) {
        setCloudStatus('⚠ 云端加载失败，仅显示本地数据', 'var(--danger)');
        allPlayers = [{ id: 'me', name: myId, capital: myCapital, isMe: true }];
        hideLoading();
        renderMyRank();
        renderLeaderboard();
        loading = false;
        return;
      }
    }

    if (typeof isSupabaseReady !== 'function' || !isSupabaseReady()) {
      setCloudStatus('⚠ 云端未就绪，仅显示本地数据', 'var(--danger)');
      allPlayers = [{ id: 'me', name: myId, capital: myCapital, isMe: true }];
      hideLoading();
      renderMyRank();
      renderLeaderboard();
      loading = false;
      return;
    }

    try {
      if (myId && myId !== '未命名玩家') {
        showLoading('正在上传我的分数…');
        setCloudStatus('正在上传…', 'var(--muted)');
        await syncScoreToCloud(myId, myCapital, myTitle.name,
          save.clickCount, save.totalEnergy);
        await sleep(500);
      }

      showLoading('正在拉取排行榜…');
      setCloudStatus('正在拉取云端数据…', 'var(--muted)');
      const cloudList = await fetchLeaderboardFromCloud(200);

      if (cloudList === null) {
        setCloudStatus('⚠ 云端读取失败，请稍后重试', 'var(--danger)');
        if (allPlayers.length === 0) {
          allPlayers = [{ id: 'me', name: myId, capital: myCapital, isMe: true }];
        }
      } else {
        allPlayers = [];
        const usedNames = new Set();
        for (let i = 0; i < cloudList.length; i++) {
          const row = cloudList[i];
          const name = String(row.player_name || '');
          if (!name) continue;
          usedNames.add(name);
          allPlayers.push({
            id: row.id, name: name,
            capital: Number(row.capital) || 0,
            isMe: name === myId
          });
        }
        if (!usedNames.has(myId)) {
          allPlayers.push({
            id: 'me', name: myId, capital: myCapital, isMe: true
          });
        }
        allPlayers.sort(function (a, b) { return b.capital - a.capital; });
        setCloudStatus('✓ 已连接云端，共 ' + allPlayers.length + ' 位玩家',
          'var(--primary)');
      }
    } catch (e) {
      console.error('刷新异常：', e);
      setCloudStatus('⚠ 刷新出错：' + e.message, 'var(--danger)');
      if (allPlayers.length === 0) {
        allPlayers = [{ id: 'me', name: myId, capital: myCapital, isMe: true }];
      }
    }

    hideLoading();
    renderMyRank();
    renderLeaderboard();
    loading = false;
  }

  function sleep(ms) {
    return new Promise(function (r) { setTimeout(r, ms); });
  }

  /* =========================================================
     云端诊断（自动等待 SDK 加载）
     ========================================================= */
  async function runCloudDiagnostic() {
    if (window.__supabaseStatus === 'loading') {
      notify('SDK 正在加载中，请稍候…', 'info');
      const ok = await waitForSDK(8000);
      if (!ok) {
        notify('❌ 步骤1：SDK 加载失败（CDN 被墙）', 'error');
        return;
      }
    }

    notify('开始云端诊断…', 'info');

    if (window.__supabaseStatus === 'fail' || typeof supabase === 'undefined') {
      notify('❌ 步骤1：SDK 未加载（CDN 被墙）', 'error');
      return;
    }
    notify('✅ 步骤1：SDK 已加载', 'success');

    if (typeof isSupabaseReady !== 'function') {
      notify('❌ 步骤2：supabase-config.js 未加载', 'error');
      return;
    }
    if (!isSupabaseReady()) {
      notify('❌ 步骤2：URL 或 Key 未配置', 'error');
      return;
    }
    notify('✅ 步骤2：配置已加载', 'success');

    if (!save.playerId) {
      notify('❌ 步骤3：没有玩家 ID', 'error');
      return;
    }
    notify('✅ 步骤3：玩家 ID = ' + save.playerId, 'success');

    notify('正在上传 ' + Math.floor(myCapital) + ' 资本…', 'info');
    try {
      const ok = await syncScoreToCloud(
        save.playerId, myCapital, myTitle.name,
        save.clickCount, save.totalEnergy
      );
      if (ok) {
        notify('✅ 步骤4：上传成功', 'success');
      } else {
        const detail = (typeof lastSyncError !== 'undefined' && lastSyncError)
          ? lastSyncError
          : '未知错误';
        notify('❌ 步骤4：' + detail, 'error');
      }
    } catch (e) {
      notify('❌ 步骤4：异常 ' + (e.message || e), 'error');
    }

    notify('正在拉取…', 'info');
    try {
      const list = await fetchLeaderboardFromCloud(20);
      if (list === null) {
        notify('❌ 步骤5：拉取失败', 'error');
      } else {
        notify('✅ 步骤5：拉取成功，云端有 ' + list.length + ' 位玩家', 'success');
      }
    } catch (e) {
      notify('❌ 步骤5：拉取异常 ' + (e.message || e), 'error');
    }
  }

  /* ---------- 事件绑定 ---------- */
  if (btnRefresh) {
    btnRefresh.addEventListener('click', function () {
      refreshLeaderboard();
    });
  }
  if (btnCloudTest) {
    btnCloudTest.addEventListener('click', function () {
      runCloudDiagnostic();
    });
  }

  /* =========================================================
     首次加载：等 SDK 就绪后自动刷新
     ========================================================= */
  (async function initFirstLoad() {
    showLoading('正在加载云端 SDK…');
    setCloudStatus('⏳ 正在加载云端 SDK…', 'var(--muted)');

    const ready = await waitForSDK(10000);
    if (!ready) {
      setCloudStatus('⚠ 云端加载失败，仅显示本地数据', 'var(--danger)');
      allPlayers = [{ id: 'me', name: myId, capital: myCapital, isMe: true }];
      hideLoading();
      renderMyRank();
      renderLeaderboard();
      return;
    }

    hideLoading();
    refreshLeaderboard();
  })();

})();