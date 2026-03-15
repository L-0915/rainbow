import { motion, AnimatePresence } from 'framer-motion';
import { memo, useState, useCallback } from 'react';
import { useAchievementStore, Achievement } from '@/store/appStore';
import { AchievementCard } from './AchievementCard';

interface StarMomentDialogProps {
  onClose: () => void;
}

export const StarMomentDialog = memo(({ onClose }: StarMomentDialogProps) => {
  const { achievements, unlockAchievement, sendToParent, getUnlockedCount } = useAchievementStore();
  const [sentIds, setSentIds] = useState<Set<string>>(new Set());
  const [showSuccessToast, setShowSuccessToast] = useState(false);

  const handleSendToParent = useCallback((id: string) => {
    sendToParent(id);
    setSentIds((prev) => new Set(prev).add(id));
    setShowSuccessToast(true);
    setTimeout(() => setShowSuccessToast(false), 2000);
  }, [sendToParent]);

  const unlockedCount = getUnlockedCount();
  const totalCount = Object.keys(achievements).length;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      {/* 背景遮罩 */}
      <motion.div
        className="absolute inset-0 bg-purple-900/50 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      />

      {/* 对话框 */}
      <motion.div
        className="relative bg-gradient-to-br from-pink-100 via-purple-50 to-blue-100 w-full sm:max-w-lg sm:rounded-[2.5rem] rounded-t-[2.5rem] p-4 sm:p-6 md:p-8 shadow-2xl border-4 border-white/80 max-h-[80vh] flex flex-col"
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
      >
        {/* 可滚动内容区域 */}
        <div className="overflow-y-auto flex-1">
        {/* 顶部装饰 */}
        <div className="text-center mb-4">
          <div className="text-5xl sm:text-6xl mb-2">💌</div>
          <h2 className="text-xl sm:text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500">
            闪闪发光时刻
          </h2>
          <p className="text-sm font-bold text-gray-600 mt-1">
            把你的成长瞬间变成星星，送给爸爸妈妈～
          </p>
        </div>

        {/* 成就进度 */}
        <div className="bg-white/70 backdrop-blur-xl rounded-full px-4 py-2 mb-4 shadow-lg border-4 border-white/60">
          <div className="flex items-center justify-between gap-4">
            <span className="text-sm font-bold text-gray-700">
              🏆 已解锁：{unlockedCount} / {totalCount}
            </span>
            <div className="flex-1 bg-gray-200 rounded-full h-3 overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-pink-400 via-purple-400 to-blue-400"
                initial={{ width: 0 }}
                animate={{ width: `${(unlockedCount / totalCount) * 100}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
          </div>
        </div>

        {/* 成就网格 */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          {Object.values(achievements).map((achievement) => (
            <AchievementCard
              key={achievement.id}
              achievement={{
                ...achievement,
                sentToParent: achievement.sentToParent || sentIds.has(achievement.id),
              }}
              onSendToParent={handleSendToParent}
            />
          ))}
        </div>

        {/* 温馨提示 */}
        <div className="bg-white/70 backdrop-blur-xl rounded-2xl p-4 text-center border-4 border-white/60">
          <p className="text-xs sm:text-sm font-bold text-gray-700">
            💡 完成任务解锁成就，然后分享给爸爸妈妈吧！
            <br />
            他们会为你的成长感到骄傲的～
          </p>
        </div>

        {/* 关闭按钮 */}
        </div>

        <motion.button
          onClick={onClose}
          className="mt-4 w-full bg-gradient-to-r from-pink-400 via-purple-400 to-blue-400 text-white font-black text-base sm:text-lg py-3 px-6 rounded-full shadow-xl border-4 border-white/60"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          关闭
        </motion.button>

        {/* 成功提示 */}
        <AnimatePresence>
          {showSuccessToast && (
            <motion.div
              className="fixed top-4 left-1/2 -translate-x-1/2 bg-green-400 text-white font-black px-6 py-3 rounded-full shadow-2xl border-4 border-white/80 z-50"
              initial={{ y: -100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -100, opacity: 0 }}
            >
              ✨ 已成功分享！
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
});

StarMomentDialog.displayName = 'StarMomentDialog';
