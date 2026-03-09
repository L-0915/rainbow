import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '@/store/appStore';
import { useEmotionStore, EmotionType } from '@/store/emotionStore';
import { useCharacterStore } from '@/store/characterStore';
import { useState } from 'react';
import { MessageBottle } from '@/components/bottle/MessageBottle';

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

export const GrassScene = () => {
  const navigateTo = useAppStore((state) => state.navigateTo);
  const todayEmotion = useEmotionStore((state) => state.todayEmotion);
  const { config: characterConfig } = useCharacterStore();
  const [characterAction, setCharacterAction] = useState<CharacterAction>('stand');
  const [selectedCloud, setSelectedCloud] = useState<typeof CLOUDS[0] | null>(null);
  const [revealedClouds, setRevealedClouds] = useState<number[]>([]);

  // 获取当前角色图片路径 - 根据 avatarStyle id 映射到实际文件名
  const currentAvatarUrl = characterConfig?.avatarStyle === '卡通2'
    ? '/卡通数字人2.png'
    : '/卡通数字人.png';

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

      {/* 柔和的云朵背景 */}
      <div className="fixed inset-0 opacity-30">
        {[...Array(8)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full bg-white blur-2xl"
            style={{
              width: `${150 + i * 50}px`,
              height: `${80 + i * 30}px`,
              left: `${i * 15}%`,
              top: `${10 + (i % 3) * 15}%`,
            }}
            animate={{
              x: [0, i % 2 === 0 ? 30 : -30, 0],
              y: [0, -15, 0],
            }}
            transition={{
              duration: 5 + i,
              repeat: Infinity,
              delay: i * 0.3,
            }}
          />
        ))}
      </div>

      {/* 背景图片 - 草地 */}
      <motion.div
        className="fixed inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `url('/草地.png')`,
        }}
        animate={{ opacity: 0.5 }}
        transition={{ duration: 1 }}
      />

      {/* ========== 漂浮装饰元素 ========== */}
      {FLOATING_DECORS.map((dec, i) => (
        <motion.div
          key={i}
          className="fixed pointer-events-none z-10"
          style={{
            left: `${dec.x}%`,
            top: `${dec.y}%`,
          }}
          animate={{
            y: [0, -15, 0],
            rotate: [0, 10, -10, 0],
            x: [0, dec.x % 2 === 0 ? 25 : -25, 0],
          }}
          transition={{
            duration: 3 + (i % 2),
            repeat: Infinity,
            delay: i * 0.2,
          }}
        >
          <span className="text-3xl md:text-5xl filter drop-shadow-lg">{dec.emoji}</span>
        </motion.div>
      ))}

      {/* 顶部标题栏 - 固定在顶部 */}
      <motion.div
        className="fixed top-4 left-4 right-4 z-50 flex items-center justify-between"
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        <motion.button
          onClick={() => navigateTo('home')}
          className="bg-white/80 backdrop-blur-xl px-5 py-2.5 rounded-full shadow-xl font-black text-gray-700 border-4 border-white/60"
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.95 }}
        >
          ← 回家
        </motion.button>

        <motion.div
          className="bg-gradient-to-r from-green-400 via-emerald-400 to-teal-400 backdrop-blur-xl px-6 py-3 rounded-full shadow-2xl border-4 border-white/60"
          animate={{
            scale: [1, 1.05, 1],
            boxShadow: ['0 0 20px rgba(100,255,100,0.5)', '0 0 40px rgba(100,255,100,0.8)', '0 0 20px rgba(100,255,100,0.5)'],
          }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <span className="text-xl font-black text-white drop-shadow-lg">🌿 情绪草地</span>
        </motion.div>

        {/* 占位，保持标题居中 */}
        <div className="w-24" />
      </motion.div>

      {/* ========== 天空区域 - 治愈云朵 ========== */}
      <div className="relative z-20 h-72 md:h-80 pt-20">
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
            whileHover={{ scale: 1.15, rotate: 5 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => handleCloudClick(cloud, index)}
          >
            {/* 云朵整体容器 */}
            <motion.div
              animate={{
                y: [0, -10, 0],
                rotate: [0, 5, -5, 0],
              }}
              transition={{ duration: 2.5, repeat: Infinity, delay: index * 0.2 }}
            >
              {/* 发光效果 */}
              <motion.div
                className="absolute inset-0 rounded-full blur-2xl opacity-50"
                style={{ background: cloud.glow }}
                animate={{
                  scale: [1, 1.3, 1],
                  opacity: [0.4, 0.7, 0.4],
                }}
                transition={{ duration: 2, repeat: Infinity }}
              />

              {/* 云朵主体 */}
              <div className="relative">
                {/* 主云体 */}
                <motion.div
                  className="w-24 h-14 rounded-full relative shadow-lg"
                  style={{
                    background: cloud.gradient,
                    boxShadow: `0 8px 32px ${cloud.glow}, inset 0 -4px 8px rgba(255,255,255,0.3)`,
                  }}
                >
                  {/* 顶部小云团 - 更柔和 */}
                  <motion.div
                    className="absolute -top-6 left-4 w-12 h-12 rounded-full"
                    style={{ background: cloud.gradient }}
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 2, repeat: Infinity, delay: index * 0.1 }}
                  />
                  <motion.div
                    className="absolute -top-5 right-5 w-10 h-10 rounded-full"
                    style={{ background: cloud.gradient }}
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 2, repeat: Infinity, delay: index * 0.1 + 0.1 }}
                  />
                  <motion.div
                    className="absolute -top-4 left-1/2 -translate-x-1/2 w-9 h-9 rounded-full"
                    style={{ background: cloud.gradient }}
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 2, repeat: Infinity, delay: index * 0.1 + 0.2 }}
                  />

                  {/* Emoji - 温暖笑脸 */}
                  <motion.div
                    className="absolute top-5 left-1/2 -translate-x-1/2 text-2xl"
                    animate={{
                      scale: [1, 1.3, 1],
                      rotate: [0, 10, -10, 0],
                    }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  >
                    {cloud.emoji}
                  </motion.div>

                  {/* 已点击标记 - 小星星 */}
                  {revealedClouds.includes(index) && (
                    <motion.div
                      className="absolute -top-1 -right-1 text-lg"
                      initial={{ scale: 0, rotate: -180 }}
                      animate={{ scale: 1, rotate: 360 }}
                      transition={{ type: 'spring', bounce: 0.7 }}
                    >
                      ⭐
                    </motion.div>
                  )}
                </motion.div>

                {/* 云朵名称标签 - 不显示具体名称，只显示小标签 */}
                <motion.div
                  className="mt-1 bg-white/70 backdrop-blur-sm rounded-full px-2 py-0.5 shadow-md"
                  animate={{ y: [0, -2, 0] }}
                  transition={{ duration: 2, repeat: Infinity, delay: index * 0.15 }}
                >
                  <span className="text-xs font-bold text-gray-600">☁️</span>
                </motion.div>
              </div>
            </motion.div>
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
              className="relative bg-gradient-to-br from-pink-100 via-purple-50 to-blue-100 rounded-[2.5rem] p-8 max-w-sm w-full shadow-2xl border-4 border-white/80"
              initial={{ scale: 0.5, y: 100, rotate: -10 }}
              animate={{ scale: 1, y: 0, rotate: 0 }}
              exit={{ scale: 0.5, y: 100, rotate: 10 }}
              transition={{ type: 'spring', bounce: 0.7 }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* 顶部装饰 - 彩虹 */}
              <div className="absolute -top-8 left-1/2 -translate-x-1/2 text-6xl">
                <motion.span
                  animate={{ rotate: [0, 10, -10, 0], y: [0, -5, 0] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  🌈
                </motion.span>
              </div>

              {/* 云朵 emoji */}
              <motion.div
                className="text-8xl text-center mb-4 mt-4"
                animate={{ y: [0, -12, 0], rotate: [0, 10, -10, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                {selectedCloud.emoji}
              </motion.div>

              {/* 温暖消息 */}
              <motion.div
                className="bg-white/70 backdrop-blur-xl rounded-3xl p-6 mb-6 border-2 border-white/60"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 }}
              >
                <p className="text-gray-700 text-lg font-bold text-center leading-relaxed">
                  {selectedCloud.message}
                </p>
              </motion.div>

              {/* 装饰元素 */}
              <div className="flex justify-center gap-3 mb-4">
                {['💖', '✨', '🌸', '💫', '🦋'].map((emoji, i) => (
                  <motion.div
                    key={i}
                    className="text-2xl"
                    animate={{
                      y: [0, -10, 0],
                      scale: [0, 1, 0],
                      rotate: [0, 180, 360],
                    }}
                    transition={{
                      duration: 1.5,
                      repeat: Infinity,
                      delay: i * 0.15,
                    }}
                  >
                    {emoji}
                  </motion.div>
                ))}
              </div>

              {/* 确认按钮 */}
              <motion.button
                onClick={() => setSelectedCloud(null)}
                className="w-full bg-gradient-to-r from-pink-400 via-purple-400 to-blue-400 text-white font-black text-xl py-4 px-6 rounded-full shadow-xl border-4 border-white/60"
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
      <div className="relative z-20 flex-1 min-h-[calc(100vh-20rem)] flex flex-col items-center justify-center px-4 pb-8">
        {/* 角色区域 */}
        <div className="relative mb-8">
          <AnimatePresence mode="wait">
            {characterAction === 'stand' ? (
              <motion.div
                key="stand"
                className="relative"
                initial={{ scale: 0.8, opacity: 0, y: 50 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.8, opacity: 0, y: -50 }}
                transition={{ type: 'spring', bounce: 0.5 }}
              >
                {/* 底部光晕 */}
                <motion.div
                  className="absolute inset-0 rounded-full bg-gradient-to-r from-green-400/50 via-emerald-400/50 to-teal-400/50 blur-2xl scale-150"
                  animate={{
                    scale: [1.5, 1.8, 1.5],
                    opacity: [0.5, 0.8, 0.5],
                  }}
                  transition={{ duration: 2, repeat: Infinity }}
                />

                {/* 卡通数字人图片 - 站立 */}
                <motion.img
                  src={currentAvatarUrl}
                  alt="卡通数字人"
                  className="w-32 h-32 md:w-40 md:h-40 object-contain drop-shadow-2xl"
                  initial={{ rotate: 90 }}
                  animate={{
                    rotate: 0,
                    y: [0, -10, 0],
                  }}
                  transition={{ duration: 0.5 }}
                />

                {/* 环绕星星和爱心 */}
                {[...Array(6)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="absolute text-xl md:text-2xl"
                    style={{
                      transform: `rotate(${i * 60}deg) translateX(60px)`,
                    }}
                    animate={{
                      scale: [0, 1, 0],
                      opacity: [0, 1, 0],
                      rotate: [0, 180, 360],
                    }}
                    transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.25 }}
                  >
                    {['✨', '💖', '🌟', '💫', '⭐', '🦋'][i]}
                  </motion.div>
                ))}
              </motion.div>
            ) : characterAction === 'lie' ? (
              <motion.div
                key="lie"
                className="relative"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                transition={{ type: 'spring', bounce: 0.5 }}
              >
                {/* 底部光晕 - 躺下时更柔和 */}
                <motion.div
                  className="absolute inset-0 rounded-full bg-gradient-to-r from-pink-400/50 via-purple-400/50 to-blue-400/50 blur-2xl scale-150"
                  animate={{
                    scale: [1.5, 1.8, 1.5],
                    opacity: [0.5, 0.8, 0.5],
                  }}
                  transition={{ duration: 2, repeat: Infinity }}
                />

                {/* 卡通数字人图片 - 躺下 (旋转 90 度，平躺) */}
                <motion.img
                  src={currentAvatarUrl}
                  alt="卡通数字人"
                  className="w-32 h-32 md:w-40 md:h-40 object-contain drop-shadow-2xl"
                  initial={{ rotate: 0 }}
                  animate={{ rotate: 90 }}
                  transition={{ duration: 0.5 }}
                  style={{ transformOrigin: 'center center' }}
                />

                {/* 漂浮的爱心和星星 */}
                {[...Array(5)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="absolute text-lg md:text-xl"
                    style={{
                      left: `${i * 20}%`,
                      top: '-30px',
                    }}
                    animate={{
                      y: [0, -40 - i * 10],
                      opacity: [0, 1, 0],
                      scale: [0.5, 1, 0.5],
                      rotate: [0, 180, 360],
                    }}
                    transition={{ duration: 2, repeat: Infinity, delay: i * 0.3 }}
                  >
                    {['💖', '✨', '🌸', '💫', '🦋'][i]}
                  </motion.div>
                ))}
              </motion.div>
            ) : (
              <motion.div
                key="roll"
                className="relative"
                initial={{ scale: 0.8, opacity: 0, rotate: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                transition={{ type: 'spring', bounce: 0.5 }}
              >
                {/* 卡通数字人图片 - 打滚 */}
                <motion.img
                  src={currentAvatarUrl}
                  alt="卡通数字人"
                  className="w-32 h-32 md:w-40 md:h-40 object-contain drop-shadow-2xl"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 0.6, repeat: 3 }}
                />

                {/* 打滚灰尘 */}
                {[...Array(4)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="absolute text-lg"
                    style={{
                      left: `${i * 25}%`,
                      bottom: '-10px',
                    }}
                    animate={{
                      y: [0, -20],
                      opacity: [0.8, 0],
                      scale: [1, 0.5],
                    }}
                    transition={{ duration: 0.5, repeat: Infinity, delay: i * 0.15 }}
                  >
                    💨
                  </motion.div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          {/* 温馨提示气泡 */}
          <AnimatePresence>
            {characterAction === 'lie' && (
              <motion.div
                className="absolute -top-20 left-1/2 -translate-x-1/2"
                initial={{ scale: 0, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0, opacity: 0, y: 20 }}
                transition={{ type: 'spring', bounce: 0.6 }}
              >
                <motion.div
                  className="bg-white/95 backdrop-blur-xl rounded-3xl px-8 py-4 shadow-2xl border-4 border-white/60 relative"
                  animate={{ y: [0, -8, 0], rotate: [0, 3, -3, 0] }}
                  transition={{ duration: 2.5, repeat: Infinity }}
                >
                  {/* 气泡尾巴 */}
                  <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-6 h-6 bg-white rotate-45 border-r-2 border-b-2 border-white/60" />

                  <motion.p
                    className="text-gray-700 text-lg font-black text-center whitespace-nowrap"
                    animate={{ scale: [1, 1.02, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    🌿 躺下来，感受风的温柔～ 🍃
                  </motion.p>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* 情绪提示 - 如果今天有记录情绪 */}
        <AnimatePresence>
          {todayEmotion && characterAction === 'stand' && (
            <motion.div
              className="mb-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <div className="bg-white/80 backdrop-blur-xl rounded-full px-6 py-3 shadow-xl border-4 border-white/60">
                <p className="text-gray-700 font-bold flex items-center gap-2">
                  <span>今天的心情：</span>
                  <motion.span
                    className="font-black"
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  >
                    {todayEmotion === 'happy' && '😊 开心'}
                    {todayEmotion === 'calm' && '😌 平静'}
                    {todayEmotion === 'angry' && '😤 生气'}
                    {todayEmotion === 'scared' && '😨 害怕'}
                    {todayEmotion === 'sad' && '😢 委屈'}
                    {todayEmotion === 'excited' && '🤩 兴奋'}
                  </motion.span>
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 操作按钮 */}
        <motion.div
          className="flex gap-4 flex-wrap justify-center"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
        >
          {characterAction === 'stand' ? (
            <>
              <motion.button
                onClick={handleLieDown}
                className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 text-white font-black text-lg py-4 px-8 rounded-full shadow-2xl border-4 border-white/60 flex items-center gap-2"
                whileHover={{ scale: 1.1, rotate: -3 }}
                whileTap={{ scale: 0.95 }}
              >
                <span>躺下</span>
              </motion.button>

              <motion.button
                onClick={handleRoll}
                className="bg-gradient-to-r from-green-400 via-emerald-400 to-teal-400 text-white font-black text-lg py-4 px-8 rounded-full shadow-2xl border-4 border-white/60 flex items-center gap-2"
                whileHover={{ scale: 1.1, rotate: 3 }}
                whileTap={{ scale: 0.95 }}
              >
                <span className="text-2xl">🤸</span>
                <span>打滚</span>
              </motion.button>
            </>
          ) : (
            <motion.button
              onClick={handleStandUp}
              className="bg-gradient-to-r from-pink-400 via-purple-400 to-blue-400 text-white font-black text-lg py-4 px-10 rounded-full shadow-2xl border-4 border-white/60 flex items-center gap-3"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
            >
              <span className="text-2xl">☀️</span>
              <span>站起来</span>
            </motion.button>
          )}
        </motion.div>

        {/* 小提示 */}
        <motion.p
          className="mt-6 text-white/80 text-sm font-bold text-center max-w-md"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
        >
          {characterAction === 'stand' ? '点击天上的云朵，收下它们的温暖祝福吧～' : '静静地躺着/打滚，感受大自然的美好～'}
        </motion.p>
      </div>

      {/* ========== 底部草叶装饰 ========== */}
      <div className="fixed bottom-0 left-0 right-0 h-28 pointer-events-none z-30">
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
            className="absolute text-3xl md:text-4xl"
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
            className="absolute text-2xl"
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

      {/* ========== 阳光射线效果 ========== */}
      <div className="fixed top-0 left-0 right-0 h-64 pointer-events-none z-5 overflow-hidden">
        {[...Array(5)].map((_, i) => (
          <motion.div
            key={`sunray-${i}`}
            className="absolute w-1 h-32 bg-gradient-to-b from-yellow-200/40 to-transparent"
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
};
