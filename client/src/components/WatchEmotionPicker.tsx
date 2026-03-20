import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDrag } from '@use-gesture/react';
import { EMOTION_CONFIG, EmotionType } from '@/store/emotionStore';

interface WatchEmotionPickerProps {
  onSelect: (emotion: EmotionType) => void;
  onClose?: () => void;
}

// 获取所有情绪类型
const EMOTIONS = Object.keys(EMOTION_CONFIG) as EmotionType[];

export const WatchEmotionPicker = ({ onSelect, onClose }: WatchEmotionPickerProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(0);

  const currentEmotion = EMOTIONS[currentIndex];
  const config = EMOTION_CONFIG[currentEmotion];

  // 切换到下一个情绪
  const goToNext = useCallback(() => {
    setDirection(1);
    setCurrentIndex((prev) => (prev + 1) % EMOTIONS.length);
  }, []);

  // 切换到上一个情绪
  const goToPrev = useCallback(() => {
    setDirection(-1);
    setCurrentIndex((prev) => (prev - 1 + EMOTIONS.length) % EMOTIONS.length);
  }, []);

  // 滑动手势
  const bind = useDrag(
    ({ movement: [mx], velocity: [vx], direction: [dx], cancel, tap }) => {
      // 点击事件
      if (tap) {
        onSelect(currentEmotion);
        return;
      }

      // 最小滑动距离阈值
      const threshold = 30;

      if (Math.abs(mx) > threshold || Math.abs(vx) > 0.5) {
        if (dx > 0) {
          goToPrev();
        } else {
          goToNext();
        }
        cancel();
      }
    },
    {
      axis: 'x',
      filterTaps: true,
    }
  );

  // 播放音效
  useEffect(() => {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      const now = audioContext.currentTime;
      oscillator.frequency.setValueAtTime(600, now);
      oscillator.frequency.exponentialRampToValueAtTime(800, now + 0.08);
      gainNode.gain.setValueAtTime(0.15, now);
      gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.12);

      oscillator.start(now);
      oscillator.stop(now + 0.12);
    } catch {
      // 静默失败
    }
  }, [currentIndex]);

  // 动画变体
  const variants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 150 : -150,
      opacity: 0,
      scale: 0.8,
    }),
    center: {
      x: 0,
      opacity: 1,
      scale: 1,
    },
    exit: (direction: number) => ({
      x: direction < 0 ? 150 : -150,
      opacity: 0,
      scale: 0.8,
    }),
  };

  return (
    <div className="fixed inset-0 z-40 flex flex-col items-center justify-center">
      {/* 背景遮罩 */}
      <div
        className="absolute inset-0 bg-black/30 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* 主内容 */}
      <div className="relative z-10 w-full h-full flex flex-col items-center justify-center p-6">
        {/* 顶部标题 */}
        <motion.div
          initial={{ y: -30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="text-white font-black text-lg mb-6 bg-white/20 backdrop-blur-md rounded-full px-4 py-2"
        >
          今天心情如何？
        </motion.div>

        {/* 情绪卡片 */}
        <div className="relative w-full max-w-[280px] aspect-square">
          {/* 左箭头指示 */}
          <motion.div
            className="absolute left-0 top-1/2 -translate-y-1/2 text-white/60 text-2xl z-10"
            animate={{ x: [0, -5, 0] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            ◀
          </motion.div>

          {/* 情绪卡片 */}
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={currentEmotion}
              custom={direction}
              variants={variants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              {...bind()}
              className="absolute inset-0 flex flex-col items-center justify-center rounded-[2rem] shadow-2xl border-4 border-white/40 cursor-pointer active:scale-95 transition-transform"
              style={{ background: config.gradient }}
            >
              {/* 光晕效果 */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent rounded-[2rem]" />

              {/* Emoji */}
              <motion.div
                className="text-7xl sm:text-8xl mb-4 drop-shadow-lg"
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                {config.emoji}
              </motion.div>

              {/* 情绪名称 */}
              <div className="text-white font-black text-2xl sm:text-3xl drop-shadow-lg mb-2">
                {config.label}
              </div>

              {/* 描述 */}
              <div className="text-white/90 font-bold text-sm sm:text-base bg-white/20 backdrop-blur-sm rounded-full px-4 py-1.5">
                {config.description}
              </div>

              {/* 点击提示 */}
              <motion.div
                className="absolute bottom-4 text-white/70 text-xs font-bold"
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                点击选择
              </motion.div>
            </motion.div>
          </AnimatePresence>

          {/* 右箭头指示 */}
          <motion.div
            className="absolute right-0 top-1/2 -translate-y-1/2 text-white/60 text-2xl z-10"
            animate={{ x: [0, 5, 0] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            ▶
          </motion.div>
        </div>

        {/* 底部指示点 */}
        <div className="flex gap-2 mt-6">
          {EMOTIONS.map((emotion, index) => (
            <motion.div
              key={emotion}
              className={`w-2 h-2 rounded-full transition-colors ${
                index === currentIndex ? 'bg-white' : 'bg-white/40'
              }`}
              animate={index === currentIndex ? { scale: [1, 1.3, 1] } : {}}
              transition={{ duration: 0.5, repeat: Infinity }}
            />
          ))}
        </div>

        {/* 关闭按钮 */}
        <motion.button
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          onClick={onClose}
          className="mt-6 text-white/80 font-bold text-sm bg-white/20 backdrop-blur-md rounded-full px-6 py-2"
        >
          取消
        </motion.button>
      </div>
    </div>
  );
};