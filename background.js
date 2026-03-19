/**
 * Background Service Worker
 * 負責管理腳本注入 (chrome.scripting)
 */

const SCRIPT_ID = 'vpn-spoof-script';

/**
 * 監聽儲存異動，當開關切換時重新註冊腳本
 */
chrome.storage.onChanged.addListener(async (changes, area) => {
  if (area === 'local' && changes.spoofSettings) {
    await updateSpoofing();
  }
});

/**
 * 更新注入狀態
 */
async function updateSpoofing() {
  const settings = await chrome.storage.local.get(['spoofSettings']);
  const isEnabled = settings.spoofSettings?.enabled || false;

  // 先移除舊的注入 (不論成敗)
  try {
    const scripts = await chrome.scripting.getRegisteredContentScripts();
    if (scripts.some(s => s.id === SCRIPT_ID)) {
      await chrome.scripting.unregisterContentScripts({ ids: [SCRIPT_ID] });
    }
  } catch (e) {
    console.error('Unregister failed:', e);
  }

  if (isEnabled) {
    try {
      await chrome.scripting.registerContentScripts([{
        id: SCRIPT_ID,
        js: ['inject.js'],
        matches: ['<all_urls>'],
        runAt: 'document_start',
        world: 'MAIN' // 關鍵：在 MAIN world 注入才能存取網頁 JS 變數
      }]);
      console.log('Spoofing script registered');
    } catch (e) {
      console.error('Register failed:', e);
    }
  }
}

// 初始啟動檢查
chrome.runtime.onInstalled.addListener(() => updateSpoofing());
chrome.runtime.onStartup.addListener(() => updateSpoofing());
