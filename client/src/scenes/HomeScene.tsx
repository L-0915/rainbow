import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore, PlaygroundGame, useAchievementStore } from '@/store/appStore';
import { useEmotionStore, EMOTION_CONFIG, EmotionType } from '@/store/emotionStore';
import { useState, useEffect, useCallback, useMemo, memo } from 'react';
import { RainbowChatDialog } from '@/components/chat/RainbowChatDialog';
import { StarMomentDialog } from '@/components/StarMomentDialog';
import { WatchRainbowChat } from '@/components/WatchRainbowChat';
import { WatchStarMoment } from '@/components/WatchStarMoment';
import { BottomNavBar } from '@/components/BottomNavBar';
import { WatchEmotionPicker } from '@/components/WatchEmotionPicker';
import { useIsWatch, useWatchSafeArea } from '@/hooks/useIsWatch';
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

// 情绪图标按钮 - 手表优化版
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
      className="flex flex-col items-center gap-1 p-1.5 relative touch-target"
    >
      {/* 对号标记 */}
      {isSelected && (
        <div className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center text-white text-xs shadow-lg z-10">
          ✓
        </div>
      )}

      <div
        className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 rounded-full flex items-center justify-center text-2xl sm:text-3xl shadow-xl border-2 border-white/60"
        style={{ background: config.gradient }}
      >
        {config.emoji}
      </div>
      <span className="text-xs font-black text-white drop-shadow-lg bg-black/20 rounded-full px-1.5 py-0.5 whitespace-nowrap">
        {config.label}
      </span>
    </button>
  );
});
EmotionBubble.displayName = 'EmotionBubble';

// 情绪选择面板 - 手表优化版
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
    <div className="absolute -top-40 left-1/2 -translate-x-1/2 z-30">
      <div className="relative">
        <div className="bg-white/35 backdrop-blur-xl rounded-2xl p-3 sm:p-4 shadow-2xl border-4 border-white/50 max-w-[280px]">
          <button
            onClick={onClose}
            className="absolute top-1 right-1 w-7 h-7 rounded-full bg-white/60 hover:bg-white/80 flex items-center justify-center text-base shadow-lg z-10"
          >
            ✕
          </button>

          <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-6 h-6 bg-white/35 rotate-45 border-r-4 border-b-4 border-white/50" />

          <div className="text-center mb-3">
            <p className="text-white font-black text-sm sm:text-base drop-shadow-lg mb-1">
              ✨ 今天的心情是什么颜色？✨
            </p>
            <p className="text-white/85 text-xs font-bold">
              选一个吧～
            </p>
          </div>

          <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
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

// AI 回复弹窗 - 手表优化版
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      <div className="relative bg-gradient-to-br from-pink-100 via-purple-100 to-blue-100 rounded-2xl p-4 sm:p-6 shadow-2xl border-4 border-white/60 max-w-[90%] w-full max-h-[80vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-2 right-2 w-8 h-8 rounded-full bg-white/60 hover:bg-white/80 flex items-center justify-center text-lg shadow-lg transition-all z-10"
        >
          ✕
        </button>

        <div className="text-center mb-3">
          <div className="text-4xl sm:text-5xl mb-2">
            {response.emoji}
          </div>
          <h3 className="text-base sm:text-lg font-black text-gray-700 mb-1">
            {response.title}
          </h3>
        </div>

        <div
          className="bg-white/60 backdrop-blur-xl rounded-xl p-3 sm:p-4 mb-3 border-2 border-white/40"
        >
          <p className="text-gray-700 text-xs sm:text-sm leading-relaxed font-medium">
            {randomMessage}
          </p>
        </div>

        {/* 游戏跳转按钮 - 手表优化 */}
        <button
          onClick={handleGoToGame}
          className="w-full bg-gradient-to-r from-purple-400 via-pink-400 to-rose-400 text-white font-black text-sm py-3 px-4 rounded-full shadow-xl hover:shadow-2xl transition-all border-4 border-white/60 mb-2 flex items-center justify-center gap-1"
        >
          <span className="text-xl">{gameConfig.gameEmoji}</span>
          <span>{gameConfig.buttonText}</span>
        </button>

        <button
          onClick={onClose}
          className="w-full bg-gray-200 text-gray-700 font-black text-sm py-2 px-4 rounded-full shadow-xl border-4 border-white/60"
        >
          知道啦～ 💕
        </button>
      </div>
    </div>
  );
});
AIResponseModal.displayName = 'AIResponseModal';

// ============ 手表端专用组件 ============

// 手表端 AI 回复弹窗 - 简化版
const WatchAIResponseModal = memo(({
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
  const config = EMOTION_CONFIG[emotion];

  const randomMessage = useMemo(() => {
    const randomIndex = Math.floor(Math.random() * response.messages.length);
    return response.messages[randomIndex];
  }, [emotion, response.messages]);

  useEffect(() => {
    playSound(emotion);
  }, [emotion]);

  const handleGoToGame = () => {
    setHasEnteredPlayground(true);
    navigateTo('playground');
    setTimeout(() => {
      startGame(gameConfig.gameId);
    }, 300);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex flex-col items-center justify-center p-4"
    >
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      <motion.div
        initial={{ scale: 0.8, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        className="relative w-full max-w-[300px] rounded-3xl shadow-2xl border-4 border-white/50 overflow-hidden"
        style={{ background: config.gradient }}
      >
        {/* 关闭按钮 */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/30 flex items-center justify-center text-white text-lg z-10"
        >
          ✕
        </button>

        {/* 内容 */}
        <div className="p-6 text-center">
          {/* Emoji */}
          <motion.div
            className="text-6xl mb-3"
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            {response.emoji}
          </motion.div>

          {/* 标题 */}
          <h3 className="text-white font-black text-xl mb-2 drop-shadow-lg">
            {response.title}
          </h3>

          {/* 消息 */}
          <p className="text-white/90 text-sm font-medium leading-relaxed mb-4 bg-white/20 backdrop-blur-sm rounded-2xl p-3">
            {randomMessage}
          </p>

          {/* 游戏按钮 */}
          <button
            onClick={handleGoToGame}
            className="w-full bg-white text-gray-700 font-black text-sm py-3 px-4 rounded-full shadow-xl mb-2 flex items-center justify-center gap-2"
          >
            <span className="text-2xl">{gameConfig.gameEmoji}</span>
            <span>{gameConfig.gameName}</span>
          </button>

          <button
            onClick={onClose}
            className="w-full bg-white/30 text-white font-bold text-sm py-2 px-4 rounded-full"
          >
            知道啦 💕
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
});
WatchAIResponseModal.displayName = 'WatchAIResponseModal';

// 手表端首页布局 - 简洁大气
const WatchHomeLayout = memo(() => {
  const todayEmotion = useEmotionStore((state) => state.todayEmotion);
  const setTodayEmotion = useEmotionStore((state) => state.setTodayEmotion);
  const unlockAchievement = useAchievementStore((state) => state.unlockAchievement);

  const [showEmotionPicker, setShowEmotionPicker] = useState(false);
  const [showAIResponse, setShowAIResponse] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [showStarMoment, setShowStarMoment] = useState(false);

  const safePadding = useWatchSafeArea();
  const config = todayEmotion ? EMOTION_CONFIG[todayEmotion] : null;

  const handleEmotionSelect = useCallback((emotion: EmotionType) => {
    playSound(emotion);
    setTodayEmotion(emotion);
    setShowEmotionPicker(false);
    unlockAchievement('emotion-master');
    if (emotion === 'scared' || emotion === 'angry') {
      unlockAchievement('brave-warrior');
    }
    setShowAIResponse(true);
  }, [setTodayEmotion, unlockAchievement]);

  return (
    <div
      className="relative w-full h-full flex flex-col"
      style={{ padding: safePadding }}
    >
      {/* 渐变背景 */}
      <div className="absolute inset-0 bg-gradient-to-br from-pink-300 via-purple-200 to-blue-300" />

      {/* 顶部标题 */}
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="relative z-10 flex items-center justify-center py-3"
      >
        <div className="bg-white/30 backdrop-blur-md rounded-full px-4 py-1.5">
          <span className="text-white font-black text-base drop-shadow-lg">🌈 小彩虹</span>
        </div>
      </motion.div>

      {/* 主内容区 */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-3">
        {/* 今日情绪卡片 */}
        {todayEmotion && config ? (
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            onClick={() => setShowEmotionPicker(true)}
            className="w-full max-w-[200px] aspect-square rounded-3xl shadow-2xl border-4 border-white/50 flex flex-col items-center justify-center cursor-pointer active:scale-95 transition-transform mb-4"
            style={{ background: config.gradient }}
          >
            <motion.div
              className="text-6xl mb-2"
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              {config.emoji}
            </motion.div>
            <div className="text-white font-black text-xl drop-shadow-lg">
              {config.label}
            </div>
          </motion.div>
        ) : (
          <motion.button
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            onClick={() => setShowEmotionPicker(true)}
            className="w-full max-w-[200px] aspect-square rounded-3xl bg-white/40 backdrop-blur-md shadow-2xl border-4 border-white/50 flex flex-col items-center justify-center cursor-pointer active:scale-95 transition-transform mb-4"
          >
            <motion.div
              className="text-6xl mb-2"
              animate={{ scale: [1, 1.15, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              💭
            </motion.div>
            <div className="text-white font-black text-lg drop-shadow-lg">
              今天心情？
            </div>
          </motion.button>
        )}

        {/* 功能按钮 */}
        <div className="flex gap-3 w-full max-w-[220px]">
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowChat(true)}
            className="flex-1 bg-gradient-to-br from-orange-400 to-rose-400 rounded-2xl py-3 shadow-xl border-3 border-white/40 flex flex-col items-center justify-center"
          >
            <span className="text-2xl mb-1">🌈</span>
            <span className="text-white font-bold text-xs">聊天</span>
          </motion.button>

          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowStarMoment(true)}
            className="flex-1 bg-gradient-to-br from-green-400 to-teal-400 rounded-2xl py-3 shadow-xl border-3 border-white/40 flex flex-col items-center justify-center"
          >
            <span className="text-2xl mb-1">⭐</span>
            <span className="text-white font-bold text-xs">发光</span>
          </motion.button>
        </div>
      </div>

      {/* 底部滑动提示 */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="relative z-10 text-center py-2"
      >
        <span className="text-white/60 text-xs font-bold">← 滑动切换场景 →</span>
      </motion.div>

      {/* 情绪选择器 */}
      <AnimatePresence>
        {showEmotionPicker && (
          <WatchEmotionPicker
            onSelect={handleEmotionSelect}
            onClose={() => setShowEmotionPicker(false)}
          />
        )}
      </AnimatePresence>

      {/* AI 回复弹窗 */}
      <AnimatePresence>
        {showAIResponse && todayEmotion && (
          <WatchAIResponseModal
            emotion={todayEmotion}
            onClose={() => setShowAIResponse(false)}
          />
        )}
      </AnimatePresence>

      {/* 聊天弹窗 */}
      <AnimatePresence>
        {showChat && <WatchRainbowChat isOpen={showChat} onClose={() => setShowChat(false)} />}
      </AnimatePresence>

      {/* 闪闪发光弹窗 */}
      <AnimatePresence>
        {showStarMoment && <WatchStarMoment onClose={() => setShowStarMoment(false)} />}
      </AnimatePresence>
    </div>
  );
});
WatchHomeLayout.displayName = 'WatchHomeLayout';

export const HomeScene = () => {
  const isWatch = useIsWatch();

  // 手表端使用简化布局
  if (isWatch) {
    return <WatchHomeLayout />;
  }

  // 手机端使用原有布局
  return <PhoneHomeLayout />;
};

// 手机端布局（原有代码）
const PhoneHomeLayout = () => {
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
    <div className="relative w-full h-full overflow-y-auto overflow-x-hidden">
      {/* 渐变背景 - 移除背景图片 */}
      <div className="absolute inset-0 bg-gradient-to-br from-pink-200 via-purple-200 to-blue-200" />

      {/* 顶部标题栏 - 手表优化 */}
      <div className="sticky top-0 left-0 right-0 z-20 flex items-center justify-center p-2">
        <motion.div
          className="bg-gradient-to-r from-pink-400 via-purple-400 to-blue-400 backdrop-blur-xl rounded-full px-4 py-2 sm:px-6 sm:py-3 shadow-2xl border-4 border-white/60"
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ type: 'spring', bounce: 0.5 }}
        >
          <motion.div className="flex items-center gap-1 sm:gap-2" animate={titleScaleAnimation} transition={{ duration: 3, repeat: Infinity }}>
            <motion.span className="text-xl sm:text-2xl md:text-3xl" animate={titleRotateAnimation} transition={{ duration: 3, repeat: Infinity }}>🏠</motion.span>
            <span className="text-sm sm:text-base md:text-lg font-black text-white drop-shadow-2xl">我的家园</span>
            <motion.span className="text-xl sm:text-2xl md:text-3xl" animate={titleRotateAnimation} transition={{ duration: 3, repeat: Infinity }}>✨</motion.span>
          </motion.div>
        </motion.div>
      </div>

      {/* 主内容区域 - 手表优化布局 */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen w-full px-2 pt-12 pb-20">
        {/* 角色区域 - 手表优化 */}
        <motion.div
          className="relative w-full flex flex-col items-center flex-shrink-0"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.3, type: 'spring', bounce: 0.4 }}
        >
          {/* 数字人区域 - 保留浮动动画，优化性能 */}
          <motion.div className="relative z-10" animate={characterFloatAnimation} transition={{ duration: 3, repeat: Infinity }}>
            {/* 光晕背景 - 静态 */}
            <div className="absolute inset-0 bg-gradient-to-r from-pink-400/30 via-purple-400/30 to-blue-400/30 rounded-full blur-3xl scale-150" />

            {/* 角色图片 - 手表优化尺寸 */}
            <motion.img
              src={currentAvatarUrl}
              alt="卡通数字人"
              className="w-20 h-20 sm:w-28 sm:h-28 md:w-36 md:h-36 lg:w-44 lg:h-44 object-contain drop-shadow-2xl"
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
                className="absolute text-sm sm:text-base md:text-lg"
                style={{
                  top: i === 0 ? '-10px' : i === 1 ? '40%' : undefined,
                  bottom: i === 2 ? '-10px' : undefined,
                  left: i === 0 ? '50%' : i === 1 ? '-15px' : undefined,
                  right: i === 1 ? undefined : i === 2 ? '-15px' : undefined,
                }}
                animate={starAnimations[i]}
                transition={{ duration: 2, repeat: Infinity, delay: i * 0.5 }}
              >
                ⭐
              </motion.div>
            ))}
          </motion.div>

          {/* 情绪选择面板 - 手表优化 */}
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

        {/* 核心功能按钮区域 - 手表优化 */}
        <div className="flex flex-col items-center gap-2 sm:gap-3 mb-2 sm:mb-4 w-full max-w-[280px] flex-shrink-0">

          {/* 按钮 1：选择今天的心情 */}
          <motion.button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleOpenPanel();
            }}
            className="w-full bg-gradient-to-r from-pink-400 via-purple-400 to-blue-400 text-white font-black text-sm sm:text-base py-2 sm:py-3 px-4 sm:px-6 rounded-full shadow-2xl border-4 border-white/60 relative z-40 flex items-center justify-center gap-1 sm:gap-2"
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.95 }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <span className="text-xl sm:text-2xl">💭</span>
            <span>今天的心情</span>
          </motion.button>

          {/* 按钮 2：和小彩虹聊天 */}
          <motion.button
            onClick={() => setShowChat(true)}
            className="w-full bg-gradient-to-r from-amber-400 via-orange-400 to-rose-400 text-white font-black text-sm sm:text-base py-2 sm:py-3 px-4 sm:px-6 rounded-full shadow-2xl border-4 border-white/60 relative z-40 flex items-center justify-center gap-1 sm:gap-2"
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.95 }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            <span className="text-xl sm:text-2xl">🌈</span>
            <span>和小彩虹聊天</span>
          </motion.button>

          {/* 按钮 3：闪闪发光时刻 */}
          <motion.button
            onClick={() => setShowContactParent(true)}
            className="w-full bg-gradient-to-r from-green-400 via-emerald-400 to-teal-400 text-white font-black text-sm sm:text-base py-2 sm:py-3 px-4 sm:px-6 rounded-full shadow-2xl border-4 border-white/60 relative z-40 flex items-center justify-center gap-1 sm:gap-2"
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.95 }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
          >
            <span className="text-xl sm:text-2xl">⭐</span>
            <span>闪闪发光</span>
          </motion.button>
        </div>

        {/* 提示文字 - 手表优化 */}
        <motion.p
          className="text-white/80 text-xs font-bold text-center mb-1 flex-shrink-0"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
        >
          ✨ 点击开始冒险！
        </motion.p>

        {/* 底部装饰 - 手表优化 */}
        <div className="flex justify-center gap-2 sm:gap-4 mt-1 flex-shrink-0">
          {[...Array(5)].map((_, i) => (
            <motion.div
              key={i}
              className="text-base sm:text-lg md:text-xl"
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
      <div className="absolute bottom-0 left-0 right-0 h-12 sm:h-16 bg-gradient-to-t from-green-500/50 to-transparent pointer-events-none z-0">
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

      {/* 闪闪发光时刻弹窗 */}
      <AnimatePresence>
        {showContactParent && <StarMomentDialog onClose={() => setShowContactParent(false)} />}
      </AnimatePresence>
    </div>
  );
};
