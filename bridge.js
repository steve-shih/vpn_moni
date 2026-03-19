/**
 * Bridge Script (ISOLATED world)
 * 傳遞資料的最前線
 */
(async function() {
  try {
    const result = await chrome.storage.local.get(['spoofSettings']);
    if (result.spoofSettings && result.spoofSettings.enabled) {
      // 寫入 dataset 使 MAIN world 的腳本可見
      document.documentElement.dataset.vpnSpoof = JSON.stringify(result.spoofSettings);
    }
  } catch (e) {
    console.error('Bridge failed:', e);
  }
})();
