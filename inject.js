/**
 * Inject Script (MAIN world)
 * 終極偽裝與除錯模式
 */
(function() {
  const SCRIPT_NAME = '[VPN Spoofer]';
  const log = (msg, color = '#2563eb') => console.log(`%c${SCRIPT_NAME} ${msg}`, `color: ${color}; font-weight: bold;`);

  log('🚀 注入成功，正在搜尋環境設定...', '#2563eb');

  const UA_PRESETS = {
    'Win32': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36',
    'MacIntel': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36',
    'Linux x86_64': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36'
  };

  let applied = false;

  function doSpoof(data) {
    if (applied) return;
    try {
      const settings = JSON.parse(data);
      if (!settings.enabled) {
        log('偽裝模式已關閉', '#666');
        return;
      }

      log('⚙️ 偵測到設定，開始強制覆蓋系統參數...', '#d97706');
      const targetUa = UA_PRESETS[settings.platform] || UA_PRESETS['Win32'];

      // --- 1. 時區 ---
      if (settings.timezone) {
        const orig = Intl.DateTimeFormat.prototype.resolvedOptions;
        Intl.DateTimeFormat.prototype.resolvedOptions = function() {
          const res = orig.apply(this, arguments);
          res.timeZone = settings.timezone;
          return res;
        };
        log(`時區已修正: ${settings.timezone}`);
      }

      // --- 2. 語言 ---
      if (settings.language) {
        Object.defineProperty(navigator, 'language', { value: settings.language, configurable: true });
        Object.defineProperty(navigator, 'languages', { value: [settings.language, settings.language.split('-')[0]], configurable: true });
        log(`語言已修正: ${settings.language}`);
      }

      // --- 3. 平台與 User-Agent ---
      if (settings.platform) {
        // 基本資訊
        Object.defineProperty(navigator, 'platform', { value: settings.platform, configurable: true });
        Object.defineProperty(navigator, 'userAgent', { value: targetUa, configurable: true });
        Object.defineProperty(navigator, 'appVersion', { value: targetUa.replace('Mozilla/', ''), configurable: true });
        Object.defineProperty(navigator, 'vendor', { value: 'Google Inc.', configurable: true });
        
        // Client Hints (現代瀏覽器偵測重點)
        if (navigator.userAgentData) {
          const isWindows = settings.platform === 'Win32';
          const mockCH = {
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
              ...mockCH,
              getHighEntropyValues: (hints) => Promise.resolve({
                ...mockCH,
                architecture: 'x86',
                bitness: '64',
                model: '',
                platformVersion: isWindows ? '15.0.0' : '14.5.0',
                uaFullVersion: '129.0.0.0',
                fullVersionList: mockCH.brands
              })
            }),
            configurable: true
          });
          log('User-Agent Client Hints 已修正');
        }
        log(`平台已切換為: ${settings.platform}`);
      }

      // --- 4. 解析度 ---
      if (settings.screenWidth) {
        const mockScreen = (prop, val) => Object.defineProperty(Screen.prototype, prop, { get: () => val, configurable: true });
        mockScreen('width', settings.screenWidth);
        mockScreen('height', settings.screenHeight);
        mockScreen('availWidth', settings.screenWidth);
        mockScreen('availHeight', settings.screenHeight);
        Object.defineProperty(window, 'innerWidth', { get: () => settings.screenWidth, configurable: true });
        Object.defineProperty(window, 'innerHeight', { get: () => settings.screenHeight, configurable: true });
        Object.defineProperty(window, 'devicePixelRatio', { get: () => settings.devicePixelRatio || 2, configurable: true });
        log('解析度已修正');
      }

      // --- 5. WebGL ---
      if (settings.webglRenderer) {
        const spoofGL = (proto) => {
          const old = proto.getParameter;
          proto.getParameter = function(p) {
            const ext = this.getExtension('WEBGL_debug_renderer_info');
            if (ext) {
              if (p === ext.UNMASKED_VENDOR_WEBGL) return settings.webglVendor || 'Google Inc. (Intel)';
              if (p === ext.UNMASKED_RENDERER_WEBGL) return settings.webglRenderer;
            }
            return old.apply(this, arguments);
          };
        };
        if (window.WebGLRenderingContext) spoofGL(WebGLRenderingContext.prototype);
        if (window.WebGL2RenderingContext) spoofGL(WebGL2RenderingContext.prototype);
        log('WebGL 渲染器已修正');
      }

      applied = true;
      log('✅ 全系統偽裝指令執行完畢！', '#059669');
      
      // 在畫面上方顯示一個小小的除錯標籤
      const div = document.createElement('div');
      div.style = 'position:fixed;top:0;right:0;background:rgba(37,99,235,0.9);color:white;padding:4px 8px;font-size:10px;z-index:999999;pointer-events:none;border-bottom-left-radius:8px;';
      div.innerText = '🛡️ VPN Spoofer Active: ' + settings.platform;
      document.body ? document.body.appendChild(div) : window.addEventListener('DOMContentLoaded', () => document.body.appendChild(div));

    } catch (e) {
      log('❌ 套用過程出錯: ' + e.message, '#ef4444');
    }
  }

  // 強力循環監聽直到抓到資料
  let count = 0;
  const interval = setInterval(() => {
    count++;
    const data = document.documentElement.dataset.vpnSpoof;
    if (data) {
      doSpoof(data);
      clearInterval(interval);
    }
    if (count > 200) { // 等 2 秒
      clearInterval(interval);
      if (!applied) log('⚠️ 等候超時，未偵測到 Bridge 資料', '#ef4444');
    }
  }, 10);
})();
