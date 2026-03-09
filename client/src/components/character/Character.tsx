import { motion } from 'framer-motion';
import { useCharacterStore } from '@/store/characterStore';

interface CharacterProps {
  size?: 'sm' | 'md' | 'lg';
  isAnimated?: boolean;
  action?: 'idle' | 'run' | 'jump' | 'happy';
  emotion?: 'happy' | 'sad' | 'neutral' | 'excited';
}

export const Character = ({
  size = 'md',
  isAnimated = true,
  action = 'idle',
  emotion = 'neutral',
}: CharacterProps) => {
  const { config } = useCharacterStore();

  const sizeClasses = {
    sm: 'w-12 h-12',
    md: 'w-20 h-20',
    lg: 'w-28 h-28',
  };

  // 动画配置
  const animations = {
    idle: { y: [0, -3, 0], scale: [1, 1.02, 1] },
    run: { y: [0, -5, 0], rotate: [0, 5, 0, -5, 0] },
    jump: { y: [0, -15, 0], scale: [1, 1.1, 1] },
    happy: { rotate: [-5, 5, -5], scale: [1, 1.05, 1] },
  };

  const emotionEyes = {
    happy: '^_^',
    sad: '>_<',
    neutral: '-_-',
    excited: '>w<',
  };

  return (
    <motion.div
      className={`${sizeClasses[size]} relative`}
      animate={isAnimated ? animations[action] : {}}
      transition={{
        duration: action === 'run' ? 0.5 : 2,
        repeat: Infinity,
        ease: 'easeInOut',
      }}
    >
      <svg viewBox="0 0 60 60" className="w-full h-full drop-shadow-lg">
        {/* 头发 - 根据发型选择 */}
        {config.hairstyle === 'short' && (
          <ellipse cx="30" cy="18" rx="20" ry="12" fill="#4A3728" />
        )}
        {config.hairstyle === 'long' && (
          <>
            <ellipse cx="30" cy="18" rx="20" ry="12" fill="#4A3728" />
            <path d="M 12 18 L 10 45 Q 30 50 50 45 L 48 18" fill="#4A3728" />
          </>
        )}
        {config.hairstyle === 'curly' && (
          <path
            d="M 10 20 Q 15 10 30 10 Q 45 10 50 20 Q 55 25 50 30 Q 45 25 30 25 Q 15 25 10 30 Q 5 25 10 20"
            fill="#4A3728"
          />
        )}
        {config.hairstyle === 'ponytail' && (
          <>
            <ellipse cx="30" cy="18" rx="18" ry="12" fill="#4A3728" />
            <circle cx="45" cy="25" r="6" fill="#4A3728" />
          </>
        )}
        {config.hairstyle === 'bob' && (
          <>
            <ellipse cx="30" cy="18" rx="20" ry="12" fill="#4A3728" />
            <ellipse cx="12" cy="25" rx="5" ry="10" fill="#4A3728" />
            <ellipse cx="48" cy="25" rx="5" ry="10" fill="#4A3728" />
          </>
        )}
        {config.hairstyle === 'braids' && (
          <>
            <ellipse cx="30" cy="18" rx="18" ry="12" fill="#4A3728" />
            <path d="M 15 25 Q 10 35 8 45" stroke="#4A3728" strokeWidth="4" fill="none" />
            <path d="M 45 25 Q 50 35 52 45" stroke="#4A3728" strokeWidth="4" fill="none" />
          </>
        )}

        {/* 脸 */}
        <ellipse cx="30" cy="30" rx="18" ry="15" fill={config.skinColor} />

        {/* 眼睛 */}
        <g fill="#333">
          <ellipse cx="23" cy="28" rx="4" ry="5" />
          <ellipse cx="37" cy="28" rx="4" ry="5" />
          {/* 眼神高光 */}
          <circle cx="24" cy="26" r="2" fill="white" />
          <circle cx="38" cy="26" r="2" fill="white" />
        </g>

        {/* 腮红 */}
        <ellipse cx="18" cy="33" rx="4" ry="2" fill="#FFB6C1" opacity="0.5" />
        <ellipse cx="42" cy="33" rx="4" ry="2" fill="#FFB6C1" opacity="0.5" />

        {/* 嘴巴 - 根据情绪变化 */}
        {emotion === 'happy' && (
          <path d="M 22 38 Q 30 44 38 38" stroke="#FF6B6B" strokeWidth="2" fill="none" strokeLinecap="round" />
        )}
        {emotion === 'sad' && (
          <path d="M 24 40 Q 30 36 36 40" stroke="#FF6B6B" strokeWidth="2" fill="none" strokeLinecap="round" />
        )}
        {emotion === 'neutral' && (
          <line x1="24" y1="38" x2="36" y2="38" stroke="#FF6B6B" strokeWidth="2" strokeLinecap="round" />
        )}
        {emotion === 'excited' && (
          <ellipse cx="30" cy="40" rx="6" ry="4" fill="#FF6B6B" />
        )}

        {/* 身体/衣服 */}
        {config.clothes === 'shirt' && (
          <ellipse cx="30" cy="55" rx="15" ry="8" fill="#6FC3FF" />
        )}
        {config.clothes === 'dress' && (
          <path d="M 15 52 L 45 52 L 50 60 L 10 60 Z" fill="#FF99CC" />
        )}
        {config.clothes === 'hoodie' && (
          <>
            <ellipse cx="30" cy="55" rx="16" ry="9" fill="#95A5A6" />
            <circle cx="30" cy="48" r="3" fill="#7F8C8D" />
          </>
        )}
        {config.clothes === 'overalls' && (
          <>
            <ellipse cx="30" cy="55" rx="15" ry="8" fill="#4DABF7" />
            <rect x="22" y="48" width="4" height="6" fill="#4DABF7" />
            <rect x="34" y="48" width="4" height="6" fill="#4DABF7" />
          </>
        )}
        {config.clothes === 'jacket' && (
          <ellipse cx="30" cy="55" rx="16" ry="9" fill="#FF6B6B" />
        )}
      </svg>
    </motion.div>
  );
};
