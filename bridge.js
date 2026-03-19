/**
 * Bridge Script (ISOLATED world)
 * 負責將儲存設定傳達給網頁內的偽裝腳本
 */
(async function() {
  try {
    const result = await chrome.storage.local.get(['spoofSettings']);
    if (result.spoofSettings && result.spoofSettings.enabled) {
      // 在 HTML 標籤上寫入資料，這是跨 World 傳遞最穩定且最快的方法
      document.documentElement.dataset.vpnSpoof = JSON.stringify(result.spoofSettings);
      console.log('[VPN Spoofer] Bridge Ready.');
    }
  } catch (e) {
    console.error('[VPN Spoofer] Bridge failed:', e);
  }
})();
