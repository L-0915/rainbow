import { useState, useEffect } from 'react';

/**
 * 检测是否为手表设备
 * 屏幕宽度 <= 400px 视为手表设备
 */
export const useIsWatch = () => {
  const [isWatch, setIsWatch] = useState(false);

  useEffect(() => {
    const checkWatch = () => {
      setIsWatch(window.innerWidth <= 400);
    };

    // 初始检测
    checkWatch();

    // 监听窗口变化
    window.addEventListener('resize', checkWatch);
    return () => window.removeEventListener('resize', checkWatch);
  }, []);

  return isWatch;
};

/**
 * 获取手表端的安全区域内边距
 * 圆形屏幕四角约 15-20% 不可用
 */
export const useWatchSafeArea = () => {
  const isWatch = useIsWatch();
  const [safePadding, setSafePadding] = useState(16);

  useEffect(() => {
    if (!isWatch) {
      setSafePadding(16);
      return;
    }

    const updateSafeArea = () => {
      const width = window.innerWidth;
      // 圆形屏幕安全区域约为屏幕宽度的 8%
      setSafePadding(Math.round(width * 0.08));
    };

    updateSafeArea();
    window.addEventListener('resize', updateSafeArea);
    return () => window.removeEventListener('resize', updateSafeArea);
  }, [isWatch]);

  return safePadding;
};