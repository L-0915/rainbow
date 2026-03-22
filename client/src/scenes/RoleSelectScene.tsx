import { motion } from 'framer-motion';
import { useAppStore } from '@/store/appStore';
import { memo } from 'react';

export const RoleSelectScene = memo(() => {
  const setUserType = useAppStore((state) => state.setUserType);

  const handleRoleSelect = (userType: 'child' | 'parent') => {
    localStorage.setItem('rainbow_user_type', userType);
    setUserType(userType);
  };

  return (
    <div className="relative min-h-screen w-full flex flex-col">
      {/* 背景 */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-400 via-pink-400 to-orange-400" />

      {/* 装饰星星 */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
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

      {/* 主内容 */}
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
});

RoleSelectScene.displayName = 'RoleSelectScene';