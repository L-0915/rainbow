/**
 * 动画配置
 * 轻量化设置，确保流畅运行
 */

// 减少动画配置 - 用于性能优先场景
export const reducedMotion = {
  // 禁用弹性动画
  stiffness: 300,
  damping: 30,

  // 缩短动画时间
  duration: 0.15,

  // 禁用重复动画
  repeat: 0,
};

// 轻量动画预设
export const lightAnimations = {
  // 淡入淡出
  fadeIn: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
    transition: { duration: 0.2 },
  },

  // 简单缩放
  scaleIn: {
    initial: { scale: 0.95, opacity: 0 },
    animate: { scale: 1, opacity: 1 },
    exit: { scale: 0.95, opacity: 0 },
    transition: { duration: 0.15 },
  },

  // 简单上移
  slideUp: {
    initial: { y: 10, opacity: 0 },
    animate: { y: 0, opacity: 1 },
    exit: { y: 10, opacity: 0 },
    transition: { duration: 0.2 },
  },

  // 按钮点击
  tap: {
    scale: 0.97,
    transition: { duration: 0.1 },
  },
};

// 检测用户偏好减少动画
export const prefersReducedMotion = () => {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
};

// 根据用户偏好选择动画配置
export const getAnimationConfig = () => {
  return prefersReducedMotion() ? reducedMotion : {};
};

// 简单的 CSS 过渡类（比 Framer Motion 更轻量）
export const cssTransitions = {
  // 快速过渡
  fast: 'transition-all duration-150 ease-out',

  // 标准过渡
  normal: 'transition-all duration-200 ease-out',

  // 慢速过渡
  slow: 'transition-all duration-300 ease-out',

  // 仅透明度
  opacity: 'transition-opacity duration-200 ease-out',

  // 仅变换
  transform: 'transition-transform duration-200 ease-out',
};

// 性能优化建议
export const performanceTips = {
  // 使用 CSS transform 而非 left/top
  useTransform: true,

  // 避免同时动画太多元素
  maxAnimatedElements: 5,

  // 延迟非关键动画
  staggerDelay: 0.05,

  // 使用 will-change 提示浏览器
  useWillChange: false, // 过度使用反而降低性能
};