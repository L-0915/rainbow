import { motion, AnimatePresence } from 'framer-motion';
import { memo, useState, useCallback } from 'react';
import { useAchievementStore } from '@/store/appStore';

interface WatchStarMomentProps {
  onClose: () => void;
}

export const WatchStarMoment = memo(({ onClose }: WatchStarMomentProps) => {
  const { achievements, sendToParent, getUnlockedCount } = useAchievementStore();
  const [sentIds, setSentIds] = useState<Set<string>>(new Set());
  const [showSuccess, setShowSuccess] = useState(false);

  const unlockedCount = getUnlockedCount();
  const totalCount = Object.keys(achievements).length;

  // 已解锁的成就列表
  const unlockedAchievements = Object.values(achievements).filter(a => a.unlocked);

  const handleSend = useCallback((id: string) => {
    sendToParent(id);
    setSentIds(prev => new Set(prev).add(id));
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 1500);
  }, [sendToParent]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex flex-col"
    >
      {/* 背景 */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-300 via-pink-200 to-yellow-200" />

      {/* 顶部栏 */}
      <div className="relative z-10 flex items-center justify-between p-3 pt-10">
        <div className="text-xl">⭐</div>
        <span className="text-white font-bold text-sm drop-shadow-lg">闪闪发光</span>
        <button onClick={onClose} className="text-white/80 text-xl">✕</button>
      </div>

      {/* 进度 */}
      <div className="relative z-10 px-4 py-2">
        <div className="bg-white/60 backdrop-blur-md rounded-full px-3 py-2 flex items-center gap-2">
          <span className="text-sm">🏆</span>
          <div className="flex-1 bg-white/50 rounded-full h-2 overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-pink-400 to-purple-400"
              animate={{ width: `${(unlockedCount / totalCount) * 100}%` }}
            />
          </div>
          <span className="text-xs font-bold text-gray-700">{unlockedCount}/{totalCount}</span>
        </div>
      </div>

      {/* 成就列表 */}
      <div className="relative z-10 flex-1 overflow-y-auto px-4 py-2">
        {unlockedAchievements.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-4xl mb-2">🌟</div>
            <p className="text-white/80 text-sm font-bold">完成任务解锁成就吧～</p>
          </div>
        ) : (
          <div className="space-y-2">
            {unlockedAchievements.map((achievement) => {
              const isSent = achievement.sentToParent || sentIds.has(achievement.id);
              return (
                <motion.div
                  key={achievement.id}
                  className="bg-white/80 backdrop-blur-md rounded-xl p-3 flex items-center gap-3 shadow-lg"
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                >
                  <div className="text-2xl">{achievement.emoji}</div>
                  <div className="flex-1">
                    <div className="font-bold text-sm text-gray-700">{achievement.title}</div>
                    <div className="text-xs text-gray-500">{achievement.description}</div>
                  </div>
                  {isSent ? (
                    <span className="text-xs bg-green-100 text-green-600 px-2 py-1 rounded-full font-bold">
                      已发送
                    </span>
                  ) : (
                    <button
                      onClick={() => handleSend(achievement.id)}
                      className="text-xs bg-gradient-to-r from-pink-400 to-purple-400 text-white px-3 py-1 rounded-full font-bold"
                    >
                      发送
                    </button>
                  )}
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* 成功提示 */}
      <AnimatePresence>
        {showSuccess && (
          <motion.div
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 50, opacity: 0 }}
            className="absolute bottom-20 left-1/2 -translate-x-1/2 bg-green-400 text-white px-4 py-2 rounded-full font-bold text-sm shadow-xl"
          >
            ✨ 已发送给爸爸妈妈！
          </motion.div>
        )}
      </AnimatePresence>

      {/* 底部提示 */}
      <div className="relative z-10 p-4 pb-8 text-center">
        <p className="text-white/70 text-xs font-bold">
          分享你的成长瞬间 ✨
        </p>
      </div>
    </motion.div>
  );
});

WatchStarMoment.displayName = 'WatchStarMoment';