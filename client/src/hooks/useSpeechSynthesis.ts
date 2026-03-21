import { useState, useCallback, useRef, useEffect } from 'react';

interface UseSpeechSynthesisResult {
  speak: (text: string) => void;
  stop: () => void;
  isSpeaking: boolean;
  isSupported: boolean;
  voices: SpeechSynthesisVoice[];
  setVoice: (voice: SpeechSynthesisVoice) => void;
  selectedVoice: SpeechSynthesisVoice | null;
  setRate: (rate: number) => void;
  rate: number;
}

/**
 * 语音合成 Hook
 * 使用 Web Speech API 实现语音播报
 */
export const useSpeechSynthesis = (): UseSpeechSynthesisResult => {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<SpeechSynthesisVoice | null>(null);
  const [rate, setRate] = useState(0.9); // 稍慢一点更适合儿童
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  useEffect(() => {
    // 检查浏览器支持
    if ('speechSynthesis' in window) {
      setIsSupported(true);

      // 获取可用的语音列表
      const loadVoices = () => {
        const availableVoices = window.speechSynthesis.getVoices();
        setVoices(availableVoices);

        // 优先选择中文语音
        const chineseVoice = availableVoices.find(
          voice => voice.lang.includes('zh') || voice.lang.includes('CN')
        );
        if (chineseVoice) {
          setSelectedVoice(chineseVoice);
        } else if (availableVoices.length > 0) {
          setSelectedVoice(availableVoices[0]);
        }
      };

      // 某些浏览器需要等待 voiceschanged 事件
      loadVoices();
      window.speechSynthesis.onvoiceschanged = loadVoices;

      return () => {
        window.speechSynthesis.cancel();
      };
    }
  }, []);

  const speak = useCallback((text: string) => {
    if (!isSupported || !text) return;

    // 停止当前播放
    window.speechSynthesis.cancel();

    // 移除 emoji 和特殊字符，只保留文字
    const cleanText = text.replace(/[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]|[🎨🌈💕✨🦋💡⚠️❌]/gu, '').trim();

    if (!cleanText) return;

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = 'zh-CN';
    utterance.rate = rate;

    if (selectedVoice) {
      utterance.voice = selectedVoice;
    }

    utterance.onstart = () => {
      setIsSpeaking(true);
    };

    utterance.onend = () => {
      setIsSpeaking(false);
    };

    utterance.onerror = () => {
      setIsSpeaking(false);
    };

    utteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  }, [isSupported, rate, selectedVoice]);

  const stop = useCallback(() => {
    if (isSupported) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  }, [isSupported]);

  const handleSetVoice = useCallback((voice: SpeechSynthesisVoice) => {
    setSelectedVoice(voice);
  }, []);

  const handleSetRate = useCallback((newRate: number) => {
    setRate(newRate);
  }, []);

  return {
    speak,
    stop,
    isSpeaking,
    isSupported,
    voices,
    setVoice: handleSetVoice,
    selectedVoice,
    setRate: handleSetRate,
    rate,
  };
};

// 添加类型声明
declare global {
  interface Window {
    speechSynthesis: SpeechSynthesis;
    SpeechSynthesisUtterance: typeof SpeechSynthesisUtterance;
  }
}