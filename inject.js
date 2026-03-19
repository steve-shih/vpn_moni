/**
 * Inject Script (Runs in world: "MAIN")
 * 負責覆蓋原生 API 實現環境偽裝
 */
(async function() {
  // 從儲存中取得設定值
  // 註：在 MAIN world 無法直接存取 chrome.storage，
  // 但我們可以在註冊時動態生成腳本，或者乾淨做法是用「立即執行的匿名函式」傳入資料。
  // 由於 registerContentScripts 不好傳參，更好的做法是 inject.js 從頁面中的某個地方讀取，
  // 或者最簡單的做法是 background.js 讀取後動態組合字串，
  // 但為了維護性，目前我們在 inject.js 執行時去 query 一個由 content script 寫入的 DOM。
  // 不，最穩定且 MV3 推薦的做法是腳本執行時先獲取一次資料。
  // 在 MAIN world 中，我們需要一種方式獲取 storage 資料。
  
  // 方案：background.js 在注入前，先在 storageChange 時更新一組「全域內容腳本參數」。
  // 但 registerContentScripts 是靜態檔案。
  // 另一個方案：由一個普通 content script (ISOLATED) 將資料放在 DOM 屬性，inject.js (MAIN) 去讀。

  // 為了示範簡單且穩定，我們假設背景已經將參數序列化在 inject.js 的字串中 (這需要動態注入)。
  // 但 register 只能用實體檔案。
  // 故：我們使用 document.documentElement.dataset 作為橋接。

  const spoofData = document.documentElement.dataset.vpnSpoof;
  if (!spoofData) return;

  try {
    const settings = JSON.parse(spoofData);
    const { timezone, language, platform, screenWidth, screenHeight, devicePixelRatio, webglVendor, webglRenderer } = settings;

    // 1. 偽裝時區
    if (timezone) {
      const originalResolvedOptions = Intl.DateTimeFormat.prototype.resolvedOptions;
      Intl.DateTimeFormat.prototype.resolvedOptions = function() {
        const options = originalResolvedOptions.apply(this, arguments);
        options.timeZone = timezone;
        return options;
      };
    }

    // 2. 偽裝語言
    if (language) {
      Object.defineProperty(navigator, 'language', { get: () => language });
      Object.defineProperty(navigator, 'languages', { get: () => [language, language.split('-')[0]] });
    }

    // 3. 偽裝平台
    if (platform) {
      Object.defineProperty(navigator, 'platform', { get: () => platform });
    }

    // 4. 偽裝解析度
    if (screenWidth && screenHeight) {
      Object.defineProperty(window.screen, 'width', { get: () => screenWidth });
      Object.defineProperty(window.screen, 'height', { get: () => screenHeight });
      Object.defineProperty(window.screen, 'availWidth', { get: () => screenWidth });
      Object.defineProperty(window.screen, 'availHeight', { get: () => screenHeight });
      Object.defineProperty(window, 'innerWidth', { get: () => screenWidth });
      Object.defineProperty(window, 'innerHeight', { get: () => screenHeight });
    }
    if (devicePixelRatio) {
      Object.defineProperty(window, 'devicePixelRatio', { get: () => devicePixelRatio });
    }

    // 5. 偽裝 WebGL
    if (webglVendor || webglRenderer) {
      const getParameterProxy = function(originalGetParameter) {
        return function(parameter) {
          const debugInfo = this.getExtension('WEBGL_debug_renderer_info');
          if (debugInfo) {
            if (parameter === debugInfo.UNMASKED_VENDOR_WEBGL && webglVendor) return webglVendor;
            if (parameter === debugInfo.UNMASKED_RENDERER_WEBGL && webglRenderer) return webglRenderer;
          }
          return originalGetParameter.apply(this, arguments);
        };
      };

      if (window.WebGLRenderingContext) {
        WebGLRenderingContext.prototype.getParameter = getParameterProxy(WebGLRenderingContext.prototype.getParameter);
      }
      if (window.WebGL2RenderingContext) {
        WebGL2RenderingContext.prototype.getParameter = getParameterProxy(WebGL2RenderingContext.prototype.getParameter);
      }
    }

    console.log('VPN Diff Checker: Environment Spoofed successfully.');
  } catch (e) {
    console.error('VPN Diff Checker Spoof failed:', e);
  }
})();
