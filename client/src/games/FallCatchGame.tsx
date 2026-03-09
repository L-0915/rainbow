import { useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '@/store/appStore';
import { useCharacterStore } from '@/store/characterStore';

// 鼓励话语
const catchMessages = [
  '太棒啦！接住你超开心～ 💕',
  '哇～和你一起玩真好玩～ ✨',
  '嘿嘿，我最喜欢接住你啦～ 🌈',
  '你跳得真好看！再来一次～ 🎉',
  '抱抱～你超勇敢的～ 🤗',
  '嘻嘻，快乐翻倍～ 😊',
];

const missMessages = [
  '没关系，我会一直在这里等你～ 💕',
  '你超棒的，我们再试一次～ ✨',
  '游戏就是用来开心的呀～ 🌈',
  '你已经做得很好啦～ 👏',
  '慢慢来，我陪着你～ 😊',
  '相信你一定可以的～ 💪',
];

interface Person {
  id: number;
  x: number;
  y: number;
  vy: number;
  caught: boolean;
}

export const FallCatchGame = () => {
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
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(5);
  const [level, setLevel] = useState(1);
  const [timeLeft, setTimeLeft] = useState(60);
  const [message, setMessage] = useState('准备好了吗？用彩虹接住下落的小可爱～ ✨');
  const [showMessage, setShowMessage] = useState(false);
  const [persons, setPersons] = useState<Person[]>([]);
  const [catcherX, setCatcherX] = useState(50);

  // 游戏引用
  const gameAreaRef = useRef<HTMLDivElement>(null);
  const gameLoopRef = useRef<number | null>(null);
  const spawnTimerRef = useRef<number | null>(null);
  const personIdRef = useRef(0);

  // 显示临时消息
  const showMessageTemp = useCallback((text: string) => {
    setMessage(text);
    setShowMessage(true);
    setTimeout(() => setShowMessage(false), 1500);
  }, []);

  // 游戏循环
  useEffect(() => {
    if (!gameStarted || gameOver) return;

    const gameArea = gameAreaRef.current;
    if (!gameArea) return;

    const updateGame = () => {
      setPersons((prevPersons) => {
        const newPersons = prevPersons
          .map((person) => {
            if (person.caught) return person;

            const newY = person.y + person.vy;
            const newVy = person.vy + 0.3;

            // 检查是否接住
            const catcherY = gameArea.clientHeight - 100;
            const personWidth = 50;
            const catcherWidth = 200;
            const catcherLeft = (catcherX / 100) * gameArea.clientWidth - catcherWidth / 2;
            const catcherRight = catcherLeft + catcherWidth;

            if (
              newY >= catcherY - 30 &&
              newY <= catcherY + 30 &&
              person.x >= catcherLeft - personWidth / 2 &&
              person.x <= catcherRight + personWidth / 2
            ) {
              setScore((s) => s + 10);
              const randomMsg = catchMessages[Math.floor(Math.random() * catchMessages.length)];
              showMessageTemp(randomMsg);
              return { ...person, y: catcherY - 30, caught: true };
            }

            // 检查是否掉落
            if (newY > gameArea.clientHeight + 50) {
              setLives((l) => {
                const newLives = l - 1;
                if (newLives <= 0) {
                  setGameOver(true);
                }
                return newLives;
              });
              const randomMsg = missMessages[Math.floor(Math.random() * missMessages.length)];
              showMessageTemp(randomMsg);
              return null;
            }

            return { ...person, y: newY, vy: newVy };
          })
          .filter(Boolean) as Person[];

        return newPersons;
      });

      // 清理被接住的小人
      setTimeout(() => {
        setPersons((prev) => prev.filter((p) => !p.caught));
      }, 500);

      gameLoopRef.current = requestAnimationFrame(updateGame);
    };

    gameLoopRef.current = requestAnimationFrame(updateGame);

    return () => {
      if (gameLoopRef.current) cancelAnimationFrame(gameLoopRef.current);
    };
  }, [gameStarted, gameOver, catcherX, showMessageTemp]);

  // 生成小人
  useEffect(() => {
    if (!gameStarted || gameOver) return;

    const gameArea = gameAreaRef.current;
    if (!gameArea) return;

    const spawnPerson = () => {
      const newPerson: Person = {
        id: personIdRef.current++,
        x: Math.random() * (gameArea.clientWidth - 100) + 50,
        y: -50,
        vy: 2 + level * 0.5,
        caught: false,
      };
      setPersons((prev) => [...prev, newPerson]);
    };

    spawnPerson();

    const spawnInterval = Math.max(800, 2000 - level * 150);
    spawnTimerRef.current = window.setInterval(spawnPerson, spawnInterval);

    return () => {
      if (spawnTimerRef.current) clearInterval(spawnTimerRef.current);
    };
  }, [gameStarted, gameOver, level]);

  // 计时器
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

  // 升级检测
  useEffect(() => {
    const newLevel = Math.floor(score / 100) + 1;
    if (newLevel > level) {
      setLevel(newLevel);
      showMessageTemp(`升级啦！Lv.${newLevel} 加油～ 🔥`);
    }
  }, [score, level, showMessageTemp]);

  // 触屏/鼠标移动控制
  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!gameAreaRef.current) return;
    const rect = gameAreaRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    setCatcherX((prev) => {
      const newX = Math.max(25, Math.min(75, x));
      return newX;
    });
  }, []);

  // 触屏开始
  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    if (!gameAreaRef.current) return;
    const rect = gameAreaRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    setCatcherX((prev) => {
      const newX = Math.max(25, Math.min(75, x));
      return newX;
    });
  }, []);

  // 键盘控制
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' || e.key === 'a') {
        setCatcherX((prev) => Math.max(25, prev - 8));
      } else if (e.key === 'ArrowRight' || e.key === 'd') {
        setCatcherX((prev) => Math.min(75, prev + 8));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // 开始游戏
  const handleStart = () => {
    setGameStarted(true);
    setGameOver(false);
    setScore(0);
    setLives(5);
    setLevel(1);
    setTimeLeft(60);
    setPersons([]);
    personIdRef.current = 0;
    setCatcherX(50);
    showMessageTemp('滑动或按方向键，接住小可爱～ ✨');
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

  // 未开始界面
  if (!gameStarted) {
    return (
      <div className="relative min-h-screen w-full overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-green-200 via-blue-200 to-purple-200" />

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
              <div className="text-8xl mb-4">🪂</div>
              <h1 className="text-3xl font-black bg-gradient-to-r from-green-500 via-blue-500 to-purple-500 bg-clip-text text-transparent">
                坠落与接住
              </h1>
            </motion.div>

            <div className="space-y-3 mb-6">
              <div className="bg-green-100 rounded-2xl p-4">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">🧍</span>
                  <p className="text-sm font-bold text-gray-700">可爱的小人从天空飘落</p>
                </div>
              </div>
              <div className="bg-blue-100 rounded-2xl p-4">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">🌈</span>
                  <p className="text-sm font-bold text-gray-700">用彩虹篮子接住他们</p>
                </div>
              </div>
              <div className="bg-purple-100 rounded-2xl p-4">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">💕</span>
                  <p className="text-sm font-bold text-gray-700">每个角色都会给你温暖鼓励</p>
                </div>
              </div>
            </div>

            <motion.button
              onClick={handleStart}
              className="w-full bg-gradient-to-r from-green-400 via-blue-400 to-purple-400 text-white font-black text-xl py-4 rounded-full shadow-xl"
              whileHover={{ scale: 1.05, y: -3 }}
              whileTap={{ scale: 0.95 }}
            >
              开始游戏 🎮
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
        <div className="absolute inset-0 bg-gradient-to-br from-green-200 via-blue-200 to-purple-200" />

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
              🎉
            </motion.div>
            <h2 className="text-3xl font-black text-purple-600 mb-4">游戏结束啦！</h2>

            <div className="space-y-3 mb-6">
              <div className="bg-purple-100 rounded-2xl p-4">
                <div className="text-sm text-gray-600 font-bold">得分</div>
                <div className="text-4xl font-black text-purple-600">{score}</div>
              </div>
              <div className="bg-blue-100 rounded-2xl p-4">
                <div className="text-sm text-gray-600 font-bold">最高等级</div>
                <div className="text-2xl font-black text-blue-600">Lv.{level}</div>
              </div>
            </div>

            <motion.p className="text-gray-600 font-bold mb-6">
              你接住了 {Math.floor(score / 10)} 个小可爱！你超厉害的～ 👏
            </motion.p>

            <div className="flex gap-3">
              <motion.button
                onClick={handleRestart}
                className="flex-1 bg-gradient-to-r from-purple-400 to-pink-400 text-white font-black py-3 rounded-full"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                再来一次
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
    <div
      ref={gameAreaRef}
      className="relative min-h-screen w-full overflow-hidden touch-none"
      onPointerMove={handlePointerMove}
      onPointerDown={handlePointerDown}
      style={{ backgroundColor: '#E8F5E9' }}
    >
      {/* 天空背景 */}
      <div className="absolute inset-0 bg-gradient-to-b from-sky-200 via-sky-100 to-green-100" />

      {/* 云朵 */}
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
      <div className="absolute top-4 left-4 right-4 z-50 flex items-center justify-between pointer-events-none">
        <motion.button
          onClick={handleBack}
          className="bg-white/80 backdrop-blur-xl px-5 py-2.5 rounded-full shadow-xl font-black text-gray-700 border-4 border-white/60 pointer-events-auto"
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.95 }}
        >
          ← 返回
        </motion.button>
        <div className="bg-gradient-to-r from-green-400 via-blue-400 to-purple-400 backdrop-blur-xl px-6 py-3 rounded-full shadow-2xl border-4 border-white/60">
          <span className="text-xl font-black text-white drop-shadow-lg">🪂 坠落与接住</span>
        </div>
        <div className="w-20" />
      </div>

      {/* 右侧状态面板 */}
      <div className="absolute top-24 right-4 z-40 pointer-events-none">
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-4 shadow-xl border-4 border-white/60">
          <div className="text-center mb-3">
            <div className="text-xs text-gray-500 font-bold">得分</div>
            <div className="text-3xl font-black text-purple-600">{score}</div>
          </div>
          <div className="text-center mb-3">
            <div className="text-xs text-gray-500 font-bold">等级</div>
            <div className="text-2xl font-black text-blue-600">Lv.{level}</div>
          </div>
          <div className="text-center mb-3">
            <div className="text-xs text-gray-500 font-bold">生命</div>
            <div className="text-2xl">{'❤️'.repeat(lives)}</div>
          </div>
          <div className="text-center">
            <div className="text-xs text-gray-500 font-bold">时间</div>
            <div className={`text-2xl font-black ${timeLeft < 10 ? 'text-red-500 animate-pulse' : 'text-gray-600'}`}>
              {timeLeft}s
            </div>
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
            <div className="bg-white/95 backdrop-blur-xl rounded-3xl px-6 py-3 shadow-2xl border-4 border-purple-400/60">
              <p className="text-base font-black text-gray-700 text-center">{message}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 下落的小人 - 使用图片 */}
      <AnimatePresence>
        {persons.map((person) => (
          <motion.div
            key={person.id}
            className="absolute"
            style={{
              left: person.x,
              top: person.y,
              transform: 'translate(-50%, -50%)',
              width: 60,
              height: 60,
            }}
            initial={{ scale: 0, rotate: 0 }}
            animate={{
              scale: 1,
              rotate: person.caught ? [0, 10, -10, 0] : 0,
            }}
            exit={{ scale: 0, opacity: 0 }}
          >
            <img
              src={currentAvatarUrl}
              alt="小人"
              className="w-full h-full object-contain"
              draggable={false}
            />
          </motion.div>
        ))}
      </AnimatePresence>

      {/* 接应垫（彩虹）- 使用图片 */}
      <div
        className="absolute z-30"
        style={{
          left: `${catcherX}%`,
          bottom: 80,
          transform: 'translateX(-50%)',
          width: 220,
          height: 80,
        }}
      >
        <motion.div
          className="w-full h-full"
          animate={{ y: [0, -5, 0] }}
          transition={{ duration: 0.6, repeat: Infinity }}
        >
          <img
            src="/彩虹3.png"
            alt="彩虹篮子"
            className="w-full h-full object-contain"
            draggable={false}
          />
        </motion.div>
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

      {/* 底部提示 */}
      <div className="absolute bottom-24 left-1/2 -translate-x-1/2 z-40 pointer-events-none">
        <div className="bg-white/80 backdrop-blur-xl rounded-full px-6 py-3 shadow-xl border-4 border-white/60">
          <p className="text-gray-700 font-bold text-sm">👆 滑动控制 · ⬅️➡️ 键盘</p>
        </div>
      </div>
    </div>
  );
};
