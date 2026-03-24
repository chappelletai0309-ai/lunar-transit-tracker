import { GoogleGenAI } from '@google/genai';
import { CENTER_NAMES } from '../constants';

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

let aiClient = null;

function getClient() {
  if (!aiClient && API_KEY) {
    aiClient = new GoogleGenAI({ apiKey: API_KEY });
  }
  return aiClient;
}

/**
 * 根據當前分析資料，組裝 prompt 並呼叫 Gemini API 取得人類圖建議
 */
export async function getHumanDesignAdvice(analysis) {
  const client = getClient();
  if (!client) {
    throw new Error('未設定 Gemini API Key，請在 .env 中加入 VITE_GEMINI_API_KEY');
  }

  const { currentType, definedCenters, activeChannels } = analysis;

  // 組裝開啟的中心資訊
  const centersInfo = definedCenters.length > 0
    ? definedCenters.map(c => `- ${CENTER_NAMES[c] || c}`).join('\n')
    : '（無中心被點亮，純粹反映者狀態）';

  // 組裝接通的通道資訊
  const channelsInfo = activeChannels.length > 0
    ? activeChannels.map(ch => {
        let detail = `- ${ch.id} ${ch.name}通道（${ch.source}）：${ch.description}`;
        if (ch.activePlanetsMsg) detail += `\n  觸發方式：${ch.activePlanetsMsg}`;
        return detail;
      }).join('\n')
    : '（無通道被接通）';

  const prompt = `你是一位專業的人類圖分析師，專門為「反映者」類型的人提供每日能量流日建議。

以下是這位反映者目前的流日能量狀態：

## 今日能量外衣類型
${currentType}

## 目前點亮的中心（共 ${definedCenters.length} 個）
${centersInfo}

## 目前接通的通道（共 ${activeChannels.length} 條）
${channelsInfo}

請根據以上資訊，提供一段約 200-350 字的個人化建議，包含：
1. 根據今天的能量外衣類型，這位反映者今天適合做什麼、注意什麼
2. 根據已開啟的中心組合，今天的能量特色與應對策略
3. 根據接通的通道，有什麼特殊的天賦或能量可以善加利用
4. 一句鼓勵性的結語

請用親切、溫暖且專業的中文撰寫，直接對這位反映者說話（使用「你」）。不需要重複列出中心和通道的名稱，直接給出綜合建議即可。使用 emoji 讓文字更生動。`;

  const response = await client.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: prompt,
  });

  return response.text;
}
