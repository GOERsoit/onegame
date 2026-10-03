/* =========================================================
   sound.js —— 点击音效（打断式播放，不排队）
   ========================================================= */

/* 音效文件路径 */
const CLICK_SOUND_FILE = 'sounds/click.mp3';

/* 预加载 */
let clickAudio = null;

(function preload() {
  try {
    clickAudio = new Audio(CLICK_SOUND_FILE);
    clickAudio.preload = 'auto';
    clickAudio.volume = 0.5;   /* 音量 0~1，可改 */
  } catch (e) {
    console.warn('[音效] 加载失败：', e);
  }
})();

/* 播放点击音效（打断式：每次从头开始，不排队） */
function playClickSound() {
  if (!clickAudio) return;
  try {
    /* 打断上一次，从头播放 */
    clickAudio.currentTime = 0;
    clickAudio.play().catch(function () {
      /* 浏览器自动播放限制，忽略 */
    });
  } catch (e) {}
}

/* 首次点击时"解锁"音频（手机浏览器需要用户手势） */
(function unlockOnce() {
  function unlock() {
    if (!clickAudio) return;
    try {
      clickAudio.volume = 0;
      clickAudio.play().then(function () {
        clickAudio.pause();
        clickAudio.currentTime = 0;
        clickAudio.volume = 0.5;   /* 恢复默认音量 */
      }).catch(function () {
        clickAudio.volume = 0.5;
      });
    } catch (e) {}
    document.removeEventListener('click', unlock);
    document.removeEventListener('touchstart', unlock);
  }
  document.addEventListener('click', unlock, { once: true });
  document.addEventListener('touchstart', unlock, { once: true });
})();