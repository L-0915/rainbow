import { lazy, Suspense, useEffect } from 'react';
import { useAppStore, useAuthStore } from '@/store/appStore';
import { useIsWatch } from '@/hooks/useIsWatch';
import { useSwipeNavigation } from '@/hooks/useSwipeNavigation';
import { isAuthenticated, getCurrentUser, logout } from '@/services/auth';
import { LoadingScreen } from '@/components/common/LoadingScreen';

// 懒加载所有场景 - 大幅减少首屏加载时间
const LoginScene = lazy(() => import('@/scenes/LoginScene').then(m => ({ default: m.LoginScene })));
const HomeScene = lazy(() => import('@/scenes/HomeScene').then(m => ({ default: m.HomeScene })));
const MapScene = lazy(() => import('@/scenes/MapScene').then(m => ({ default: m.MapScene })));
const GrassScene = lazy(() => import('@/scenes/GrassScene').then(m => ({ default: m.GrassScene })));
const PlaygroundScene = lazy(() => import('@/scenes/PlaygroundScene').then(m => ({ default: m.PlaygroundScene })));
const ParentDashboard = lazy(() => import('@/scenes/ParentDashboard').then(m => ({ default: m.ParentDashboard })));
const EmotionDiaryScene = lazy(() => import('@/scenes/EmotionDiaryScene').then(m => ({ default: m.EmotionDiaryScene })));
const SettingsScene = lazy(() => import('@/scenes/SettingsScene').then(m => ({ default: m.SettingsScene })));

// 懒加载所有游戏 - 用户点击才加载
const RollerCoasterGame = lazy(() => import('@/games/RollerCoasterGame').then(m => ({ default: m.RollerCoasterGame })));
const FallCatchGame = lazy(() => import('@/games/FallCatchGame').then(m => ({ default: m.FallCatchGame })));
const ShadowHouseGame = lazy(() => import('@/games/ShadowHouseGame').then(m => ({ default: m.ShadowHouseGame })));
const MerryGoRoundGame = lazy(() => import('@/games/MerryGoRoundGame').then(m => ({ default: m.MerryGoRoundGame })));
const PaperPlaneGame = lazy(() => import('@/games/PaperPlaneGame').then(m => ({ default: m.PaperPlaneGame })));
const BumperCarsGame = lazy(() => import('@/games/BumperCarsGame').then(m => ({ default: m.BumperCarsGame })));

// 手表端组件 - 小体积，直接导入
import { WatchSceneIndicator } from '@/components/WatchSceneIndicator';
import { OfflineIndicator } from '@/hooks/useOffline';

function App() {
  const currentScene = useAppStore((state) => state.currentScene);
  const currentGame = useAppStore((state) => state.currentGame);
  const login = useAppStore((state) => state.login);
  const navigateTo = useAppStore((state) => state.navigateTo);
  const setUserInfo = useAuthStore((state) => state.setUserInfo);

  const isWatch = useIsWatch();
  const { bind } = useSwipeNavigation();

  // 检查登录状态
  useEffect(() => {
    const checkAuth = async () => {
      if (isAuthenticated()) {
        const userInfo = await getCurrentUser();
        if (userInfo) {
          setUserInfo(userInfo.parent, userInfo.child);
          login();
        } else {
          logout();
        }
      }
    };
    checkAuth();
  }, []);

  // 游戏渲染
  const renderGame = () => {
    if (!currentGame) return null;

    const games: Record<string, React.LazyExoticComponent<React.ComponentType>> = {
      'roller-coaster': RollerCoasterGame,
      'fall-catch': FallCatchGame,
      'shadow-house': ShadowHouseGame,
      'merry-go-round': MerryGoRoundGame,
      'paper-plane': PaperPlaneGame,
      'bumper-cars': BumperCarsGame,
    };

    const GameComponent = games[currentGame] || null;
    if (!GameComponent) return null;

    return (
      <Suspense fallback={<LoadingScreen message="加载游戏中..." />}>
        <GameComponent />
      </Suspense>
    );
  };

  // 场景渲染
  const renderScene = () => {
    if (currentGame) {
      return renderGame();
    }

    const scenes: Record<string, React.LazyExoticComponent<React.ComponentType<{ onBack?: () => void }>>> = {
      login: LoginScene,
      home: HomeScene,
      map: MapScene,
      grass: GrassScene,
      playground: PlaygroundScene,
      'parent-dashboard': ParentDashboard,
      'emotion-diary': EmotionDiaryScene,
      settings: SettingsScene,
    };

    const SceneComponent = scenes[currentScene] || LoginScene;

    return (
      <Suspense fallback={<LoadingScreen message="加载中..." />}>
        <SceneComponent onBack={() => navigateTo('home')} />
      </Suspense>
    );
  };

  return (
    <div
      className="relative w-full h-full"
      {...(isWatch ? bind() : {})}
    >
      <OfflineIndicator />

      {isWatch && currentScene !== 'login' && !currentGame && (
        <WatchSceneIndicator currentScene={currentScene} />
      )}

      {/* 简单的淡入淡出，不需要 AnimatePresence */}
      <div
        key={currentGame || currentScene}
        className="w-full h-full animate-fade-in"
      >
        {renderScene()}
      </div>
    </div>
  );
}

export default App;