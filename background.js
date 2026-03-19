/**
 * Background Service Worker
 * 管理腳本注入與標頭修改 (DNR)
 */

const SCRIPT_ID = 'vpn-spoof-script';

// User-Agent 庫
const UA_PRESETS = {
  'Win32': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36',
  'MacIntel': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36',
  'Linux x86_64': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36'
};

/**
 * 更新所有偽裝設定 (包含腳本註冊與標頭修改)
 */
async function updateSpoofing() {
  const result = await chrome.storage.local.get(['spoofSettings']);
  const settings = result.spoofSettings;
  const isEnabled = settings?.enabled || false;

  console.log('UpdateSpoofing:', isEnabled ? 'Enabled' : 'Disabled');

  // 1. 管理腳本注入 (MAIN world)
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
  } catch (err) { console.error('Scripting failed:', err); }

  // 2. 管理標頭修改 (Declarative Net Request)
  await updateDnrRules(settings);
}

/**
 * 利用 DNR 規則修改 Accept-Language 與 User-Agent 標頭
 */
async function updateDnrRules(settings) {
  const isEnabled = settings?.enabled || false;
  
  // 清除舊規則
  const oldRules = await chrome.declarativeNetRequest.getDynamicRules();
  const oldRuleIds = oldRules.map(r => r.id);
  
  const addRules = [];
  if (isEnabled) {
    const targetUa = UA_PRESETS[settings.platform] || UA_PRESETS['Win32'];
    const targetLang = settings.language || 'en-US';
    const isWindows = settings.platform === 'Win32';

    addRules.push({
      id: 1,
      priority: 1,
      action: {
        type: 'modifyHeaders',
        requestHeaders: [
          { header: 'user-agent', operation: 'set', value: targetUa },
          { header: 'accept-language', operation: 'set', value: `${targetLang},${targetLang.split('-')[0]};q=0.9` },
          { header: 'sec-ch-ua', operation: 'set', value: isWindows ? '"Google Chrome";v="129", "Not=A?Brand";v="8", "Chromium";v="129"' : '"Google Chrome";v="129", "Not=A?Brand";v="8", "Chromium";v="129"' },
          { header: 'sec-ch-ua-mobile', operation: 'set', value: '?0' },
          { header: 'sec-ch-ua-platform', operation: 'set', value: isWindows ? '"Windows"' : '"macOS"' }
        ]
      },
      condition: { urlFilter: '*', resourceTypes: ['main_frame', 'sub_frame', 'script', 'xmlhttprequest'] }
    });
  }

  try {
    await chrome.declarativeNetRequest.updateDynamicRules({
      removeRuleIds: oldRuleIds,
      addRules: addRules
    });
    console.log('DNR Rules updated:', addRules.length > 0 ? 'Applied' : 'Cleared');
  } catch (err) {
    console.error('DNR Rules update failed:', err);
  }
}

// 監控儲存變化
chrome.storage.onChanged.addListener((changes, area) => {
  if (area === 'local' && changes.spoofSettings) updateSpoofing();
});

chrome.runtime.onInstalled.addListener(() => updateSpoofing());
chrome.runtime.onStartup.addListener(() => updateSpoofing());
