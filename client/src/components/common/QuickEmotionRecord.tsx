import { memo, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useEmotionStore, EMOTION_CONFIG, type EmotionType } from '@/store/emotionStore';
import { useHapticFeedback } from '@/hooks/useGestures';

/**
 * 快速情绪记录组件
 * 双击触发，简洁高效
 */
export const QuickEmotionRecord = memo(() => {
  const [showSelector, setShowSelector] = useState(false);
  const setTodayEmotion = useEmotionStore((state) => state.setTodayEmotion);
  const { success, light } = useHapticFeedback();

  const handleEmotionSelect = useCallback((emotion: EmotionType) => {
    setTodayEmotion(emotion);
    success();
    setShowSelector(false);
  }, [setTodayEmotion, success]);

  const emotions = Object.entries(EMOTION_CONFIG) as [EmotionType, typeof EMOTION_CONFIG[EmotionType]][];

  return (
    <>
      {/* 快速记录入口 - 小圆点，不占空间 */}
      <div
        className="fixed bottom-40 left-4 z-30"
        onDoubleClick={(e) => {
          e.stopPropagation();
          light();
          setShowSelector(true);
        }}
      >
        <div className="w-3 h-3 rounded-full bg-purple-400 opacity-50" />
      </div>

      {/* 情绪选择弹窗 */}
      <AnimatePresence>
        {showSelector && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/30"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowSelector(false)}
          >
            <motion.div
              className="bg-white rounded-2xl p-4 shadow-xl max-w-xs w-full mx-4"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <p className="text-center text-gray-600 font-bold mb-4">快速记录心情</p>

              <div className="grid grid-cols-3 gap-3">
                {emotions.map(([type, config]) => (
                  <button
                    key={type}
                    onClick={() => handleEmotionSelect(type)}
                    className="flex flex-col items-center gap-1 p-3 rounded-xl hover:bg-gray-100 transition-colors"
                  >
                    <span className="text-3xl">{config.emoji}</span>
                    <span className="text-xs text-gray-500">{config.label}</span>
                  </button>
                ))}
              </div>

              <button
                onClick={() => setShowSelector(false)}
                className="w-full mt-4 py-2 text-gray-400 text-sm"
              >
                点击空白处关闭
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
});

QuickEmotionRecord.displayName = 'QuickEmotionRecord';