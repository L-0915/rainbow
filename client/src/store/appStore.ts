import { create } from 'zustand';

export type SceneType = 'login' | 'map' | 'home' | 'grass' | 'playground' | 'parent-dashboard';

export type PlaygroundGame =
  | 'roller-coaster'   // 心跳过山车
  | 'fall-catch'       // 坠落与接住
  | 'shadow-house'     // 影子小屋
  | 'merry-go-round'   // 慢慢转木马
  | 'paper-plane'      // 纸飞机投掷场
  | 'bumper-cars';     // 碰碰车广场

export interface AppState {
  currentScene: SceneType;
  isLoggedIn: boolean;
  currentGame: PlaygroundGame | null;
  isTransitioning: boolean;
  hasEnteredPlayground: boolean;

  login: () => void;
  logout: () => void;
  navigateTo: (scene: SceneType) => void;
  startGame: (game: PlaygroundGame) => void;
  endGame: () => void;
  setTransitioning: (value: boolean) => void;
  setHasEnteredPlayground: (value: boolean) => void;
}

export const useAppStore = create<AppState>((set) => ({
  currentScene: 'login',
  isLoggedIn: false,
  currentGame: null,
  isTransitioning: false,
  hasEnteredPlayground: false,

  login: () => set({ isLoggedIn: true, currentScene: 'home' }),

  logout: () => set({
    isLoggedIn: false,
    currentScene: 'login',
    currentGame: null,
  }),

  navigateTo: (scene) => set({ currentScene: scene }),

  startGame: (game) => set({ currentGame: game }),

  endGame: () => set({ currentGame: null }),

  setTransitioning: (value) => set({ isTransitioning: value }),

  setHasEnteredPlayground: (value) => set({ hasEnteredPlayground: value }),
}));
