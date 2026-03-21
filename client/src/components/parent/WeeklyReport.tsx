import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { EMOTION_CONFIG, EMOTION_VALUES, type EmotionType, type EmotionRecord } from '@/store/emotionStore';

interface WeeklyReportProps {
  data: EmotionRecord[];
  childName?: string;
}

export const WeeklyReport = ({ data, childName = '小宝贝' }: WeeklyReportProps) => {
  // 获取本周数据
  const weeklyData = useMemo(() => {
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    return data.filter(r => new Date(r.date) >= weekAgo);
  }, [data]);

  // 统计分析
  const stats = useMemo(() => {
    if (weeklyData.length === 0) {
      return {
        totalDays: 0,
        avgValue: 0,
        mostFrequent: null,
        positiveRatio: 0,
        trend: 'stable' as const,
        hasWarning: false,
        warningMessage: '',
      };
    }

    // 情绪计数
    const counts: Record<EmotionType, number> = {
      happy: 0, calm: 0, angry: 0, scared: 0, sad: 0, excited: 0,
    };
    weeklyData.forEach(r => { counts[r.emotion]++; });

    // 平均情绪值
    const avgValue = weeklyData.reduce((sum, r) => sum + EMOTION_VALUES[r.emotion], 0) / weeklyData.length;

    // 最常见情绪
    const mostFrequent = (Object.entries(counts) as [EmotionType, number][])
      .sort((a, b) => b[1] - a[1])[0];

    // 正面情绪比例
    const positiveCount = counts.happy + counts.excited + counts.calm;
    const positiveRatio = (positiveCount / weeklyData.length) * 100;

    // 趋势分析（前半周 vs 后半周）
    const midPoint = Math.floor(weeklyData.length / 2);
    const firstHalf = weeklyData.slice(0, midPoint);
    const secondHalf = weeklyData.slice(midPoint);

    const firstAvg = firstHalf.length > 0
      ? firstHalf.reduce((sum, r) => sum + EMOTION_VALUES[r.emotion], 0) / firstHalf.length
      : 0;
    const secondAvg = secondHalf.length > 0
      ? secondHalf.reduce((sum, r) => sum + EMOTION_VALUES[r.emotion], 0) / secondHalf.length
      : 0;

    let trend: 'up' | 'down' | 'stable' = 'stable';
    if (secondAvg - firstAvg > 0.5) trend = 'up';
    else if (firstAvg - secondAvg > 0.5) trend = 'down';

    // 异常预警检测
    const negativeCount = counts.sad + counts.angry + counts.scared;
    const hasWarning = negativeCount >= 3 || (weeklyData.length >= 3 && avgValue < 2.5);

    let warningMessage = '';
    if (counts.sad >= 3) {
      warningMessage = `${childName}本周多次感到难过，建议多陪伴交流`;
    } else if (counts.angry >= 3) {
      warningMessage = `${childName}本周情绪波动较大，关注是否有压力来源`;
    } else if (counts.scared >= 2) {
      warningMessage = `${childName}本周有害怕情绪，了解是否有困扰`;
    } else if (avgValue < 2.5 && weeklyData.length >= 3) {
      warningMessage = `${childName}本周整体情绪偏低，建议关注`;
    }

    return {
      totalDays: weeklyData.length,
      avgValue,
      mostFrequent,
      positiveRatio,
      trend,
      hasWarning,
      warningMessage,
      counts,
    };
  }, [weeklyData, childName]);

  // 生成报告日期范围
  const dateRange = useMemo(() => {
    if (weeklyData.length === 0) return '';
    const dates = weeklyData.map(r => new Date(r.date)).sort((a, b) => a.getTime() - b.getTime());
    const start = dates[0];
    const end = dates[dates.length - 1];
    return `${start.getMonth() + 1}/${start.getDate()} - ${end.getMonth() + 1}/${end.getDate()}`;
  }, [weeklyData]);

  if (weeklyData.length === 0) {
    return (
      <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-6 text-center shadow-lg">
        <div className="text-4xl mb-3">📊</div>
        <p className="text-gray-500 font-bold">本周暂无数据</p>
        <p className="text-gray-400 text-sm mt-1">等待孩子记录更多心情～</p>
      </div>
    );
  }

  return (
    <div className="bg-white/90 backdrop-blur-xl rounded-2xl p-4 shadow-lg border-2 border-purple-100">
      {/* 标题 */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="text-2xl">📋</span>
          <div>
            <h3 className="font-bold text-gray-700">本周情绪报告</h3>
            <p className="text-xs text-gray-400">{dateRange}</p>
          </div>
        </div>
        {stats.hasWarning && (
          <motion.div
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 1, repeat: Infinity }}
            className="bg-red-100 text-red-600 text-xs font-bold px-3 py-1 rounded-full"
          >
            ⚠️ 需关注
          </motion.div>
        )}
      </div>

      {/* 预警提示 */}
      {stats.hasWarning && stats.warningMessage && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-orange-50 to-red-50 border-2 border-orange-200 rounded-xl p-3 mb-4"
        >
          <div className="flex items-start gap-2">
            <span className="text-lg">💡</span>
            <div>
              <p className="text-orange-700 text-sm font-bold">温馨提示</p>
              <p className="text-orange-600 text-xs mt-1">{stats.warningMessage}</p>
            </div>
          </div>
        </motion.div>
      )}

      {/* 核心指标 */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <motion.div
          className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-3 text-center"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.1 }}
        >
          <p className="text-2xl font-black text-purple-600">{stats.totalDays}</p>
          <p className="text-xs text-gray-500">记录天数</p>
        </motion.div>

        <motion.div
          className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-xl p-3 text-center"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <p className="text-2xl font-black text-orange-600">{stats.positiveRatio.toFixed(0)}%</p>
          <p className="text-xs text-gray-500">积极情绪</p>
        </motion.div>

        <motion.div
          className={`rounded-xl p-3 text-center ${
            stats.trend === 'up' ? 'bg-gradient-to-br from-green-50 to-emerald-50' :
            stats.trend === 'down' ? 'bg-gradient-to-br from-red-50 to-pink-50' :
            'bg-gradient-to-br from-blue-50 to-cyan-50'
          }`}
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <p className="text-2xl">
            {stats.trend === 'up' ? '📈' : stats.trend === 'down' ? '📉' : '📊'}
          </p>
          <p className="text-xs text-gray-500">
            {stats.trend === 'up' ? '情绪上升' : stats.trend === 'down' ? '需关注' : '稳定'}
          </p>
        </motion.div>
      </div>

      {/* 最常心情 */}
      {stats.mostFrequent && stats.mostFrequent[1] > 0 && (
        <div className="bg-gray-50 rounded-xl p-3 mb-4">
          <p className="text-xs text-gray-500 mb-2">本周最常心情</p>
          <div className="flex items-center gap-3">
            <span className="text-3xl">{EMOTION_CONFIG[stats.mostFrequent[0]].emoji}</span>
            <div>
              <p className="font-bold text-gray-700">{EMOTION_CONFIG[stats.mostFrequent[0]].label}</p>
              <p className="text-xs text-gray-400">出现了 {stats.mostFrequent[1]} 次</p>
            </div>
          </div>
        </div>
      )}

      {/* 情绪分布条 */}
      <div className="space-y-2">
        <p className="text-xs text-gray-500">情绪分布</p>
        <div className="flex h-4 rounded-full overflow-hidden bg-gray-100">
          {(Object.entries(stats.counts) as [EmotionType, number][])
            .filter(([_, count]) => count > 0)
            .map(([emotion, count]) => {
              const percentage = (count / weeklyData.length) * 100;
              return (
                <motion.div
                  key={emotion}
                  initial={{ width: 0 }}
                  animate={{ width: `${percentage}%` }}
                  transition={{ duration: 0.5 }}
                  className="h-full"
                  style={{ backgroundColor: EMOTION_CONFIG[emotion].color }}
                  title={`${EMOTION_CONFIG[emotion].label}: ${count}天`}
                />
              );
            })}
        </div>
        <div className="flex flex-wrap gap-2 mt-2">
          {(Object.entries(stats.counts) as [EmotionType, number][])
            .filter(([_, count]) => count > 0)
            .map(([emotion, count]) => (
              <div key={emotion} className="flex items-center gap-1 text-xs">
                <div
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: EMOTION_CONFIG[emotion].color }}
                />
                <span className="text-gray-600">{EMOTION_CONFIG[emotion].emoji}</span>
                <span className="text-gray-400">{count}</span>
              </div>
            ))}
        </div>
      </div>

      {/* 专家建议 */}
      <div className="mt-4 pt-4 border-t border-gray-100">
        <div className="flex items-start gap-2">
          <span className="text-lg">👩‍⚕️</span>
          <div>
            <p className="text-xs font-bold text-gray-600">专家建议</p>
            <p className="text-xs text-gray-500 mt-1">
              {stats.positiveRatio >= 70
                ? `${childName}本周情绪状态良好，继续保持积极的互动交流！`
                : stats.positiveRatio >= 40
                ? `建议每天花10分钟和${childName}聊聊今天发生的事情，倾听比建议更重要。`
                : `建议多关注${childName}的日常，创造轻松的家庭氛围，如有需要可咨询专业人士。`}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};