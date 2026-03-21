import { useState, useEffect, useMemo, memo } from 'react';
import { motion } from 'framer-motion';
import { ParentWatchScene } from './ParentWatchScene';
import { useAppStore } from '@/store/appStore';
import { useIsWatch } from '@/hooks/useIsWatch';
import { EmotionChart } from '@/components/emotion/EmotionChart';
import { EmotionStats } from '@/components/emotion/EmotionStats';
import { WeeklyReport } from '@/components/parent/WeeklyReport';
import { EmotionAlert } from '@/components/parent/EmotionAlert';
import { ReportExport } from '@/components/parent/ReportExport';
import { ChildSwitcher, useCurrentChild } from '@/components/parent/ChildSwitcher';
import { EMOTION_CONFIG, EmotionType } from '@/store/emotionStore';

interface ParentInfo {
  parent_id: number;
  nickname: string;
  token: string;
}

interface WatchBinding {
  watch_id: string;
  child_nickname: string;
  bound_at: string;
  child_id?: number;
  parent_name?: string;
}

interface Emotion {
  id: number;
  emotion_type: string;
  emotion_label: string;
  content: string | null;
  ai_response: string | null;
  created_at: string;
}

interface Bottle {
  id: number;
  content: string;
  mood: string | null;
  created_at: string;
  is_read: boolean;
}

const EMOTION_CONFIG_MAP: Record<string, { label: string; emoji: string; color: string }> = {
  happy: { label: '开心', emoji: '😊', color: 'from-yellow-400 to-orange-400' },
  calm: { label: '平静', emoji: '😌', color: 'from-blue-400 to-cyan-400' },
  angry: { label: '生气', emoji: '😤', color: 'from-red-400 to-pink-400' },
  scared: { label: '害怕', emoji: '😨', color: 'from-indigo-400 to-purple-400' },
  sad: { label: '难过', emoji: '😢', color: 'from-gray-400 to-slate-400' },
  excited: { label: '兴奋', emoji: '🤩', color: 'from-green-400 to-emerald-400' },
};

// 情绪类型映射
const EMOTION_TYPE_MAP: Record<string, EmotionType> = {
  happy: 'happy',
  calm: 'calm',
  angry: 'angry',
  scared: 'scared',
  sad: 'sad',
  excited: 'excited',
};

export const ParentDashboard = memo(() => {
  const isWatch = useIsWatch();

  // 手表端使用简化布局
  if (isWatch) {
    return <WatchParentDashboard />;
  }

  // 手机端使用原有布局
  return <PhoneParentDashboard />;
});

// ============ 手表端家长端布局 ============
const WatchParentDashboard = memo(() => {
  const navigateTo = useAppStore((state) => state.navigateTo);
  const [watchBinding, setWatchBinding] = useState<WatchBinding | null>(null);
  const [emotions, setEmotions] = useState<Emotion[]>([]);
  const [loading, setLoading] = useState(true);

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

  useEffect(() => {
    const savedWatch = localStorage.getItem('watchBinding');
    if (savedWatch) {
      const binding = JSON.parse(savedWatch);
      setWatchBinding(binding);
      loadChildData(binding.watch_id);
    } else {
      setLoading(false);
    }
  }, []);

  const loadChildData = async (watchId: string) => {
    try {
      const childResponse = await fetch(`${API_BASE_URL}/api/parents/watch/${watchId}/child`);
      const childData = await childResponse.json();
      if (childData.code === 0 && childData.data.child) {
        const emoResponse = await fetch(`${API_BASE_URL}/api/parents/children/${childData.data.child.id}/emotions`);
        const emoData = await emoResponse.json();
        if (emoData.code === 0) {
          setEmotions(emoData.data.emotions || []);
        }
      }
    } catch (err) {
      console.error('加载失败:', err);
    } finally {
      setLoading(false);
    }
  };

  // 获取最近情绪
  const latestEmotion = emotions[0];

  if (loading) {
    return (
      <div className="relative w-full h-full flex flex-col items-center justify-center">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-200 to-purple-200" />
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
          className="text-4xl"
        >
          ⌚
        </motion.div>
        <p className="text-white/80 text-sm font-bold mt-2">加载中...</p>
      </div>
    );
  }

  if (!watchBinding) {
    return <ParentWatchScene onBack={() => navigateTo('home')} />;
  }

  return (
    <div className="relative w-full h-full flex flex-col">
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-200 to-purple-200" />

      <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 pt-12">
        {/* 标题 */}
        <div className="text-3xl mb-4">⌚</div>

        {/* 孩子信息 */}
        <div className="bg-white/60 backdrop-blur-md rounded-2xl px-4 py-2 mb-4 shadow-lg">
          <span className="text-sm font-bold text-gray-700">
            {watchBinding.child_nickname || '小宝贝'}
          </span>
        </div>

        {/* 最近情绪 */}
        {latestEmotion ? (
          <div className="bg-white/70 backdrop-blur-md rounded-2xl p-4 shadow-xl w-full max-w-[200px]">
            <p className="text-xs text-gray-500 text-center mb-2">最近心情</p>
            <div className="flex items-center justify-center gap-2">
              <span className="text-3xl">
                {EMOTION_CONFIG_MAP[latestEmotion.emotion_type]?.emoji || '😊'}
              </span>
              <span className="text-lg font-bold text-gray-700">
                {EMOTION_CONFIG_MAP[latestEmotion.emotion_type]?.label || '开心'}
              </span>
            </div>
          </div>
        ) : (
          <div className="bg-white/60 backdrop-blur-md rounded-2xl p-4 shadow-xl">
            <p className="text-sm text-gray-500">暂无情绪记录</p>
          </div>
        )}

        {/* 统计 */}
        <div className="flex gap-4 mt-4">
          <div className="bg-white/60 rounded-xl px-3 py-2 text-center">
            <div className="text-xl font-bold text-purple-600">{emotions.length}</div>
            <div className="text-xs text-gray-500">日记</div>
          </div>
        </div>
      </div>
    </div>
  );
});
WatchParentDashboard.displayName = 'WatchParentDashboard';

// ============ 手机端家长端布局（原有代码） ============
const PhoneParentDashboard = memo(() => {
  const navigateTo = useAppStore((state) => state.navigateTo);
  const [parentInfo, setParentInfo] = useState<ParentInfo | null>(null);
  const [watchBinding, setWatchBinding] = useState<WatchBinding | null>(null);
  const [emotions, setEmotions] = useState<Emotion[]>([]);
  const [bottles, setBottles] = useState<Bottle[]>([]);
  const [activeTab, setActiveTab] = useState<'report' | 'emotions' | 'bottles' | 'stats' | 'export'>('report');
  const [loading, setLoading] = useState(true);
  const [showParentScene, setShowParentScene] = useState(false);
  const { getChildId, setChildId } = useCurrentChild();

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

  // 将后端数据转换为图表所需格式
  const chartData = useMemo(() => {
    return emotions
      .filter(e => e.emotion_type && EMOTION_TYPE_MAP[e.emotion_type])
      .map(e => ({
        id: e.id.toString(),
        date: new Date(e.created_at).toISOString().split('T')[0],
        emotion: EMOTION_TYPE_MAP[e.emotion_type] as EmotionType,
        intensity: 3, // 默认强度
      }));
  }, [emotions]);

  // 检查绑定状态
  useEffect(() => {
    const savedParent = localStorage.getItem('parentInfo');
    const savedWatch = localStorage.getItem('watchBinding');
    if (savedParent) {
      setParentInfo(JSON.parse(savedParent));
    }
    if (savedWatch) {
      const binding = JSON.parse(savedWatch);
      setWatchBinding(binding);
      // 加载孩子数据
      loadChildDataByWatch(binding.watch_id);
    } else {
      setLoading(false);
      setShowParentScene(true);
    }
  }, []);

  // 通过手表 ID 加载孩子数据
  const loadChildDataByWatch = async (watchId: string) => {
    try {
      // 先通过手表 ID 获取孩子信息
      const childResponse = await fetch(`${API_BASE_URL}/api/parents/watch/${watchId}/child`);
      const childData = await childResponse.json();

      if (childData.code === 0 && childData.data.child) {
        const child = childData.data.child;
        // 更新绑定信息中的 child_id
        const updatedBinding = { ...watchBinding!, child_id: child.id };
        setWatchBinding(updatedBinding);

        // 加载情绪日记
        const emoResponse = await fetch(`${API_BASE_URL}/api/parents/children/${child.id}/emotions`);
        const emoData = await emoResponse.json();
        if (emoData.code === 0) {
          setEmotions(emoData.data.emotions || []);
        }

        // 加载漂流瓶
        const bottleResponse = await fetch(`${API_BASE_URL}/api/parents/children/${child.id}/bottles`);
        const bottleData = await bottleResponse.json();
        if (bottleData.code === 0) {
          setBottles(bottleData.data.bottles || []);
        }
      }
    } catch (err) {
      console.error('加载孩子数据失败:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUnbind = () => {
    localStorage.removeItem('parentInfo');
    localStorage.removeItem('watchBinding');
    setParentInfo(null);
    setWatchBinding(null);
    setEmotions([]);
    setBottles([]);
    setShowParentScene(true);
  };

  // 返回主场景
  const handleBack = () => {
    navigateTo('home');
  };

  // 显示家长手表连接场景
  if (showParentScene || (!watchBinding && !loading)) {
    return <ParentWatchScene onBack={handleBack} />;
  }

  // 加载中
  if (loading) {
    return (
      <div className="relative min-h-screen w-full overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-green-400 via-emerald-400 to-teal-400" />
        <div className="relative z-10 flex items-center justify-center min-h-screen px-4">
          <motion.div
            className="text-center"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
          >
            <motion.div
              className="text-4xl sm:text-6xl mb-2 sm:mb-4"
              animate={{ rotate: [0, 360] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
            >
              ⌚
            </motion.div>
            <p className="text-white font-bold text-base sm:text-xl">加载中...</p>
          </motion.div>
        </div>
      </div>
    );
  }

  // 已绑定状态，显示数据
  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-gradient-to-br from-indigo-100 via-purple-100 to-pink-100">
      {/* 顶部栏 */}
      <div className="absolute top-2 sm:top-4 left-2 sm:left-4 right-2 sm:right-4 z-50 flex items-center justify-between gap-2">
        <motion.button
          onClick={handleBack}
          className="bg-white/80 backdrop-blur-xl px-3 py-1.5 sm:px-5 sm:py-2.5 rounded-full shadow-xl font-bold text-gray-700 border-2 border-white/60 text-xs sm:text-base"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          ← 返回
        </motion.button>
        <div className="bg-white/80 backdrop-blur-xl px-3 py-1.5 sm:px-5 sm:py-2.5 rounded-full shadow-xl font-bold text-gray-700 border-2 border-white/60 flex items-center gap-1 sm:gap-2">
          <span className="text-sm sm:text-base">⌚</span>
          <span className="text-xs sm:text-base">{watchBinding?.parent_name || '家长'}</span>
        </div>
        <motion.button
          onClick={handleUnbind}
          className="bg-red-100/80 backdrop-blur-xl px-2 py-1.5 sm:px-4 sm:py-2 rounded-full shadow-xl font-bold text-red-600 border-2 border-red-300/60 text-xs sm:text-sm"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          解除绑定
        </motion.button>
      </div>

      {/* 内容区域 */}
      <div className="pt-20 sm:pt-24 pb-4 sm:pb-8 px-2 sm:px-4">
        {/* 标签切换 */}
        <div className="flex gap-2 sm:gap-4 mb-4 sm:mb-6 justify-center flex-wrap">
          <motion.button
            onClick={() => setActiveTab('report')}
            className={`px-3 py-2 sm:px-6 sm:py-3 rounded-full font-bold text-xs sm:text-base ${
              activeTab === 'report'
                ? 'bg-gradient-to-r from-green-400 to-emerald-400 text-white shadow-lg'
                : 'bg-white/80 text-gray-600'
            }`}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            📋 周报
          </motion.button>
          <motion.button
            onClick={() => setActiveTab('emotions')}
            className={`px-3 py-2 sm:px-6 sm:py-3 rounded-full font-bold text-xs sm:text-base ${
              activeTab === 'emotions'
                ? 'bg-gradient-to-r from-yellow-400 to-orange-400 text-white shadow-lg'
                : 'bg-white/80 text-gray-600'
            }`}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            📔 日记 ({emotions.length})
          </motion.button>
          <motion.button
            onClick={() => setActiveTab('stats')}
            className={`px-3 py-2 sm:px-6 sm:py-3 rounded-full font-bold text-xs sm:text-base ${
              activeTab === 'stats'
                ? 'bg-gradient-to-r from-purple-400 to-pink-400 text-white shadow-lg'
                : 'bg-white/80 text-gray-600'
            }`}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            📊 统计
          </motion.button>
          <motion.button
            onClick={() => setActiveTab('bottles')}
            className={`px-3 py-2 sm:px-6 sm:py-3 rounded-full font-bold text-xs sm:text-base ${
              activeTab === 'bottles'
                ? 'bg-gradient-to-r from-blue-400 to-cyan-400 text-white shadow-lg'
                : 'bg-white/80 text-gray-600'
            }`}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            🍾 漂流瓶 ({bottles.length})
          </motion.button>
          <motion.button
            onClick={() => setActiveTab('export')}
            className={`px-3 py-2 sm:px-6 sm:py-3 rounded-full font-bold text-xs sm:text-base ${
              activeTab === 'export'
                ? 'bg-gradient-to-r from-teal-400 to-emerald-400 text-white shadow-lg'
                : 'bg-white/80 text-gray-600'
            }`}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            📤 导出
          </motion.button>
        </div>

        {/* 周报和预警 */}
        {activeTab === 'report' && (
          <div className="max-w-2xl mx-auto space-y-4">
            <EmotionAlert data={chartData} childName={watchBinding?.child_nickname} />
            <WeeklyReport data={chartData} childName={watchBinding?.child_nickname} />
          </div>
        )}

        {/* 情绪统计和曲线图 */}
        {activeTab === 'stats' && (
          <div className="max-w-4xl mx-auto space-y-6">
            <EmotionChart data={chartData} title="情绪变化曲线" />
            <EmotionStats data={chartData} title="情绪统计" />
          </div>
        )}

        {/* 导出报告 */}
        {activeTab === 'export' && (
          <div className="max-w-md mx-auto">
            <ReportExport childName={watchBinding?.child_nickname} />
          </div>
        )}

        {/* 情绪日记列表 */}
        {activeTab === 'emotions' && (
          <div className="space-y-3 sm:space-y-4 max-w-2xl mx-auto">
            {emotions.length === 0 ? (
              <div className="text-center py-8 sm:py-12">
                <div className="text-4xl sm:text-6xl mb-2 sm:mb-4">📔</div>
                <p className="text-gray-500 font-bold text-sm sm:text-base">还没有情绪日记哦～</p>
              </div>
            ) : (
              emotions.map((emotion) => {
                const config = EMOTION_CONFIG_MAP[emotion.emotion_type] || { label: emotion.emotion_label, emoji: '📝', color: 'from-gray-400 to-gray-500' };
                return (
                  <motion.div
                    key={emotion.id}
                    className="bg-white/90 backdrop-blur-xl rounded-2xl sm:rounded-3xl p-3 sm:p-6 shadow-xl border-4 border-white/60"
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                  >
                    <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
                      <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gradient-to-br ${config.color} flex items-center justify-center text-xl sm:text-2xl`}>
                        {config.emoji}
                      </div>
                      <div className="flex-1">
                        <div className="text-sm sm:text-base font-black text-gray-700">{config.label}</div>
                        <div className="text-xs text-gray-400">
                          {new Date(emotion.created_at).toLocaleString('zh-CN')}
                        </div>
                      </div>
                    </div>
                    {emotion.content && (
                      <div className="bg-gray-100 rounded-xl p-2 sm:p-3 mb-2 sm:mb-3">
                        <p className="text-gray-700 text-xs sm:text-sm">{emotion.content}</p>
                      </div>
                    )}
                    {emotion.ai_response && (
                      <div className="bg-gradient-to-r from-indigo-100 to-purple-100 rounded-xl p-2 sm:p-3">
                        <div className="flex items-center gap-1 sm:gap-2 mb-1">
                          <span className="text-base sm:text-lg">🌈</span>
                          <span className="text-xs font-bold text-purple-600">小彩虹说</span>
                        </div>
                        <p className="text-purple-700 text-xs sm:text-sm">{emotion.ai_response}</p>
                      </div>
                    )}
                  </motion.div>
                );
              })
            )}
          </div>
        )}

        {/* 漂流瓶列表 */}
        {activeTab === 'bottles' && (
          <div className="space-y-3 sm:space-y-4 max-w-2xl mx-auto">
            {bottles.length === 0 ? (
              <div className="text-center py-8 sm:py-12">
                <div className="text-4xl sm:text-6xl mb-2 sm:mb-4">🍾</div>
                <p className="text-gray-500 font-bold text-sm sm:text-base">还没有漂流瓶哦～</p>
              </div>
            ) : (
              bottles.map((bottle) => (
                <motion.div
                  key={bottle.id}
                  className="bg-white/90 backdrop-blur-xl rounded-2xl sm:rounded-3xl p-3 sm:p-6 shadow-xl border-4 border-white/60"
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                >
                  <div className="flex items-center justify-between mb-2 sm:mb-3">
                    <div className="flex items-center gap-2 sm:gap-3">
                      <div className="text-2xl sm:text-3xl">🍾</div>
                      <div className="flex-1">
                        <div className="text-xs sm:text-sm font-bold text-gray-700">
                          心情：{bottle.mood || '普通'}
                        </div>
                        <div className="text-xs text-gray-400">
                          {new Date(bottle.created_at).toLocaleString('zh-CN')}
                        </div>
                      </div>
                    </div>
                    {bottle.is_read && (
                      <span className="text-xs bg-green-100 text-green-600 px-2 py-1 rounded-full font-bold">
                        已读
                      </span>
                    )}
                  </div>
                  <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl p-3 sm:p-4 border-2 border-blue-200">
                    <p className="text-gray-700 text-xs sm:text-sm leading-relaxed">{bottle.content}</p>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
});
PhoneParentDashboard.displayName = 'PhoneParentDashboard';
