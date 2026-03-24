import { useState, useEffect, useRef, useCallback } from 'react';
import { getHumanDesignAdvice } from '../services/geminiService';

/**
 * AI 建議 Hook
 * 當 analysis 資料可用且組合改變時，自動呼叫 Gemini API 取得建議
 */
export function useAiAdvice(analysis) {
  const [advice, setAdvice] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const lastFingerprintRef = useRef(null);

  // 產生指紋：用來判斷 analysis 是否真的改變了
  const getFingerprint = (a) => {
    if (!a) return null;
    const centers = [...a.definedCenters].sort().join(',');
    const channels = a.activeChannels.map(ch => ch.id).sort().join(',');
    return `${a.currentType}|${centers}|${channels}`;
  };

  const fetchAdvice = useCallback(async (analysisData) => {
    setLoading(true);
    setError(null);
    try {
      const result = await getHumanDesignAdvice(analysisData);
      setAdvice(result);
    } catch (err) {
      console.error('AI 建議取得失敗:', err);
      setError(err.message || '無法取得 AI 建議，請稍後再試。');
    } finally {
      setLoading(false);
    }
  }, []);

  // 當 analysis 改變時，清除舊建議，等待使用者手動觸發
  useEffect(() => {
    if (!analysis) return;

    const fingerprint = getFingerprint(analysis);
    if (fingerprint === lastFingerprintRef.current) return;

    lastFingerprintRef.current = fingerprint;
    setAdvice(null);
    setError(null);
  }, [analysis]);

  // 手動重新生成
  const regenerate = useCallback(() => {
    if (analysis) {
      fetchAdvice(analysis);
    }
  }, [analysis, fetchAdvice]);

  return { advice, loading, error, regenerate };
}
