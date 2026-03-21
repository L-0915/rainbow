import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAchievementStore, type Achievement } from '@/store/appStore';

interface AchievementWallProps {
  onClose?: () => void;
}

export const AchievementWall = ({ onClose }: AchievementWallProps) => {
  const achievements = useAchievementStore((state) => state.achievements);
  const [selectedAchievement, setSelectedAchievement] = useState<Achievement | null>(null);

  const achievementList = Object.values(achievements);
  const unlockedCount = achievementList.filter((a) => a.unlocked).length;

  return (
    <div className="bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 rounded-3xl p-6 shadow-xl">
      {/* 标题 */}
      <div className="text-center mb-6">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', bounce: 0.5 }}
          className="text-4xl mb-2"
        >
          🏆
        </motion.div>
        <h2 className="text-2xl font-black text-gray-700">我的成就</h2>
        <p className="text-gray-400 text-sm mt-1">
          已解锁 {unlockedCount} / {achievementList.length} 个
        </p>
      </div>

      {/* 成就进度条 */}
      <div className="mb-6">
        <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${(unlockedCount / achievementList.length) * 100}%` }}
            transition={{ duration: 1, ease: 'easeOut' }}
            className="h-full bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 rounded-full"
          />
        </div>
      </div>

      {/* 成就网格 */}
      <div className="grid grid-cols-3 gap-4">
        {achievementList.map((achievement, index) => (
          <motion.button
            key={achievement.id}
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.1 }}
            onClick={() => achievement.unlocked && setSelectedAchievement(achievement)}
            disabled={!achievement.unlocked}
            className={`
              aspect-square rounded-2xl flex flex-col items-center justify-center p-3
              transition-all duration-300 relative overflow-hidden
              ${achievement.unlocked
                ? 'cursor-pointer hover:scale-105 shadow-lg'
                : 'opacity-40 grayscale cursor-not-allowed'
              }
            `}
            style={{
              background: achievement.unlocked ? achievement.gradient : '#E5E7EB',
            }}
          >
            {/* 解锁动画 */}
            {achievement.unlocked && (
              <motion.div
                className="absolute inset-0 bg-white/30"
                initial={{ x: '-100%', rotate: 45 }}
                animate={{ x: '200%' }}
                transition={{ duration: 0.6, delay: index * 0.1 + 0.3 }}
              />
            )}

            {/* Emoji */}
            <motion.span
              className="text-3xl mb-1"
              animate={achievement.unlocked ? { rotate: [0, -10, 10, 0] } : {}}
              transition={{ duration: 0.5, delay: index * 0.1 + 0.5 }}
            >
              {achievement.unlocked ? achievement.emoji : '🔒'}
            </motion.span>

            {/* 名称 */}
            <span className="text-xs font-bold text-white text-center leading-tight">
              {achievement.unlocked ? achievement.title : '???'}
            </span>
          </motion.button>
        ))}
      </div>

      {/* 关闭按钮 */}
      {onClose && (
        <motion.button
          onClick={onClose}
          className="w-full mt-6 py-3 bg-white/80 hover:bg-white rounded-xl text-gray-600 font-bold text-sm transition-all"
          whileTap={{ scale: 0.95 }}
        >
          关闭
        </motion.button>
      )}

      {/* 成就详情弹窗 */}
      <AnimatePresence>
        {selectedAchievement && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
            onClick={() => setSelectedAchievement(null)}
          >
            <motion.div
              initial={{ scale: 0.5, rotate: -10 }}
              animate={{ scale: 1, rotate: 0 }}
              exit={{ scale: 0.5, rotate: 10 }}
              className="bg-white rounded-3xl p-8 text-center max-w-xs w-full shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              {/* 庆祝动画 */}
              <motion.div
                className="text-6xl mb-4"
                animate={{
                  scale: [1, 1.2, 1],
                  rotate: [0, 10, -10, 0],
                }}
                transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 1 }}
              >
                {selectedAchievement.emoji}
              </motion.div>

              <h3 className="text-xl font-black text-gray-700 mb-2">
                {selectedAchievement.title}
              </h3>

              <p className="text-gray-500 text-sm mb-4">
                {selectedAchievement.description}
              </p>

              <div
                className="w-full h-2 rounded-full mb-4"
                style={{ background: selectedAchievement.gradient }}
              />

              <p className="text-xs text-gray-400">🎉 太棒了，继续加油！</p>

              <motion.button
                onClick={() => setSelectedAchievement(null)}
                className="mt-4 px-6 py-2 bg-purple-100 hover:bg-purple-200 rounded-full text-purple-600 font-bold text-sm transition-all"
                whileTap={{ scale: 0.9 }}
              >
                知道啦
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};