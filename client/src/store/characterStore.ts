import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface CharacterConfig {
  skinColor: string;
  hairstyle: string;
  eyeStyle: string;
  clothes: string;
  accessory?: string;
  name?: string;
  avatarStyle: string;  // 角色形象选择：'卡通数字人' | '卡通数字人 2'
}

export interface CharacterState {
  config: CharacterConfig;
  stickers: string[];
  setConfig: (config: Partial<CharacterConfig>) => void;
  addSticker: (sticker: string) => void;
  hasInitialized: boolean;
  setHasInitialized: (value: boolean) => void;
}

const DEFAULT_CHARACTER: CharacterConfig = {
  skinColor: '#FFD5B5',
  hairstyle: 'short',
  eyeStyle: 'round',
  clothes: 'shirt',
  accessory: 'none',
  avatarStyle: '卡通数字人',  // 默认使用第一个角色
};

export const useCharacterStore = create<CharacterState>()(
  persist(
    (set) => ({
      config: DEFAULT_CHARACTER,
      stickers: [],
      hasInitialized: false,

      setConfig: (newConfig) =>
        set((state) => ({
          config: { ...state.config, ...newConfig },
        })),

      addSticker: (sticker) =>
        set((state) => ({
          stickers: [...state.stickers, sticker],
        })),

      setHasInitialized: (value) => set({ hasInitialized: value }),
    }),
    {
      name: 'rainbow-character-storage',
    }
  )
);

// 角色形象选项
export const AVATAR_STYLES = [
  { id: '卡通1', label: '角色 1', preview: '/卡通数字人.png', thumbnail: '/卡通数字人.png' },
  { id: '卡通2', label: '角色 2', preview: '/卡通数字人2.png', thumbnail: '/卡通数字人2.png' },
];

// 发型选项
export const HAIRSTYLES = [
  { id: 'short', label: '短发', preview: '🧑' },
  { id: 'long', label: '长发', preview: '👩' },
  { id: 'curly', label: '卷发', preview: '👨' },
  { id: 'ponytail', label: '马尾', preview: '👧' },
  { id: 'bob', label: '波波头', preview: '👦' },
  { id: 'braids', label: '辫子', preview: '👧🏿' },
];

// 肤色选项
export const SKIN_COLORS = [
  { id: '#FFD5B5', label: '白皙', preview: '🏻' },
  { id: '#F5C6A5', label: '自然', preview: '🏼' },
  { id: '#E8B896', label: '健康', preview: '🏽' },
  { id: '#D4A574', label: '小麦', preview: '🏾' },
  { id: '#8D5524', label: '深邃', preview: '🏿' },
];

// 服装选项
export const CLOTHES = [
  { id: 'shirt', label: 'T 恤', preview: '👕' },
  { id: 'dress', label: '连衣裙', preview: '👗' },
  { id: 'hoodie', label: '卫衣', preview: '🧥' },
  { id: 'overalls', label: '背带裤', preview: '👖' },
  { id: 'jacket', label: '外套', preview: '🧢' },
];
