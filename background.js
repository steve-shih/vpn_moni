/**
 * Background Service Worker
 * 負責全域規則管理器
 */

const SCRIPT_ID = 'vpn-spoof-script';

// UA 字串對照表
const UA_PRESETS = {
  'Win32': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36',
  'MacIntel': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36',
  'Linux x86_64': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36',
  'iPhone': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1',
  'Linux armv8l': 'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Mobile Safari/537.36'
};

/**
 * 更新偽裝設定
 */
async function updateSpoofing() {
  const settings = (await chrome.storage.local.get(['spoofSettings'])).spoofSettings;
  const isEnabled = settings?.enabled || false;

  console.log('[Background] 更新偽裝狀態:', isEnabled ? '開啟' : '關閉');

  // 1. 處理腳本注入
  try {
    const registered = await chrome.scripting.getRegisteredContentScripts();
    if (registered.some(s => s.id === SCRIPT_ID)) {
      await chrome.scripting.unregisterContentScripts({ ids: [SCRIPT_ID] });
    }
    if (isEnabled) {
      await chrome.scripting.registerContentScripts([{
        id: SCRIPT_ID, js: ['inject.js'], matches: ['<all_urls>'],
        runAt: 'document_start', world: 'MAIN'
      }]);
    }
  } catch (e) { console.error('Scripting Error:', e); }

  // 2. 處理 DNR 規則 (標頭修改)
  await applyDnrRules(settings);
}

/**
 * 套用標頭攔截規則
 */
async function applyDnrRules(settings) {
  const isEnabled = settings?.enabled || false;
  
  // 清空現有動態規則
  const oldRules = await chrome.declarativeNetRequest.getDynamicRules();
  const removeIds = oldRules.map(r => r.id);
  
  const addRules = [];
  if (isEnabled) {
    const targetUa = UA_PRESETS[settings.platform] || UA_PRESETS['Win32'];
    const targetLang = settings.language || 'en-US';
    const isWindows = settings.platform === 'Win32';

    addRules.push({
      id: 1,
      priority: 100, // 提高優先權
      action: {
        type: 'modifyHeaders',
        requestHeaders: [
          { header: 'User-Agent', operation: 'set', value: targetUa },
          { header: 'Accept-Language', operation: 'set', value: `${targetLang},${targetLang.split('-')[0]};q=0.9` },
          { header: 'Sec-CH-UA', operation: 'set', value: isWindows ? '"Google Chrome";v="129", "Not=A?Brand";v="8", "Chromium";v="129"' : '"Google Chrome";v="129", "Not=A?Brand";v="8", "Chromium";v="129"' },
          { header: 'Sec-CH-UA-Mobile', operation: 'set', value: '?0' },
          { header: 'Sec-CH-UA-Platform', operation: 'set', value: isWindows ? '"Windows"' : '"macOS"' }
        ]
      },
      condition: { urlFilter: '*', resourceTypes: ['main_frame', 'sub_frame', 'script', 'xmlhttprequest', 'ping'] }
    });
  }

  try {
    await chrome.declarativeNetRequest.updateDynamicRules({
      removeRuleIds: removeIds,
      addRules: addRules
    });
    console.log('[Background] DNR 規則已成功套用，數量:', addRules.length);
  } catch (e) {
    console.error('DNR Error:', e);
  }
}

// 監聽
chrome.storage.onChanged.addListener((changes) => {
  if (changes.spoofSettings) updateSpoofing();
});

chrome.runtime.onInstalled.addListener(() => updateSpoofing());
chrome.runtime.onStartup.addListener(() => updateSpoofing());
