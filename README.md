# VPN Diff Checker & Spoofer (旗艦全能版)

本工具整合了「VPN 狀態檢查」與「裝置深度偽裝」兩大核心功能，確保您的網路身份與裝置環境達到 100% 的一致性。

## 🛡️ 兩大核心階段

### 第一階段：VPN 狀態檢查 (VPN Checker)
**目的：驗證您目前使用的 VPN 是否生效。**
- **基準比對**: 在開啟 VPN 前儲存「基準值 (Baseline)」，開啟後自動比對 IP、國家、ISP、時區、語言等是否有正確變更。
- **異常提醒**: 若 VPN 未成功隱藏您的真實資訊，系統會以紅字導航提醒。

### 第二階段：裝置深度偽裝 (Device Spoofing)
**目的：在 VPN 修改 IP 後，進一步修改瀏覽器留下的「裝置指紋」。**
- **身份偽裝**: 將 Mac 身份強制轉變為 Windows 10/11、iPhone 或 Android。
- **偵測攔截**: 
    - 修改 **HTTP 標頭** (User-Agent, Accept-Language)。
    - 偽裝 **Client Hints** (Sec-CH-UA-Platform) 防止現代網站偵測。
    - 模擬 **WebGL 顯卡** (如 RTX 4090) 與 **螢幕解析度**。
- **視覺回饋**: 網頁右上角的高速毛玻璃標籤  會確認偽裝已成功寫入網頁底層。

---

## 🛠️ 安裝教學 (開發者模式)

1. 下載專案至您的電腦。
2. 開啟 Chrome，進入 `chrome://extensions`。
3. 開啟 **「開發者模式」**。
4. 點擊 **「載入解壓縮擴充功能」** 並選擇此資料夾。

---

## 🚀 使用流程

1. **檢查 VPN**: 開啟 VPN，確認 Popup 中的 IP 已變更。
2. **執行偽裝**: 
   - 點擊「同步至 IP 所在時區」。
   - 設定您想模擬的作業系統 (如 Windows) 與語言。
   - 勾選「開啟環境偽裝」。
3. **驗證**: 前往 [BrowserLeaks](https://browserleaks.com/ip) 確認裝置資訊已變更。

已經全部推送至 GitHub：`git@github.com:steve-shih/vpn_moni.git`
