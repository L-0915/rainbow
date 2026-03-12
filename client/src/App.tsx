import { useAppStore } from '@/store/appStore';
import { LoginScene } from '@/scenes/LoginScene';
import { HomeScene } from '@/scenes/HomeScene';
import { MapScene } from '@/scenes/MapScene';
import { GrassScene } from '@/scenes/GrassScene';
import { PlaygroundScene } from '@/scenes/PlaygroundScene';
import { ParentDashboard } from '@/scenes/ParentDashboard';
import { EmotionDiaryScene } from '@/scenes/EmotionDiaryScene';
import { RollerCoasterGame } from '@/games/RollerCoasterGame';
import { FallCatchGame } from '@/games/FallCatchGame';
import { ShadowHouseGame } from '@/games/ShadowHouseGame';
import { MerryGoRoundGame } from '@/games/MerryGoRoundGame';
import { PaperPlaneGame } from '@/games/PaperPlaneGame';
import { BumperCarsGame } from '@/games/BumperCarsGame';
import { motion, AnimatePresence } from 'framer-motion';

function App() {
  const currentScene = useAppStore((state) => state.currentScene);
  const currentGame = useAppStore((state) => state.currentGame);
  const isTransitioning = useAppStore((state) => state.isTransitioning);

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
      default:
        return <LoginScene />;
    }
  };

  return (
    <div className="relative w-full h-full">
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
