import { motion } from 'framer-motion';

interface CloudProps {
  size?: 'sm' | 'md' | 'lg';
  isAnimated?: boolean;
  speed?: 'slow' | 'normal' | 'fast';
}

export const Cloud = ({ size = 'md', isAnimated = true, speed = 'normal' }: CloudProps) => {
  const sizeClasses = {
    sm: 'w-16 h-10',
    md: 'w-24 h-14',
    lg: 'w-36 h-20',
  };

  const durations = {
    slow: 20,
    normal: 15,
    fast: 10,
  };

  return (
    <motion.div
      className={`${sizeClasses[size]} absolute`}
      animate={isAnimated ? { x: [-100, window.innerWidth + 100] } : {}}
      transition={{
        duration: durations[speed],
        repeat: Infinity,
        ease: 'linear',
        repeatType: 'loop',
      }}
      style={{
        initialX: -100,
      }}
    >
      <svg viewBox="0 0 100 60" className="w-full h-full">
        {/* 云朵主体 */}
        <ellipse cx="35" cy="35" rx="25" ry="18" fill="white" />
        <ellipse cx="55" cy="30" rx="22" ry="20" fill="white" />
        <ellipse cx="75" cy="35" rx="20" ry="15" fill="white" />
        <ellipse cx="45" cy="25" rx="18" ry="15" fill="white" />
        <ellipse cx="65" cy="22" rx="16" ry="14" fill="white" />

        {/* 阴影增加立体感 */}
        <ellipse cx="50" cy="40" rx="35" ry="10" fill="rgba(0,0,0,0.05)" />
      </svg>
    </motion.div>
  );
};
