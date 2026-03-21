import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { EMOTION_VALUES, EMOTION_CONFIG, type EmotionType, type EmotionRecord } from '@/store/emotionStore';

interface EmotionAlertProps {
  data: EmotionRecord[];
  childName?: string;
  onAcknowledge?: () => void;
}

interface Alert {
  type: 'warning' | 'info' | 'success';
  title: string;
  message: string;
  icon: string;
  date: string;
}

export const EmotionAlert = ({ data, childName = '小宝贝', onAcknowledge }: EmotionAlertProps) => {
  // 分析异常情况
  const alerts = useMemo(() => {
    const result: Alert[] = [];
    const now = new Date();
    const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);

    // 最近3天的数据
    const recentData = data.filter(r => new Date(r.date) >= threeDaysAgo);

    // 1. 连续负面情绪检测
    const negativeEmotions = recentData.filter(r =>
      ['sad', 'angry', 'scared'].includes(r.emotion)
    );

    if (negativeEmotions.length >= 2) {
      const lastNegative = negativeEmotions[negativeEmotions.length - 1];
      result.push({
        type: 'warning',
        title: '连续负面情绪',
        message: `${childName}最近${negativeEmotions.length}天情绪不太好，建议找机会聊聊`,
        icon: '😔',
        date: lastNegative.date,
      });
    }

    // 2. 情绪突变检测（从开心突然变得难过）
    if (recentData.length >= 2) {
      const sorted = [...recentData].sort((a, b) => a.date.localeCompare(b.date));
      const last = sorted[sorted.length - 1];
      const prev = sorted[sorted.length - 2];

      const lastValue = EMOTION_VALUES[last.emotion];
      const prevValue = EMOTION_VALUES[prev.emotion];

      if (prevValue >= 4 && lastValue <= 2) {
        result.push({
          type: 'warning',
          title: '情绪突变',
          message: `${childName}今天情绪变化较大，可能发生了什么事`,
          icon: '⚠️',
          date: last.date,
        });
      }
    }

    // 3. 连续开心奖励
    const recentHappy = recentData.filter(r => r.emotion === 'happy' || r.emotion === 'excited');
    if (recentHappy.length >= 3) {
      result.push({
        type: 'success',
        title: '情绪棒棒的！',
        message: `${childName}连续${recentHappy.length}天心情愉快，给TA一个拥抱吧！`,
        icon: '🎉',
        date: recentHappy[recentHappy.length - 1].date,
      });
    }

    // 4. 今日情绪提醒
    const today = new Date().toISOString().split('T')[0];
    const todayEmotion = data.find(r => r.date === today);
    if (!todayEmotion) {
      result.push({
        type: 'info',
        title: '今日心情待记录',
        message: `${childName}今天还没有记录心情，可以提醒一下TA`,
        icon: '📝',
        date: today,
      });
    }

    return result;
  }, [data, childName]);

  if (alerts.length === 0) {
    return (
      <div className="bg-green-50 rounded-xl p-4 border-2 border-green-200">
        <div className="flex items-center gap-3">
          <span className="text-2xl">✨</span>
          <div>
            <p className="font-bold text-green-700">一切正常</p>
            <p className="text-sm text-green-600">{childName}的情绪状态良好，无需特别关注</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-gray-700 flex items-center gap-2">
          <span>🔔</span> 情绪提醒
        </h3>
        <span className="text-xs bg-red-100 text-red-600 px-2 py-1 rounded-full font-bold">
          {alerts.length} 条
        </span>
      </div>

      {alerts.map((alert, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.1 }}
          className={`rounded-xl p-4 border-2 ${
            alert.type === 'warning'
              ? 'bg-red-50 border-red-200'
              : alert.type === 'success'
              ? 'bg-green-50 border-green-200'
              : 'bg-blue-50 border-blue-200'
          }`}
        >
          <div className="flex items-start gap-3">
            <span className="text-2xl">{alert.icon}</span>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <p className={`font-bold ${
                  alert.type === 'warning' ? 'text-red-700' :
                  alert.type === 'success' ? 'text-green-700' : 'text-blue-700'
                }`}>
                  {alert.title}
                </p>
                <span className="text-xs text-gray-400">{alert.date}</span>
              </div>
              <p className={`text-sm mt-1 ${
                alert.type === 'warning' ? 'text-red-600' :
                alert.type === 'success' ? 'text-green-600' : 'text-blue-600'
              }`}>
                {alert.message}
              </p>
            </div>
          </div>

          {alert.type === 'warning' && onAcknowledge && (
            <motion.button
              onClick={onAcknowledge}
              className="mt-3 w-full bg-white/80 hover:bg-white text-gray-600 font-bold text-sm py-2 rounded-lg transition-all"
              whileTap={{ scale: 0.95 }}
            >
              我知道了
            </motion.button>
          )}
        </motion.div>
      ))}
    </div>
  );
};