/* =========================================================
   settings.js —— 设置页（所有点击都有反馈 + 超时检测）
   ========================================================= */

/* 全局错误捕获：任何 JS 报错都会弹通知，方便定位问题 */
window.addEventListener('error', function (e) {
  try {
    const msg = e && e.message ? e.message : '未知错误';
    if (typeof notify === 'function') notify('JS 错误：' + msg, 'error');
  } catch (err) {}
});

(function () {

  /* 检查关键元素是否都存在，缺了就报错提示 */
  function getEl(id) {
    const el = document.getElementById(id);
    if (!el) {
      console.warn('缺少元素：#' + id);
    }
    return el;
  }

  const save = loadGame();

  const themeDark = getEl('themeDark');
  const themeLight = getEl('themeLight');
  const curTheme = getEl('curTheme');

  const notShort = getEl('notShort');
  const notFull = getEl('notFull');
  const curNotation = getEl('curNotation');

  const exportArea = getEl('exportArea');
  const btnExport = getEl('btnExport');
  const btnDownload = getEl('btnDownload');
  const btnCopy = getEl('btnCopy');

  const importArea = getEl('importArea');
  const importFile = getEl('importFile');
  const btnImport = getEl('btnImport');

  const btnReset = getEl('btnReset');
  const resetConfirm = getEl('resetConfirm');
  const btnResetConfirm = getEl('btnResetConfirm');
  const btnResetCancel = getEl('btnResetCancel');

  const infoVersion = getEl('infoVersion');
  const infoSize = getEl('infoSize');
  const infoCreated = getEl('infoCreated');

  /* =========================================================
     工具：绑定按钮点击（确保按钮存在且绑定成功）
     ========================================================= */
  function on(el, event, handler) {
    if (!el) {
      console.warn('绑定失败：元素不存在');
      return;
    }
    el.addEventListener(event, handler);
  }

  /* =========================================================
     主题
     ========================================================= */
  function syncThemeUI() {
    const t = save.settings.theme === 'light' ? 'light' : 'dark';
    applyTheme(t);
    if (curTheme) curTheme.textContent = (t === 'light') ? '浅色' : '深色';
    if (themeDark) themeDark.classList.toggle('is-active', t === 'dark');
    if (themeLight) themeLight.classList.toggle('is-active', t === 'light');
  }

  on(themeDark, 'click', function () {
    save.settings.theme = 'dark';
    saveGame(save);
    syncThemeUI();
    notify('已切换到深色主题', 'success');
  });

  on(themeLight, 'click', function () {
    save.settings.theme = 'light';
    saveGame(save);
    syncThemeUI();
    notify('已切换到浅色主题', 'success');
  });

  /* =========================================================
     数字格式
     ========================================================= */
  function syncNotationUI() {
    const n = save.settings.notation === 'full' ? 'full' : 'short';
    setNotation(n);
    if (curNotation) curNotation.textContent = (n === 'full') ? '完整数字' : '缩写数字';
    if (notShort) notShort.classList.toggle('is-active', n === 'short');
    if (notFull) notFull.classList.toggle('is-active', n === 'full');
  }

  on(notShort, 'click', function () {
    save.settings.notation = 'short';
    saveGame(save);
    syncNotationUI();
    refreshInfo();
    notify('数字格式：缩写（例如 1.5K）', 'success');
  });

  on(notFull, 'click', function () {
    save.settings.notation = 'full';
    saveGame(save);
    syncNotationUI();
    refreshInfo();
    notify('数字格式：完整（例如 1,500）', 'success');
  });

  /* =========================================================
     导出：文本框预览
     ========================================================= */
  function doExport() {
    try {
      const text = localStorage.getItem(SAVE_KEY) || '';
      if (exportArea) exportArea.value = text;
      if (text) {
        notify('存档已导出到文本框', 'success');
      } else {
        notify('当前没有存档可导出', 'error');
      }
    } catch (e) {
      notify('导出失败：' + e.message, 'error');
    }
  }

  on(btnExport, 'click', function () {
    notify('正在刷新预览…', 'info');
    doExport();
  });

  /* =========================================================
     导出：下载 .json 文件
     ========================================================= */
  on(btnDownload, 'click', function () {
    try {
      notify('正在准备下载…', 'info');
      const data = localStorage.getItem(SAVE_KEY);
      if (!data) {
        notify('当前没有存档可导出', 'error');
        return;
      }

      const wrapper = {
        format: 'css-energy-workshop',
        version: GAME_VERSION,
        encrypted: true,
        exportedAt: new Date().toISOString(),
        data: data
      };

      const jsonText = JSON.stringify(wrapper, null, 2);
      const blob = new Blob([jsonText], { type: 'application/json;charset=utf-8' });

      const d = new Date();
      const pad = function (n) { return n < 10 ? '0' + n : String(n); };
      const stamp = d.getFullYear() + pad(d.getMonth() + 1) + pad(d.getDate()) +
        '_' + pad(d.getHours()) + pad(d.getMinutes()) + pad(d.getSeconds());
      const filename = 'css-energy-workshop-save-' + stamp + '.json';

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(function () { URL.revokeObjectURL(url); }, 1000);

      notify('下载已触发：' + filename, 'success');
      setTimeout(function () {
        notify('若手机没弹出下载提示，请用"复制到剪贴板"保存', 'info');
      }, 1200);
    } catch (e) {
      notify('下载失败：' + e.message, 'error');
    }
  });

  /* =========================================================
     复制到剪贴板
     ========================================================= */
  on(btnCopy, 'click', function () {
    notify('正在复制…', 'info');
    const text = exportArea ? exportArea.value : '';
    if (!text) {
      notify('没有可复制的内容，请先点"刷新预览"', 'error');
      return;
    }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(function () {
        notify('已复制到剪贴板', 'success');
      }).catch(function () {
        if (exportArea) exportArea.select();
        notify('自动复制失败，请手动长按文本框选择并复制', 'error');
      });
    } else {
      if (exportArea) exportArea.select();
      notify('此浏览器不支持自动复制，请手动长按文本框复制', 'info');
    }
  });

  /* =========================================================
     导入：选择文件（带 3 秒超时检测）
     ========================================================= */
  let pickerTimer = null;
  let pickerOpened = false;

  /* 监听 label 的点击（label[for="importFile"]） */
  const importLabel = document.querySelector('label[for="importFile"]');
  if (importLabel) {
    importLabel.addEventListener('click', function () {
      pickerOpened = false;
      notify('正在尝试打开文件选择器…', 'info');

      /* 3 秒后检测是否真的打开了 */
      if (pickerTimer) clearTimeout(pickerTimer);
      pickerTimer = setTimeout(function () {
        if (!pickerOpened) {
          notify('文件选择器没打开，请改用下方"从文本导入"', 'error');
        }
      }, 3000);
    });
  } else {
    console.warn('找不到 label[for="importFile"]');
  }

  /* 文件选择器变化 */
  on(importFile, 'change', function () {
    pickerOpened = true;
    if (pickerTimer) {
      clearTimeout(pickerTimer);
      pickerTimer = null;
    }

    const file = this.files && this.files[0];
    if (!file) {
      notify('没有选择文件', 'error');
      return;
    }

    notify('正在读取：' + file.name, 'info');

    const reader = new FileReader();
    reader.onload = function (e) {
      const text = e.target.result;
      if (!text || !text.trim()) {
        notify('文件内容为空', 'error');
        importFile.value = '';
        return;
      }
      if (importArea) importArea.value = text;
      notify('文件已读取，正在导入…', 'info');
      tryImport(text);
      importFile.value = '';
    };
    reader.onerror = function (err) {
      notify('读取失败：' + (err && err.message ? err.message : '未知错误'), 'error');
      importFile.value = '';
    };
    reader.readAsText(file, 'utf-8');
  });

  /* =========================================================
     导入：从文本框
     ========================================================= */
  on(btnImport, 'click', function () {
    notify('正在处理导入…', 'info');
    const text = (importArea ? importArea.value : '') || '';
    if (!text.trim()) {
      notify('请先粘贴存档内容或选择文件', 'error');
      return;
    }
    tryImport(text);
  });

  /* =========================================================
     统一导入逻辑
     ========================================================= */
  function tryImport(rawText) {
    const text = (rawText || '').trim();
    if (!text) {
      notify('导入失败：内容为空', 'error');
      return;
    }

    /* A：JSON 对象 */
    if (text.charAt(0) === '{') {
      let parsed;
      try {
        parsed = JSON.parse(text);
      } catch (e) {
        notify('导入失败：JSON 格式不正确', 'error');
        return;
      }

      if (!parsed || typeof parsed !== 'object') {
        notify('导入失败：JSON 结构不正确', 'error');
        return;
      }

      /* A1：信封格式 {format, version, data} */
      if (parsed.data) {
        handleImportData(String(parsed.data));
        return;
      }

      /* A2：直接是明文存档 */
      if (parsed.energy !== undefined || parsed.upgrades !== undefined) {
        applyImport(parsed);
        return;
      }

      notify('导入失败：无法识别的 JSON 结构', 'error');
      return;
    }

    /* B：加密字符串 CEW2:xxx */
    if (text.indexOf(ENC_PREFIX) === 0) {
      handleImportData(text);
      return;
    }

    notify('导入失败：无法识别的存档格式', 'error');
  }

  /* 处理加密数据 */
  function handleImportData(encryptedOrPlain) {
    let jsonText = encryptedOrPlain;
    const decrypted = decryptSave(encryptedOrPlain);
    if (decrypted) jsonText = decrypted;

    let raw;
    try {
      raw = JSON.parse(jsonText);
    } catch (e) {
      notify('导入失败：存档内容已损坏', 'error');
      return;
    }

    applyImport(raw);
  }

  /* 应用导入数据 */
  function applyImport(raw) {
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
      notify('导入失败：存档结构不正确', 'error');
      return;
    }
    if (!('energy' in raw) && !('upgrades' in raw) && !('achievements' in raw)) {
      notify('导入失败：缺少必要的存档字段', 'error');
      return;
    }

    const normalized = normalizeSave(raw);
    recalcSave(normalized);
    saveGame(normalized);
    setNotation(normalized.settings.notation);

    notify('导入成功，正在刷新页面…', 'success');
    setTimeout(function () {
      window.location.reload();
    }, 800);
  }

  /* =========================================================
     重置存档
     ========================================================= */
  on(btnReset, 'click', function () {
    if (resetConfirm) resetConfirm.hidden = false;
  });

  on(btnResetCancel, 'click', function () {
    if (resetConfirm) resetConfirm.hidden = true;
  });

  on(btnResetConfirm, 'click', function () {
    if (resetConfirm) resetConfirm.hidden = true;
    clearSave();
    notify('存档已重置', 'success');
    setTimeout(function () {
      window.location.href = 'index.html';
    }, 700);
  });

  /* =========================================================
     存档信息
     ========================================================= */
  function refreshInfo() {
    if (infoVersion) infoVersion.textContent = String(GAME_VERSION);
    if (infoSize) infoSize.textContent = formatBytes(getSaveSize());
    if (infoCreated) {
      infoCreated.textContent = save.createdAt
        ? new Date(save.createdAt).toLocaleString('zh-CN')
        : '-';
    }
  }

  /* =========================================================
     启动
     ========================================================= */
  syncThemeUI();
  syncNotationUI();
  doExport();
  refreshInfo();

  /* 页面加载完成后，提示用户按钮已就绪 */
  setTimeout(function () {
    notify('设置页已就绪，点击任意按钮都会有提示', 'info');
  }, 600);

})();