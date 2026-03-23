import React from 'react';
import { Activity } from 'lucide-react';
import { getRemainingTimeMsg } from '../utils/astronomy';

export default function ChannelList({ activeChannels, currentTime }) {
  return (
    <section className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
      <h2 className="text-xl font-semibold mb-4 text-emerald-300">
        目前開啟的通道 ({activeChannels.length})
      </h2>

      {activeChannels.length === 0 ? (
        <p className="text-slate-400 italic mt-4">
          此時此刻天上沒有星體為你接通任何通道，你處於最純粹的「反映者」狀態，感受並放大周遭的環境吧！
        </p>
      ) : (
        <ul className="space-y-4">
          {activeChannels.map(ch => (
            <li key={ch.id} className="bg-slate-800/40 border border-slate-700/80 rounded-xl p-4 flex flex-col gap-2 hover:bg-slate-800/80 transition-colors">
              <div className="flex justify-between items-start">
                <div>
                  <span className="font-bold text-lg text-emerald-100">{ch.id} {ch.name}通道</span>
                  <p className="text-xs text-slate-400 mt-1">{ch.source}</p>

                  {ch.activePlanetsMsg && (
                    <div className="mt-2 space-y-1">
                      <p className="text-sm text-yellow-300 flex items-center gap-1.5">
                        <span className="text-yellow-400">✨</span> {ch.activePlanetsMsg}
                      </p>
                      {ch.activeUntil && (
                        <p className="text-sm text-slate-300 flex items-center gap-1.5">
                          <span className="text-slate-400">⏳</span> 預計維持至：{ch.activeUntil.toLocaleString('zh-TW', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })} ({getRemainingTimeMsg(ch.activeUntil, currentTime)})
                        </p>
                      )}
                    </div>
                  )}
                </div>
                <Activity className="w-5 h-5 text-emerald-500/40 shrink-0" />
              </div>
              <div className="mt-2 pt-2 border-t border-slate-700/50">
                <p className="text-sm text-slate-300 leading-relaxed">
                  {ch.description}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
