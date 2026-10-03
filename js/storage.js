/* =========================================================
   storage.js —— 存档读写、加密、格式化、成就检查（v2）
   ========================================================= */

const SAVE_KEY = 'css_energy_workshop_save_v2';
const SAVE_SECRET = 'CSS_Energy_Workshop_v2_secret_key';
const ENC_PREFIX = 'CEW2:';

let _notation = 'short';

function setNotation(n) { _notation = (n === 'full') ? 'full' : 'short'; }
function getNotation() { return _notation; }

function formatNumber(num) {
  let n = Number(num);
  if (!isFinite(n)) n = 0;
  if (n < 0) n = 0;
  if (_notation === 'full') {
    return Math.floor(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  }
  if (n < 1000) return String(Math.floor(n));
  if (n < 1e6) return trimDecimal(n / 1e3) + 'K';
  if (n < 1e9) return trimDecimal(n / 1e6) + 'M';
  if (n < 1e12) return trimDecimal(n / 1e9) + 'B';
  return trimDecimal(n / 1e12) + 'T';
}

function trimDecimal(v) {
  let s = v.toFixed(2);
  s = s.replace(/\.?0+$/, '');
  return s === '' ? '0' : s;
}

/* ---------- 加密 ---------- */
function strToBytes(str) { return Array.from(new TextEncoder().encode(str)); }
function bytesToStr(bytes) { return new TextDecoder().decode(new Uint8Array(bytes)); }
function xorBytes(bytes, key) {
  const keyBytes = strToBytes(key);
  const out = new Array(bytes.length);
  for (let i = 0; i < bytes.length; i++) out[i] = bytes[i] ^ keyBytes[i % keyBytes.length];
  return out;
}
function bytesToHex(bytes) {
  let s = '';
  for (let i = 0; i < bytes.length; i++) s += bytes[i].toString(16).padStart(2, '0');
  return s;
}
function hexToBytes(hex) {
  const bytes = [];
  for (let i = 0; i < hex.length; i += 2) bytes.push(parseInt(hex.substr(i, 2), 16));
  return bytes;
}
function encryptSave(jsonText) {
  return ENC_PREFIX + bytesToHex(xorBytes(strToBytes(jsonText), SAVE_SECRET));
}
function decryptSave(text) {
  if (!text || typeof text !== 'string') return null;
  if (text.indexOf(ENC_PREFIX) !== 0) return null;
  const hex = text.slice(ENC_PREFIX.length);
  if (hex.length === 0 || hex.length % 2 !== 0) return null;
  if (!/^[0-9a-fA-F]+$/.test(hex)) return null;
  try {
    return bytesToStr(xorBytes(hexToBytes(hex), SAVE_SECRET));
  } catch (e) { return null; }
}

/* ---------- 默认存档 ---------- */
function defaultSave() {
  const now = Date.now();
  let ups = {};
  for (let i = 0; i < UPGRADE_ORDER.length; i++) ups[UPGRADE_ORDER[i]] = 0;
  let achs = {};
  for (let i = 0; i < ACHIEVEMENT_ORDER.length; i++) achs[ACHIEVEMENT_ORDER[i]] = false;
  return {
    version: GAME_VERSION,
    playerId: '',
    energy: 0, totalEnergy: 0, clickCount: 0,
    clickPower: 1, autoPower: 0,
    critCount: 0, investCount: 0,
    upgrades: ups, achievements: achs,
    settings: { theme: 'dark', notation: 'short' },
    bank: { deposit: 0, loan: 0 },
    investments: [],
    lastTime: now, createdAt: now, updatedAt: now
  };
}

/* ---------- 规范化 ---------- */
function normalizeSave(raw) {
  const out = defaultSave();
  const s = (raw && typeof raw === 'object') ? raw : {};

  /* 玩家 ID */
  if (typeof s.playerId === 'string' && s.playerId.trim()) {
    out.playerId = s.playerId.trim().slice(0, 12);
  }

  const nf = ['energy', 'totalEnergy', 'clickCount', 'clickPower',
    'autoPower', 'critCount', 'investCount', 'lastTime', 'createdAt', 'updatedAt'];
  for (let i = 0; i < nf.length; i++) {
    const v = Number(s[nf[i]]);
    if (isFinite(v) && v >= 0) out[nf[i]] = v;
  }

  if (s.upgrades && typeof s.upgrades === 'object') {
    for (let i = 0; i < UPGRADE_ORDER.length; i++) {
      const id = UPGRADE_ORDER[i];
      const v = Math.floor(Number(s.upgrades[id]));
      out.upgrades[id] = (isFinite(v) && v > 0) ? v : 0;
    }
  }

  if (s.achievements && typeof s.achievements === 'object') {
    for (let i = 0; i < ACHIEVEMENT_ORDER.length; i++) {
      const id = ACHIEVEMENT_ORDER[i];
      const v = s.achievements[id];
      if (v) out.achievements[id] = (typeof v === 'number') ? v : Date.now();
      else out.achievements[id] = false;
    }
  }

  if (s.settings && typeof s.settings === 'object') {
    out.settings.theme = (s.settings.theme === 'light') ? 'light' : 'dark';
    out.settings.notation = (s.settings.notation === 'full') ? 'full' : 'short';
  }

  if (s.bank && typeof s.bank === 'object') {
    let d = Number(s.bank.deposit);
    let l = Number(s.bank.loan);
    out.bank.deposit = (isFinite(d) && d >= 0) ? d : 0;
    out.bank.loan = (isFinite(l) && l >= 0) ? l : 0;
  }

  if (Array.isArray(s.investments)) {
    out.investments = s.investments.filter(function (inv) {
      return inv && typeof inv === 'object' && inv.id && inv.type && inv.amount;
    }).map(function (inv) {
      return {
        id: String(inv.id),
        type: String(inv.type),
        amount: Math.max(0, Number(inv.amount) || 0),
        startTime: Number(inv.startTime) || Date.now(),
        duration: Number(inv.duration) || 60
      };
    });
  }

  out.version = GAME_VERSION;
  return out;
}

function recalcSave(save) {
  save.clickPower = calcClickPower(save.upgrades);
  save.autoPower = calcAutoPower(save.upgrades);
  return save;
}

function loadGame() {
  let raw = null;
  try {
    const text = localStorage.getItem(SAVE_KEY);
    if (text) {
      const dec = decryptSave(text);
      raw = dec ? JSON.parse(dec) : JSON.parse(text);
    }
  } catch (e) { raw = null; }
  const save = normalizeSave(raw);
  recalcSave(save);
  setNotation(save.settings.notation);
  return save;
}

function saveGame(save) {
  if (!save) return;
  const now = Date.now();
  save.version = GAME_VERSION;
  save.updatedAt = now;
  save.lastTime = now;
  save.clickPower = calcClickPower(save.upgrades);
  save.autoPower = calcAutoPower(save.upgrades);
  try {
    localStorage.setItem(SAVE_KEY, encryptSave(JSON.stringify(save)));
  } catch (e) {}
}

function hasSave() {
  try { return !!localStorage.getItem(SAVE_KEY); } catch (e) { return false; }
}
function clearSave() {
  try { localStorage.removeItem(SAVE_KEY); } catch (e) {}
}
function getSaveSize() {
  try {
    const t = localStorage.getItem(SAVE_KEY);
    if (!t) return 0;
    return new Blob([t]).size;
  } catch (e) { return 0; }
}
function formatBytes(b) {
  if (!b || b <= 0) return '0 B';
  if (b < 1024) return b + ' B';
  if (b < 1024 * 1024) return (b / 1024).toFixed(1) + ' KB';
  return (b / 1024 / 1024).toFixed(2) + ' MB';
}

/* ---------- 成就检查 ---------- */
function checkAchievements(save) {
  const unlocked = [];
  for (let i = 0; i < ACHIEVEMENT_ORDER.length; i++) {
    const id = ACHIEVEMENT_ORDER[i];
    const def = ACHIEVEMENTS[id];
    if (!def) continue;
    if (save.achievements[id]) continue;
    if (def.parent && !save.achievements[def.parent]) continue;
    if (def.cond(save)) {
      save.achievements[id] = Date.now();
      unlocked.push(id);
    }
  }
  return unlocked;
}

function handleAchievements(save) {
  const newly = checkAchievements(save);
  if (newly.length > 0) {
    saveGame(save);
    for (let i = 0; i < newly.length; i++) {
      notify('成就解锁：' + ACHIEVEMENTS[newly[i]].name, 'achievement');
    }
  }
  return newly;
}

function countUnlocked(save) {
  let n = 0;
  for (let i = 0; i < ACHIEVEMENT_ORDER.length; i++) {
    if (save.achievements[ACHIEVEMENT_ORDER[i]]) n++;
  }
  return n;
}