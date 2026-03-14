import { motion } from 'framer-motion';
import { memo } from 'react';

export interface Achievement {
  id: string;
  title: string;
  description: string;
  emoji: string;
  gradient: string;
  unlocked: boolean;
  sentToParent: boolean;
}

const ACHIEVEMENTS: Achievement[] = [
  {
    id: 'emotion-master',
    title: '情绪小主人',
    description: '记录今天的心情',
    emoji: '💭',
    gradient: 'linear-gradient(135deg, #FFB6C1 0%, #FFA0A0 100%)',
    unlocked: false,
    sentToParent: false,
  },
  {
    id: 'grass-explorer',
    title: '草地探险家',
    description: '在草地上放松玩耍',
    emoji: '🌿',
    gradient: 'linear-gradient(135deg, #A8E6CF 0%, #88D8B7 100%)',
    unlocked: false,
    sentToParent: false,
  },
  {
    id: 'cloud-collector',
    title: '云朵收藏家',
    description: '收集 6 朵温暖云朵的祝福',
    emoji: '☁️',
    gradient: 'linear-gradient(135deg, #C7CEEA 0%, #B5C0E0 100%)',
    unlocked: false,
    sentToParent: false,
  },
  {
    id: 'playground-hero',
    title: '游乐场小英雄',
    description: '完成一场游乐场游戏',
    emoji: '🎡',
    gradient: 'linear-gradient(135deg, #FFA94D 0%, #FFB961 100%)',
    unlocked: false,
    sentToParent: false,
  },
  {
    id: 'chat-star',
    title: '聊天小明星',
    description: '和小彩虹说悄悄话',
    emoji: '🌈',
    gradient: 'linear-gradient(135deg, #DA77F2 0%, #E599F7 100%)',
    unlocked: false,
    sentToParent: false,
  },
  {
    id: 'brave-warrior',
    title: '勇敢小战士',
    description: '面对害怕或生气的情绪',
    emoji: '💪',
    gradient: 'linear-gradient(135deg, #FF6B6B 0%, #FF8E8E 100%)',
    unlocked: false,
    sentToParent: false,
  },
];

interface AchievementCardProps {
  achievement: Achievement;
  onSendToParent?: (id: string) => void;
}

export const AchievementCard = memo(({ achievement, onSendToParent }: AchievementCardProps) => {
  return (
    <motion.div
      className={`relative rounded-2xl p-4 text-center shadow-xl border-4 border-white/60 overflow-hidden ${
        achievement.unlocked ? 'cursor-pointer' : 'opacity-60'
      }`}
      style={{ background: achievement.unlocked ? achievement.gradient : 'linear-gradient(135deg, #D1D5DB 0%, #9CA3AF 100%)' }}
      whileHover={achievement.unlocked ? { scale: 1.05, y: -5 } : {}}
      whileTap={achievement.unlocked ? { scale: 0.95 } : {}}
    >
      {/* 光晕效果 */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/15 to-transparent" />

      {/* Emoji 图标 */}
      <div className="text-4xl sm:text-5xl mb-2 relative z-10">
        {achievement.emoji}
      </div>

      {/* 成就名称 */}
      <h3 className="text-white font-extrabold text-sm sm:text-base drop-shadow-lg relative z-10">
        {achievement.title}
      </h3>

      {/* 成就描述 */}
      <p className="text-white/95 text-xs sm:text-sm mt-1 font-bold relative z-10">
        {achievement.description}
      </p>

      {/* 状态标记 */}
      <div className="mt-2 flex items-center justify-center gap-2 relative z-10">
        {achievement.unlocked ? (
          <span className="text-xs font-black text-white bg-white/30 backdrop-blur-sm rounded-full px-2 py-1">
            ✨ 已解锁
          </span>
        ) : (
          <span className="text-xs font-black text-white/80 bg-black/20 backdrop-blur-sm rounded-full px-2 py-1">
            🔒 未解锁
          </span>
        )}

        {achievement.unlocked && achievement.sentToParent && (
          <span className="text-xs font-black text-white bg-green-400/50 backdrop-blur-sm rounded-full px-2 py-1">
            ✓ 已分享
          </span>
        )}
      </div>

      {/* 发送给家长按钮 */}
      {achievement.unlocked && !achievement.sentToParent && onSendToParent && (
        <motion.button
          onClick={(e) => {
            e.stopPropagation();
            onSendToParent(achievement.id);
          }}
          className="mt-2 w-full bg-white/90 backdrop-blur-xl text-purple-600 font-black text-xs sm:text-sm py-2 px-3 rounded-full shadow-xl border-2 border-white/80"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          📤 分享给家长
        </motion.button>
      )}
    </motion.div>
  );
});

AchievementCard.displayName = 'AchievementCard';

// 导出成就配置
export { ACHIEVEMENTS };
