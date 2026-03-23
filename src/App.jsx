import React from 'react';
import { RefreshCw } from 'lucide-react';
import { useAuth } from './hooks/useAuth';
import { useTransits } from './hooks/useTransits';
import MoonSection from './components/MoonSection';
import TypeSection from './components/TypeSection';
import ChannelList from './components/ChannelList';
import PlanetGrid from './components/PlanetGrid';

export default function App() {
  useAuth();
  const { currentTime, transits, analysis, nextLunarReturn, errorMsg } = useTransits();

  if (errorMsg) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-950 text-red-400 p-6 text-center">
        <p className="text-xl mb-2 font-bold">出錯了 😢</p>
        <p>{errorMsg}</p>
      </div>
    );
  }

  if (!transits || !analysis) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-950 text-slate-200">
        <RefreshCw className="w-8 h-8 animate-spin text-purple-500 mb-4" />
        <p>正在校準星空數據與你的圖表...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-8 font-sans">
      <div className="max-w-4xl mx-auto space-y-6">

        {/* Header */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-slate-800 pb-4">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-indigo-400 bg-clip-text text-transparent">
              人類圖流日追蹤
            </h1>
            <p className="text-slate-400 mt-1">專屬反映者即時能量氣象台</p>
          </div>
          <div className="mt-4 md:mt-0 text-right">
            <p className="text-sm text-slate-400">目前時間</p>
            <p className="font-mono text-lg text-slate-200">
              {currentTime.toLocaleString('zh-TW', { hour12: false })}
            </p>
          </div>
        </header>

        {/* 月亮特寫區 */}
        <MoonSection transits={transits} analysis={analysis} nextLunarReturn={nextLunarReturn} />

        <div className="grid md:grid-cols-2 gap-6">
          {/* 當前類型狀態區 */}
          <TypeSection analysis={analysis} />

          {/* 接通的通道列表 */}
          <ChannelList activeChannels={analysis.activeChannels} currentTime={currentTime} />
        </div>

        {/* 所有星體流日閘門一覽 */}
        <PlanetGrid transits={transits} />

      </div>
    </div>
  );
}
