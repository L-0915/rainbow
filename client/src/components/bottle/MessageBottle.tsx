import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCharacterStore } from '@/store/characterStore';

interface MessageBottleProps {
  childId?: number;
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

// 鼓励话语
const ENCOURAGEMENT_MESSAGES = [
  '你的心里话，大海已经收到啦～ 🌊',
  '真棒！把情绪说出来是很勇敢的事情～ ✨',
  '每一个想法都值得被倾听～ 💕',
  '你做得很好，继续加油哦～ 🌟',
  '谢谢你愿意表达自己～ 🌈',
  '你的声音很重要～ 💖',
  '今天的你也很棒～ 🌸',
  '慢慢来，我陪着你～ 🫂',
  '你的感受，我都有在认真听～ 🦋',
  '写下来的时候，你真的超级棒！ ✨',
];

const getRandomEncouragement = () => {
  return ENCOURAGEMENT_MESSAGES[Math.floor(Math.random() * ENCOURAGEMENT_MESSAGES.length)];
};

// 本地存储 key
const LOCAL_BOTTLES_KEY = 'my-message-bottles';

export const MessageBottle = ({ childId = 1 }: MessageBottleProps) => {
  const { config: characterConfig } = useCharacterStore();
  const [showBottleModal, setShowBottleModal] = useState(false);
  const [bottleContent, setBottleContent] = useState('');
  const [selectedMood, setSelectedMood] = useState('');
  const [myBottles, setMyBottles] = useState<any[]>([]);
  const [showMyBottles, setShowMyBottles] = useState(false);
  const [throwing, setThrowing] = useState(false);
  const [showThrowAnimation, setShowThrowAnimation] = useState(false);
  const [showEncouragement, setShowEncouragement] = useState('');
  const [animationComplete, setAnimationComplete] = useState(false);

  // 加载本地漂流瓶
  const loadLocalBottles = () => {
    try {
      const stored = localStorage.getItem(LOCAL_BOTTLES_KEY);
      if (stored) {
        setMyBottles(JSON.parse(stored));
      }
    } catch (err) {
      console.error('加载本地漂流瓶失败:', err);
    }
  };

  // 保存漂流瓶到本地
  const saveToLocalBottles = (bottle: any) => {
    try {
      const stored = localStorage.getItem(LOCAL_BOTTLES_KEY);
      const bottles = stored ? JSON.parse(stored) : [];
      bottles.unshift(bottle);
      localStorage.setItem(LOCAL_BOTTLES_KEY, JSON.stringify(bottles));
      setMyBottles(bottles);
    } catch (err) {
      console.error('保存本地漂流瓶失败:', err);
    }
  };

  // 加载我的漂流瓶
  const loadBottles = async () => {
    // 先加载本地的
    loadLocalBottles();

    // 尝试从服务器加载
    try {
      const response = await fetch(`${API_BASE_URL}/api/children/${childId}/bottles`);
      const data = await response.json();
      if (data.code === 0 && data.data.bottles) {
        setMyBottles(data.data.bottles);
      }
    } catch (err) {
      console.log('服务器加载失败，使用本地数据');
    }
  };

  // 扔漂流瓶
  const throwBottle = async () => {
    if (!bottleContent.trim()) return;

    setThrowing(true);

    // 创建本地漂流瓶记录
    const localBottle = {
      id: Date.now(),
      content: bottleContent,
      mood: selectedMood || '普通',
      created_at: new Date().toISOString(),
    };

    // 先保存到本地
    saveToLocalBottles(localBottle);

    // 尝试发送到服务器（不等待结果）
    fetch(`${API_BASE_URL}/api/children/${childId}/bottles`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        content: bottleContent,
        mood: selectedMood || '普通',
      }),
    }).catch(err => console.log('漂流瓶发送失败，已保存到本地:', err));

    // 无论服务器响应如何，都显示动画
    setShowBottleModal(false);
    setShowThrowAnimation(true);
    setThrowing(false);
    setAnimationComplete(false);

    // 1 秒动画完成后，显示鼓励话语弹窗
    setTimeout(() => {
      setShowThrowAnimation(false);
      setShowEncouragement(getRandomEncouragement());
      setAnimationComplete(true);
    }, 1000);

    // 重置输入
    setBottleContent('');
    setSelectedMood('');
  };

  // 关闭鼓励话语弹窗
  const handleCloseEncouragement = () => {
    setShowEncouragement('');
    setAnimationComplete(false);
  };

  const moods = [
    { emoji: '😊', label: '开心', value: '开心' },
    { emoji: '😌', label: '平静', value: '平静' },
    { emoji: '🤩', label: '兴奋', value: '兴奋' },
    { emoji: '🥰', label: '幸福', value: '幸福' },
    { emoji: '🌟', label: '期待', value: '期待' },
    { emoji: '😐', label: '不确定', value: '不确定' },
  ];

  return (
    <>
      {/* 漂流瓶入口按钮 */}
      <div className="fixed bottom-32 right-4 z-40 flex flex-col gap-3">
        {/* 我的漂流瓶按钮 */}
        <motion.button
          onClick={() => {
            loadBottles();
            setShowMyBottles(true);
          }}
          className="bg-white/80 backdrop-blur-xl px-4 py-3 rounded-full shadow-xl border-4 border-white/60"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <span className="text-2xl">📋</span>
        </motion.button>

        {/* 扔漂流瓶按钮 */}
        <motion.button
          onClick={() => setShowBottleModal(true)}
          className="bg-gradient-to-r from-blue-400 to-cyan-400 px-6 py-4 rounded-full shadow-xl border-4 border-white/60"
          whileHover={{ scale: 1.05, y: -5 }}
          whileTap={{ scale: 0.95 }}
          animate={{ y: [0, -8, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <span className="text-3xl">🍾</span>
        </motion.button>
      </div>

      {/* 扔漂流瓶动画 - 瓶子渐渐远去 */}
      <AnimatePresence>
        {showThrowAnimation && (
          <motion.div
            className="fixed inset-0 z-[60] flex items-center justify-center pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {/* 海洋背景 */}
            <div className="absolute inset-0 bg-gradient-to-b from-sky-300 via-blue-400 to-blue-600" />

            {/* 远去的瓶子 */}
            <motion.div
              className="absolute text-8xl"
              initial={{ scale: 1, y: 0, opacity: 1, rotate: 0 }}
              animate={{
                scale: [1, 0.8, 0.5, 0.3, 0.1],
                y: [0, -100, -200, -300, -400],
                opacity: [1, 0.8, 0.5, 0.2, 0],
                rotate: [0, 10, -10, 5, -5],
              }}
              transition={{ duration: 1, ease: 'easeOut' }}
            >
              🍾
            </motion.div>

            {/* 海浪效果 */}
            {[...Array(5)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute bottom-0 left-0 right-0 h-32 bg-white/20"
                animate={{
                  y: [0, -10, 0],
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  delay: i * 0.2,
                }}
              />
            ))}

            {/* 星星粒子 */}
            {[...Array(10)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute text-2xl"
                style={{
                  left: `${20 + Math.random() * 60}%`,
                  top: `${20 + Math.random() * 60}%`,
                }}
                initial={{ scale: 0, opacity: 0 }}
                animate={{
                  scale: [0, 1, 0],
                  opacity: [0, 1, 0],
                  y: [0, -50],
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  delay: i * 0.15,
                }}
              >
                {['✨', '⭐', '🌟', '💫'][i % 4]}
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* 鼓励话语弹窗 - 可关闭 */}
      <AnimatePresence>
        {showEncouragement && (
          <motion.div
            className="fixed inset-0 z-[70] flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {/* 背景遮罩 */}
            <div className="absolute inset-0 bg-blue-900/40 backdrop-blur-sm" onClick={handleCloseEncouragement} />

            <motion.div
              className="relative bg-white/95 backdrop-blur-xl rounded-3xl px-8 py-6 shadow-2xl border-4 border-blue-400/60 max-w-md w-full"
              initial={{ scale: 0.5, y: 50 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.5, y: 50 }}
              transition={{ type: 'spring', bounce: 0.5 }}
            >
              {/* 关闭按钮 */}
              <button
                onClick={handleCloseEncouragement}
                className="absolute top-4 right-4 w-10 h-10 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center text-xl shadow-lg transition-all z-10"
              >
                ✕
              </button>

              {/* 装饰 emoji */}
              <div className="flex justify-center gap-2 mb-4">
                {['💕', '✨', '🌈', '💫', '🦋'].map((emoji, i) => (
                  <motion.div
                    key={i}
                    className="text-2xl"
                    animate={{ y: [0, -10, 0], rotate: [0, 10, -10, 0] }}
                    transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.1 }}
                  >
                    {emoji}
                  </motion.div>
                ))}
              </div>

              {/* 标题 */}
              <div className="text-center mb-4">
                <motion.div
                  className="text-6xl mb-3"
                  animate={{ rotate: [0, 10, -10, 0], scale: [1, 1.1, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  🍾
                </motion.div>
                <h3 className="text-xl font-black text-gray-700">漂流瓶已扔出！</h3>
              </div>

              {/* 鼓励话语 */}
              <motion.div
                className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-2xl p-5 mb-6 border-2 border-blue-200"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 }}
              >
                <p className="text-gray-700 text-lg font-bold text-center leading-relaxed">
                  {showEncouragement}
                </p>
              </motion.div>

              {/* 关闭按钮 */}
              <motion.button
                onClick={handleCloseEncouragement}
                className="w-full bg-gradient-to-r from-blue-400 to-cyan-400 text-white font-black text-lg py-4 rounded-full shadow-xl border-4 border-white/60"
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
              >
                知道啦～ 💕
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 扔漂流瓶弹窗 */}
      <AnimatePresence>
        {showBottleModal && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowBottleModal(false)}
          >
            <div className="absolute inset-0 bg-blue-900/40 backdrop-blur-sm" />

            <motion.div
              className="relative bg-gradient-to-br from-blue-100 via-cyan-100 to-teal-100 rounded-3xl p-6 max-w-sm w-full shadow-2xl border-4 border-white/60"
              initial={{ scale: 0.8, y: 100 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.8, y: 100 }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* 标题 */}
              <div className="text-center mb-6">
                <motion.div
                  className="text-6xl mb-3"
                  animate={{ rotate: [0, 10, -10, 0] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  🍾
                </motion.div>
                <h2 className="text-xl font-black text-gray-700">扔个漂流瓶</h2>
                <p className="text-gray-500 text-sm mt-1">把心里话告诉大海吧～</p>
              </div>

              {/* 心情选择 */}
              <div className="mb-4">
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  现在的心情
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {moods.map((mood) => (
                    <motion.button
                      key={mood.value}
                      onClick={() => setSelectedMood(mood.value)}
                      className={`py-2 rounded-full text-sm font-bold border-2 ${
                        selectedMood === mood.value
                          ? 'bg-gradient-to-r from-blue-400 to-cyan-400 text-white border-blue-400'
                          : 'bg-white/60 text-gray-600 border-gray-300'
                      }`}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      {mood.emoji} {mood.label}
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* 输入框 */}
              <div className="mb-6">
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  想说什么呢？
                </label>
                <textarea
                  value={bottleContent}
                  onChange={(e) => setBottleContent(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl border-2 border-blue-200 focus:border-blue-400 focus:outline-none resize-none"
                  rows={4}
                  placeholder="把你想说的写下来..."
                />
              </div>

              {/* 按钮 */}
              <div className="flex gap-3">
                <motion.button
                  onClick={throwBottle}
                  disabled={!bottleContent.trim() || throwing}
                  className="flex-1 bg-gradient-to-r from-blue-400 to-cyan-400 text-white font-black py-3 rounded-full disabled:opacity-50"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {throwing ? '扔出中...' : '扔出漂流瓶'}
                </motion.button>
                <motion.button
                  onClick={() => setShowBottleModal(false)}
                  disabled={animationComplete}
                  className="flex-1 bg-gray-200 text-gray-700 font-black py-3 rounded-full disabled:opacity-50"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  取消
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 我的漂流瓶列表 */}
      <AnimatePresence>
        {showMyBottles && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowMyBottles(false)}
          >
            <div className="absolute inset-0 bg-blue-900/40 backdrop-blur-sm" />

            <motion.div
              className="relative bg-gradient-to-br from-blue-100 via-cyan-100 to-teal-100 rounded-3xl p-6 max-w-md w-full max-h-[70vh] overflow-y-auto shadow-2xl border-4 border-white/60"
              initial={{ scale: 0.8, y: 100 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.8, y: 100 }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* 标题 */}
              <div className="text-center mb-6 sticky top-0 bg-gradient-to-br from-blue-100 via-cyan-100 to-teal-100 py-4 -mx-6 px-6 border-b-2 border-white/60 z-10">
                <div className="text-4xl mb-2">📋</div>
                <h2 className="text-xl font-black text-gray-700">我的漂流瓶</h2>
                <p className="text-gray-500 text-sm">{myBottles.length} 个漂流瓶</p>
              </div>

              {/* 列表 */}
              <div className="space-y-3">
                {myBottles.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="text-6xl mb-4">🍾</div>
                    <p className="text-gray-500 font-bold">还没有漂流瓶哦～</p>
                    <motion.button
                      onClick={() => {
                        setShowMyBottles(false);
                        setShowBottleModal(true);
                      }}
                      className="mt-4 bg-gradient-to-r from-blue-400 to-cyan-400 text-white font-bold py-2 px-6 rounded-full"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      扔出第一个漂流瓶
                    </motion.button>
                  </div>
                ) : (
                  myBottles.map((bottle, index) => (
                    <motion.div
                      key={bottle.id}
                      className="bg-white/80 backdrop-blur-xl rounded-2xl p-4 border-2 border-blue-200"
                      initial={{ scale: 0.9, opacity: 0, x: -20 }}
                      animate={{ scale: 1, opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-2xl">🍾</span>
                        <div className="flex-1">
                          <div className="font-bold text-gray-700 flex items-center gap-2">
                            <span className="text-lg">
                              {bottle.mood ? moods.find(m => m.value === bottle.mood)?.emoji || '😐' : '😐'}
                            </span>
                            <span>{bottle.mood || '普通'}</span>
                          </div>
                          <div className="text-xs text-gray-400 mt-1">
                            📅 {bottle.created_at ? new Date(bottle.created_at).toLocaleString('zh-CN') : '刚刚'}
                          </div>
                        </div>
                      </div>
                      <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl p-3 text-sm text-gray-700 leading-relaxed">
                        {bottle.content}
                      </div>
                    </motion.div>
                  ))
                )}
              </div>

              {/* 关闭按钮 */}
              <motion.button
                onClick={() => setShowMyBottles(false)}
                className="w-full mt-6 bg-gray-200 text-gray-700 font-black py-3 rounded-full"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                关闭
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
