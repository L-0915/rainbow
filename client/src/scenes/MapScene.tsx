import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore, SceneType } from '@/store/appStore';
import { useState, useEffect } from 'react';

// 地点配置 - 横版卷轴布局
const LOCATIONS: {
  id: SceneType;
  name: string;
  emoji: string;
  color: string;
  gradient: string;
  x: number;
  y: number;
}[] = [
  {
    id: 'home',
    name: '家园',
    emoji: '🏠',
    color: '#FFA94D',
    gradient: 'linear-gradient(135deg, #FF6B6B 0%, #FFA94D 50%, #FFE066 100%)',
    x: 50,
    y: 40,
  },
  {
    id: 'grass',
    name: '情绪草地',
    emoji: '🌿',
    color: '#69DB7C',
    gradient: 'linear-gradient(135deg, #69DB7C 0%, #8CE99A 50%, #A3EBA0 100%)',
    x: 20,
    y: 65,
  },
  {
    id: 'playground',
    name: '游乐场',
    emoji: '🎡',
    color: '#DA77F2',
    gradient: 'linear-gradient(135deg, #DA77F2 0%, #E599F7 50%, #F78FB3 100%)',
    x: 80,
    y: 65,
  },
];

// 装饰性元素配置 - 静态装饰
const DECORATIONS = [
  { emoji: '🌸', x: 10, y: 20, scale: 1.5 },
  { emoji: '🌺', x: 90, y: 25, scale: 1.3 },
  { emoji: '🌻', x: 15, y: 80, scale: 1.4 },
  { emoji: '🌷', x: 85, y: 85, scale: 1.2 },
  { emoji: '🍄', x: 5, y: 70, scale: 1 },
  { emoji: '🍄', x: 95, y: 75, scale: 1.1 },
  { emoji: '🦋', x: 30, y: 15, scale: 0.8 },
  { emoji: '🦋', x: 70, y: 18, scale: 0.9 },
  { emoji: '🐝', x: 45, y: 22, scale: 0.7 },
  { emoji: '🐞', x: 55, y: 20, scale: 0.6 },
  { emoji: '⭐', x: 8, y: 90, scale: 1 },
  { emoji: '⭐', x: 92, y: 92, scale: 1 },
  { emoji: '🌙', x: 5, y: 10, scale: 1.5 },
  { emoji: '☀️', x: 95, y: 8, scale: 1.8 },
  { emoji: '🌈', x: 50, y: 12, scale: 2 },
  { emoji: '🎈', x: 25, y: 30, scale: 1 },
  { emoji: '🎈', x: 75, y: 28, scale: 1.1 },
  { emoji: '✨', x: 40, y: 35, scale: 0.8 },
  { emoji: '✨', x: 60, y: 38, scale: 0.9 },
  { emoji: '💫', x: 35, y: 88, scale: 1 },
  { emoji: '💫', x: 65, y: 90, scale: 1 },
  { emoji: '🎀', x: 12, y: 55, scale: 0.9 },
  { emoji: '🎀', x: 88, y: 50, scale: 0.9 },
  { emoji: '🍀', x: 22, y: 78, scale: 0.8 },
  { emoji: '🍀', x: 78, y: 80, scale: 0.8 },
];

export const MapScene = () => {
  const navigateTo = useAppStore((state) => state.navigateTo);
  const currentScene = useAppStore((state) => state.currentScene);
  const [targetIndex, setTargetIndex] = useState(0);
  const [isMoving, setIsMoving] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  // 默认角色图片
  const defaultAvatarUrl = '/卡通数字人.png';

  // 数字人位置状态（用于飞行动画）
  const [characterPosition, setCharacterPosition] = useState({ x: 50, y: 28 });

  const handleLocationSelect = (locationId: SceneType, index: number) => {
    if (isMoving) return;

    // 如果已经是目标地点，直接传送（不飞行动画）
    if (index === currentIndex) {
      navigateTo(locationId);
      return;
    }

    setTargetIndex(index);
    setIsMoving(true);

    // 计算弧线路径的中间点（向上拱起）
    const startPos = LOCATIONS[currentIndex];
    const endPos = LOCATIONS[index];
    const midX = (startPos.x + endPos.x) / 2;
    const midY = Math.min(startPos.y, endPos.y) - 20; // 弧线最高点

    // 分段动画：起点 -> 弧线顶点 -> 终点
    const startTime = Date.now();
    const duration = 800; // 总时长 0.8 秒

    const animateFlight = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // 使用二次贝塞尔曲线计算位置
      // t=0 在起点，t=0.5 在顶点，t=1 在终点
      const t = progress;
      const invT = 1 - t;

      // 贝塞尔曲线公式：B(t) = (1-t)²*P0 + 2(1-t)t*P1 + t²*P2
      const newX = invT * invT * startPos.x + 2 * invT * t * midX + t * t * endPos.x;
      const newY = invT * invT * (startPos.y - 12) + 2 * invT * t * midY + t * t * (endPos.y - 12);

      setCharacterPosition({ x: newX, y: newY });

      if (progress < 1) {
        requestAnimationFrame(animateFlight);
      } else {
        // 动画完成，切换场景并更新索引
        navigateTo(locationId);
        setCurrentIndex(index);
        setIsMoving(false);
      }
    };

    requestAnimationFrame(animateFlight);
  };

  // 初始化：根据 currentScene 设置初始位置
  useEffect(() => {
    const idx = LOCATIONS.findIndex(loc => loc.id === currentScene);
    if (idx >= 0) {
      setCurrentIndex(idx);
      setTargetIndex(idx);
      setCharacterPosition({ x: LOCATIONS[idx].x, y: LOCATIONS[idx].y - 12 });
    }
  }, [currentScene]);

  return (
    <div className="relative w-full min-h-screen overflow-y-auto overflow-x-hidden">
      {/* 可滚动内容容器 */}
      <div className="relative min-h-[100vh] pb-20">

        {/* 静态渐变背景 - 移除闪烁动画 */}
        <div className="absolute inset-0 bg-gradient-to-br from-sky-300 via-sky-200 to-green-100 fixed" />

        {/* 网格背景图案 - 静态 */}
        <div
          className="absolute inset-0 opacity-5 pointer-events-none fixed"
          style={{
            backgroundImage: `
              radial-gradient(circle at 50% 50%, #fff 2px, transparent 2px),
              radial-gradient(circle at 50% 50%, #fff 1px, transparent 1px)
            `,
            backgroundSize: '50px 50px, 25px 25px',
          }}
        />

        {/* ========== 装饰元素 - 保留动画 ========== */}
        {DECORATIONS.map((dec, i) => (
          <motion.div
            key={i}
            className="absolute pointer-events-none z-0"
            style={{
              left: `${dec.x}%`,
              top: `${dec.y}%`,
              position: 'fixed',
            }}
            animate={{
              y: [0, -10, 0],
              rotate: [0, 10, -10, 0],
            }}
            transition={{
              duration: 2 + (i % 2),
              repeat: Infinity,
              delay: i * 0.1,
            }}
          >
            <span className="text-4xl md:text-6xl filter drop-shadow-lg">{dec.emoji}</span>
          </motion.div>
        ))}

        {/* ========== 静态云层 ========== */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden fixed">
          {[...Array(6)].map((_, i) => (
            <div
              key={`cloud-${i}`}
              className="absolute"
              style={{
                top: `${(i * 15) % 70 + 10}%`,
                left: `${(i * 25) % 100}%`,
              }}
            >
              <div
                className="w-32 h-16 bg-white rounded-full blur-2xl opacity-20"
                style={{ transform: `scale(${0.5 + i * 0.1})` }}
              />
            </div>
          ))}
        </div>

        {/* ========== 彩虹拱门 - 静态 ========== */}
        <div
          className="absolute left-1/2 -translate-x-1/2 w-[800px] h-[400px] pointer-events-none z-0"
          style={{ top: '10%' }}
        >
          <svg viewBox="0 0 800 400" className="w-full h-full">
            <defs>
              <linearGradient id="rainbowGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#FF6B6B" />
                <stop offset="16%" stopColor="#FFA94D" />
                <stop offset="33%" stopColor="#FFE066" />
                <stop offset="50%" stopColor="#69DB7C" />
                <stop offset="66%" stopColor="#4DABF7" />
                <stop offset="83%" stopColor="#DA77F2" />
                <stop offset="100%" stopColor="#FF6B6B" />
              </linearGradient>
            </defs>
            <path
              d="M 50 400 A 350 350 0 0 1 750 400"
              fill="none"
              stroke="url(#rainbowGradient)"
              strokeWidth="40"
              strokeLinecap="round"
              opacity="0.5"
            />
            <path
              d="M 80 400 A 320 320 0 0 1 720 400"
              fill="none"
              stroke="url(#rainbowGradient)"
              strokeWidth="30"
              strokeLinecap="round"
              opacity="0.4"
            />
            <path
              d="M 110 400 A 290 290 0 0 1 690 400"
              fill="none"
              stroke="url(#rainbowGradient)"
              strokeWidth="20"
              strokeLinecap="round"
              opacity="0.3"
            />
          </svg>
        </div>

        {/* ========== 顶部标题栏 - 固定在顶部 ========== */}
        <motion.div
          className="sticky top-0 left-0 right-0 z-50 flex items-center justify-between p-4"
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5, type: 'spring', bounce: 0.6 }}
        >
          <motion.button
            onClick={() => navigateTo('home')}
            className="bg-gradient-to-r from-pink-400 to-rose-400 backdrop-blur-xl px-4 py-2 rounded-full shadow-2xl border-4 border-white/60 font-black text-white text-sm md:text-lg"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            ← 回家
          </motion.button>

          <div className="bg-gradient-to-r from-purple-400 via-pink-400 to-rose-400 backdrop-blur-xl px-4 py-2 rounded-full shadow-2xl border-4 border-white/60">
            <span className="text-lg md:text-2xl font-black text-white drop-shadow-lg">🗺️ 奇妙世界地图</span>
          </div>

          <div className="w-20 md:w-24" />
        </motion.div>

        {/* ========== 地图路径内容区域 - 可滚动 ========== */}
        <div className="relative min-h-[600px] md:min-h-[800px]">
          {/* 地图路径 - 弯弯曲曲的小路（静态） */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none z-10" viewBox="0 0 100 200" preserveAspectRatio="none">
          <defs>
            <linearGradient id="pathGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#D4A574" />
              <stop offset="50%" stopColor="#E8B896" />
              <stop offset="100%" stopColor="#D4A574" />
            </linearGradient>
          </defs>

          {/* 路径底色 */}
          <path
            d="M 50 40 Q 35 55 20 65 Q 10 75 15 85 Q 20 95 35 100 Q 50 105 65 100 Q 80 95 85 85 Q 90 75 85 65 Q 80 55 65 50 Q 50 45 50 40"
            fill="none"
            stroke="url(#pathGradient)"
            strokeWidth="8"
            strokeLinecap="round"
            opacity="0.8"
          />

          {/* 路径虚线装饰 */}
          <path
            d="M 50 40 Q 35 55 20 65 Q 10 75 15 85 Q 20 95 35 100 Q 50 105 65 100 Q 80 95 85 85 Q 90 75 85 65 Q 80 55 65 50 Q 50 45 50 40"
            fill="none"
            stroke="#FFF"
            strokeWidth="2"
            strokeLinecap="round"
            strokeDasharray="3 2"
            opacity="0.6"
          />
        </svg>

        {/* 地点按钮容器 - 相对定位 */}
        <div className="relative h-[500px] md:h-[600px]">
          {/* ========== 地点按钮 - 全部开放，移除锁定 ========== */}
          {LOCATIONS.map((location, index) => {
          const isCurrentLocation = currentScene === location.id;

          return (
            <motion.div
              key={location.id}
              className="absolute z-20"
              style={{ left: `${location.x}%`, top: `${location.y}%` }}
              initial={{ scale: 0, opacity: 0, rotate: -180 }}
              animate={{ scale: 1, opacity: 1, rotate: 0 }}
              transition={{ delay: 0.5 + index * 0.3, type: 'spring', bounce: 0.7 }}
            >
              {/* 地点按钮主体 */}
              <motion.button
                className={`relative w-28 h-28 md:w-36 md:h-36 rounded-full flex flex-col items-center justify-center shadow-2xl transform -translate-x-1/2 -translate-y-1/2 border-4 border-white/80`}
                style={{
                  background: location.gradient
                }}
                whileHover={{ scale: 1.1, rotate: 3 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleLocationSelect(location.id, index)}
              >
                {/* 内层光晕 */}
                <div className="absolute inset-2 rounded-full bg-white/20 blur-md" />

                {/* Emoji 图标 */}
                <motion.span
                  className="text-5xl md:text-6xl mb-2 drop-shadow-2xl"
                  animate={{
                    rotate: isCurrentLocation ? [0, 10, -10, 0] : [0, 5, -5, 0],
                    scale: isCurrentLocation ? [1, 1.15, 1] : [1, 1.05, 1],
                  }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  {location.emoji}
                </motion.span>

                {/* 地点名称 */}
                <span className="font-black text-sm md:text-base drop-shadow-2xl text-white">
                  {location.name}
                </span>

                {/* 当前所在光环 */}
                {isCurrentLocation && (
                  <>
                    <motion.div
                      className="absolute -inset-4 rounded-full border-4 border-white/80"
                      animate={{ scale: [1, 1.2, 1], opacity: [1, 0.6, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    />
                  </>
                )}
              </motion.button>
            </motion.div>
          );
        })}
        </div>
        </div>

        {/* ========== 卡通数字人 - 沿弧线飞行 ========== */}
        {/* 数字人使用 fixed 定位，跟随滚动 */}
        <AnimatePresence>
          <motion.div
            className="fixed z-30 pointer-events-none"
            style={{
              left: `${characterPosition.x}%`,
              top: `${characterPosition.y}%`,
              transform: 'translateX(-50%)',
            }}
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0.8 }}
            transition={{ duration: 0.3 }}
          >
            {/* 小人容器 */}
            <motion.div
              className="relative"
              animate={isMoving ? {
                // 移动时轻微摇摆
                rotate: [0, 10, -10, 0],
              } : {
                // 静止时轻微浮动
                y: [0, -6, 0],
                rotate: [0, 3, -3, 0],
              }}
              transition={{ duration: isMoving ? 0.3 : 2, repeat: Infinity }}
            >
              {/* 底部光晕 - 静态 */}
              <div
                className="absolute inset-0 rounded-full bg-gradient-to-r from-pink-400/40 via-purple-400/40 to-blue-400/40 blur-2xl scale-150"
                style={{ opacity: 0.6 }}
              />

              {/* 卡通数字人图片 */}
              <motion.img
                src={defaultAvatarUrl}
                alt="卡通数字人"
                className="w-20 h-20 md:w-28 md:h-28 object-contain drop-shadow-2xl relative z-10"
                style={{ filter: 'drop-shadow(0 0 20px rgba(255,255,255,0.6))' }}
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                  e.target.nextElementSibling?.classList.remove('hidden');
                }}
              />

              {/* 备用 emoji (图片加载失败时显示) */}
              <motion.div
                className="hidden absolute inset-0 flex items-center justify-center text-6xl md:text-7xl drop-shadow-2xl z-10"
                animate={{ y: [0, -6, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                🧚
              </motion.div>

              {/* 移动时的流线效果 - 简化版 */}
              {isMoving && (
                <>
                  <motion.div
                    className="absolute text-lg -left-4 top-1/2"
                    initial={{ opacity: 0, x: 0 }}
                    animate={{ opacity: [0.8, 0], x: -20 }}
                    transition={{ duration: 0.3, repeat: Infinity }}
                  >
                    💨
                  </motion.div>
                </>
              )}
            </motion.div>

            {/* 对话气泡 - 简化动画 */}
            <motion.div
              className="absolute -top-14 left-1/2 -translate-x-1/2 bg-gradient-to-r from-pink-400 via-purple-400 to-blue-400 rounded-2xl px-4 py-2 shadow-2xl whitespace-nowrap border-3 border-white/60 z-20"
              initial={{ scale: 0, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <span className="text-sm md:text-base font-black text-white drop-shadow-lg">
                {isMoving ? '🚀 出发咯～' : '🎉 到啦！'}
              </span>
              {/* 气泡尾巴 */}
              <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-gradient-to-r from-pink-400 to-purple-400 rotate-45 border-r-2 border-b-2 border-white/60" />
            </motion.div>
          </motion.div>
        </AnimatePresence>

        {/* ========== 底部装饰草地带 - 简化动画 ========== */}
        <div className="relative bottom-0 left-0 right-0 h-24 pointer-events-none z-20 mt-8">
          {/* 第一层草地 - 静态 */}
          <svg viewBox="0 0 400 80" className="w-full h-full">
            {[...Array(30)].map((_, i) => (
              <path
                key={`grass1-${i}`}
                d={`M ${i * 13.5} 80 Q ${i * 13.5 + 7} 40 ${i * 13.5 + 13.5} 80`}
                fill={['#69DB7C', '#8CE99A', '#A3EBA0', '#B8F0B8'][i % 4]}
                opacity="0.7"
              />
            ))}
          </svg>

          {/* 花朵装饰 - 静态 */}
          {[...Array(6)].map((_, i) => (
            <div
              key={`flower-${i}`}
              className="absolute text-2xl md:text-3xl"
              style={{
                left: `${15 + i * 15}%`,
                bottom: `${15 + (i % 2) * 10}px`,
              }}
            >
              {['🌸', '🌺', '🌷', '🌻', '🌼', '💐'][i]}
            </div>
          ))}
        </div>

        {/* ========== 浮动提示 - 静态 ========== */}
        <motion.div
          className="sticky bottom-4 left-0 right-0 z-40 flex justify-center px-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <div className="bg-white/90 backdrop-blur-xl px-4 py-2 rounded-full shadow-2xl border-4 border-white/60">
            <span className="text-xs md:text-base font-bold text-gray-700">
              👆 点击地点，小人会飞过去哦～ 🏃‍♀️
            </span>
          </div>
        </motion.div>

      </div>
    </div>
  );
};
