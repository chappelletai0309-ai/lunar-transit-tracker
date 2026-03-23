import * as Astronomy from 'astronomy-engine';
import { GATES_SEQUENCE } from '../constants';

/**
 * 計算黃經對應的閘門與爻
 * @param {number} lon - 黃經度數
 * @returns {{ gate: number, line: number, gateIndex: number }}
 */
export function calculateGate(lon) {
  if (typeof lon !== 'number' || isNaN(lon)) return { gate: 0, line: 0, gateIndex: 0 };
  // 閘門41的起點大約在水瓶座 2度 (黃經 301.875度)
  const offset = 301.875;
  let shiftedLon = lon - offset;
  if (shiftedLon < 0) shiftedLon += 360;

  const gateWidth = 360 / 64; // 5.625度
  let gateIndex = Math.floor(shiftedLon / gateWidth);
  if (gateIndex >= 64) gateIndex = 63;

  const gate = GATES_SEQUENCE[gateIndex];
  const line = Math.floor((shiftedLon % gateWidth) / (gateWidth / 6)) + 1;
  return { gate, line, gateIndex };
}

/**
 * 取得指定行星在給定時間的黃經
 * @param {string} planet - 行星名稱
 * @param {Astronomy.AstroTime} time - AstroTime 物件
 * @returns {number} 黃經度數
 */
export function getPlanetLon(planet, time) {
  if (planet === 'NorthNode' || planet === 'SouthNode') {
    const T = time.tt / 36525.0;
    let omega = 125.04452 - 1934.136261 * T;
    omega = omega % 360;
    if (omega < 0) omega += 360;
    return planet === 'NorthNode' ? omega : (omega + 180) % 360;
  } else if (planet === 'Earth') {
    const geo = Astronomy.GeoVector('Sun', time, true);
    const ecliptic = Astronomy.Ecliptic(geo);
    const sunLon = ecliptic.elon !== undefined ? ecliptic.elon : ecliptic.lon;
    return (sunLon + 180) % 360;
  } else {
    const geo = Astronomy.GeoVector(planet, time, true);
    const ecliptic = Astronomy.Ecliptic(geo);
    return ecliptic.elon !== undefined ? ecliptic.elon : ecliptic.lon;
  }
}

/**
 * 搜尋行星離開目前閘門的時間（使用二分搜尋）
 * @param {string} planet - 行星名稱
 * @param {number} currentGateIndex - 目前所在閘門的序號
 * @param {Date} fromDate - 起始時間
 * @returns {Date|null} 離開時間，若超過搜尋範圍則回傳 null
 */
export function findGateLeaveTime(planet, currentGateIndex, fromDate) {
  // 根據行星速度決定搜尋步長（小時）
  let stepHours;
  if (planet === 'Moon') stepHours = 1;
  else if (['Sun', 'Earth', 'Mercury', 'Venus'].includes(planet)) stepHours = 6;
  else if (planet === 'Mars') stepHours = 12;
  else stepHours = 24;

  // 最大搜尋天數限制
  const maxDays = planet === 'Moon' ? 5 : ['Sun', 'Earth'].includes(planet) ? 30 : 365;
  const maxSteps = Math.ceil((maxDays * 24) / stepHours);

  // Phase 1: 線性搜尋找到第一個離開閘門的粗略時間點
  let prevTime = fromDate.getTime();
  for (let i = 0; i < maxSteps; i++) {
    const nextMs = prevTime + stepHours * 3600000;
    const fTime = new Astronomy.AstroTime(new Date(nextMs));
    const fLon = getPlanetLon(planet, fTime);
    const fGate = calculateGate(fLon);
    if (fGate.gateIndex !== currentGateIndex) {
      // Phase 2: 二分搜尋精確找到邊界（精度約 1 分鐘）
      let lo = prevTime;
      let hi = nextMs;
      while (hi - lo > 60000) { // 1 分鐘精度
        const mid = Math.floor((lo + hi) / 2);
        const midTime = new Astronomy.AstroTime(new Date(mid));
        const midLon = getPlanetLon(planet, midTime);
        const midGate = calculateGate(midLon);
        if (midGate.gateIndex === currentGateIndex) {
          lo = mid;
        } else {
          hi = mid;
        }
      }
      return new Date(hi);
    }
    prevTime = nextMs;
  }
  return null;
}

/**
 * 格式化剩餘時間訊息
 */
export function getRemainingTimeMsg(untilDate, fromDate) {
  if (!untilDate) return '持續中';
  const diffMs = untilDate.getTime() - fromDate.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  if (diffHours < 24) {
    if (diffHours <= 0) return '即將結束';
    return `大約還有 ${diffHours} 小時`;
  }
  const diffDays = Math.floor(diffHours / 24);
  return `大約還有 ${diffDays} 天`;
}

/**
 * 計算下一次月亮回歸日
 * @param {number} natalMoonGate - 出生月亮閘門
 * @param {Date} fromDate - 起始搜尋時間
 * @returns {Date|null}
 */
export function findNextLunarReturn(natalMoonGate, fromDate) {
  // 月亮回歸約 28 天，搜尋 30 天，每 6 小時一步
  for (let i = 0; i < 120; i++) {
    const searchMs = fromDate.getTime() + (i + 1) * 6 * 3600000;
    const searchDate = new Date(searchMs);
    const time = new Astronomy.AstroTime(searchDate);
    const geo = Astronomy.GeoVector('Moon', time, true);
    const ecliptic = Astronomy.Ecliptic(geo);
    const lon = ecliptic.elon !== undefined ? ecliptic.elon : ecliptic.lon;

    const gateData = calculateGate(lon);
    if (gateData.gate === natalMoonGate) {
      return searchDate;
    }
  }
  return null;
}
