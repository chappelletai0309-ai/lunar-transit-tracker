import React, { useState, useEffect, useMemo } from 'react';
import { Moon, Sun, Star, Activity, Zap, RefreshCw, Calendar } from 'lucide-react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithCustomToken, signInAnonymously, onAuthStateChanged } from 'firebase/auth';

// Firebase 初始化 (改用 Vite 環境變數)
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

let app = null;
let auth = null;

if (firebaseConfig.apiKey) {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
}

// === 常數與人類圖資料 ===

// 你的原生閘門 (反映者，無預設通道)
const USER_GATES = [5, 6, 13, 14, 22, 26, 35, 39, 41, 43, 45, 47, 48, 49, 51, 53, 54, 56, 61];

// 你的出生個性月亮閘門
const NATAL_MOON_GATE = 6;

// 易經64卦對應黃道十二宮的順序 (起點: 水瓶座 41號閘門)
const GATES_SEQUENCE = [
  41, 19, 13, 49, 30, 55, 37, 63, 22, 36, 25, 17, 21, 51, 42, 3, 27, 24, 2, 23, 8, 20, 16, 35, 45, 12, 15, 52, 39, 53, 62, 56, 31, 33, 7, 4, 29, 59, 40, 64, 47, 6, 46, 18, 48, 57, 32, 50, 28, 44, 1, 43, 14, 34, 9, 5, 26, 11, 10, 58, 38, 54, 61, 60
];

// 36條通道與其連接的中心
const CHANNELS_DATA = [
  { id: '64-47', gates: [64, 47], centers: ['Head', 'Ajna'], name: '抽象', description: '將過去的經歷轉化為意義，腦中常有許多畫面，能在混亂的片段中梳理出人生的啟示。' },
  { id: '61-24', gates: [61, 24], centers: ['Head', 'Ajna'], name: '察覺', description: '熱衷探究未知的奧祕，腦中會不斷反覆思考同一個問題，直到突然獲得「頓悟」與靈感。' },
  { id: '63-4', gates: [63, 4], centers: ['Head', 'Ajna'], name: '邏輯', description: '天生帶著懷疑的眼光看待事物，擅長透過邏輯推演與批判，為未來的問題尋找明確的解答。' },
  { id: '17-62', gates: [17, 62], centers: ['Ajna', 'Throat'], name: '接受', description: '能將抽象的概念轉化為具體的細節與事實，具備優異的組織能力與清晰表達見解的口才。' },
  { id: '43-23', gates: [43, 23], centers: ['Ajna', 'Throat'], name: '架構', description: '常有「我知道了！」的突發奇想，能將顛覆性的獨特洞見化為語言，是天生的打破框架者。' },
  { id: '11-56', gates: [11, 56], centers: ['Ajna', 'Throat'], name: '好奇', description: '充滿好奇心，喜歡四處體驗人生，並將這些經歷轉化為精彩的故事來激發、娛樂他人。' },
  { id: '10-20', gates: [10, 20], centers: ['G', 'Throat'], name: '覺醒', description: '專注於當下的真實自我，不隨波逐流。透過自身的行動與存在，展現對生命純粹的愛與接納。' },
  { id: '7-31', gates: [7, 31], centers: ['G', 'Throat'], name: '阿爾法', description: '具備看見未來趨勢的眼光，能在被眾人推舉與邀請時，自然展現出帶領團隊走向未來的領導力。' },
  { id: '1-8', gates: [1, 8], centers: ['G', 'Throat'], name: '啟發', description: '不按牌理出牌的創意家，只要毫不掩飾地展現獨一無二的真實自我，就能深刻地啟發身邊的人。' },
  { id: '13-33', gates: [13, 33], centers: ['G', 'Throat'], name: '浪子', description: '天生是極佳的傾聽者，能聽見他人的秘密。在獨處沉澱後，能將這些經歷轉化為全人類的智慧。' },
  { id: '21-45', gates: [21, 45], centers: ['Heart', 'Throat'], name: '金錢', description: '擁有敏銳的商業嗅覺與物質掌控力，擅長透過分配資源與發號施令，為自己的部落帶來繁榮。' },
  { id: '12-22', gates: [12, 22], centers: ['Throat', 'SolarPlexus'], name: '開放', description: '充滿情緒感染力與個人魅力。在心情好的時候開口，能透過優雅的表達深深打動並影響人心。' },
  { id: '35-36', gates: [35, 36], centers: ['Throat', 'SolarPlexus'], name: '無常', description: '渴望體驗強烈的情緒與前所未有的人生經歷，常在情感的波谷與危機中學會放下並獲得智慧。' },
  { id: '16-48', gates: [16, 48], centers: ['Throat', 'Spleen'], name: '波長', description: '結合深度與技巧，對於有熱情的事物願意投入一萬小時的反覆練習，進而展現出驚人的大師級才華。' },
  { id: '20-57', gates: [20, 57], centers: ['Throat', 'Spleen'], name: '腦波', description: '擁有如雷達般敏銳的直覺與第六感，能即時察覺環境中的危機，並在當下迅速做出求生的應變。' },
  { id: '20-34', gates: [20, 34], centers: ['Throat', 'Sacral'], name: '魅力', description: '充滿純粹且源源不絕的動能，只要專注於自己真正熱愛且有回應的事物，就能散發強大且迷人的魅力。' },
  { id: '10-34', gates: [10, 34], centers: ['G', 'Sacral'], name: '探索', description: '擁有強大的信念與力量，即使別人不認同，也能堅持走在自己喜愛的道路上，活出自己的真理。' },
  { id: '25-51', gates: [25, 51], centers: ['G', 'Heart'], name: '發起', description: '具備強大的好勝心與勇氣，敢於躍入未知的領域，經常為自己與身邊的人帶來震撼與突破性的成長。' },
  { id: '15-5', gates: [15, 5], centers: ['G', 'Sacral'], name: '韻律', description: '能包容各種極端的作息與人事物，並在混亂中找到屬於自己的自然節奏，散發吸引萬物的磁性。' },
  { id: '2-14', gates: [2, 14], centers: ['G', 'Sacral'], name: '跳動', description: '蘊藏龐大的資源與金鑰匙，宛如人生的指北針，能為自己與他人指引出正確的發展方向與軌跡。' },
  { id: '46-29', gates: [46, 29], centers: ['G', 'Sacral'], name: '發現', description: '一旦對某件事「說好」，就會全心全意投入體驗，即使過程艱辛也會堅持到底，並從中獲得啟發。' },
  { id: '10-57', gates: [10, 57], centers: ['G', 'Spleen'], name: '完美形式', description: '極度敏感且直覺強烈，懂得在充滿挑戰的環境中保護自己，以優雅且安全的姿態展現生存的藝術。' },
  { id: '44-26', gates: [44, 26], centers: ['Heart', 'Spleen'], name: '臣服', description: '擅長包裝與傳遞訊息，能敏銳察覺他人的需求，具備卓越的銷售、說服與影響社群的本能。' },
  { id: '40-37', gates: [40, 37], centers: ['Heart', 'SolarPlexus'], name: '社群', description: '極度重視家族與部落的凝聚力，願意為了照顧自己人而辛勤付出，並透過約定來維持人際間的溫暖。' },
  { id: '34-57', gates: [34, 57], centers: ['Sacral', 'Spleen'], name: '力量', description: '將動物本能般的直覺與強大的動能結合，能在極短時間內對危機做出最正確的回應，展現強大求生力。' },
  { id: '27-50', gates: [27, 50], centers: ['Sacral', 'Spleen'], name: '保存', description: '天生的守護者，願意承擔照顧他人的責任，並傳承良好的價值觀，以維護整個社群的健康與福祉。' },
  { id: '59-6', gates: [59, 6], centers: ['Sacral', 'SolarPlexus'], name: '親密', description: '具有打破人際藩籬的強大穿透力與情緒張力，無論是建立親密關係或促成合作，都能產生深刻連結。' },
  { id: '42-53', gates: [42, 53], centers: ['Sacral', 'Root'], name: '成熟', description: '擁有強大的起步與收尾能量，專注於將事物從開始推動到結束，在完整經歷一個週期後獲得蛻變。' },
  { id: '3-60', gates: [3, 60], centers: ['Sacral', 'Root'], name: '突變', description: '在看似停滯與受限的環境中累積壓力，直到時機成熟時，能帶來顛覆傳統、跳躍式創新的強大力量。' },
  { id: '9-52', gates: [9, 52], centers: ['Sacral', 'Root'], name: '專心', description: '具備冷靜坐下來的強大定力，能將能量聚焦於最微小的細節上，為了長遠的目標進行深入的研究。' },
  { id: '18-58', gates: [18, 58], centers: ['Spleen', 'Root'], name: '批評', description: '懷抱對完美無瑕的渴望，能敏銳挑出事物中的瑕疵與問題，其出發點是為了推動社會與整體的進步。' },
  { id: '28-38', gates: [28, 38], centers: ['Spleen', 'Root'], name: '困頓掙扎', description: '天生的鬥士，即使面對重重阻礙也絕不輕易妥協，願意為了找到生命真正的意義與價值而奮戰到底。' },
  { id: '32-54', gates: [32, 54], centers: ['Spleen', 'Root'], name: '蛻變', description: '充滿世俗的野心與驅動力，渴望透過持續的努力獲得成功與認可，一步步向上爬升以提升社會地位。' },
  { id: '19-49', gates: [19, 49], centers: ['Root', 'SolarPlexus'], name: '綜合', description: '對資源分配極度敏感，在情感與原則的基礎上建立緊密的人際關係，若踩到其底線也會引發無情的革命。' },
  { id: '39-55', gates: [39, 55], centers: ['Root', 'SolarPlexus'], name: '情緒', description: '情緒起伏充滿戲劇性與張力，能透過言語或行為挑逗、激發他人，喚醒周遭最深層的情感與精神波動。' },
  { id: '41-30', gates: [41, 30], centers: ['Root', 'SolarPlexus'], name: '認可', description: '懷抱著對未知經驗的強烈渴望，在幻想、期待與情緒的翻騰中，點燃對生命的熱情與追尋。' }
];

const PLANET_NAMES = {
  Sun: '太陽', Earth: '地球', Moon: '月亮',
  NorthNode: '北交點', SouthNode: '南交點',
  Mercury: '水星', Venus: '金星', Mars: '火星',
};

const CENTER_NAMES = {
  Head: '頭腦中心', Ajna: '邏輯中心', Throat: '喉嚨中心',
  G: 'G中心', Heart: '意志力中心', SolarPlexus: '情緒中心',
  Spleen: '直覺中心', Sacral: '薦骨中心', Root: '根部中心'
};

// 指定星體顯示的順序
const PLANET_ORDER = [
  'Sun', 'Earth', 'Moon', 'NorthNode', 'SouthNode',
  'Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn',
  'Uranus', 'Neptune', 'Pluto'
];

const MOTORS = ['Heart', 'Sacral', 'Root', 'SolarPlexus'];

const getRemainingTimeMsg = (untilDate, fromDate) => {
  const diffMs = untilDate.getTime() - fromDate.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  if (diffHours < 24) {
    if (diffHours <= 0) return '即將結束';
    return `大約還有 ${diffHours} 小時`;
  }
  const diffDays = Math.floor(diffHours / 24);
  return `大約還有 ${diffDays} 天`;
};

export default function App() {
  const [engineLoaded, setEngineLoaded] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [transits, setTransits] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);
  const [user, setUser] = useState(null);

  // 0. 初始化 Firebase 登入
  useEffect(() => {
    if (!auth) {
      console.warn("Firebase config or apiKey not found. Skipping authentication.");
      return;
    }

    const initAuth = async () => {
      try {
        if (import.meta.env.VITE_INITIAL_AUTH_TOKEN) {
          await signInWithCustomToken(auth, import.meta.env.VITE_INITIAL_AUTH_TOKEN);
        } else {
          await signInAnonymously(auth);
        }
      } catch (error) {
        console.error("Firebase auth error:", error);
      }
    };
    initAuth();
    const unsubscribe = onAuthStateChanged(auth, setUser);
    return () => unsubscribe();
  }, []);

  // 1. 動態載入天文計算引擎 (Astronomy Engine)
  useEffect(() => {
    if (window.Astronomy) {
      setEngineLoaded(true);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/astronomy-engine@2.1.19/astronomy.browser.min.js';
    script.async = true;
    script.onload = () => setEngineLoaded(true);
    script.onerror = () => setErrorMsg('無法載入天文計算套件，請檢查網路連線。');
    document.body.appendChild(script);
  }, []);

  // 2. 設定時鐘，每分鐘更新一次時間
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  // 3. 計算當下所有行星的閘門與爻
  useEffect(() => {
    if (!engineLoaded || !window.Astronomy) return;

    try {
      const calculateGate = (lon) => {
        if (typeof lon !== 'number' || isNaN(lon)) return { gate: 0, line: 0, gateIndex: 0 };
        // 閘門41的起點大約在水瓶座 2度 (黃經 301.875度)
        const offset = 301.875;
        let shiftedLon = lon - offset;
        if (shiftedLon < 0) shiftedLon += 360;

        const gateWidth = 360 / 64; // 5.625度
        let gateIndex = Math.floor(shiftedLon / gateWidth);
        if (gateIndex >= 64) gateIndex = 63; // 防呆設計

        const gate = GATES_SEQUENCE[gateIndex];
        const line = Math.floor((shiftedLon % gateWidth) / (gateWidth / 6)) + 1;
        return { gate, line, gateIndex };
      };

      const getPlanetLon = (p, t) => {
        if (p === 'NorthNode' || p === 'SouthNode') {
          const T = t.tt / 36525.0;
          let omega = 125.04452 - 1934.136261 * T;
          omega = omega % 360;
          if (omega < 0) omega += 360;
          return p === 'NorthNode' ? omega : (omega + 180) % 360;
        } else if (p === 'Earth') {
          const geo = window.Astronomy.GeoVector('Sun', t, true);
          const ecliptic = window.Astronomy.Ecliptic(geo);
          const sunLon = ecliptic.elon !== undefined ? ecliptic.elon : ecliptic.lon;
          return (sunLon + 180) % 360;
        } else {
          const geo = window.Astronomy.GeoVector(p, t, true);
          const ecliptic = window.Astronomy.Ecliptic(geo);
          return ecliptic.elon !== undefined ? ecliptic.elon : ecliptic.lon;
        }
      };

      const time = new window.Astronomy.AstroTime(currentTime);
      const planetsList = ['Sun', 'Earth', 'Moon', 'Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn', 'Uranus', 'Neptune', 'Pluto', 'NorthNode', 'SouthNode'];

      const currentTransits = {};

      planetsList.forEach(p => {
        const currentLon = getPlanetLon(p, time);
        const gateData = calculateGate(currentLon);

        let stepHours = 24;
        if (p === 'Moon') stepHours = 1;
        else if (['Sun', 'Earth', 'Mercury', 'Venus'].includes(p)) stepHours = 6;
        else if (p === 'Mars') stepHours = 12;

        let searchTime = new Date(currentTime);
        let leaveTime = null;
        for (let i = 0; i < 3000; i++) {
          searchTime.setHours(searchTime.getHours() + stepHours);
          const fTime = new window.Astronomy.AstroTime(searchTime);
          const fLon = getPlanetLon(p, fTime);
          const fGate = calculateGate(fLon);
          if (fGate.gateIndex !== gateData.gateIndex) {
            leaveTime = new Date(searchTime);
            break;
          }
        }

        currentTransits[p] = { ...gateData, leaveTime, planet: p };
      });

      setTransits(currentTransits);
      setErrorMsg(null);
    } catch (err) {
      console.error("星象計算錯誤:", err);
      setErrorMsg('計算閘門位置時發生錯誤，請稍後再試。');
    }
  }, [currentTime, engineLoaded]);

  // 4. 計算接通的通道與人類圖類型
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

    // 結合你的原生閘門與流日閘門
    const allActiveGates = new Set([...USER_GATES, ...transitGates]);

    // 找出接通的通道
    const activeChannels = [];
    const definedCentersSet = new Set();

    const getGateMaxTime = (planetsData) => {
      if (!planetsData || planetsData.length === 0) return null;
      return new Date(Math.max(...planetsData.map(p => p.leaveTime.getTime())));
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
          activeUntil = new Date(Math.min(t1.getTime(), t2.getTime()));

          const p1Names = gate1Planets.map(p => PLANET_NAMES[p.planet]).join('、');
          const p2Names = gate2Planets.map(p => PLANET_NAMES[p.planet]).join('、');
          activePlanetsMsg = `由 ${p1Names} (閘門 ${channel.gates[0]}) 與 ${p2Names} (閘門 ${channel.gates[1]}) 接通`;
        } else {
          source = '流日與原生接合 (Bridge)';
          if (hasGate1Transit && !hasGate1User) {
            activeUntil = getGateMaxTime(gate1Planets);
            const p1Names = gate1Planets.map(p => PLANET_NAMES[p.planet]).join('、');
            activePlanetsMsg = `由 ${p1Names} 接通閘門 ${channel.gates[0]}`;
          } else if (hasGate2Transit && !hasGate2User) {
            activeUntil = getGateMaxTime(gate2Planets);
            const p2Names = gate2Planets.map(p => PLANET_NAMES[p.planet]).join('、');
            activePlanetsMsg = `由 ${p2Names} 接通閘門 ${channel.gates[1]}`;
          }
        }

        activeChannels.push({
          ...channel,
          source,
          activeUntil,
          activePlanetsMsg
        });
        definedCentersSet.add(channel.centers[0]);
        definedCentersSet.add(channel.centers[1]);
      }
    });

    // 判斷類型演算法
    const hasCenter = (c) => definedCentersSet.has(c);
    let motorToThroat = false;

    // 用圖論 BFS 尋找動力中心是否連接喉嚨
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

    // 針對月亮的特別報告
    const moonData = transits['Moon'];
    const moonGate = moonData.gate;
    const moonChannels = activeChannels.filter(ch => ch.gates.includes(moonGate));

    // 計算下一個月亮閘門
    const nextMoonGate = GATES_SEQUENCE[(moonData.gateIndex + 1) % 64];

    // 預測流日接通
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

    return { activeChannels, currentType, typeDescription, moonGate, moonChannels, nextMoonGate, nextMoonChannels, definedCenters: Array.from(definedCentersSet) };
  }, [transits]);

  // 5. 計算下一次月亮回歸日
  const nextLunarReturn = useMemo(() => {
    if (!engineLoaded || !window.Astronomy) return null;
    let searchTime = new Date(currentTime);
    for (let i = 0; i < 30 * 4; i++) {
      searchTime.setHours(searchTime.getHours() + 6);
      const time = new window.Astronomy.AstroTime(searchTime);
      const geo = window.Astronomy.GeoVector('Moon', time, true);
      const ecliptic = window.Astronomy.Ecliptic(geo);
      const lon = ecliptic.elon !== undefined ? ecliptic.elon : ecliptic.lon;

      const offset = 301.875;
      let shiftedLon = lon - offset;
      if (shiftedLon < 0) shiftedLon += 360;
      let gateIndex = Math.floor(shiftedLon / (360 / 64));
      if (gateIndex >= 64) gateIndex = 63;

      if (GATES_SEQUENCE[gateIndex] === NATAL_MOON_GATE) {
        return searchTime;
      }
    }
    return null;
  }, [currentTime, engineLoaded]);


  if (errorMsg) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-950 text-red-400 p-6 text-center">
        <p className="text-xl mb-2 font-bold">出錯了 😢</p>
        <p>{errorMsg}</p>
      </div>
    );
  }

  if (!engineLoaded || !transits || !analysis) {
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

        <div className="grid md:grid-cols-2 gap-6">
          {/* 當前類型狀態區 */}
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
                <div className="flex flex-wrap gap-2">
                  {analysis.definedCenters.map(center => (
                    <span key={center} className="px-3 py-1 bg-yellow-900/40 text-yellow-200 border border-yellow-700/50 rounded-full text-sm">
                      {CENTER_NAMES[center]}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-slate-500 text-sm italic">沒有中心被點亮，維持完全開放的狀態。</p>
              )}
            </div>
          </section>

          {/* 接通的通道列表 */}
          <section className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
            <h2 className="text-xl font-semibold mb-4 text-emerald-300">
              目前開啟的通道 ({analysis.activeChannels.length})
            </h2>

            {analysis.activeChannels.length === 0 ? (
              <p className="text-slate-400 italic mt-4">
                此時此刻天上沒有星體為你接通任何通道，你處於最純粹的「反映者」狀態，感受並放大周遭的環境吧！
              </p>
            ) : (
              <ul className="space-y-4">
                {analysis.activeChannels.map(ch => (
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
        </div>

        {/* 所有星體流日閘門一覽 */}
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
                  <span className="text-sm text-slate-400 mb-1">{PLANET_NAMES[planet]}</span>
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

      </div>
    </div>
  );
}
