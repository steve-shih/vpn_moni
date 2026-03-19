/**
 * Inject Script (MAIN world)
 * 深度覆蓋 JavaScript 中的環境資訊
 */
(function() {
  console.log('%c[VPN Spoofer] 🛡️ 注入成功，正在等待環境參數...', 'color: #2563eb; font-weight: bold;');

  const UA_PRESETS = {
    'Win32': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36',
    'MacIntel': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36',
    'Linux x86_64': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36'
  };

  let spoofed = false;

  function applySpoof(data) {
    if (spoofed) return;
    try {
      const settings = JSON.parse(data);
      if (!settings.enabled) return;

      console.log('[VPN Spoofer] ⚙️ 套用設定:', settings);

      const targetUa = UA_PRESETS[settings.platform] || UA_PRESETS['Win32'];

      // 1. 時區
      if (settings.timezone) {
        const originalResolvedOptions = Intl.DateTimeFormat.prototype.resolvedOptions;
        Intl.DateTimeFormat.prototype.resolvedOptions = function() {
          const options = originalResolvedOptions.apply(this, arguments);
          options.timeZone = settings.timezone;
          return options;
        };
      }

      // 2. 語言 (JS 端)
      if (settings.language) {
        Object.defineProperty(navigator, 'language', { get: () => settings.language, configurable: true });
        Object.defineProperty(navigator, 'languages', { get: () => [settings.language, settings.language.split('-')[0]], configurable: true });
      }

      // 3. 平台與 User-Agent (JS 端)
      if (settings.platform) {
        Object.defineProperty(navigator, 'platform', { get: () => settings.platform, configurable: true });
        Object.defineProperty(navigator, 'userAgent', { get: () => targetUa, configurable: true });
        Object.defineProperty(navigator, 'appVersion', { get: () => targetUa.replace('Mozilla/', ''), configurable: true });
        Object.defineProperty(navigator, 'vendor', { get: () => 'Google Inc.', configurable: true });

        // 3.1 偽裝 User-Agent Client Hints (UA-CH)
        if (navigator.userAgentData) {
          const isWindows = settings.platform === 'Win32';
          const mockData = {
            brands: [
              { brand: 'Google Chrome', version: '129' },
              { brand: 'Not=A?Brand', version: '8' },
              { brand: 'Chromium', version: '129' }
            ],
            mobile: false,
            platform: isWindows ? 'Windows' : 'macOS'
          };
          Object.defineProperty(navigator, 'userAgentData', {
            get: () => ({
              ...mockData,
              getHighEntropyValues: (hints) => Promise.resolve({
                ...mockData,
                architecture: 'x86',
                bitness: '64',
                model: '',
                platformVersion: isWindows ? '15.0.0' : '14.5.0',
                uaFullVersion: '129.0.0.0',
                fullVersionList: mockData.brands
              })
            })
          });
        }
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
      console.log('%c[VPN Spoofer] ✅ 環境校正完成 (已包含 Windows/UA/Header 偽裝)！', 'color: #059669; font-weight: bold;');
    } catch (e) {
      console.error('[VPN Spoofer] ❌ 套用失敗:', e);
    }
  }

  const timer = setInterval(() => {
    const data = document.documentElement.dataset.vpnSpoof;
    if (data) {
      applySpoof(data);
      clearInterval(timer);
    }
  }, 10);
  setTimeout(() => clearInterval(timer), 1000);
})();
