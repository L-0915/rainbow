import { useState, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface OnboardingProps {
  onComplete: (userType: 'child' | 'parent') => void;
}

const ONBOARDING_STEPS = [
  {
    title: '欢迎来到彩虹创口贴',
    subtitle: '孩子的情绪创可贴，家长的安心守护',
    emoji: '🌈',
    color: 'from-purple-400 via-pink-400 to-orange-400',
    description: '每个情绪都值得被看见',
  },
  {
    title: '小彩虹陪伴聊天',
    subtitle: '24小时在线的AI知心姐姐',
    emoji: '💬',
    color: 'from-blue-400 via-cyan-400 to-teal-400',
    description: '难过时有地方倾诉，开心时有朋友分享',
  },
  {
    title: '情绪记录成长',
    subtitle: '每天记录心情，了解自己的情绪',
    emoji: '📊',
    color: 'from-yellow-400 via-orange-400 to-red-400',
    description: '培养情绪认知能力，学会表达感受',
  },
  {
    title: '家长安心守护',
    subtitle: '了解孩子的情绪状态，不错过重要时刻',
    emoji: '👨‍👩‍👧',
    color: 'from-green-400 via-emerald-400 to-teal-400',
    description: '异常情绪提醒，及时给予关爱',
  },
];

export const Onboarding = memo(({ onComplete }: OnboardingProps) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [showRoleSelect, setShowRoleSelect] = useState(false);

  const handleNext = () => {
    if (currentStep < ONBOARDING_STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      setShowRoleSelect(true);
    }
  };

  const handleRoleSelect = (userType: 'child' | 'parent') => {
    // 保存用户类型到本地
    localStorage.setItem('rainbow_user_type', userType);
    onComplete(userType);
  };

  // 角色选择界面
  if (showRoleSelect) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-400 via-pink-400 to-orange-400" />

        <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-6">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-center mb-8"
          >
            <div className="text-6xl mb-4">👋</div>
            <h2 className="text-2xl font-black text-white mb-2">你是谁？</h2>
            <p className="text-white/80 text-sm">选择你的身份，获得最佳体验</p>
          </motion.div>

          <div className="w-full max-w-sm space-y-4">
            <motion.button
              onClick={() => handleRoleSelect('child')}
              className="w-full bg-white/95 backdrop-blur-xl rounded-2xl p-6 shadow-xl text-left"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="flex items-center gap-4">
                <div className="text-4xl">👧</div>
                <div>
                  <h3 className="font-bold text-gray-700 text-lg">我是小朋友</h3>
                  <p className="text-gray-500 text-sm">记录心情、和小彩虹聊天</p>
                </div>
              </div>
            </motion.button>

            <motion.button
              onClick={() => handleRoleSelect('parent')}
              className="w-full bg-white/95 backdrop-blur-xl rounded-2xl p-6 shadow-xl text-left"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="flex items-center gap-4">
                <div className="text-4xl">👨‍👩‍👧</div>
                <div>
                  <h3 className="font-bold text-gray-700 text-lg">我是家长</h3>
                  <p className="text-gray-500 text-sm">查看孩子情绪报告、设置提醒</p>
                </div>
              </div>
            </motion.button>
          </div>
        </div>
      </div>
    );
  }

  const step = ONBOARDING_STEPS[currentStep];

  return (
    <div className="fixed inset-0 z-50 flex flex-col">
      {/* 背景 */}
      <motion.div
        key={currentStep}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className={`absolute inset-0 bg-gradient-to-br ${step.color}`}
      />

      {/* 装饰星星 */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(15)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute text-white/30"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              fontSize: 16 + Math.random() * 20,
            }}
            animate={{
              scale: [1, 1.5, 1],
              opacity: [0.2, 0.6, 0.2],
            }}
            transition={{
              duration: 2 + Math.random() * 2,
              repeat: Infinity,
              delay: Math.random() * 2,
            }}
          >
            ✨
          </motion.div>
        ))}
      </div>

      {/* 跳过按钮 */}
      <div className="relative z-10 p-4 flex justify-end">
        <motion.button
          onClick={() => setShowRoleSelect(true)}
          className="text-white/80 text-sm font-bold px-4 py-2 rounded-full bg-white/20 backdrop-blur-sm"
          whileTap={{ scale: 0.9 }}
        >
          跳过
        </motion.button>
      </div>

      {/* 内容 */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="text-center"
          >
            {/* Emoji */}
            <motion.div
              className="text-7xl sm:text-8xl mb-6"
              animate={{
                scale: [1, 1.1, 1],
                rotate: [0, 5, -5, 0],
              }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              {step.emoji}
            </motion.div>

            {/* 标题 */}
            <h1 className="text-2xl sm:text-3xl font-black text-white mb-3 drop-shadow-lg">
              {step.title}
            </h1>

            {/* 副标题 */}
            <p className="text-lg sm:text-xl text-white/90 mb-2 font-bold">
              {step.subtitle}
            </p>

            {/* 描述 */}
            <p className="text-white/70 text-sm sm:text-base">
              {step.description}
            </p>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* 底部导航 */}
      <div className="relative z-10 p-6 sm:p-8">
        {/* 进度指示器 */}
        <div className="flex justify-center gap-2 mb-6">
          {ONBOARDING_STEPS.map((_, index) => (
            <motion.button
              key={index}
              onClick={() => setCurrentStep(index)}
              className={`w-2 h-2 rounded-full transition-all ${
                index === currentStep
                  ? 'w-8 bg-white'
                  : 'bg-white/40'
              }`}
              whileTap={{ scale: 0.8 }}
            />
          ))}
        </div>

        {/* 下一步按钮 */}
        <motion.button
          onClick={handleNext}
          className="w-full bg-white/95 backdrop-blur-xl text-gray-700 font-black text-lg py-4 rounded-2xl shadow-xl"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          {currentStep < ONBOARDING_STEPS.length - 1 ? '下一步' : '开始使用'}
        </motion.button>
      </div>
    </div>
  );
});

Onboarding.displayName = 'Onboarding';