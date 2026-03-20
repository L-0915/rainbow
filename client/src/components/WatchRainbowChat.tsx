import { useState, useEffect, useCallback, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { sendChatMessage, getGreeting, type ChatMessage } from '@/services/rainbowChat';
import { useAchievementStore } from '@/store/appStore';
import { useSpeechRecognition } from '@/hooks/useSpeechRecognition';

interface WatchRainbowChatProps {
  isOpen: boolean;
  onClose: () => void;
}

// 预设话语（备用）
const DEFAULT_SUGGESTIONS = [
  '今天我很开心！',
  '我有点难过...',
  '想抱抱～',
  '小彩虹你好！',
];

export const WatchRainbowChat = memo(({ isOpen, onClose }: WatchRainbowChatProps) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentSuggestions, setCurrentSuggestions] = useState<string[]>(DEFAULT_SUGGESTIONS);
  const unlockAchievement = useAchievementStore((state) => state.unlockAchievement);

  // 语音识别
  const { isListening, transcript, isSupported, startListening, stopListening, resetTranscript } = useSpeechRecognition();

  // 监听语音识别结果
  useEffect(() => {
    if (transcript) {
      // 语音识别结束后自动发送
      if (!isListening && transcript) {
        const timer = setTimeout(() => {
          handleSendMessage(transcript);
        }, 600);
        return () => clearTimeout(timer);
      }
    }
  }, [isListening, transcript]);

  // 获取问候语
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setIsLoading(true);
      getGreeting().then((greeting) => {
        setMessages([{ role: 'assistant', content: greeting }]);
        setCurrentSuggestions(DEFAULT_SUGGESTIONS);
        setIsLoading(false);
      });
    }
  }, [isOpen]);

  // 解锁成就
  useEffect(() => {
    if (messages.length >= 2) {
      unlockAchievement('chat-star');
    }
  }, [messages.length, unlockAchievement]);

  // 发送消息
  const handleSendMessage = useCallback(async (text: string) => {
    if (!text.trim() || isLoading) return;

    const userMessage: ChatMessage = { role: 'user', content: text.trim() };
    setMessages((prev) => [...prev, userMessage]);
    resetTranscript();
    setIsLoading(true);

    try {
      const response = await sendChatMessage([...messages, userMessage]);
      if (response.success && response.content) {
        setMessages((prev) => [...prev, { role: 'assistant', content: response.content! }]);
        // 设置建议选项
        if (response.suggestions?.length) {
          setCurrentSuggestions(response.suggestions.slice(0, 3));
        } else {
          setCurrentSuggestions(DEFAULT_SUGGESTIONS);
        }
      }
    } catch {
      setMessages((prev) => [...prev, { role: 'assistant', content: '小彩虹没听清楚～能再说一次吗？💕' }]);
      setCurrentSuggestions(DEFAULT_SUGGESTIONS);
    } finally {
      setIsLoading(false);
    }
  }, [messages, isLoading, resetTranscript]);

  // 点击预设话语
  const handleSuggestionClick = useCallback((text: string) => {
    handleSendMessage(text);
  }, [handleSendMessage]);

  // 语音按钮
  const handleVoiceClick = useCallback(() => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  }, [isListening, startListening, stopListening]);

  // 只显示最后的 AI 回复
  const lastAssistantMessage = messages.filter(m => m.role === 'assistant').pop();

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex flex-col"
    >
      {/* 背景 */}
      <div className="absolute inset-0 bg-gradient-to-br from-orange-200 via-pink-200 to-purple-200" />

      {/* 顶部栏 */}
      <div className="relative z-10 flex items-center justify-between p-3 pt-10">
        <div className="text-xl">🌈</div>
        <span className="text-white font-bold text-sm drop-shadow-lg">小彩虹</span>
        <button onClick={onClose} className="text-white/80 text-xl">✕</button>
      </div>

      {/* 消息区域 */}
      <div className="relative z-10 flex-1 flex flex-col justify-center px-4">
        {/* 小彩虹回复 */}
        {lastAssistantMessage && (
          <motion.div
            key={lastAssistantMessage.content}
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white/80 backdrop-blur-md rounded-2xl p-4 shadow-xl mb-3"
          >
            <p className="text-gray-700 text-sm font-bold leading-relaxed text-center">
              {lastAssistantMessage.content}
            </p>
          </motion.div>
        )}

        {/* 语音识别状态 */}
        {isListening && (
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-red-400/80 backdrop-blur-md rounded-2xl p-4 shadow-xl mb-3"
          >
            <div className="flex items-center justify-center gap-2">
              <motion.span
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 0.5, repeat: Infinity }}
                className="text-2xl"
              >
                🎤
              </motion.span>
              <span className="text-white font-bold text-sm">正在听...</span>
            </div>
            {transcript && (
              <p className="text-white/90 text-xs text-center mt-2">{transcript}</p>
            )}
          </motion.div>
        )}

        {/* 加载状态 */}
        {isLoading && (
          <div className="text-center mb-3">
            <motion.span
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 1, repeat: Infinity }}
              className="text-2xl"
            >
              🌈
            </motion.span>
          </div>
        )}
      </div>

      {/* 预设话语 */}
      <div className="relative z-10 px-4 py-2">
        <p className="text-white/70 text-xs font-bold mb-2 text-center">💡 点击发送：</p>
        <div className="space-y-2">
          {currentSuggestions.map((text, i) => (
            <motion.button
              key={i}
              onClick={() => handleSuggestionClick(text)}
              disabled={isLoading || isListening}
              className="w-full bg-white/90 rounded-xl py-2.5 px-4 text-sm font-bold text-gray-700 shadow-lg disabled:opacity-50"
              whileTap={{ scale: 0.95 }}
            >
              {text}
            </motion.button>
          ))}
        </div>
      </div>

      {/* 底部操作栏 */}
      <div className="relative z-10 p-4 pb-8">
        <div className="flex items-center justify-center gap-4">
          {/* 语音按钮 */}
          {isSupported && (
            <motion.button
              onClick={handleVoiceClick}
              disabled={isLoading}
              className={`w-14 h-14 rounded-full flex items-center justify-center text-2xl shadow-xl ${
                isListening
                  ? 'bg-red-400 text-white'
                  : 'bg-white text-gray-700'
              }`}
              whileTap={{ scale: 0.9 }}
              animate={isListening ? { scale: [1, 1.1, 1] } : {}}
              transition={{ duration: 0.5, repeat: isListening ? Infinity : 0 }}
            >
              🎤
            </motion.button>
          )}
        </div>
        <p className="text-white/60 text-xs font-bold text-center mt-2">
          {isListening ? '说话中，松开停止' : '点击麦克风说话'}
        </p>
      </div>
    </motion.div>
  );
});

WatchRainbowChat.displayName = 'WatchRainbowChat';