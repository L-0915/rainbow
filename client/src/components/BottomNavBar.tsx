import { motion } from 'framer-motion';
import { useAppStore } from '@/store/appStore';
import { memo } from 'react';

interface BottomNavBarProps {
  hideHome?: boolean;
}

export const BottomNavBar = memo(({ hideHome = false }: BottomNavBarProps) => {
  const navigateTo = useAppStore((state) => state.navigateTo);
  const currentScene = useAppStore((state) => state.currentScene);

  // 定义导航项
  const navItems = [
    {
      scene: 'grass' as const,
      emoji: '🌿',
      label: '草地',
    },
    {
      scene: 'home' as const,
      emoji: '🏠',
      label: '家园',
    },
    {
      scene: 'playground' as const,
      emoji: '🎡',
      label: '游乐场',
    },
    {
      scene: 'parent-dashboard' as const,
      emoji: '⌚',
      label: '手表',
    },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50">
      <div className="bg-white/90 backdrop-blur-xl border-t-4 border-white/60 shadow-2xl">
        <div className="flex items-center justify-around py-1.5 pb-3">
          {navItems.map((item) => {
            const isActive = currentScene === item.scene;

            // 如果是家园且 hideHome 为 true，则只显示但不点击
            if (item.scene === 'home' && hideHome) {
              return (
                <div
                  key={item.scene}
                  className="flex flex-col items-center gap-0.5 px-2 py-1.5 opacity-50"
                >
                  <div className="text-xl sm:text-2xl">{item.emoji}</div>
                  <span className="text-xs font-bold text-gray-500">{item.label}</span>
                </div>
              );
            }

            return (
              <motion.button
                key={item.scene}
                onClick={() => navigateTo(item.scene)}
                className={`flex flex-col items-center gap-0.5 px-2 py-1.5 ${
                  isActive ? 'scale-110' : ''
                }`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <div className="text-xl sm:text-2xl">{item.emoji}</div>
                <span className={`text-xs font-black ${
                  isActive ? 'text-pink-500' : 'text-gray-700'
                }`}>
                  {item.label}
                </span>
              </motion.button>
            );
          })}
        </div>
      </div>
    </div>
  );
});

BottomNavBar.displayName = 'BottomNavBar';
