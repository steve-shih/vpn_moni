/**
 * Bridge script (Runs in world: "ISOLATED")
 * 負責將 storage 中的資料傳遞給 MAIN world 的 inject.js
 */
(async function() {
  const settings = await chrome.storage.local.get(['spoofSettings']);
  if (settings.spoofSettings && settings.spoofSettings.enabled) {
    document.documentElement.dataset.vpnSpoof = JSON.stringify(settings.spoofSettings);
  }
})();
