import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect, useCallback, useRef } from 'react';
import { useAppStore } from '@/store/appStore';

// 心率区间
const HEART_RATE_ZONES = {
  veryLow: { min: 0, max: 50, color: '#A8E6CF', name: '平静', emoji: '😌' },
  low: { min: 50, max: 70, color: '#FFD43B', name: '放松', emoji: '😊' },
  normal: { min: 70, max: 90, color: '#FFA94D', name: '正常', emoji: '🙂' },
  high: { min: 90, max: 110, color: '#FF8E8E', name: '加速', emoji: '💓' },
  veryHigh: { min: 110, max: 200, color: '#FF6B6B', name: '激动', emoji: '🔥' },
};

// 积极鼓励话语库 - 无评判，纯粹陪伴和鼓励
const ENCOURAGEMENTS = {
  // 心跳平稳时
  calm: [
    '你现在的状态很好～ 🌸',
    '这样的节奏很棒哦～ ✨',
    '继续保持，你做得很好～ 💖',
    '和你一起感受这份美好～ 🌙',
    '慢慢来，很舒服呢～ 🍃',
    '你做得真的很棒～ 💕',
    '我在这里，陪你一起感受～ 🫂',
    '这样的感觉很好～ 🌟',
  ],
  // 心跳上升时
  rising: [
    '心跳在变化，没关系的～ 💕',
    '感受它，接纳它～ 🌈',
    '深呼吸，我在这里陪着你～ 🦋',
    '你的心跳很有活力～ ✨',
    '这份感觉，我陪着你～ 🌟',
    '心跳在告诉你，它很有力量～ 💗',
    '慢慢感受，不用着急～ 🌊',
    '你做得很好～ 👏',
  ],
  // 心跳很快时
  high: [
    '心跳很快，但你很安全～ 🛡️',
    '这种感觉会过去的，加油～ 💪',
    '慢慢来，不用着急～ 🐢',
    '你做得很好，继续前进～ 🚀',
    '你的心跳很有力量～ 💗',
    '我陪着你，一起感受～ 🫂',
    '这样的节奏也可以～ 🎵',
    '你做得已经很好了～ 👏',
  ],
  // 心跳下降时
  falling: [
    '心跳在慢慢平稳下来～ 🌊',
    '你正在调节得很好～ 👏',
    '太棒了，你在进步～ 🎉',
    '慢慢来，很舒服～ 🍃',
    '心跳在休息呢～ 😌',
    '这样的感觉很好～ 💖',
    '我在这里，陪着你～ 💕',
    '你做得真的很棒～ ✨',
  ],
  // 收集成功时
  collect: [
    '好棒！收集到了～ ⭐',
    '继续加油～ 💫',
    '连击！你太厉害了～ 🔥',
    '哇哦～好厉害～ 🎊',
    '你又收集到一个～ 🎁',
    '太棒了，继续～ ✨',
    '你好棒呀～ 💖',
    '做得真好～ 👏',
  ],
  // 撞到障碍物时（安慰，不评判）
  hit: [
    '没关系，我陪着你～ 💕',
    '下次一定会更好～ 🌟',
    '继续加油哦～ 💖',
    '这没什么大不了的～ 🌈',
    '我在这里，继续前进～ 🫂',
    '慢慢来，不着急～ 🐢',
    '你做得已经很好了～ 👏',
    '继续前进～ ✨',
  ],
  // 心跳特别快时的鼓励
  veryFast: [
    '你的心跳好有活力～ 💗',
    '这是很有能量的感觉～ ✨',
    '我陪着你，一起感受～ 🫂',
    '这样的感觉也可以～ 🌈',
    '你做得很好～ 👏',
    '慢慢感受，不用着急～ 🌊',
  ],
  // 心跳特别慢时的鼓励
  verySlow: [
    '你很平静，很舒服～ 😌',
    '慢慢来，很好～ 🌙',
    '这样的节奏很棒～ 🎵',
    '我在这里，陪着你～ 💕',
    '这样的状态很好～ 🌸',
    '继续感受这份宁静～ ✨',
  ],
};

type CollectibleType = 'heart' | 'star' | 'flower' | 'butterfly';

interface Collectible {
  id: number;
  type: CollectibleType;
  x: number;
  y: number;
  collected: boolean;
}

interface Obstacle {
  id: number;
  x: number;
  y: number;
  hit: boolean;
}

export const RollerCoasterGame = () => {
  const navigateTo = useAppStore((state) => state.navigateTo);
  const endGame = useAppStore((state) => state.endGame);

  // 游戏状态
  const [gameStarted, setGameStarted] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [maxCombo, setMaxCombo] = useState(0);
  const [timeLeft, setTimeLeft] = useState(60);

  // 心率状态
  const [heartRate, setHeartRate] = useState(75);
  const [prevHeartRate, setPrevHeartRate] = useState(75);
  const [isWatchConnected, setIsWatchConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [showBreathing, setShowBreathing] = useState(false);
  const [breathPhase, setBreathPhase] = useState<'inhale' | 'hold' | 'exhale'>('inhale');
  const [breathCount, setBreathCount] = useState(0);
  const [heartRateTrend, setHeartRateTrend] = useState<'stable' | 'rising' | 'falling'>('stable');
  const [currentEncouragement, setCurrentEncouragement] = useState('准备好了吗？开始吧！✨');
  const [showEncouragement, setShowEncouragement] = useState(false);
  const [heartRateHistory, setHeartRateHistory] = useState<number[]>([75, 75, 75, 75, 75]);

  // 小火车状态 - 用户可以控制
  const [trainY, setTrainY] = useState(50); // 垂直位置 0-100%
  const [trainSpeed, setTrainSpeed] = useState(0); // 前进速度
  const [isAccelerating, setIsAccelerating] = useState(false);

  // 收集物和障碍物 - 从右向左移动
  const [collectibles, setCollectibles] = useState<Collectible[]>([]);
  const [obstacles, setObstacles] = useState<Obstacle[]>([]);

  // 特效
  const [particles, setParticles] = useState<{ id: number; x: number; y: number; emoji: string }[]>([]);

  const gameLoopRef = useRef<number>();
  const containerRef = useRef<HTMLDivElement>(null);
  const lastSpawnTime = useRef(0);

  // 获取心率区间
  const getHeartRateZone = (hr: number) => {
    if (hr < HEART_RATE_ZONES.veryLow.max) return HEART_RATE_ZONES.veryLow;
    if (hr < HEART_RATE_ZONES.low.max) return HEART_RATE_ZONES.low;
    if (hr < HEART_RATE_ZONES.normal.max) return HEART_RATE_ZONES.normal;
    if (hr < HEART_RATE_ZONES.high.max) return HEART_RATE_ZONES.high;
    return HEART_RATE_ZONES.veryHigh;
  };

  const currentZone = getHeartRateZone(heartRate);

  // 显示鼓励语
  const showEncouragementMessage = useCallback((message: string) => {
    setCurrentEncouragement(message);
    setShowEncouragement(true);
    setTimeout(() => setShowEncouragement(false), 2500);
  }, []);

  // 连接手表
  const connectWatch = useCallback(async () => {
    setIsConnecting(true);
    await new Promise(resolve => setTimeout(resolve, 2000));
    setIsWatchConnected(true);
    setIsConnecting(false);
    showEncouragementMessage('手表已连接！心跳会随游戏变化哦～ 💕');
  }, [showEncouragementMessage]);

  const disconnectWatch = useCallback(() => {
    setIsWatchConnected(false);
  }, []);

  // 心率模拟
  useEffect(() => {
    const interval = setInterval(() => {
      setPrevHeartRate(heartRate);
      setHeartRate(prev => {
        const change = Math.floor(Math.random() * 11) - 5;
        const newHR = Math.max(50, Math.min(150, prev + change));
        setHeartRateHistory(h => [...h.slice(-10), newHR]);

        const diff = newHR - prev;
        if (diff > 5) setHeartRateTrend('rising');
        else if (diff < -5) setHeartRateTrend('falling');
        else setHeartRateTrend('stable');

        return newHR;
      });
    }, 2000);
    return () => clearInterval(interval);
  }, [heartRate]);

  // 游戏循环 - 生成物品和障碍物
  useEffect(() => {
    if (!gameStarted || gameOver) return;

    // 根据心跳计算速度系数 (心跳越快，速度越快)
    const getSpeedMultiplier = (hr: number) => {
      // 基础心率 70，速度系数 1.0
      // 心跳 120 时，速度系数约 1.7
      return 0.6 + (hr - 50) / 140;
    };

    const gameLoop = (timestamp: number) => {
      // 生成物品
      if (timestamp - lastSpawnTime.current > 800) {
        const types: CollectibleType[] = ['heart', 'star', 'flower', 'butterfly'];
        const newY = Math.random() * 70 + 15; // 15-85%

        // 生成收集物
        if (Math.random() > 0.3) {
          setCollectibles(prev => [...prev, {
            id: timestamp,
            type: types[Math.floor(Math.random() * types.length)],
            x: 100,
            y: newY,
            collected: false,
          }]);
        }

        // 生成障碍物
        if (Math.random() > 0.6) {
          setObstacles(prev => [...prev, {
            id: timestamp + 1,
            x: 100,
            y: Math.random() * 70 + 15,
            hit: false,
          }]);
        }

        lastSpawnTime.current = timestamp;
      }

      // 移动物品 - 速度由心跳决定
      const speedMultiplier = getSpeedMultiplier(heartRate);
      const baseSpeed = isAccelerating ? 1.5 : 0.8;
      const speed = baseSpeed * speedMultiplier;

      setCollectibles(prev => prev
        .map(c => ({ ...c, x: c.x - speed }))
        .filter(c => c.x > -10)
      );

      setObstacles(prev => prev
        .map(o => ({ ...o, x: o.x - speed }))
        .filter(o => o.x > -10)
      );

      gameLoopRef.current = requestAnimationFrame(gameLoop);
    };

    gameLoopRef.current = requestAnimationFrame(gameLoop);
    return () => {
      if (gameLoopRef.current) cancelAnimationFrame(gameLoopRef.current);
    };
  }, [gameStarted, gameOver, isAccelerating, heartRate]);

  // 碰撞检测
  useEffect(() => {
    if (!gameStarted || gameOver) return;

    // 检测收集物
    setCollectibles(prev => prev.map(c => {
      if (c.collected) return c;
      const dx = Math.abs(c.x - 10); // 火车在 x=10% 位置
      const dy = Math.abs(c.y - trainY);
      if (dx < 8 && dy < 10) {
        // 收集成功
        const points = c.type === 'heart' ? 10 : 5;
        setScore(s => s + points);
        setCombo(c => {
          const newCombo = c + 1;
          setMaxCombo(max => Math.max(max, newCombo));
          return newCombo;
        });
        setHeartRate(hr => Math.min(150, hr + 2)); // 收集时心跳微升

        const emoji = c.type === 'heart' ? '💖' : c.type === 'star' ? '⭐' : c.type === 'flower' ? '🌸' : '🦋';
        setParticles(p => [...p, { id: Date.now() + Math.random(), x: 10, y: trainY, emoji }]);

        if (combo > 0 && combo % 5 === 0) {
          showEncouragementMessage(ENCOURAGEMENTS.collect[Math.floor(Math.random() * ENCOURAGEMENTS.collect.length)]);
        }
        return { ...c, collected: true };
      }
      return c;
    }).filter(c => !c.collected));

    // 检测障碍物
    setObstacles(prev => prev.map(o => {
      if (o.hit) return o;
      const dx = Math.abs(o.x - 10);
      const dy = Math.abs(o.y - trainY);
      if (dx < 8 && dy < 10) {
        setCombo(0);
        setHeartRate(hr => Math.min(150, hr + 8)); // 撞到心跳上升
        showEncouragementMessage(ENCOURAGEMENTS.hit[Math.floor(Math.random() * ENCOURAGEMENTS.hit.length)]);
        return { ...o, hit: true };
      }
      return o;
    }).filter(o => !o.hit));
  }, [trainY, gameStarted, gameOver, combo, showEncouragementMessage]);

  // 根据心跳趋势显示鼓励语
  useEffect(() => {
    if (!gameStarted || gameOver) return;

    const interval = setInterval(() => {
      // 根据心率和趋势选择合适的鼓励语
      let messages: string[] = [];

      if (heartRate < 55) {
        // 心跳特别慢
        messages = ENCOURAGEMENTS.verySlow;
      } else if (heartRate > 115) {
        // 心跳特别快
        messages = ENCOURAGEMENTS.veryFast;
      } else {
        // 根据趋势选择
        if (heartRateTrend === 'rising') {
          messages = ENCOURAGEMENTS.rising;
        } else if (heartRateTrend === 'falling') {
          messages = ENCOURAGEMENTS.falling;
        } else if (heartRate > 95) {
          messages = ENCOURAGEMENTS.high;
        } else {
          messages = ENCOURAGEMENTS.calm;
        }
      }

      if (messages.length > 0) {
        const randomMsg = messages[Math.floor(Math.random() * messages.length)];
        showEncouragementMessage(randomMsg);
      }
    }, 8000); // 每 8 秒显示一次鼓励语

    return () => clearInterval(interval);
  }, [gameStarted, gameOver, heartRate, heartRateTrend, showEncouragementMessage]);

  // 清理粒子
  useEffect(() => {
    if (particles.length === 0) return;
    const timeout = setTimeout(() => setParticles(p => p.slice(1)), 800);
    return () => clearTimeout(timeout);
  }, [particles]);

  // 计时器
  useEffect(() => {
    if (!gameStarted || gameOver) return;
    const interval = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          setGameOver(true);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [gameStarted, gameOver]);

  // 呼吸练习
  useEffect(() => {
    if (showBreathing) {
      const cycle = () => {
        setBreathPhase('inhale');
        setTimeout(() => {
          setBreathPhase('hold');
          setTimeout(() => {
            setBreathPhase('exhale');
            setTimeout(() => {
              setBreathCount(c => c + 1);
              setHeartRate(hr => Math.max(50, hr - 5));
            }, 4000);
          }, 2000);
        }, 4000);
      };
      cycle();
      const interval = setInterval(cycle, 10000);
      return () => clearInterval(interval);
    } else {
      setBreathPhase('inhale');
      setBreathCount(0);
    }
  }, [showBreathing]);

  // 触摸/鼠标控制
  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!gameStarted || gameOver) return;
    const rect = containerRef.current?.getBoundingClientRect();
    if (rect) {
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      setTrainY(Math.max(10, Math.min(90, y)));
    }
  }, [gameStarted, gameOver]);

  const handlePointerDown = useCallback(() => {
    if (!gameStarted || gameOver) return;
    setIsAccelerating(true);
    setHeartRate(hr => Math.min(150, hr + 3));
  }, [gameStarted, gameOver]);

  const handlePointerUp = useCallback(() => {
    setIsAccelerating(false);
  }, []);

  // 键盘控制
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!gameStarted || gameOver) return;
      if (e.key === 'ArrowUp' || e.key === 'w') {
        setTrainY(y => Math.max(10, y - 5));
      } else if (e.key === 'ArrowDown' || e.key === 's') {
        setTrainY(y => Math.min(90, y + 5));
      } else if (e.key === ' ' || e.key === 'ArrowRight') {
        setIsAccelerating(true);
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === ' ' || e.key === 'ArrowRight') {
        setIsAccelerating(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [gameStarted, gameOver]);

  const handleStart = () => {
    setGameStarted(true);
    setGameOver(false);
    setScore(0);
    setCombo(0);
    setMaxCombo(0);
    setTimeLeft(60);
    setCollectibles([]);
    setObstacles([]);
    setTrainY(50);
    lastSpawnTime.current = 0;
    showEncouragementMessage('出发！移动鼠标/触摸控制小火车～ 🚂');
  };

  const handleBack = () => {
    endGame();
    navigateTo('playground');
  };

  const getCollectibleEmoji = (type: CollectibleType) => {
    switch (type) {
      case 'heart': return '💖';
      case 'star': return '⭐';
      case 'flower': return '🌸';
      case 'butterfly': return '🦋';
    }
  };

  // 开始界面
  if (!gameStarted) {
    return (
      <div className="relative min-h-screen w-full overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-300 via-pink-200 to-yellow-100" />
        <motion.div className="absolute top-4 left-4 right-4 z-50 flex items-center justify-between" initial={{ y: -50, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>
          <motion.button onClick={handleBack} className="bg-white/80 backdrop-blur-xl px-5 py-2.5 rounded-full shadow-xl font-black text-gray-700 border-4 border-white/60" whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.95 }}>← 返回</motion.button>
        </motion.div>
        <div className="relative z-10 flex items-center justify-center min-h-screen">
          <motion.div className="bg-white/80 backdrop-blur-xl rounded-3xl p-8 shadow-2xl border-4 border-white/60 max-w-md w-full mx-4" initial={{ scale: 0.8, opacity: 0, y: 50 }} animate={{ scale: 1, opacity: 1, y: 0 }} transition={{ type: 'spring', bounce: 0.6 }}>
            <motion.div className="text-center mb-6" animate={{ y: [0, -5, 0] }} transition={{ duration: 2, repeat: Infinity }}>
              <div className="text-7xl mb-4">🚂</div>
              <h1 className="text-3xl font-black bg-gradient-to-r from-purple-500 via-pink-500 to-yellow-500 bg-clip-text text-transparent">心跳过山车</h1>
            </motion.div>
            <div className="space-y-3 mb-6">
              <div className="bg-purple-100 rounded-2xl p-3"><div className="flex items-center gap-2"><span className="text-2xl">🖱️</span><p className="text-sm font-bold text-gray-700">移动鼠标/触摸屏幕控制小火车上下</p></div></div>
              <div className="bg-pink-100 rounded-2xl p-3"><div className="flex items-center gap-2"><span className="text-2xl">⬆️⬇️</span><p className="text-sm font-bold text-gray-700">或用键盘方向键/W S 键控制</p></div></div>
              <div className="bg-yellow-100 rounded-2xl p-3"><div className="flex items-center gap-2"><span className="text-2xl">🖱️</span><p className="text-sm font-bold text-gray-700">按住鼠标/屏幕加速冲刺</p></div></div>
              <div className="bg-green-100 rounded-2xl p-3"><div className="flex items-center gap-2"><span className="text-2xl">💖⭐</span><p className="text-sm font-bold text-gray-700">收集爱心和星星获得分数</p></div></div>
              <div className="bg-blue-100 rounded-2xl p-3"><div className="flex items-center gap-2"><span className="text-2xl">⚠️</span><p className="text-sm font-bold text-gray-700">躲避红色障碍物，保持连击</p></div></div>
            </div>
            <div className="mb-6 p-3 bg-gray-100 rounded-2xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2"><span className="text-2xl">{isWatchConnected ? '⌚' : '❌'}</span><span className="text-sm font-bold text-gray-600">{isWatchConnected ? '手表已连接' : '未连接手表'}</span></div>
                {!isWatchConnected ? (
                  <motion.button onClick={connectWatch} disabled={isConnecting} className="bg-gradient-to-r from-blue-400 to-purple-400 text-white font-black text-sm py-2 px-4 rounded-full" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>{isConnecting ? '连接中...' : '连接'}</motion.button>
                ) : (
                  <motion.button onClick={disconnectWatch} className="bg-gray-300 text-gray-700 font-black text-sm py-2 px-4 rounded-full" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>断开</motion.button>
                )}
              </div>
            </div>
            <motion.button onClick={handleStart} className="w-full bg-gradient-to-r from-purple-400 via-pink-400 to-yellow-400 text-white font-black text-xl py-4 rounded-full shadow-xl" whileHover={{ scale: 1.05, y: -3 }} whileTap={{ scale: 0.95 }} animate={{ boxShadow: ['0 0 20px rgba(168,85,247,0.5)', '0 0 40px rgba(236,72,153,0.8)', '0 0 20px rgba(168,85,247,0.5)'] }} transition={{ duration: 2, repeat: Infinity }}>开始游戏 🎮</motion.button>
          </motion.div>
        </div>
      </div>
    );
  }

  // 游戏结束界面
  if (gameOver) {
    return (
      <div className="relative min-h-screen w-full overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-300 via-pink-200 to-yellow-100" />
        <div className="relative z-10 flex items-center justify-center min-h-screen">
          <motion.div className="bg-white/80 backdrop-blur-xl rounded-3xl p-8 shadow-2xl border-4 border-white/60 max-w-md w-full mx-4 text-center" initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
            <div className="text-6xl mb-4">🎉</div>
            <h2 className="text-3xl font-black text-purple-600 mb-4">时间到！</h2>
            <div className="space-y-3 mb-6">
              <div className="bg-purple-100 rounded-2xl p-4"><div className="text-sm text-gray-600">得分</div><div className="text-4xl font-black text-purple-600">{score}</div></div>
              <div className="bg-pink-100 rounded-2xl p-4"><div className="text-sm text-gray-600">最大连击</div><div className="text-2xl font-black text-pink-600">{maxCombo} 连击 🔥</div></div>
            </div>
            <div className="flex gap-3">
              <motion.button onClick={handleStart} className="flex-1 bg-gradient-to-r from-purple-400 to-pink-400 text-white font-black py-3 rounded-full" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>再来一次</motion.button>
              <motion.button onClick={handleBack} className="flex-1 bg-gray-300 text-gray-700 font-black py-3 rounded-full" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>返回</motion.button>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  // 游戏主界面
  return (
    <div className="relative min-h-screen w-full overflow-hidden" ref={containerRef} onPointerMove={handlePointerMove} onPointerDown={handlePointerDown} onPointerUp={handlePointerUp} onPointerLeave={handlePointerUp}>
      {/* 背景 */}
      <motion.div className="absolute inset-0" animate={{ background: `linear-gradient(135deg, ${currentZone.color}40, ${currentZone.color}20, #ffffff)` }} transition={{ duration: 1 }} />

      {/* 顶部导航 */}
      <motion.div className="absolute top-4 left-4 right-4 z-50 flex items-center justify-between" initial={{ y: -50, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>
        <motion.button onClick={handleBack} className="bg-white/80 backdrop-blur-xl px-5 py-2.5 rounded-full shadow-xl font-black text-gray-700 border-4 border-white/60" whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.95 }}>← 返回</motion.button>
        <motion.div className="bg-gradient-to-r from-pink-400 via-purple-400 to-blue-400 backdrop-blur-xl px-6 py-3 rounded-full shadow-2xl border-4 border-white/60" animate={{ scale: [1, 1.05, 1] }} transition={{ duration: 2, repeat: Infinity }}><span className="text-xl font-black text-white drop-shadow-lg">🚂 心跳过山车</span></motion.div>
        <div className="w-20" />
      </motion.div>

      {/* 左侧面板 - 心率 */}
      <motion.div className="absolute top-24 left-4 z-40" initial={{ x: -100, opacity: 0 }} animate={{ x: 0, opacity: 1 }}>
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-4 shadow-xl border-4 border-white/60 min-w-[130px]">
          <div className="flex items-center gap-2 mb-2"><motion.div animate={{ scale: isWatchConnected ? [1, 1.2, 1] : 1 }}>{isWatchConnected ? '⌚' : '❌'}</motion.div><span className="text-xs font-bold text-gray-600">{isWatchConnected ? '已连接' : '模拟'}</span></div>
          <motion.div className="text-center mb-2" animate={{ scale: [1, 1.05, 1] }} transition={{ duration: 60 / heartRate, repeat: Infinity }}><div className="text-3xl font-black" style={{ color: currentZone.color }}>{heartRate}</div><div className="text-xs text-gray-500 font-bold">次/分钟</div></motion.div>
          <motion.div className="text-center py-1.5 rounded-full mb-2" style={{ backgroundColor: `${currentZone.color}30` }}><span className="text-sm font-bold" style={{ color: currentZone.color }}>{currentZone.emoji} {currentZone.name}</span></motion.div>
          <motion.button onClick={() => setShowBreathing(!showBreathing)} className={`w-full font-black text-xs py-1.5 px-2 rounded-full ${showBreathing ? 'bg-green-400 text-white' : 'bg-pink-400 text-white'}`} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>{showBreathing ? '🧘 呼吸中' : '🧘 呼吸'}</motion.button>
          <div className="mt-2"><div className="text-xs font-bold text-gray-500 mb-1">心跳曲线</div><div className="flex items-end gap-0.5 h-10">{heartRateHistory.map((hr, i) => (<motion.div key={i} className="flex-1 rounded-t" style={{ backgroundColor: getHeartRateZone(hr).color, height: `${((hr - 50) / 100) * 100}%` }} initial={{ scaleY: 0 }} animate={{ scaleY: 1 }} />))}</div></div>
        </div>
      </motion.div>

      {/* 右侧面板 - 分数和时间 */}
      <motion.div className="absolute top-24 right-4 z-40" initial={{ x: 100, opacity: 0 }} animate={{ x: 0, opacity: 1 }}>
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-4 shadow-xl border-4 border-white/60">
          <div className="text-center mb-3"><div className="text-xs text-gray-500 font-bold">得分</div><motion.div className="text-3xl font-black text-purple-600" key={score} initial={{ scale: 1.3 }} animate={{ scale: 1 }}>{score}</motion.div></div>
          <div className="text-center mb-3"><div className="text-xs text-gray-500 font-bold">连击</div><motion.div className={`text-xl font-black ${combo > 5 ? 'text-pink-600' : 'text-gray-600'}`}>{combo} 🔥</motion.div></div>
          <div className="text-center"><div className="text-xs text-gray-500 font-bold">时间</div><div className={`text-2xl font-black ${timeLeft < 10 ? 'text-red-500' : 'text-gray-600'}`}>{timeLeft}s</div></div>
        </div>
      </motion.div>

      {/* 游戏区域 */}
      <div className="absolute inset-0 z-10">
        {/* 轨道 */}
        <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-24">
          <svg className="w-full h-full" preserveAspectRatio="none">
            <motion.path d="M 0 50% L 100% 50%" fill="none" stroke={currentZone.color} strokeWidth="6" strokeLinecap="round" animate={{ stroke: currentZone.color, strokeWidth: [4, 8, 4] }} transition={{ duration: 2, repeat: Infinity }} />
            <path d="M 0 50% L 100% 50%" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="2" />
          </svg>
        </div>

        {/* 收集物 */}
        {collectibles.map(c => (
          <motion.div key={c.id} className="absolute text-4xl" style={{ left: `${c.x}%`, top: `${c.y}%` }} animate={{ scale: [1, 1.2, 1], rotate: [0, 10, -10, 0] }} transition={{ duration: 0.8, repeat: Infinity }}>{getCollectibleEmoji(c.type)}</motion.div>
        ))}

        {/* 障碍物 */}
        {obstacles.map(o => (
          <motion.div key={o.id} className="absolute text-3xl" style={{ left: `${o.x}%`, top: `${o.y}%` }} animate={{ rotate: [0, 360] }} transition={{ duration: 1, repeat: Infinity }}>⚠️</motion.div>
        ))}

        {/* 小火车 - 固定在左侧，y 坐标由用户控制 */}
        <motion.div className="absolute z-20" style={{ left: '10%', top: `${trainY}%`, transform: 'translate(-50%, -50%)' }} animate={isAccelerating ? { scale: [1, 1.1, 1] } : {}} transition={{ duration: 0.2, repeat: Infinity }}>
          <div className="w-16 h-10 bg-gradient-to-r from-pink-400 via-purple-400 to-blue-400 rounded-full shadow-lg border-4 border-white relative">
            <div className="absolute top-1 left-2 w-2.5 h-2.5 bg-white/80 rounded-full" />
            <div className="absolute top-1 left-6 w-2.5 h-2.5 bg-white/80 rounded-full" />
            <motion.div className="absolute -top-2 right-1 text-lg" animate={{ y: [0, -3, 0], scale: [1, 1.2, 1] }} transition={{ duration: 0.4, repeat: Infinity }}>💗</motion.div>
          </div>
          <div className="absolute -bottom-1 left-0.5 w-3 h-3 bg-gray-800 rounded-full border-2 border-white" />
          <div className="absolute -bottom-1 right-0.5 w-3 h-3 bg-gray-800 rounded-full border-2 border-white" />
          {/* 加速特效 */}
          {isAccelerating && (
            <div className="absolute -left-4 top-1/2 -translate-y-1/2">
              <motion.div className="text-2xl" animate={{ x: [-10, -20], opacity: [1, 0] }} transition={{ duration: 0.3, repeat: Infinity }}>💨</motion.div>
            </div>
          )}
        </motion.div>

        {/* 粒子特效 */}
        {particles.map(p => (
          <motion.div key={p.id} className="absolute text-3xl z-30" style={{ left: `${p.x}%`, top: `${p.y}%` }} initial={{ scale: 0, opacity: 1 }} animate={{ scale: [0, 1.5, 0], opacity: [1, 0], y: -30 }} transition={{ duration: 0.6 }}>{p.emoji}</motion.div>
        ))}
      </div>

      {/* 鼓励语气泡 */}
      <AnimatePresence>
        {showEncouragement && (
          <motion.div className="absolute top-32 left-1/2 -translate-x-1/2 z-50" initial={{ scale: 0, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0, opacity: 0, y: -20 }}><motion.div className="bg-white/95 backdrop-blur-xl rounded-3xl px-6 py-3 shadow-2xl border-4 border-pink-400/60" animate={{ y: [0, -3, 0] }} transition={{ duration: 1.5, repeat: Infinity }}><p className="text-base font-black text-gray-700 text-center">{currentEncouragement}</p></motion.div></motion.div>
        )}
      </AnimatePresence>

      {/* 底部提示 */}
      <motion.div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-40" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}><div className="bg-white/80 backdrop-blur-xl rounded-full px-6 py-3 shadow-xl border-4 border-white/60"><p className="text-gray-700 font-bold text-sm">🖱️ 移动鼠标控制上下 · 按住加速 · ⬆️⬇️ 键盘也可控制</p></div></motion.div>

      {/* 呼吸练习覆盖层 */}
      <AnimatePresence>
        {showBreathing && (
          <motion.div className="absolute inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowBreathing(false)}><motion.div className="relative" initial={{ scale: 0.5 }} animate={{ scale: 1 }}><motion.div className="w-56 h-56 rounded-full flex items-center justify-center" style={{ background: `radial-gradient(circle, ${currentZone.color}80, ${currentZone.color}40)` }} animate={{ scale: breathPhase === 'inhale' ? [1, 1.5] : breathPhase === 'hold' ? 1.5 : [1.5, 1] }} transition={{ duration: breathPhase === 'inhale' ? 4 : breathPhase === 'hold' ? 2 : 4 }}><div className="text-center"><div className="text-5xl mb-3">{breathPhase === 'inhale' ? '🌬️' : breathPhase === 'hold' ? '😌' : '💨'}</div><div className="text-xl font-black text-white">{breathPhase === 'inhale' ? '吸气～' : breathPhase === 'hold' ? '屏住～' : '呼气～'}</div><div className="text-white/80 font-bold mt-2">第 {breathCount + 1} 次</div></div></motion.div></motion.div></motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
