import { memo } from 'react';
import { motion } from 'framer-motion';

interface SkeletonProps {
  variant?: 'text' | 'circle' | 'rect';
  width?: string | number;
  height?: string | number;
  className?: string;
}

/**
 * 骨架屏组件
 */
export const Skeleton = memo(({ variant = 'rect', width, height, className = '' }: SkeletonProps) => {
  const baseClasses = 'animate-pulse bg-gray-200';

  const variantClasses = {
    text: 'rounded h-4',
    circle: 'rounded-full',
    rect: 'rounded-xl',
  };

  const style = {
    width: width || (variant === 'circle' ? '48px' : '100%'),
    height: height || (variant === 'text' ? '16px' : variant === 'circle' ? '48px' : '100px'),
  };

  return (
    <div
      className={`${baseClasses} ${variantClasses[variant]} ${className}`}
      style={style}
    />
  );
});

Skeleton.displayName = 'Skeleton';

/**
 * 情绪卡片骨架屏
 */
export const EmotionCardSkeleton = memo(() => (
  <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-4 shadow-lg">
    <div className="flex items-center gap-3 mb-3">
      <Skeleton variant="circle" width={48} height={48} />
      <div className="flex-1">
        <Skeleton variant="text" width="60%" height={20} className="mb-2" />
        <Skeleton variant="text" width="40%" height={14} />
      </div>
    </div>
    <Skeleton variant="rect" height={60} className="mb-3" />
    <div className="flex gap-2">
      <Skeleton variant="rect" width={80} height={32} />
      <Skeleton variant="rect" width={80} height={32} />
    </div>
  </div>
));

EmotionCardSkeleton.displayName = 'EmotionCardSkeleton';

/**
 * 聊天消息骨架屏
 */
export const ChatMessageSkeleton = memo(() => (
  <div className="flex gap-3 mb-3">
    <Skeleton variant="circle" width={36} height={36} />
    <div className="flex-1">
      <Skeleton variant="text" width="30%" height={12} className="mb-2" />
      <Skeleton variant="rect" height={60} />
    </div>
  </div>
));

ChatMessageSkeleton.displayName = 'ChatMessageSkeleton';

/**
 * 成就卡片骨架屏
 */
export const AchievementSkeleton = memo(() => (
  <div className="bg-gray-100 rounded-2xl p-3 aspect-square flex flex-col items-center justify-center">
    <Skeleton variant="circle" width={40} height={40} className="mb-2" />
    <Skeleton variant="text" width="80%" height={14} />
  </div>
));

AchievementSkeleton.displayName = 'AchievementSkeleton';

/**
 * 加载状态组件
 */
export const LoadingState = memo(({ message = '加载中...' }: { message?: string }) => (
  <div className="flex flex-col items-center justify-center py-12">
    <motion.div
      className="text-5xl mb-4"
      animate={{ rotate: 360 }}
      transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
    >
      🌈
    </motion.div>
    <p className="text-gray-500 font-bold">{message}</p>
  </div>
));

LoadingState.displayName = 'LoadingState';

/**
 * 空状态组件
 */
export const EmptyState = memo(({
  icon = '📭',
  title = '暂无数据',
  description,
  action,
}: {
  icon?: string;
  title?: string;
  description?: string;
  action?: React.ReactNode;
}) => (
  <div className="flex flex-col items-center justify-center py-12">
    <motion.div
      className="text-6xl mb-4"
      animate={{ y: [0, -10, 0] }}
      transition={{ duration: 2, repeat: Infinity }}
    >
      {icon}
    </motion.div>
    <p className="text-gray-600 font-bold mb-2">{title}</p>
    {description && <p className="text-gray-400 text-sm mb-4">{description}</p>}
    {action}
  </div>
));

EmptyState.displayName = 'EmptyState';