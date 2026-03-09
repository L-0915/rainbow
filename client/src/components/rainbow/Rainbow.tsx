import { motion } from 'framer-motion';

interface RainbowProps {
  size?: 'sm' | 'md' | 'lg';
  isAnimated?: boolean;
  mood?: 'happy' | 'calm' | 'excited';
}

export const Rainbow = ({ size = 'md', isAnimated = true, mood = 'happy' }: RainbowProps) => {
  const sizeClasses = {
    sm: 'w-16 h-16',
    md: 'w-24 h-24',
    lg: 'w-32 h-32',
  };

  const moodEyes = {
    happy: '^^',
    calm: '--',
    excited: '!!',
  };

  const mouthPaths = {
    happy: 'M 15 25 Q 25 35 35 25',
    calm: 'M 15 30 Q 25 30 35 30',
    excited: 'M 15 25 Q 25 40 35 25',
  };

  return (
    <motion.div
      className={`${sizeClasses[size]} relative`}
      animate={isAnimated ? { y: [0, -8, 0] } : {}}
      transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
    >
      {/* 彩虹主体 - SVG 绘制 */}
      <svg viewBox="0 0 50 50" className="w-full h-full drop-shadow-lg">
        {/* 彩虹弧线 */}
        <path
          d="M 5 45 A 20 20 0 0 1 45 45"
          fill="none"
          stroke="#FF6B6B"
          strokeWidth="6"
          strokeLinecap="round"
        />
        <path
          d="M 8 45 A 17 17 0 0 1 42 45"
          fill="none"
          stroke="#FFA94D"
          strokeWidth="5"
          strokeLinecap="round"
        />
        <path
          d="M 11 45 A 14 14 0 0 1 39 45"
          fill="none"
          stroke="#FFE066"
          strokeWidth="5"
          strokeLinecap="round"
        />
        <path
          d="M 14 45 A 11 11 0 0 1 36 45"
          fill="none"
          stroke="#69DB7C"
          strokeWidth="5"
          strokeLinecap="round"
        />
        <path
          d="M 17 45 A 8 8 0 0 1 33 45"
          fill="none"
          stroke="#4DABF7"
          strokeWidth="5"
          strokeLinecap="round"
        />
        <path
          d="M 20 45 A 5 5 0 0 1 30 45"
          fill="none"
          stroke="#DA77F2"
          strokeWidth="5"
          strokeLinecap="round"
        />

        {/* 小脸 */}
        <circle cx="25" cy="22" r="10" fill="#FFF5E6" />

        {/* 眼睛 */}
        <text x="20" y="22" fontSize="6" fill="#333" fontWeight="bold" textAnchor="middle">
          {moodEyes[mood].charAt(0)}
        </text>
        <text x="30" y="22" fontSize="6" fill="#333" fontWeight="bold" textAnchor="middle">
          {moodEyes[mood].charAt(1)}
        </text>

        {/* 嘴巴 */}
        <path
          d={mouthPaths[mood]}
          fill="none"
          stroke="#FF6B6B"
          strokeWidth="2"
          strokeLinecap="round"
        />

        {/* 腮红 */}
        <ellipse cx="17" cy="25" rx="3" ry="2" fill="#FFB6C1" opacity="0.6" />
        <ellipse cx="33" cy="25" rx="3" ry="2" fill="#FFB6C1" opacity="0.6" />

        {/* 高光 */}
        <circle cx="28" cy="19" r="2" fill="white" />
      </svg>

      {/* 闪光效果 */}
      {isAnimated && (
        <motion.div
          className="absolute -top-2 -right-2 w-4 h-4"
          animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          <svg viewBox="0 0 20 20" className="w-full h-full">
            <polygon
              points="10,0 12,8 20,10 12,12 10,20 8,12 0,10 8,8"
              fill="#FFD700"
            />
          </svg>
        </motion.div>
      )}
    </motion.div>
  );
};
