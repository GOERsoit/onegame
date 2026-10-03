/* =========================================================
   index.js —— 首页逻辑
   - 快速检测存档 → 控制"继续游戏"按钮状态
   - 支持导入外部存档（选文件 / 粘贴文本）
   ========================================================= */
(function () {
  const btnNew = document.getElementById('btnNew');
  const btnContinue = document.getElementById('btnContinue');
  const btnImportExternal = document.getElementById('btnImportExternal');

  const newConfirm = document.getElementById('newConfirm');
  const btnNewConfirm = document.getElementById('btnNewConfirm');
  const btnNewCancel = document.getElementById('btnNewCancel');

  const idConfirm = document.getElementById('idConfirm');
  const playerIdInput = document.getElementById('playerIdInput');
  const btnIdConfirm = document.getElementById('btnIdConfirm');
  const btnIdRandom = document.getElementById('btnIdRandom');
  const btnIdCancel = document.getElementById('btnIdCancel');
  const idHint = document.getElementById('idHint');

  const cloudLoading = document.getElementById('cloudLoading');
  const cloudLoadingText = document.getElementById('cloudLoadingText');

  const importSaveFile = document.getElementById('importSaveFile');
  const importDialog = document.getElementById('importDialog');
  const importSaveFile2 = document.getElementById('importSaveFile2');
  const importTextArea = document.getElementById('importTextArea');
  const btnImportTextConfirm = document.getElementById('btnImportTextConfirm');
  const btnImportCancel = document.getElementById('btnImportCancel');
  const importHint = document.getElementById('importHint');

  const summary = document.getElementById('saveSummary');

  /* =========================================================
     快速检测 + "继续游戏"按钮状态
     ========================================================= */
  function updateContinueButton() {
    if (!btnContinue) return;
    if (quickHasSave()) {
      btnContinue.classList.remove('btn-empty');
      btnContinue.disabled = false;
      btnContinue.innerHTML =
        '<span class="icon icon-game"></span>继续游戏';
    } else {
      btnContinue.classList.add('btn-empty');
      btnContinue.disabled = false;
      btnContinue.innerHTML =
        '<span class="icon icon-game"></span>继续游戏（无存档）';
    }
  }

  /* ---------- loading ---------- */
  function showLoading(text) {
    if (!cloudLoading) return;
    if (cloudLoadingText) cloudLoadingText.textContent = text || '正在连接云端…';
    cloudLoading.hidden = false;
  }
  function hideLoading() {
    if (!cloudLoading) return;
    cloudLoading.hidden = true;
  }

  /* ---------- 等 SDK ---------- */
  async function waitForSDK(maxWaitMs) {
    const maxWait = maxWaitMs || 8000;
    let waited = 0;
    while (waited < maxWait) {
      if (window.__supabaseStatus === 'ok') return 'ok';
      if (window.__supabaseStatus === 'fail') return 'fail';
      await sleep(150);
      waited += 150;
    }
    return 'timeout';
  }
  function sleep(ms) {
    return new Promise(function (r) { setTimeout(r, ms); });
  }

  /* ---------- 渲染存档摘要 ---------- */
  function renderSummary() {
    const save = loadGame();
    const capital = calcCapital(save);
    const title = getCapitalTitle(capital);
    const hasData = hasSave() && (save.energy > 0 || save.totalEnergy > 0 ||
      save.clickCount > 0 || getTotalLevels(save.upgrades) > 0 ||
      (save.bank && save.bank.deposit > 0));

    const playerId = save.playerId || '未命名';

    summary.innerHTML =
      '<div class="summary-grid">' +
        '<div class="summary-item">' +
          '<div class="summary-label">玩家 ID</div>' +
          '<div class="summary-value">' + playerId + '</div>' +
        '</div>' +
        '<div class="summary-item">' +
          '<div class="summary-label">当前称号</div>' +
          '<div class="summary-value" style="color:' + title.color + '">' +
            title.name + '</div>' +
        '</div>' +
        '<div class="summary-item">' +
          '<div class="summary-label">当前能量</div>' +
          '<div class="summary-value">' + formatNumber(save.energy) + '</div>' +
        '</div>' +
        '<div class="summary-item">' +
          '<div class="summary-label">资本</div>' +
          '<div class="summary-value accent">' + formatNumber(capital) + '</div>' +
        '</div>' +
      '</div>' +
      (hasData
        ? '<p class="hint">检测到已有存档，可以直接继续游戏。</p>'
        : '<p class="hint">还没有存档，点击「开始新游戏」开始你的能量之旅。</p>');
  }

  /* =========================================================
     开始新游戏
     ========================================================= */
  btnNew.addEventListener('click', function () {
    if (hasSave()) {
      newConfirm.hidden = false;
    } else {
      openIdDialog();
    }
  });

  btnNewCancel.addEventListener('click', function () {
    newConfirm.hidden = true;
  });

  btnNewConfirm.addEventListener('click', function () {
    newConfirm.hidden = true;
    openIdDialog();
  });

  function openIdDialog() {
    idConfirm.hidden = false;
    playerIdInput.value = '';
    playerIdInput.focus();
    setIdHint('支持字母、数字、下划线和中文，2~12 字符', 'normal');
    hideLoading();
    btnIdConfirm.dataset.skipCloud = '';
    btnIdConfirm.disabled = false;
    btnIdRandom.disabled = false;
  }

  function closeIdDialog() {
    idConfirm.hidden = true;
    hideLoading();
  }

  function setIdHint(text, type) {
    idHint.textContent = text;
    if (type === 'error') {
      idHint.style.color = 'var(--danger)';
    } else if (type === 'success') {
      idHint.style.color = 'var(--primary)';
    } else {
      idHint.style.color = 'var(--muted)';
    }
  }

  btnIdRandom.addEventListener('click', function () {
    const id = generateRandomId();
    playerIdInput.value = id;
    setIdHint('已生成随机 ID：' + id + '，点击「确定」开始', 'success');
    btnIdConfirm.dataset.skipCloud = '';
  });

  btnIdCancel.addEventListener('click', function () {
    closeIdDialog();
  });

  /* =========================================================
     确认创建
     ========================================================= */
  let creating = false;

  btnIdConfirm.addEventListener('click', async function () {
    if (creating) return;

    const id = (playerIdInput.value || '').trim();

    if (!id) {
      setIdHint('请输入 ID，或点击「随机生成」', 'error');
      return;
    }
    if (!isValidPlayerId(id)) {
      setIdHint('ID 只能包含字母、数字、下划线或中文，长度 2~12', 'error');
      return;
    }
    if (isReservedId(id)) {
      setIdHint('该 ID 已被占用（与系统保留名冲突），换一个吧', 'error');
      return;
    }

    if (btnIdConfirm.dataset.skipCloud === '1') {
      btnIdConfirm.dataset.skipCloud = '';
      creating = true;
      btnIdConfirm.disabled = true;
      btnIdRandom.disabled = true;
      await createCharacter(id);
      return;
    }

    creating = true;
    btnIdConfirm.disabled = true;
    btnIdRandom.disabled = true;

    setIdHint('正在准备云端检查…', 'normal');
    showLoading('正在准备云端检查…');

    const sdkStatus = await waitForSDK(8000);

    if (sdkStatus === 'fail' || sdkStatus === 'timeout') {
      hideLoading();
      setIdHint('⚠ 云端暂不可用，无法检查重名。再次点击「确定」强制创建', 'error');
      creating = false;
      btnIdConfirm.disabled = false;
      btnIdRandom.disabled = false;
      btnIdConfirm.dataset.skipCloud = '1';
      return;
    }

    setIdHint('正在检查 ID「' + id + '」是否被占用…', 'normal');
    showLoading('正在检查 ID 是否已被占用…');

    let exists = null;
    try {
      exists = await checkPlayerIdExistsInCloud(id);
    } catch (e) {
      exists = null;
    }

    hideLoading();

    if (exists === true) {
      setIdHint('该 ID 已被其他玩家使用，换一个吧', 'error');
      creating = false;
      btnIdConfirm.disabled = false;
      btnIdRandom.disabled = false;
      return;
    }

    if (exists === null) {
      setIdHint('云端检查失败，无法确认是否重名。再次点击「确定」强制创建', 'error');
      creating = false;
      btnIdConfirm.disabled = false;
      btnIdRandom.disabled = false;
      btnIdConfirm.dataset.skipCloud = '1';
      return;
    }

    setIdHint('检查通过，正在创建角色…', 'success');
    await createCharacter(id);
  });

  async function createCharacter(id) {
    clearSave();
    const save = defaultSave();
    save.playerId = id;
    saveGame(save);

    hideLoading();
    notify('角色「' + id + '」创建成功！', 'success');

    setTimeout(function () {
      window.location.href = 'game.html';
    }, 500);
  }

  playerIdInput.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' && !creating) {
      btnIdConfirm.click();
    }
  });

  /* =========================================================
     继续游戏
     ========================================================= */
  btnContinue.addEventListener('click', function () {
    if (hasSave()) {
      window.location.href = 'game.html';
      return;
    }
    /* 无存档 → 打开导入弹框 */
    openImportDialog();
  });

  /* =========================================================
     导入外部存档
     ========================================================= */
  btnImportExternal.addEventListener('click', function () {
    openImportDialog();
  });

  function openImportDialog() {
    if (importDialog) importDialog.hidden = false;
    if (importTextArea) importTextArea.value = '';
    if (importHint) {
      importHint.textContent = '';
      importHint.style.color = 'var(--muted)';
    }
  }

  function closeImportDialog() {
    if (importDialog) importDialog.hidden = true;
    if (importTextArea) importTextArea.value = '';
    if (importHint) importHint.textContent = '';
  }

  btnImportCancel.addEventListener('click', function () {
    closeImportDialog();
  });

  /* ---------- 方式 1：选择文件 ---------- */
  if (importSaveFile2) {
    importSaveFile2.addEventListener('change', function () {
      const file = this.files && this.files[0];
      if (!file) return;

      setImportHint('正在读取文件：' + file.name, 'normal');

      const reader = new FileReader();
      reader.onload = function (e) {
        const text = e.target.result;
        tryImportSave(text);
        importSaveFile2.value = '';
      };
      reader.onerror = function () {
        setImportHint('读取文件失败', 'error');
        importSaveFile2.value = '';
      };
      reader.readAsText(file, 'utf-8');
    });
  }

  /* ---------- 方式 2：从文本框导入 ---------- */
  btnImportTextConfirm.addEventListener('click', function () {
    const text = (importTextArea.value || '').trim();
    if (!text) {
      setImportHint('请先粘贴存档内容', 'error');
      return;
    }
    tryImportSave(text);
  });

  /* ---------- 设置导入提示 ---------- */
  function setImportHint(text, type) {
    if (!importHint) return;
    importHint.textContent = text;
    if (type === 'error') {
      importHint.style.color = 'var(--danger)';
    } else if (type === 'success') {
      importHint.style.color = 'var(--primary)';
    } else {
      importHint.style.color = 'var(--muted)';
    }
  }

  /* ---------- 统一的导入逻辑 ---------- */
  function tryImportSave(text) {
    if (!text || !text.trim()) {
      setImportHint('文件内容为空', 'error');
      return;
    }
    const trimmed = text.trim();

    /* 情况 1：JSON 对象 */
    if (trimmed.charAt(0) === '{') {
      let parsed;
      try {
        parsed = JSON.parse(trimmed);
      } catch (e) {
        setImportHint('文件不是合法的 JSON', 'error');
        return;
      }

      /* 信封 {data: "CEW2:xxx"} */
      if (parsed && parsed.data) {
        return tryImportSave(String(parsed.data));
      }

      /* 直接是明文存档 */
      return applyImportedSave(parsed);
    }

    /* 情况 2：加密字符串 CEW2:xxx */
    if (trimmed.indexOf('CEW2:') === 0) {
      const dec = (typeof decryptSave === 'function') ? decryptSave(trimmed) : null;
      if (!dec) {
        setImportHint('存档解密失败', 'error');
        return;
      }
      let parsed;
      try {
        parsed = JSON.parse(dec);
      } catch (e) {
        setImportHint('存档内容损坏', 'error');
        return;
      }
      return applyImportedSave(parsed);
    }

    setImportHint('无法识别的格式，请检查内容是否正确', 'error');
  }

  /* ---------- 应用导入的存档 ---------- */
  function applyImportedSave(raw) {
    if (!raw || typeof raw !== 'object') {
      setImportHint('存档结构不正确', 'error');
      return;
    }
    if (!('energy' in raw) && !('upgrades' in raw) && !('achievements' in raw)) {
      setImportHint('不是有效的存档文件', 'error');
      return;
    }

    const normalized = normalizeSave(raw);
    recalcSave(normalized);
    saveGame(normalized);
    setNotation(normalized.settings.notation);

    setImportHint('导入成功，正在进入游戏…', 'success');
    notify('存档导入成功！', 'success');

    setTimeout(function () {
      window.location.href = 'game.html';
    }, 700);
  }

  /* =========================================================
     启动
     ========================================================= */
  function boot() {
    renderSummary();
    updateContinueButton();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }

  document.addEventListener('ui-ready', function () {
    updateContinueButton();
  });
})();