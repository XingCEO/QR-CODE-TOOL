// app/routes/test-db.tsx
import type { MetaFunction, LoaderFunctionArgs } from "@remix-run/node";
import { json, Link, useLoaderData } from "@remix-run/react";
import { pool } from "~/db.server";

export const meta: MetaFunction = () => {
  return [
    { title: "資料庫連線測試 - QR Code 工具" },
    { name: "description", content: "測試與 PostgreSQL 資料庫的連線狀態" },
  ];
};

interface LoaderData {
  status: "success" | "error";
  message: string;
  dbTime?: string;
  errorDetail?: string;
  recordCount?: number;
}

export async function loader({ request }: LoaderFunctionArgs): Promise<Response> {
  console.log('[DB TEST LOADER] Attempting to connect to the database...');
  try {
    if (!pool) {
      console.error('[DB TEST LOADER] Database pool is not initialized');
      return json({
        status: "error",
        message: "資料庫連接池未初始化。",
        errorDetail: "The database pool (pool) is undefined. Check db.server.ts.",
      } as LoaderData, { status: 500 });
    }

    const client = await pool.connect();
    console.log('[DB TEST LOADER] Successfully connected to the database client.');
    try {
      // 測試基本連接
      const result = await client.query("SELECT NOW() as current_time");
      const dbTime = result.rows[0]?.current_time;
      console.log('[DB TEST LOADER] Query successful. DB time:', dbTime);
      
      // 檢查 scanned_data 表並取得記錄數
      let recordCount = 0;
      try {
        const countResult = await client.query('SELECT COUNT(*) FROM scanned_data');
        recordCount = parseInt(countResult.rows[0].count, 10);
        console.log('[DB TEST LOADER] Found', recordCount, 'records in scanned_data table');
      } catch (tableError) {
        console.log('[DB TEST LOADER] scanned_data table may not exist yet');
      }
      
      return json({
        status: "success",
        message: "成功連接到資料庫！",
        dbTime: dbTime ? new Date(dbTime).toLocaleString('zh-TW', { timeZone: 'Asia/Taipei' }) : "無法取得時間",
        recordCount,
      } as LoaderData);
    } catch (queryError: any) {
      console.error('[DB TEST LOADER] Database query error:', queryError.message);
      return json({
        status: "error",
        message: "資料庫查詢失敗。",
        errorDetail: queryError.message,
      } as LoaderData, { status: 500 });
    } finally {
      client.release();
      console.log('[DB TEST LOADER] Database client released.');
    }
  } catch (connectionError: any) {
    console.error('[DB TEST LOADER] Database connection error:', connectionError.message);
    let errorDetail = connectionError.message;
    if (connectionError.code) {
      errorDetail += ` (Code: ${connectionError.code})`;
    }
    
    // 檢查是否為常見的連線問題並提供建議
    if (connectionError.message.includes('ENOTFOUND')) {
      errorDetail += ' 請檢查 DATABASE_URL 中的主機名稱是否正確。';
    }
    if (connectionError.message.includes('timeout')) {
      errorDetail += ' 連線超時，請檢查網路連線或資料庫伺服器狀態。';
    }
    if (connectionError.message.includes('authentication failed')) {
      errorDetail += ' 認證失敗，請檢查用戶名稱和密碼是否正確。';
    }
    if (connectionError.message.includes('SSL')) {
      errorDetail += ' SSL 連線問題，請確認 SSL 設定是否正確。';
    }

    return json({
      status: "error",
      message: "無法連接到資料庫。",
      errorDetail: errorDetail,
    } as LoaderData, { status: 500 });
  }
}

export default function TestDbPage() {
  const data = useLoaderData<LoaderData>();

  return (
    <div className="flex flex-col min-h-screen items-center justify-center bg-gradient-to-br from-slate-900 to-slate-700 text-gray-100 p-6 font-sans">
      <div className="bg-slate-800 p-8 rounded-xl shadow-2xl w-full max-w-md">
        <header className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-400 mb-2">
            資料庫連線測試
          </h1>
          <p className="text-slate-400">
            此頁面用於測試與 PostgreSQL 資料庫的連線。
          </p>
        </header>

        <div className="space-y-4">
          {data.status === "success" ? (
            <div className="p-6 bg-green-700 bg-opacity-30 border border-green-500 rounded-lg text-center">
              <div className="flex items-center justify-center mb-3">
                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-400">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                  <path d="m9 11 3 3L22 4"/>
                </svg>
              </div>
              <h2 className="text-2xl font-semibold text-green-300 mb-2">連線成功！</h2>
              <p className="text-green-200">{data.message}</p>
              {data.dbTime && (
                <p className="text-green-200 mt-2">
                  資料庫目前時間： <span className="font-semibold text-green-100">{data.dbTime}</span>
                </p>
              )}
              {typeof data.recordCount === 'number' && (
                <p className="text-green-200 mt-2">
                  scanned_data 表記錄數： <span className="font-semibold text-green-100">{data.recordCount}</span>
                </p>
              )}
            </div>
          ) : (
            <div className="p-6 bg-red-700 bg-opacity-30 border border-red-500 rounded-lg text-center">
              <div className="flex items-center justify-center mb-3">
                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-400">
                  <circle cx="12" cy="12" r="10"/>
                  <path d="M15 9l-6 6"/>
                  <path d="M9 9l6 6"/>
                </svg>
              </div>
              <h2 className="text-2xl font-semibold text-red-300 mb-2">連線失敗</h2>
              <p className="text-red-200">{data.message}</p>
              {data.errorDetail && (
                <div className="mt-3 pt-3 border-t border-red-600 text-left">
                  <p className="text-sm text-red-300 font-semibold">錯誤詳細資訊：</p>
                  <pre className="mt-1 p-2 bg-slate-900 rounded-md text-xs text-red-200 overflow-x-auto">
                    {data.errorDetail}
                  </pre>
                </div>
              )}
              <div className="mt-4 text-xs text-slate-400 text-left">
                <p className="font-semibold">提示：</p>
                <ul className="list-disc list-inside pl-2 space-y-1">
                  <li>請檢查您的 <code className="bg-slate-700 px-1 rounded">.env</code> 檔案中的 <code className="bg-slate-700 px-1 rounded">DATABASE_URL</code> 是否正確設定。</li>
                  <li>對於遠端資料庫，連線字串通常需要包含 <code className="bg-slate-700 px-1 rounded">sslmode=require</code>。</li>
                  <li>確認您的資料庫伺服器是否正在運行並接受連線。</li>
                  <li>檢查 <code className="bg-slate-700 px-1 rounded">db.server.ts</code> 中的 SSL 設定。</li>
                </ul>
              </div>
            </div>
          )}
        </div>

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
      <footer className="mt-12 text-center text-slate-500 text-sm">
        <p>QR Code 多功能工具 - 資料庫連線測試</p>
      </footer>
    </div>
  );
}