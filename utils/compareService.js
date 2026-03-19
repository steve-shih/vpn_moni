/**
 * Compare Service
 * 負責比對目前資訊與基準值，並產出比對結果與摘要
 */

export const CompareService = {
  /**
   * 比對兩個資料物件
   * @param {Object} current 
   * @param {Object} baseline 
   * @returns {Object} 欄位與狀態的映射
   */
  compare(current, baseline) {
    if (!baseline) return {};

    const results = {};
    const fields = [
      'publicIp', 'country', 'region', 'city', 'org',
      'userAgent', 'platform', 'language', 'timezone',
      'screenWidth', 'screenHeight', 'devicePixelRatio',
      'webglVendor', 'webglRenderer'
    ];

    fields.forEach(field => {
      const curVal = current[field];
      const baseVal = baseline[field];

      if (curVal === undefined || curVal === 'Unknown' || curVal === 'N/A' || curVal === 'Error') {
        results[field] = 'unknown';
      } else if (curVal === baseVal) {
        results[field] = 'unchanged';
      } else {
        results[field] = 'changed';
      }
    });

    return results;
  },

  /**
   * 根據比對結果產生判定摘要 (繁體中文)
   * @param {Object} current 
   * @param {Object} results 
   * @returns {String} 摘要文字
   */
  getSummary(current, results) {
    if (!results || Object.keys(results).length === 0) {
      return '尚未設定基準資料，請點擊「設為目前基準」。';
    }

    const ipChanged = results.publicIp === 'changed';
    const geoChanged = results.country === 'changed' || results.region === 'changed' || results.city === 'changed';
    const fingerprintChanged = 
      results.userAgent === 'changed' || 
      results.platform === 'changed' || 
      results.timezone === 'changed' ||
      results.language === 'changed' ||
      results.webglRenderer === 'changed';

    // 規則判定
    if (current.publicIp === 'Unknown' || results.publicIp === 'unknown') {
      return '資訊不足，無法完整判定 (IP 取得失敗)。';
    }

    if (!ipChanged) {
      return '目前判定：VPN 可能未生效，或目前流量未透過 VPN 出口 (IP 未改變)。';
    }

    if (ipChanged && !fingerprintChanged) {
      if (geoChanged) {
        return '目前判定：VPN 僅改變了網路出口 (IP 與地區已變更，但瀏覽器指紋未變)。';
      }
      return '目前判定：僅改變了網路 IP，地區資訊可能未更新。';
    }

    if (ipChanged && fingerprintChanged) {
      return '目前判定：VPN 改變了網路出口與部分瀏覽器環境資訊。';
    }

    return '目前判定：環境資訊已有變動。';
  }
};
