import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { EMOTION_CONFIG, EmotionType, EmotionRecord } from '@/store/emotionStore';

interface EmotionStatsProps {
  data: EmotionRecord[];
  title?: string;
}

interface EmotionStatsData {
  totalDays: number;
  emotionCounts: Record<EmotionType, number>;
  mostFrequent: EmotionType | null;
  averageValue: number;
  averageLabel: string;
}

export const EmotionStats = ({ data, title = '情绪统计' }: EmotionStatsProps) => {
  const stats: EmotionStatsData = useMemo(() => {
    if (!data || data.length === 0) {
      return {
        totalDays: 0,
        emotionCounts: { happy: 0, calm: 0, angry: 0, scared: 0, sad: 0, excited: 0 },
        mostFrequent: null,
        averageValue: 0,
        averageLabel: '无数据',
      };
    }

    // 计算每种情绪的数量
    const emotionCounts: Record<EmotionType, number> = {
      happy: 0,
      calm: 0,
      angry: 0,
      scared: 0,
      sad: 0,
      excited: 0,
    };

    let totalValue = 0;

    data.forEach(record => {
      emotionCounts[record.emotion]++;
      totalValue += EMOTION_CONFIG[record.emotion].value;
    });

    // 找出最常见的情绪
    let mostFrequent: EmotionType | null = null;
    let maxCount = 0;
    (Object.keys(emotionCounts) as EmotionType[]).forEach(emotion => {
      if (emotionCounts[emotion] > maxCount) {
        maxCount = emotionCounts[emotion];
        mostFrequent = emotion;
      }
    });

    // 计算平均值
    const averageValue = totalValue / data.length;
    const averageLabel = getAverageLabel(averageValue);

    return {
      totalDays: data.length,
      emotionCounts,
      mostFrequent,
      averageValue,
      averageLabel,
    };
  }, [data]);

  const getAverageLabel = (value: number): string => {
    if (value >= 4.5) return '非常兴奋';
    if (value >= 3.5) return '开心为主';
    if (value >= 2.5) return '比较平静';
    if (value >= 1.5) return '有些低落';
    return '需要关注';
  };

  if (stats.totalDays === 0) {
    return (
      <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-6 text-center">
        <div className="text-5xl mb-3">📊</div>
        <p className="text-gray-500 font-bold">暂无统计数据</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {title && (
        <h3 className="text-lg font-black text-gray-700 flex items-center gap-2">
          <span>📊</span>
          {title}
        </h3>
      )}

      {/* 概览卡片 */}
      <div className="grid grid-cols-2 gap-3">
        {/* 总天数 */}
        <motion.div
          className="bg-gradient-to-br from-purple-100 to-pink-100 rounded-2xl p-4 text-center"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
        >
          <div className="text-3xl mb-1">📅</div>
          <div className="text-2xl font-black text-purple-600">{stats.totalDays}</div>
          <div className="text-xs text-purple-500 font-bold">天记录</div>
        </motion.div>

        {/* 平均情绪 */}
        <motion.div
          className="bg-gradient-to-br from-blue-100 to-cyan-100 rounded-2xl p-4 text-center"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.1 }}
        >
          <div className="text-3xl mb-1">💭</div>
          <div className="text-lg font-black text-blue-600">{stats.averageLabel}</div>
          <div className="text-xs text-blue-500 font-bold">平均状态</div>
        </motion.div>
      </div>

      {/* 最常见情绪 */}
      {stats.mostFrequent && (
        <motion.div
          className="bg-gradient-to-br from-yellow-100 to-orange-100 rounded-2xl p-4"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <div className="text-center">
            <div className="text-xs text-yellow-600 font-bold mb-2">最常出现的情绪</div>
            <div className="flex items-center justify-center gap-2">
              <span className="text-4xl">{EMOTION_CONFIG[stats.mostFrequent].emoji}</span>
              <div>
                <div className="text-xl font-black text-yellow-700">
                  {EMOTION_CONFIG[stats.mostFrequent].label}
                </div>
                <div className="text-sm text-yellow-600">
                  {stats.emotionCounts[stats.mostFrequent]} 天
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* 情绪分布 */}
      <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-4">
        <div className="text-sm font-bold text-gray-600 mb-3">情绪分布</div>
        <div className="space-y-2">
          {(Object.keys(EMOTION_CONFIG) as EmotionType[]).map(emotion => {
            const config = EMOTION_CONFIG[emotion];
            const count = stats.emotionCounts[emotion];
            const percentage = stats.totalDays > 0 ? (count / stats.totalDays) * 100 : 0;

            return (
              <div key={emotion} className="flex items-center gap-2">
                <span className="text-lg w-6">{config.emoji}</span>
                <div className="flex-1 h-3 bg-gray-100 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full rounded-full"
                    style={{ backgroundColor: config.color }}
                    initial={{ width: 0 }}
                    animate={{ width: `${percentage}%` }}
                    transition={{ duration: 0.5, ease: 'easeOut' }}
                  />
                </div>
                <span className="text-xs font-bold text-gray-500 w-8 text-right">
                  {count}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
