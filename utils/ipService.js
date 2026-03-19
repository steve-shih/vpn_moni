/**
 * IP Service
 * 負責取得 Public IP 與地理位置資訊
 */

const API_TIMEOUT = 5000;

export const IpService = {
  /**
   * 取得目前 IP 與 Geo 資訊
   * 實作 fallback 機制：ipify -> ipinfo
   * @returns {Promise<Object>}
   */
  async getCurrentIpInfo() {
    try {
      // 嘗試主 API (ipify) 取得 IP
      const ipData = await this.fetchWithTimeout('https://api.ipify.org?format=json');
      const publicIp = ipData.ip;

      // 使用 ipinfo 取得詳細資訊 (IPInfo fallback 或作為主要資訊來源)
      try {
        const geoData = await this.fetchWithTimeout(`https://ipinfo.io/${publicIp}/json`);
        return {
          publicIp: geoData.ip || publicIp,
          country: geoData.country || 'Unknown',
          region: geoData.region || 'Unknown',
          city: geoData.city || 'Unknown',
          org: geoData.org || 'Unknown',
          status: 'success'
        };
      } catch (geoError) {
        console.warn('Geo info fetch failed, returning IP only:', geoError);
        return {
          publicIp: publicIp,
          country: 'Unknown',
          region: 'Unknown',
          city: 'Unknown',
          org: 'Unknown',
          status: 'partial_success'
        };
      }
    } catch (error) {
      console.error('IP fetch failed:', error);
      
      // Fallback: 直接呼叫 ipinfo.io/json (可能會有頻率限制，但作為備援)
      try {
        const fallbackData = await this.fetchWithTimeout('https://ipinfo.io/json');
        return {
          publicIp: fallbackData.ip || 'Unknown',
          country: fallbackData.country || 'Unknown',
          region: fallbackData.region || 'Unknown',
          city: fallbackData.city || 'Unknown',
          org: fallbackData.org || 'Unknown',
          status: 'success'
        };
      } catch (fallbackError) {
        console.error('All IP APIs failed:', fallbackError);
        throw new Error('IP_FETCH_FAILED');
      }
    }
  },

  /**
   * 具備超時機制的 fetch
   */
  async fetchWithTimeout(url, options = {}) {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), API_TIMEOUT);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal
      });
      clearTimeout(id);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      clearTimeout(id);
      throw error;
    }
  }
};
