/**
 * Inject Script (MAIN world)
 * 終極美化除錯版
 */
(function() {
  const SCRIPT_NAME = '[VPN Spoofer]';
  const log = (msg, color = '#2563eb') => console.log(`%c${SCRIPT_NAME} ${msg}`, `color: ${color}; font-weight: bold;`);

  const UA_PRESETS = {
    'Win32': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36',
    'MacIntel': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36',
    'Linux x86_64': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36',
    'iPhone': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1',
    'Linux armv8l': 'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Mobile Safari/537.36'
  };

  let applied = false;

  function doSpoof(data) {
    if (applied) return;
    try {
      const settings = JSON.parse(data);
      if (!settings.enabled) return;

      const targetUa = UA_PRESETS[settings.platform] || UA_PRESETS['Win32'];

      // --- 1. 時區 ---
      if (settings.timezone) {
        const orig = Intl.DateTimeFormat.prototype.resolvedOptions;
        Intl.DateTimeFormat.prototype.resolvedOptions = function() {
          const res = orig.apply(this, arguments);
          res.timeZone = settings.timezone;
          return res;
        };
      }

      // --- 2. 語言 ---
      if (settings.language) {
        Object.defineProperty(navigator, 'language', { value: settings.language, configurable: true });
        Object.defineProperty(navigator, 'languages', { value: [settings.language, settings.language.split('-')[0]], configurable: true });
      }

      // --- 3. 平台與 User-Agent ---
      if (settings.platform) {
        Object.defineProperty(navigator, 'platform', { value: settings.platform, configurable: true });
        Object.defineProperty(navigator, 'userAgent', { value: targetUa, configurable: true });
        Object.defineProperty(navigator, 'appVersion', { value: targetUa.replace('Mozilla/', ''), configurable: true });
        Object.defineProperty(navigator, 'vendor', { value: 'Google Inc.', configurable: true });
        
        if (navigator.userAgentData) {
          let chPlatform = 'Windows';
          if (settings.platform === 'MacIntel' || settings.platform === 'iPhone') chPlatform = settings.platform === 'iPhone' ? 'iOS' : 'macOS';
          else if (settings.platform === 'Linux x86_64') chPlatform = 'Linux';
          else if (settings.platform === 'Linux armv8l') chPlatform = 'Android';

          const isMobile = chPlatform === 'iOS' || chPlatform === 'Android';

          const mockCH = {
            brands: [
              { brand: 'Google Chrome', version: '129' },
              { brand: 'Not=A?Brand', version: '8' },
              { brand: 'Chromium', version: '129' }
            ],
            mobile: isMobile,
            platform: chPlatform
          };
          Object.defineProperty(navigator, 'userAgentData', {
            get: () => ({
              ...mockCH,
              getHighEntropyValues: (hints) => Promise.resolve({
                ...mockCH,
                architecture: isMobile ? 'arm' : 'x86',
                bitness: '64',
                model: isMobile ? (chPlatform === 'iOS' ? 'iPhone' : 'Pixel 8') : '',
                platformVersion: isMobile ? '14.0.0' : '15.0.0',
                uaFullVersion: '129.0.0.0',
                fullVersionList: mockCH.brands
              })
            }),
            configurable: true
          });
        }
      }

      // --- 4. 解析度 ---
      if (settings.screenWidth) {
        const mockS = (p, v) => Object.defineProperty(Screen.prototype, p, { get: () => v, configurable: true });
        mockS('width', settings.screenWidth);
        mockS('height', settings.screenHeight);
        mockS('availWidth', settings.screenWidth);
        mockS('availHeight', settings.screenHeight);
        Object.defineProperty(window, 'innerWidth', { get: () => settings.screenWidth, configurable: true });
        Object.defineProperty(window, 'innerHeight', { get: () => settings.screenHeight, configurable: true });
        Object.defineProperty(window, 'devicePixelRatio', { get: () => settings.devicePixelRatio || 2, configurable: true });
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
      }

      applied = true;
      showModernBadge(settings.platform, settings.timezone);

    } catch (e) {
      log('❌ 套用失敗: ' + e.message, '#ef4444');
    }
  }

  function showModernBadge(platform, timezone) {
    const badge = document.createElement('div');
    badge.id = 'vpn-spoof-badge';
    badge.innerHTML = `
      <div class="v-icon">🛡️</div>
      <div class="v-text">
        <span class="v-label">VPN Spoof Active</span>
        <span class="v-sub">${platform} • ${timezone || 'Global'}</span>
      </div>
    `;
    const style = document.createElement('style');
    style.innerHTML = `
      #vpn-spoof-badge {
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 2147483647;
        background: rgba(15, 23, 42, 0.85);
        backdrop-filter: blur(10px);
        -webkit-backdrop-filter: blur(10px);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 12px;
        padding: 10px 16px;
        display: flex;
        align-items: center;
        gap: 12px;
        box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.3), 0 4px 6px -2px rgba(0, 0, 0, 0.1);
        color: white;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        cursor: default;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        user-select: none;
        opacity: 0;
        transform: translateY(-10px);
        pointer-events: auto;
      }
      #vpn-spoof-badge:hover {
        transform: scale(1.02);
        background: rgba(30, 41, 59, 0.95);
        border-color: rgba(37, 99, 235, 0.5);
      }
      #vpn-spoof-badge .v-icon {
        font-size: 20px;
        filter: drop-shadow(0 0 5px rgba(37, 99, 235, 0.6));
      }
      #vpn-spoof-badge .v-text {
        display: flex;
        flex-direction: column;
      }
      #vpn-spoof-badge .v-label {
        font-size: 11px;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        color: #3b82f6;
      }
      #vpn-spoof-badge .v-sub {
        font-size: 13px;
        font-weight: 500;
        color: rgba(255, 255, 255, 0.9);
        white-space: nowrap;
      }
    `;
    document.head.appendChild(style);
    document.body.appendChild(badge);
    
    // Animation
    requestAnimationFrame(() => {
      badge.style.opacity = '1';
      badge.style.transform = 'translateY(0)';
    });

    // Auto-hide but interactive
    setTimeout(() => {
      if (badge && !badge.matches(':hover')) {
        badge.style.opacity = '0.3';
        badge.style.transform = 'translateX(10px) scale(0.9)';
      }
    }, 5000);
    
    badge.addEventListener('mouseenter', () => {
      badge.style.opacity = '1';
      badge.style.transform = 'translateY(0) scale(1.02)';
    });
  }

  let count = 0;
  const interval = setInterval(() => {
    count++;
    const data = document.documentElement.dataset.vpnSpoof;
    if (data) {
      doSpoof(data);
      clearInterval(interval);
    }
    if (count > 200) clearInterval(interval);
  }, 10);
})();
