import { useState, useCallback, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface BottlePickerProps {
  onPick?: (bottle: PickedBottle) => void;
}

interface PickedBottle {
  id: number;
  content: string;
  from: string;
  mood: string;
}

// 模拟捡到的漂流瓶内容
const SAMPLE_BOTTLES: PickedBottle[] = [
  { id: 1, content: '今天我学会了一首新歌，好开心！🎵', from: '远方的小朋友', mood: '开心' },
  { id: 2, content: '希望每个人都能被温柔对待～💕', from: '神秘的朋友', mood: '平静' },
  { id: 3, content: '我喜欢在雨后看彩虹，你呢？🌈', from: '爱笑的孩子', mood: '幸福' },
  { id: 4, content: '今天考试考得不错，想分享喜悦！⭐', from: '努力的同学', mood: '兴奋' },
  { id: 5, content: '希望能交到更多朋友～🤝', from: '友善的小伙伴', mood: '期待' },
];

export const BottlePicker = memo(({ onPick }: BottlePickerProps) => {
  const [isSearching, setIsSearching] = useState(false);
  const [foundBottle, setFoundBottle] = useState<PickedBottle | null>(null);
  const [showSurprise, setShowSurprise] = useState(false);

  // 开始寻找漂流瓶
  const handleSearch = useCallback(() => {
    setIsSearching(true);
    setFoundBottle(null);
    setShowSurprise(false);

    // 模拟寻找过程
    setTimeout(() => {
      // 随机选一个瓶子
      const bottle = SAMPLE_BOTTLES[Math.floor(Math.random() * SAMPLE_BOTTLES.length)];
      setFoundBottle(bottle);
      setIsSearching(false);
      setShowSurprise(true);
    }, 2000);
  }, []);

  // 收起瓶子
  const handleCollect = useCallback(() => {
    if (foundBottle && onPick) {
      onPick(foundBottle);
    }
    setFoundBottle(null);
    setShowSurprise(false);
  }, [foundBottle, onPick]);

  // 关闭
  const handleClose = useCallback(() => {
    setFoundBottle(null);
    setShowSurprise(false);
  }, []);

  return (
    <>
      {/* 捡漂流瓶按钮 */}
      <motion.button
        onClick={handleSearch}
        disabled={isSearching}
        className="bg-gradient-to-r from-teal-400 to-emerald-400 px-6 py-4 rounded-full shadow-xl border-4 border-white/60"
        whileHover={{ scale: 1.05, y: -5 }}
        whileTap={{ scale: 0.95 }}
        animate={{ rotate: [0, 5, -5, 0] }}
        transition={{ duration: 3, repeat: Infinity }}
      >
        <span className="text-3xl">{isSearching ? '🔍' : '🎁'}</span>
      </motion.button>

      {/* 寻找动画 */}
      <AnimatePresence>
        {isSearching && (
          <motion.div
            className="fixed inset-0 z-[60] flex items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {/* 海洋背景 */}
            <div className="absolute inset-0 bg-gradient-to-b from-sky-300 via-blue-400 to-blue-600" />

            {/* 波浪动画 */}
            <div className="absolute inset-0 overflow-hidden">
              {[...Array(3)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute bottom-0 left-0 right-0 bg-white/20"
                  style={{ height: '30%', top: `${60 + i * 10}%` }}
                  animate={{
                    x: ['-100%', '100%'],
                  }}
                  transition={{
                    duration: 4 - i,
                    repeat: Infinity,
                    ease: 'linear',
                    delay: i * 0.5,
                  }}
                />
              ))}
            </div>

            {/* 放大镜动画 */}
            <motion.div
              className="relative z-10 text-center"
              animate={{
                scale: [1, 1.2, 1],
                rotate: [0, 10, -10, 0],
              }}
              transition={{ duration: 1, repeat: Infinity }}
            >
              <div className="text-8xl mb-4">🔍</div>
              <p className="text-white font-bold text-xl">正在寻找漂流瓶...</p>
            </motion.div>

            {/* 泡泡效果 */}
            {[...Array(15)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-4 h-4 rounded-full bg-white/40"
                style={{
                  left: `${Math.random() * 100}%`,
                  bottom: `${Math.random() * 30}%`,
                }}
                animate={{
                  y: [0, -200 - Math.random() * 200],
                  opacity: [0.6, 0],
                  scale: [1, 0.5],
                }}
                transition={{
                  duration: 2 + Math.random() * 2,
                  repeat: Infinity,
                  delay: Math.random() * 2,
                }}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* 发现惊喜弹窗 */}
      <AnimatePresence>
        {showSurprise && foundBottle && (
          <motion.div
            className="fixed inset-0 z-[70] flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {/* 庆祝背景 */}
            <div className="absolute inset-0 bg-gradient-to-br from-yellow-300 via-pink-300 to-purple-400" />

            {/* 礼花效果 */}
            {[...Array(30)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute text-3xl"
                style={{
                  left: '50%',
                  top: '50%',
                }}
                initial={{
                  x: 0,
                  y: 0,
                  scale: 0,
                  rotate: 0,
                }}
                animate={{
                  x: (Math.random() - 0.5) * 400,
                  y: (Math.random() - 0.5) * 400,
                  scale: [0, 1, 0],
                  rotate: Math.random() * 720 - 360,
                  opacity: [0, 1, 1, 0],
                }}
                transition={{
                  duration: 1.5,
                  delay: i * 0.02,
                }}
              >
                {['🎉', '🎊', '✨', '⭐', '🌟', '💫', '🎈', '🎁'][i % 8]}
              </motion.div>
            ))}

            {/* 内容卡片 */}
            <motion.div
              className="relative bg-white/95 backdrop-blur-xl rounded-3xl p-6 max-w-sm w-full shadow-2xl border-4 border-yellow-400"
              initial={{ scale: 0, rotate: -10 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', bounce: 0.5, delay: 0.3 }}
            >
              {/* 标题 */}
              <div className="text-center mb-4">
                <motion.div
                  className="text-6xl mb-3"
                  animate={{ rotate: [0, 10, -10, 0], scale: [1, 1.2, 1] }}
                  transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 1 }}
                >
                  🎁
                </motion.div>
                <h3 className="text-xl font-black text-gray-700">哇！捡到一个漂流瓶！</h3>
              </div>

              {/* 瓶子内容 */}
              <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-2xl p-4 mb-4 border-2 border-blue-200">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xl">🍾</span>
                  <span className="text-sm text-gray-500">来自：{foundBottle.from}</span>
                </div>
                <p className="text-gray-700 font-bold leading-relaxed">
                  "{foundBottle.content}"
                </p>
                <div className="mt-2 text-right">
                  <span className="text-sm bg-blue-100 text-blue-600 px-2 py-1 rounded-full">
                    {foundBottle.mood}
                  </span>
                </div>
              </div>

              {/* 按钮 */}
              <div className="flex gap-3">
                <motion.button
                  onClick={handleCollect}
                  className="flex-1 bg-gradient-to-r from-teal-400 to-emerald-400 text-white font-black py-3 rounded-full"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  💕 收下祝福
                </motion.button>
                <motion.button
                  onClick={handleClose}
                  className="flex-1 bg-gray-200 text-gray-700 font-bold py-3 rounded-full"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  再看看
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
});

BottlePicker.displayName = 'BottlePicker';