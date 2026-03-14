import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '@/store/appStore';
import { useEmotionStore } from '@/store/emotionStore';
import { useCharacterStore } from '@/store/characterStore';
import { useState, useMemo, useCallback, memo, useEffect } from 'react';
import { MessageBottle } from '@/components/bottle/MessageBottle';
import { BottomNavBar } from '@/components/BottomNavBar';
import { getPublicUrl } from '@/utils/getPublicUrl';

type CharacterAction = 'stand' | 'lie' | 'roll';

// 温暖治愈系云朵 - 只有积极正面的名称
const CLOUDS = [
  {
    name: '阳光云',
    emoji: '☀️',
    color: '#FFD43B',
    gradient: 'linear-gradient(135deg, #FFD43B 0%, #FFA94D 100%)',
    glow: '#FFD43B66',
    message: '你真的很棒！每一天都在闪闪发光呢～✨',
    position: { top: 15, left: 10 },
  },
  {
    name: '勇气云',
    emoji: '💪',
    color: '#FFB6C1',
    gradient: 'linear-gradient(135deg, #FFB6C1 0%, #FFA0A0 100%)',
    glow: '#FFB6C166',
    message: '你已经做得很好了，继续加油哦～🌟',
    position: { top: 25, left: 75 },
  },
  {
    name: '希望云',
    emoji: '🌈',
    color: '#A8E6CF',
    gradient: 'linear-gradient(135deg, #A8E6CF 0%, #88D8B7 100%)',
    glow: '#A8E6CF66',
    message: '美好的事情正在向你走来～💖',
    position: { top: 45, left: 15 },
  },
  {
    name: '温暖云',
    emoji: '🧡',
    color: '#FFAAA5',
    gradient: 'linear-gradient(135deg, #FFAAA5 0%, #FF8B94 100%)',
    glow: '#FFAAA566',
    message: '你值得被这个世界温柔以待～🌸',
    position: { top: 35, left: 65 },
  },
  {
    name: '快乐云',
    emoji: '😊',
    color: '#C7CEEA',
    gradient: 'linear-gradient(135deg, #C7CEEA 0%, #B5C0E0 100%)',
    glow: '#C7CEEA66',
    message: '你的笑容是最美的风景～🦋',
    position: { top: 55, left: 80 },
  },
  {
    name: '幸运云',
    emoji: '🍀',
    color: '#FFDAC1',
    gradient: 'linear-gradient(135deg, #FFDAC1 0%, #FFC4A5 100%)',
    glow: '#FFDAC166',
    message: '幸运一直都在你身边哦～⭐',
    position: { top: 65, left: 35 },
  },
];

// 漂浮装饰物 - 温暖可爱风格
const FLOATING_DECORS = [
  { emoji: '🌸', x: 5, y: 50, scale: 1.2 },
  { emoji: '🌺', x: 90, y: 45, scale: 1.3 },
  { emoji: '🦋', x: 15, y: 35, scale: 1 },
  { emoji: '🦋', x: 80, y: 30, scale: 1.1 },
  { emoji: '🐝', x: 35, y: 40, scale: 0.8 },
  { emoji: '✨', x: 55, y: 25, scale: 0.9 },
  { emoji: '🌼', x: 10, y: 60, scale: 1.1 },
  { emoji: '🌻', x: 85, y: 65, scale: 1.4 },
  { emoji: '💫', x: 45, y: 20, scale: 1 },
  { emoji: '🎀', x: 70, y: 55, scale: 0.9 },
  { emoji: '🍄', x: 92, y: 70, scale: 1 },
  { emoji: '🌷', x: 8, y: 75, scale: 1.2 },
];

export const GrassScene = memo(() => {
  const navigateTo = useAppStore((state) => state.navigateTo);
  const todayEmotion = useEmotionStore((state) => state.todayEmotion);
  const { config: characterConfig } = useCharacterStore();
  const [characterAction, setCharacterAction] = useState<CharacterAction>('stand');
  const [selectedCloud, setSelectedCloud] = useState<typeof CLOUDS[0] | null>(null);
  const [revealedClouds, setRevealedClouds] = useState<number[]>([]);

  // 获取当前角色图片路径 - 根据 avatarStyle id 映射到实际文件名
  const currentAvatarUrl = characterConfig?.avatarStyle === '卡通2'
    ? getPublicUrl('/卡通数字人2.png')
    : getPublicUrl('/卡通数字人.png');

  const handleLieDown = () => {
    setCharacterAction('lie');
  };

  const handleRoll = () => {
    setCharacterAction('roll');
    setTimeout(() => {
      setCharacterAction('stand');
    }, 2000);
  };

  const handleStandUp = () => {
    setCharacterAction('stand');
  };

  const handleCloudClick = (cloud: typeof CLOUDS[0], index: number) => {
    setSelectedCloud(cloud);
    if (!revealedClouds.includes(index)) {
      setRevealedClouds([...revealedClouds, index]);
    }
  };

  return (
    <div className="relative min-h-screen w-full overflow-hidden">
      {/* ========== 温暖天空背景 ========== */}
      <div className="fixed inset-0 bg-gradient-to-b from-sky-300 via-sky-200 to-green-100" />

      {/* 柔和的云朵背景 - 性能优化：改为静态，减少动画 */}
      <div className="fixed inset-0 opacity-20 pointer-events-none">
        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-white blur-3xl"
            style={{
              width: `${150 + i * 50}px`,
              height: `${80 + i * 30}px`,
              left: `${i * 20}%`,
              top: `${10 + (i % 3) * 15}%`,
            }}
          />
        ))}
      </div>

      {/* 背景图片 - 草地 - 性能优化：静态背景 */}
      <div
        className="fixed inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `url('${getPublicUrl('/草地.png')}')`,
          opacity: 0.5,
        }}
      />

      {/* ========== 漂浮装饰元素 - 性能优化：减少数量，简化动画 ========== */}
      {FLOATING_DECORS.slice(0, 6).map((dec, i) => (
        <motion.div
          key={i}
          className="fixed pointer-events-none z-10"
          style={{
            left: `${dec.x}%`,
            top: `${dec.y}%`,
          }}
          animate={{
            y: [0, -8, 0],
          }}
          transition={{
            duration: 4 + (i % 2),
            repeat: Infinity,
            delay: i * 0.3,
          }}
        >
          <span className="text-3xl md:text-5xl filter drop-shadow-lg">{dec.emoji}</span>
        </motion.div>
      ))}

      {/* 顶部标题栏 - 固定在顶部 */}
      <motion.div
        className="fixed top-2 sm:top-4 left-1/2 -translate-x-1/2 z-50"
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        <motion.div
          className="bg-gradient-to-r from-green-400 via-emerald-400 to-teal-400 backdrop-blur-xl px-3 py-1.5 sm:px-6 sm:py-3 rounded-full shadow-2xl border-4 border-white/60"
          animate={{
            scale: [1, 1.05, 1],
            boxShadow: ['0 0 20px rgba(100,255,100,0.5)', '0 0 40px rgba(100,255,100,0.8)', '0 0 20px rgba(100,255,100,0.5)'],
          }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <span className="text-sm sm:text-xl font-black text-white drop-shadow-lg">🌿 情绪草地</span>
        </motion.div>
      </motion.div>

      {/* ========== 天空区域 - 治愈云朵 ========== */}
      <div className="relative z-20 h-48 sm:h-56 md:h-64 lg:h-72 pt-12 sm:pt-16 md:pt-20">
        {CLOUDS.map((cloud, index) => (
          <motion.div
            key={cloud.name}
            className="absolute cursor-pointer z-30"
            style={{
              top: `${cloud.position.top}%`,
              left: `${cloud.position.left}%`,
            }}
            initial={{ scale: 0, opacity: 0, rotate: -180 }}
            animate={{ scale: 1, opacity: 1, rotate: 0 }}
            transition={{ delay: 0.3 + index * 0.15, type: 'spring', bounce: 0.7 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => handleCloudClick(cloud, index)}
          >
            {/* 云朵整体容器 - 性能优化：减少动画 */}
            <div>
              {/* 发光效果 - 静态 */}
              <div
                className="absolute inset-0 rounded-full blur-xl sm:blur-2xl opacity-40"
                style={{ background: cloud.glow }}
              />

              {/* 云朵主体 */}
              <div className="relative">
                {/* 主云体 */}
                <div
                  className="w-16 h-10 sm:w-20 sm:h-12 md:w-24 md:h-14 rounded-full relative shadow-lg"
                  style={{
                    background: cloud.gradient,
                    boxShadow: `0 8px 32px ${cloud.glow}, inset 0 -4px 8px rgba(255,255,255,0.3)`,
                  }}
                >
                  {/* 顶部小云团 - 静态 */}
                  <div
                    className="absolute -top-4 sm:-top-6 left-2 sm:left-4 w-8 sm:w-12 h-8 sm:h-12 rounded-full"
                    style={{ background: cloud.gradient }}
                  />
                  <div
                    className="absolute -top-3 sm:-top-5 right-3 sm:right-5 w-6 sm:w-10 h-6 sm:h-10 rounded-full"
                    style={{ background: cloud.gradient }}
                  />
                  <div
                    className="absolute -top-2 sm:-top-4 left-1/2 -translate-x-1/2 w-5 sm:w-9 h-5 sm:h-9 rounded-full"
                    style={{ background: cloud.gradient }}
                  />

                  {/* Emoji - 温暖笑脸 - 静态 */}
                  <div className="absolute top-2 sm:top-5 left-1/2 -translate-x-1/2 text-lg sm:text-2xl">
                    {cloud.emoji}
                  </div>

                  {/* 已点击标记 - 小星星 */}
                  {revealedClouds.includes(index) && (
                    <div className="absolute -top-0 sm:-top-1 -right-0 sm:-right-1 text-sm sm:text-lg">
                      ⭐
                    </div>
                  )}
                </div>

                {/* 云朵名称标签 - 静态 */}
                <div className="mt-0.5 sm:mt-1 bg-white/70 backdrop-blur-sm rounded-full px-1.5 sm:px-2 py-0.5 shadow-md">
                  <span className="text-xs font-bold text-gray-600">☁️</span>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* ========== 云朵消息弹窗 - 极致温暖治愈 ========== */}
      <AnimatePresence>
        {selectedCloud && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedCloud(null)}
          >
            {/* 背景遮罩 - 柔和 */}
            <div className="absolute inset-0 bg-pink-200/40 backdrop-blur-sm" />

            {/* 弹窗内容 */}
            <motion.div
              className="relative bg-gradient-to-br from-pink-100 via-purple-50 to-blue-100 rounded-[2.5rem] p-4 sm:p-6 md:p-8 max-w-sm w-full shadow-2xl border-4 border-white/80"
              initial={{ scale: 0.5, y: 100, rotate: -10 }}
              animate={{ scale: 1, y: 0, rotate: 0 }}
              exit={{ scale: 0.5, y: 100, rotate: 10 }}
              transition={{ type: 'spring', bounce: 0.7 }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* 顶部装饰 - 彩虹 - 静态 */}
              <div className="absolute -top-8 left-1/2 -translate-x-1/2 text-4xl sm:text-6xl">
                🌈
              </div>

              {/* 云朵 emoji - 静态 */}
              <div className="text-6xl sm:text-8xl text-center mb-3 sm:mb-4 mt-4">
                {selectedCloud.emoji}
              </div>

              {/* 温暖消息 */}
              <motion.div
                className="bg-white/70 backdrop-blur-xl rounded-3xl p-4 sm:p-6 mb-4 sm:mb-6 border-2 border-white/60"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 }}
              >
                <p className="text-gray-700 text-base sm:text-lg font-bold text-center leading-relaxed">
                  {selectedCloud.message}
                </p>
              </motion.div>

              {/* 装饰元素 - 性能优化：简化动画 */}
              <div className="flex justify-center gap-2 sm:gap-3 mb-3 sm:mb-4">
                {['💖', '✨', '🌸'].map((emoji, i) => (
                  <div key={i} className="text-xl sm:text-2xl">
                    {emoji}
                  </div>
                ))}
              </div>

              {/* 确认按钮 */}
              <motion.button
                onClick={() => setSelectedCloud(null)}
                className="w-full bg-gradient-to-r from-pink-400 via-purple-400 to-blue-400 text-white font-black text-base sm:text-xl py-3 px-4 sm:py-4 sm:px-6 rounded-full shadow-xl border-4 border-white/60"
                whileHover={{ scale: 1.05, y: -3 }}
                whileTap={{ scale: 0.95 }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                谢谢你～ 💕
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ========== 草地区域 - 角色互动 ========== */}
      <div className="relative z-20 flex-1 min-h-[calc(100vh-16rem)] sm:min-h-[calc(100vh-20rem)] flex flex-col items-center justify-center px-4 pb-4 sm:pb-8">
        {/* 角色区域 */}
        <div className="relative mb-4 sm:mb-8">
          <AnimatePresence mode="wait">
            {characterAction === 'stand' ? (
              <div
                key="stand"
                className="relative"
              >
                {/* 底部光晕 - 静态 */}
                <div
                  className="absolute inset-0 rounded-full bg-gradient-to-r from-green-400/50 via-emerald-400/50 to-teal-400/50 blur-2xl scale-150 opacity-50"
                />

                {/* 卡通数字人图片 - 站立 - 性能优化：减少动画 */}
                <img
                  src={currentAvatarUrl}
                  alt="卡通数字人"
                  className="w-24 h-24 sm:w-32 sm:h-32 md:w-40 md:h-40 object-contain drop-shadow-2xl"
                />
              </div>
            ) : characterAction === 'lie' ? (
              <div
                key="lie"
                className="relative"
              >
                {/* 底部光晕 - 躺下时更柔和 - 静态 */}
                <div
                  className="absolute inset-0 rounded-full bg-gradient-to-r from-pink-400/50 via-purple-400/50 to-blue-400/50 blur-2xl scale-150 opacity-50"
                />

                {/* 卡通数字人图片 - 躺下 (旋转 90 度，平躺) */}
                <img
                  src={currentAvatarUrl}
                  alt="卡通数字人"
                  className="w-24 h-24 sm:w-32 sm:h-32 md:w-40 md:h-40 object-contain drop-shadow-2xl"
                  style={{ transform: 'rotate(90deg)', transformOrigin: 'center center' }}
                />
              </div>
            ) : (
              <div
                key="roll"
                className="relative"
              >
                {/* 卡通数字人图片 - 打滚 - 使用 CSS 动画 */}
                <img
                  src={currentAvatarUrl}
                  alt="卡通数字人"
                  className="w-24 h-24 sm:w-32 sm:h-32 md:w-40 md:h-40 object-contain drop-shadow-2xl animate-spin"
                  style={{ animationDuration: '0.6s', animationIterationCount: 3 }}
                />
              </div>
            )}
          </AnimatePresence>

          {/* 温馨提示气泡 - 性能优化：简化动画 */}
          {characterAction === 'lie' && (
            <div
              className="absolute -top-16 sm:-top-20 left-1/2 -translate-x-1/2"
            >
              <div
                className="bg-white/95 backdrop-blur-xl rounded-3xl px-6 py-2 sm:px-8 sm:py-4 shadow-2xl border-4 border-white/60 relative"
              >
                {/* 气泡尾巴 */}
                <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-6 h-6 bg-white rotate-45 border-r-2 border-b-2 border-white/60" />

                <p className="text-gray-700 text-base sm:text-lg font-black text-center whitespace-nowrap">
                  🌿 躺下来，感受风的温柔～ 🍃
                </p>
              </div>
            </div>
          )}
        </div>

        {/* 情绪提示 - 如果今天有记录情绪 */}
        {todayEmotion && characterAction === 'stand' && (
          <div className="mb-4 sm:mb-6">
            <div className="bg-white/80 backdrop-blur-xl rounded-full px-4 py-2 sm:px-6 sm:py-3 shadow-xl border-4 border-white/60">
              <p className="text-gray-700 font-bold flex items-center gap-2 text-sm sm:text-base">
                <span>今天的心情：</span>
                <span className="font-black">
                  {todayEmotion === 'happy' && '😊 开心'}
                  {todayEmotion === 'calm' && '😌 平静'}
                  {todayEmotion === 'angry' && '😤 生气'}
                  {todayEmotion === 'scared' && '😨 害怕'}
                  {todayEmotion === 'sad' && '😢 委屈'}
                  {todayEmotion === 'excited' && '🤩 兴奋'}
                </span>
              </p>
            </div>
          </div>
        )}

        {/* 操作按钮 - 性能优化：减少动画 */}
        <div className="flex gap-2 sm:gap-4 flex-wrap justify-center">
          {characterAction === 'stand' ? (
            <>
              <button
                onClick={handleLieDown}
                className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 text-white font-black text-sm sm:text-lg py-2 px-4 sm:py-4 sm:px-8 rounded-full shadow-2xl border-4 border-white/60 flex items-center gap-1 sm:gap-2"
              >
                <span>躺下</span>
              </button>

              <button
                onClick={handleRoll}
                className="bg-gradient-to-r from-green-400 via-emerald-400 to-teal-400 text-white font-black text-sm sm:text-lg py-2 px-4 sm:py-4 sm:px-8 rounded-full shadow-2xl border-4 border-white/60 flex items-center gap-1 sm:gap-2"
              >
                <span className="text-xl sm:text-2xl">🤸</span>
                <span>打滚</span>
              </button>
            </>
          ) : (
            <button
              onClick={handleStandUp}
              className="bg-gradient-to-r from-pink-400 via-purple-400 to-blue-400 text-white font-black text-sm sm:text-lg py-2 px-4 sm:py-4 sm:px-10 rounded-full shadow-2xl border-4 border-white/60 flex items-center gap-2 sm:gap-3"
            >
              <span className="text-xl sm:text-2xl">☀️</span>
              <span>站起来</span>
            </button>
          )}
        </div>

        {/* 小提示 */}
        <p className="mt-4 sm:mt-6 text-white/80 text-xs sm:text-sm font-bold text-center max-w-xs sm:max-w-md">
          {characterAction === 'stand' ? '点击天上的云朵，收下它们的温暖祝福吧～' : '静静地躺着/打滚，感受大自然的美好～'}
        </p>
      </div>

      {/* ========== 底部草叶装饰 ========== */}
      <div className="fixed bottom-0 left-0 right-0 h-20 sm:h-24 md:h-28 pointer-events-none z-30">
        {/* 草叶 */}
        <svg viewBox="0 0 400 100" className="w-full h-full">
          {[...Array(30)].map((_, i) => (
            <motion.path
              key={i}
              d={`M ${i * 13.5} 100 Q ${i * 13.5 + 7} ${40 + (i % 4) * 15} ${i * 13.5 + 13.5} 100`}
              fill={['#69DB7C', '#8CE99A', '#A3EBA0', '#B8F0B8'][i % 4]}
              opacity="0.85"
              animate={{
                d: `M ${i * 13.5} 100 Q ${i * 13.5 + 7} ${30 + (i % 4) * 15} ${i * 13.5 + 13.5} 100`,
              }}
              transition={{ duration: 2, repeat: Infinity, delay: i * 0.08 }}
            />
          ))}
        </svg>

        {/* 花朵 */}
        {[...Array(8)].map((_, i) => (
          <motion.div
            key={`flower-${i}`}
            className="absolute text-2xl sm:text-3xl md:text-4xl"
            style={{
              left: `${8 + i * 12}%`,
              bottom: `${20 + (i % 2) * 20}px`,
            }}
            animate={{
              rotate: [0, 12, -12, 0],
              scale: [1, 1.2, 1],
            }}
            transition={{ duration: 2.5, repeat: Infinity, delay: i * 0.15 }}
          >
            {['🌸', '🌺', '🌷', '🌻', '🌼', '💐', '🌹', '🌸'][i]}
          </motion.div>
        ))}

        {/* 小蘑菇 */}
        {[...Array(3)].map((_, i) => (
          <motion.div
            key={`mushroom-${i}`}
            className="absolute text-xl sm:text-2xl"
            style={{
              left: `${15 + i * 35}%`,
              bottom: `${10 + i * 5}px`,
            }}
            animate={{
              scale: [1, 1.1, 1],
              y: [0, -3, 0],
            }}
            transition={{ duration: 2, repeat: Infinity, delay: i * 0.3 }}
          >
            🍄
          </motion.div>
        ))}
      </div>

      {/* 漂流瓶组件 */}
      <MessageBottle />

      {/* 底部导航栏 */}
      <BottomNavBar />

      {/* ========== 阳光射线效果 ========== */}
      <div className="fixed top-0 left-0 right-0 h-48 sm:h-56 md:h-64 pointer-events-none z-5 overflow-hidden">
        {[...Array(5)].map((_, i) => (
          <motion.div
            key={`sunray-${i}`}
            className="absolute w-1 h-24 sm:h-28 md:h-32 bg-gradient-to-b from-yellow-200/40 to-transparent"
            style={{
              left: `${15 + i * 18}%`,
              top: '-20px',
              transform: `rotate(${(i - 2) * 10}deg)`,
            }}
            animate={{
              opacity: [0.3, 0.6, 0.3],
              height: ['20%', '40%', '20%'],
            }}
            transition={{ duration: 3, repeat: Infinity, delay: i * 0.4 }}
          />
        ))}
      </div>
    </div>
  );
});
GrassScene.displayName = 'GrassScene';
