import { useAppStore, PlaygroundGame, useAchievementStore } from '@/store/appStore';
import { useEmotionStore, EMOTION_CONFIG, EmotionType } from '@/store/emotionStore';
import { useState, useEffect, useCallback, memo } from 'react';
import { RainbowChatDialog } from '@/components/chat/RainbowChatDialog';
import { BottomNavBar } from '@/components/BottomNavBar';
import { getPublicUrl } from '@/utils/getPublicUrl';

// 情绪对应游戏配置
const EMOTION_TO_GAME: Record<EmotionType, {
  gameId: PlaygroundGame;
  gameName: string;
  gameEmoji: string;
  buttonText: string;
}> = {
  happy: { gameId: 'merry-go-round', gameName: '慢慢转木马', gameEmoji: '🎠', buttonText: '去木马游戏放松一下～' },
  calm: { gameId: 'shadow-house', gameName: '影子小屋', gameEmoji: '🏠', buttonText: '去影子小屋探索一下～' },
  angry: { gameId: 'bumper-cars', gameName: '碰碰车', gameEmoji: '🚗', buttonText: '去碰碰车游戏释放一下吧～' },
  scared: { gameId: 'fall-catch', gameName: '坠落与接住', gameEmoji: '🪂', buttonText: '去接住游戏寻找支持～' },
  sad: { gameId: 'paper-plane', gameName: '纸飞机', gameEmoji: '✈️', buttonText: '去纸飞机游戏倾诉心事～' },
  excited: { gameId: 'roller-coaster', gameName: '过山车', gameEmoji: '🎢', buttonText: '去过山车游戏释放兴奋～' },
};

// AI 回复内容
const AI_RESPONSES: Record<EmotionType, { title: string; messages: string[]; emoji: string }> = {
  happy: {
    title: '感受到你的开心',
    messages: [
      '开心是一种美好的情绪体验～ 它让你感到轻松、愉悦，好好享受这一刻吧！',
      '你的笑容像阳光一样温暖！继续保有这份美好吧！',
      '看到你这么开心，真为你感到高兴！快乐是一种能力，你做得很棒～',
    ],
    emoji: '🎉',
  },
  calm: {
    title: '平静的心情',
    messages: [
      '平静是一种安宁的状态～ 好好珍惜这份宁静吧！',
      '内心的平静是一种强大的力量！继续保持这份从容！',
      '在平静中，你能听见内心的声音～ 这是一种珍贵的自我连接！',
    ],
    emoji: '🍃',
  },
  angry: {
    title: '生气的情绪',
    messages: [
      '你的感受很重要！生气是在告诉你需要保护自己～',
      '生气是一种充满力量的情绪！它可以转化为积极的行动力～',
      '允许自己有生气的情绪！这是你内心在说话～ 倾听它，然后用爱化解它！',
    ],
    emoji: '💪',
  },
  scared: {
    title: '害怕的感受',
    messages: [
      '害怕是很正常的感受～ 你比自己想象的更强大！',
      '即使感到害怕，你依然很勇敢！每一次面对恐惧都是一次成长～',
      '别担心，害怕会过去的！你有足够的能力面对挑战～',
    ],
    emoji: '🫂',
  },
  sad: {
    title: '难过的心情',
    messages: [
      '你的感受很重要！难过时给自己一些时间和空间～',
      '难过的你也需要被爱！允许自己有这种感觉～',
      '你的情绪是合理的！给自己一个拥抱，明天会更好！',
    ],
    emoji: '💙',
  },
  excited: {
    title: '兴奋的感觉',
    messages: [
      '兴奋是一种充满能量的情绪～ 享受这种充满活力的感觉吧！',
      '你的热情很有感染力！好好享受这份激动的心情吧！',
      '兴奋的你真的很迷人！这种充满活力的感觉会带来无限可能～',
    ],
    emoji: '🌟',
  },
};

// 简单音效
const playSound = (type: 'select' | EmotionType) => {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    const now = ctx.currentTime;

    if (type === 'select') {
      osc.frequency.setValueAtTime(800, now);
      osc.frequency.exponentialRampToValueAtTime(1200, now + 0.1);
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
      osc.start(now);
      osc.stop(now + 0.15);
    } else {
      // 情绪音效
      const freqs = { happy: 784, calm: 294, angry: 150, scared: 400, sad: 262, excited: 1047 };
      osc.frequency.setValueAtTime(523, now);
      osc.frequency.exponentialRampToValueAtTime(freqs[type] || 523, now + 0.2);
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
      osc.start(now);
      osc.stop(now + 0.3);
    }
  } catch {}
};

// 情绪按钮 - 纯 CSS 动画
const EmotionBubble = memo(({ emotion, onClick, isSelected }: {
  emotion: EmotionType;
  onClick: (emotion: EmotionType) => void;
  isSelected: boolean;
}) => {
  const config = EMOTION_CONFIG[emotion];

  return (
    <button
      onClick={() => { playSound('select'); onClick(emotion); }}
      className="flex flex-col items-center gap-1 p-2 transition-transform active:scale-90"
    >
      {isSelected && (
        <div className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center text-white text-xs shadow-lg z-10">✓</div>
      )}
      <div
        className="w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center text-2xl shadow-lg border-2 border-white/60 transition-transform hover:scale-110"
        style={{ background: config.gradient }}
      >
        {config.emoji}
      </div>
      <span className="text-xs font-bold text-white drop-shadow bg-black/20 rounded-full px-2 py-0.5">{config.label}</span>
    </button>
  );
});
EmotionBubble.displayName = 'EmotionBubble';

// 情绪选择面板
const EmotionPanel = memo(({ onSelect, onClose, selectedEmotion }: {
  onSelect: (emotion: EmotionType) => void;
  onClose: () => void;
  selectedEmotion: EmotionType | null;
}) => {
  const emotions = Object.keys(EMOTION_CONFIG) as EmotionType[];

  return (
    <div className="absolute -top-40 left-1/2 -translate-x-1/2 z-30 animate-fade-in">
      <div className="bg-white/90 backdrop-blur rounded-2xl p-4 shadow-2xl border-2 border-white/50 max-w-[280px]">
        <button onClick={onClose} className="absolute top-2 right-2 w-7 h-7 rounded-full bg-white/80 flex items-center justify-center text-gray-600 hover:bg-white transition-colors">✕</button>
        <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-white/90 rotate-45" />

        <p className="text-center text-gray-700 font-bold text-sm mb-3">✨ 今天的心情是什么颜色？</p>

        <div className="grid grid-cols-3 gap-2">
          {emotions.map((emotion) => (
            <EmotionBubble key={emotion} emotion={emotion} onClick={onSelect} isSelected={selectedEmotion === emotion} />
          ))}
        </div>
      </div>
    </div>
  );
});
EmotionPanel.displayName = 'EmotionPanel';

// AI 回复弹窗
const AIResponseModal = memo(({ emotion, onClose }: { emotion: EmotionType; onClose: () => void }) => {
  const navigateTo = useAppStore((state) => state.navigateTo);
  const startGame = useAppStore((state) => state.startGame);
  const setHasEnteredPlayground = useAppStore((state) => state.setHasEnteredPlayground);

  const response = AI_RESPONSES[emotion];
  const gameConfig = EMOTION_TO_GAME[emotion];
  const config = EMOTION_CONFIG[emotion];
  const randomMessage = response.messages[Math.floor(Math.random() * response.messages.length)];

  useEffect(() => { playSound(emotion); }, [emotion]);

  const handleGoToGame = () => {
    setHasEnteredPlayground(true);
    navigateTo('playground');
    setTimeout(() => startGame(gameConfig.gameId), 300);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative w-full max-w-sm rounded-3xl shadow-2xl border-4 border-white/50 overflow-hidden" style={{ background: config.gradient }}>
        <button onClick={onClose} className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/30 flex items-center justify-center text-white text-lg z-10">✕</button>

        <div className="p-6 text-center">
          <div className="text-5xl mb-3 animate-bounce-slow">{response.emoji}</div>
          <h3 className="text-white font-black text-xl mb-2 drop-shadow">{response.title}</h3>
          <p className="text-white/90 text-sm font-medium leading-relaxed mb-4 bg-white/20 backdrop-blur rounded-2xl p-3">{randomMessage}</p>

          <button onClick={handleGoToGame} className="w-full bg-white text-gray-700 font-bold text-sm py-3 px-4 rounded-full shadow-lg mb-2 flex items-center justify-center gap-2 hover:bg-gray-100 transition-colors">
            <span className="text-2xl">{gameConfig.gameEmoji}</span>
            <span>{gameConfig.gameName}</span>
          </button>

          <button onClick={onClose} className="w-full bg-white/30 text-white font-bold text-sm py-2 px-4 rounded-full hover:bg-white/40 transition-colors">知道啦 💕</button>
        </div>
      </div>
    </div>
  );
});
AIResponseModal.displayName = 'AIResponseModal';

// ============ 手机端 ============

export const HomeScene = memo(() => {
  const navigateTo = useAppStore((state) => state.navigateTo);
  const todayEmotion = useEmotionStore((state) => state.todayEmotion);
  const setTodayEmotion = useEmotionStore((state) => state.setTodayEmotion);
  const checkAndResetDaily = useEmotionStore((state) => state.checkAndResetDaily);
  const unlockAchievement = useAchievementStore((state) => state.unlockAchievement);

  const [showPanel, setShowPanel] = useState(!todayEmotion);
  const [showAIResponse, setShowAIResponse] = useState(false);
  const [showChat, setShowChat] = useState(false);

  useEffect(() => { checkAndResetDaily(); }, []);

  const currentAvatarUrl = getPublicUrl('/卡通数字人.png');

  const handleEmotionSelect = useCallback((emotion: EmotionType) => {
    playSound(emotion);
    setTodayEmotion(emotion);
    setShowPanel(false);
    unlockAchievement('emotion-master');
    if (emotion === 'scared' || emotion === 'angry') unlockAchievement('brave-warrior');
    setShowAIResponse(true);
  }, [setTodayEmotion, unlockAchievement]);

  return (
    <div className="relative w-full h-full overflow-y-auto overflow-x-hidden">
      {/* 背景渐变 */}
      <div className="absolute inset-0 bg-gradient-to-br from-pink-200 via-purple-200 to-blue-200" />

      {/* 顶部标题 */}
      <div className="sticky top-0 left-0 right-0 z-20 flex items-center justify-center p-3">
        <div className="bg-gradient-to-r from-pink-400 via-purple-400 to-blue-400 backdrop-blur rounded-full px-5 py-2 shadow-lg border-2 border-white/60">
          <span className="text-white font-black drop-shadow">🏠 我的家园 ✨</span>
        </div>
      </div>

      {/* 主内容 */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen w-full px-4 pt-8 pb-20">
        {/* 角色 */}
        <div className="relative mb-4 animate-float">
          <div className="absolute inset-0 bg-gradient-to-r from-pink-400/30 via-purple-400/30 to-blue-400/30 rounded-full blur-2xl scale-150" />
          <img src={currentAvatarUrl} alt="角色" className="w-32 h-32 sm:w-40 sm:h-40 object-contain drop-shadow-xl" loading="lazy" />
        </div>

        {/* 情绪面板 */}
        {showPanel && (
          <EmotionPanel
            onSelect={handleEmotionSelect}
            onClose={() => setShowPanel(false)}
            selectedEmotion={todayEmotion}
          />
        )}

        {/* 功能按钮 - 简化为2个核心功能 */}
        <div className="flex flex-col items-center gap-4 w-full max-w-xs">
          <button onClick={() => setShowPanel(true)} className="w-full bg-gradient-to-r from-pink-400 via-purple-400 to-blue-400 text-white font-bold py-4 px-6 rounded-full shadow-lg border-2 border-white/60 flex items-center justify-center gap-2 transition-transform active:scale-95 text-lg">
            <span className="text-2xl">💭</span> 今天的心情
          </button>

          <button onClick={() => setShowChat(true)} className="w-full bg-gradient-to-r from-amber-400 via-orange-400 to-rose-400 text-white font-bold py-4 px-6 rounded-full shadow-lg border-2 border-white/60 flex items-center justify-center gap-2 transition-transform active:scale-95 text-lg">
            <span className="text-2xl">🌈</span> 和小彩虹聊天
          </button>
        </div>

        {/* 底部装饰 */}
        <div className="flex gap-3 mt-6">
          {['🌸', '🌺', '🌷', '🌼', '🌻'].map((flower, i) => (
            <span key={i} className="text-xl animate-sway" style={{ animationDelay: `${i * 0.1}s` }}>{flower}</span>
          ))}
        </div>
      </div>

      {/* 底部导航 */}
      <BottomNavBar hideHome={true} />

      {/* 底部草地 */}
      <div className="absolute bottom-0 left-0 right-0 h-10 bg-gradient-to-t from-green-500/40 to-transparent pointer-events-none" />

      {/* 弹窗 */}
      {showAIResponse && todayEmotion && <AIResponseModal emotion={todayEmotion} onClose={() => setShowAIResponse(false)} />}
      {showChat && <RainbowChatDialog isOpen={showChat} onClose={() => setShowChat(false)} />}
    </div>
  );
});

HomeScene.displayName = 'HomeScene';