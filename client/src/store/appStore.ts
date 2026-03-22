import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type SceneType = 'login' | 'role-select' | 'map' | 'home' | 'grass' | 'playground' | 'parent-dashboard' | 'emotion-diary' | 'settings';

export type PlaygroundGame =
  | 'roller-coaster'   // 心跳过山车
  | 'fall-catch'       // 坠落与接住
  | 'shadow-house'     // 影子小屋
  | 'merry-go-round'   // 慢慢转木马
  | 'paper-plane'      // 纸飞机投掷场
  | 'bumper-cars';     // 碰碰车广场

export interface Achievement {
  id: string;
  title: string;
  description: string;
  emoji: string;
  gradient: string;
  unlocked: boolean;
  sentToParent: boolean;
}

export interface UserInfo {
  id: number;
  nickname: string;
  phone?: string;
}

export interface ChildInfo {
  id: number;
  nickname: string;
  avatar: string;
}

export interface AuthState {
  parent: UserInfo | null;
  child: ChildInfo | null;
  setUserInfo: (parent: UserInfo, child: ChildInfo) => void;
  clearUserInfo: () => void;
}

export interface AchievementState {
  achievements: Record<string, Achievement>;
  unlockAchievement: (id: string) => void;
  sendToParent: (id: string) => void;
  getUnlockedCount: () => number;
}

export interface AppState {
  currentScene: SceneType;
  isLoggedIn: boolean;
  userType: 'child' | 'parent' | null;
  currentGame: PlaygroundGame | null;
  isTransitioning: boolean;
  hasEnteredPlayground: boolean;

  login: () => void;
  logout: () => void;
  setUserType: (type: 'child' | 'parent') => void;
  navigateTo: (scene: SceneType) => void;
  startGame: (game: PlaygroundGame) => void;
  endGame: () => void;
  setTransitioning: (value: boolean) => void;
  setHasEnteredPlayground: (value: boolean) => void;
}

const defaultAchievements: Record<string, Achievement> = {
  'emotion-master': {
    id: 'emotion-master',
    title: '情绪小主人',
    description: '记录今天的心情',
    emoji: '💭',
    gradient: 'linear-gradient(135deg, #FFB6C1 0%, #FFA0A0 100%)',
    unlocked: false,
    sentToParent: false,
  },
  'grass-explorer': {
    id: 'grass-explorer',
    title: '草地探险家',
    description: '在草地上放松玩耍',
    emoji: '🌿',
    gradient: 'linear-gradient(135deg, #A8E6CF 0%, #88D8B7 100%)',
    unlocked: false,
    sentToParent: false,
  },
  'cloud-collector': {
    id: 'cloud-collector',
    title: '云朵收藏家',
    description: '收集 6 朵温暖云朵的祝福',
    emoji: '☁️',
    gradient: 'linear-gradient(135deg, #C7CEEA 0%, #B5C0E0 100%)',
    unlocked: false,
    sentToParent: false,
  },
  'playground-hero': {
    id: 'playground-hero',
    title: '游乐场小英雄',
    description: '完成一场游乐场游戏',
    emoji: '🎡',
    gradient: 'linear-gradient(135deg, #FFA94D 0%, #FFB961 100%)',
    unlocked: false,
    sentToParent: false,
  },
  'chat-star': {
    id: 'chat-star',
    title: '聊天小明星',
    description: '和小彩虹说悄悄话',
    emoji: '🌈',
    gradient: 'linear-gradient(135deg, #DA77F2 0%, #E599F7 100%)',
    unlocked: false,
    sentToParent: false,
  },
  'brave-warrior': {
    id: 'brave-warrior',
    title: '勇敢小战士',
    description: '面对害怕或生气的情绪',
    emoji: '💪',
    gradient: 'linear-gradient(135deg, #FF6B6B 0%, #FF8E8E 100%)',
    unlocked: false,
    sentToParent: false,
  },
};

// 用户认证 store
export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      parent: null,
      child: null,

      setUserInfo: (parent, child) => set({ parent, child }),

      clearUserInfo: () => set({ parent: null, child: null }),
    }),
    {
      name: 'rainbow-auth-storage',
    }
  )
);

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      currentScene: 'login',
      isLoggedIn: false,
      userType: null,
      currentGame: null,
      isTransitioning: false,
      hasEnteredPlayground: false,

      login: () => {
        // 登录后跳转到身份选择页面
        set({ isLoggedIn: true, currentScene: 'role-select' });
      },

      logout: () => {
        set({
          isLoggedIn: false,
          userType: null,
          currentScene: 'login',
          currentGame: null,
        });
        // 清除 auth store
        useAuthStore.getState().clearUserInfo();
      },

      setUserType: (type) => {
        // 根据身份跳转到对应主界面
        const targetScene = type === 'child' ? 'home' : 'parent-dashboard';
        set({ userType: type, currentScene: targetScene });
      },

      navigateTo: (scene) => set({ currentScene: scene }),

      startGame: (game) => set({ currentGame: game }),

      endGame: () => set({ currentGame: null }),

      setTransitioning: (value) => set({ isTransitioning: value }),

      setHasEnteredPlayground: (value) => set({ hasEnteredPlayground: value }),
    }),
    {
      name: 'rainbow-app-storage',
      partialize: (state) => ({
        isLoggedIn: state.isLoggedIn,
        userType: state.userType,
        hasEnteredPlayground: state.hasEnteredPlayground,
      }),
    }
  )
);

// 成就状态 store - 单独持久化
export const useAchievementStore = create<AchievementState>()(
  persist(
    (set, get) => ({
      achievements: defaultAchievements,

      unlockAchievement: (id) =>
        set((state) => {
          const achievement = state.achievements[id];
          if (achievement && !achievement.unlocked) {
            return {
              achievements: {
                ...state.achievements,
                [id]: { ...achievement, unlocked: true },
              },
            };
          }
          return state;
        }),

      sendToParent: (id) =>
        set((state) => {
          const achievement = state.achievements[id];
          if (achievement && achievement.unlocked) {
            return {
              achievements: {
                ...state.achievements,
                [id]: { ...achievement, sentToParent: true },
              },
            };
          }
          return state;
        }),

      getUnlockedCount: () => {
        const state = get();
        return Object.values(state.achievements).filter((a) => a.unlocked).length;
      },
    }),
    {
      name: 'rainbow-achievements',
    }
  )
);
