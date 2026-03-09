import { motion } from 'framer-motion';
import { useAppStore, PlaygroundGame } from '@/store/appStore';
import { useState } from 'react';

const GAMES: {
  id: PlaygroundGame;
  name: string;
  emoji: string;
  description: string;
  gradient: string;
  colors: string[];
}[] = [
  {
    id: 'roller-coaster',
    name: '心跳过山车',
    emoji: '🎢',
    description: '今天的心跳是什么颜色？',
    gradient: 'linear-gradient(135deg, #FF6B6B 0%, #FF8E8E 100%)',
    colors: ['#FF6B6B', '#FF8E8E', '#FFA8A8'],
  },
  {
    id: 'fall-catch',
    name: '坠落与接住',
    emoji: '🪂',
    description: '谁会在下面接住你？',
    gradient: 'linear-gradient(135deg, #4DABF7 0%, #74C0FC 100%)',
    colors: ['#4DABF7', '#74C0FC', '#91D5F8'],
  },
  {
    id: 'shadow-house',
    name: '影子小屋',
    emoji: '🏠',
    description: '敢不敢去看看自己的影子？',
    gradient: 'linear-gradient(135deg, #95A5A6 0%, #BDC3C7 100%)',
    colors: ['#95A5A6', '#BDC3C7', '#D5DBDB'],
  },
  {
    id: 'merry-go-round',
    name: '慢慢转木马',
    emoji: '🎠',
    description: '想快就快，想慢就慢',
    gradient: 'linear-gradient(135deg, #FFA94D 0%, #FFB961 100%)',
    colors: ['#FFA94D', '#FFB961', '#FFCC80'],
  },
  {
    id: 'paper-plane',
    name: '纸飞机投掷场',
    emoji: '✈️',
    description: '把想说的话写下来',
    gradient: 'linear-gradient(135deg, #69DB7C 0%, #8CE99A 100%)',
    colors: ['#69DB7C', '#8CE99A', '#A3EBA0'],
  },
  {
    id: 'bumper-cars',
    name: '碰碰车广场',
    emoji: '🚗',
    description: '碰一碰，更快乐',
    gradient: 'linear-gradient(135deg, #DA77F2 0%, #E599F7 100%)',
    colors: ['#DA77F2', '#E599F7', '#EEBEF7'],
  },
];

export const PlaygroundScene = () => {
  const navigateTo = useAppStore((state) => state.navigateTo);
  const startGame = useAppStore((state) => state.startGame);
  const hasEnteredPlayground = useAppStore((state) => state.hasEnteredPlayground);
  const setHasEnteredPlayground = useAppStore((state) => state.setHasEnteredPlayground);

  const handleEnterPlayground = () => {
    setHasEnteredPlayground(true);
  };

  const handleGameSelect = (gameId: PlaygroundGame) => {
    startGame(gameId);
  };

  const handleBackToEntrance = () => {
    setHasEnteredPlayground(false);
  };

  // 入口界面 - 显示游乐场入口图片
  if (!hasEnteredPlayground) {
    return (
      <div className="relative min-h-screen w-full overflow-hidden">
        {/* 渐变背景 */}
        <div className="absolute inset-0 bg-gradient-to-br from-purple-300 via-pink-200 to-yellow-100" />

        {/* 顶部导航 */}
        <div className="absolute top-4 left-4 z-50">
          <motion.button
            onClick={() => navigateTo('home')}
            className="bg-white/80 backdrop-blur-xl px-5 py-2.5 rounded-full shadow-xl font-black text-gray-700 border-4 border-white/60"
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.95 }}
          >
            ← 回家
          </motion.button>
        </div>

        {/* 入口图片容器 */}
        <div className="relative z-10 flex items-center justify-center min-h-screen">
          <motion.div
            className="relative"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            {/* 入口图片 */}
            <motion.img
              src="/游乐场入口.png"
              alt="游乐场入口"
              className="relative rounded-3xl shadow-2xl max-w-full max-h-[80vh] object-contain border-8 border-white/80"
              style={{ maxHeight: '80vh' }}
              whileHover={{ scale: 1.02 }}
            />

            {/* 进入按钮 */}
            <motion.div
              className="absolute -bottom-24 left-1/2 -translate-x-1/2"
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              <motion.button
                onClick={handleEnterPlayground}
                className="bg-gradient-to-r from-purple-400 via-pink-400 to-yellow-400 text-white font-black text-2xl py-5 px-16 rounded-full shadow-2xl border-4 border-white/60 flex items-center gap-3"
                whileHover={{ scale: 1.1, y: -5 }}
                whileTap={{ scale: 0.95 }}
              >
                <span>进入游乐场</span>
                <span>➜</span>
              </motion.button>
            </motion.div>
          </motion.div>
        </div>
      </div>
    );
  }

  // 游乐场主界面 - 优化性能，减少动画
  return (
    <div className="relative min-h-screen w-full overflow-hidden">
      {/* 游乐场背景 */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-300 via-pink-200 to-yellow-100" />

      {/* 顶部彩旗装饰 - 静态 */}
      <div className="absolute top-0 left-0 right-0 z-20 h-16 overflow-hidden">
        <svg viewBox="0 0 400 60" className="w-full h-full" preserveAspectRatio="none">
          {[...Array(20)].map((_, i) => (
            <g key={i}>
              <polygon
                points={`${i * 20},0 ${i * 20 + 10},50 ${i * 20 + 20},0`}
                fill={['#FF6B6B', '#FFA94D', '#FFE066', '#69DB7C', '#4DABF7', '#DA77F2', '#FF85A2'][i % 7]}
                opacity="0.9"
              />
            </g>
          ))}
        </svg>
      </div>

      {/* 顶部导航栏 */}
      <div className="absolute top-4 left-4 right-4 z-50 flex items-center justify-between">
        <motion.button
          onClick={handleBackToEntrance}
          className="bg-white/80 backdrop-blur-xl px-5 py-2.5 rounded-full shadow-xl font-black text-gray-700 border-4 border-white/60"
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.95 }}
        >
          ← 返回入口
        </motion.button>

        <div className="bg-gradient-to-r from-purple-400 via-pink-400 to-yellow-400 backdrop-blur-xl px-6 py-3 rounded-full shadow-2xl border-4 border-white/60">
          <span className="text-xl font-black text-white drop-shadow-lg">🎡 游乐场</span>
        </div>

        <div className="w-24" />
      </div>

      {/* 主内容区域 */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4 py-20">
        {/* 欢迎标题 - 静态 */}
        <div className="mb-8 text-center">
          <div className="text-6xl md:text-8xl mb-4">🎪</div>
          <h1 className="text-3xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-500 via-pink-500 to-yellow-500 drop-shadow-lg">
            欢迎来到游乐场！
          </h1>
          <p className="text-lg md:text-xl font-bold text-purple-700 mt-2 bg-white/60 backdrop-blur-sm rounded-full px-6 py-2 inline-block">
            今天想玩什么呢？✨
          </p>
        </div>

        {/* 游戏卡片网格 */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 w-full max-w-3xl">
          {GAMES.map((game) => (
            <motion.div
              key={game.id}
              className="cursor-pointer rounded-3xl p-4 text-center shadow-xl border-4 border-white/60 overflow-hidden relative h-44 flex flex-col items-center justify-center"
              style={{ background: game.gradient }}
              onClick={() => handleGameSelect(game.id)}
              whileHover={{ scale: 1.08, y: -8 }}
              whileTap={{ scale: 0.95 }}
            >
              {/* 光晕效果 */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/15 to-transparent" />

              {/* Emoji 图标 */}
              <div className="text-6xl mb-2 relative z-10">
                {game.emoji}
              </div>

              {/* 游戏名称 */}
              <h3 className="text-white font-extrabold text-lg drop-shadow-lg relative z-10">
                {game.name}
              </h3>

              {/* 游戏描述 */}
              <p className="text-white/95 text-sm mt-1 font-bold relative z-10">
                {game.description}
              </p>
            </motion.div>
          ))}
        </div>

        {/* 底部提示 */}
        <div className="mt-8 text-center">
          <p className="text-white font-black text-lg bg-gradient-to-r from-purple-500 via-pink-500 to-yellow-500 rounded-full px-8 py-3 inline-block shadow-xl">
            ✨ 点击任意游戏开始冒险吧！ ✨
          </p>
        </div>
      </div>

      {/* 底部草地装饰 - 静态 */}
      <div className="absolute bottom-0 left-0 right-0 h-20 pointer-events-none z-20">
        <svg viewBox="0 0 400 80" className="w-full h-full" preserveAspectRatio="none">
          {[...Array(40)].map((_, i) => (
            <path
              key={i}
              d={`M ${i * 10} 80 Q ${i * 10 + 5} ${30 + (i % 5) * 10} ${i * 10 + 10} 80`}
              fill={['#69DB7C', '#8CE99A', '#A3EBA0', '#B8F0B8', '#95E1D3'][i % 5]}
              opacity="0.9"
            />
          ))}
        </svg>
      </div>
    </div>
  );
};
