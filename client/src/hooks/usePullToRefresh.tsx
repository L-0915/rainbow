import { useState, useCallback, useRef, memo } from 'react';

interface UsePullToRefreshOptions {
  onRefresh: () => Promise<void>;
  threshold?: number;
}

/**
 * 下拉刷新 Hook
 * 轻量实现，保持流畅
 */
export const usePullToRefresh = ({ onRefresh, threshold = 80 }: UsePullToRefreshOptions) => {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const startY = useRef(0);
  const isPulling = useRef(false);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    // 只有在顶部才能下拉刷新
    if (window.scrollY <= 0) {
      startY.current = e.touches[0].clientY;
      isPulling.current = true;
    }
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isPulling.current || isRefreshing) return;

    const currentY = e.touches[0].clientY;
    const distance = Math.max(0, currentY - startY.current);

    // 阻尼效果：距离越大，阻力越大
    const dampedDistance = distance * 0.5;
    setPullDistance(Math.min(dampedDistance, threshold * 1.5));
  }, [isRefreshing, threshold]);

  const handleTouchEnd = useCallback(async () => {
    if (!isPulling.current) return;

    isPulling.current = false;

    if (pullDistance >= threshold && !isRefreshing) {
      setIsRefreshing(true);
      try {
        await onRefresh();
      } finally {
        setIsRefreshing(false);
      }
    }

    setPullDistance(0);
  }, [pullDistance, threshold, isRefreshing, onRefresh]);

  return {
    isRefreshing,
    pullDistance,
    handlers: {
      onTouchStart: handleTouchStart,
      onTouchMove: handleTouchMove,
      onTouchEnd: handleTouchEnd,
    },
  };
};

/**
 * 下拉刷新指示器组件
 * 简单轻量
 */
export const PullToRefreshIndicator = memo(({
  pullDistance,
  isRefreshing,
  threshold = 80,
}: {
  pullDistance: number;
  isRefreshing: boolean;
  threshold?: number;
}) => {
  const progress = Math.min(pullDistance / threshold, 1);

  if (!isRefreshing && pullDistance === 0) return null;

  return (
    <div
      className="flex items-center justify-center py-2 transition-transform"
      style={{
        transform: `translateY(${Math.min(pullDistance - 40, 0)}px)`,
      }}
    >
      {isRefreshing ? (
        <div className="text-2xl animate-spin">🔄</div>
      ) : (
        <div
          className="text-2xl transition-transform"
          style={{ transform: `rotate(${progress * 360}deg)` }}
        >
          ⬇️
        </div>
      )}
    </div>
  );
});

PullToRefreshIndicator.displayName = 'PullToRefreshIndicator';