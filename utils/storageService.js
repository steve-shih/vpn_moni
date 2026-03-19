/**
 * Storage Service
 * 負責處理 chrome.storage.local 的存取
 */

export const StorageService = {
  /**
   * 取得儲存的基準資料 (baseline)
   * @returns {Promise<Object|null>}
   */
  async getBaseline() {
    return new Promise((resolve) => {
      chrome.storage.local.get(['baseline'], (result) => {
        resolve(result.baseline || null);
      });
    });
  },

  /**
   * 設定基準資料 (baseline)
   * @param {Object} data 
   * @returns {Promise<void>}
   */
  async setBaseline(data) {
    return new Promise((resolve) => {
      chrome.storage.local.set({ baseline: data }, () => {
        resolve();
      });
    });
  },

  /**
   * 清除儲存的基準資料
   * @returns {Promise<void>}
   */
  async clearBaseline() {
    return new Promise((resolve) => {
      chrome.storage.local.remove(['baseline'], () => {
        resolve();
      });
    });
  }
};
