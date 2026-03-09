import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect, useCallback, useRef } from 'react';
import { useAppStore } from '@/store/appStore';
import { useCharacterStore } from '@/store/characterStore';

// 情绪小可爱们 - 只保留积极正面的表情（7 个）
const EMOTION_PETS = [
  { emoji: '😊', name: '开心', color: '#FFE066' },
  { emoji: '😌', name: '平静', color: '#A8E6CF' },
  { emoji: '😍', name: '喜爱', color: '#FF85A2' },
  { emoji: '🤗', name: '安心', color: '#8CE99A' },
  { emoji: '😄', name: '快乐', color: '#FFD43B' },
  { emoji: '🥰', name: '幸福', color: '#FF85A2' },
  { emoji: '😆', name: '兴奋', color: '#FFA94D' },
];

// 小彩虹的鼓励话语 - 纯粹接纳，无评判
const RAINBOW_MESSAGES = {
  slow: [
    '慢慢转，你说了算～ 🌈',
    '这样的节奏很舒服呢～ ✨',
    '慢慢来，我陪着你～ 💕',
    '安静地转，很美好～ 🌙',
    '你的节奏，刚刚好～ 🍃',
    '这样慢慢的，也很好～ 🌸',
  ],
  medium: [
    '不快不慢，很舒服～ 🌈',
    '这样的速度刚刚好～ ✨',
    '你在找到舒服的节奏～ 💕',
    '就这样，很好～ 🌟',
    '你的感觉，很重要～ 🦋',
    '继续享受这一刻～ 🌼',
  ],
  fast: [
    '哇～好有活力～ 🎉',
    '转得真快，好棒～ ✨',
    '你这么开心，我也好开心～ 🌈',
    '好厉害，继续呀～ 💫',
    '你的快乐要飞起来啦～ 🎊',
    '好有能量，太棒了～ 🔥',
  ],
  change: [
    '想快就快，想慢就慢～ 🌈',
    '你说了算，都可以～ ✨',
    '跟着感觉走～ 💕',
    '你的选择，都棒～ 🌟',
    '慢慢转，很美好～ 🌙',
    '快快转，好开心～ 🎉',
  ],
  idle: [
    '准备好了吗？我们一起出发～ 🌈',
    '想去哪里都可以～ ✨',
    '我在等你哦～ 💕',
    '慢慢来，不着急～ 🌸',
    '你准备好了就告诉我～ 🦋',
  ],
  timeUp: [
    '时间到啦！你转得真棒～ 🎉',
    '60 秒结束啦，好厉害～ ✨',
    '游戏结束，但你超棒的～ 💕',
    '谢谢你陪小彩虹一起玩～ 🌈',
  ],
};

// 获取随机消息
const getRandomMessage = (messages: string[]): string => {
  return messages[Math.floor(Math.random() * messages.length)];
};

export const MerryGoRoundGame = () => {
  const navigateTo = useAppStore((state) => state.navigateTo);
  const endGame = useAppStore((state) => state.endGame);
  const { config: characterConfig } = useCharacterStore();

  // 获取当前角色图片路径 - 根据 avatarStyle id 映射到实际文件名
  const currentAvatarUrl = characterConfig?.avatarStyle === '卡通2'
    ? '/卡通数字人2.png'
    : '/卡通数字人.png';

  // 游戏状态
  const [gameStarted, setGameStarted] = useState(false);
  const [gameOver, setGameOver] = useState(false);

  // 旋转状态
  const [rotation, setRotation] = useState(0); // 当前旋转角度
  const [speed, setSpeed] = useState(0); // 当前速度 (-10 到 10)
  const [targetSpeed, setTargetSpeed] = useState(0); // 目标速度

  // 滑杆状态
  const [sliderValue, setSliderValue] = useState(50); // 0-100, 50 是停止
  const [isDragging, setIsDragging] = useState(false);

  // 消息状态
  const [currentMessage, setCurrentMessage] = useState(getRandomMessage(RAINBOW_MESSAGES.idle));
  const [showMessage, setShowMessage] = useState(false);
  const [lastSpeedZone, setLastSpeedZone] = useState<'slow' | 'medium' | 'fast'>('medium');

  // 时间状态 - 60 秒游戏时间
  const [timeLeft, setTimeLeft] = useState(60);

  // 特效粒子
  const [particles, setParticles] = useState<{ id: number; angle: number; emoji: string }[]>([]);

  const gameLoopRef = useRef<number>();
  const messageTimerRef = useRef<number>();
  const lastMessageTimeRef = useRef(0);
  const sliderContainerRef = useRef<HTMLDivElement>(null);

  // 显示消息
  const showMessageTemp = useCallback((message: string) => {
    setCurrentMessage(message);
    setShowMessage(true);
    setTimeout(() => setShowMessage(false), 2500);
  }, []);

  // 根据速度获取鼓励语
  const getEncouragementForSpeed = useCallback((newSpeed: number): string => {
    const absSpeed = Math.abs(newSpeed);

    if (absSpeed < 2) {
      return getRandomMessage(RAINBOW_MESSAGES.slow);
    } else if (absSpeed < 5) {
      return getRandomMessage(RAINBOW_MESSAGES.medium);
    } else {
      return getRandomMessage(RAINBOW_MESSAGES.fast);
    }
  }, []);

  // 游戏循环 - 处理旋转
  useEffect(() => {
    if (!gameStarted || gameOver) return;

    const gameLoop = () => {
      setRotation((prev) => (prev + speed * 0.5) % 360);

      // 平滑过渡到目标速度
      setSpeed((prev) => {
        const diff = targetSpeed - prev;
        if (Math.abs(diff) < 0.1) return targetSpeed;
        return prev + diff * 0.05;
      });

      // 根据速度生成粒子特效
      if (Math.abs(speed) > 3 && Math.random() > 0.7) {
        const angle = (rotation + Math.random() * 360) % 360;
        const emojis = ['✨', '⭐', '🌟', '💫', '🌈', '💕'];
        const emoji = emojis[Math.floor(Math.random() * emojis.length)];
        setParticles((prev) => [...prev.slice(-10), { id: Date.now(), angle, emoji }]);
      }

      gameLoopRef.current = requestAnimationFrame(gameLoop);
    };

    gameLoopRef.current = requestAnimationFrame(gameLoop);

    return () => {
      if (gameLoopRef.current) cancelAnimationFrame(gameLoopRef.current);
    };
  }, [gameStarted, gameOver, speed, targetSpeed, rotation]);

  // 速度变化检测 - 显示鼓励语
  useEffect(() => {
    if (!gameStarted || gameOver) return;

    const absSpeed = Math.abs(speed);
    let newZone: 'slow' | 'medium' | 'fast' = 'medium';

    if (absSpeed < 2) {
      newZone = 'slow';
    } else if (absSpeed < 5) {
      newZone = 'medium';
    } else {
      newZone = 'fast';
    }

    // 速度区间变化时显示鼓励语
    if (newZone !== lastSpeedZone) {
      setLastSpeedZone(newZone);
      const message = getEncouragementForSpeed(speed);
      showMessageTemp(message);
    }

    // 定期显示鼓励语（每 6 秒）
    const now = Date.now();
    if (now - lastMessageTimeRef.current > 6000) {
      lastMessageTimeRef.current = now;

      // 速度变化时显示不同话语
      const speedChanged = Math.abs(speed - targetSpeed) > 0.5;
      if (speedChanged) {
        showMessageTemp(getRandomMessage(RAINBOW_MESSAGES.change));
      } else {
        showMessageTemp(getEncouragementForSpeed(speed));
      }
    }

    messageTimerRef.current = window.setTimeout(() => {}, 100);

    return () => {
      if (messageTimerRef.current) clearTimeout(messageTimerRef.current);
    };
  }, [speed, targetSpeed, lastSpeedZone, gameStarted, gameOver, getEncouragementForSpeed, showMessageTemp]);

  // 清理粒子
  useEffect(() => {
    if (particles.length === 0) return;
    const timeout = setTimeout(() => setParticles((p) => p.slice(1)), 1000);
    return () => clearTimeout(timeout);
  }, [particles]);

  // 计时器 - 60 秒游戏时间
  useEffect(() => {
    if (!gameStarted || gameOver) return;

    const timer = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          setGameOver(true);
          return 0;
        }
        return t - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [gameStarted, gameOver]);

  // 计算滑杆位置并更新速度
  const updateSpeedFromSlider = useCallback((clientX: number) => {
    if (!sliderContainerRef.current) return;

    const rect = sliderContainerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));

    setSliderValue(percentage);
    setTargetSpeed((percentage - 50) / 5);
  }, []);

  // 触屏/鼠标事件处理
  const handleSliderPointerDown = useCallback((e: React.PointerEvent) => {
    e.preventDefault();
    setIsDragging(true);
    updateSpeedFromSlider(e.clientX);
  }, [updateSpeedFromSlider]);

  const handleSliderPointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDragging) return;
    e.preventDefault();
    updateSpeedFromSlider(e.clientX);

    // 速度变化时更新消息
    if (Math.abs(targetSpeed - speed) > 1) {
      lastMessageTimeRef.current = Date.now() - 5500;
    }
  }, [isDragging, updateSpeedFromSlider, targetSpeed, speed]);

  const handleSliderPointerUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // 全局指针移动/抬起事件
  useEffect(() => {
    const handlePointerMove = (e: PointerEvent) => {
      if (isDragging && sliderContainerRef.current) {
        e.preventDefault();
        updateSpeedFromSlider(e.clientX);
      }
    };

    const handlePointerUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      window.addEventListener('pointermove', handlePointerMove);
      window.addEventListener('pointerup', handlePointerUp);
    }

    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };
  }, [isDragging, updateSpeedFromSlider]);

  // 键盘控制
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!gameStarted || gameOver) return;

      if (e.key === 'ArrowLeft' || e.key === 'a') {
        setSliderValue((prev) => {
          const newVal = Math.max(0, prev - 5);
          setTargetSpeed((newVal - 50) / 5);
          return newVal;
        });
      } else if (e.key === 'ArrowRight' || e.key === 'd') {
        setSliderValue((prev) => {
          const newVal = Math.min(100, prev + 5);
          setTargetSpeed((newVal - 50) / 5);
          return newVal;
        });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameStarted, gameOver]);

  // 开始游戏
  const handleStart = () => {
    setGameStarted(true);
    setGameOver(false);
    setRotation(0);
    setSpeed(0);
    setTargetSpeed(0);
    setSliderValue(50);
    setParticles([]);
    setTimeLeft(60);
    lastMessageTimeRef.current = Date.now();
    showMessageTemp('拖动滑杆，想快就快，想慢就慢～ 🌈');
  };

  // 返回
  const handleBack = () => {
    endGame();
    navigateTo('playground');
  };

  // 重新开始
  const handleRestart = () => {
    setGameStarted(false);
    setTimeout(handleStart, 100);
  };

  // 计算速度显示
  const speedDisplay = Math.abs(speed).toFixed(1);
  const direction = speed > 0 ? '顺时针' : speed < 0 ? '逆时针' : '静止';

  // 未开始界面
  if (!gameStarted) {
    return (
      <div className="relative min-h-screen w-full overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-orange-200 via-pink-200 to-purple-200" />

        {/* 装饰彩旗 */}
        <div className="absolute top-0 left-0 right-0 h-20 overflow-hidden">
          <svg viewBox="0 0 400 60" className="w-full h-full" preserveAspectRatio="none">
            {[...Array(20)].map((_, i) => (
              <polygon
                key={i}
                points={`${i * 20},0 ${i * 20 + 10},50 ${i * 20 + 20},0`}
                fill={['#FF6B6B', '#FFA94D', '#FFE066', '#69DB7C', '#4DABF7', '#DA77F2', '#FF85A2'][i % 7]}
                opacity="0.8"
              />
            ))}
          </svg>
        </div>

        <div className="absolute top-4 left-4 z-50">
          <motion.button
            onClick={handleBack}
            className="bg-white/80 backdrop-blur-xl px-5 py-2.5 rounded-full shadow-xl font-black text-gray-700 border-4 border-white/60"
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.95 }}
          >
            ← 返回
          </motion.button>
        </div>

        <div className="relative z-10 flex items-center justify-center min-h-screen px-4">
          <motion.div
            className="bg-white/90 backdrop-blur-xl rounded-3xl p-8 shadow-2xl border-4 border-white/60 max-w-md w-full"
            initial={{ scale: 0.8, opacity: 0, y: 50 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
          >
            <motion.div
              className="text-center mb-6"
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <div className="text-8xl mb-4">🎠</div>
              <h1 className="text-3xl font-black bg-gradient-to-r from-orange-500 via-pink-500 to-purple-500 bg-clip-text text-transparent">
                慢慢转木马
              </h1>
            </motion.div>

            <div className="space-y-3 mb-6">
              <div className="bg-orange-100 rounded-2xl p-4">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">⏱️</span>
                  <p className="text-sm font-bold text-gray-700">游戏时间 60 秒</p>
                </div>
              </div>
              <div className="bg-pink-100 rounded-2xl p-4">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">🎚️</span>
                  <p className="text-sm font-bold text-gray-700">手指拖动滑杆控制速度</p>
                </div>
              </div>
              <div className="bg-purple-100 rounded-2xl p-4">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">⬅️➡️</span>
                  <p className="text-sm font-bold text-gray-700">向左慢，向右快，都可以</p>
                </div>
              </div>
              <div className="bg-green-100 rounded-2xl p-4">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">💕</span>
                  <p className="text-sm font-bold text-gray-700">你的节奏，就是最好的节奏</p>
                </div>
              </div>
            </div>

            <motion.button
              onClick={handleStart}
              className="w-full bg-gradient-to-r from-orange-400 via-pink-400 to-purple-400 text-white font-black text-xl py-4 rounded-full shadow-xl"
              whileHover={{ scale: 1.05, y: -3 }}
              whileTap={{ scale: 0.95 }}
            >
              开始旋转 🎮
            </motion.button>
          </motion.div>
        </div>
      </div>
    );
  }

  // 游戏结束界面
  if (gameOver) {
    return (
      <div className="relative min-h-screen w-full overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-orange-200 via-pink-200 to-purple-200" />

        <div className="relative z-10 flex items-center justify-center min-h-screen px-4">
          <motion.div
            className="bg-white/90 backdrop-blur-xl rounded-3xl p-8 shadow-2xl border-4 border-white/60 max-w-md w-full text-center"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
          >
            <motion.div
              className="text-7xl mb-4"
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 1 }}
            >
              🎠
            </motion.div>
            <h2 className="text-3xl font-black text-purple-600 mb-4">时间到啦！</h2>

            <div className="space-y-3 mb-6">
              <div className="bg-purple-100 rounded-2xl p-4">
                <div className="text-sm text-gray-600 font-bold">你刚才转得好棒～</div>
              </div>
              <div className="bg-pink-100 rounded-2xl p-4">
                <div className="text-sm text-gray-600 font-bold">小彩虹玩得好开心～ 💕</div>
              </div>
            </div>

            <motion.p className="text-gray-600 font-bold mb-6">
              {getRandomMessage(RAINBOW_MESSAGES.timeUp)}
            </motion.p>

            <div className="flex gap-3">
              <motion.button
                onClick={handleRestart}
                className="flex-1 bg-gradient-to-r from-orange-400 to-pink-400 text-white font-black py-3 rounded-full"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                再玩一次
              </motion.button>
              <motion.button
                onClick={handleBack}
                className="flex-1 bg-gray-300 text-gray-700 font-black py-3 rounded-full"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                返回
              </motion.button>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  // 游戏进行界面
  return (
    <div className="relative min-h-screen w-full overflow-hidden touch-none">
      {/* 天空背景 */}
      <div className="absolute inset-0 bg-gradient-to-b from-sky-200 via-pink-100 to-orange-100" />

      {/* 云朵装饰 */}
      {[...Array(5)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute bg-white rounded-full opacity-70"
          style={{
            width: 60 + i * 20,
            height: 40 + i * 10,
            left: `${10 + i * 20}%`,
            top: `${5 + i * 8}%`,
          }}
          animate={{ x: [0, 30, 0] }}
          transition={{ duration: 10 + i * 2, repeat: Infinity }}
        />
      ))}

      {/* 顶部 UI */}
      <div className="absolute top-4 left-4 right-4 z-50 flex items-center justify-between">
        <motion.button
          onClick={handleBack}
          className="bg-white/80 backdrop-blur-xl px-5 py-2.5 rounded-full shadow-xl font-black text-gray-700 border-4 border-white/60"
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.95 }}
        >
          ← 返回
        </motion.button>
        <div className="bg-gradient-to-r from-orange-400 via-pink-400 to-purple-400 backdrop-blur-xl px-6 py-3 rounded-full shadow-2xl border-4 border-white/60">
          <span className="text-xl font-black text-white drop-shadow-lg">🎠 慢慢转木马</span>
        </div>
        <div className="w-20" />
      </div>

      {/* 左侧状态面板 - 时间 */}
      <div className="absolute top-24 left-4 z-40 pointer-events-none">
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-4 shadow-xl border-4 border-white/60">
          <div className="text-center mb-3">
            <div className="text-xs text-gray-500 font-bold">时间</div>
            <div className={`text-3xl font-black ${timeLeft < 10 ? 'text-red-500 animate-pulse' : 'text-orange-600'}`}>
              {timeLeft}s
            </div>
          </div>
        </div>
      </div>

      {/* 右侧状态面板 - 速度 */}
      <div className="absolute top-24 right-4 z-40 pointer-events-none">
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-4 shadow-xl border-4 border-white/60">
          <div className="text-center mb-3">
            <div className="text-xs text-gray-500 font-bold">速度</div>
            <div className="text-3xl font-black text-orange-600">{speedDisplay}</div>
          </div>
          <div className="text-center">
            <div className="text-xs text-gray-500 font-bold">方向</div>
            <div className="text-lg font-black text-purple-600">{direction}</div>
          </div>
        </div>
      </div>

      {/* 消息提示 */}
      <AnimatePresence>
        {showMessage && (
          <motion.div
            className="absolute top-32 left-1/2 -translate-x-1/2 z-50"
            initial={{ scale: 0.5, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.5, opacity: 0, y: -20 }}
          >
            <div className="bg-white/95 backdrop-blur-xl rounded-3xl px-6 py-3 shadow-2xl border-4 border-orange-400/60">
              <p className="text-base font-black text-gray-700 text-center">{currentMessage}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 旋转木马主体 */}
      <div className="absolute inset-0 flex items-center justify-center">
        {/* 转盘容器 - 固定尺寸 320x320 */}
        <div className="relative w-80 h-80 -mt-16">
          {/* 旋转盘 */}
          <motion.div
            className="w-full h-full rounded-full bg-gradient-to-br from-orange-300 via-pink-300 to-purple-300 shadow-2xl border-8 border-white/60 relative"
            style={{
              transform: `rotate(${rotation}deg)`,
            }}
          >
            {/* 装饰花纹 */}
            <div className="absolute inset-8 rounded-full border-4 border-dashed border-white/40" />

            {/* 中心装饰 */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-16 h-16 rounded-full bg-white/30" />
            </div>

            {/* 7 个情绪小可爱 + 1 个用户小人 = 8 个，均匀分布在圆周上 */}
            {[...EMOTION_PETS, { emoji: 'user', name: 'user', color: '#fff' }].map((pet, index) => {
              const total = 8; // 总共 8 个角色
              const angle = (index / total) * 360; // 每个间隔 45 度
              const radius = 110; // 距离中心的像素（转盘半径 160 - 元素半径 24 - 边距）
              const radian = (angle - 90) * (Math.PI / 180); // 转换为弧度，-90 度从顶部开始
              const x = 160 + Math.cos(radian) * radius; // 容器宽度 320 的一半 + 偏移
              const y = 160 + Math.sin(radian) * radius; // 容器高度 320 的一半 + 偏移

              const isUser = pet.emoji === 'user';

              return (
                <motion.div
                  key={pet.name}
                  className="absolute"
                  style={{
                    left: `${x}px`,
                    top: `${y}px`,
                    transform: 'translate(-50%, -50%)',
                  }}
                  animate={{
                    scale: [1, 1.1, 1],
                  }}
                  transition={{
                    duration: 0.8,
                    repeat: Infinity,
                    delay: index * 0.1,
                  }}
                >
                  {isUser ? (
                    // 用户的卡通数字人
                    <motion.div
                      className="w-14 h-14 rounded-full bg-white shadow-xl border-4 border-orange-400 overflow-hidden"
                      style={{
                        rotate: -rotation, // 反向旋转保持正向
                      }}
                    >
                      <img
                        src={currentAvatarUrl}
                        alt="我的小人"
                        className="w-full h-full object-cover"
                      />
                    </motion.div>
                  ) : (
                    // 情绪小可爱
                    <div className="relative">
                      <div
                        className="w-14 h-14 rounded-full flex items-center justify-center text-4xl shadow-lg"
                        style={{
                          backgroundColor: pet.color,
                          border: '3px solid white',
                        }}
                      >
                        {pet.emoji}
                      </div>
                      <motion.div
                        className="absolute -top-1 -right-1 text-lg"
                        animate={{ y: [0, -3, 0] }}
                        transition={{ duration: 0.6, repeat: Infinity, delay: index * 0.1 }}
                      >
                        ✨
                      </motion.div>
                    </div>
                  )}
                </motion.div>
              );
            })}
          </motion.div>

          {/* 中心柱子 - 覆盖在转盘上方 */}
          <div className="absolute left-1/2 top-0 bottom-0 w-4 -translate-x-1/2 bg-gradient-to-r from-yellow-600 via-yellow-400 to-yellow-600 rounded-full shadow-lg z-20" />

          {/* 顶部装饰 */}
          <div className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-3 text-3xl z-30">👑</div>
        </div>
      </div>

      {/* 底部滑杆控制 - 调整位置，避免与转盘重叠 */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-40 w-56 md:w-64">
        <div
          ref={sliderContainerRef}
          className="bg-white/80 backdrop-blur-xl rounded-3xl p-6 shadow-2xl border-4 border-white/60 select-none touch-none"
        >
          {/* 标签 */}
          <div className="text-center mb-3">
            <p className="text-gray-700 font-black text-sm">🎚️ 拖动滑杆控制速度</p>
          </div>

          {/* 滑杆容器 */}
          <div className="relative flex items-center gap-3">
            {/* 慢速标签 */}
            <div className="text-xs font-bold text-blue-600 text-center w-8 flex-shrink-0">
              <div>慢</div>
              <div>⬅️</div>
            </div>

            {/* 滑杆轨道 */}
            <div
              className="relative flex-1 h-12 rounded-full bg-gray-200 overflow-hidden cursor-pointer"
              onPointerDown={handleSliderPointerDown}
            >
              {/* 渐变背景 */}
              <div
                className="absolute inset-0"
                style={{
                  background: `linear-gradient(to right,
                    #4DABF7 0%,
                    #69DB7C 25%,
                    #FFE066 50%,
                    #FFA94D 75%,
                    #FF6B6B 100%)`,
                  opacity: 0.3,
                }}
              />

              {/* 中心标记线 */}
              <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-white/80 -translate-x-1/2" />

              {/* 滑块 */}
              <motion.div
                className="absolute top-1/2 w-10 h-10 -translate-x-1/2 -translate-y-1/2 bg-white rounded-full shadow-lg border-4 border-orange-400 cursor-grab active:cursor-grabbing"
                style={{
                  left: `${sliderValue}%`,
                }}
                animate={{
                  scale: isDragging ? 1.1 : 1,
                }}
              >
                {/* 滑块上的图标 */}
                <div className="absolute inset-0 flex items-center justify-center text-lg">
                  {sliderValue < 40 ? '🐢' : sliderValue > 60 ? '🚀' : '😊'}
                </div>
              </motion.div>
            </div>

            {/* 快速标签 */}
            <div className="text-xs font-bold text-orange-600 text-center w-8 flex-shrink-0">
              <div>快</div>
              <div>➡️</div>
            </div>
          </div>

          {/* 中心标记 */}
          <div className="flex justify-center mt-3">
            <div className="text-sm font-bold text-gray-600">
              {sliderValue < 40 ? '🚀 慢慢来～' : sliderValue > 60 ? '🚀 好开心～' : '😊 刚刚好～'}
            </div>
          </div>
        </div>
      </div>

      {/* 底部装饰草地 */}
      <div className="absolute bottom-0 left-0 right-0 h-20 overflow-hidden pointer-events-none">
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
