import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect, useCallback, useRef } from 'react';
import { useAppStore } from '@/store/appStore';

// 心率区间
const HEART_RATE_ZONES = {
  veryLow: { min: 0, max: 60, color: '#A8E6CF', name: '平静', emoji: '😌' },
  low: { min: 60, max: 80, color: '#FFD43B', name: '放松', emoji: '😊' },
  normal: { min: 80, max: 100, color: '#FFA94D', name: '活跃', emoji: '🙂' },
  high: { min: 100, max: 130, color: '#FF8E8E', name: '加速', emoji: '💓' },
  veryHigh: { min: 130, max: 200, color: '#FF6B6B', name: '激动', emoji: '🔥' },
};

const ENCOURAGEMENTS = [
  '好棒！继续加油～ 💖',
  '心跳很有活力～ ✨',
  '你做得很好～ 👏',
  '继续保持～ 🌟',
  '太厉害了～ 🎉',
];

interface Collectible {
  id: number;
  x: number;
  y: number;
  collected: boolean;
  value: number;
  type: 'heart' | 'star';
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

  const [gameStarted, setGameStarted] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [maxCombo, setMaxCombo] = useState(0);
  const [timeLeft, setTimeLeft] = useState(60);

  // 心率
  const [heartRate, setHeartRate] = useState(75);
  const [isWatchConnected, setIsWatchConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [heartRateHistory, setHeartRateHistory] = useState<number[]>([75, 75, 75, 75, 75]);
  const [message, setMessage] = useState('');
  const [showMessage, setShowMessage] = useState(false);

  // 用于渲染的状态
  const [renderTrigger, setRenderTrigger] = useState(0); // 用于触发渲染
  const [collectibles, setCollectibles] = useState<Collectible[]>([]);
  const [obstacles, setObstacles] = useState<Obstacle[]>([]);

  const containerRef = useRef<HTMLDivElement>(null);
  const gameLoopRef = useRef<number>();
  const lastSpawnTime = useRef(0);

  // 游戏状态 refs（不触发重新渲染）
  const trackYRef = useRef(0);
  const jumpOffsetRef = useRef(0);
  const trackOffsetRef = useRef(0);
  const isJumpingRef = useRef(false);
  const jumpStartTimeRef = useRef(0);

  const [containerSize, setContainerSize] = useState({ w: 800, h: 600 });

  // 常量
  const GROUND_PERCENT = 75;
  const PLAYER_X = 80;

  const getZone = (hr: number) => {
    if (hr < 60) return HEART_RATE_ZONES.veryLow;
    if (hr < 80) return HEART_RATE_ZONES.low;
    if (hr < 100) return HEART_RATE_ZONES.normal;
    if (hr < 130) return HEART_RATE_ZONES.high;
    return HEART_RATE_ZONES.veryHigh;
  };

  const zone = getZone(heartRate);

  const showMsg = (msg: string) => {
    setMessage(msg);
    setShowMessage(true);
    setTimeout(() => setShowMessage(false), 1500);
  };

  const disconnectWatch = () => {
    setIsWatchConnected(false);
    showMsg('手表已断开');
  };

  const connectWatch = async () => {
    setIsConnecting(true);
    await new Promise(r => setTimeout(r, 1500));
    setIsWatchConnected(true);
    setIsConnecting(false);
    showMsg('手表已连接！💕');
  };

  // 容器尺寸
  useEffect(() => {
    const update = () => {
      if (containerRef.current) {
        setContainerSize({
          w: containerRef.current.clientWidth || window.innerWidth,
          h: containerRef.current.clientHeight || window.innerHeight,
        });
      }
    };
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  // 心率模拟
  useEffect(() => {
    if (!isWatchConnected) {
      const t = setInterval(() => {
        setHeartRate(hr => {
          const change = Math.floor(Math.random() * 11) - 5;
          const newHR = Math.max(55, Math.min(140, hr + change));
          setHeartRateHistory(h => [...h.slice(-4), newHR]);
          return newHR;
        });
      }, 2000);
      return () => clearInterval(t);
    }
  }, [isWatchConnected]);

  // 获取轨道高度
  const getTrackY = useCallback((x: number, offset: number, width: number, height: number) => {
    const groundY = (height * GROUND_PERCENT) / 100;
    const amplitude = 40 + (heartRate - 60) * 0.3;
    const frequency = 0.008;
    const baseY = groundY - 80;
    return baseY + Math.sin((x + offset) * frequency) * amplitude;
  }, [heartRate]);

  // 跳跃
  const jump = useCallback(() => {
    if (!gameStarted || gameOver || isJumpingRef.current) return;
    isJumpingRef.current = true;
    jumpStartTimeRef.current = Date.now();
    showMsg(ENCOURAGEMENTS[Math.floor(Math.random() * ENCOURAGEMENTS.length)]);
  }, [gameStarted, gameOver]);

  // 键盘和触摸
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === ' ' || e.key === 'ArrowUp' || e.key === 'w') {
        e.preventDefault();
        jump();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [jump]);

  // 游戏循环 - 使用 requestAnimationFrame 统一处理
  useEffect(() => {
    if (!gameStarted || gameOver) return;

    const speed = 4 + (heartRate - 60) * 0.05;
    const height = containerSize.h;
    const width = containerSize.w;
    const jumpHeight = 100;
    const jumpDuration = 600;

    const loop = (timestamp: number) => {
      // 轨道滚动
      const newOffset = (Date.now() / 1000) * speed * 50;
      trackOffsetRef.current = newOffset;

      // 更新轨道高度
      const currentTrackY = getTrackY(PLAYER_X, newOffset, width, height);
      trackYRef.current = currentTrackY;

      // 更新跳跃状态
      if (isJumpingRef.current) {
        const elapsed = Date.now() - jumpStartTimeRef.current;
        const progress = Math.min(elapsed / jumpDuration, 1);
        const jumpProgress = Math.sin(progress * Math.PI);
        jumpOffsetRef.current = jumpHeight * jumpProgress;

        if (progress >= 1) {
          isJumpingRef.current = false;
          jumpOffsetRef.current = 0;
        }
      }

      // 生成收集物
      if (timestamp - lastSpawnTime.current > 1000) {
        const type = Math.random() > 0.5 ? 'heart' : 'star';
        const value = type === 'heart' ? 10 : 5;
        const heightOptions = [0, 60, 120];
        const randomHeight = heightOptions[Math.floor(Math.random() * heightOptions.length)];

        setCollectibles(prev => [...prev, {
          id: timestamp,
          x: width + 50,
          y: currentTrackY - randomHeight,
          collected: false,
          value,
          type,
        }]);

        if (Math.random() < 0.3) {
          setObstacles(prev => [...prev, {
            id: timestamp + 1000,
            x: width + 50,
            y: currentTrackY,
            hit: false,
          }]);
        }
        lastSpawnTime.current = timestamp;
      }

      // 移动物体
      setCollectibles(prev => prev
        .map(c => ({ ...c, x: c.x - speed }))
        .filter(c => c.x > -50 && !c.collected)
      );

      setObstacles(prev => prev
        .map(o => ({ ...o, x: o.x - speed }))
        .filter(o => o.x > -50 && !o.hit)
      );

      // 碰撞检测
      const playerY = trackYRef.current - jumpOffsetRef.current;
      const playerRect = { x: PLAYER_X, y: playerY, width: 50, height: 40 };

      // 收集物碰撞
      setCollectibles(prev => {
        let changed = false;
        const updated = prev.map(c => {
          if (c.collected) return c;
          const dx = Math.abs(c.x - playerRect.x - 25);
          const dy = Math.abs(c.y - playerY);
          if (dx < 40 && dy < 60) {
            changed = true;
            setScore(s => s + c.value);
            setCombo(cb => {
              const nc = cb + 1;
              setMaxCombo(m => Math.max(m, nc));
              if (nc % 3 === 0) {
                showMsg(ENCOURAGEMENTS[Math.floor(Math.random() * ENCOURAGEMENTS.length)]);
              }
              return nc;
            });
            return { ...c, collected: true };
          }
          return c;
        });
        return changed ? updated.filter(c => !c.collected) : prev;
      });

      // 障碍物碰撞
      setObstacles(prev => {
        let changed = false;
        const updated = prev.map(o => {
          if (o.hit) return o;
          const dx = Math.abs(o.x - playerRect.x - 25);
          const dy = Math.abs(o.y - playerY);
          if (dx < 35 && dy < 50) {
            changed = true;
            setCombo(0);
            setHeartRate(hr => Math.min(160, hr + 15));
            showMsg('小心障碍！⚠️');
            return { ...o, hit: true };
          }
          return o;
        });
        return changed ? updated.filter(o => !o.hit) : prev;
      });

      // 触发渲染（每帧）
      setRenderTrigger(prev => prev + 1);

      gameLoopRef.current = requestAnimationFrame(loop);
    };

    gameLoopRef.current = requestAnimationFrame(loop);
    return () => {
      if (gameLoopRef.current) cancelAnimationFrame(gameLoopRef.current);
    };
  }, [gameStarted, gameOver, heartRate, containerSize, getTrackY]);

  // 计时器
  useEffect(() => {
    if (!gameStarted || gameOver) return;
    const timer = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          setGameOver(true);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [gameStarted, gameOver]);

  const startGame = () => {
    setGameStarted(true);
    setGameOver(false);
    setScore(0);
    setCombo(0);
    setMaxCombo(0);
    setTimeLeft(60);
    setCollectibles([]);
    setObstacles([]);
    trackYRef.current = 0;
    jumpOffsetRef.current = 0;
    isJumpingRef.current = false;
    trackOffsetRef.current = 0;
    showMsg('点击或按空格跳跃！🎢');
  };

  const groundY = (containerSize.h * GROUND_PERCENT) / 100;

  const generateTrackPoints = () => {
    const points = [];
    for (let x = -50; x <= containerSize.w + 50; x += 20) {
      const y = getTrackY(x, trackOffsetRef.current, containerSize.w, containerSize.h);
      points.push(`${x},${y}`);
    }
    return points.join(' ');
  };

  // 小车位置
  const cartY = trackYRef.current - jumpOffsetRef.current;

  // 开始界面
  if (!gameStarted) {
    return (
      <div className="relative min-h-screen w-full overflow-hidden bg-gradient-to-br from-emerald-100 via-teal-100 to-cyan-100">
        <div className="absolute top-4 left-4 z-50">
          <button
            onClick={() => { endGame(); navigateTo('playground'); }}
            className="bg-white px-4 py-2 rounded-full shadow-lg font-bold text-emerald-600"
          >
            ← 返回
          </button>
        </div>

        <div className="flex items-center justify-center min-h-screen px-4">
          <div className="bg-white/90 backdrop-blur rounded-2xl p-6 shadow-2xl max-w-sm w-full">
            <div className="text-center mb-4">
              <motion.div
                className="text-6xl mb-2"
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                🎢
              </motion.div>
              <h1 className="text-2xl font-black text-emerald-600">心跳过山车</h1>
              <p className="text-xs text-gray-500 mt-1">心跳越快，速度越快！</p>
            </div>

            <div className="space-y-2 mb-4 text-sm">
              <div className="flex items-center gap-2">
                <span>🎢</span>
                <span>小车自动在轨道上前进</span>
              </div>
              <div className="flex items-center gap-2">
                <span>👆</span>
                <span>点击或按空格跳跃</span>
              </div>
              <div className="flex items-center gap-2">
                <span>💖</span>
                <span>收集爱心 (+10) 和星星 (+5)</span>
              </div>
              <div className="flex items-center gap-2">
                <span>🚧</span>
                <span>躲避障碍物</span>
              </div>
            </div>

            <div className="mb-4 p-2 bg-gray-100 rounded-xl">
              <div className="flex items-center justify-between">
                <span className="text-sm">{isWatchConnected ? '⌚ 已连接' : '❌ 未连接'}</span>
                <button
                  onClick={isWatchConnected ? disconnectWatch : connectWatch}
                  disabled={isConnecting}
                  className="bg-emerald-500 text-white px-3 py-1 rounded-full text-sm"
                >
                  {isConnecting ? '...' : isWatchConnected ? '断开' : '连接'}
                </button>
              </div>
            </div>

            <button
              onClick={startGame}
              className="w-full bg-gradient-to-r from-emerald-400 to-teal-400 text-white font-black py-3 rounded-full text-lg"
            >
              开始游戏
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 结束界面
  if (gameOver) {
    return (
      <div className="relative min-h-screen w-full overflow-hidden bg-gradient-to-br from-emerald-100 via-teal-100 to-cyan-100">
        <div className="flex items-center justify-center min-h-screen px-4">
          <div className="bg-white/90 backdrop-blur rounded-2xl p-6 shadow-2xl max-w-sm w-full text-center">
            <motion.div
              className="text-6xl mb-2"
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 1, repeat: Infinity }}
            >
              🎉
            </motion.div>
            <h2 className="text-xl font-black text-emerald-600 mb-4">游戏结束</h2>

            <div className="space-y-2 mb-4">
              <div className="bg-emerald-100 rounded-xl p-3">
                <div className="text-xs text-gray-500">得分</div>
                <div className="text-3xl font-black text-emerald-600">{score}</div>
              </div>
              <div className="bg-teal-100 rounded-xl p-3">
                <div className="text-xs text-gray-500">最大连击</div>
                <div className="text-xl font-black text-teal-600">{maxCombo} 🔥</div>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={startGame}
                className="flex-1 bg-emerald-400 text-white py-2 rounded-full font-bold"
              >
                再来
              </button>
              <button
                onClick={() => { endGame(); navigateTo('playground'); }}
                className="flex-1 bg-gray-300 text-gray-700 py-2 rounded-full font-bold"
              >
                返回
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 游戏画面
  return (
    <div
      ref={containerRef}
      className="relative min-h-screen w-full overflow-hidden bg-gradient-to-b from-emerald-100 via-teal-100 to-cyan-100"
      onClick={jump}
      onTouchStart={jump}
    >
      {/* 顶部栏 */}
      <div className="absolute top-0 left-0 right-0 z-50 flex items-center justify-between p-4">
        <button
          onClick={() => { endGame(); navigateTo('playground'); }}
          className="bg-white px-3 py-1.5 rounded-full shadow font-bold text-sm text-emerald-600"
        >
          ← 返回
        </button>
        <div className="bg-white/80 backdrop-blur px-4 py-2 rounded-full shadow font-black text-emerald-600">
          🎢 心跳过山车
        </div>
        <div className="w-16" />
      </div>

      {/* 左侧心率 */}
      <div className="absolute top-20 left-4 z-40 bg-white/90 backdrop-blur rounded-xl p-2 shadow-lg">
        <div className="flex items-center gap-1 mb-1">
          <span className="text-lg">{isWatchConnected ? '⌚' : '❌'}</span>
          <span className="text-xs font-bold">{isWatchConnected ? '已连接' : '模拟'}</span>
        </div>
        <motion.div
          className="text-center"
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ duration: 60 / heartRate, repeat: Infinity }}
        >
          <div className="text-xl font-black" style={{ color: zone.color }}>{heartRate}</div>
        </motion.div>
        <div className="text-[10px] text-gray-500 text-center">次/分</div>
        <div
          className="text-center mt-1 py-0.5 rounded text-xs font-bold"
          style={{ backgroundColor: `${zone.color}30`, color: zone.color }}
        >
          {zone.emoji} {zone.name}
        </div>
      </div>

      {/* 右侧分数 */}
      <div className="absolute top-20 right-4 z-40 bg-white/90 backdrop-blur rounded-xl p-2 shadow-lg">
        <div className="text-center">
          <div className="text-[10px] text-gray-500">得分</div>
          <div className="text-lg font-black text-emerald-600">{score}</div>
        </div>
        <div className="text-center">
          <div className="text-[10px] text-gray-500">连击</div>
          <div className="text-sm font-black">{combo} 🔥</div>
        </div>
        <div className="text-center">
          <div className="text-[10px] text-gray-500">时间</div>
          <div className={`text-base font-black ${timeLeft < 10 ? 'text-red-500' : 'text-gray-600'}`}>
            {timeLeft}s
          </div>
        </div>
      </div>

      {/* 背景山 */}
      <div className="absolute inset-0 opacity-30 pointer-events-none">
        <svg className="w-full h-full" preserveAspectRatio="none" viewBox="0 0 100 100">
          <polygon points="0,100 20,40 40,70 60,30 80,60 100,20 100,100 0,100" fill={zone.color} opacity="0.3" />
        </svg>
      </div>

      {/* 轨道 */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none">
        <defs>
          <linearGradient id="trackGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#FF6B6B" />
            <stop offset="50%" stopColor="#FFD43B" />
            <stop offset="100%" stopColor="#69DB7C" />
          </linearGradient>
        </defs>

        <polyline
          points={generateTrackPoints()}
          fill="none"
          stroke="url(#trackGradient)"
          strokeWidth="8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* 轨道支撑 */}
        {Array.from({ length: 20 }).map((_, i) => {
          const x = ((trackOffsetRef.current / 2 + i * 60) % (containerSize.w + 100)) - 50;
          const y = getTrackY(x, trackOffsetRef.current, containerSize.w, containerSize.h);
          return (
            <line
              key={i}
              x1={x}
              y1={y}
              x2={x}
              y2={groundY + 50}
              stroke="#8B4513"
              strokeWidth="3"
              opacity="0.5"
            />
          );
        })}
      </svg>

      {/* 收集物 */}
      <AnimatePresence>
        {collectibles.map(c => (
          <motion.div
            key={c.id}
            className="absolute text-3xl"
            style={{ left: c.x, top: c.y }}
            initial={{ scale: 0 }}
            animate={{ scale: [1, 1.2, 1], rotate: [0, 15, -15, 0] }}
            transition={{ duration: 0.6, repeat: Infinity }}
          >
            {c.type === 'heart' ? '💖' : '⭐'}
          </motion.div>
        ))}
      </AnimatePresence>

      {/* 障碍物 */}
      <AnimatePresence>
        {obstacles.map(o => (
          <motion.div
            key={o.id}
            className="absolute text-3xl"
            style={{ left: o.x, top: o.y - 20 }}
            initial={{ scale: 0 }}
            animate={{ scale: 1, rotate: [0, 8, -8, 0] }}
            transition={{ duration: 0.8, repeat: Infinity }}
          >
            🚧
          </motion.div>
        ))}
      </AnimatePresence>

      {/* 过山车 - 使用 transform 代替 top 以提高性能 */}
      <div
        className="absolute z-20"
        style={{
          left: PLAYER_X,
          top: cartY,
        }}
      >
        <div className="relative">
          {/* 车身 */}
          <div className="w-16 h-8 bg-gradient-to-r from-pink-400 via-purple-400 to-blue-400 rounded-lg shadow-lg border-2 border-white">
            <div className="absolute top-1 left-1 w-2 h-2 bg-white/80 rounded-full" />
            <div className="absolute top-1 left-6 w-2 h-2 bg-white/80 rounded-full" />
            <motion.div
              className="absolute -top-2 right-0 text-xl"
              animate={{ scale: [1, 1.3, 1], y: [0, -5, 0] }}
              transition={{ duration: 60 / heartRate, repeat: Infinity }}
            >
              💗
            </motion.div>
          </div>
          {/* 轮子 */}
          <div className="absolute -bottom-1 left-1 w-3 h-3 bg-gray-800 rounded-full border border-white" />
          <div className="absolute -bottom-1 right-1 w-3 h-3 bg-gray-800 rounded-full border border-white" />
        </div>
      </div>

      {/* 鼓励语 */}
      <AnimatePresence>
        {showMessage && (
          <motion.div
            className="absolute top-1/3 left-1/2 -translate-x-1/2 z-50 pointer-events-none"
            initial={{ scale: 0, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0, opacity: 0, y: -20 }}
          >
            <div className="bg-white/95 backdrop-blur rounded-xl px-4 py-2 shadow-xl border-2 border-pink-400">
              <p className="text-sm font-black text-gray-700 text-center">{message}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 底部提示 */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-40 pointer-events-none">
        <div className="bg-white/80 backdrop-blur rounded-full px-4 py-2 shadow-lg border-2 border-white/60">
          <p className="text-xs font-bold text-gray-700">👆 点击跳跃 · 空格也可 · 心跳影响速度</p>
        </div>
      </div>
    </div>
  );
};
