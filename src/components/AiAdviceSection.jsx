import React from 'react';
import { Sparkles, RefreshCw, AlertCircle } from 'lucide-react';

export default function AiAdviceSection({ advice, loading, error, onRegenerate }) {
  return (
    <section className="bg-gradient-to-br from-purple-900/30 to-indigo-900/30 border border-purple-700/40 rounded-2xl p-6 relative overflow-hidden">
      {/* 裝飾背景光暈 */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />

      <div className="relative">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold flex items-center gap-2 text-purple-300">
            <Sparkles className="w-5 h-5" /> AI 能量建議
          </h2>
          {advice && !loading && (
            <button
              onClick={onRegenerate}
              className="flex items-center gap-1.5 text-sm text-purple-400 hover:text-purple-200 transition-colors bg-purple-900/40 hover:bg-purple-800/50 px-3 py-1.5 rounded-lg border border-purple-700/40"
            >
              <RefreshCw className="w-3.5 h-3.5" /> 重新生成
            </button>
          )}
        </div>

        {/* 載入中 — 骨架動畫 */}
        {loading && (
          <div className="space-y-3 animate-pulse">
            <div className="h-4 bg-purple-800/40 rounded-lg w-full" />
            <div className="h-4 bg-purple-800/40 rounded-lg w-11/12" />
            <div className="h-4 bg-purple-800/40 rounded-lg w-4/5" />
            <div className="h-4 bg-purple-800/40 rounded-lg w-full" />
            <div className="h-4 bg-purple-800/40 rounded-lg w-3/4" />
            <div className="h-4 bg-purple-800/40 rounded-lg w-5/6" />
          </div>
        )}

        {/* 錯誤訊息 */}
        {error && !loading && (
          <div className="bg-red-900/20 border border-red-700/40 rounded-xl p-4">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-red-300 text-sm">{error}</p>
                <button
                  onClick={onRegenerate}
                  className="mt-3 text-sm text-red-400 hover:text-red-200 transition-colors bg-red-900/30 hover:bg-red-800/40 px-3 py-1.5 rounded-lg border border-red-700/40"
                >
                  重試
                </button>
              </div>
            </div>
          </div>
        )}

        {/* AI 建議內容 */}
        {advice && !loading && !error && (
          <div className="text-slate-200 leading-relaxed text-[15px] whitespace-pre-wrap">
            {advice}
          </div>
        )}

        {/* 尚未獲取建議（無資料、無錯誤、不在載入中） */}
        {!advice && !loading && !error && (
          <div className="flex flex-col items-center justify-center py-6 text-center space-y-4">
            <button
              onClick={onRegenerate}
              className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white px-6 py-3 rounded-xl shadow-lg shadow-purple-900/50 transition-all font-medium border border-purple-400/30 w-full sm:w-auto justify-center"
            >
              <Sparkles className="w-5 h-5" />
              取得專屬 AI 能量建議
            </button>
            <p className="text-slate-400 text-sm">點擊按鈕，由 AI 為您解析當前能量場的互動狀態。</p>
          </div>
        )}
      </div>
    </section>
  );
}
