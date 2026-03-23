import React from 'react';
import { Star } from 'lucide-react';
import { PLANET_ORDER, PLANET_NAMES } from '../constants';

export default function PlanetGrid({ transits }) {
  return (
    <section className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6">
      <h2 className="text-lg font-semibold flex items-center gap-2 mb-6 text-slate-300">
        <Star className="w-4 h-4" /> 各大星體目前位置
      </h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
        {PLANET_ORDER.map(planet => {
          const data = transits[planet];
          if (!data) return null;

          const isMoon = planet === 'Moon';
          const isSun = planet === 'Sun';
          const isNode = planet === 'NorthNode' || planet === 'SouthNode';

          return (
            <div key={planet}
              className={`flex flex-col p-3 rounded-lg border ${isMoon ? 'bg-purple-900/20 border-purple-500/50' :
                isSun ? 'bg-yellow-900/10 border-yellow-500/30' :
                  isNode ? 'bg-indigo-900/20 border-indigo-500/40' :
                    'bg-slate-800/30 border-slate-700/50'
                }`}
            >
              <span className="text-sm text-slate-400 mb-1">{PLANET_NAMES[planet] || planet}</span>
              <span className={`font-mono font-bold text-lg ${isMoon ? 'text-purple-300' :
                isSun ? 'text-yellow-300' :
                  isNode ? 'text-indigo-300' :
                    'text-slate-200'
                }`}>
                {data.gate}.{data.line}
              </span>
            </div>
          );
        })}
      </div>
    </section>
  );
}
