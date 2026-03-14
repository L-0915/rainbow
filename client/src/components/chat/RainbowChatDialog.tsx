import { useState, useRef, useEffect, useMemo, useCallback, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { sendChatMessage, getGreeting, type ChatMessage } from '@/services/rainbowChat';
import { useAchievementStore } from '@/store/appStore';
import { Rainbow } from '@/components/rainbow/Rainbow';

interface RainbowChatDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

// 性能优化：缓存快速回复选项
const QUICK_REPLIES = [
  '今天我很开心！😊',
  '我有点难过...💙',
  '我想和你分享一件事～',
  '小彩虹，你今天好吗？🌈',
];

export const RainbowChatDialog = memo(({ isOpen, onClose }: RainbowChatDialogProps) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [rainbowMood, setRainbowMood] = useState<'happy' | 'calm' | 'excited'>('happy');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const unlockAchievement = useAchievementStore((state) => state.unlockAchievement);
  const [hasUnlockedChatAchievement, setHasUnlockedChatAchievement] = useState(false);

  // 滚动到底部 - 性能优化：使用 useCallback 缓存
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // 打开对话框时获取问候语
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setIsLoading(true);
      getGreeting().then((greeting) => {
        setMessages([{ role: 'assistant', content: greeting }]);
        setIsLoading(false);
      });
    }
  }, [isOpen]);

  // 解锁成就：聊天小明星（第一次发送消息时）
  useEffect(() => {
    if (messages.length >= 2 && !hasUnlockedChatAchievement) {
      unlockAchievement('chat-star');
      setHasUnlockedChatAchievement(true);
    }
  }, [messages.length, hasUnlockedChatAchievement, unlockAchievement]);

  // 聚焦输入框
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  // 性能优化：使用 useMemo 缓存快速回复数组
  const quickReplies = useMemo(() => QUICK_REPLIES, []);

  // 发送消息 - 性能优化：使用 useCallback 缓存
  const handleSend = useCallback(async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      role: 'user',
      content: inputValue.trim(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);
    setRainbowMood('calm');

    try {
      const response = await sendChatMessage([...messages, userMessage]);

      if (response.success && response.content) {
        setMessages((prev) => [...prev, { role: 'assistant', content: response.content! }]);
        // 根据回复内容判断情绪
        if (response.content.includes('开心') || response.content.includes('太棒了')) {
          setRainbowMood('happy');
        } else if (response.content.includes('！') || response.content.includes('～')) {
          setRainbowMood('excited');
        } else {
          setRainbowMood('calm');
        }
      } else {
        setMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            content: '你好呀，我是你的小彩虹，我会为你提供情感支持、答疑解惑等等，陪你聊天，有什么我可以帮助你的吗？任何问题都可以哦！💕',
          },
        ]);
      }
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: '小彩虹没听清楚～ 🦋 你能再说一次吗？💖',
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  }, [inputValue, isLoading, messages]);

  // 键盘回车发送 - 性能优化：使用 useCallback 缓存
  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }, [handleSend]);

  // 快速回复处理 - 性能优化：使用 useCallback 缓存
  const handleQuickReply = useCallback((text: string) => {
    setInputValue(text);
    inputRef.current?.focus();
  }, []);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center">
      {/* 背景遮罩 */}
      <motion.div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      />

      {/* 对话框 */}
      <motion.div
        className="relative w-full md:max-w-lg md:rounded-3xl bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 md:shadow-2xl overflow-hidden flex flex-col"
        style={{ maxHeight: 'calc(100vh - 80px)', height: '600px' }}
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
      >
        {/* 顶部标题栏 */}
        <div className="relative z-10 flex items-center justify-between p-4 bg-gradient-to-r from-pink-400 via-purple-400 to-blue-400">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white/30 flex items-center justify-center">
              <Rainbow size="sm" isAnimated={true} mood={rainbowMood} />
            </div>
            <div>
              <h3 className="text-white font-black text-lg drop-shadow-lg">小彩虹</h3>
              <p className="text-white/80 text-xs">你的知心大姐姐 🌈</p>
            </div>
          </div>

          <motion.button
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-white/30 hover:bg-white/50 flex items-center justify-center text-white text-xl transition-all"
            whileHover={{ scale: 1.1, rotate: 90 }}
            whileTap={{ scale: 0.9 }}
          >
            ✕
          </motion.button>
        </div>

        {/* 消息列表 */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gradient-to-b from-white/50 to-transparent">
          <AnimatePresence>
            {messages.map((message, index) => (
              <motion.div
                key={index}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                initial={{ opacity: 0, y: 20, scale: 0.8 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ type: 'spring', damping: 20 }}
              >
                <div
                  className={`max-w-[75%] rounded-2xl px-4 py-3 shadow-lg ${
                    message.role === 'user'
                      ? 'bg-gradient-to-r from-blue-400 to-purple-400 text-white rounded-br-sm'
                      : 'bg-white/90 backdrop-blur-sm text-gray-700 rounded-bl-sm border-2 border-purple-200'
                  }`}
                >
                  <p className="text-sm md:text-base whitespace-pre-wrap font-medium">
                    {message.content}
                  </p>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {/* 加载状态 */}
          {isLoading && (
            <motion.div
              className="flex justify-start"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="bg-white/90 backdrop-blur-sm rounded-2xl rounded-bl-sm px-4 py-3 border-2 border-purple-200">
                <div className="flex items-center gap-2">
                  <motion.div
                    className="w-2 h-2 rounded-full bg-pink-400"
                    animate={{ scale: [1, 1.5, 1] }}
                    transition={{ duration: 0.6, repeat: Infinity, delay: 0 }}
                  />
                  <motion.div
                    className="w-2 h-2 rounded-full bg-purple-400"
                    animate={{ scale: [1, 1.5, 1] }}
                    transition={{ duration: 0.6, repeat: Infinity, delay: 0.2 }}
                  />
                  <motion.div
                    className="w-2 h-2 rounded-full bg-blue-400"
                    animate={{ scale: [1, 1.5, 1] }}
                    transition={{ duration: 0.6, repeat: Infinity, delay: 0.4 }}
                  />
                </div>
              </div>
            </motion.div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* 快速回复选项 */}
        {messages.length < 3 && (
          <div className="px-4 py-2 bg-white/50 border-t border-purple-100">
            <p className="text-xs text-gray-500 font-bold mb-2">💬 快速回复：</p>
            <div className="flex flex-wrap gap-2">
              {quickReplies.map((reply, index) => (
                <motion.button
                  key={index}
                  onClick={() => handleQuickReply(reply)}
                  className="px-3 py-1.5 bg-gradient-to-r from-pink-100 to-purple-100 rounded-full text-xs font-bold text-gray-700 border border-purple-200 hover:border-purple-300 transition-all"
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {reply}
                </motion.button>
              ))}
            </div>
          </div>
        )}

        {/* 输入区域 */}
        <div className="p-4 bg-white/80 backdrop-blur-sm border-t-4 border-purple-200">
          <div className="flex items-center gap-2">
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="和小彩虹说点什么吧～ 💕"
              className="flex-1 px-4 py-3 rounded-full border-2 border-purple-200 focus:border-purple-400 focus:outline-none text-gray-700 font-medium bg-white/90"
              disabled={isLoading}
            />
            <motion.button
              onClick={handleSend}
              disabled={!inputValue.trim() || isLoading}
              className="w-14 h-14 rounded-full bg-gradient-to-r from-pink-400 via-purple-400 to-blue-400 flex items-center justify-center text-white text-2xl shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              🌈
            </motion.button>
          </div>
          <p className="text-xs text-gray-400 text-center mt-2">
            和小彩虹聊聊天，分享你的心情吧～ ✨
          </p>
        </div>

        {/* 装饰星星 */}
        <div className="absolute top-20 left-4 text-2xl opacity-50">⭐</div>
        <div className="absolute top-32 right-8 text-xl opacity-50">✨</div>
        <div className="absolute bottom-32 left-8 text-xl opacity-50">🦋</div>
      </motion.div>
    </div>
  );
});
RainbowChatDialog.displayName = 'RainbowChatDialog';
