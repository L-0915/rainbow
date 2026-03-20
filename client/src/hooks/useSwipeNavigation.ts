import { useCallback } from 'react';
import { useDrag } from '@use-gesture/react';
import { useAppStore, SceneType } from '@/store/appStore';

// 场景顺序（用于滑动切换）
const SCENES_ORDER: SceneType[] = ['grass', 'home', 'playground', 'parent-dashboard'];

/**
 * 手表端滑动导航 Hook
 * 左滑：下一场景
 * 右滑：上一场景
 */
export const useSwipeNavigation = () => {
  const navigateTo = useAppStore((state) => state.navigateTo);
  const currentScene = useAppStore((state) => state.currentScene);

  const getCurrentIndex = useCallback(() => {
    return SCENES_ORDER.indexOf(currentScene);
  }, [currentScene]);

  const goToNext = useCallback(() => {
    const currentIndex = getCurrentIndex();
    if (currentIndex < SCENES_ORDER.length - 1) {
      navigateTo(SCENES_ORDER[currentIndex + 1]);
    }
  }, [getCurrentIndex, navigateTo]);

  const goToPrev = useCallback(() => {
    const currentIndex = getCurrentIndex();
    if (currentIndex > 0) {
      navigateTo(SCENES_ORDER[currentIndex - 1]);
    }
  }, [getCurrentIndex, navigateTo]);

  // 滑动手势绑定
  const bind = useDrag(
    ({ movement: [mx], velocity: [vx], direction: [dx], cancel }) => {
      // 最小滑动距离阈值
      const threshold = 50;

      // 检查是否达到触发条件
      if (Math.abs(mx) > threshold || Math.abs(vx) > 0.5) {
        if (dx > 0) {
          // 右滑 -> 上一场景
          goToPrev();
        } else {
          // 左滑 -> 下一场景
          goToNext();
        }
        cancel();
      }
    },
    {
      axis: 'x', // 只监听水平滑动
      filterTaps: true, // 过滤点击事件
    }
  );

  return {
    bind,
    currentScene,
    currentIndex: getCurrentIndex(),
    totalScenes: SCENES_ORDER.length,
    goToNext,
    goToPrev,
  };
};

/**
 * 获取场景名称
 */
export const getSceneName = (scene: SceneType): string => {
  const names: Record<SceneType, string> = {
    login: '登录',
    home: '家园',
    map: '地图',
    grass: '草地',
    playground: '游乐场',
    'parent-dashboard': '家长端',
    'emotion-diary': '日记',
  };
  return names[scene] || scene;
};

/**
 * 获取场景 Emoji
 */
export const getSceneEmoji = (scene: SceneType): string => {
  const emojis: Record<SceneType, string> = {
    login: '🔐',
    home: '🏠',
    map: '🗺️',
    grass: '🌿',
    playground: '🎡',
    'parent-dashboard': '⌚',
    'emotion-diary': '📔',
  };
  return emojis[scene] || '📍';
};