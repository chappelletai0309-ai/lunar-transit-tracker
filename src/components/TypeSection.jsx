import React from 'react';
import { Activity, Zap } from 'lucide-react';
import { CENTER_NAMES, CENTER_DESCRIPTIONS } from '../constants';

export default function TypeSection({ analysis }) {
  return (
    <section className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
      <h2 className="text-xl font-semibold flex items-center gap-2 mb-4 text-blue-300">
        <Activity className="w-5 h-5" /> 今日的能量外衣
      </h2>

      <div className="mb-4">
        <span className={`inline-block px-4 py-2 rounded-lg text-xl font-bold ${analysis.currentType.includes('反映者') ? 'bg-slate-800 text-slate-300' :
          'bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg shadow-blue-500/20'
          }`}>
          {analysis.currentType}
        </span>
      </div>

      <p className="text-slate-300 leading-relaxed text-lg mb-6">
        {analysis.typeDescription}
      </p>

      <div className="pt-4 border-t border-slate-700/50">
        <h3 className="text-sm font-semibold text-slate-400 mb-3 flex items-center gap-2">
          <Zap className="w-4 h-4 text-yellow-400" /> 目前點亮的中心
        </h3>
        {analysis.definedCenters && analysis.definedCenters.length > 0 ? (
          <div className="flex flex-col gap-2">
            {analysis.definedCenters.map(center => (
              <div key={center} className="bg-yellow-900/20 border border-yellow-700/40 rounded-lg px-3 py-2">
                <p className="text-yellow-300 font-semibold text-sm mb-0.5">{CENTER_NAMES[center]}</p>
                <p className="text-slate-300 text-xs leading-relaxed">{CENTER_DESCRIPTIONS[center]}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-slate-500 text-sm italic">沒有中心被點亮，維持完全開放的狀態。</p>
        )}
      </div>
    </section>
  );
}
