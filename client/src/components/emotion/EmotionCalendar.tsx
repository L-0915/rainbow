import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useEmotionStore, EMOTION_CONFIG, type EmotionType, type EmotionRecord } from '@/store/emotionStore';

interface EmotionCalendarProps {
  onDayClick?: (record: EmotionRecord | null, date: string) => void;
}

export const EmotionCalendar = ({ onDayClick }: EmotionCalendarProps) => {
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth() + 1);
  const history = useEmotionStore((state) => state.history);

  // 获取当月数据
  const monthlyData = useMemo(() => {
    const monthPrefix = `${currentYear}-${String(currentMonth).padStart(2, '0')}`;
    return history.filter((r) => r.date.startsWith(monthPrefix));
  }, [history, currentYear, currentMonth]);

  // 生成日历数据
  const calendarDays = useMemo(() => {
    const days: { date: string; day: number; isCurrentMonth: boolean; record?: EmotionRecord }[] = [];

    // 当月第一天
    const firstDay = new Date(currentYear, currentMonth - 1, 1);
    const startDayOfWeek = firstDay.getDay(); // 周日为0

    // 上个月的天数
    const prevMonthLastDay = new Date(currentYear, currentMonth, 0).getDate();

    // 当月天数
    const daysInMonth = new Date(currentYear, currentMonth, 0).getDate();

    // 添加上月末尾天数
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      const day = prevMonthLastDay - i;
      const prevMonth = currentMonth === 1 ? 12 : currentMonth - 1;
      const year = currentMonth === 1 ? currentYear - 1 : currentYear;
      days.push({
        date: `${year}-${String(prevMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
        day,
        isCurrentMonth: false,
      });
    }

    // 添加当月天数
    for (let i = 1; i <= daysInMonth; i++) {
      const dateStr = `${currentYear}-${String(currentMonth).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
      const record = monthlyData.find((r) => r.date === dateStr);
      days.push({
        date: dateStr,
        day: i,
        isCurrentMonth: true,
        record,
      });
    }

    // 添加下月开头天数（补齐6行）
    const remainingDays = 42 - days.length;
    for (let i = 1; i <= remainingDays; i++) {
      const nextMonth = currentMonth === 12 ? 1 : currentMonth + 1;
      const year = currentMonth === 12 ? currentYear + 1 : currentYear;
      days.push({
        date: `${year}-${String(nextMonth).padStart(2, '0')}-${String(i).padStart(2, '0')}`,
        day: i,
        isCurrentMonth: false,
      });
    }

    return days;
  }, [currentYear, currentMonth, monthlyData]);

  // 切换月份
  const prevMonth = () => {
    if (currentMonth === 1) {
      setCurrentMonth(12);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const nextMonth = () => {
    if (currentMonth === 12) {
      setCurrentMonth(1);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  // 月份名称
  const monthNames = ['一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '十二月'];
  const weekDays = ['日', '一', '二', '三', '四', '五', '六'];

  // 统计数据
  const stats = useMemo(() => {
    const emotionCounts: Record<EmotionType, number> = {
      happy: 0, calm: 0, angry: 0, scared: 0, sad: 0, excited: 0,
    };
    monthlyData.forEach((r) => {
      emotionCounts[r.emotion]++;
    });
    return emotionCounts;
  }, [monthlyData]);

  return (
    <div className="bg-white/90 backdrop-blur-xl rounded-3xl p-4 shadow-xl border-4 border-white/60">
      {/* 月份导航 */}
      <div className="flex items-center justify-between mb-4">
        <motion.button
          onClick={prevMonth}
          className="w-10 h-10 rounded-full bg-purple-100 hover:bg-purple-200 flex items-center justify-center text-purple-600 font-bold"
          whileTap={{ scale: 0.9 }}
        >
          ←
        </motion.button>
        <div className="text-center">
          <h3 className="text-lg font-black text-gray-700">{currentYear}年 {monthNames[currentMonth - 1]}</h3>
          <p className="text-xs text-gray-400">记录了 {monthlyData.length} 天心情</p>
        </div>
        <motion.button
          onClick={nextMonth}
          className="w-10 h-10 rounded-full bg-purple-100 hover:bg-purple-200 flex items-center justify-center text-purple-600 font-bold"
          whileTap={{ scale: 0.9 }}
        >
          →
        </motion.button>
      </div>

      {/* 星期标题 */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {weekDays.map((day) => (
          <div key={day} className="text-center text-xs font-bold text-gray-400 py-1">
            {day}
          </div>
        ))}
      </div>

      {/* 日历格子 */}
      <div className="grid grid-cols-7 gap-1">
        {calendarDays.map((day, index) => {
          const isToday = day.date === new Date().toISOString().split('T')[0];
          const config = day.record ? EMOTION_CONFIG[day.record.emotion] : null;

          return (
            <motion.button
              key={index}
              onClick={() => onDayClick?.(day.record || null, day.date)}
              disabled={!day.isCurrentMonth}
              className={`
                aspect-square rounded-xl flex flex-col items-center justify-center relative
                transition-all duration-200
                ${day.isCurrentMonth ? 'cursor-pointer' : 'opacity-30'}
                ${isToday ? 'ring-2 ring-purple-400 ring-offset-1' : ''}
              `}
              whileTap={day.isCurrentMonth ? { scale: 0.9 } : {}}
            >
              {/* 情绪颜色背景 */}
              {config && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute inset-1 rounded-lg opacity-20"
                  style={{ backgroundColor: config.color }}
                />
              )}

              {/* 日期数字 */}
              <span
                className={`
                  relative z-10 text-sm font-bold
                  ${isToday ? 'text-purple-600' : 'text-gray-600'}
                  ${!day.isCurrentMonth ? 'text-gray-300' : ''}
                `}
              >
                {day.day}
              </span>

              {/* 情绪 emoji */}
              {config && (
                <motion.span
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  className="relative z-10 text-base"
                >
                  {config.emoji}
                </motion.span>
              )}
            </motion.button>
          );
        })}
      </div>

      {/* 情绪统计 */}
      <div className="mt-4 pt-4 border-t-2 border-gray-100">
        <p className="text-xs font-bold text-gray-500 mb-2 text-center">📊 本月心情统计</p>
        <div className="flex flex-wrap justify-center gap-2">
          {(Object.keys(stats) as EmotionType[]).map((emotion) => {
            const config = EMOTION_CONFIG[emotion];
            const count = stats[emotion];
            if (count === 0) return null;

            return (
              <motion.div
                key={emotion}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-1 bg-white/60 rounded-full px-3 py-1 shadow-sm"
              >
                <span>{config.emoji}</span>
                <span className="text-xs font-bold text-gray-600">{count}天</span>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
};