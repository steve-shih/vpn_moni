/**
 * Background Service Worker
 * 管理全域偽裝腳本的註冊
 */

const SCRIPT_ID = 'vpn-spoof-script';

// 初始與更新
async function updateSpoofing() {
  const settings = await chrome.storage.local.get(['spoofSettings']);
  const isEnabled = settings.spoofSettings?.enabled || false;

  console.log('UpdateSpoofing:', isEnabled ? 'Enabled' : 'Disabled');

  try {
    // 清除舊註冊
    const registered = await chrome.scripting.getRegisteredContentScripts();
    if (registered.some(s => s.id === SCRIPT_ID)) {
      await chrome.scripting.unregisterContentScripts({ ids: [SCRIPT_ID] });
    }

    if (isEnabled) {
      // 註冊 inject.js 到 MAIN world
      await chrome.scripting.registerContentScripts([{
        id: SCRIPT_ID,
        js: ['inject.js'],
        matches: ['<all_urls>'],
        runAt: 'document_start',
        world: 'MAIN'
      }]);
    }
  } catch (err) {
    console.error('Registration failed:', err);
  }
}

// 監控設定變化
chrome.storage.onChanged.addListener((changes, area) => {
  if (area === 'local' && changes.spoofSettings) {
    updateSpoofing();
  }
});

chrome.runtime.onInstalled.addListener(() => updateSpoofing());
chrome.runtime.onStartup.addListener(() => updateSpoofing());
