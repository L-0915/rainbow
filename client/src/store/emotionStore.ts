import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  getEmotions,
  saveEmotion,
  deleteAllEmotions,
  type EmotionRecord as ApiEmotionRecord,
} from '@/services/emotionApi';

export type EmotionType =
  | 'happy'      // 开心
  | 'calm'       // 平静
  | 'angry'      // 生气
  | 'scared'     // 害怕
  | 'sad'        // 委屈
  | 'excited';   // 兴奋

export interface EmotionRecord {
  id: string;
  date: string;         // YYYY-MM-DD
  emotion: EmotionType;
  intensity: number;    // 1-5
  note?: string;
}

export interface EmotionState {
  todayEmotion: EmotionType | null;
  todayDate: string | null;  // 记录当前情绪对应的日期
  history: EmotionRecord[];
  lastCleanupDate: string | null;  // 上次清理日期 YYYY-MM
  isLoading: boolean;  // 加载状态

  // Actions
  setTodayEmotion: (emotion: EmotionType, intensity?: number) => void;
  getHistory: () => EmotionRecord[];
  getMonthlyHistory: (year?: number, month?: number) => EmotionRecord[];
  clearHistory: () => void;
  checkAndResetDaily: () => void;  // 检查并重置每日情绪
  checkAndCleanupMonthly: () => void;  // 检查并清理月度数据
  fetchEmotionsFromBackend: (year: number, month: number) => Promise<void>;  // 从后端加载情绪数据
  syncEmotionsToBackend: () => Promise<boolean>;  // 同步到后端
  deleteAllEmotionsFromBackend: () => Promise<boolean>;  // 删除后端数据
  setLoading: (loading: boolean) => void;  // 设置加载状态
}

// 获取今天日期字符串 YYYY-MM-DD
const getTodayDate = (): string => {
  return new Date().toISOString().split('T')[0];
};

// 获取当前年月 YYYY-MM
const getCurrentMonth = (): string => {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
};

// 检查是否是同一天
const isSameDay = (date1: string, date2: string): boolean => {
  return date1 === date2;
};

// 情绪数值映射（用于曲线图）
export const EMOTION_VALUES: Record<EmotionType, number> = {
  happy: 4,
  excited: 5,
  calm: 3,
  scared: 2,
  sad: 1,
  angry: 2,
};

export const useEmotionStore = create<EmotionState>()(
  persist(
    (set, get) => ({
      todayEmotion: null,
      todayDate: null,
      history: [],
      lastCleanupDate: getCurrentMonth(),
      isLoading: false,

      // 设置加载状态
      setLoading: (loading) => set({ isLoading: loading }),

      // 从后端加载情绪数据
      fetchEmotionsFromBackend: async (year, month) => {
        set({ isLoading: true });
        try {
          const records = await getEmotions(year, month);
          // 转换类型并更新本地状态
          const localRecords: EmotionRecord[] = records.map(r => ({
            ...r,
            emotion: r.emotion as EmotionType,
          }));

          // 合并到本地 history
          const state = get();
          const existingDates = new Set(state.history.map(r => r.date));

          // 添加新记录（不重复）
          const newRecords = localRecords.filter(r => !existingDates.has(r.date));
          if (newRecords.length > 0) {
            set({
              history: [...state.history, ...newRecords].sort((a, b) => a.date.localeCompare(b.date)),
            });
            console.log(`📥 从后端加载 ${newRecords.length} 条情绪记录`);
          }
        } catch (error) {
          console.error('加载情绪数据失败:', error);
        } finally {
          set({ isLoading: false });
        }
      },

      // 同步情绪数据到后端
      syncEmotionsToBackend: async () => {
        try {
          const state = get();
          const today = getTodayDate();
          const todayRecord = state.history.find(r => r.date === today);

          if (todayRecord) {
            const apiRecord: ApiEmotionRecord = {
              id: todayRecord.id,
              date: todayRecord.date,
              emotion: todayRecord.emotion,
              intensity: todayRecord.intensity,
              note: todayRecord.note,
            };

            const saved = await saveEmotion(apiRecord);
            if (saved) {
              console.log('✅ 情绪记录已同步到后端');
              return true;
            }
          }
          return false;
        } catch (error) {
          console.error('同步情绪数据失败:', error);
          return false;
        }
      },

      // 删除后端所有数据
      deleteAllEmotionsFromBackend: async () => {
        try {
          const deleted = await deleteAllEmotions();
          if (deleted) {
            console.log('🗑️ 后端情绪记录已清空');
            // 同时清空本地数据
            set({ history: [], todayEmotion: null, todayDate: null });
            return true;
          }
          return false;
        } catch (error) {
          console.error('删除后端数据失败:', error);
          return false;
        }
      },

      // 检查并重置每日情绪 - 在应用启动时调用
      checkAndResetDaily: () => {
        const today = getTodayDate();
        const state = get();

        // 如果今天还没有记录情绪，重置 todayEmotion
        if (!state.todayDate || !isSameDay(state.todayDate, today)) {
          set({ todayEmotion: null, todayDate: today });
        }
      },

      // 检查并清理月度数据
      checkAndCleanupMonthly: () => {
        const currentMonth = getCurrentMonth();
        const state = get();

        if (state.lastCleanupDate !== currentMonth) {
          // 新月份，清理上上个月之前的数据（保留最近 2 个月）
          const twoMonthsAgo = new Date();
          twoMonthsAgo.setMonth(twoMonthsAgo.getMonth() - 2);
          const cutoffDate = twoMonthsAgo.toISOString().split('T')[0];

          const filteredHistory = state.history.filter(record => record.date >= cutoffDate);

          set({
            history: filteredHistory,
            lastCleanupDate: currentMonth,
          });

          console.log('🌈 月度数据清理完成，保留最近 2 个月数据');
        }
      },

      setTodayEmotion: (emotion, intensity = 3) => {
        const today = getTodayDate();
        const state = get();

        // 检查是否已经今天记录过
        const existingTodayIndex = state.history.findIndex(
          record => record.date === today
        );

        let newHistory: EmotionRecord[];

        if (existingTodayIndex !== -1) {
          // 更新今天的记录
          newHistory = [...state.history];
          newHistory[existingTodayIndex] = {
            ...newHistory[existingTodayIndex],
            emotion,
            intensity,
          };
        } else {
          // 新增今天的记录
          const record: EmotionRecord = {
            id: Date.now().toString(),
            date: today,
            emotion,
            intensity,
          };
          newHistory = [...state.history, record];
        }

        set({
          todayEmotion: emotion,
          todayDate: today,
          history: newHistory,
        });

        // 异步同步到后端
        get().syncEmotionsToBackend();
      },

      getHistory: () => {
        const state = get();
        return state.history.sort((a, b) => a.date.localeCompare(b.date));
      },

      // 获取指定月份的数据
      getMonthlyHistory: (year?: number, month?: number) => {
        const state = get();
        const now = new Date();
        const targetYear = year ?? now.getFullYear();
        const targetMonth = month ?? now.getMonth() + 1;

        const monthPrefix = `${targetYear}-${String(targetMonth).padStart(2, '0')}`;

        return state.history
          .filter(record => record.date.startsWith(monthPrefix))
          .sort((a, b) => a.date.localeCompare(b.date));
      },

      clearHistory: () => {
        set({ history: [], todayEmotion: null, todayDate: null });
        // 同时清空后端数据
        get().deleteAllEmotionsFromBackend();
      },
    }),
    {
      name: 'rainbow-emotion-storage',
      // 持久化时排除 isLoading 状态
      partialize: (state) => ({
        todayEmotion: state.todayEmotion,
        todayDate: state.todayDate,
        history: state.history,
        lastCleanupDate: state.lastCleanupDate,
      }),
    }
  )
);

// 情绪配置
export const EMOTION_CONFIG: Record<EmotionType, {
  label: string;
  emoji: string;
  color: string;
  gradient: string;
  description: string;
  value: number;  // 用于曲线图的数值
}> = {
  happy: {
    label: '开心',
    emoji: '😊',
    color: '#FFD43B',
    gradient: 'linear-gradient(135deg, #FFD43B 0%, #FFA94D 100%)',
    description: '今天真是美好的一天！',
    value: 4,
  },
  calm: {
    label: '平静',
    emoji: '😌',
    color: '#74C0FC',
    gradient: 'linear-gradient(135deg, #74C0FC 0%, #4DABF7 100%)',
    description: '内心很平静呢',
    value: 3,
  },
  angry: {
    label: '生气',
    emoji: '😤',
    color: '#FF6B6B',
    gradient: 'linear-gradient(135deg, #FF6B6B 0%, #FF5252 100%)',
    description: '有点小生气',
    value: 2,
  },
  scared: {
    label: '害怕',
    emoji: '😨',
    color: '#A5D8FF',
    gradient: 'linear-gradient(135deg, #A5D8FF 0%, #74C0FC 100%)',
    description: '有点害怕...',
    value: 2,
  },
  sad: {
    label: '委屈',
    emoji: '😢',
    color: '#95A5A6',
    gradient: 'linear-gradient(135deg, #95A5A6 0%, #7F8C8D 100%)',
    description: '心里有点难过',
    value: 1,
  },
  excited: {
    label: '兴奋',
    emoji: '🤩',
    color: '#FF922B',
    gradient: 'linear-gradient(135deg, #FF922B 0%, #FFA94D 100%)',
    description: '好兴奋呀！',
    value: 5,
  },
};
