import { useState, useEffect, useCallback, memo } from 'react';

type Theme = 'light' | 'dark' | 'auto';

interface UseThemeResult {
  theme: Theme;
  isDark: boolean;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

/**
 * 主题切换 Hook
 * 支持深色模式和跟随系统
 */
export const useTheme = (): UseThemeResult => {
  const [theme, setThemeState] = useState<Theme>(() => {
    const saved = localStorage.getItem('rainbow_theme') as Theme;
    return saved || 'auto';
  });

  const [isDark, setIsDark] = useState(false);

  // 检测系统主题
  useEffect(() => {
    const checkSystemTheme = () => {
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    };

    const updateDarkMode = () => {
      const shouldBeDark = theme === 'dark' || (theme === 'auto' && checkSystemTheme());
      setIsDark(shouldBeDark);

      // 更新 document 类名
      if (shouldBeDark) {
        document.documentElement.classList.add('dark-mode');
      } else {
        document.documentElement.classList.remove('dark-mode');
      }
    };

    updateDarkMode();

    // 监听系统主题变化
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      if (theme === 'auto') {
        updateDarkMode();
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [theme]);

  const setTheme = useCallback((newTheme: Theme) => {
    setThemeState(newTheme);
    localStorage.setItem('rainbow_theme', newTheme);
  }, []);

  const toggleTheme = useCallback(() => {
    const next = theme === 'light' ? 'dark' : theme === 'dark' ? 'auto' : 'light';
    setTheme(next);
  }, [theme, setTheme]);

  return { theme, isDark, setTheme, toggleTheme };
};

/**
 * 主题切换按钮
 */
export const ThemeToggle = memo(() => {
  const { theme, toggleTheme } = useTheme();

  const icons = {
    light: '☀️',
    dark: '🌙',
    auto: '🔄',
  };

  const labels = {
    light: '浅色',
    dark: '深色',
    auto: '跟随系统',
  };

  return (
    <button
      onClick={toggleTheme}
      className="flex items-center gap-2 px-3 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 transition-colors text-sm"
      title={labels[theme]}
    >
      <span>{icons[theme]}</span>
      <span className="text-gray-600">{labels[theme]}</span>
    </button>
  );
});

ThemeToggle.displayName = 'ThemeToggle';