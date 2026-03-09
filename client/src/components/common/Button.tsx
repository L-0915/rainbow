import { motion, HTMLMotionProps } from 'framer-motion';
import { cn } from '@/utils/classNames';

interface ButtonProps extends HTMLMotionProps<'button'> {
  variant?: 'primary' | 'secondary' | 'warm' | 'rainbow' | 'green' | 'blue' | 'purple';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  isLoading?: boolean;
}

export const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  isLoading,
  className,
  ...props
}: ButtonProps) => {
  const baseStyles = cn(
    'relative inline-flex items-center justify-center',
    'font-bold',
    'transition-all duration-200',
    'shadow-lg hover:shadow-xl',
    'active:scale-95',
    'disabled:opacity-50 disabled:cursor-not-allowed',
    'border-4 border-white/50 hover:border-white',
    size === 'sm' && 'px-4 py-2 text-base rounded-2xl',
    size === 'md' && 'px-6 py-3 text-lg rounded-3xl',
    size === 'lg' && 'px-8 py-4 text-xl rounded-3xl',
    size === 'xl' && 'px-10 py-5 text-2xl rounded-full',
    className
  );

  const variantStyles = {
    primary: 'bg-gradient-to-r from-blue-400 to-cyan-500 text-white',
    secondary: 'bg-gradient-to-r from-purple-400 to-pink-500 text-white',
    warm: 'bg-gradient-to-r from-orange-400 to-red-400 text-white',
    rainbow: 'bg-gradient-to-r from-red-400 via-orange-400 via-yellow-400 via-green-400 via-blue-400 to-purple-400 text-white',
    green: 'bg-gradient-to-r from-green-400 to-emerald-500 text-white',
    blue: 'bg-gradient-to-r from-blue-400 to-indigo-500 text-white',
    purple: 'bg-gradient-to-r from-purple-400 to-pink-500 text-white',
  };

  return (
    <motion.button
      className={cn(baseStyles, variantStyles[variant])}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      disabled={isLoading}
      {...props}
    >
      {isLoading ? (
        <motion.div
          className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        />
      ) : (
        children
      )}
    </motion.button>
  );
};
