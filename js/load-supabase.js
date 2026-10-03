/* =========================================================
   load-supabase.js —— 多 CDN 回退 + 全局加载状态
   ========================================================= */
(function () {
  /* 全局状态：'loading'=加载中 / 'ok'=成功 / 'fail'=失败 */
  window.__supabaseStatus = 'loading';

  const CDN_LIST = [
    'https://cdn.bootcdn.net/ajax/libs/supabase-js/2.49.4/supabase.min.js',
    'https://lf3-cdn-tos.bytecdntp.com/cdn/expire-1-M/supabase-js/2.49.4/supabase.min.js',
    'https://cdn.staticfile.org/supabase-js/2.49.4/supabase.min.js',
    'https://unpkg.com/@supabase/supabase-js@2.49.4/dist/umd/supabase.js',
    'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.49.4/dist/umd/supabase.js'
  ];

  let index = 0;
  let done = false;

  /* 单个 CDN 的超时时间：5 秒 */
  const CDN_TIMEOUT_MS = 5000;

  function tryLoad() {
    if (done) return;
    if (index >= CDN_LIST.length) {
      window.__supabaseStatus = 'fail';
      window.__supabaseLoadFailed = true;
      console.error('[Supabase] 所有 CDN 均加载失败');
      if (typeof window.__onSupabaseLoadFailed === 'function') {
        window.__onSupabaseLoadFailed();
      }
      return;
    }

    const url = CDN_LIST[index++];
    console.log('[Supabase] 尝试加载：' + url);

    const s = document.createElement('script');
    s.src = url;
    s.async = false;

    /* 超时保护 */
    const timeout = setTimeout(function () {
      if (done) return;
      console.warn('[Supabase] 超时，切换下一个 CDN：' + url);
      s.onload = null;
      s.onerror = null;
      tryLoad();
    }, CDN_TIMEOUT_MS);

    s.onload = function () {
      if (done) return;
      clearTimeout(timeout);
      if (typeof supabase === 'undefined') {
        console.warn('[Supabase] 脚本加载但 SDK 未定义，尝试下一个');
        tryLoad();
        return;
      }
      done = true;
      window.__supabaseStatus = 'ok';
      window.__supabaseLoaded = true;
      console.log('[Supabase] ✓ SDK 加载成功（来源：' + url + '）');
      if (typeof window.__onSupabaseLoaded === 'function') {
        window.__onSupabaseLoaded();
      }
    };

    s.onerror = function () {
      if (done) return;
      clearTimeout(timeout);
      console.warn('[Supabase] ✗ 加载失败：' + url);
      tryLoad();
    };

    document.head.appendChild(s);
  }

  tryLoad();
})();