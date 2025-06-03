# QR Code 多功能工具

# QR Code 多功能工具

一個使用 Remix + TypeScript + Tailwind CSS 建構的現代化 QR Code 工具，具有自動生成、智能掃描和時效驗證功能。

## 🎯 功能概述

### ✨ 主要特色

- **🔄 自動生成功能**：每2秒自動產生包含毫秒時間戳的 QR Code
- **📱 智能掃描功能**：使用相機自動掃描 QR Code 並驗證時效性
- **⏱️ 時間差距檢測**：掃描時檢查 QR Code 的新鮮度（5秒內有效）
- **💾 資料庫儲存**：自動儲存有效的掃描結果
- **🎨 現代化界面**：深色主題、響應式設計
- **🔍 即時除錯**：完整的掃描過程日誌

### 🚀 技術特色

- **自動化操作**：減少手動操作需求
- **即時回饋**：即時顯示操作狀態和時間資訊  
- **錯誤處理**：友善的錯誤訊息和建議
- **無縫導航**：流暢的頁面切換體驗
- **類型安全**：完整的 TypeScript 支援

## 📋 系統需求

- **Node.js** 20.0.0 或更高版本
- **PostgreSQL** 資料庫（可選）
- **現代瀏覽器**（支援 WebRTC 和相機存取）
- **HTTPS 環境**（生產環境推薦，相機功能更穩定）

## 🚀 快速開始

### 1. 建立專案

```bash
# 建立新的 Remix 專案
npx create-remix@latest qr-code-tool --template remix-run/remix/templates/remix
cd qr-code-tool

# 安裝額外依賴
npm install qrcode jsqr pg @types/qrcode @types/pg
```

### 2. 設定環境變數

```bash
# 複製環境變數範例
cp .env.example .env

# 編輯 .env 檔案
# 添加您的 PostgreSQL 資料庫連線字串
```

**`.env` 檔案內容：**
```env
DATABASE_URL=postgresql://username:password@localhost:5432/database
NODE_ENV=development
```

**如果沒有資料庫，可以使用測試用設定：**
```env
DATABASE_URL=postgresql://localhost:5432/test
```

### 3. 建立資料庫表（可選）

如果您使用 PostgreSQL，請建立以下資料表：

```sql
CREATE TABLE IF NOT EXISTS scanned_data (
  id SERIAL PRIMARY KEY,
  data TEXT NOT NULL,
  scanned_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

### 4. 啟動開發伺服器

```bash
npm run dev
```

開啟瀏覽器訪問 `http://localhost:3000`

## 📱 功能使用

### 🔸 QR Code 生成

1. 點擊「產生 QR Code」按鈕
2. 系統會自動每2秒生成新的 QR Code
3. 每個 QR Code 包含當前毫秒時間戳
4. 可手動點擊「手動生成新的 QR Code」立即產生
5. 支援複製時間戳到剪貼簿

**時間格式：**
```typescript
// QR Code 內容：毫秒時間戳
1732879825123

// 顯示格式：台灣時區
2024/11/29 14:30:25
```

### 🔸 QR Code 掃描

1. 點擊「掃描 QR Code」按鈕
2. 自動啟動相機（需要授權相機權限）
3. 將 QR Code 對準相機鏡頭
4. 系統自動檢測並驗證時效性
5. 只有5秒內生成的 QR Code 會被接受並儲存

**掃描特色：**
- 自動啟動掃描
- 即時時間差距計算
- 詳細的掃描器日誌
- 自動儲存有效資料

### 🔸 資料庫測試

1. 點擊「測試資料庫連線」按鈕
2. 檢查 PostgreSQL 連線狀態
3. 顯示資料庫時間和記錄數
4. 提供連線失敗的詳細錯誤資訊

## 🔧 技術架構

### 前端技術

- **Remix** - 全端 React 框架
- **TypeScript** - 類型安全的 JavaScript
- **Tailwind CSS** - 現代化 CSS 框架
- **React Hooks** - 狀態管理和生命週期
- **QRCode.js** - QR Code 生成庫
- **jsQR** - QR Code 解析庫

### 後端技術

- **Node.js** - JavaScript 執行環境
- **Remix Server** - 伺服器端渲染
- **PostgreSQL** - 關聯式資料庫
- **pg** - PostgreSQL 客戶端

### 核心功能實作

#### QR Code 自動生成
```typescript
const generateNewQrCode = async () => {
  const timestamp = Date.now().toString();
  const qrCodeDataUrl = await QRCode.toDataURL(timestamp, {
    errorCorrectionLevel: 'H',
    width: 256,
    margin: 2,
  });
  // 每2秒執行一次
};
```

#### 相機掃描循環
```typescript
const tick = () => {
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const code = jsQR(imageData.data, imageData.width, imageData.height);
  if (code && code.data) {
    handleScannedData(code.data);
  }
  requestAnimationFrame(tick);
};
```

#### 時效性驗證
```typescript
const qrCodeTime = new Date(parseInt(scannedData));
const timeDifference = scanTime.getTime() - qrCodeTime.getTime();
const isValid = timeDifference <= 5000; // 5秒內有效
```

## 📁 專案結構

```
qr-code-tool/
├── app/
│   ├── components/
│   │   └── QrScanner.tsx          # QR Code 掃描組件
│   ├── routes/
│   │   ├── _index.tsx            # 首頁
│   │   ├── generate.tsx          # QR Code 生成頁面
│   │   ├── scan.tsx              # QR Code 掃描頁面
│   │   └── test-db.tsx           # 資料庫測試頁面
│   ├── db.server.ts              # 資料庫連接設定
│   ├── root.tsx                  # 根組件
│   └── tailwind.css              # 樣式檔案
├── public/                       # 靜態檔案
├── .env                         # 環境變數
├── .env.example                 # 環境變數範例
├── package.json                 # 專案依賴
├── tailwind.config.ts           # Tailwind 配置
├── tsconfig.json               # TypeScript 配置
├── vite.config.ts              # Vite 配置
└── README.md                   # 專案說明
```

## 🎨 UI/UX 設計

### 視覺特色

- **深色主題**：現代化的深灰色調配色方案
- **漸層效果**：美觀的漸層背景和按鈕設計
- **狀態指示**：清楚的視覺回饋系統
- **響應式設計**：適配桌面、平板和手機
- **動畫效果**：流暢的過渡和互動動畫

### 用戶體驗

- **直觀操作**：簡單明瞭的操作流程
- **即時回饋**：操作結果立即顯示
- **錯誤處理**：友善的錯誤訊息和修正建議
- **無障礙設計**：支援鍵盤導航和螢幕閱讀器

## 🔍 除錯和監控

### 掃描器日誌

應用程式提供詳細的即時日誌：

```typescript
[SCANNER 14:30:25.123] 相機串流已獲取
[SCANNER 14:30:25.456] 影片播放已開始
[SCANNER 14:30:26.789] jsQR 找到物件! Data: "1732879825123..."
[SCANNER 14:30:27.012] 時間差距 2 秒，允許儲存到資料庫
```

### 效能監控

- 使用 `requestAnimationFrame` 處理掃描循環
- 適當的記憶體管理和資源清理
- 資料庫連接池管理
- 錯誤捕獲和日誌記錄

## 📦 部署指南

### 環境變數設定

**生產環境 `.env`：**
```env
DATABASE_URL=postgresql://username:password@your-db-host:5432/database
NODE_ENV=production
PORT=3000
```

### 建構和部署

```bash
# 建構專案
npm run build

# 啟動生產伺服器
npm start
```

### Docker 部署

```dockerfile
FROM node:20-alpine

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

EXPOSE 3000
CMD ["npm", "start"]
```

### Vercel 部署

1. 推送程式碼到 GitHub
2. 連接 Vercel 到您的 Repository
3. 設定環境變數 `DATABASE_URL`
4. 自動部署

## 🛠️ 開發指令

```bash
# 安裝依賴
npm install

# 開發模式（熱重載）
npm run dev

# 建構專案
npm run build

# 啟動生產伺服器
npm start

# TypeScript 類型檢查
npm run typecheck

# ESLint 程式碼檢查
npm run lint
```

## ⚙️ 自訂設定

### 修改 QR Code 生成間隔

在 `app/routes/generate.tsx` 中：
```typescript
// 預設每2秒，可以修改為其他值
const intervalId = setInterval(generateNewQrCode, 2000);
```

### 修改時效驗證時間

在 `app/components/QrScanner.tsx` 中：
```typescript
// 預設5秒，可以修改為其他值
if (timeDifferenceSec <= 5) {
  // 允許儲存
}
```

### 自訂 QR Code 樣式

```typescript
const qrCodeDataUrl = await QRCode.toDataURL(textToEncode, {
  errorCorrectionLevel: 'H',    // 錯誤修正等級
  width: 256,                   // 寬度
  margin: 2,                    // 邊距
  color: { 
    dark: '#0F172A',           // 深色部分
    light: '#FFFFFF'           // 背景色
  },
});
```

## 🔒 安全性考量

### 資料庫安全

- 使用參數化查詢防止 SQL 注入
- 適當的 SSL 連接設定
- 環境變數保護敏感資訊
- 連接池管理和超時設定

### 前端安全

- 輸入驗證和資料清理
- HTTPS 連接（生產環境）
- 適當的 CORS 設定
- 相機權限管理

## 🐛 故障排除

### 常見問題

**Q: 相機無法啟動？**
```
A: 檢查瀏覽器權限設定，確保允許網站存取相機。
   HTTPS 環境下相機功能更穩定。
```

**Q: 資料庫連接失敗？**
```
A: 檢查 DATABASE_URL 環境變數設定，
   確認資料庫伺服器正在運行，
   檢查防火牆和網路設定。
```

**Q: QR Code 掃描不到？**
```
A: 確保 QR Code 清晰可見，光線充足，
   並且在相機視野範圍內。
```

**Q: 時間驗證失敗？**
```
A: 確保系統時間正確，
   QR Code 是最近生成的（5秒內）。
```

### 除錯模式

啟用詳細日誌：
```typescript
// 在瀏覽器控制台查看詳細日誌
console.log('[DEBUG] 掃描器狀態');
```

## 📊 瀏覽器支援

| 瀏覽器 | 版本 | QR 生成 | QR 掃描 | WebRTC |
|--------|------|---------|---------|---------|
| Chrome | 88+ | ✅ | ✅ | ✅ |
| Firefox | 85+ | ✅ | ✅ | ✅ |
| Safari | 14+ | ✅ | ✅ | ✅ |
| Edge | 88+ | ✅ | ✅ | ✅ |

## 🔮 未來規劃

- [ ] 支援批量 QR Code 生成
- [ ] 新增 QR Code 歷史記錄頁面
- [ ] 支援自訂 QR Code 內容格式
- [ ] 新增匯出功能（PDF、圖片）
- [ ] 多語言支援（英文、日文）
- [ ] PWA 支援和離線功能
- [ ] 更多 QR Code 樣式選項
- [ ] RESTful API 端點
- [ ] 即時通訊整合
- [ ] 雲端儲存整合

## 🤝 貢獻指南

1. Fork 本專案
2. 建立功能分支 (`git checkout -b feature/amazing-feature`)
3. 提交變更 (`git commit -m 'Add amazing feature'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 開啟 Pull Request

### 程式碼規範

- 使用 TypeScript 進行開發
- 遵循 ESLint 規則
- 添加適當的註釋和文件
- 撰寫單元測試（如適用）
- 確保響應式設計

## 📄 授權條款

本專案採用 MIT 授權條款

```
MIT License

Copyright (c) 2024 QR Code Tool

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

## 🙏 致謝

- [Remix](https://remix.run) - 優秀的全端 React 框架
- [Tailwind CSS](https://tailwindcss.com) - 實用的 CSS 框架  
- [QRCode.js](https://github.com/soldair/node-qrcode) - QR Code 生成庫
- [jsQR](https://github.com/cozmo/jsQR) - QR Code 解析庫
- [PostgreSQL](https://www.postgresql.org) - 強大的開源資料庫
- [TypeScript](https://www.typescriptlang.org) - JavaScript 的超集

## 📧 聯絡方式

如有任何問題或建議，歡迎通過以下方式聯絡：

- 開啟 GitHub Issue
- 發送 Pull Request
- 電子郵件：your-email@example.com

---

**立即體驗這個現代化的 QR Code 工具，享受自動生成和智能掃描的便利功能！**

## 🎉 開始使用

```bash
git clone https://github.com/your-username/qr-code-tool.git
cd qr-code-tool
npm install
echo "DATABASE_URL=postgresql://localhost:5432/test" > .env
npm run dev
```

**開啟瀏覽器訪問 `http://localhost:3000` 開始使用！**