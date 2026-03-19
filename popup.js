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
    await this.refresh();
  },

  bindEvents() {
    document.getElementById('btn-refresh').addEventListener('click', () => this.refresh());
    document.getElementById('btn-set-baseline').addEventListener('click', () => this.saveBaseline());
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

    this.updateMiniField('timezone', data.timezone, results.timezone);
    this.updateMiniField('language', data.language, results.language);
    this.updateMiniField('platform', data.platform, results.platform);
    
    this.updateField('webgl', data.webglRenderer, results.webglRenderer);
    
    const screenText = `${data.screenWidth}x${data.screenHeight} @ ${data.devicePixelRatio}x`;
    const screenStatus = (results.screenWidth === 'changed' || results.screenHeight === 'changed' || results.devicePixelRatio === 'changed') ? 'changed' : 'unchanged';
    this.updateMiniField('screen', screenText, screenStatus);

    // 時間
    const checkTime = new Date(data.checkedAt);
    document.getElementById('check-time').textContent = checkTime.toLocaleString('zh-TW');
  },

  /**
   * 更新一般欄位 (顯示狀態標籤)
   */
  updateField(id, value, status) {
    const valEl = document.getElementById(`val-${id}`);
    const statusEl = document.getElementById(`status-${id}`);
    
    if (valEl) valEl.textContent = value;
    if (statusEl) {
      statusEl.textContent = this.getStatusText(status);
      statusEl.className = `field-status status-${status}`;
    }
  },

  /**
   * 更新迷你欄位 (顯示狀態圓點)
   */
  updateMiniField(id, value, status) {
    const valEl = document.getElementById(`val-${id}`);
    const dotEl = document.getElementById(`dot-${id}`);
    
    if (valEl) valEl.textContent = value;
    if (dotEl) {
      dotEl.className = `status-dot dot-${status}`;
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
  }
};

// 啟動
document.addEventListener('DOMContentLoaded', () => {
  Popup.init();
});
