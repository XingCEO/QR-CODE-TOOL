// app/lib/googleSheets.server.ts
import { google } from 'googleapis';
import path from 'path';

// Google Sheets API 設定
const SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];

// 初始化 Google Auth
function initializeAuth() {
  // 從環境變數獲取服務帳戶金鑰路徑
  const keyFilePath = process.env.GOOGLE_SERVICE_ACCOUNT_KEY_PATH;
  
  if (!keyFilePath) {
    throw new Error('GOOGLE_SERVICE_ACCOUNT_KEY_PATH environment variable is required');
  }

  const auth = new google.auth.GoogleAuth({
    keyFile: keyFilePath,
    scopes: SCOPES,
  });

  return auth;
}

// 或者直接使用 JSON 內容（推薦用於部署）
function initializeAuthFromJSON() {
  const serviceAccountKey = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
  
  if (!serviceAccountKey) {
    throw new Error('GOOGLE_SERVICE_ACCOUNT_KEY environment variable is required');
  }

  const credentials = JSON.parse(serviceAccountKey);
  
  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: SCOPES,
  });

  return auth;
}

// Google Sheets 服務類
export class GoogleSheetsService {
  private sheets: any;
  private spreadsheetId: string;

  constructor(spreadsheetId: string) {
    this.spreadsheetId = spreadsheetId;
    const auth = initializeAuthFromJSON(); // 或使用 initializeAuth()
    this.sheets = google.sheets({ version: 'v4', auth });
  }

  // 讀取資料
  async readData(range: string) {
    try {
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
        range: range,
      });

      return response.data.values || [];
    } catch (error) {
      console.error('Error reading from Google Sheets:', error);
      throw error;
    }
  }

  // 新增資料
  async appendData(range: string, values: any[][]) {
    try {
      const response = await this.sheets.spreadsheets.values.append({
        spreadsheetId: this.spreadsheetId,
        range: range,
        valueInputOption: 'USER_ENTERED',
        resource: {
          values: values,
        },
      });

      return response.data;
    } catch (error) {
      console.error('Error appending to Google Sheets:', error);
      throw error;
    }
  }

  // 更新資料
  async updateData(range: string, values: any[][]) {
    try {
      const response = await this.sheets.spreadsheets.values.update({
        spreadsheetId: this.spreadsheetId,
        range: range,
        valueInputOption: 'USER_ENTERED',
        resource: {
          values: values,
        },
      });

      return response.data;
    } catch (error) {
      console.error('Error updating Google Sheets:', error);
      throw error;
    }
  }

  // 刪除資料（清空範圍）
  async clearData(range: string) {
    try {
      const response = await this.sheets.spreadsheets.values.clear({
        spreadsheetId: this.spreadsheetId,
        range: range,
      });

      return response.data;
    } catch (error) {
      console.error('Error clearing Google Sheets:', error);
      throw error;
    }
  }

  // 建立新的工作表
  async createSheet(title: string) {
    try {
      const response = await this.sheets.spreadsheets.batchUpdate({
        spreadsheetId: this.spreadsheetId,
        resource: {
          requests: [
            {
              addSheet: {
                properties: {
                  title: title,
                },
              },
            },
          ],
        },
      });

      return response.data;
    } catch (error) {
      console.error('Error creating sheet:', error);
      throw error;
    }
  }

  // 取得試算表資訊
  async getSpreadsheetInfo() {
    try {
      const response = await this.sheets.spreadsheets.get({
        spreadsheetId: this.spreadsheetId,
      });

      return response.data;
    } catch (error) {
      console.error('Error getting spreadsheet info:', error);
      throw error;
    }
  }

  // QR Code 專用方法：儲存掃描結果
  async saveQrScanResult(data: string, scanTime: Date, isValid: boolean) {
    const taiwanTime = scanTime.toLocaleString('zh-TW', { 
      timeZone: 'Asia/Taipei',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });

    const values = [
      [
        taiwanTime,           // 掃描時間
        data,                 // QR Code 內容
        isValid ? '有效' : '無效',  // 驗證狀態
        new Date(parseInt(data)).toLocaleString('zh-TW', { timeZone: 'Asia/Taipei' }), // QR Code 時間
      ]
    ];

    return await this.appendData('掃描記錄!A:D', values);
  }

  // QR Code 專用方法：取得最近的掃描記錄
  async getRecentScans(limit: number = 10) {
    const data = await this.readData('掃描記錄!A:D');
    
    // 跳過標題行，取得最近的記錄
    return data.slice(-limit).reverse();
  }

  // 初始化工作表結構
  async initializeQrWorksheet() {
    try {
      // 檢查是否已有「掃描記錄」工作表
      const spreadsheetInfo = await this.getSpreadsheetInfo();
      const sheetExists = spreadsheetInfo.sheets?.some(
        (sheet: any) => sheet.properties.title === '掃描記錄'
      );

      if (!sheetExists) {
        await this.createSheet('掃描記錄');
      }

      // 設定標題行
      const headers = [['掃描時間', 'QR Code 內容', '驗證狀態', 'QR Code 時間戳']];
      await this.updateData('掃描記錄!A1:D1', headers);

      return { success: true, message: '工作表初始化完成' };
    } catch (error) {
      console.error('Error initializing worksheet:', error);
      throw error;
    }
  }
}

// 工廠函數
export function createGoogleSheetsService(spreadsheetId?: string) {
  const defaultSpreadsheetId = process.env.GOOGLE_SPREADSHEET_ID;
  
  if (!spreadsheetId && !defaultSpreadsheetId) {
    throw new Error('Spreadsheet ID is required');
  }

  return new GoogleSheetsService(spreadsheetId || defaultSpreadsheetId!);
}