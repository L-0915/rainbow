import { useState, useEffect, useCallback, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { sendChatMessage, getGreeting, type ChatMessage } from '@/services/rainbowChat';
import { useAchievementStore } from '@/store/appStore';

interface WatchRainbowChatProps {
  isOpen: boolean;
  onClose: () => void;
}

// 快速回复选项
const QUICK_REPLIES = [
  { emoji: '😊', text: '今天我很开心！' },
  { emoji: '😢', text: '我有点难过...' },
  { emoji: '😤', text: '我有点生气...' },
  { emoji: '🤗', text: '想抱抱～' },
];

export const WatchRainbowChat = memo(({ isOpen, onClose }: WatchRainbowChatProps) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentSuggestions, setCurrentSuggestions] = useState<string[]>([]);
  const unlockAchievement = useAchievementStore((state) => state.unlockAchievement);

  // 获取问候语
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setIsLoading(true);
      getGreeting().then((greeting) => {
        setMessages([{ role: 'assistant', content: greeting }]);
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

  // 发送快速回复
  const handleQuickReply = useCallback(async (text: string) => {
    const userMessage: ChatMessage = { role: 'user', content: text };
    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);
    setCurrentSuggestions([]);

    try {
      const response = await sendChatMessage([...messages, userMessage]);
      if (response.success && response.content) {
        setMessages((prev) => [...prev, { role: 'assistant', content: response.content! }]);
        if (response.suggestions?.length) {
          setCurrentSuggestions(response.suggestions.slice(0, 3));
        }
      }
    } catch {
      setMessages((prev) => [...prev, { role: 'assistant', content: '小彩虹没听清楚～能再说一次吗？💕' }]);
    } finally {
      setIsLoading(false);
    }
  }, [messages]);

  // 只显示最后两条消息
  const displayMessages = messages.slice(-2);
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
            className="bg-white/80 backdrop-blur-md rounded-2xl p-4 shadow-xl mb-4"
          >
            <p className="text-gray-700 text-sm font-bold leading-relaxed text-center">
              {lastAssistantMessage.content}
            </p>
          </motion.div>
        )}

        {/* 加载状态 */}
        {isLoading && (
          <div className="text-center mb-4">
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

      {/* 快速回复区域 */}
      <div className="relative z-10 p-4 pb-8">
        {/* AI 建议选项 */}
        {currentSuggestions.length > 0 ? (
          <div className="space-y-2 mb-3">
            {currentSuggestions.map((text, i) => (
              <motion.button
                key={i}
                onClick={() => handleQuickReply(text)}
                disabled={isLoading}
                className="w-full bg-white/90 rounded-xl py-2 px-4 text-sm font-bold text-gray-700 shadow-lg"
                whileTap={{ scale: 0.95 }}
              >
                {text}
              </motion.button>
            ))}
          </div>
        ) : (
          /* 默认快速回复 */
          <div className="grid grid-cols-2 gap-2">
            {QUICK_REPLIES.map((reply) => (
              <motion.button
                key={reply.text}
                onClick={() => handleQuickReply(reply.text)}
                disabled={isLoading}
                className="bg-white/80 rounded-xl py-3 px-3 text-center shadow-lg"
                whileTap={{ scale: 0.95 }}
              >
                <span className="text-xl">{reply.emoji}</span>
                <p className="text-xs font-bold text-gray-600 mt-1">{reply.text.slice(0, 6)}...</p>
              </motion.button>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
});

WatchRainbowChat.displayName = 'WatchRainbowChat';