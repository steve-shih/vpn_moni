import { IpService } from './utils/ipService.js';
import { FingerprintService } from './utils/fingerprintService.js';
import { StorageService } from './utils/storageService.js';
import { CompareService } from './utils/compareService.js';

/**
 * Popup 控制器
 */
const Popup = {
  currentData: null,
  baselineData: null,

  async init() {
    this.bindEvents();
    await this.loadSpoofSettings();
    await this.refresh();
  },

  bindEvents() {
    document.getElementById('btn-refresh').addEventListener('click', () => this.refresh());
    document.getElementById('btn-set-baseline').addEventListener('click', () => this.saveBaseline());
    
    // Spoofing events
    document.getElementById('chk-spoof-enabled').addEventListener('change', (e) => this.saveSpoofSettings());
    document.getElementById('sel-lang').addEventListener('change', () => this.saveSpoofSettings());
    document.getElementById('sel-platform').addEventListener('change', () => this.saveSpoofSettings());
    document.getElementById('sel-webgl').addEventListener('change', () => this.saveSpoofSettings());
    document.getElementById('sel-resolution').addEventListener('change', () => this.saveSpoofSettings());
    document.getElementById('btn-sync-ip').addEventListener('click', () => this.syncTimezoneToIp());

    // Proxy events
    document.getElementById('btn-save-proxy').addEventListener('click', () => this.saveSpoofSettings());
    document.getElementById('chk-proxy-enabled').addEventListener('change', () => this.saveSpoofSettings());
  },

  /**
   * 重新抓取資料並更新 UI
   */
  async refresh() {
    const container = document.querySelector('.container');
    container.classList.add('loading');
    
    try {
      // 1. 同步取得瀏覽器指紋與 WebGL 資訊
      const fingerprint = FingerprintService.getFingerprint();
      
      // 2. 非同步取得 IP 資訊
      let ipInfo;
      try {
        ipInfo = await IpService.getCurrentIpInfo();
      } catch (e) {
        ipInfo = {
          publicIp: '取得失敗',
          country: 'Unknown',
          region: 'Unknown',
          city: 'Unknown',
          org: 'Unknown',
          status: 'error'
        };
      }

      this.currentData = { ...fingerprint, ...ipInfo };

      // 3. 取得儲存的基準值
      this.baselineData = await StorageService.getBaseline();

      // 4. 比對並更新 UI
      this.updateUI();
    } catch (error) {
      console.error('Refresh failed:', error);
      document.getElementById('summary-text').textContent = '發生錯誤：' + error.message;
    } finally {
      container.classList.remove('loading');
    }
  },

  /**
   * 更新 UI 顯示
   */
  updateUI() {
    const data = this.currentData;
    const baseline = this.baselineData;
    const results = CompareService.compare(data, baseline);
    
    // 更新摘要
    const summaryText = CompareService.getSummary(data, results);
    document.getElementById('summary-text').textContent = summaryText;

    // 更新各欄位數值與狀態
    this.updateField('publicIp', data.publicIp, results.publicIp);
    
    const geoText = `${data.country} / ${data.region} / ${data.city} (${data.org})`;
    const geoStatus = (results.country === 'changed' || results.region === 'changed' || results.city === 'changed') ? 'changed' : 
                     (results.country === 'unknown' ? 'unknown' : 'unchanged');
    this.updateField('geo', geoText, geoStatus);

    this.updateField('timezone', data.timezone, results.timezone);
    this.updateField('language', data.language, results.language);
    this.updateField('platform', data.platform, results.platform);
    
    this.updateField('webgl', data.webglRenderer, results.webglRenderer);
    
    const screenText = `${data.screenWidth}x${data.screenHeight} @ ${data.devicePixelRatio}x`;
    const screenStatus = (results.screenWidth === 'changed' || results.screenHeight === 'changed' || results.devicePixelRatio === 'changed') ? 'changed' : 'unchanged';
    this.updateField('screen', screenText, screenStatus);

    // 時間
    const checkTime = new Date(data.checkedAt);
    document.getElementById('check-time').textContent = checkTime.toLocaleString('zh-TW');
  },

  /**
   * 更新欄位 (顯示狀態標籤)
   */
  updateField(id, value, status) {
    const valEl = document.getElementById(`val-${id}`);
    const statusEl = document.getElementById(`status-${id}`);
    
    if (valEl) valEl.textContent = value;
    if (statusEl) {
      statusEl.textContent = this.getStatusText(status);
      statusEl.className = `field-status status-${status}`;
      statusEl.style.display = 'inline-block';
    }
  },

  /**
   * 將 status 代碼轉為中文
   */
  getStatusText(status) {
    switch (status) {
      case 'changed': return '已改變';
      case 'unchanged': return '未改變';
      case 'unknown': return '未知';
      default: return '-';
    }
  },

  /**
   * 將目前資料存為基準值
   */
  async saveBaseline() {
    if (!this.currentData) return;
    
    if (confirm('確定要將目前狀態設為基準值嗎？之後的檢查都將與此基準進行比對。')) {
      await StorageService.setBaseline(this.currentData);
      this.baselineData = this.currentData;
      this.updateUI();
      alert('基準值設定成功！');
    }
  },

  /**
   * 載入偽裝設定
   */
  async loadSpoofSettings() {
    const result = await chrome.storage.local.get(['spoofSettings']);
    const settings = result.spoofSettings || {
      enabled: false,
      language: 'en-US',
      platform: 'Win32',
      webglRenderer: 'Intel Iris OpenGL Engine',
      resolution: '1512,982,2',
      timezone: '',
      proxyEnabled: false,
      proxyHost: '',
      proxyPort: '',
      proxyScheme: 'http'
    };

    document.getElementById('chk-spoof-enabled').checked = settings.enabled;
    document.getElementById('sel-lang').value = settings.language;
    document.getElementById('sel-platform').value = settings.platform;
    document.getElementById('sel-webgl').value = settings.webglRenderer;
    document.getElementById('sel-resolution').value = settings.resolution;
    this.spoofTimezone = settings.timezone;

    // Proxy
    document.getElementById('chk-proxy-enabled').checked = settings.proxyEnabled;
    document.getElementById('txt-proxy-host').value = settings.proxyHost || '';
    document.getElementById('num-proxy-port').value = settings.proxyPort || '';
    document.getElementById('sel-proxy-scheme').value = settings.proxyScheme || 'http';
  },

  /**
   * 儲存偽裝與 Proxy 設定
   */
  async saveSpoofSettings() {
    const resString = document.getElementById('sel-resolution').value;
    const [w, h, dpr] = resString.split(',');
    
    const settings = {
      // Spoofing
      enabled: document.getElementById('chk-spoof-enabled').checked,
      language: document.getElementById('sel-lang').value,
      platform: document.getElementById('sel-platform').value,
      webglRenderer: document.getElementById('sel-webgl').value,
      webglVendor: this.getVendorFromRenderer(document.getElementById('sel-webgl').value),
      screenWidth: parseInt(w),
      screenHeight: parseInt(h),
      devicePixelRatio: parseFloat(dpr),
      timezone: this.spoofTimezone || '',

      // Proxy
      proxyEnabled: document.getElementById('chk-proxy-enabled').checked,
      proxyHost: document.getElementById('txt-proxy-host').value.trim(),
      proxyPort: document.getElementById('num-proxy-port').value,
      proxyScheme: document.getElementById('sel-proxy-scheme').value
    };

    await chrome.storage.local.set({ spoofSettings: settings });
    
    if (settings.enabled || settings.proxyEnabled) {
      console.log('Settings saved and active.');
    }
  },

  getVendorFromRenderer(renderer) {
    if (renderer.includes('Intel')) return 'Google Inc. (Intel)';
    if (renderer.includes('NVIDIA')) return 'Google Inc. (NVIDIA)';
    if (renderer.includes('Apple')) return 'Apple Inc.';
    return 'Unknown';
  },

  /**
   * 同步時區至 IP 所在位置
   */
  async syncTimezoneToIp() {
    if (!this.currentData || this.currentData.status === 'error') {
      alert('無法取得 IP 資訊，請先重新檢查。');
      return;
    }

    // 從 ipinfo 取得時區 (ipService 已經在 getCurrentIpInfo 抓過但 popup.js 只存了精簡版)
    // 為了精確，我們從 currentData 拿到 IP 後再抓一次或修改 ipService
    // 簡單做法：ipService.js 其實有回傳廣義的 geoData
    // 重新抓取一次詳細 IP 資訊以獲取時區
    try {
      const geoData = await IpService.fetchWithTimeout(`https://ipinfo.io/${this.currentData.publicIp}/json`);
      if (geoData.timezone) {
        this.spoofTimezone = geoData.timezone;
        await this.saveSpoofSettings();
        alert(`已同步時區為：${geoData.timezone}\n請重新載入網頁以生效。`);
      } else {
        alert('此 IP 無法提供時區資訊。');
      }
    } catch (e) {
      alert('同步失敗：' + e.message);
    }
  }
};

// 啟動
document.addEventListener('DOMContentLoaded', () => {
  Popup.init();
});
