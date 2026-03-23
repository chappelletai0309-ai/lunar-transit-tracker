import { useState, useEffect, useMemo, useRef } from 'react';
import * as Astronomy from 'astronomy-engine';
import { PLANETS_LIST, CHANNELS_DATA, USER_GATES, NATAL_MOON_GATE, GATES_SEQUENCE, PLANET_NAMES, MOTORS } from '../constants';
import { calculateGate, getPlanetLon, findGateLeaveTime, findNextLunarReturn } from '../utils/astronomy';

/**
 * 行星流日計算 Hook — 含快取機制
 *
 * 效能優化策略：
 * - 只有當行星的閘門序號 (gateIndex) 真的改變時，才重新計算該行星的離開時間
 * - 外行星（木星以外）閘門變化非常慢，快取大幅減少了不必要的計算
 * - 月亮回歸日只在閘門改變時重算
 */
export function useTransits() {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [transits, setTransits] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);

  // 快取：記錄上次計算時每顆行星的閘門序號與離開時間
  const leaveTimeCache = useRef({});

  // 每分鐘更新時間
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  // 計算行星流日
  useEffect(() => {
    try {
      const time = new Astronomy.AstroTime(currentTime);
      const currentTransits = {};

      PLANETS_LIST.forEach(planet => {
        const currentLon = getPlanetLon(planet, time);
        const gateData = calculateGate(currentLon);

        // 檢查快取：若閘門序號未改變，沿用上次的離開時間
        const cached = leaveTimeCache.current[planet];
        let leaveTime;
        if (cached && cached.gateIndex === gateData.gateIndex) {
          leaveTime = cached.leaveTime;
        } else {
          // 閘門改變了（或首次計算），重新搜尋離開時間
          leaveTime = findGateLeaveTime(planet, gateData.gateIndex, currentTime);
          leaveTimeCache.current[planet] = {
            gateIndex: gateData.gateIndex,
            leaveTime,
          };
        }

        currentTransits[planet] = { ...gateData, leaveTime, planet };
      });

      setTransits(currentTransits);
      setErrorMsg(null);
    } catch (err) {
      console.error("星象計算錯誤:", err);
      setErrorMsg('計算閘門位置時發生錯誤，請稍後再試。');
    }
  }, [currentTime]);

  // 計算分析結果
  const analysis = useMemo(() => {
    if (!transits) return null;

    // 收集所有流日閘門與觸發的星體
    const transitGateToPlanets = {};
    Object.values(transits).forEach(data => {
      if (!transitGateToPlanets[data.gate]) transitGateToPlanets[data.gate] = [];
      transitGateToPlanets[data.gate].push(data);
    });

    const transitGatesSet = new Set(Object.keys(transitGateToPlanets).map(Number));
    const transitGates = Array.from(transitGatesSet);

    // 結合原生閘門與流日閘門
    const allActiveGates = new Set([...USER_GATES, ...transitGates]);

    // 找出接通的通道
    const activeChannels = [];
    const definedCentersSet = new Set();

    const getGateMaxTime = (planetsData) => {
      if (!planetsData || planetsData.length === 0) return null;
      const validTimes = planetsData.filter(p => p.leaveTime != null);
      if (validTimes.length === 0) return null;
      return new Date(Math.max(...validTimes.map(p => p.leaveTime.getTime())));
    };

    CHANNELS_DATA.forEach(channel => {
      if (allActiveGates.has(channel.gates[0]) && allActiveGates.has(channel.gates[1])) {
        const hasGate1User = USER_GATES.includes(channel.gates[0]);
        const hasGate2User = USER_GATES.includes(channel.gates[1]);
        const gate1Planets = transitGateToPlanets[channel.gates[0]] || [];
        const gate2Planets = transitGateToPlanets[channel.gates[1]] || [];

        const hasGate1Transit = gate1Planets.length > 0;
        const hasGate2Transit = gate2Planets.length > 0;

        let source = '';
        let activeUntil = null;
        let activePlanetsMsg = '';

        if (hasGate1User && hasGate2User) {
          source = '原生通道 (Native)';
        } else if (hasGate1Transit && hasGate2Transit && !hasGate1User && !hasGate2User) {
          source = '純流日接通 (Transit)';
          const t1 = getGateMaxTime(gate1Planets);
          const t2 = getGateMaxTime(gate2Planets);
          if (t1 && t2) {
            activeUntil = new Date(Math.min(t1.getTime(), t2.getTime()));
          }
          const p1Names = gate1Planets.map(p => PLANET_NAMES[p.planet] || p.planet).join('、');
          const p2Names = gate2Planets.map(p => PLANET_NAMES[p.planet] || p.planet).join('、');
          activePlanetsMsg = `由 ${p1Names} (閘門 ${channel.gates[0]}) 與 ${p2Names} (閘門 ${channel.gates[1]}) 接通`;
        } else {
          source = '流日與原生接合 (Bridge)';
          if (hasGate1Transit && !hasGate1User) {
            activeUntil = getGateMaxTime(gate1Planets);
            const p1Names = gate1Planets.map(p => PLANET_NAMES[p.planet] || p.planet).join('、');
            activePlanetsMsg = `由 ${p1Names} 接通閘門 ${channel.gates[0]}`;
          } else if (hasGate2Transit && !hasGate2User) {
            activeUntil = getGateMaxTime(gate2Planets);
            const p2Names = gate2Planets.map(p => PLANET_NAMES[p.planet] || p.planet).join('、');
            activePlanetsMsg = `由 ${p2Names} 接通閘門 ${channel.gates[1]}`;
          }
        }

        activeChannels.push({ ...channel, source, activeUntil, activePlanetsMsg });
        definedCentersSet.add(channel.centers[0]);
        definedCentersSet.add(channel.centers[1]);
      }
    });

    // 判斷類型 (BFS)
    const hasCenter = (c) => definedCentersSet.has(c);
    let motorToThroat = false;

    if (hasCenter('Throat')) {
      const adj = {};
      activeChannels.forEach(ch => {
        const [c1, c2] = ch.centers;
        if (!adj[c1]) adj[c1] = [];
        if (!adj[c2]) adj[c2] = [];
        adj[c1].push(c2);
        adj[c2].push(c1);
      });

      const visited = new Set(['Throat']);
      const queue = ['Throat'];

      while (queue.length > 0) {
        const curr = queue.shift();
        if (MOTORS.includes(curr)) {
          motorToThroat = true;
          break;
        }
        if (adj[curr]) {
          adj[curr].forEach(neighbor => {
            if (!visited.has(neighbor)) {
              visited.add(neighbor);
              queue.push(neighbor);
            }
          });
        }
      }
    }

    let currentType = '純粹反映者 (Reflector)';
    let typeDescription = '✨ 今日能量外衣：純粹反映者。沒有任何中心被流日定義。這是你最原本、最敞開的狀態，盡情感受環境與他人的能量流動吧！';

    if (hasCenter('Sacral')) {
      if (motorToThroat) {
        currentType = '顯示生產者 (Manifesting Generator)';
        typeDescription = '✨ 今日能量外衣：顯示生產者。流日定義了你的薦骨，且動力直達喉嚨！你今天可能會感覺到滿滿的動能和想說話、想做事的衝動。好好享受這股創造力，但在一天結束時記得把能量放掉，好好休息。';
      } else {
        currentType = '生產者 (Generator)';
        typeDescription = '✨ 今日能量外衣：生產者。流日定義了你的薦骨中心！為你帶來暫時的持續生命力。去體驗回應的感覺，但別忘了這股能量不屬於你，睡前請務必淨空。';
      }
    } else if (definedCentersSet.size > 0) {
      if (motorToThroat) {
        currentType = '顯示者 (Manifestor)';
        typeDescription = '✨ 今日能量外衣：顯示者。流日接通了動力到喉嚨！你暫時擁有了發起的能力，體驗看看「告知後行動」的威力，但記得適時抽離休息。';
      } else {
        currentType = '投射者 (Projector)';
        typeDescription = '✨ 今日能量外衣：投射者。流日為你定義了中心。你暫時具備了引導他人的特定焦點。試著體驗「等待被邀請」的從容，觀察這件外衣帶來的銳利洞察力。';
      }
    }

    // 月亮分析
    const moonData = transits['Moon'];
    const moonGate = moonData.gate;
    const moonChannels = activeChannels.filter(ch => ch.gates.includes(moonGate));

    const nextMoonGate = GATES_SEQUENCE[(moonData.gateIndex + 1) % 64];

    const futureGatesSet = new Set(allActiveGates);
    futureGatesSet.delete(moonGate);
    futureGatesSet.add(nextMoonGate);

    const nextMoonChannels = [];
    CHANNELS_DATA.forEach(channel => {
      if (channel.gates.includes(nextMoonGate)) {
        const otherGate = channel.gates.find(g => g !== nextMoonGate);
        if (futureGatesSet.has(otherGate)) {
          nextMoonChannels.push(channel);
        }
      }
    });

    return {
      activeChannels, currentType, typeDescription,
      moonGate, moonChannels, nextMoonGate, nextMoonChannels,
      definedCenters: Array.from(definedCentersSet)
    };
  }, [transits]);

  // 月亮回歸日（使用快取，只在閘門改變時重算）
  const lunarReturnCache = useRef(null);
  const nextLunarReturn = useMemo(() => {
    // 若有快取且快取的時間尚未過去，直接回傳
    if (lunarReturnCache.current && lunarReturnCache.current.getTime() > currentTime.getTime()) {
      return lunarReturnCache.current;
    }
    const result = findNextLunarReturn(NATAL_MOON_GATE, currentTime);
    lunarReturnCache.current = result;
    return result;
  }, [currentTime]);

  return { currentTime, transits, analysis, nextLunarReturn, errorMsg };
}
