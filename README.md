# VPN Diff Checker & Spoofer (旗艦全能版)

這是一個強大的 Chrome 擴充功能，旨在幫助使用者偵測 VPN 連線後的環境差異，並提供深度環境偽裝 (Spoofing) 與 Proxy 切換功能。

## 🌟 主要功能

1. **VPN 差異檢查 (Checker)**: 儲存基準 IP 與環境資訊，並與目前狀態比對。
2. **深度環境偽裝 (Spoofing)**: 
   - **時區 & 語言**: 支援同步同步 VPN 所在地時區。
   - **作業系統 (Platform)**: 將 Mac 身份完美模擬為 Windows 10/11、iPhone 或 Android。
   - **User-Agent & Client Hints**: 攔截 HTTP 標頭並修改 `Sec-CH-UA` 等新式偵測標頭。
   - **WebGL 渲染器**: 模擬 RTX 4090、Apple M2 等多種顯卡特徵。
   - **旗艦除錯標籤**: 網頁右上角具備毛玻璃效果的 `🛡️ VPN Spoof Active` 狀態顯示。
3. **代理伺服器控制 (Proxy)**: 支援手動輸入 SOCKS5/HTTP/HTTPS 代理，一鍵切換 IP。

---

## 🛠️ 安裝教學 (開發者模式)

由於此為開發專案，請依照以下步驟手動載入 Chrome：

1. 下載或克隆 (Clone) 此專案至您的電腦。
2. 開啟 Chrome 瀏覽器，進入 `chrome://extensions`。
3. 在右上角開啟 **「開發者模式」 (Developer mode)**。
4. 點擊左上角的 **「載入解壓縮擴充功能」 (Load unpacked)**。
5. 選擇您下載的專案資料夾即可完成安裝。

---

## 🚀 如何使用

### 1. 基礎檢查
- 點擊擴充功能圖示開啟 Popup。
- 插上 VPN 前，點擊 **「儲存基準值」**。
- 插上 VPN 後，查看下方差異，紅色代表目前資訊與當初存取的基準值不符。

### 2. 開啟深度偽裝
- 在 Popup 中勾選 **「開啟環境偽裝」**。
- 按下 **「同步至 IP 所在時區」** 確保時區正確。
- 選擇您想要的 **語言、平台 (OS) 與 顯卡**。
- 開啟網頁後，看到右上方出現藍色盾牌標籤即代表偽裝成功。

### 3. 設定 Proxy (改 IP)
- 捲動至最下方的「代理伺服器設定」。
- 輸入 Proxy 主機 IP、Port 與協定。
- 點擊 **「儲存並套用」** 並勾選 **「開啟 Proxy 代理」**。

---

## 📝 驗證偽裝結果

建議使用 [BrowserLeaks - IP Search](https://browserleaks.com/ip) 進行驗證：
- 檢查 **HTTP Headers**: 應顯示偽裝後的 `User-Agent` 與 `Sec-CH-UA-Platform`。
- 檢查 **JavaScript API**: 應顯示偽裝後的語言、時區、解析度與顯卡資訊。

---

## 📦 技術規格
- **Manifest V3**: 符合最新 Chrome 擴充功能標準。
- **Declarative Net Request**: 使用高效能標頭攔截與修改技術。
- **Main World Injection**: 深度覆蓋原生 JavaScript API。

已經全部推送至 GitHub：`git@github.com:steve-shih/vpn_moni.git`
