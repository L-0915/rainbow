import { useAppStore, useAuthStore } from '@/store/appStore';
import { LoginScene } from '@/scenes/LoginScene';
import { HomeScene } from '@/scenes/HomeScene';
import { MapScene } from '@/scenes/MapScene';
import { GrassScene } from '@/scenes/GrassScene';
import { PlaygroundScene } from '@/scenes/PlaygroundScene';
import { ParentDashboard } from '@/scenes/ParentDashboard';
import { EmotionDiaryScene } from '@/scenes/EmotionDiaryScene';
import { SettingsScene } from '@/scenes/SettingsScene';
import { RollerCoasterGame } from '@/games/RollerCoasterGame';
import { FallCatchGame } from '@/games/FallCatchGame';
import { ShadowHouseGame } from '@/games/ShadowHouseGame';
import { MerryGoRoundGame } from '@/games/MerryGoRoundGame';
import { PaperPlaneGame } from '@/games/PaperPlaneGame';
import { BumperCarsGame } from '@/games/BumperCarsGame';
import { WatchSceneIndicator } from '@/components/WatchSceneIndicator';
import { OfflineIndicator } from '@/hooks/useOffline';
import { useIsWatch } from '@/hooks/useIsWatch';
import { useSwipeNavigation } from '@/hooks/useSwipeNavigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useEffect } from 'react';
import { isAuthenticated, getCurrentUser, logout } from '@/services/auth';

function App() {
  const currentScene = useAppStore((state) => state.currentScene);
  const currentGame = useAppStore((state) => state.currentGame);
  const isTransitioning = useAppStore((state) => state.isTransitioning);
  const login = useAppStore((state) => state.login);
  const navigateTo = useAppStore((state) => state.navigateTo);
  const setUserInfo = useAuthStore((state) => state.setUserInfo);

  // 手表端检测和滑动导航
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
          // Token 无效，清除并跳转到登录页
          logout();
        }
      }
    };
    checkAuth();
  }, []);

  const renderScene = () => {
    // 如果正在游戏中，优先渲染游戏
    if (currentGame) {
      switch (currentGame) {
        case 'roller-coaster':
          return <RollerCoasterGame />;
        case 'fall-catch':
          return <FallCatchGame />;
        case 'shadow-house':
          return <ShadowHouseGame />;
        case 'merry-go-round':
          return <MerryGoRoundGame />;
        case 'paper-plane':
          return <PaperPlaneGame />;
        case 'bumper-cars':
          return <BumperCarsGame />;
        default:
          return <PlaygroundScene />;
      }
    }

    // 否则渲染场景
    switch (currentScene) {
      case 'login':
        return <LoginScene />;
      case 'home':
        return <HomeScene />;
      case 'map':
        return <MapScene />;
      case 'grass':
        return <GrassScene />;
      case 'playground':
        return <PlaygroundScene />;
      case 'parent-dashboard':
        return <ParentDashboard />;
      case 'emotion-diary':
        return <EmotionDiaryScene />;
      case 'settings':
        return <SettingsScene onBack={() => navigateTo('home')} />;
      default:
        return <LoginScene />;
    }
  };

  return (
    <div
      className="relative w-full h-full"
      {...(isWatch ? bind() : {})}
    >
      {/* 离线状态指示器 */}
      <OfflineIndicator />

      {/* 手表端场景指示器 */}
      {isWatch && currentScene !== 'login' && !currentGame && (
        <WatchSceneIndicator currentScene={currentScene} />
      )}

      <AnimatePresence mode="wait">
        <motion.div
          key={currentScene}
          className="w-full h-full"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          {renderScene()}
        </motion.div>
      </AnimatePresence>

      {/* 全局过渡遮罩 */}
      {isTransitioning && (
        <motion.div
          className="fixed inset-0 z-50 bg-black/20 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        />
      )}
    </div>
  );
}

export default App;
