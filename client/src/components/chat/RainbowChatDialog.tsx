import { useState, useRef, useEffect, useMemo, useCallback, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { sendChatMessage, getGreeting, type ChatMessage } from '@/services/rainbowChat';
import { useAchievementStore } from '@/store/appStore';
import { Rainbow } from '@/components/rainbow/Rainbow';
import { useSpeechRecognition } from '@/hooks/useSpeechRecognition';

interface RainbowChatDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

// 预设话语（初始和备用）
const DEFAULT_SUGGESTIONS = [
  '今天我很开心！',
  '我有点难过...',
  '我想和你分享一件事',
  '小彩虹，你今天好吗？',
];

export const RainbowChatDialog = memo(({ isOpen, onClose }: RainbowChatDialogProps) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [rainbowMood, setRainbowMood] = useState<'happy' | 'calm' | 'excited'>('happy');
  const [currentSuggestions, setCurrentSuggestions] = useState<string[]>(DEFAULT_SUGGESTIONS);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const unlockAchievement = useAchievementStore((state) => state.unlockAchievement);
  const [hasUnlockedChatAchievement, setHasUnlockedChatAchievement] = useState(false);

  // 语音识别
  const { isListening, transcript, isSupported, startListening, stopListening, resetTranscript } = useSpeechRecognition();

  // 监听语音识别结果
  useEffect(() => {
    if (transcript) {
      setInputValue(transcript);
    }
  }, [transcript]);

  // 语音识别结束时自动发送
  useEffect(() => {
    if (!isListening && transcript && inputValue === transcript) {
      // 延迟一点发送，让用户看到识别结果
      const timer = setTimeout(() => {
        if (inputValue.trim()) {
          handleSendMessage(inputValue.trim());
        }
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [isListening, transcript]);

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

  // 发送消息的核心函数
  const handleSendMessage = useCallback(async (text: string) => {
    if (!text.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      role: 'user',
      content: text.trim(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');
    resetTranscript();
    setIsLoading(true);
    setRainbowMood('calm');

    try {
      const response = await sendChatMessage([...messages, userMessage]);

      if (response.success && response.content) {
        setMessages((prev) => [...prev, { role: 'assistant', content: response.content! }]);
        // 设置 AI 生成的建议选项，如果没有则使用默认
        if (response.suggestions && response.suggestions.length > 0) {
          setCurrentSuggestions(response.suggestions);
        } else {
          setCurrentSuggestions(DEFAULT_SUGGESTIONS);
        }
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
        setCurrentSuggestions(DEFAULT_SUGGESTIONS);
      }
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: '小彩虹没听清楚～ 🦋 你能再说一次吗？💖',
        },
      ]);
      setCurrentSuggestions(DEFAULT_SUGGESTIONS);
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, messages, resetTranscript]);

  // 从输入框发送
  const handleSend = useCallback(() => {
    handleSendMessage(inputValue);
  }, [inputValue, handleSendMessage]);

  // 键盘回车发送 - 性能优化：使用 useCallback 缓存
  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }, [handleSend]);

  // 点击建议选项直接发送
  const handleSuggestionClick = useCallback((text: string) => {
    handleSendMessage(text);
  }, [handleSendMessage]);

  // 语音输入按钮点击
  const handleVoiceClick = useCallback(() => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  }, [isListening, startListening, stopListening]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      {/* 背景遮罩 */}
      <motion.div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      />

      {/* 对话框 - 手表优化 */}
      <motion.div
        className="relative w-full md:max-w-sm md:rounded-3xl md:shadow-2xl overflow-hidden flex flex-col bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50"
        style={{ maxHeight: 'calc(100vh - 20px)', height: 'calc(100vh - 20px)' }}
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
      >
        {/* 顶部标题栏 - 手表优化 */}
        <div className="relative z-10 flex items-center justify-between p-2 bg-gradient-to-r from-pink-400 via-purple-400 to-blue-400 flex-shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-white/30 flex items-center justify-center">
              <Rainbow size="sm" isAnimated={true} mood={rainbowMood} />
            </div>
            <div>
              <h3 className="text-white font-black text-sm drop-shadow-lg">小彩虹</h3>
              <p className="text-white/80 text-xs">知心大姐姐 🌈</p>
            </div>
          </div>

          <motion.button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/30 hover:bg-white/50 flex items-center justify-center text-white text-lg transition-all"
            whileHover={{ scale: 1.1, rotate: 90 }}
            whileTap={{ scale: 0.9 }}
          >
            ✕
          </motion.button>
        </div>

        {/* 消息列表 - 手表优化 */}
        <div className="flex-1 overflow-y-auto p-2 space-y-2 bg-gradient-to-b from-white/50 to-transparent">
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
                  className={`max-w-[80%] rounded-xl px-3 py-2 shadow-lg ${
                    message.role === 'user'
                      ? 'bg-gradient-to-r from-blue-400 to-purple-400 text-white rounded-br-sm'
                      : 'bg-white/90 backdrop-blur-sm text-gray-700 rounded-bl-sm border-2 border-purple-200'
                  }`}
                >
                  <p className="text-xs sm:text-sm whitespace-pre-wrap font-medium">
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
              <div className="bg-white/90 backdrop-blur-sm rounded-xl rounded-bl-sm px-3 py-2 border-2 border-purple-200">
                <div className="flex items-center gap-1.5">
                  <motion.div
                    className="w-1.5 h-1.5 rounded-full bg-pink-400"
                    animate={{ scale: [1, 1.5, 1] }}
                    transition={{ duration: 0.6, repeat: Infinity, delay: 0 }}
                  />
                  <motion.div
                    className="w-1.5 h-1.5 rounded-full bg-purple-400"
                    animate={{ scale: [1, 1.5, 1] }}
                    transition={{ duration: 0.6, repeat: Infinity, delay: 0.2 }}
                  />
                  <motion.div
                    className="w-1.5 h-1.5 rounded-full bg-blue-400"
                    animate={{ scale: [1, 1.5, 1] }}
                    transition={{ duration: 0.6, repeat: Infinity, delay: 0.4 }}
                  />
                </div>
              </div>
            </motion.div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* 预设话语 - 始终显示 */}
        {!isLoading && currentSuggestions.length > 0 && (
          <div className="px-2 py-2 bg-gradient-to-r from-pink-50 to-purple-50 border-t border-purple-200 flex-shrink-0">
            <p className="text-xs text-gray-500 font-bold mb-1.5">💡 点击发送：</p>
            <div className="flex flex-wrap gap-1.5">
              {currentSuggestions.map((suggestion, index) => (
                <motion.button
                  key={index}
                  onClick={() => handleSuggestionClick(suggestion)}
                  className="px-3 py-1.5 bg-white rounded-full text-xs font-bold text-gray-700 border-2 border-purple-200 shadow-sm"
                  whileHover={{ scale: 1.05, y: -1 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {suggestion}
                </motion.button>
              ))}
            </div>
          </div>
        )}

        {/* 输入区域 - 添加语音输入 */}
        <div className="p-2 bg-white/80 backdrop-blur-sm border-t-4 border-purple-200 flex-shrink-0">
          <div className="flex items-center gap-1.5">
            {/* 语音输入按钮 */}
            {isSupported && (
              <motion.button
                onClick={handleVoiceClick}
                className={`w-10 h-10 rounded-full flex items-center justify-center text-xl shadow-lg flex-shrink-0 ${
                  isListening
                    ? 'bg-red-400 text-white animate-pulse'
                    : 'bg-gradient-to-r from-green-400 to-teal-400 text-white'
                }`}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                {isListening ? '🎙️' : '🎤'}
              </motion.button>
            )}

            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={isListening ? '正在听...' : '和小彩虹说点什么吧～'}
              className="flex-1 px-3 py-2 rounded-full border-2 border-purple-200 focus:border-purple-400 focus:outline-none text-xs sm:text-sm text-gray-700 font-medium bg-white/90"
              disabled={isLoading || isListening}
            />
            <motion.button
              onClick={handleSend}
              disabled={!inputValue.trim() || isLoading}
              className="w-10 h-10 rounded-full bg-gradient-to-r from-pink-400 via-purple-400 to-blue-400 flex items-center justify-center text-white text-xl shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              🌈
            </motion.button>
          </div>
          <p className="text-xs text-gray-400 text-center mt-1">
            {isListening ? '🎤 正在听，请说话...' : '点击🎤语音输入，或打字聊天～'}
          </p>
        </div>

        {/* 装饰星星 - 手表优化 */}
        <div className="absolute top-16 left-2 text-xl opacity-50">⭐</div>
        <div className="absolute top-24 right-4 text-lg opacity-50">✨</div>
        <div className="absolute bottom-24 left-4 text-lg opacity-50">🦋</div>
      </motion.div>
    </div>
  );
});
RainbowChatDialog.displayName = 'RainbowChatDialog';
