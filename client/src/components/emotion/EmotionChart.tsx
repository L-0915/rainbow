import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { EMOTION_CONFIG, EMOTION_VALUES, EmotionType, EmotionRecord } from '@/store/emotionStore';

interface EmotionChartProps {
  data: EmotionRecord[];
  title?: string;
  height?: number;
}

export const EmotionChart = ({ data, title = '情绪变化曲线', height = 300 }: EmotionChartProps) => {
  // 将数据转换为图表可用的格式
  const chartData = useMemo(() => {
    if (!data || data.length === 0) return [];

    // 按日期排序并去重（每天只保留最后一条记录）
    const sortedData = [...data]
      .sort((a, b) => a.date.localeCompare(b.date))
      .reduce((acc, record) => {
        const existingIndex = acc.findIndex(r => r.date === record.date);
        if (existingIndex !== -1) {
          acc[existingIndex] = record;
        } else {
          acc.push(record);
        }
        return acc;
      }, [] as EmotionRecord[]);

    return sortedData;
  }, [data]);

  // 计算图表的最大最小值
  const maxValue = 5;
  const minValue = 0;

  // 生成 X 轴标签（日期）
  const xLabels = useMemo(() => {
    if (chartData.length <= 7) {
      return chartData.map(d => {
        const date = new Date(d.date);
        return `${date.getMonth() + 1}/${date.getDate()}`;
      });
    }
    // 数据多时，只显示部分标签
    const step = Math.ceil(chartData.length / 7);
    return chartData.map((d, i) => {
      if (i % step === 0 || i === chartData.length - 1) {
        const date = new Date(d.date);
        return `${date.getMonth() + 1}/${date.getDate()}`;
      }
      return '';
    });
  }, [chartData]);

  // 生成 Y 轴标签
  const yLabels = [
    { value: 5, label: '兴奋' },
    { value: 4, label: '开心' },
    { value: 3, label: '平静' },
    { value: 2, label: '低落' },
    { value: 1, label: '难过' },
  ];

  // 计算点的位置
  const getPointPosition = (index: number, value: number) => {
    const chartWidth = 100;
    const chartHeight = 100;
    const padding = { top: 10, right: 10, bottom: 20, left: 10 };

    const availableWidth = chartWidth - padding.left - padding.right;
    const availableHeight = chartHeight - padding.top - padding.bottom;

    const x = padding.left + (index / Math.max(chartData.length - 1, 1)) * availableWidth;
    const y = padding.top + availableHeight - ((value - minValue) / (maxValue - minValue)) * availableHeight;

    return { x, y };
  };

  // 生成折线路径
  const linePath = useMemo(() => {
    if (chartData.length < 2) return '';

    const points = chartData.map((d, i) => {
      const value = EMOTION_VALUES[d.emotion];
      const pos = getPointPosition(i, value);
      return `${pos.x},${pos.y}`;
    });

    return `M ${points.join(' L ')}`;
  }, [chartData]);

  // 生成填充区域路径
  const areaPath = useMemo(() => {
    if (chartData.length < 2) return '';

    const points = chartData.map((d, i) => {
      const value = EMOTION_VALUES[d.emotion];
      const pos = getPointPosition(i, value);
      return `${pos.x},${pos.y}`;
    });

    const firstPoint = getPointPosition(0, minValue);
    const lastPoint = getPointPosition(chartData.length - 1, minValue);

    return `M ${firstPoint.x},${firstPoint.y} L ${points.join(' L ')} L ${lastPoint.x},${lastPoint.y} Z`;
  }, [chartData]);

  // 获取情绪对应的颜色
  const getEmotionColor = (emotion: EmotionType) => {
    return EMOTION_CONFIG[emotion].color;
  };

  // 生成渐变 ID
  const gradientId = `emotion-gradient-${Date.now()}`;

  if (chartData.length === 0) {
    return (
      <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-8 text-center">
        <div className="text-6xl mb-4">📊</div>
        <p className="text-gray-500 font-bold">暂无情绪数据</p>
        <p className="text-gray-400 text-sm mt-2">开始记录每天的心情吧～</p>
      </div>
    );
  }

  return (
    <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-6 shadow-xl border-4 border-white/60">
      {title && (
        <div className="text-center mb-4">
          <h3 className="text-xl font-black text-gray-700 flex items-center justify-center gap-2">
            <span>📈</span>
            {title}
          </h3>
          <p className="text-gray-400 text-sm mt-1">
            共 {chartData.length} 天记录
          </p>
        </div>
      )}

      {/* 图表区域 */}
      <div className="relative" style={{ height }}>
        <svg
          viewBox="0 0 100 100"
          className="w-full h-full"
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient id={gradientId} x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#A78BFA" stopOpacity="0.5" />
              <stop offset="100%" stopColor="#A78BFA" stopOpacity="0.1" />
            </linearGradient>
          </defs>

          {/* Y 轴网格线 */}
          {[1, 2, 3, 4, 5].map(value => {
            const pos = getPointPosition(0, value);
            return (
              <line
                key={value}
                x1="0"
                y1={pos.y}
                x2="100"
                y2={pos.y}
                stroke="#E5E7EB"
                strokeWidth="0.5"
                strokeDasharray="2,2"
              />
            );
          })}

          {/* 填充区域 */}
          <path
            d={areaPath}
            fill={`url(#${gradientId})`}
            className="transition-all duration-500"
          />

          {/* 折线 */}
          <path
            d={linePath}
            fill="none"
            stroke="#A78BFA"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="transition-all duration-500"
          />

          {/* 数据点 */}
          {chartData.map((d, i) => {
            const value = EMOTION_VALUES[d.emotion];
            const pos = getPointPosition(i, value);
            const color = getEmotionColor(d.emotion);

            return (
              <g key={d.id}>
                {/* 外圈光晕 */}
                <circle
                  cx={pos.x}
                  cy={pos.y}
                  r="4"
                  fill={color}
                  opacity="0.3"
                  className="animate-pulse"
                />
                {/* 数据点 */}
                <circle
                  cx={pos.x}
                  cy={pos.y}
                  r="2.5"
                  fill={color}
                  stroke="white"
                  strokeWidth="0.5"
                />
                {/* Emoji 标签 */}
                <foreignObject
                  x={pos.x - 4}
                  y={pos.y - 6}
                  width="8"
                  height="8"
                >
                  <span className="text-[8px] leading-none">
                    {EMOTION_CONFIG[d.emotion].emoji}
                  </span>
                </foreignObject>
              </g>
            );
          })}
        </svg>

        {/* X 轴标签 */}
        <div className="absolute bottom-0 left-0 right-0 flex justify-between px-2">
          {xLabels.map((label, i) => (
            <div
              key={i}
              className="text-[10px] text-gray-400 text-center"
              style={{ minWidth: '20px' }}
            >
              {label}
            </div>
          ))}
        </div>
      </div>

      {/* Y 轴图例 */}
      <div className="mt-8 flex justify-between items-center px-2">
        {yLabels.map(item => (
          <div key={item.value} className="text-center">
            <div className="text-xs font-bold text-gray-600">{item.label}</div>
            <div className="text-[10px] text-gray-400">Lv.{item.value}</div>
          </div>
        ))}
      </div>

      {/* 情绪图例 */}
      <div className="mt-4 pt-4 border-t-2 border-gray-100">
        <div className="flex flex-wrap justify-center gap-3">
          {(Object.keys(EMOTION_CONFIG) as EmotionType[]).map(emotion => {
            const config = EMOTION_CONFIG[emotion];
            const count = chartData.filter(d => d.emotion === emotion).length;

            return (
              <div
                key={emotion}
                className="flex items-center gap-2 bg-white/60 rounded-full px-3 py-1.5"
              >
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: config.color }}
                />
                <span className="text-sm">{config.emoji}</span>
                <span className="text-xs font-bold text-gray-600">{count}天</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
