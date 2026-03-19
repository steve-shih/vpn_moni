/**
 * Inject Script (MAIN world)
 * 核心：強力攔截機制
 */
(function() {
  // 立即輸出 Log，讓使用者在 console 看到腳本有執行
  console.log('%c[VPN Spoofer] 🛡️ 注入成功，正在等待環境參數...', 'color: #2563eb; font-weight: bold;');

  let spoofed = false;

  function applySpoof(data) {
    if (spoofed) return;
    try {
      const settings = JSON.parse(data);
      if (!settings.enabled) return;

      console.log('[VPN Spoofer] ⚙️ 套用設定:', settings);

      // 1. 時區
      if (settings.timezone) {
        const originalResolvedOptions = Intl.DateTimeFormat.prototype.resolvedOptions;
        Intl.DateTimeFormat.prototype.resolvedOptions = function() {
          const options = originalResolvedOptions.apply(this, arguments);
          options.timeZone = settings.timezone;
          return options;
        };
      }

      // 2. 語言
      if (settings.language) {
        Object.defineProperty(navigator, 'language', { get: () => settings.language, configurable: true });
        Object.defineProperty(navigator, 'languages', { get: () => [settings.language, settings.language.split('-')[0]], configurable: true });
      }

      // 3. 平台
      if (settings.platform) {
        Object.defineProperty(navigator, 'platform', { get: () => settings.platform, configurable: true });
      }

      // 4. 解析度
      if (settings.screenWidth) {
        Object.defineProperty(Screen.prototype, 'width', { get: () => settings.screenWidth, configurable: true });
        Object.defineProperty(Screen.prototype, 'height', { get: () => settings.screenHeight, configurable: true });
        Object.defineProperty(Screen.prototype, 'availWidth', { get: () => settings.screenWidth, configurable: true });
        Object.defineProperty(Screen.prototype, 'availHeight', { get: () => settings.screenHeight, configurable: true });
        Object.defineProperty(window, 'innerWidth', { get: () => settings.screenWidth, configurable: true });
        Object.defineProperty(window, 'innerHeight', { get: () => settings.screenHeight, configurable: true });
      }

      // 5. WebGL
      if (settings.webglVendor || settings.webglRenderer) {
        const getParameterProxy = (proto) => {
          const original = proto.getParameter;
          proto.getParameter = function(param) {
            const debugInfo = this.getExtension('WEBGL_debug_renderer_info');
            if (debugInfo) {
              if (param === debugInfo.UNMASKED_VENDOR_WEBGL && settings.webglVendor) return settings.webglVendor;
              if (param === debugInfo.UNMASKED_RENDERER_WEBGL && settings.webglRenderer) return settings.webglRenderer;
            }
            return original.apply(this, arguments);
          };
        };
        if (window.WebGLRenderingContext) getParameterProxy(WebGLRenderingContext.prototype);
        if (window.WebGL2RenderingContext) getParameterProxy(WebGL2RenderingContext.prototype);
      }

      spoofed = true;
      console.log('%c[VPN Spoofer] ✅ 環境校正完成！', 'color: #059669; font-weight: bold;');
    } catch (e) {
      console.error('[VPN Spoofer] ❌ 套用失敗:', e);
    }
  }

  // 持續檢查是否有資料傳入 (透過 dataset)
  const timer = setInterval(() => {
    const data = document.documentElement.dataset.vpnSpoof;
    if (data) {
      applySpoof(data);
      clearInterval(timer);
    }
  }, 10);

  // 1 秒後如果還是沒資料就放棄
  setTimeout(() => clearInterval(timer), 1000);
})();
