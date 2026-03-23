import React from 'react';
import { Moon, Zap, Calendar } from 'lucide-react';
import { NATAL_MOON_GATE } from '../constants';

export default function MoonSection({ transits, analysis, nextLunarReturn }) {
  return (
    <section className="bg-slate-900 border border-slate-700/50 rounded-2xl p-6 relative overflow-hidden shadow-lg shadow-purple-900/10">
      <div className="absolute top-0 right-0 p-8 opacity-10">
        <Moon className="w-48 h-48" />
      </div>

      <div className="relative z-10">
        <h2 className="text-xl font-semibold flex items-center gap-2 mb-4 text-purple-300">
          <Moon className="w-5 h-5" /> 如今的月亮
        </h2>
        <div className="flex items-baseline gap-4 mb-4">
          <span className="text-5xl font-bold text-white">
            閘門 {transits['Moon'].gate}.{transits['Moon'].line}
          </span>
        </div>

        {analysis.moonChannels.length > 0 ? (
          <div className="bg-purple-900/30 border border-purple-500/30 rounded-xl p-4 mt-4 mb-4">
            <p className="text-purple-200 font-medium flex items-center gap-2 mb-2">
              <Zap className="w-4 h-4 text-yellow-400" /> 月亮為你開啟了通道！
            </p>
            <ul className="space-y-2">
              {analysis.moonChannels.map(ch => (
                <li key={ch.id} className="text-lg">
                  {ch.id} <span className="font-bold text-white">「{ch.name}通道」</span>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <p className="text-slate-400 mt-2 mb-4">
            目前的月亮落在閘門 {transits['Moon'].gate}。它沒有與你的原生閘門接通形成任何通道，能量場維持開放反映的狀態。
          </p>
        )}

        {/* 下一個月亮閘門預告區 */}
        <div className="mt-6 border-t border-slate-700/50 pt-5">
          <p className="text-sm text-slate-400 mb-3 flex items-center gap-2">
            🔜 下一次月亮開啟的閘門預告
          </p>
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <span className="text-xl font-bold text-slate-300">
              進入 閘門 {analysis.nextMoonGate}
            </span>

            {analysis.nextMoonChannels.length > 0 ? (
              <span className="text-sm bg-indigo-900/60 text-indigo-200 px-3 py-1.5 rounded-lg border border-indigo-700 shadow-sm">
                預計接通：{analysis.nextMoonChannels.map(c => `「${c.name}通道」`).join('、')}
              </span>
            ) : (
              <span className="text-sm bg-slate-800 text-slate-400 px-3 py-1.5 rounded-lg border border-slate-700">
                預期無新通道接通，維持開放
              </span>
            )}
          </div>
        </div>

        {/* 月亮回歸日預告 */}
        {nextLunarReturn && (
          <div className="mt-4 border-t border-slate-700/50 pt-5 flex items-center gap-3">
            <Calendar className="w-6 h-6 text-pink-400" />
            <div>
              <p className="text-sm text-slate-400">專屬你的微型生日・淨空與重置</p>
              <p className="text-lg font-bold text-pink-300">
                下一次月亮回歸日 (閘門 {NATAL_MOON_GATE})：{nextLunarReturn.toLocaleDateString('zh-TW', { month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
