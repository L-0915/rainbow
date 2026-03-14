import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore, PlaygroundGame, useAchievementStore } from '@/store/appStore';
import { useEmotionStore, EMOTION_CONFIG, EmotionType } from '@/store/emotionStore';
import { useState, useEffect, useCallback, useMemo, memo } from 'react';
import { RainbowChatDialog } from '@/components/chat/RainbowChatDialog';
import { ContactParentDialog } from '@/components/ContactParentDialog';
import { BottomNavBar } from '@/components/BottomNavBar';
import { getPublicUrl } from '@/utils/getPublicUrl';

// 情绪对应游戏配置
const EMOTION_TO_GAME: Record<EmotionType, {
  gameId: PlaygroundGame;
  gameName: string;
  gameEmoji: string;
  buttonText: string;
}> = {
  happy: {
    gameId: 'merry-go-round',
    gameName: '慢慢转木马',
    gameEmoji: '🎠',
    buttonText: '去木马游戏放松一下～',
  },
  calm: {
    gameId: 'shadow-house',
    gameName: '影子小屋',
    gameEmoji: '🏠',
    buttonText: '去影子小屋探索一下～',
  },
  angry: {
    gameId: 'bumper-cars',
    gameName: '碰碰车',
    gameEmoji: '🚗',
    buttonText: '去碰碰车游戏释放一下吧～',
  },
  scared: {
    gameId: 'fall-catch',
    gameName: '坠落与接住',
    gameEmoji: '🪂',
    buttonText: '去接住游戏寻找支持～',
  },
  sad: {
    gameId: 'paper-plane',
    gameName: '纸飞机',
    gameEmoji: '✈️',
    buttonText: '去纸飞机游戏倾诉心事～',
  },
  excited: {
    gameId: 'roller-coaster',
    gameName: '过山车',
    gameEmoji: '🎢',
    buttonText: '去过山车游戏释放兴奋～',
  },
};

// AI 回复内容 - 每种情绪 5 条积极鼓励的文案
const AI_RESPONSES: Record<EmotionType, {
  title: string;
  messages: string[];
  emoji: string;
}> = {
  happy: {
    title: '感受到你的开心',
    messages: [
      '开心是一种美好的情绪体验～ 它让你感到轻松、愉悦，也让你身边的人感受到你的温暖。好好享受这一刻吧！',
      '你的笑容像阳光一样温暖！开心的时候，整个世界都在为你跳舞～ 继续保持这份美好吧！',
      '看到你这么开心，真为你感到高兴！快乐是一种能力，你做得很棒～ 让这份喜悦一直陪伴你！',
      '开心的你闪闪发光！记住这种感觉，它是你内心力量的源泉～ 好好珍藏这份美好吧！',
      '快乐的情绪让你更有活力！你值得拥有所有美好的事物～ 尽情享受当下的幸福时光吧！',
    ],
    emoji: '🎉',
  },
  calm: {
    title: '平静的心情',
    messages: [
      '平静是一种安宁的状态～ 它让你能够静静地感受当下，观察自己的内心。这种时刻很珍贵，好好珍惜它。',
      '内心的平静是一种强大的力量！它让你更清楚地看见自己～ 好好享受这份宁静吧！',
      '平静的你很有智慧！能够静下心来感受当下，这是一种难得的能力～ 继续保持这份从容！',
      '心如止水的你真的很棒！平静让你更有力量面对一切～ 好好珍惜这份安宁吧！',
      '在平静中，你能听见内心的声音～ 这是一种珍贵的自我连接，好好感受它吧！',
    ],
    emoji: '🍃',
  },
  angry: {
    title: '生气的情绪',
    messages: [
      '你的感受很重要！生气是在告诉你需要保护自己～ 用健康的方式释放情绪，你值得被理解！',
      '生气是一种充满力量的情绪！它可以转化为积极的行动力～ 相信自己，你能够处理好！',
      '你的情绪是合理的！每个人都有权利表达自己的感受～ 用适当的方式释放，你会感觉更好！',
      '生气时的你也很可爱！记住，情绪只是暂时的～ 你内在的力量远比想象中大！',
      '允许自己有生气的情绪！这是你内心在说话～ 倾听它，然后用爱化解它！',
    ],
    emoji: '💪',
  },
  scared: {
    title: '害怕的感受',
    messages: [
      '害怕是很正常的感受～ 它说明你在乎，也说明你勇敢面对！你比自己想象的更强大！',
      '即使感到害怕，你依然很勇敢！每一次面对恐惧都是一次成长～ 相信自己，你可以的！',
      '害怕不代表软弱！它只是提醒你慢慢来～ 你值得被温柔以待，也值得拥有安全感！',
      '你的感受被看见了！害怕时会让你更谨慎～ 这是保护自己的智慧，你做得很好！',
      '别担心，害怕会过去的！你有足够的能力面对挑战～ 相信自己，你并不孤单！',
    ],
    emoji: '🫂',
  },
  sad: {
    title: '难过的心情',
    messages: [
      '你的感受很重要！难过时给自己一些时间和空间～ 你值得被温柔以待，情绪会慢慢好起来的！',
      '难过的你也需要被爱！允许自己有这种感觉～ 它会在适当的时候慢慢消散，你值得被关怀！',
      '你的情绪是合理的！难过是内心在寻求关怀～ 抱抱自己，你做得已经很好了！',
      '难过的时候更要爱自己！你值得被理解和陪伴～ 相信自己，阳光总在风雨后！',
      '你的感受被看见了！难过是一种需要被安抚的情绪～ 给自己一个拥抱，明天会更好！',
    ],
    emoji: '💙',
  },
  excited: {
    title: '兴奋的感觉',
    messages: [
      '兴奋是一种充满能量的情绪～ 它让你感到充满力量和期待。享受这种充满活力的感觉吧，让它带给你美好的回忆！',
      '你的热情很有感染力！兴奋让你更有创造力～ 好好享受这份激动的心情吧！',
      '兴奋的你真的很迷人！这种充满活力的感觉会带来无限可能～ 好好珍藏这份美好吧！',
      '你的兴奋是生活的调味剂！它让每一天都变得精彩～ 继续保持这份热爱吧！',
      '充满期待的你很棒！兴奋会带来新的机遇和可能～ 相信自己，未来会更好！',
    ],
    emoji: '🌟',
  },
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

// 情绪图标按钮 - 简化版
const EmotionBubble = memo(({
  emotion,
  onClick,
  isSelected,
}: {
  emotion: EmotionType;
  onClick: (emotion: EmotionType) => void;
  isSelected: boolean;
}) => {
  const config = EMOTION_CONFIG[emotion];

  return (
    <button
      onClick={() => {
        playSound('select');
        onClick(emotion);
      }}
      className="flex flex-col items-center gap-2 p-2 md:p-3 relative"
    >
      {/* 对号标记 */}
      {isSelected && (
        <div className="absolute -top-1 -right-1 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center text-white text-sm shadow-lg z-10">
          ✓
        </div>
      )}

      <div
        className="w-14 h-14 md:w-16 md:h-16 rounded-full flex items-center justify-center text-3xl md:text-4xl shadow-xl border-4 border-white/60"
        style={{ background: config.gradient }}
      >
        {config.emoji}
      </div>
      <span className="text-xs md:text-sm font-black text-white drop-shadow-lg bg-black/20 rounded-full px-2 py-0.5">
        {config.label}
      </span>
    </button>
  );
});
EmotionBubble.displayName = 'EmotionBubble';

// 情绪选择面板 - 简化版
const EmotionPanel = memo(({
  onSelect,
  onClose,
  selectedEmotion,
}: {
  onSelect: (emotion: EmotionType) => void;
  onClose: () => void;
  selectedEmotion: EmotionType | null;
}) => {
  const emotions = Object.keys(EMOTION_CONFIG) as EmotionType[];

  return (
    <div className="absolute -top-48 left-1/2 -translate-x-1/2 z-30">
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
            <p className="text-white font-black text-lg md:text-xl drop-shadow-lg mb-2">
              ✨ 今天的心情是什么颜色？✨
            </p>
            <p className="text-white/85 text-xs md:text-sm font-bold">
              选一个吧～
            </p>
          </div>

          <div className="grid grid-cols-3 gap-2 md:gap-4">
            {emotions.map((emotion) => (
              <EmotionBubble
                key={emotion}
                emotion={emotion}
                onClick={onSelect}
                isSelected={selectedEmotion === emotion}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
});
EmotionPanel.displayName = 'EmotionPanel';

// AI 回复弹窗 - 简化版
const AIResponseModal = memo(({
  emotion,
  onClose,
}: {
  emotion: EmotionType;
  onClose: () => void;
}) => {
  const navigateTo = useAppStore((state) => state.navigateTo);
  const startGame = useAppStore((state) => state.startGame);
  const setHasEnteredPlayground = useAppStore((state) => state.setHasEnteredPlayground);

  const response = AI_RESPONSES[emotion];
  const gameConfig = EMOTION_TO_GAME[emotion];

  // 随机选择一条消息
  const randomMessage = useMemo(() => {
    const randomIndex = Math.floor(Math.random() * response.messages.length);
    return response.messages[randomIndex];
  }, [emotion, response.messages]);

  useEffect(() => {
    playSound(emotion);
  }, [emotion]);

  // 跳转到对应游戏
  const handleGoToGame = () => {
    // 设置已进入游乐场（这样可以直接显示游戏列表）
    setHasEnteredPlayground(true);
    // 导航到游乐场
    navigateTo('playground');
    // 延迟一点启动游戏，让场景切换完成
    setTimeout(() => {
      startGame(gameConfig.gameId);
    }, 300);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      <div className="relative bg-gradient-to-br from-pink-100 via-purple-100 to-blue-100 rounded-3xl p-6 md:p-8 shadow-2xl border-4 border-white/60 max-w-md w-full">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 w-10 h-10 rounded-full bg-white/60 hover:bg-white/80 flex items-center justify-center text-xl shadow-lg transition-all z-10"
        >
          ✕
        </button>

        <div className="text-center mb-4">
          <div className="text-6xl mb-3">
            {response.emoji}
          </div>
          <h3 className="text-xl md:text-2xl font-black text-gray-700 mb-2">
            {response.title}
          </h3>
        </div>

        <div
          className="bg-white/60 backdrop-blur-xl rounded-2xl p-4 md:p-6 mb-4 border-2 border-white/40"
        >
          <p className="text-gray-700 text-sm md:text-base leading-relaxed font-medium">
            {randomMessage}
          </p>
        </div>

        {/* 游戏跳转按钮 */}
        <button
          onClick={handleGoToGame}
          className="w-full bg-gradient-to-r from-purple-400 via-pink-400 to-rose-400 text-white font-black text-lg py-4 px-6 rounded-full shadow-xl hover:shadow-2xl transition-all border-4 border-white/60 mb-3 flex items-center justify-center gap-2"
        >
          <span className="text-2xl">{gameConfig.gameEmoji}</span>
          <span>{gameConfig.buttonText}</span>
        </button>

        <button
          onClick={onClose}
          className="w-full bg-gray-200 text-gray-700 font-black text-lg py-3 px-6 rounded-full shadow-xl border-4 border-white/60"
        >
          知道啦～ 💕
        </button>
      </div>
    </div>
  );
});
AIResponseModal.displayName = 'AIResponseModal';

export const HomeScene = () => {
  const navigateTo = useAppStore((state) => state.navigateTo);
  const todayEmotion = useEmotionStore((state) => state.todayEmotion);
  const setTodayEmotion = useEmotionStore((state) => state.setTodayEmotion);
  const checkAndResetDaily = useEmotionStore((state) => state.checkAndResetDaily);
  const checkAndCleanupMonthly = useEmotionStore((state) => state.checkAndCleanupMonthly);
  const unlockAchievement = useAchievementStore((state) => state.unlockAchievement);

  const [showPanel, setShowPanel] = useState(!todayEmotion);
  const [showAIResponse, setShowAIResponse] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [showContactParent, setShowContactParent] = useState(false);

  // 性能优化：使用 useMemo 缓存动画配置
  const titleScaleAnimation = useMemo(() => ({ scale: [1, 1.02, 1] }), []);
  const titleRotateAnimation = useMemo(() => ({ rotate: [0, 8, -8, 0] }), []);
  const characterFloatAnimation = useMemo(() => ({ y: [0, -10, 0] }), []);
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

  // 初始化：检查每曰/每月重置
  useEffect(() => {
    checkAndResetDaily();
    checkAndCleanupMonthly();
  }, []);

  // 获取当前角色图片路径 - 默认卡通 1
  const currentAvatarUrl = getPublicUrl('/卡通数字人.png');

  const handleEmotionSelect = useCallback((emotion: EmotionType) => {
    playSound(emotion);
    setTodayEmotion(emotion);
    setShowPanel(false);
    // 解锁成就：情绪小主人
    unlockAchievement('emotion-master');
    // 如果是害怕或生气，解锁勇敢小战士
    if (emotion === 'scared' || emotion === 'angry') {
      unlockAchievement('brave-warrior');
    }
    // 直接弹出 AI 回复
    setShowAIResponse(true);
  }, [setTodayEmotion, unlockAchievement]);

  const handleOpenPanel = useCallback(() => {
    setShowAIResponse(false);
    setShowPanel(true);
  }, []);

  return (
    <div className="relative min-h-screen w-full overflow-y-auto overflow-x-hidden">
      {/* 渐变背景 - 移除背景图片 */}
      <div className="fixed inset-0 bg-gradient-to-br from-pink-200 via-purple-200 to-blue-200" />

      {/* 顶部标题栏 - 简化版 */}
      <div className="sticky top-0 z-20 flex items-center justify-center p-2 sm:p-3 md:p-4">
        <motion.div
          className="bg-gradient-to-r from-pink-400 via-purple-400 to-blue-400 backdrop-blur-xl rounded-full px-6 py-3 sm:px-8 sm:py-4 shadow-2xl border-4 border-white/60"
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ type: 'spring', bounce: 0.5 }}
        >
          <motion.div className="flex items-center gap-2 sm:gap-3" animate={titleScaleAnimation} transition={{ duration: 3, repeat: Infinity }}>
            <motion.span className="text-2xl sm:text-3xl" animate={titleRotateAnimation} transition={{ duration: 3, repeat: Infinity }}>🏠</motion.span>
            <span className="text-lg sm:text-xl md:text-2xl font-black text-white drop-shadow-2xl">我的家园</span>
            <motion.span className="text-2xl sm:text-3xl" animate={titleRotateAnimation} transition={{ duration: 3, repeat: Infinity }}>✨</motion.span>
          </motion.div>
        </motion.div>
      </div>

      {/* 主内容区域 */}
      <div className="relative z-10 flex flex-col items-center justify-end px-2 sm:px-4 pt-4 sm:pt-8 pb-24 sm:pb-28 min-h-[calc(100vh-60px)] sm:min-h-[calc(100vh-80px)]">
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

            {/* 角色图片 - 保留浮动动画 */}
            <motion.img
              src={currentAvatarUrl}
              alt="卡通数字人"
              className="w-32 h-32 sm:w-40 sm:h-40 md:w-48 md:h-48 lg:w-56 lg:h-56 object-contain drop-shadow-2xl"
              animate={characterFloatAnimation}
              transition={{ duration: 3, repeat: Infinity, delay: 0.15 }}
              onError={(e) => {
                (e.target as HTMLImageElement).src = getPublicUrl('/卡通数字人.png');
              }}
            />

            {/* 闪烁的星星 - 保留动画，优化性能 */}
            {[...Array(3)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute text-lg sm:text-xl md:text-2xl"
                style={{
                  top: i === 0 ? '-15px' : i === 1 ? '50%' : undefined,
                  bottom: i === 2 ? '-15px' : undefined,
                  left: i === 0 ? '50%' : i === 1 ? '-20px' : undefined,
                  right: i === 1 ? undefined : i === 2 ? '-20px' : undefined,
                }}
                animate={starAnimations[i]}
                transition={{ duration: 2, repeat: Infinity, delay: i * 0.5 }}
              >
                ⭐
              </motion.div>
            ))}
          </motion.div>

          {/* 情绪选择面板 */}
          {showPanel && (
            <EmotionPanel
              onSelect={handleEmotionSelect}
              onClose={() => {
                setShowPanel(false);
                setShowAIResponse(false);
              }}
              selectedEmotion={todayEmotion}
            />
          )}
        </motion.div>

        {/* 核心功能按钮区域 - 3 个大按钮 */}
        <div className="flex flex-col items-center gap-3 sm:gap-4 mb-4 sm:mb-6 w-full max-w-xs">

          {/* 按钮 1：选择今天的心情 */}
          <motion.button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleOpenPanel();
            }}
            className="w-full bg-gradient-to-r from-pink-400 via-purple-400 to-blue-400 text-white font-black text-lg sm:text-xl py-4 px-8 rounded-full shadow-2xl border-4 border-white/60 relative z-40 flex items-center justify-center gap-2"
            whileHover={{ scale: 1.05, y: -5 }}
            whileTap={{ scale: 0.95 }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <span className="text-2xl sm:text-3xl">💭</span>
            <span>今天的心情</span>
          </motion.button>

          {/* 按钮 2：和小彩虹聊天 */}
          <motion.button
            onClick={() => setShowChat(true)}
            className="w-full bg-gradient-to-r from-amber-400 via-orange-400 to-rose-400 text-white font-black text-lg sm:text-xl py-4 px-8 rounded-full shadow-2xl border-4 border-white/60 relative z-40 flex items-center justify-center gap-2"
            whileHover={{ scale: 1.05, y: -5 }}
            whileTap={{ scale: 0.95 }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            <span className="text-2xl sm:text-3xl">🌈</span>
            <span>和小彩虹聊天</span>
          </motion.button>

          {/* 按钮 3：联系家长 */}
          <motion.button
            onClick={() => setShowContactParent(true)}
            className="w-full bg-gradient-to-r from-green-400 via-emerald-400 to-teal-400 text-white font-black text-lg sm:text-xl py-4 px-8 rounded-full shadow-2xl border-4 border-white/60 relative z-40 flex items-center justify-center gap-2"
            whileHover={{ scale: 1.05, y: -5 }}
            whileTap={{ scale: 0.95 }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
          >
            <span className="text-2xl sm:text-3xl">💌</span>
            <span>联系家长</span>
          </motion.button>
        </div>

        {/* 提示文字 */}
        <motion.p
          className="text-white/80 text-xs sm:text-sm font-bold text-center mb-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
        >
          ✨ 点击心情或聊天，开始今天的冒险吧！
        </motion.p>

        {/* 底部装饰 - 保留花朵动画，优化性能 */}
        <div className="flex justify-center gap-3 sm:gap-6 mt-2 sm:mt-4">
          {[...Array(5)].map((_, i) => (
            <motion.div
              key={i}
              className="text-lg sm:text-xl md:text-2xl"
              animate={flowerAnimations[i]}
              transition={{ duration: 2.5, repeat: Infinity, delay: i * 0.2 }}
            >
              🌸
            </motion.div>
          ))}
        </div>
      </div>

      {/* 底部导航栏 - 经典 App 布局 */}
      <BottomNavBar hideHome={true} />

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
      {showAIResponse && todayEmotion && (
        <AIResponseModal emotion={todayEmotion} onClose={() => setShowAIResponse(false)} />
      )}

      {/* 与小彩虹对话弹窗 */}
      <AnimatePresence>
        {showChat && <RainbowChatDialog isOpen={showChat} onClose={() => setShowChat(false)} />}
      </AnimatePresence>

      {/* 联系家长弹窗 */}
      <AnimatePresence>
        {showContactParent && <ContactParentDialog onClose={() => setShowContactParent(false)} />}
      </AnimatePresence>
    </div>
  );
};
