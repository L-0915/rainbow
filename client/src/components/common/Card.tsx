import { motion, HTMLMotionProps } from 'framer-motion';
import { cn } from '@/utils/classNames';

interface CardProps extends HTMLMotionProps<'div'> {
  variant?: 'default' | 'rainbow' | 'cloud';
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

export const Card = ({
  children,
  variant = 'default',
  padding = 'md',
  className,
  ...props
}: CardProps) => {
  return (
    <motion.div
      className={cn(
        'relative bg-white rounded-3xl',
        'shadow-soft',
        'overflow-hidden',
        padding === 'sm' && 'p-3',
        padding === 'md' && 'p-4',
        padding === 'lg' && 'p-6',
        padding === 'none' && 'p-0',
        variant === 'rainbow' && 'rainbow-border',
        variant === 'cloud' && 'bg-white/90 backdrop-blur-sm',
        className
      )}
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: 'spring', bounce: 0.4 }}
      {...props}
    >
      {children}
    </motion.div>
  );
};
