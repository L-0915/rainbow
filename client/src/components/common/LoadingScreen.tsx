import { memo } from 'react';

interface LoadingScreenProps {
  message?: string;
}

/**
 * 全屏加载组件
 * 使用纯 CSS 动画，无需 framer-motion
 */
export const LoadingScreen = memo(({ message = '加载中...' }: LoadingScreenProps) => {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-gradient-to-br from-pink-200 via-purple-200 to-blue-200">
      {/* 彩虹旋转加载动画 */}
      <div className="relative w-20 h-20 mb-4">
        <div className="absolute inset-0 rounded-full border-4 border-t-pink-400 border-r-purple-400 border-b-blue-400 border-l-green-400 animate-spin" />
        <div className="absolute inset-2 rounded-full bg-white/50 backdrop-blur-sm flex items-center justify-center">
          <span className="text-2xl">🌈</span>
        </div>
      </div>

      {/* 加载文字 */}
      <p className="text-gray-600 font-bold text-sm animate-pulse">{message}</p>
    </div>
  );
});

LoadingScreen.displayName = 'LoadingScreen';