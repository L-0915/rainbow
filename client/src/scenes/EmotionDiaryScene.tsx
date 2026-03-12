import { motion } from 'framer-motion';
import { useAppStore } from '@/store/appStore';
import { useEmotionStore, EMOTION_CONFIG, EmotionType } from '@/store/emotionStore';
import { useState, useEffect, useMemo, memo } from 'react';

// 获取当月天数
const getDaysInMonth = (year: number, month: number) => {
  return new Date(year, month, 0).getDate();
};

// 格式化日期显示
const formatDate = (dateStr: string) => {
  const date = new Date(dateStr);
  const month = date.getMonth() + 1;
  const day = date.getDate();
  return `${month}月${day}日`;
};

// 情绪曲线图表组件
const EmotionChart = memo(({
  history,
  year,
  month
}: {
  history: any[];
  year: number;
  month: number;
}) => {
  const daysInMonth = getDaysInMonth(year, month);
  const chartWidth = 600;
  const chartHeight = 300;
  const padding = { top: 30, right: 20, bottom: 40, left: 45 };
  const innerWidth = chartWidth - padding.left - padding.right;
  const innerHeight = chartHeight - padding.top - padding.bottom;

  // 创建每日数据映射
  const dailyData = useMemo(() => {
    const data: Record<number, { emotion: EmotionType; intensity: number } | null> = {};
    for (let i = 1; i <= daysInMonth; i++) {
      data[i] = null;
    }
    history.forEach(record => {
      const recordDate = new Date(record.date);
      const day = recordDate.getDate();
      if (recordDate.getMonth() + 1 === month && recordDate.getFullYear() === year) {
        data[day] = { emotion: record.emotion, intensity: record.intensity };
      }
    });
    return data;
  }, [history, year, month, daysInMonth]);

  const getX = (day: number) => padding.left + ((day - 1) / (daysInMonth - 1 || 1)) * innerWidth;
  const getY = (intensity: number) => padding.top + innerHeight - ((intensity - 1) / 4) * innerHeight;

  // 生成折线路径
  const linePath = useMemo(() => {
    const points: string[] = [];
    let hasStarted = false;
    for (let day = 1; day <= daysInMonth; day++) {
      const data = dailyData[day];
      if (data) {
        const x = getX(day);
        const y = getY(data.intensity);
        if (!hasStarted) {
          points.push(`M ${x} ${y}`);
          hasStarted = true;
        } else {
          points.push(`L ${x} ${y}`);
        }
      } else {
        hasStarted = false;
      }
    }
    return points.join(' ');
  }, [dailyData, daysInMonth, innerWidth, innerHeight, padding.left, padding.top]);

  // 生成面积路径
  const areaPath = useMemo(() => {
    const areaPoints: { x: number; y: number }[] = [];
    for (let day = 1; day <= daysInMonth; day++) {
      const data = dailyData[day];
      if (data) {
        areaPoints.push({ x: getX(day), y: getY(data.intensity) });
      }
    }
    if (areaPoints.length === 0) return '';
    let path = `M ${areaPoints[0].x} ${padding.top + innerHeight}`;
    areaPoints.forEach(p => path += ` L ${p.x} ${p.y}`);
    path += ` L ${areaPoints[areaPoints.length - 1].x} ${padding.top + innerHeight} Z`;
    return path;
  }, [dailyData, daysInMonth, innerWidth, innerHeight, padding.left, padding.top]);

  // X 轴显示哪些日期
  const xLabels = useMemo(() => {
    if (daysInMonth <= 7) return [1, daysInMonth];
    if (daysInMonth <= 14) return [1, Math.floor(daysInMonth/2), daysInMonth];
    return [1, Math.floor(daysInMonth/4), Math.floor(daysInMonth/2), Math.floor(daysInMonth*3/4), daysInMonth];
  }, [daysInMonth]);

  return (
    <div className="relative w-full" style={{ height: chartHeight }}>
      <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-full">
        {/* 背景 */}
        <rect x="0" y="0" width={chartWidth} height={chartHeight} fill="#F0F9F0" rx="8" />

        <defs>
          <linearGradient id="areaGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#81C784" stopOpacity="0.5" />
            <stop offset="100%" stopColor="#C8E6C9" stopOpacity="0.2" />
          </linearGradient>
        </defs>

        {/* 网格线和 Y 轴标签 */}
        {[1, 2, 3, 4, 5].map(level => {
          const y = getY(level);
          return (
            <g key={level}>
              <line x1={padding.left} y1={y} x2={chartWidth-padding.right} y2={y}
                stroke="#C8E6C8" strokeWidth="1" strokeDasharray="3 3" />
              <text x={padding.left-10} y={y+4} textAnchor="end" fontSize="12" fill="#2D5F2D" fontWeight="bold">{level}</text>
            </g>
          );
        })}

        {/* 面积 */}
        {areaPath && <path d={areaPath} fill="url(#areaGrad)" />}

        {/* 折线 */}
        {linePath && (
          <path d={linePath} fill="none" stroke="#4CAF50" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        )}

        {/* 数据点 */}
        {Object.entries(dailyData).map(([dayStr, data]) => {
          if (!data) return null;
          const day = parseInt(dayStr);
          const emotion = EMOTION_CONFIG[data.emotion];
          return (
            <circle key={day} cx={getX(day)} cy={getY(data.intensity)} r="5"
              fill={emotion.color} stroke="#FFF" strokeWidth="2" />
          );
        })}

        {/* X 轴标签 */}
        {xLabels.map(day => (
          <text key={day} x={getX(day)} y={chartHeight-12} textAnchor="middle" fontSize="11" fill="#2D5F2D" fontWeight="bold">
            {day} 日
          </text>
        ))}
      </svg>
    </div>
  );
});
EmotionChart.displayName = 'EmotionChart';

// 日历视图组件
const CalendarView = memo(({
  history,
  year,
  month
}: {
  history: any[];
  year: number;
  month: number;
}) => {
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = new Date(year, month - 1, 1).getDay();

  const dailyData = useMemo(() => {
    const data: Record<number, { emotion: EmotionType; intensity: number } | null> = {};
    history.forEach(record => {
      const recordDate = new Date(record.date);
      const day = recordDate.getDate();
      if (recordDate.getMonth() + 1 === month && recordDate.getFullYear() === year) {
        data[day] = { emotion: record.emotion, intensity: record.intensity };
      }
    });
    return data;
  }, [history, year, month]);

  const calendarCells = [];
  for (let i = 0; i < firstDay; i++) {
    calendarCells.push(<div key={`empty-${i}`} className="aspect-square" />);
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const data = dailyData[day];
    const emotion = data ? EMOTION_CONFIG[data.emotion] : null;
    calendarCells.push(
      <div
        key={day}
        className={`aspect-square rounded-lg flex flex-col items-center justify-center transition-all ${
          emotion ? 'text-white shadow-md hover:scale-105' : 'bg-gray-100 text-gray-400'
        }`}
        style={{ background: emotion ? emotion.gradient : undefined }}
      >
        <span className="font-bold text-xs sm:text-sm">{day}</span>
        {emotion && <span className="text-base sm:text-lg mt-0.5">{emotion.emoji}</span>}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-7 gap-1 sm:gap-2">
      {['日', '一', '二', '三', '四', '五', '六'].map(day => (
        <div key={day} className="text-center text-xs sm:text-sm font-bold text-green-700 py-1">{day}</div>
      ))}
      {calendarCells}
    </div>
  );
});
CalendarView.displayName = 'CalendarView';

// 情绪统计卡片 - 护眼配色版本
const EmotionStats = memo(({ history }: { history: any[] }) => {
  const stats = useMemo(() => {
    const emotionCounts: Record<string, number> = {};
    let totalIntensity = 0;

    history.forEach(record => {
      emotionCounts[record.emotion] = (emotionCounts[record.emotion] || 0) + 1;
      totalIntensity += record.intensity;
    });

    const totalDays = history.length;
    const avgIntensity = totalDays > 0 ? (totalIntensity / totalDays).toFixed(1) : '0';

    // 找出最常见的情绪
    let mostCommon: { emotion: EmotionType; count: number } | null = null;
    Object.entries(emotionCounts).forEach(([emotion, count]) => {
      if (!mostCommon || count > mostCommon.count) {
        mostCommon = { emotion: emotion as EmotionType, count };
      }
    });

    return { emotionCounts, avgIntensity, mostCommon, totalDays };
  }, [history]);

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4 w-full">
      <div className="bg-green-50/80 backdrop-blur-xl rounded-2xl p-3 sm:p-4 text-center border-2 border-green-200 shadow-md">
        <div className="text-2xl sm:text-3xl mb-1">📅</div>
        <div className="text-xs sm:text-sm text-green-700 font-bold">记录天数</div>
        <div className="text-lg sm:text-xl font-black text-green-600">{stats.totalDays}天</div>
      </div>

      <div className="bg-blue-50/80 backdrop-blur-xl rounded-2xl p-3 sm:p-4 text-center border-2 border-blue-200 shadow-md">
        <div className="text-2xl sm:text-3xl mb-1">⭐</div>
        <div className="text-xs sm:text-sm text-blue-700 font-bold">平均强度</div>
        <div className="text-lg sm:text-xl font-black text-blue-600">{stats.avgIntensity}</div>
      </div>

      <div className="bg-purple-50/80 backdrop-blur-xl rounded-2xl p-3 sm:p-4 text-center col-span-2 sm:col-span-2 border-2 border-purple-200 shadow-md">
        <div className="text-2xl sm:text-3xl mb-1">💝</div>
        <div className="text-xs sm:text-sm text-purple-700 font-bold">最常见情绪</div>
        {stats.mostCommon ? (
          <div className="text-lg sm:text-xl font-black text-purple-600 flex items-center justify-center gap-2">
            <span>{EMOTION_CONFIG[stats.mostCommon.emotion]?.emoji}</span>
            <span>{EMOTION_CONFIG[stats.mostCommon.emotion]?.label}</span>
            <span className="text-purple-400">({stats.mostCommon.count}次)</span>
          </div>
        ) : (
          <div className="text-lg sm:text-xl font-black text-purple-300">暂无数据</div>
        )}
      </div>
    </div>
  );
});
EmotionStats.displayName = 'EmotionStats';

export const EmotionDiaryScene = memo(() => {
  const navigateTo = useAppStore((state) => state.navigateTo);
  const getMonthlyHistory = useEmotionStore((state) => state.getMonthlyHistory);
  const clearHistory = useEmotionStore((state) => state.clearHistory);
  const fetchEmotionsFromBackend = useEmotionStore((state) => state.fetchEmotionsFromBackend);
  const isLoading = useEmotionStore((state) => state.isLoading);

  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'chart' | 'calendar'>('chart');

  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth() + 1;

  const history = getMonthlyHistory(currentYear, currentMonth);

  // 加载月份数据
  useEffect(() => {
    fetchEmotionsFromBackend(currentYear, currentMonth);
  }, [currentYear, currentMonth]);

  // 月份导航
  const goToPreviousMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth - 2, 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth, 1));
  };

  const goToCurrentMonth = () => {
    setCurrentDate(new Date());
  };

  // 月度重置功能 - 调用后端 API
  const handleMonthlyReset = async () => {
    if (confirm('确定要清空所有情绪记录吗？这将删除所有历史数据，重新开始记录。')) {
      await clearHistory();
      alert('情绪记录已清空，新的一个月从这里开始！🌈');
    }
  };

  const monthNames = [
    '一月', '二月', '三月', '四月', '五月', '六月',
    '七月', '八月', '九月', '十月', '十一月', '十二月'
  ];

  return (
    <div className="relative min-h-screen w-full overflow-y-auto overflow-x-hidden">
      {/* 背景 - 护眼淡绿色 */}
      <div className="fixed inset-0 bg-gradient-to-br from-green-100 via-emerald-50 to-teal-50" />

      {/* 装饰元素 */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        {[...Array(15)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute text-2xl sm:text-3xl opacity-20"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              y: [0, -20, 0],
              rotate: [0, 10, -10, 0],
            }}
            transition={{
              duration: 3 + Math.random() * 2,
              repeat: Infinity,
              delay: Math.random() * 2,
            }}
          >
            {['🌿', '🍀', '🌸', '✨', '🦋'][i % 5]}
          </motion.div>
        ))}
      </div>

      {/* 顶部导航栏 */}
      <motion.div
        className="sticky top-0 left-0 right-0 z-50 flex items-center justify-between p-2 sm:p-3 md:p-4"
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3, type: 'spring', bounce: 0.6 }}
      >
        <motion.button
          onClick={() => navigateTo('home')}
          className="bg-gradient-to-r from-green-500 to-emerald-500 backdrop-blur-xl px-2 py-1.5 sm:px-4 sm:py-2 rounded-full shadow-2xl border-4 border-white/60 font-black text-white text-xs sm:text-sm md:text-lg"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          ← 回家
        </motion.button>

        <div className="bg-gradient-to-r from-green-500 via-emerald-500 to-teal-500 backdrop-blur-xl px-2 py-1.5 sm:px-4 sm:py-2 rounded-full shadow-2xl border-4 border-white/60">
          <span className="text-sm sm:text-lg md:text-xl font-black text-white drop-shadow-lg">📔 情绪日记</span>
        </div>

        <div className="w-16 sm:w-20 md:w-24" />
      </motion.div>

      {/* 主要内容区域 */}
      <div className="relative z-10 flex flex-col items-center gap-4 sm:gap-6 p-4 sm:p-6 md:p-8">

        {/* 月份选择器 */}
        <motion.div
          className="bg-white/80 backdrop-blur-xl rounded-full px-4 py-2 sm:px-6 sm:py-3 shadow-2xl border-4 border-green-200 flex items-center gap-2 sm:gap-4"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <motion.button
            onClick={goToPreviousMonth}
            className="text-green-600 text-xl sm:text-2xl hover:scale-110 transition-transform bg-green-100 rounded-full w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center"
            whileTap={{ scale: 0.9 }}
          >
            ◀
          </motion.button>

          <span className="text-green-800 font-black text-lg sm:text-xl md:text-2xl min-w-[120px] sm:min-w-[160px] text-center">
            {currentYear}年 {monthNames[currentMonth - 1]}
          </span>

          <motion.button
            onClick={goToNextMonth}
            className="text-green-600 text-xl sm:text-2xl hover:scale-110 transition-transform bg-green-100 rounded-full w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center"
            whileTap={{ scale: 0.9 }}
          >
            ▶
          </motion.button>

          <motion.button
            onClick={goToCurrentMonth}
            className="bg-green-500 hover:bg-green-600 text-white font-bold text-xs sm:text-sm px-2 sm:px-3 py-1 rounded-full transition-colors"
            whileTap={{ scale: 0.95 }}
          >
            本月
          </motion.button>
        </motion.div>

        {/* 视图切换和重置按钮 */}
        <motion.div
          className="flex gap-2 sm:gap-4 flex-wrap justify-center"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.6 }}
        >
          <button
            onClick={() => setViewMode('chart')}
            className={`px-3 py-1.5 sm:px-6 sm:py-2 rounded-full font-black text-sm sm:text-lg transition-all border-4 ${
              viewMode === 'chart'
                ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white border-green-200 shadow-xl'
                : 'bg-white text-green-600 border-green-200'
            }`}
          >
            📈 曲线图
          </button>

          <button
            onClick={() => setViewMode('calendar')}
            className={`px-3 py-1.5 sm:px-6 sm:py-2 rounded-full font-black text-sm sm:text-lg transition-all border-4 ${
              viewMode === 'calendar'
                ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white border-green-200 shadow-xl'
                : 'bg-white text-green-600 border-green-200'
            }`}
          >
            📅 日历
          </button>

          <button
            onClick={handleMonthlyReset}
            className="px-3 py-1.5 sm:px-6 sm:py-2 rounded-full font-black text-sm sm:text-lg bg-gradient-to-r from-red-400 to-orange-400 text-white border-4 border-red-200 shadow-xl transition-all hover:scale-105"
          >
            🔄 清空记录
          </button>
        </motion.div>

        {/* 情绪统计 */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.7 }}
        >
          <EmotionStats history={history} />
        </motion.div>

        {/* 曲线图或日历视图 */}
        <motion.div
          className="w-full max-w-2xl bg-white/90 backdrop-blur-xl rounded-2xl p-3 sm:p-6 shadow-xl border-4 border-green-200"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.8 }}
        >
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-green-600 text-sm sm:text-lg font-bold animate-pulse">
                🌈 正在加载情绪数据...
              </div>
            </div>
          ) : viewMode === 'chart' ? (
            <>
              <div className="text-green-800 font-bold text-sm sm:text-lg mb-3 text-center">
                📊 情绪变化曲线
              </div>
              <EmotionChart history={history} year={currentYear} month={currentMonth} />
            </>
          ) : (
            <>
              <div className="text-green-800 font-bold text-sm sm:text-lg mb-3 text-center">
                📅 情绪日历
              </div>
              <CalendarView history={history} year={currentYear} month={currentMonth} />
            </>
          )}
        </motion.div>

        {/* 情绪图例 */}
        <motion.div
          className="flex flex-wrap justify-center gap-2 px-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.9 }}
        >
          {(Object.keys(EMOTION_CONFIG) as EmotionType[]).map((emotion) => {
            const config = EMOTION_CONFIG[emotion];
            return (
              <div
                key={emotion}
                className="flex items-center gap-1 bg-white/80 rounded-full px-2 py-1 shadow-sm"
              >
                <span className="text-sm">{config.emoji}</span>
                <span className="text-green-700 text-xs font-bold">{config.label}</span>
              </div>
            );
          })}
        </motion.div>

        {/* 底部提示 */}
        <motion.div
          className="bg-white/90 backdrop-blur-xl px-3 py-1.5 sm:px-4 sm:py-2 rounded-full shadow-2xl border-4 border-green-200"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1 }}
        >
          <span className="text-xs sm:text-sm font-bold text-green-700">
            💕 每天记录心情，看见自己的成长轨迹～
          </span>
        </motion.div>

      </div>
    </div>
  );
});

EmotionDiaryScene.displayName = 'EmotionDiaryScene';
