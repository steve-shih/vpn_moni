/**
 * Fingerprint Service
 * 負責收集瀏覽器環境資訊與 WebGL 指紋
 */

export const FingerprintService = {
  /**
   * 收集目前的環境資訊
   * @returns {Object}
   */
  getFingerprint() {
    const webgl = this.getWebGLInfo();
    
    return {
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      language: navigator.language,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      screenWidth: window.screen.width,
      screenHeight: window.screen.height,
      devicePixelRatio: window.devicePixelRatio,
      webglVendor: webgl.vendor,
      webglRenderer: webgl.renderer,
      checkedAt: new Date().toISOString()
    };
  },

  /**
   * 取得 WebGL 供應商與渲染器資訊
   * @returns {Object}
   */
  getWebGLInfo() {
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      
      if (!gl) {
        return { vendor: 'N/A', renderer: 'N/A' };
      }

      const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
      if (!debugInfo) {
        return { vendor: 'Unknown', renderer: 'Unknown' };
      }

      return {
        vendor: gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL),
        renderer: gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL)
      };
    } catch (e) {
      console.error('Error getting WebGL info:', e);
      return { vendor: 'Error', renderer: 'Error' };
    }
  }
};
