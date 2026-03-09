import { motion } from 'framer-motion';
import { EMOTION_CONFIG, EmotionType } from '@/store/emotionStore';

interface EmotionButtonProps {
  emotion: EmotionType;
  isSelected?: boolean;
  onClick?: () => void;
  size?: 'sm' | 'md' | 'lg';
}

export const EmotionButton = ({
  emotion,
  isSelected = false,
  onClick,
  size = 'md',
}: EmotionButtonProps) => {
  const config = EMOTION_CONFIG[emotion];

  const sizeClasses = {
    sm: 'w-12 h-12 text-2xl',
    md: 'w-16 h-16 text-3xl',
    lg: 'w-20 h-20 text-4xl',
  };

  return (
    <motion.button
      className={`
        ${sizeClasses[size]}
        rounded-full
        flex items-center justify-center
        transition-all duration-200
        shadow-soft
        border-4 border-white/80
        ${isSelected ? 'scale-110 shadow-hover ring-4 ring-white/50' : ''}
      `}
      style={{
        background: config.gradient,
      }}
      whileHover={{ scale: 1.1, rotate: 5 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
    >
      <motion.span
        className="drop-shadow-sm"
        animate={isSelected ? { scale: [1, 1.2, 1] } : {}}
        transition={{ duration: 0.3 }}
      >
        {config.emoji}
      </motion.span>
    </motion.button>
  );
};
