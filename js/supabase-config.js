/* =========================================================
   supabase-config.js —— 配置 + 等待 SDK 加载后初始化
   支持新版 sb_publishable_ 开头的 Key
   ========================================================= */

/* ============================================================
   ↓↓↓ 请把下面两行换成你 Supabase 项目的真实值 ↓↓↓
   ============================================================ */
const SUPABASE_URL = 'https://msvqeryibcfwkwqlpeaw.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_4sh01SbWU3g6vAbRQrkZLw_O_rX4qwg';
/* ============================================================ */

let supabaseClient = null;

/* 记录最后一次上传错误，供诊断使用 */
let lastSyncError = '';

/* ---------- 初始化 ---------- */
function initSupabaseClient() {
  try {
    if (typeof supabase === 'undefined') {
      console.warn('[Supabase] SDK 未定义，无法初始化');
      return false;
    }

    const createClient = supabase.createClient ||
      (supabase.default && supabase.default.createClient);

    if (typeof createClient !== 'function') {
      console.warn('[Supabase] createClient 方法不存在');
      return false;
    }

    if (SUPABASE_URL.indexOf('你的项目ID') >= 0) {
      console.warn('[Supabase] 未配置 URL 和 Key');
      return false;
    }

    supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    console.log('[Supabase] ✓ 初始化成功');
    return true;
  } catch (e) {
    console.error('[Supabase] 初始化失败：', e);
    supabaseClient = null;
    return false;
  }
}

window.__onSupabaseLoaded = function () {
  console.log('[Supabase] 收到 SDK 加载完成通知');
  initSupabaseClient();
};

window.__onSupabaseLoadFailed = function () {
  console.warn('[Supabase] SDK 加载失败');
  supabaseClient = null;
};

if (typeof supabase !== 'undefined') {
  initSupabaseClient();
}

/* ---------- 就绪检查 ---------- */
function isSupabaseReady() {
  return supabaseClient !== null;
}

/* ---------- 超时工具 ---------- */
function withTimeout(promise, ms) {
  return new Promise(function (resolve, reject) {
    let done = false;
    const timer = setTimeout(function () {
      if (!done) {
        done = true;
        reject(new Error('TIMEOUT'));
      }
    }, ms);
    promise.then(function (v) {
      if (!done) { done = true; clearTimeout(timer); resolve(v); }
    }).catch(function (e) {
      if (!done) { done = true; clearTimeout(timer); reject(e); }
    });
  });
}

/* ---------- 拉取排行榜 ---------- */
async function fetchLeaderboardFromCloud(limit) {
  if (!isSupabaseReady()) return null;
  try {
    const query = supabaseClient
      .from('leaderboard')
      .select('*')
      .order('capital', { ascending: false })
      .limit(limit || 100);
    const result = await withTimeout(query, 3000);
    if (result.error) {
      console.error('[Supabase] 拉取失败：', result.error);
      return null;
    }
    return result.data || [];
  } catch (e) {
    console.warn('[Supabase] 拉取异常：', e.message);
    return null;
  }
}

/* ---------- 检查 ID 是否存在 ---------- */
async function checkPlayerIdExistsInCloud(playerId) {
  if (!isSupabaseReady()) return null;
  try {
    const query = supabaseClient
      .from('leaderboard')
      .select('player_name')
      .eq('player_name', playerId)
      .limit(1);
    const result = await withTimeout(query, 3000);
    if (result.error) {
      console.error('[Supabase] 查询 ID 失败：', result.error);
      return null;
    }
    return Array.isArray(result.data) && result.data.length > 0;
  } catch (e) {
    console.warn('[Supabase] 查询 ID 异常：', e.message);
    return null;
  }
}

/* ---------- 上传分数（带详细错误记录） ---------- */
async function syncScoreToCloud(playerId, capital, titleName, clickCount, totalEnergy) {
  lastSyncError = '';

  if (!isSupabaseReady()) {
    lastSyncError = 'Supabase 未就绪';
    return false;
  }
  if (!playerId) {
    lastSyncError = '没有玩家 ID';
    return false;
  }

  try {
    const query = supabaseClient
      .from('leaderboard')
      .upsert(
        {
          player_name: playerId,
          capital: Math.floor(capital),
          title: titleName,
          click_count: Math.floor(clickCount || 0),
          total_energy: Math.floor(totalEnergy || 0),
          updated_at: new Date().toISOString()
        },
        { onConflict: 'player_name' }
      );

    const result = await withTimeout(query, 3000);

    if (result.error) {
      lastSyncError =
        (result.error.message || '未知错误') +
        (result.error.code ? ' [' + result.error.code + ']' : '') +
        (result.error.details ? ' 详情: ' + result.error.details : '') +
        (result.error.hint ? ' 提示: ' + result.error.hint : '');
      console.error('[Supabase] 上传失败：', result.error);
      return false;
    }

    return true;
  } catch (e) {
    lastSyncError = '异常：' + (e.message || e);
    console.warn('[Supabase] 上传异常：', e);
    return false;
  }
}