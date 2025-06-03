// app/routes/sheets.tsx - Google Sheets 管理頁面
import type { MetaFunction, LoaderFunctionArgs, ActionFunctionArgs } from "@remix-run/node";
import { json, Link, useLoaderData, useFetcher } from "@remix-run/react";
import { createGoogleSheetsService } from "~/lib/googleSheets.server";

export const meta: MetaFunction = () => {
  return [
    { title: "Google Sheets 管理 - QR Code 工具" },
    { name: "description", content: "管理 QR Code 掃描資料的 Google Sheets 同步" },
  ];
};

interface LoaderData {
  status: "success" | "error";
  message: string;
  recentScans?: any[];
  spreadsheetInfo?: any;
  errorDetail?: string;
}

export async function loader({ request }: LoaderFunctionArgs): Promise<Response> {
  try {
    const sheetsService = createGoogleSheetsService();
    
    // 初始化工作表
    await sheetsService.initializeQrWorksheet();
    
    // 取得最近的掃描記錄
    const recentScans = await sheetsService.getRecentScans(10);
    
    // 取得試算表資訊
    const spreadsheetInfo = await sheetsService.getSpreadsheetInfo();
    
    return json({
      status: "success",
      message: "成功連接到 Google Sheets！",
      recentScans,
      spreadsheetInfo: {
        title: spreadsheetInfo.properties?.title,
        url: spreadsheetInfo.spreadsheetUrl,
        sheets: spreadsheetInfo.sheets?.map((sheet: any) => sheet.properties.title)
      }
    } as LoaderData);
  } catch (error: any) {
    console.error('Google Sheets connection error:', error);
    return json({
      status: "error",
      message: "無法連接到 Google Sheets",
      errorDetail: error.message
    } as LoaderData, { status: 500 });
  }
}

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const actionType = formData.get("actionType") as string;
  
  try {
    const sheetsService = createGoogleSheetsService();
    
    switch (actionType) {
      case "syncData": {
        // 從本地資料庫同步資料到 Google Sheets
        // 這裡需要連接到您的 PostgreSQL 資料庫
        const { pool } = await import("~/db.server");
        const client = await pool.connect();
        
        try {
          const result = await client.query(
            'SELECT data, scanned_at FROM scanned_data ORDER BY scanned_at DESC LIMIT 50'
          );
          
          for (const row of result.rows) {
            await sheetsService.saveQrScanResult(
              row.data,
              new Date(row.scanned_at),
              true // 假設資料庫中的都是有效的
            );
          }
          
          return json({ success: true, message: `已同步 ${result.rows.length} 筆資料到 Google Sheets` });
        } finally {
          client.release();
        }
      }
      
      case "clearSheets": {
        await sheetsService.clearData('掃描記錄!A2:D');
        return json({ success: true, message: "已清空 Google Sheets 資料" });
      }
      
      default:
        return json({ success: false, error: "未知的操作類型" }, { status: 400 });
    }
  } catch (error: any) {
    console.error('Google Sheets action error:', error);
    return json({ success: false, error: error.message }, { status: 500 });
  }
}

export default function SheetsPage() {
  const data = useLoaderData<LoaderData>();
  const fetcher = useFetcher();

  return (
    <div className="flex flex-col min-h-screen items-center justify-center bg-gradient-to-br from-slate-900 to-slate-700 text-gray-100 p-6 font-sans">
      <div className="bg-slate-800 p-8 rounded-xl shadow-2xl w-full max-w-4xl">
        <header className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-400 mb-2">
            Google Sheets 管理
          </h1>
          <p className="text-slate-400">
            管理 QR Code 掃描資料的 Google Sheets 同步
          </p>
        </header>

        {data.status === "success" ? (
          <div className="space-y-6">
            {/* 試算表資訊 */}
            <div className="p-6 bg-green-700 bg-opacity-30 border border-green-500 rounded-lg">
              <h2 className="text-2xl font-semibold text-green-300 mb-4">連接成功！</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-green-400 font-semibold">試算表名稱：</span>
                  <span className="text-green-200">{data.spreadsheetInfo?.title || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-green-400 font-semibold">工作表數量：</span>
                  <span className="text-green-200">{data.spreadsheetInfo?.sheets?.length || 0}</span>
                </div>
              </div>
              {data.spreadsheetInfo?.url && (
                <div className="mt-4">
                  <a 
                    href={data.spreadsheetInfo.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-flex items-center text-green-300 hover:text-green-200 underline"
                  >
                    開啟 Google Sheets
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="ml-1">
                      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
                      <polyline points="15,3 21,3 21,9"/>
                      <line x1="10" x2="21" y1="14" y2="3"/>
                    </svg>
                  </a>
                </div>
              )}
            </div>

            {/* 操作按鈕 */}
            <div className="flex flex-wrap gap-4 justify-center">
              <fetcher.Form method="post">
                <input type="hidden" name="actionType" value="syncData" />
                <button
                  type="submit"
                  disabled={fetcher.state === "submitting"}
                  className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 disabled:opacity-50 text-white font-semibold py-3 px-6 rounded-lg shadow-md transition-all"
                >
                  {fetcher.state === "submitting" ? "同步中..." : "同步本地資料到 Sheets"}
                </button>
              </fetcher.Form>

              <fetcher.Form method="post">
                <input type="hidden" name="actionType" value="clearSheets" />
                <button
                  type="submit"
                  disabled={fetcher.state === "submitting"}
                  className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 disabled:opacity-50 text-white font-semibold py-3 px-6 rounded-lg shadow-md transition-all"
                  onClick={(e) => {
                    if (!confirm('確定要清空 Google Sheets 中的資料嗎？此操作無法復原。')) {
                      e.preventDefault();
                    }
                  }}
                >
                  清空 Sheets 資料
                </button>
              </fetcher.Form>
            </div>

            {/* Fetcher 結果顯示 */}
            {fetcher.data && (
              <div className={`p-4 rounded-lg ${
                fetcher.data.success 
                  ? 'bg-green-700 bg-opacity-50 border border-green-500 text-green-300'
                  : 'bg-red-700 bg-opacity-50 border border-red-500 text-red-300'
              }`}>
                <p>{fetcher.data.success ? fetcher.data.message : fetcher.data.error}</p>
              </div>
            )}

            {/* 最近的掃描記錄 */}
            {data.recentScans && data.recentScans.length > 0 && (
              <div className="bg-slate-700 rounded-lg p-6">
                <h3 className="text-xl font-semibold text-slate-200 mb-4">最近的掃描記錄</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-600">
                        <th className="text-left py-2 text-slate-300">掃描時間</th>
                        <th className="text-left py-2 text-slate-300">QR Code 內容</th>
                        <th className="text-left py-2 text-slate-300">狀態</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.recentScans.map((scan, index) => (
                        <tr key={index} className="border-b border-slate-600/50">
                          <td className="py-2 text-slate-400">{scan[0]}</td>
                          <td className="py-2 text-slate-300 font-mono text-xs">
                            {scan[1]?.substring(0, 20)}...
                          </td>
                          <td className="py-2">
                            <span className={`px-2 py-1 rounded-full text-xs ${
                              scan[2] === '有效' 
                                ? 'bg-green-600 text-green-200' 
                                : 'bg-red-600 text-red-200'
                            }`}>
                              {scan[2]}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="p-6 bg-red-700 bg-opacity-30 border border-red-500 rounded-lg text-center">
            <h2 className="text-2xl font-semibold text-red-300 mb-2">連接失敗</h2>
            <p className="text-red-200">{data.message}</p>
            {data.errorDetail && (
              <div className="mt-4 p-3 bg-slate-900 rounded-md text-left">
                <p className="text-sm text-red-300 font-semibold">錯誤詳細資訊：</p>
                <pre className="mt-1 text-xs text-red-200 overflow-x-auto">{data.errorDetail}</pre>
              </div>
            )}
          </div>
        )}

        <div className="mt-8 text-center space-x-4">
          <Link
            to="/generate"
            className="inline-block text-purple-400 hover:text-purple-300 hover:underline transition-colors"
          >
            前往生成 QR Code
          </Link>
          <span className="text-slate-600">|</span>
          <Link
            to="/scan"
            className="inline-block text-sky-400 hover:text-sky-300 hover:underline transition-colors"
          >
            前往掃描 QR Code
          </Link>
          <span className="text-slate-600">|</span>
          <Link
            to="/"
            className="inline-block text-emerald-400 hover:text-emerald-300 hover:underline transition-colors"
          >
            返回主頁
          </Link>
        </div>
      </div>
    </div>
  );
}