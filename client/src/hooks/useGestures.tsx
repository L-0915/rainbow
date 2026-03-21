import { useState, useEffect, useCallback, useRef, memo } from 'react';

/**
 * 长按 Hook
 */
export const useLongPress = (
  callback: () => void,
  { threshold = 500, onStart, onCancel }: { threshold?: number; onStart?: () => void; onCancel?: () => void } = {}
) => {
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const [isPressed, setIsPressed] = useState(false);

  const start = useCallback(() => {
    setIsPressed(true);
    onStart?.();
    timerRef.current = setTimeout(() => {
      callback();
      setIsPressed(false);
    }, threshold);
  }, [callback, threshold, onStart]);

  const stop = useCallback(() => {
    setIsPressed(false);
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    onCancel?.();
  }, [onCancel]);

  return {
    isPressed,
    handlers: {
      onMouseDown: start,
      onMouseUp: stop,
      onMouseLeave: stop,
      onTouchStart: start,
      onTouchEnd: stop,
    },
  };
};

/**
 * 双击 Hook
 */
export const useDoubleClick = (callback: () => void, delay = 300) => {
  const lastTap = useRef(0);

  const handleTap = useCallback(() => {
    const now = Date.now();
    if (now - lastTap.current < delay) {
      callback();
      lastTap.current = 0;
    } else {
      lastTap.current = now;
    }
  }, [callback, delay]);

  return { onClick: handleTap, onDoubleClick: handleTap };
};

/**
 * 震动反馈
 */
export const useHapticFeedback = () => {
  const isSupported = typeof navigator !== 'undefined' && 'vibrate' in navigator;

  const light = useCallback(() => {
    if (isSupported) navigator.vibrate(10);
  }, [isSupported]);

  const medium = useCallback(() => {
    if (isSupported) navigator.vibrate(20);
  }, [isSupported]);

  const heavy = useCallback(() => {
    if (isSupported) navigator.vibrate([30, 10, 30]);
  }, [isSupported]);

  const success = useCallback(() => {
    if (isSupported) navigator.vibrate([20, 50, 20]);
  }, [isSupported]);

  return { isSupported, light, medium, heavy, success };
};

/**
 * 触摸反馈组件
 */
export const TouchFeedback = memo(({
  children,
  onClick,
  onLongPress,
  className = '',
  disabled = false,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  onLongPress?: () => void;
  className?: string;
  disabled?: boolean;
}) => {
  const { handlers: longPressHandlers, isPressed } = useLongPress(
    () => onLongPress?.(),
    { threshold: 500 }
  );
  const { light } = useHapticFeedback();

  const handleClick = useCallback(() => {
    if (disabled) return;
    light();
    onClick?.();
  }, [disabled, light, onClick]);

  return (
    <div
      className={`transition-opacity ${isPressed ? 'opacity-70 scale-95' : ''} ${disabled ? 'opacity-50' : ''} ${className}`}
      onClick={handleClick}
      {...(onLongPress ? longPressHandlers : {})}
      style={{ touchAction: 'manipulation' }}
    >
      {children}
    </div>
  );
});

TouchFeedback.displayName = 'TouchFeedback';