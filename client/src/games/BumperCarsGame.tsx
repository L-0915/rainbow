import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect, useCallback, useRef } from 'react';
import { useAppStore } from '@/store/appStore';
import { getPublicUrl } from '@/utils/getPublicUrl';

/**
 * 💓 心跳共振 - Heartbeat Resonance
 *
 * 核心设计理念：
 * - 心率是游戏的「能量来源」，不是简单的速度乘数
 * - 心率区间决定「能力类型」，不同心率解锁不同玩法
 * - 心率变异性 (HRV) 影响「共振强度」
 * - 呼吸训练是游戏机制的一部分，不是附加功能
 *
 * 玩法循环：
 * 1. 心率上升 → 能量收集效率提高，但控制变难
 * 2. 心率平稳 → 进入「专注模式」，精准引导能量
 * 3. 主动呼吸 → 降低心率，进入「冷静模式」，解锁隐藏路径
 * 4. 心率与游戏节奏同步 → 触发「心流状态」，得分翻倍
 */

// 心率区间定义
const HEART_RATE_ZONES = {
  rest: { id: 'rest', min: 0, max: 60, name: '静息', color: '#4DABF7', ability: '冷静' },
  warm: { id: 'warm', min: 60, max: 85, name: '放松', color: '#69DB7C', ability: '平衡' },
  active: { id: 'active', min: 85, max: 115, name: '活跃', color: '#FFA94D', ability: '加速' },
  peak: { id: 'peak', min: 115, max: 200, name: '巅峰', color: '#FF6B6B', ability: '爆发' },
};

// 能量节点类型
const NODE_TYPES = [
  { id: 'collector', color: '#4DABF7', shape: 'circle', description: '收集能量' },
  { id: 'amplifier', color: '#FFA94D', shape: 'diamond', description: '放大能量' },
  { id: 'stabilizer', color: '#69DB7C', shape: 'square', description: '稳定能量' },
  { id: 'converter', color: '#DA77F2', shape: 'triangle', description: '转换能量' },
] as const;

interface Vector2 {
  x: number;
  y: number;
}

interface EnergyNode {
  id: number;
  type: typeof NODE_TYPES[number]['id'];
  pos: Vector2;
  energy: number;
  maxEnergy: number;
  outputRate: number;
  active: boolean;
}

interface EnergyOrb {
  id: number;
  pos: Vector2;
  vel: Vector2;
  energy: number;
  color: string;
  fromNode: number;
  collected: boolean;
}

interface HeartCore {
  pos: Vector2;
  vel: Vector2;
  energy: number;
  maxEnergy: number;
  pulse: number;
  resonance: number;
}

interface BreathGuide {
  phase: 'inhale' | 'hold' | 'exhale' | 'empty';
  progress: number;
  targetHR: number;
  active: boolean;
}

interface FlowState {
  active: boolean;
  multiplier: number;
  duration: number;
  rhythm: number;
}

interface Particle {
  id: number;
  pos: Vector2;
  vel: Vector2;
  life: number;
  color: string;
  size: number;
  type: 'spark' | 'trail' | 'burst' | 'pulse';
}

export const BumperCarsGame = () => {
  const navigateTo = useAppStore((state) => state.navigateTo);
  const endGame = useAppStore((state) => state.endGame);

  // 默认角色图片
  const defaultAvatarUrl = getPublicUrl('/卡通数字人.png');

  // 游戏状态
  const [gamePhase, setGamePhase] = useState<'intro' | 'playing' | 'breathing' | 'finished'>('intro');
  const [score, setScore] = useState(0);
  const [energyCollected, setEnergyCollected] = useState(0);
  const [combo, setCombo] = useState(0);
  const [maxCombo, setMaxCombo] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30);

  // 心率核心数据
  const [heartRate, setHeartRate] = useState(75);
  const [prevHeartRate, setPrevHeartRate] = useState(75);
  const [isWatchConnected, setIsWatchConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [hrv, setHrv] = useState(50); // 心率变异性 (0-100)
  const [heartSync, setHeartSync] = useState(0); // 心率与游戏节奏同步度 (0-100)

  // 当前心率区间
  const getCurrentZone = () => {
    if (heartRate < HEART_RATE_ZONES.rest.max) return HEART_RATE_ZONES.rest;
    if (heartRate < HEART_RATE_ZONES.warm.max) return HEART_RATE_ZONES.warm;
    if (heartRate < HEART_RATE_ZONES.active.max) return HEART_RATE_ZONES.active;
    return HEART_RATE_ZONES.peak;
  };
  const currentZone = getCurrentZone();

  // 游戏对象
  const [heartCore, setHeartCore] = useState<HeartCore>({
    pos: { x: 200, y: 300 },
    vel: { x: 0, y: 0 },
    energy: 50,
    maxEnergy: 100,
    pulse: 0,
    resonance: 1,
  });

  const [nodes, setNodes] = useState<EnergyNode[]>([]);
  const [orbs, setOrbs] = useState<EnergyOrb[]>([]);
  const [particles, setParticles] = useState<Particle[]>([]);

  // 呼吸引导
  const [breathGuide, setBreathGuide] = useState<BreathGuide>({
    phase: 'inhale',
    progress: 0,
    targetHR: 65,
    active: false,
  });

  // 心流状态
  const [flowState, setFlowState] = useState<FlowState>({
    active: false,
    multiplier: 1,
    duration: 0,
    rhythm: 0,
  });

  // 控制状态
  const [isMoving, setIsMoving] = useState(false);
  const [moveDirection, setMoveDirection] = useState<Vector2>({ x: 0, y: 0 });

  const containerRef = useRef<HTMLDivElement>(null);
  const gameLoopRef = useRef<number>();
  const heartBeatTimerRef = useRef<number>();
  const particleIdRef = useRef(0);

  // 初始化能量节点
  const initNodes = useCallback((width: number, height: number) => {
    const nodeTypes = NODE_TYPES.map(t => t.id);
    return Array.from({ length: 6 }, (_, i) => ({
      id: i,
      type: nodeTypes[i % nodeTypes.length],
      pos: {
        x: width * (0.2 + (i % 3) * 0.3),
        y: height * (0.2 + Math.floor(i / 3) * 0.6),
      },
      energy: 0,
      maxEnergy: 100,
      outputRate: 0.5,
      active: true,
    }));
  }, []);

  // 创建能量珠
  const createOrb = useCallback((fromNode: EnergyNode): EnergyOrb => {
    const nodeType = NODE_TYPES.find(t => t.id === fromNode.type);
    // 能量珠飞向心核
    const targetX = heartCore.pos.x;
    const targetY = heartCore.pos.y;
    const dx = targetX - fromNode.pos.x;
    const dy = targetY - fromNode.pos.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    return {
      id: particleIdRef.current++,
      pos: { ...fromNode.pos },
      vel: { x: (dx / dist) * 2, y: (dy / dist) * 2 },
      energy: 10,
      color: nodeType?.color || '#fff',
      fromNode: fromNode.id,
      collected: false,
    };
  }, [heartCore.pos]);

  // 创建粒子
  const createParticles = useCallback((pos: Vector2, color: string, count: number = 8, type: Particle['type'] = 'spark'): Particle[] => {
    return Array.from({ length: count }, () => ({
      id: particleIdRef.current++,
      pos: { ...pos },
      vel: { x: (Math.random() - 0.5) * 6, y: (Math.random() - 0.5) * 6 },
      life: 1,
      color,
      size: 3 + Math.random() * 5,
      type,
    }));
  }, []);

  // 模拟心率数据
  useEffect(() => {
    const interval = setInterval(() => {
      setPrevHeartRate(heartRate);
      setHeartRate(prev => {
        // 根据游戏状态模拟心率变化
        const gameIntensity = combo / 10; // 连击越高越紧张
        const baseChange = (Math.random() - 0.5) * 4;
        const intensityBoost = gameIntensity * 2;

        let newHR = prev + baseChange + intensityBoost;

        // 呼吸模式下心率下降
        if (breathGuide.active) {
          newHR -= 2;
        }

        // 心流状态下心率稳定
        if (flowState.active) {
          newHR = 85 + (Math.random() - 0.5) * 2;
        }

        return Math.max(50, Math.min(150, newHR));
      });

      // 模拟 HRV（心率变异性）
      setHrv(prev => {
        const target = flowState.active ? 80 : breathGuide.active ? 70 : 50;
        return prev + (target - prev) * 0.05 + (Math.random() - 0.5) * 5;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [heartRate, combo, breathGuide.active, flowState.active]);

  // 心跳节奏同步游戏节奏
  useEffect(() => {
    if (gamePhase !== 'playing') return;

    const beatInterval = 60000 / heartRate; // 心跳间隔 (ms)

    const heartbeat = () => {
      // 心核脉冲
      setHeartCore(prev => ({
        ...prev,
        pulse: 1.2,
        resonance: prev.resonance + 0.1,
      }));

      // 检查是否进入心流状态（心率与游戏节奏同步）
      setHeartSync(prev => {
        const newSync = Math.min(100, prev + 5);
        if (newSync >= 100 && !flowState.active) {
          // 触发心流状态！
          setFlowState({
            active: true,
            multiplier: 2,
            duration: 10,
            rhythm: heartRate,
          });
        }
        return newSync;
      });

      // 心跳后脉冲衰减
      setTimeout(() => {
        setHeartCore(prev => ({ ...prev, pulse: 1 }));
      }, 200);
    };

    heartbeat();
    heartBeatTimerRef.current = setInterval(heartbeat, beatInterval);

    return () => {
      if (heartBeatTimerRef.current) clearInterval(heartBeatTimerRef.current);
    };
  }, [gamePhase, heartRate, flowState.active]);

  // 心流状态计时
  useEffect(() => {
    if (!flowState.active) return;

    const interval = setInterval(() => {
      setFlowState(prev => {
        if (prev.duration <= 1) {
          return { ...prev, active: false, multiplier: 1, duration: 0 };
        }
        return { ...prev, duration: prev.duration - 1 };
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [flowState.active]);

  // 心率区间能力效果
  const getZoneEffect = useCallback(() => {
    switch (currentZone.id) {
      case 'rest':
        return {
          collectionSpeed: 0.5,    // 收集慢但精准
          controlSensitivity: 0.7,  // 控制更灵敏
          orbAttraction: 1.5,       // 能量珠更容易被吸引
          name: '冷静模式',
        };
      case 'warm':
        return {
          collectionSpeed: 1.0,
          controlSensitivity: 1.0,
          orbAttraction: 1.0,
          name: '平衡模式',
        };
      case 'active':
        return {
          collectionSpeed: 1.5,
          controlSensitivity: 1.2,
          orbAttraction: 0.8,
          name: '加速模式',
        };
      case 'peak':
        return {
          collectionSpeed: 2.0,
          controlSensitivity: 1.5,
          orbAttraction: 0.5,
          name: '爆发模式',
        };
      default:
        return { collectionSpeed: 1, controlSensitivity: 1, orbAttraction: 1, name: '普通' };
    }
  }, [currentZone.id]);

  const zoneEffect = getZoneEffect();

  // 游戏主循环
  useEffect(() => {
    if (gamePhase !== 'playing') return;

    const gameArea = containerRef.current;
    if (!gameArea) return;

    const width = gameArea.clientWidth;
    const height = gameArea.clientHeight;

    const gameLoop = () => {
      const timeScale = zoneEffect.collectionSpeed * (flowState.active ? 1.5 : 1);

      // 更新心核位置
      setHeartCore(prev => {
        let newVel = { ...prev.vel };
        const sensitivity = zoneEffect.controlSensitivity;

        if (isMoving) {
          newVel.x += moveDirection.x * 0.3 * sensitivity;
          newVel.y += moveDirection.y * 0.3 * sensitivity;
        }

        newVel.x *= 0.94;
        newVel.y *= 0.94;

        const maxSpeed = 8 * sensitivity;
        const speed = Math.sqrt(newVel.x ** 2 + newVel.y ** 2);
        if (speed > maxSpeed) {
          newVel.x = (newVel.x / speed) * maxSpeed;
          newVel.y = (newVel.y / speed) * maxSpeed;
        }

        let newX = prev.pos.x + newVel.x;
        let newY = prev.pos.y + newVel.y;

        const coreSize = 25;
        if (newX < coreSize) { newX = coreSize; newVel.x = -newVel.x * 0.6; }
        if (newX > width - coreSize) { newX = width - coreSize; newVel.x = -newVel.x * 0.6; }
        if (newY < coreSize) { newY = coreSize; newVel.y = -newVel.y * 0.6; }
        if (newY > height - coreSize) { newY = height - coreSize; newVel.y = -newVel.y * 0.6; }

        // HRV 影响共振强度
        const hrvBonus = hrv / 100;

        return {
          ...prev,
          pos: { x: newX, y: newY },
          vel: newVel,
          energy: Math.min(prev.maxEnergy, prev.energy + 0.1 * hrvBonus),
          pulse: Math.max(1, prev.pulse - 0.05),
          resonance: Math.min(2, prev.resonance + 0.001),
        };
      });

      // 节点产生能量珠
      setNodes(prev => prev.map(node => {
        if (!node.active) return node;

        // 心率越高，节点产生能量越快
        const productionRate = node.outputRate * (heartRate / 75) * timeScale;

        if (node.energy < node.maxEnergy) {
          return { ...node, energy: Math.min(node.maxEnergy, node.energy + productionRate) };
        }

        // 能量满时产生能量珠
        if (Math.random() > 0.98) {
          const newOrb = createOrb(node);
          setOrbs(orbs => [...orbs, newOrb]);
          return { ...node, energy: 0 };
        }

        return node;
      }));

      // 更新能量珠
      setOrbs(prev => {
        const remaining: EnergyOrb[] = [];

        prev.forEach(orb => {
          if (orb.collected) return;

          // 能量珠飞向心核（HRV 越高，吸引力越强）
          const dx = heartCore.pos.x - orb.pos.x;
          const dy = heartCore.pos.y - orb.pos.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          const attraction = zoneEffect.orbAttraction * (1 + hrv / 100);
          orb.vel.x += (dx / dist) * 0.1 * attraction;
          orb.vel.y += (dy / dist) * 0.1 * attraction;

          // 速度限制
          const maxOrbSpeed = 8;
          const orbSpeed = Math.sqrt(orb.vel.x ** 2 + orb.vel.y ** 2);
          if (orbSpeed > maxOrbSpeed) {
            orb.vel.x = (orb.vel.x / orbSpeed) * maxOrbSpeed;
            orb.vel.y = (orb.vel.y / orbSpeed) * maxOrbSpeed;
          }

          orb.pos.x += orb.vel.x;
          orb.pos.y += orb.vel.y;

          // 检测是否被心核收集
          if (dist < 40) {
            orb.collected = true;
            const scoreGain = orb.energy * flowState.multiplier;
            setScore(s => s + scoreGain);
            setEnergyCollected(e => e + orb.energy);
            setCombo(c => c + 1);
            setMaxCombo(m => Math.max(m, combo + 1));

            // 收集特效
            setParticles(p => [...p, ...createParticles(orb.pos, orb.color, 6, 'spark')]);

            // 心流状态下额外奖励
            if (flowState.active) {
              setParticles(p => [...p, ...createParticles(orb.pos, '#FFFFFF', 4, 'burst')]);
            }
            return;
          }

          // 边界检查
          if (orb.pos.x < 0 || orb.pos.x > width || orb.pos.y < 0 || orb.pos.y > height) {
            return; // 移除出界能量珠
          }

          remaining.push(orb);
        });

        return remaining;
      });

      // 更新粒子
      setParticles(prev => prev
        .map(p => ({
          ...p,
          pos: { x: p.pos.x + p.vel.x, y: p.pos.y + p.vel.y },
          vel: { x: p.vel.x * 0.96, y: p.vel.y * 0.96 },
          life: p.life - 0.02,
          size: p.size * 0.98,
        }))
        .filter(p => p.life > 0 && p.size > 0.5)
      );

      // 心核能量自然衰减
      setHeartCore(prev => ({
        ...prev,
        energy: Math.max(0, prev.energy - 0.05),
      }));

      gameLoopRef.current = requestAnimationFrame(gameLoop);
    };

    gameLoopRef.current = requestAnimationFrame(gameLoop);

    return () => {
      if (gameLoopRef.current) cancelAnimationFrame(gameLoopRef.current);
    };
  }, [gamePhase, isMoving, moveDirection, heartRate, hrv, flowState, combo, zoneEffect, createParticles]);

  // 计时器
  useEffect(() => {
    if (gamePhase !== 'playing') return;

    const interval = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          setGamePhase('finished');
          return 0;
        }
        return prev - 1;
      });

      // 心流同步度衰减
      setHeartSync(prev => Math.max(0, prev - 2));
    }, 1000);

    return () => clearInterval(interval);
  }, [gamePhase]);

  // 呼吸练习逻辑
  useEffect(() => {
    if (!breathGuide.active) return;

    const breathe = () => {
      setBreathGuide(prev => {
        const newProgress = prev.progress + 0.02;

        if (newProgress >= 1) {
          // 切换呼吸阶段
          switch (prev.phase) {
            case 'inhale':
              return { ...prev, phase: 'hold', progress: 0 };
            case 'hold':
              return { ...prev, phase: 'exhale', progress: 0 };
            case 'exhale':
              return { ...prev, phase: 'empty', progress: 0 };
            case 'empty':
              return { ...prev, phase: 'inhale', progress: 0 };
          }
        }

        return { ...prev, progress: newProgress };
      });
    };

    const interval = setInterval(breathe, 50);
    return () => clearInterval(interval);
  }, [breathGuide.active]);

  // 呼吸引导完成效果
  useEffect(() => {
    if (!breathGuide.active) return;

    if (breathGuide.phase === 'exhale' && breathGuide.progress > 0.8) {
      // 呼气结束时的放松效果
      setHeartRate(hr => Math.max(50, hr - 5));
      setFlowState(prev => ({ ...prev, active: false })); // 重置心流，重新开始积累
    }
  }, [breathGuide.phase, breathGuide.progress, breathGuide.active]);

  // 控制处理
  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    if (gamePhase !== 'playing') return;
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const dx = x - heartCore.pos.x;
    const dy = y - heartCore.pos.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist > 20) {
      setIsMoving(true);
      setMoveDirection({ x: dx / dist, y: dy / dist });
    }
  }, [gamePhase, heartCore.pos]);

  const handlePointerUp = useCallback(() => {
    setIsMoving(false);
    setMoveDirection({ x: 0, y: 0 });
  }, []);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!isMoving || gamePhase !== 'playing') return;
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const dx = x - heartCore.pos.x;
    const dy = y - heartCore.pos.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist > 20) {
      setMoveDirection({ x: dx / dist, y: dy / dist });
    }
  }, [isMoving, gamePhase, heartCore.pos]);

  // 键盘控制
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (gamePhase !== 'playing') return;
      setIsMoving(true);
      if (e.key === 'ArrowUp' || e.key === 'w') setMoveDirection({ x: 0, y: -1 });
      else if (e.key === 'ArrowDown' || e.key === 's') setMoveDirection({ x: 0, y: 1 });
      else if (e.key === 'ArrowLeft' || e.key === 'a') setMoveDirection({ x: -1, y: 0 });
      else if (e.key === 'ArrowRight' || e.key === 'd') setMoveDirection({ x: 1, y: 0 });
    };

    const handleKeyUp = () => {
      setIsMoving(false);
      setMoveDirection({ x: 0, y: 0 });
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [gamePhase]);

  // 开始游戏
  const handleStart = () => {
    const width = containerRef.current?.clientWidth || 400;
    const height = containerRef.current?.clientHeight || 500;

    setNodes(initNodes(width, height));
    setHeartCore({
      pos: { x: width / 2, y: height / 2 },
      vel: { x: 0, y: 0 },
      energy: 50,
      maxEnergy: 100,
      pulse: 1,
      resonance: 1,
    });
    setOrbs([]);
    setParticles([]);
    setBreathGuide({ phase: 'inhale', progress: 0, targetHR: 65, active: false });
    setFlowState({ active: false, multiplier: 1, duration: 0, rhythm: 0 });
    setGamePhase('playing');
    setScore(0);
    setEnergyCollected(0);
    setCombo(0);
    setMaxCombo(0);
    setTimeLeft(30);
    setHeartSync(0);
  };

  const handleBack = () => {
    endGame();
    navigateTo('playground');
  };

  const handleRestart = () => {
    const width = containerRef.current?.clientWidth || 400;
    const height = containerRef.current?.clientHeight || 500;
    setNodes(initNodes(width, height));
    setGamePhase('playing');
    setScore(0);
    setEnergyCollected(0);
    setCombo(0);
    setMaxCombo(0);
    setTimeLeft(30);
    setOrbs([]);
    setParticles([]);
    setFlowState({ active: false, multiplier: 1, duration: 0, rhythm: 0 });
    setHeartSync(0);
  };

  const toggleBreathing = () => {
    setBreathGuide(prev => ({ ...prev, active: !prev.active, progress: 0 }));
  };

  // 开始界面
  if (gamePhase === 'intro') {
    return (
      <div className="relative min-h-screen w-full overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-purple-900 to-indigo-900" />

        {/* 动态背景 - 模拟心跳脉动 */}
        <div className="absolute inset-0 overflow-hidden">
          {[...Array(15)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute rounded-full opacity-10"
              style={{
                background: `radial-gradient(circle, ${NODE_TYPES[i % 4].color}, transparent)`,
                width: 40 + i * 20,
                height: 40 + i * 20,
                left: '50%',
                top: '50%',
                transform: 'translate(-50%, -50%)',
              }}
              animate={{
                scale: [1, 1.5, 1],
                opacity: [0.05, 0.15, 0.05],
              }}
              transition={{
                duration: 1,
                repeat: Infinity,
                delay: i * 0.1,
              }}
            />
          ))}
        </div>

        <div className="absolute top-4 left-4 z-50">
          <motion.button
            onClick={handleBack}
            className="bg-white/10 backdrop-blur-xl px-5 py-2.5 rounded-full shadow-xl font-bold text-white border border-white/20"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            ← 返回
          </motion.button>
        </div>

        <div className="relative z-10 flex items-center justify-center min-h-screen px-4">
          <motion.div
            className="bg-white/5 backdrop-blur-xl rounded-3xl p-8 shadow-2xl border border-white/10 max-w-lg w-full"
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
          >
            {/* 标题 */}
            <div className="text-center mb-8">
              <motion.div
                className="w-28 h-28 mx-auto mb-4 rounded-full relative"
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 1, repeat: Infinity }}
              >
                <div className="absolute inset-0 rounded-full" style={{
                  background: 'conic-gradient(from 0deg, #4DABF7, #69DB7C, #FFA94D, #FF6B6B, #DA77F2, #4DABF7)',
                }} />
                <div className="absolute inset-1 rounded-full bg-slate-900 flex items-center justify-center">
                  <motion.div
                    className="w-12 h-12 rounded-full bg-gradient-to-br from-pink-400 to-red-500"
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 1, repeat: Infinity }}
                  />
                </div>
              </motion.div>
              <h1 className="text-3xl font-bold text-white mb-2">心跳共振</h1>
              <p className="text-white/50 text-sm">Heartbeat Resonance</p>
            </div>

            {/* 核心玩法 - 强调心率机制 */}
            <div className="space-y-4 mb-8">
              <div className="bg-gradient-to-r from-blue-500/20 to-cyan-500/20 rounded-2xl p-4 border border-blue-400/30">
                <div className="flex items-center gap-4">
                  <div className="text-3xl">💓</div>
                  <div>
                    <p className="text-white font-bold text-sm">心率 = 能量</p>
                    <p className="text-white/60 text-xs">心率越高，节点产生能量珠越快</p>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 rounded-2xl p-4 border border-green-400/30">
                <div className="flex items-center gap-4">
                  <div className="text-3xl">🎯</div>
                  <div>
                    <p className="text-white font-bold text-sm">心率区间 = 能力</p>
                    <p className="text-white/60 text-xs">不同心率解锁不同控制模式</p>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-2xl p-4 border border-purple-400/30">
                <div className="flex items-center gap-4">
                  <div className="text-3xl">🧘</div>
                  <div>
                    <p className="text-white font-bold text-sm">呼吸 = 调节</p>
                    <p className="text-white/60 text-xs">主动呼吸降低心率，重置心流</p>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-r from-orange-500/20 to-red-500/20 rounded-2xl p-4 border border-orange-400/30">
                <div className="flex items-center gap-4">
                  <div className="text-3xl">✨</div>
                  <div>
                    <p className="text-white font-bold text-sm">同步 = 心流</p>
                    <p className="text-white/60 text-xs">心率与游戏节奏同步，得分翻倍</p>
                  </div>
                </div>
              </div>
            </div>

            {/* 心率区间说明 */}
            <div className="mb-6 p-4 bg-white/5 rounded-2xl border border-white/10">
              <p className="text-white/70 text-sm font-bold mb-3">心率区间效果</p>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ background: HEART_RATE_ZONES.rest.color }} />
                  <span className="text-white/70">静息：精准控制</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ background: HEART_RATE_ZONES.warm.color }} />
                  <span className="text-white/70">放松：平衡状态</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ background: HEART_RATE_ZONES.active.color }} />
                  <span className="text-white/70">活跃：加速收集</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ background: HEART_RATE_ZONES.peak.color }} />
                  <span className="text-white/70">巅峰：爆发输出</span>
                </div>
              </div>
            </div>

            {/* 心率连接 */}
            <div className="mb-6 p-4 bg-white/5 rounded-2xl border border-white/10">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{isWatchConnected ? '⌚' : '○'}</span>
                  <div>
                    <p className="text-white/90 text-sm font-bold">
                      {isWatchConnected ? '心率监测中' : '连接手表'}
                    </p>
                    <p className="text-white/50 text-xs">
                      {isWatchConnected ? `当前心率：${heartRate} bpm` : '使用模拟心率数据'}
                    </p>
                  </div>
                </div>
                {!isWatchConnected ? (
                  <motion.button
                    onClick={() => {
                      setIsConnecting(true);
                      setTimeout(() => {
                        setIsWatchConnected(true);
                        setIsConnecting(false);
                      }, 1500);
                    }}
                    disabled={isConnecting}
                    className="bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold text-sm py-2 px-4 rounded-full"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    {isConnecting ? '连接中...' : '连接'}
                  </motion.button>
                ) : (
                  <motion.button
                    onClick={() => setIsWatchConnected(false)}
                    className="bg-white/10 text-white/70 font-bold text-sm py-2 px-4 rounded-full"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    断开
                  </motion.button>
                )}
              </div>
            </div>

            {/* 开始按钮 */}
            <motion.button
              onClick={handleStart}
              className="w-full bg-gradient-to-r from-purple-500 via-pink-500 to-purple-500 text-white font-bold text-lg py-4 rounded-full shadow-lg"
              whileHover={{ scale: 1.03, y: -2 }}
              whileTap={{ scale: 0.97 }}
              style={{ backgroundSize: '200% 100%' }}
              animate={{ backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'] }}
              transition={{ duration: 3, repeat: Infinity }}
            >
              开始共振之旅
            </motion.button>
          </motion.div>
        </div>
      </div>
    );
  }

  // 游戏结束界面
  if (gamePhase === 'finished') {
    return (
      <div className="relative min-h-screen w-full overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-purple-900 to-indigo-900" />

        <div className="relative z-10 flex items-center justify-center min-h-screen px-4">
          <motion.div
            className="bg-white/5 backdrop-blur-xl rounded-3xl p-8 shadow-2xl border border-white/10 max-w-md w-full text-center"
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
          >
            {/* 结算动画 - 心跳形状 */}
            <motion.div
              className="w-24 h-24 mx-auto mb-6 rounded-full relative"
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 1, repeat: Infinity }}
            >
              <div className="absolute inset-0 rounded-full" style={{
                background: `conic-gradient(from ${score / 50}deg, #4DABF7, #69DB7C, #FFA94D, #FF6B6B)`,
              }} />
              <div className="absolute inset-1 rounded-full bg-slate-900 flex items-center justify-center">
                <span className="text-3xl">{score > 2000 ? '💎' : score > 1000 ? '⭐' : '○'}</span>
              </div>
            </motion.div>

            <h2 className="text-2xl font-bold text-white mb-6">共振结束</h2>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-white/5 rounded-2xl p-4">
                <div className="text-white/50 text-xs mb-1">总得分</div>
                <div className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
                  {Math.floor(score)}
                </div>
              </div>
              <div className="bg-white/5 rounded-2xl p-4">
                <div className="text-white/50 text-xs mb-1">收集能量</div>
                <div className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-green-400">
                  {Math.floor(energyCollected)}
                </div>
              </div>
              <div className="bg-white/5 rounded-2xl p-4">
                <div className="text-white/50 text-xs mb-1">最大连击</div>
                <div className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-red-400">
                  {maxCombo}
                </div>
              </div>
              <div className="bg-white/5 rounded-2xl p-4">
                <div className="text-white/50 text-xs mb-1">平均心率</div>
                <div className="text-2xl font-bold text-white">
                  {Math.floor((heartRate + prevHeartRate) / 2)} <span className="text-xs text-white/50">bpm</span>
                </div>
              </div>
            </div>

            {/* 心率区间统计 */}
            <div className="mb-6 p-4 bg-white/5 rounded-2xl border border-white/10">
              <p className="text-white/70 text-sm font-bold mb-3">心率区间分布</p>
              <div className="flex gap-1 h-4 rounded-full overflow-hidden">
                <div className="bg-[#4DABF7]" style={{ width: '25%' }} />
                <div className="bg-[#69DB7C]" style={{ width: '35%' }} />
                <div className="bg-[#FFA94D]" style={{ width: '30%' }} />
                <div className="bg-[#FF6B6B]" style={{ width: '10%' }} />
              </div>
              <div className="flex justify-between text-xs text-white/50 mt-2">
                <span>静息</span>
                <span>放松</span>
                <span>活跃</span>
                <span>巅峰</span>
              </div>
            </div>

            {/* 评价 */}
            <motion.p className="text-white/70 mb-8">
              {score > 3000 ? '大师级共振！' :
               score > 1500 ? '出色的心率控制！' :
               '继续练习，感受心跳的节奏！'}
            </motion.p>

            <div className="flex gap-3">
              <motion.button
                onClick={handleRestart}
                className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold py-3 rounded-full"
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
              >
                再来一次
              </motion.button>
              <motion.button
                onClick={handleBack}
                className="flex-1 bg-white/10 text-white/70 font-bold py-3 rounded-full"
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
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
      ref={containerRef}
      className="relative min-h-screen w-full overflow-hidden touch-none"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
    >
      {/* 深色背景 */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-purple-900 to-indigo-900" />

      {/* 背景网格 */}
      <svg className="absolute inset-0 opacity-10" width="100%" height="100%">
        <defs>
          <pattern id="grid" width="50" height="50" patternUnits="userSpaceOnUse">
            <path d="M 50 0 L 0 0 0 50" fill="none" stroke="white" strokeWidth="0.5" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />
      </svg>

      {/* 心流状态全屏效果 */}
      {flowState.active && (
        <motion.div
          className="absolute inset-0 pointer-events-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div className="absolute inset-0" style={{
            background: 'radial-gradient(circle at center, rgba(218,119,242,0.2), transparent 70%)',
          }} />
          {/* 心流倒计时 */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center">
            <motion.div
              className="text-6xl font-bold text-white/30"
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 0.5, repeat: Infinity }}
            >
              心流 x{flowState.multiplier}
            </motion.div>
            <div className="text-white/50 text-lg mt-2">剩余 {flowState.duration}s</div>
          </div>
        </motion.div>
      )}

      {/* 顶部 UI */}
      <div className="absolute top-4 left-4 right-4 z-50 flex items-center justify-between">
        <motion.button
          onClick={handleBack}
          className="bg-white/10 backdrop-blur-xl px-4 py-2 rounded-full shadow-xl font-bold text-white border border-white/20 text-sm"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          ← 返回
        </motion.button>

        <div className="flex items-center gap-3">
          {/* 心率显示 - 核心 UI */}
          <motion.div
            className="bg-white/10 backdrop-blur-xl px-4 py-2 rounded-full border border-white/20"
            animate={{
              borderColor: currentZone.color,
              boxShadow: `0 0 20px ${currentZone.color}40`,
            }}
          >
            <div className="flex items-center gap-2">
              <motion.div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: currentZone.color }}
                animate={{ scale: [1, 1.3, 1] }}
                transition={{ duration: 60 / heartRate, repeat: Infinity }}
              />
              <span className="text-white font-bold text-lg">{heartRate}</span>
              <span className="text-white/50 text-xs">bpm</span>
            </div>
          </motion.div>

          {/* 心率区间名称 */}
          <div
            className="px-3 py-1 rounded-full text-xs font-bold"
            style={{
              backgroundColor: `${currentZone.color}30`,
              color: currentZone.color,
              border: `1px solid ${currentZone.color}50`,
            }}
          >
            {currentZone.name}
          </div>

          {/* 时间 */}
          <div className={`backdrop-blur-xl px-4 py-2 rounded-full border ${
            timeLeft < 10 ? 'bg-red-500/30 border-red-400/50' : 'bg-white/10 border-white/20'
          }`}>
            <span className={`font-bold ${timeLeft < 10 ? 'text-red-300' : 'text-white'}`}>
              {timeLeft}s
            </span>
          </div>
        </div>

        <div className="w-12" />
      </div>

      {/* 左侧 - 得分和连击 */}
      <div className="absolute left-4 top-1/2 -translate-y-1/2 z-40 space-y-3">
        <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-3 border border-white/20 min-w-[80px]">
          <div className="text-white/50 text-xs text-center mb-1">得分</div>
          <div className="text-2xl font-bold text-white text-center">{Math.floor(score)}</div>
        </div>

        {combo > 1 && (
          <motion.div
            className="bg-gradient-to-r from-purple-500/50 to-pink-500/50 backdrop-blur-xl rounded-2xl p-3 border border-purple-400/50 min-w-[80px]"
            initial={{ scale: 0.8 }}
            animate={{ scale: 1.1 }}
          >
            <div className="text-purple-200 text-xs text-center mb-1">连击</div>
            <div className="text-2xl font-bold text-white text-center">x{combo}</div>
          </motion.div>
        )}

        {/* 心核能量 */}
        <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-3 border border-white/20 min-w-[80px]">
          <div className="text-white/50 text-xs text-center mb-2">心能</div>
          <div className="w-full h-24 bg-white/10 rounded-full overflow-hidden">
            <motion.div
              className="w-full origin-bottom rounded-full"
              style={{
                background: `linear-gradient(to top, ${currentZone.color}, transparent)`,
                height: `${(heartCore.energy / heartCore.maxEnergy) * 100}%`,
              }}
            />
          </div>
        </div>
      </div>

      {/* 右侧 - 心流同步和呼吸 */}
      <div className="absolute right-4 top-1/2 -translate-y-1/2 z-40 space-y-3">
        {/* 心流同步条 */}
        <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-3 border border-white/20 min-w-[80px]">
          <div className="text-white/50 text-xs text-center mb-2">心流同步</div>
          <div className="w-full h-3 bg-white/10 rounded-full overflow-hidden">
            <motion.div
              className="h-full rounded-full"
              style={{
                width: `${heartSync}%`,
                background: 'linear-gradient(90deg, #4DABF7, #DA77F2, #FF6B6B)',
              }}
            />
          </div>
          <div className="text-center mt-1">
            <span className="text-xs text-white/50">{heartSync < 100 ? '保持节奏...' : '心流就绪！'}</span>
          </div>
        </div>

        {/* HRV 显示 */}
        <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-3 border border-white/20 min-w-[80px]">
          <div className="text-white/50 text-xs text-center mb-1">HRV</div>
          <div className="text-xl font-bold text-white text-center">{Math.floor(hrv)}</div>
          <div className="text-center">
            <span className="text-xs" style={{ color: hrv > 60 ? '#69DB7C' : hrv > 30 ? '#FFA94D' : '#FF6B6B' }}>
              {hrv > 60 ? '优秀' : hrv > 30 ? '良好' : '一般'}
            </span>
          </div>
        </div>

        {/* 呼吸按钮 */}
        <motion.button
          onClick={toggleBreathing}
          className={`w-16 h-16 rounded-full backdrop-blur-xl border-2 flex items-center justify-center ${
            breathGuide.active
              ? 'bg-green-500/30 border-green-400/50'
              : 'bg-white/10 border-white/20'
          }`}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <span className="text-2xl">{breathGuide.active ? '🧘' : '💨'}</span>
        </motion.button>
      </div>

      {/* 游戏区域 */}
      <div className="absolute inset-0 z-10">
        {/* 能量节点 */}
        {nodes.map(node => {
          const nodeType = NODE_TYPES.find(t => t.id === node.type);
          const fillPercent = (node.energy / node.maxEnergy) * 100;

          return (
            <motion.div
              key={node.id}
              className="absolute"
              style={{ left: node.pos.x, top: node.pos.y, transform: 'translate(-50%, -50%)' }}
              animate={{
                scale: node.energy >= node.maxEnergy ? [1, 1.1, 1] : 1,
              }}
              transition={{ duration: 0.5, repeat: Infinity }}
            >
              {/* 节点容器 */}
              <div className="relative">
                {/* 外环 */}
                <div
                  className="w-16 h-16 rounded-full border-2 opacity-50"
                  style={{ borderColor: nodeType?.color }}
                />
                {/* 能量填充 */}
                <div
                  className="absolute inset-2 rounded-full opacity-80"
                  style={{
                    background: `conic-gradient(${nodeType?.color} ${fillPercent}%, transparent ${fillPercent}%)`,
                  }}
                />
                {/* 中心 */}
                <div
                  className="absolute inset-4 rounded-full"
                  style={{ backgroundColor: nodeType?.color }}
                >
                  {/* 形状标识 */}
                  <svg viewBox="0 0 24 24" className="w-full h-full p-1" fill="white">
                    {nodeType?.shape === 'circle' && <circle cx="12" cy="12" r="8" />}
                    {nodeType?.shape === 'square' && <rect x="6" y="6" width="12" height="12" />}
                    {nodeType?.shape === 'triangle' && <polygon points="12,4 20,18 4,18" />}
                    {nodeType?.shape === 'diamond' && <polygon points="12,4 18,12 12,20 6,12" />}
                  </svg>
                </div>
                {/* 满能量 glow 效果 */}
                {node.energy >= node.maxEnergy && (
                  <div
                    className="absolute inset-0 rounded-full animate-pulse"
                    style={{
                      boxShadow: `0 0 20px ${nodeType?.color}`,
                    }}
                  />
                )}
              </div>
            </motion.div>
          );
        })}

        {/* 能量珠 */}
        {orbs.filter(orb => !orb.collected).map(orb => (
          <motion.div
            key={orb.id}
            className="absolute rounded-full"
            style={{
              left: orb.pos.x,
              top: orb.pos.y,
              width: 12,
              height: 12,
              backgroundColor: orb.color,
              boxShadow: `0 0 15px ${orb.color}`,
            }}
            animate={{
              scale: [1, 1.2, 1],
            }}
            transition={{ duration: 0.3, repeat: Infinity }}
          />
        ))}

        {/* 心核 */}
        <motion.div
          className="absolute z-30"
          style={{
            left: heartCore.pos.x,
            top: heartCore.pos.y,
            transform: 'translate(-50%, -50%)',
          }}
          animate={{
            scale: heartCore.pulse * heartCore.resonance,
          }}
        >
          {/* 心核主体 - 使用卡通数字人 */}
          <div className="relative">
            <div
              className="w-16 h-16 rounded-full overflow-hidden border-4 shadow-lg"
              style={{
                borderColor: currentZone.color,
                boxShadow: `0 0 30px ${currentZone.color}`,
              }}
            >
              <img
                src={defaultAvatarUrl}
                alt="角色"
                className="w-full h-full object-cover"
              />
            </div>
            {/* 外圈光晕脉动 */}
            <motion.div
              className="absolute inset-0 rounded-full"
              animate={{
                scale: [1, 1.3, 1],
                opacity: [0.5, 0.2, 0.5],
              }}
              transition={{
                duration: 60 / heartRate,
                repeat: Infinity,
              }}
              style={{
                background: `radial-gradient(circle, ${currentZone.color}60, transparent)`,
              }}
            />
          </div>
        </motion.div>

        {/* 粒子 */}
        {particles.map(particle => (
          <motion.div
            key={particle.id}
            className="absolute rounded-full"
            style={{
              left: particle.pos.x,
              top: particle.pos.y,
              width: particle.size,
              height: particle.size,
              backgroundColor: particle.color,
              opacity: particle.life,
            }}
          />
        ))}
      </div>

      {/* 呼吸引导覆盖层 */}
      <AnimatePresence>
        {breathGuide.active && (
          <motion.div
            className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={toggleBreathing}
          >
            <div className="text-center">
              {/* 呼吸引导圆环 */}
              <motion.div
                className="w-64 h-64 rounded-full relative mx-auto mb-8"
                style={{
                  border: '4px solid rgba(255,255,255,0.3)',
                }}
              >
                {/* 填充进度 */}
                <motion.div
                  className="absolute inset-0 rounded-full"
                  style={{
                    background: `conic-gradient(from -90deg, ${currentZone.color}${Math.floor(breathGuide.progress * 80)}, transparent 0deg)`,
                  }}
                />
                {/* 中心文字 */}
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <motion.span
                    className="text-6xl mb-4"
                    animate={{
                      scale: breathGuide.phase === 'inhale' ? [1, 1.2] :
                             breathGuide.phase === 'hold' ? [1, 1.05, 1] :
                             breathGuide.phase === 'exhale' ? [1.2, 1] : [1, 1.1],
                    }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    {breathGuide.phase === 'inhale' ? '🌬️' :
                     breathGuide.phase === 'hold' ? '😌' :
                     breathGuide.phase === 'exhale' ? '💨' : '○'}
                  </motion.span>
                  <span className="text-2xl font-bold text-white">
                    {breathGuide.phase === 'inhale' ? '吸气～' :
                     breathGuide.phase === 'hold' ? '屏息～' :
                     breathGuide.phase === 'exhale' ? '呼气～' : '准备～'}
                  </span>
                </div>
              </motion.div>

              {/* 心率变化提示 */}
              <div className="text-white/70 text-sm">
                心率：{heartRate} → {breathGuide.targetHR} bpm
              </div>
              <div className="text-white/50 text-xs mt-2">
                点击任意位置关闭呼吸练习
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 底部提示 */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-40">
        <div className="bg-white/10 backdrop-blur-xl rounded-full px-6 py-3 shadow-xl border border-white/20">
          <p className="text-white/70 font-medium text-sm">
            👆 滑动控制 · ⬆️⬇️⬅️➡️ 键盘 · 💨 呼吸调节
          </p>
        </div>
      </div>
    </div>
  );
};
