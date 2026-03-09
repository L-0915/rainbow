import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '@/store/appStore';
import { useEmotionStore, EMOTION_CONFIG, EmotionType } from '@/store/emotionStore';
import { useCharacterStore, AVATAR_STYLES } from '@/store/characterStore';
import { useState, useEffect, useCallback, useMemo, memo, useRef } from 'react';
import { RainbowChatDialog } from '@/components/chat/RainbowChatDialog';

// 性能优化：GPU 加速 CSS 类
const GPU_ACCEL = 'will-change-transform content-visibility-auto';
const WILL_CHANGE_TRANSFORM = { willChange: 'transform' as const };

// AI 回复内容
const AI_RESPONSES: Record<EmotionType, {
  title: string;
  message: string;
  emoji: string;
}> = {
  happy: {
    title: '感受到你的开心',
    message: '开心是一种美好的情绪体验～ 它让你感到轻松、愉悦，也让你身边的人感受到你的温暖。好好享受这一刻吧！',
    emoji: '🎉',
  },
  calm: {
    title: '平静的心情',
    message: '平静是一种安宁的状态～ 它让你能够静静地感受当下，观察自己的内心。这种时刻很珍贵，好好珍惜它。',
    emoji: '🍃',
  },
  angry: {
    title: '生气的情绪',
    message: '生气是一种自然的情绪反应～ 它告诉你有些事情可能让你感到不舒服或不公平。允许自己有这种感受，它会在适当的时候慢慢消散。',
    emoji: '💪',
  },
  scared: {
    title: '害怕的感受',
    message: '害怕是一种自我保护的情绪～ 它让你更加谨慎，也让你知道自己可能需要一些支持和陪伴。你并不孤单，慢慢来就好。',
    emoji: '🫂',
  },
  sad: {
    title: '难过的心情',
    message: '难过是一种需要被看见的情绪～ 它让你慢下来，给自己一些时间和空间去处理内心的感受。这种情绪会过去的，你值得被温柔以待。',
    emoji: '💙',
  },
  excited: {
    title: '兴奋的感觉',
    message: '兴奋是一种充满能量的情绪～ 它让你感到充满力量和期待。享受这种充满活力的感觉吧，让它带给你美好的回忆！',
    emoji: '🌟',
  },
};

// 数字人表情配置
const CHARACTER_EXPRESSIONS: Record<EmotionType, {
  emoji: string;
}> = {
  happy: { emoji: '😄' },
  calm: { emoji: '😌' },
  angry: { emoji: '😤' },
  scared: { emoji: '😨' },
  sad: { emoji: '😢' },
  excited: { emoji: '🤩' },
};

// 音效播放工具 - 优化：只在需要时创建 AudioContext
const playSound = (type: 'select' | 'happy' | 'calm' | 'angry' | 'scared' | 'sad' | 'excited') => {
  try {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    const now = audioContext.currentTime;

    switch (type) {
      case 'select':
        oscillator.frequency.setValueAtTime(800, now);
        oscillator.frequency.exponentialRampToValueAtTime(1200, now + 0.1);
        gainNode.gain.setValueAtTime(0.3, now);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
        oscillator.start(now);
        oscillator.stop(now + 0.15);
        break;
      case 'happy':
        oscillator.frequency.setValueAtTime(523, now);
        oscillator.frequency.setValueAtTime(659, now + 0.1);
        oscillator.frequency.setValueAtTime(784, now + 0.2);
        gainNode.gain.setValueAtTime(0.3, now);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.4);
        oscillator.start(now);
        oscillator.stop(now + 0.4);
        break;
      case 'calm':
        oscillator.frequency.setValueAtTime(392, now);
        oscillator.frequency.exponentialRampToValueAtTime(294, now + 0.3);
        gainNode.gain.setValueAtTime(0.2, now);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
        oscillator.start(now);
        oscillator.stop(now + 0.5);
        break;
      case 'angry':
        oscillator.type = 'sawtooth';
        oscillator.frequency.setValueAtTime(200, now);
        oscillator.frequency.exponentialRampToValueAtTime(150, now + 0.2);
        gainNode.gain.setValueAtTime(0.25, now);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
        oscillator.start(now);
        oscillator.stop(now + 0.3);
        break;
      case 'scared':
        oscillator.frequency.setValueAtTime(600, now);
        oscillator.frequency.exponentialRampToValueAtTime(400, now + 0.3);
        gainNode.gain.setValueAtTime(0.15, now);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.4);
        oscillator.start(now);
        oscillator.stop(now + 0.4);
        break;
      case 'sad':
        oscillator.frequency.setValueAtTime(330, now);
        oscillator.frequency.exponentialRampToValueAtTime(262, now + 0.4);
        gainNode.gain.setValueAtTime(0.2, now);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.6);
        oscillator.start(now);
        oscillator.stop(now + 0.6);
        break;
      case 'excited':
        oscillator.frequency.setValueAtTime(523, now);
        oscillator.frequency.setValueAtTime(659, now + 0.08);
        oscillator.frequency.setValueAtTime(784, now + 0.16);
        oscillator.frequency.setValueAtTime(1047, now + 0.24);
        gainNode.gain.setValueAtTime(0.3, now);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.35);
        oscillator.start(now);
        oscillator.stop(now + 0.35);
        break;
    }
  } catch (e) {
    // 静音失败则忽略
  }
};

// 箭头按钮 - 保留所有动画，添加性能优化
const ArrowButton = ({
  onClick,
  children,
  direction,
}: {
  onClick: () => void;
  children: React.ReactNode;
  direction: 'left' | 'right';
}) => {
  const gradient = direction === 'left'
    ? 'bg-gradient-to-r from-[#FF6B35] via-[#FF8E53] to-[#FFB347]'
    : 'bg-gradient-to-l from-[#7B4BDE] via-[#C471ED] to-[#F78FB3]';

  // 性能优化：使用 useMemo 缓存动画配置
  const shineDirection = useMemo(() => direction === 'left' ? [-300, 300] : [300, -300], [direction]);
  const arrowXAnim = useMemo(() => direction === 'left' ? [-10, 0, -10] : [10, 0, 10], [direction]);

  return (
    <motion.button
      onClick={onClick}
      className={`relative px-4 py-5 md:px-6 md:py-6 rounded-3xl ${gradient} shadow-2xl border-4 border-white/80 overflow-hidden`}
      style={{ willChange: 'transform' }}
      whileHover={{ scale: 1.08, y: -5 }}
      whileTap={{ scale: 0.95 }}
    >
      {/* 动态光晕 - 优化：降低帧率，增加间隔 */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/30 to-white/0"
        animate={{ x: shineDirection }}
        transition={{ duration: 3, repeat: Infinity, ease: 'linear', repeatDelay: 1 }}
      />

      {/* 按钮内容 */}
      <div className="relative z-10 flex items-center gap-3 md:gap-4">
        {direction === 'left' ? (
          <>
            {/* 草地：箭头 | 文字 | emoji */}
            <motion.div
              className="text-4xl md:text-5xl text-white drop-shadow-lg"
              animate={{ x: arrowXAnim }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            >
              ◀
            </motion.div>
            <span className="text-white font-black text-xl md:text-2xl drop-shadow-2xl whitespace-nowrap">
              {children}
            </span>
            <motion.div
              className="text-3xl md:text-4xl"
              animate={{ rotate: [0, 15, -15, 0], scale: [1, 1.1, 1] }}
              transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
            >
              🌿
            </motion.div>
          </>
        ) : (
          <>
            {/* 游乐场：emoji | 文字 | 箭头 */}
            <motion.div
              className="text-3xl md:text-4xl"
              animate={{ rotate: [0, 15, -15, 0], scale: [1, 1.1, 1] }}
              transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
            >
              🎡
            </motion.div>
            <span className="text-white font-black text-xl md:text-2xl drop-shadow-2xl whitespace-nowrap">
              {children}
            </span>
            <motion.div
              className="text-4xl md:text-5xl text-white drop-shadow-lg"
              animate={{ x: arrowXAnim }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            >
              ▶
            </motion.div>
          </>
        )}
      </div>

      {/* 边缘高光 */}
      <div className="absolute inset-0 rounded-3xl border-2 border-white/60" />
    </motion.button>
  );
};
const MemoArrowButton = ArrowButton;
export { MemoArrowButton };

// 情绪图标按钮 - 保留动画，优化性能
const EmotionBubble = memo(({
  emotion,
  onClick
}: {
  emotion: EmotionType;
  onClick: (emotion: EmotionType) => void;
}) => {
  const config = EMOTION_CONFIG[emotion];

  // 性能优化：使用 useMemo 缓存动画配置
  const shineAnimation = useMemo(() => ({ opacity: [0.3, 0.5, 0.3] }), []);
  const emojiScaleAnimation = useMemo(() => ({ scale: [1, 1.1, 1] }), []);

  return (
    <motion.button
      onClick={() => {
        playSound('select');
        onClick(emotion);
      }}
      className="flex flex-col items-center gap-2 p-2 md:p-3"
      style={{ willChange: 'transform' }}
      whileHover={{ scale: 1.15, rotate: 5 }}
      whileTap={{ scale: 0.95 }}
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
    >
      <motion.div
        className="w-14 h-14 md:w-16 md:h-16 rounded-full flex items-center justify-center text-3xl md:text-4xl shadow-xl border-4 border-white/60 relative overflow-hidden"
        style={{ background: config.gradient, willChange: 'transform' }}
        whileHover={{ rotate: 15 }}
        transition={{ type: 'spring', duration: 0.3 }}
      >
        <motion.div
          className="absolute inset-0 bg-gradient-to-br from-white/30 to-transparent"
          animate={shineAnimation}
          transition={{ duration: 2, repeat: Infinity }}
        />
        <motion.span
          animate={emojiScaleAnimation}
          transition={{ duration: 2, repeat: Infinity }}
        >
          {config.emoji}
        </motion.span>
      </motion.div>
      <span className="text-xs md:text-sm font-black text-white drop-shadow-lg bg-black/20 rounded-full px-2 py-0.5">
        {config.label}
      </span>
    </motion.button>
  );
});
EmotionBubble.displayName = 'EmotionBubble';

// 数字人头顶对话气泡 - 保留动画，优化性能
const DialogueBubble = memo(({
  emotion,
  onClose,
}: {
  emotion: EmotionType;
  onClose: () => void;
}) => {
  const config = EMOTION_CONFIG[emotion];

  // 性能优化：使用 useMemo 缓存动画配置
  const floatAnimation = useMemo(() => ({ y: [0, -5, 0], rotate: [0, 2, -2, 0] }), []);
  const emojiAnimation = useMemo(() => ({ scale: [1, 1.15, 1], rotate: [0, 8, -8, 0] }), []);
  const starAnimations = useMemo(() => [
    { scale: [0, 1, 0], opacity: [0, 1, 0], rotate: [0, 180, 360] },
    { scale: [0, 1, 0], opacity: [0, 1, 0], rotate: [0, 180, 360] },
    { scale: [0, 1, 0], opacity: [0, 1, 0], rotate: [0, 180, 360] },
  ], []);

  return (
    <motion.div
      className="absolute -top-40 left-1/2 -translate-x-1/2 z-30"
      initial={{ scale: 0, opacity: 0, y: 20 }}
      animate={{ scale: 1, opacity: 1, y: 0 }}
      exit={{ scale: 0, opacity: 0, y: 20 }}
      transition={{ type: 'spring', bounce: 0.6 }}
    >
      <div className="relative">
        <motion.div
          className="bg-white/90 backdrop-blur-xl rounded-3xl px-6 py-4 shadow-2xl border-4 border-white/60 min-w-[200px]"
          animate={floatAnimation}
          transition={{ duration: 2.5, repeat: Infinity }}
        >
          {/* 气泡尾巴 - 指向小人 */}
          <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[12px] border-l-transparent border-r-[12px] border-r-transparent border-t-[16px] border-t-white/90" />

          <div className="text-center">
            <motion.div
              className="text-4xl mb-2"
              animate={emojiAnimation}
              transition={{ duration: 2, repeat: Infinity }}
            >
              {config.emoji}
            </motion.div>
            <p className="text-gray-700 font-black text-sm md:text-base">
              {config.description}
            </p>
            <motion.button
              onClick={onClose}
              className="mt-2 text-xs text-gray-500 hover:text-gray-700 font-bold underline"
              whileHover={{ scale: 1.1 }}
            >
              知道了
            </motion.button>
          </div>
        </motion.div>

        {/* 装饰星星 - 保留动画，优化性能 */}
        {[...Array(3)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute text-lg"
            style={{ top: `${i * 15 - 10}px`, right: '-20px' }}
            animate={starAnimations[i]}
            transition={{ duration: 2, repeat: Infinity, delay: i * 0.4 }}
          >
            ⭐
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
});
DialogueBubble.displayName = 'DialogueBubble';

// 情绪选择面板 - 保留动画，优化性能
const EmotionPanel = memo(({
  onSelect,
  onClose,
}: {
  onSelect: (emotion: EmotionType) => void;
  onClose: () => void;
}) => {
  const emotions = Object.keys(EMOTION_CONFIG) as EmotionType[];

  // 性能优化：使用 useMemo 缓存动画配置
  const titleAnimation = useMemo(() => ({ scale: [1, 1.05, 1] }), []);

  return (
    <motion.div
      className="absolute -top-48 left-1/2 -translate-x-1/2 z-30"
      initial={{ scale: 0, opacity: 0, y: 20 }}
      animate={{ scale: 1, opacity: 1, y: 0 }}
      exit={{ scale: 0, opacity: 0, y: 20 }}
      transition={{ type: 'spring', bounce: 0.5 }}
    >
      <div className="relative">
        <div className="bg-white/35 backdrop-blur-xl rounded-3xl p-4 md:p-6 shadow-2xl border-4 border-white/50">
          <button
            onClick={onClose}
            className="absolute top-2 right-2 w-8 h-8 rounded-full bg-white/60 hover:bg-white/80 flex items-center justify-center text-lg shadow-lg z-10"
          >
            ✕
          </button>

          <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-8 h-8 bg-white/35 rotate-45 border-r-4 border-b-4 border-white/50" />

          <div className="text-center mb-4">
            <motion.p
              className="text-white font-black text-lg md:text-xl drop-shadow-lg mb-2"
              animate={titleAnimation}
              transition={{ duration: 2.5, repeat: Infinity }}
            >
              ✨ 今天的心情是什么颜色？✨
            </motion.p>
            <p className="text-white/85 text-xs md:text-sm font-bold">
              选一个吧～
            </p>
          </div>

          <div className="grid grid-cols-3 gap-2 md:gap-4">
            {emotions.map((emotion, index) => (
              <motion.div
                key={emotion}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: index * 0.05 }}
              >
                <EmotionBubble emotion={emotion} onClick={onSelect} />
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
});
EmotionPanel.displayName = 'EmotionPanel';

// AI 回复弹窗 - 保留动画，优化性能
const AIResponseModal = memo(({
  emotion,
  onClose,
}: {
  emotion: EmotionType;
  onClose: () => void;
}) => {
  const response = AI_RESPONSES[emotion];

  useEffect(() => {
    playSound(emotion);
  }, [emotion]);

  // 性能优化：使用 useMemo 缓存动画配置
  const starAnimation = useMemo(() => ({ y: [0, -8, 0], rotate: [0, 8, -8, 0] }), []);
  const emojiFloatAnimation = useMemo(() => ({ y: [0, -10, 0], rotate: [0, 5, -5, 0] }), []);
  const iconAnimations = useMemo(() => [
    { scale: [1, 1.2, 1], rotate: [0, 12, -12, 0] },
    { scale: [1, 1.15, 1], rotate: [0, 10, -10, 0] },
    { scale: [1, 1.25, 1], rotate: [0, 15, -15, 0] },
    { scale: [1, 1.15, 1], rotate: [0, 10, -10, 0] },
    { scale: [1, 1.2, 1], rotate: [0, 12, -12, 0] },
  ], []);

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      <motion.div
        className="relative bg-gradient-to-br from-pink-100 via-purple-100 to-blue-100 rounded-3xl p-6 md:p-8 shadow-2xl border-4 border-white/60 max-w-md w-full"
        initial={{ scale: 0.3, rotate: -10, y: 100 }}
        animate={{ scale: 1, rotate: 0, y: 0 }}
        exit={{ scale: 0.3, rotate: 10, y: 100 }}
        transition={{ type: 'spring', bounce: 0.6 }}
      >
        <button
          onClick={onClose}
          className="absolute top-3 right-3 w-10 h-10 rounded-full bg-white/60 hover:bg-white/80 flex items-center justify-center text-xl shadow-lg transition-all z-10"
        >
          ✕
        </button>

        {/* 顶部星星动画 - 恢复 */}
        <div className="flex justify-center gap-2 mb-4">
          {[...Array(3)].map((_, i) => (
            <motion.div
              key={i}
              className="text-2xl"
              animate={starAnimation}
              transition={{ duration: 2, repeat: Infinity, delay: i * 0.25 }}
            >
              ⭐
            </motion.div>
          ))}
        </div>

        <div className="text-center mb-4">
          <motion.div
            className="text-6xl mb-3"
            animate={emojiFloatAnimation}
            transition={{ duration: 2.5, repeat: Infinity }}
          >
            {response.emoji}
          </motion.div>
          <h3 className="text-xl md:text-2xl font-black text-gray-700 mb-2">
            {response.title}
          </h3>
        </div>

        <motion.div
          className="bg-white/60 backdrop-blur-xl rounded-2xl p-4 md:p-6 mb-6 border-2 border-white/40"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <p className="text-gray-700 text-sm md:text-base leading-relaxed font-medium">
            {response.message}
          </p>
        </motion.div>

        {/* 底部 emoji 动画 - 恢复 */}
        <div className="flex justify-center gap-4 mb-4">
          {[...Array(5)].map((_, i) => (
            <motion.div
              key={i}
              className="text-xl"
              animate={iconAnimations[i]}
              transition={{ duration: 2, repeat: Infinity, delay: i * 0.12 }}
            >
              {['💖', '✨', '🌈', '💫', '🦋'][i]}
            </motion.div>
          ))}
        </div>

        <motion.button
          onClick={onClose}
          className="w-full bg-gradient-to-r from-pink-400 via-purple-400 to-blue-400 text-white font-black text-xl py-4 px-6 rounded-full shadow-xl hover:shadow-2xl transition-all border-4 border-white/60"
          whileHover={{ scale: 1.05, y: -3 }}
          whileTap={{ scale: 0.95 }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          知道啦～ 💕
        </motion.button>
      </motion.div>
    </motion.div>
  );
});
AIResponseModal.displayName = 'AIResponseModal';

// 角色选择器组件 - 保留动画，优化性能
const AvatarSelector = memo(({
  isOpen,
  onClose,
  currentAvatar,
  onSelect,
}: {
  isOpen: boolean;
  onClose: () => void;
  currentAvatar: string;
  onSelect: (avatar: string) => void;
}) => {
  // 性能优化：使用 useMemo 缓存动画配置
  const titleAnimation = useMemo(() => ({ rotate: [0, 10, -10, 0] }), []);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      />

      <motion.div
        className="relative bg-gradient-to-br from-pink-100 via-purple-100 to-blue-100 rounded-3xl p-6 max-w-md w-full shadow-2xl border-4 border-white/60"
        initial={{ scale: 0.8, y: 100 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.8, y: 100 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="text-center mb-6">
          <motion.div
            className="text-5xl mb-2"
            animate={titleAnimation}
            transition={{ duration: 3, repeat: Infinity }}
          >
            👤
          </motion.div>
          <h2 className="text-xl font-black text-gray-700">更换角色</h2>
          <p className="text-gray-500 text-sm mt-1">选择一个你喜欢的形象吧～</p>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-6">
          {AVATAR_STYLES.map((style) => (
            <motion.button
              key={style.id}
              onClick={() => onSelect(style.id as '卡通 1' | '卡通 2')}
              className={`relative p-4 rounded-2xl border-4 transition-all ${
                currentAvatar === style.id
                  ? 'border-purple-400 bg-purple-100 shadow-lg scale-105'
                  : 'border-white/60 bg-white/60 hover:border-purple-300'
              }`}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
            >
              {currentAvatar === style.id && (
                <motion.div
                  className="absolute -top-2 -right-2 w-8 h-8 bg-purple-400 rounded-full flex items-center justify-center text-white text-lg shadow-lg z-10"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                >
                  ✓
                </motion.div>
              )}

              <div className="aspect-square rounded-xl overflow-hidden bg-white shadow-inner mb-2">
                <img
                  src={style.thumbnail}
                  alt={style.label}
                  className="w-full h-full object-contain"
                  onError={(e) => {
                    const fallback = style.id === '卡通 2' ? '/卡通数字人 2.png' : '/卡通数字人.png';
                    (e.target as HTMLImageElement).src = fallback;
                  }}
                />
              </div>

              <div className="text-center">
                <div className="font-black text-gray-700 text-sm">{style.label}</div>
                <div className="text-xs text-gray-500">{style.id}</div>
              </div>
            </motion.button>
          ))}
        </div>

        <motion.button
          onClick={onClose}
          className="w-full bg-gradient-to-r from-purple-400 to-pink-400 text-white font-black py-3 rounded-full shadow-xl"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          关闭
        </motion.button>
      </motion.div>
    </div>
  );
});
AvatarSelector.displayName = 'AvatarSelector';

export const HomeScene = () => {
  const navigateTo = useAppStore((state) => state.navigateTo);
  const todayEmotion = useEmotionStore((state) => state.todayEmotion);
  const setTodayEmotion = useEmotionStore((state) => state.setTodayEmotion);
  const checkAndResetDaily = useEmotionStore((state) => state.checkAndResetDaily);
  const checkAndCleanupMonthly = useEmotionStore((state) => state.checkAndCleanupMonthly);
  const { config: characterConfig, setConfig: setCharacterConfig } = useCharacterStore();

  const [showPanel, setShowPanel] = useState(!todayEmotion);
  const [showAIResponse, setShowAIResponse] = useState(false);
  const [showDialogue, setShowDialogue] = useState(false);
  const [characterExpression, setCharacterExpression] = useState<EmotionType | null>(null);
  const [showChat, setShowChat] = useState(false);
  const [showAvatarSelector, setShowAvatarSelector] = useState(false);
  const [bgLoaded, setBgLoaded] = useState(false);

  // 性能优化：使用 useMemo 缓存动画配置
  const titleScaleAnimation = useMemo(() => ({ scale: [1, 1.02, 1] }), []);
  const titleRotateAnimation = useMemo(() => ({ rotate: [0, 8, -8, 0] }), []);
  const characterFloatAnimation = useMemo(() => ({ y: [0, -10, 0] }), []);
  const emojiFloatAnimation = useMemo(() => ({ y: [0, -8, 0], scale: [1, 1.08, 1], rotate: [0, 4, -4, 0] }), []);
  const starAnimations = useMemo(() => [
    { scale: [0, 1, 0], opacity: [0, 1, 0], rotate: [0, 120, 360] },
    { scale: [0, 1, 0], opacity: [0, 1, 0], rotate: [0, 120, 360] },
    { scale: [0, 1, 0], opacity: [0, 1, 0], rotate: [0, 120, 360] },
  ], []);
  const flowerAnimations = useMemo(() => [
    { rotate: [0, 8, -8, 0], scale: [1, 1.08, 1] },
    { rotate: [0, 8, -8, 0], scale: [1, 1.08, 1] },
    { rotate: [0, 8, -8, 0], scale: [1, 1.08, 1] },
    { rotate: [0, 8, -8, 0], scale: [1, 1.08, 1] },
    { rotate: [0, 8, -8, 0], scale: [1, 1.08, 1] },
  ], []);

  // 预加载背景图片
  useEffect(() => {
    const img = new Image();
    img.src = '/home-bg.png';
    img.onload = () => setBgLoaded(true);
    img.onerror = () => setBgLoaded(true);

    checkAndResetDaily();
    checkAndCleanupMonthly();
  }, []);

  // 获取当前角色图片路径
  const currentAvatarUrl = useMemo(() =>
    characterConfig.avatarStyle === '卡通 2' ? '/卡通数字人 2.png' : '/卡通数字人.png',
    [characterConfig.avatarStyle]
  );

  const handleEmotionSelect = useCallback((emotion: EmotionType) => {
    playSound(emotion);
    setTodayEmotion(emotion);
    setCharacterExpression(emotion);
    setShowPanel(false);
    setShowDialogue(true);

    setTimeout(() => {
      setCharacterExpression(null);
      setShowDialogue(false);
      setShowAIResponse(true);
    }, 2000);
  }, [setTodayEmotion]);

  const handleOpenPanel = useCallback(() => {
    setShowAIResponse(false);
    setShowDialogue(false);
    setShowPanel(true);
  }, []);

  return (
    <div className="relative min-h-screen w-full overflow-y-auto overflow-x-hidden">
      {/* 背景图片 */}
      <div
        className={`fixed inset-0 bg-cover bg-center bg-no-repeat transition-opacity duration-700 ${bgLoaded ? 'opacity-100' : 'opacity-0'}`}
        style={{ backgroundImage: `url('/home-bg.png')` }}
      />

      {!bgLoaded && (
        <div className="fixed inset-0 bg-gradient-to-br from-pink-200 via-purple-200 to-blue-200 transition-opacity duration-700" />
      )}

      {/* 渐变遮罩 */}
      <div className="fixed inset-0 bg-gradient-to-b from-black/10 via-black/5 to-black/40" />

      {/* 顶部标题栏 - 保留动画，优化性能 */}
      <div className="sticky top-0 z-20 flex items-center justify-center gap-4 p-4">
        <motion.button
          onClick={() => navigateTo('parent-dashboard')}
          className="bg-white/80 backdrop-blur-xl px-4 py-2 rounded-full shadow-xl font-bold text-gray-700 border-2 border-white/60 flex items-center gap-1.5"
          initial={{ x: -50, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ type: 'spring', bounce: 0.5 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <span className="text-lg">⌚</span>
          <span className="text-sm">手表连接</span>
        </motion.button>

        <motion.div
          className="bg-gradient-to-r from-pink-400 via-purple-400 to-blue-400 backdrop-blur-xl rounded-full px-8 py-3 shadow-2xl border-4 border-white/60"
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ type: 'spring', bounce: 0.5 }}
        >
          <motion.div className="flex items-center gap-3" animate={titleScaleAnimation} transition={{ duration: 3, repeat: Infinity }}>
            <motion.span className="text-3xl" animate={titleRotateAnimation} transition={{ duration: 3, repeat: Infinity }}>🏠</motion.span>
            <span className="text-2xl font-black text-white drop-shadow-2xl">我的家园</span>
            <motion.span className="text-3xl" animate={titleRotateAnimation} transition={{ duration: 3, repeat: Infinity }}>✨</motion.span>
          </motion.div>
        </motion.div>

        <motion.button
          onClick={() => navigateTo('map')}
          className="bg-gradient-to-r from-green-400 via-emerald-400 to-teal-400 backdrop-blur-xl rounded-full p-3 shadow-2xl border-4 border-white/60"
          initial={{ y: -50, opacity: 0, scale: 0.8 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          transition={{ type: 'spring', bounce: 0.5, delay: 0.2 }}
          whileHover={{ scale: 1.1, rotate: 5 }}
          whileTap={{ scale: 0.95 }}
        >
          <motion.div className="flex items-center gap-2 px-2">
            <motion.span className="text-2xl" animate={titleRotateAnimation} transition={{ duration: 3, repeat: Infinity }}>🗺️</motion.span>
            <span className="text-sm font-black text-white drop-shadow-lg whitespace-nowrap">世界地图</span>
          </motion.div>
        </motion.button>
      </div>

      {/* 主内容区域 */}
      <div className="relative z-10 flex flex-col items-center justify-end px-4 pt-8 pb-16 min-h-[calc(100vh-80px)]">
        {/* 角色区域 */}
        <motion.div
          className="relative w-full flex flex-col items-center"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.3, type: 'spring', bounce: 0.4 }}
        >
          {/* 数字人区域 - 保留浮动动画，优化性能 */}
          <motion.div className="relative z-10" animate={characterFloatAnimation} transition={{ duration: 3, repeat: Infinity }}>
            {/* 光晕背景 - 静态 */}
            <div className="absolute inset-0 bg-gradient-to-r from-pink-400/30 via-purple-400/30 to-blue-400/30 rounded-full blur-3xl scale-150" />

            {/* 表情 emoji - 保留动画 */}
            <AnimatePresence mode="wait">
              {characterExpression && (
                <motion.div
                  key={characterExpression}
                  className="absolute inset-0 flex items-center justify-center z-20"
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0, opacity: 0 }}
                  transition={{ type: 'spring', bounce: 0.5 }}
                >
                  <motion.span
                    className="text-[7rem] md:text-[8rem] drop-shadow-2xl"
                    animate={emojiFloatAnimation}
                    transition={{ duration: 2.5, repeat: Infinity }}
                  >
                    {CHARACTER_EXPRESSIONS[characterExpression].emoji}
                  </motion.span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* 角色图片 - 保留浮动动画 */}
            <motion.img
              src={currentAvatarUrl}
              alt="卡通数字人"
              className="w-48 h-48 md:w-56 md:h-56 object-contain drop-shadow-2xl"
              animate={characterFloatAnimation}
              transition={{ duration: 3, repeat: Infinity, delay: 0.15 }}
              onError={(e) => {
                (e.target as HTMLImageElement).src = '/卡通数字人.png';
              }}
            />

            {/* 闪烁的星星 - 保留动画，优化性能 */}
            {[...Array(3)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute text-2xl"
                style={{
                  top: i === 0 ? '-20px' : i === 1 ? '50%' : undefined,
                  bottom: i === 2 ? '-20px' : undefined,
                  left: i === 0 ? '50%' : i === 1 ? '-30px' : undefined,
                  right: i === 1 ? undefined : i === 2 ? '-30px' : undefined,
                }}
                animate={starAnimations[i]}
                transition={{ duration: 2, repeat: Infinity, delay: i * 0.5 }}
              >
                ⭐
              </motion.div>
            ))}
          </motion.div>

          {/* 情绪选择面板 */}
          <AnimatePresence>
            {showPanel && (
              <EmotionPanel onSelect={handleEmotionSelect} onClose={() => {
                setShowPanel(false);
                setShowAIResponse(false);
              }} />
            )}
          </AnimatePresence>

          {/* 对话气泡 */}
          <AnimatePresence>
            {showDialogue && todayEmotion && (
              <DialogueBubble emotion={todayEmotion} onClose={() => setShowDialogue(false)} />
            )}
          </AnimatePresence>
        </motion.div>

        {/* 选择心情按钮 */}
        {todayEmotion && !showPanel && !showAIResponse && (
          <div className="flex gap-4 mb-4">
            <motion.button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('选择心情按钮被点击！');
                handleOpenPanel();
              }}
              className="bg-gradient-to-r from-purple-400 via-pink-400 to-rose-400 text-white font-black text-lg py-3 px-6 rounded-full shadow-xl border-4 border-white/60 relative z-40"
              whileHover={{ scale: 1.05, y: -3 }}
              whileTap={{ scale: 0.95 }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              style={{ pointerEvents: 'auto' }}
            >
              💭 选择心情
            </motion.button>

            <motion.button
              onClick={() => setShowAvatarSelector(true)}
              className="bg-gradient-to-r from-blue-400 via-cyan-400 to-teal-400 text-white font-black text-lg py-3 px-6 rounded-full shadow-xl border-4 border-white/60 relative z-40"
              whileHover={{ scale: 1.05, y: -3 }}
              whileTap={{ scale: 0.95 }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.65 }}
            >
              🪄 选择角色
            </motion.button>
          </div>
        )}

        {/* 与小彩虹聊天按钮 */}
        <motion.button
          onClick={() => setShowChat(true)}
          className="bg-gradient-to-r from-pink-400 via-purple-400 to-blue-400 text-white font-black text-lg py-3 px-8 rounded-full shadow-xl border-4 border-white/60 mb-4 relative z-40 flex items-center gap-2"
          whileHover={{ scale: 1.08, y: -5 }}
          whileTap={{ scale: 0.95 }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
        >
          <span className="text-2xl">🌈</span>
          <span>和小彩虹聊天</span>
          <span className="text-2xl">💕</span>
        </motion.button>

        {/* 底部装饰 - 保留花朵动画，优化性能 */}
        <div className="flex justify-center gap-6 mt-4">
          {[...Array(5)].map((_, i) => (
            <motion.div
              key={i}
              className="text-2xl"
              animate={flowerAnimations[i]}
              transition={{ duration: 2.5, repeat: Infinity, delay: i * 0.2 }}
            >
              🌸
            </motion.div>
          ))}
        </div>
      </div>

      {/* 左右导航按钮 */}
      <div className="fixed left-4 top-1/2 -translate-y-1/2 z-20">
        <MemoArrowButton direction="left" onClick={() => navigateTo('grass')}>草地</MemoArrowButton>
      </div>

      <div className="fixed right-4 top-1/2 -translate-y-1/2 z-20">
        <MemoArrowButton direction="right" onClick={() => navigateTo('playground')}>游乐场</MemoArrowButton>
      </div>

      {/* 底部草地装饰带 - 保留 SVG 动画，优化性能 */}
      <div className="fixed bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-green-500/50 to-transparent pointer-events-none z-0">
        <svg viewBox="0 0 400 60" className="w-full h-full" preserveAspectRatio="none">
          {[...Array(20)].map((_, i) => (
            <motion.path
              key={i}
              d={`M ${i * 20} 60 Q ${i * 20 + 5} 30 ${i * 20 + 10} 60`}
              fill="#69DB7C"
              opacity="0.6"
              animate={{ d: `M ${i * 20} 60 Q ${i * 20 + 5} ${25 + (i % 3) * 5} ${i * 20 + 10} 60` }}
              transition={{ duration: 2.5, repeat: Infinity, delay: i * 0.12 }}
            />
          ))}
        </svg>
      </div>

      {/* AI 回复弹窗 */}
      <AnimatePresence>
        {showAIResponse && todayEmotion && (
          <AIResponseModal emotion={todayEmotion} onClose={() => setShowAIResponse(false)} />
        )}
      </AnimatePresence>

      {/* 与小彩虹对话弹窗 */}
      <AnimatePresence>
        {showChat && <RainbowChatDialog isOpen={showChat} onClose={() => setShowChat(false)} />}
      </AnimatePresence>

      {/* 更换角色选择器 */}
      <AnimatePresence>
        {showAvatarSelector && (
          <AvatarSelector
            isOpen={showAvatarSelector}
            onClose={() => setShowAvatarSelector(false)}
            currentAvatar={characterConfig.avatarStyle}
            onSelect={(avatar) => {
              setCharacterConfig({ avatarStyle: avatar });
              setShowAvatarSelector(false);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
};
