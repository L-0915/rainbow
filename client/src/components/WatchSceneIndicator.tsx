import { motion } from 'framer-motion';
import { SceneType } from '@/store/appStore';
import { memo } from 'react';

interface WatchSceneIndicatorProps {
  currentScene: SceneType;
}

// 场景配置
const SCENES: { id: SceneType; emoji: string; label: string }[] = [
  { id: 'grass', emoji: '🌿', label: '草地' },
  { id: 'home', emoji: '🏠', label: '家园' },
  { id: 'playground', emoji: '🎡', label: '游乐场' },
  { id: 'parent-dashboard', emoji: '⌚', label: '家长' },
];

export const WatchSceneIndicator = memo(({ currentScene }: WatchSceneIndicatorProps) => {
  const currentIndex = SCENES.findIndex(s => s.id === currentScene);

  return (
    <div className="fixed top-2 left-1/2 -translate-x-1/2 z-50 flex items-center gap-1.5">
      {SCENES.map((scene, index) => (
        <motion.div
          key={scene.id}
          className={`rounded-full transition-all duration-300 ${
            index === currentIndex
              ? 'bg-white/90 px-3 py-1 flex items-center gap-1'
              : 'w-2 h-2 bg-white/50'
          }`}
          animate={index === currentIndex ? { scale: [1, 1.1, 1] } : {}}
          transition={{ duration: 2, repeat: Infinity }}
        >
          {index === currentIndex ? (
            <>
              <span className="text-sm">{scene.emoji}</span>
              <span className="text-xs font-bold text-gray-700">{scene.label}</span>
            </>
          ) : null}
        </motion.div>
      ))}
    </div>
  );
});

WatchSceneIndicator.displayName = 'WatchSceneIndicator';