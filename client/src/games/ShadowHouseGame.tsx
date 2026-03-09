import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '@/store/appStore';
import { useCharacterStore } from '@/store/characterStore';

// 情绪影子数据 - 每个影子都有多条温暖鼓励的话语（随机显示）
const SHADOWS = [
  {
    id: 'happy',
    name: '开心',
    emoji: '😊',
    color: 'from-yellow-400 to-orange-400',
    shadowColor: '#FACC15',
    lightColor: '#FEF9C3',
    messages: [
      '谢谢你愿意来看我～ 你的心里装着我，这份看见本身就很温暖 💕',
      '我在这里，陪着你～ 心里的光在告诉你，有些东西对你很重要 ✨',
      '谢谢你注意到我～ 我也是你的一部分，想被你好好对待 🌟',
      '你愿意停下来看看我，这已经很好了～ 💛',
      '我在这里，和你一起感受这份美好～ 🧡',
    ],
    unlockMessage: '开心的影子说："我一直在这里，谢谢你来看我。"',
  },
  {
    id: 'sad',
    name: '难过',
    emoji: '🌧️',
    color: 'from-blue-300 to-blue-400',
    shadowColor: '#60A5FA',
    lightColor: '#DBEAFE',
    messages: [
      '谢谢你陪着我～ 我在这里，静静地陪着你，一起感受这份心情 🤗',
      '想哭的时候就哭吧～ 我陪着你，一直都在 💙',
      '你心里的难受，我懂～ 我在这里，不走 💕',
      '谢谢你让我待在心里～ 我会一直陪着你 🌧️',
      '慢慢来，没关系～ 我陪着你一起感受 🌊',
    ],
    unlockMessage: '难过的影子说："我一直在这里，谢谢你来看我。"',
  },
  {
    id: 'envy',
    name: '羡慕',
    emoji: '🌿',
    color: 'from-green-400 to-emerald-400',
    shadowColor: '#34D399',
    lightColor: '#D1FAE5',
    messages: [
      '谢谢你看见我～ 你心里有很多很多空间，装得下所有心情 🌟',
      '我也是你的一部分～ 想告诉你，你也有属于自己的闪光点 💚',
      '谢谢你让我待在这里～ 我会一直陪着你 🍀',
      '你看到的别人有的，你心里也都有～ 慢慢来 🌱',
      '我在这里，陪着你～ 一起发现属于你的美好 🌈',
    ],
    unlockMessage: '羡慕的影子说："我一直在这里，谢谢你来看我。"',
  },
  {
    id: 'calm',
    name: '平静',
    emoji: '🌸',
    color: 'from-purple-300 to-purple-400',
    shadowColor: '#A78BFA',
    lightColor: '#EDE9FE',
    messages: [
      '谢谢你注意到我～ 我在这里陪着你，一步一步来就好 ✨',
      '没关系，我陪着你～ 慢慢来，不着急 💜',
      '你不需要马上做什么～ 就这样待着，也很好 🌙',
      '我在这里，和你一起～ 不用一个人面对 🫂',
      '谢谢你看见我～ 我会一直在这里陪着你 🌟',
    ],
    unlockMessage: '平静的影子说："我一直在这里，谢谢你来看我。"',
  },
  {
    id: 'joy',
    name: '快乐',
    emoji: '🎉',
    color: 'from-pink-400 to-rose-400',
    shadowColor: '#FB7185',
    lightColor: '#FFE4E6',
    messages: [
      '谢谢你来找我们～ 你看，我在这里，和你在一起 💕',
      '你不是一个人～ 我在这里，一直都在 🌙',
      '谢谢你来看我～ 我会一直陪着你，不离开 💜',
      '你心里有我，我心里有你～ 我们在一起 🫂',
      '慢慢来，我陪着你～ 一起度过这段时光 ✨',
    ],
    unlockMessage: '快乐的影子说："我一直在这里，谢谢你来看我。"',
  },
  {
    id: 'super-happy',
    name: '超开心',
    emoji: '🌟',
    color: 'from-amber-400 to-yellow-300',
    shadowColor: '#FBBF24',
    lightColor: '#FEF3C7',
    messages: [
      '谢谢你愿意靠近我～ 每一个你，都值得被好好对待 👏',
      '我在这里，陪着你～ 不管发生什么，我都在 🧡',
      '谢谢你让我待在心里～ 我会一直陪着你 💛',
      '你不需要做什么～ 就这样，已经很好了 🌼',
      '我懂你心里的感受～ 我在这里，不走 🌻',
    ],
    unlockMessage: '超开心的影子说："我一直在这里，谢谢你来看我。"',
  },
];

interface Room {
  id: number;
  x: number;
  y: number;
  shadowId: string | null;
  isLit: boolean;
}

export const ShadowHouseGame = () => {
  const navigateTo = useAppStore((state) => state.navigateTo);
  const endGame = useAppStore((state) => state.endGame);
  const { config: characterConfig } = useCharacterStore();

  // 获取当前角色图片路径 - 根据 avatarStyle id 映射到实际文件名
  const currentAvatarUrl = characterConfig?.avatarStyle === '卡通2'
    ? '/卡通数字人2.png'
    : '/卡通数字人.png';

  // 游戏状态
  const [entered, setEntered] = useState(false);
  const [showEnding, setShowEnding] = useState(false);
  const [selectedShadow, setSelectedShadow] = useState<typeof SHADOWS[0] & { currentMessage: string } | null>(null);
  const [litCount, setLitCount] = useState(0);

  // 房间布局 - 小屋剖面，2 列 3 行（居中布局）
  const [rooms, setRooms] = useState<Room[]>([
    { id: 0, x: 25, y: 100, shadowId: 'happy', isLit: false },
    { id: 1, x: 175, y: 100, shadowId: 'sad', isLit: false },
    { id: 2, x: 25, y: 240, shadowId: 'envy', isLit: false },
    { id: 3, x: 175, y: 240, shadowId: 'calm', isLit: false },
    { id: 4, x: 25, y: 380, shadowId: 'joy', isLit: false },
    { id: 5, x: 175, y: 380, shadowId: 'super-happy', isLit: false },
  ]);

  // 小人位置（初始位置在门口 - 居中）
  const [personX, setPersonX] = useState(160);
  const [personY, setPersonY] = useState(460);
  const [isMoving, setIsMoving] = useState(false);

  // 点击灯点亮房间
  const handleLampClick = useCallback((roomId: number) => {
    if (isMoving) return;

    const room = rooms.find(r => r.id === roomId);
    if (!room || room.isLit) return;

    // 移动到房间门口（房间中心位置）
    setIsMoving(true);
    setPersonX(room.x + 60);
    setPersonY(room.y + 55);

    setTimeout(() => {
      // 点亮房间
      setRooms(prev => prev.map(r =>
        r.id === roomId ? { ...r, isLit: true } : r
      ));
      setLitCount(prev => prev + 1);

      // 显示影子对话 - 随机选择一条消息
      const shadow = SHADOWS.find(s => s.id === room.shadowId);
      if (shadow) {
        const randomMessage = shadow.messages[Math.floor(Math.random() * shadow.messages.length)];
        setSelectedShadow({ ...shadow, currentMessage: randomMessage });
      }

      setIsMoving(false);
    }, 500);
  }, [rooms, isMoving]);

  // 关闭对话
  const handleCloseDialog = useCallback(() => {
    setSelectedShadow(null);

    // 检查是否全部点亮
    if (litCount >= SHADOWS.length) {
      setShowEnding(true);
    }
  }, [litCount]);

  // 返回小屋入口
  const handleBackToHouse = useCallback(() => {
    setEntered(false);
    setPersonX(160);
    setPersonY(460);
  }, []);

  // 完全返回
  const handleBack = useCallback(() => {
    endGame();
    navigateTo('playground');
  }, [endGame, navigateTo]);

  // 重新开始
  const handleRestart = useCallback(() => {
    setRooms(prev => prev.map(r => ({ ...r, isLit: false })));
    setLitCount(0);
    setSelectedShadow(null);
    setShowEnding(false);
    setPersonX(160);
    setPersonY(460);
  }, []);

  // 开始界面
  if (!entered) {
    return (
      <div className="relative min-h-screen w-full overflow-hidden">
        {/* 温暖黄昏背景 */}
        <div className="absolute inset-0 bg-gradient-to-br from-orange-200 via-amber-100 to-yellow-200" />

        {/* 返回按钮 */}
        <div className="absolute top-4 left-4 z-50">
          <motion.button
            onClick={handleBack}
            className="bg-white/80 backdrop-blur-xl px-5 py-2.5 rounded-full shadow-xl font-black text-gray-700 border-4 border-white/60"
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.95 }}
          >
            ← 返回
          </motion.button>
        </div>

        <div className="relative z-10 flex items-center justify-center min-h-screen px-4">
          <motion.div
            className="bg-white/90 backdrop-blur-xl rounded-3xl p-8 shadow-2xl border-4 border-white/60 max-w-md w-full"
            initial={{ scale: 0.8, opacity: 0, y: 50 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
          >
            <motion.div
              className="text-center mb-6"
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <div className="text-8xl mb-4">🏠</div>
              <h1 className="text-3xl font-black bg-gradient-to-r from-amber-500 via-orange-500 to-yellow-500 bg-clip-text text-transparent">
                影子小屋
              </h1>
            </motion.div>

            <div className="space-y-3 mb-6">
              <div className="bg-amber-100 rounded-2xl p-4">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">💡</span>
                  <p className="text-sm font-bold text-gray-700">点击每个房间的灯</p>
                </div>
              </div>
              <div className="bg-orange-100 rounded-2xl p-4">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">🌑</span>
                  <p className="text-sm font-bold text-gray-700">遇见你的情绪影子</p>
                </div>
              </div>
              <div className="bg-yellow-100 rounded-2xl p-4">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">💕</span>
                  <p className="text-sm font-bold text-gray-700">每个影子都想对你说温暖的话</p>
                </div>
              </div>
            </div>

            <motion.p className="text-gray-600 font-bold text-center mb-6 bg-gradient-to-r from-amber-100 to-orange-100 rounded-xl p-3">
              "敢不敢去看看自己的影子？"
            </motion.p>

            <motion.button
              onClick={() => setEntered(true)}
              className="w-full bg-gradient-to-r from-amber-400 via-orange-400 to-yellow-400 text-white font-black text-xl py-4 rounded-full shadow-xl"
              whileHover={{ scale: 1.05, y: -3 }}
              whileTap={{ scale: 0.95 }}
            >
              进入小屋 🚪
            </motion.button>
          </motion.div>
        </div>
      </div>
    );
  }

  // 结束界面
  if (showEnding) {
    return (
      <div className="relative min-h-screen w-full overflow-hidden">
        {/* 温暖的光芒背景 - 静态渐变 */}
        <div className="absolute inset-0 bg-gradient-to-br from-amber-200 via-yellow-100 to-orange-200" />

        {/* 柔和光晕动画 - 简化效果，避免闪烁 */}
        <div className="absolute inset-0 overflow-hidden">
          <motion.div
            className="absolute inset-0"
            style={{
              background: 'radial-gradient(circle at 50% 50%, rgba(255,200,100,0.15) 0%, transparent 70%)',
            }}
            animate={{
              scale: [1, 1.1, 1],
              opacity: [0.4, 0.6, 0.4],
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
        </div>

        <div className="relative z-10 flex items-center justify-center min-h-screen px-4">
          <motion.div
            className="bg-white/90 backdrop-blur-xl rounded-3xl p-8 shadow-2xl border-4 border-white/60 max-w-md w-full text-center"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
          >
            <motion.div
              className="text-7xl mb-4"
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 2, repeat: Infinity, repeatDelay: 1 }}
            >
              🌟
            </motion.div>
            <h2 className="text-3xl font-black text-amber-600 mb-4">欢迎回来～</h2>

            <div className="bg-gradient-to-r from-amber-100 via-orange-100 to-yellow-100 rounded-2xl p-6 mb-6">
              <p className="text-lg font-bold text-gray-700 leading-relaxed">
                所有的影子朋友都在这里，<br />
                和你一起。<br />
                <span className="text-amber-600 text-xl">谢谢你来看我们～</span>
              </p>
            </div>

            <motion.p className="text-gray-600 font-bold mb-6">
              每一种心情，都值得被看见 💕
            </motion.p>

            <div className="flex gap-3">
              <motion.button
                onClick={handleRestart}
                className="flex-1 bg-gradient-to-r from-amber-400 to-orange-400 text-white font-black py-3 rounded-full"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                再玩一次
              </motion.button>
              <motion.button
                onClick={handleBack}
                className="flex-1 bg-gray-300 text-gray-700 font-black py-3 rounded-full"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                返回
              </motion.button>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  // 游戏进行界面
  return (
    <div className="relative min-h-screen w-full overflow-hidden">
      {/* 黄昏天空背景 */}
      <div className="absolute inset-0 bg-gradient-to-b from-orange-200 via-amber-100 to-yellow-100" />

      {/* 小屋容器 */}
      <div className="relative z-10 flex items-center justify-center min-h-screen px-4 py-8">
        <div className="relative">
          {/* 小屋主体 - 剖面效果 */}
          <motion.div
            className="relative bg-gradient-to-b from-amber-800 to-amber-900 rounded-t-full rounded-b-lg shadow-2xl overflow-hidden"
            style={{ width: 320, height: 520 }}
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            {/* 屋顶三角形 - 与小屋宽度一致（320px） */}
            <div
              className="absolute -top-20 left-1/2 -translate-x-1/2"
              style={{
                width: 0,
                height: 0,
                borderLeft: '160px solid transparent',
                borderRight: '160px solid transparent',
                borderBottom: '120px solid #92400E',
              }}
            />

            {/* 房间 - 6 个格子 */}
            {rooms.map((room, index) => {
              const shadow = SHADOWS.find(s => s.id === room.shadowId);
              return (
                <motion.div
                  key={room.id}
                  className="absolute"
                  style={{
                    left: room.x,
                    top: room.y,
                    width: 120,
                    height: 110,
                  }}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: index * 0.1 }}
                >
                  {/* 房间背景 */}
                  <div
                    className={`relative w-full h-full rounded-xl border-4 transition-all duration-500 cursor-pointer overflow-hidden ${
                      room.isLit
                        ? `bg-gradient-to-br ${shadow?.color} border-yellow-300 shadow-lg shadow-yellow-200/50`
                        : 'bg-gray-800 border-gray-600'
                    }`}
                    onClick={() => handleLampClick(room.id)}
                  >
                    {/* 未点亮状态 - 显示影子轮廓 */}
                    {!room.isLit && (
                      <>
                        {/* 影子轮廓 */}
                        <div className="absolute inset-0 flex items-center justify-center">
                          <motion.div
                            className="text-5xl"
                            style={{ filter: 'brightness(0.3)' }}
                            animate={{ x: [0, 2, 0, -2, 0] }}
                            transition={{ duration: 3, repeat: Infinity }}
                          >
                            {shadow?.emoji}
                          </motion.div>
                        </div>
                        {/* 灯（未点亮） */}
                        <div className="absolute top-2 left-1/2 -translate-x-1/2 w-8 h-8 bg-gray-600 rounded-full border-2 border-gray-400" />
                      </>
                    )}

                    {/* 已点亮状态 - 显示完整内容 */}
                    {room.isLit && (
                      <>
                        {/* 温暖光芒 */}
                        <div
                          className="absolute inset-0"
                          style={{
                            background: `radial-gradient(circle at center, ${shadow?.lightColor} 0%, transparent 70%)`,
                          }}
                        />
                        {/* 影子完整形象 */}
                        <div className="absolute inset-0 flex items-center justify-center">
                          <motion.div
                            className="text-5xl"
                            initial={{ scale: 0.5, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ type: 'spring', damping: 10 }}
                          >
                            {shadow?.emoji}
                          </motion.div>
                        </div>
                        {/* 灯（点亮） */}
                        <motion.div
                          className="absolute top-2 left-1/2 -translate-x-1/2 w-8 h-8 bg-yellow-400 rounded-full border-2 border-yellow-200"
                          animate={{
                            boxShadow: [
                              '0 0 10px #FCD34D',
                              '0 0 20px #FCD34D',
                              '0 0 10px #FCD34D',
                            ],
                          }}
                          transition={{ duration: 1.5, repeat: Infinity }}
                        />
                      </>
                    )}
                  </div>
                </motion.div>
              );
            })}

            {/* 地板 */}
            <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-b from-amber-950 to-amber-900" />

            {/* 门口 */}
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-20 h-16 bg-gradient-to-b from-amber-700 to-amber-800 rounded-t-full border-4 border-amber-600" />
          </motion.div>

          {/* 小人 - 使用图片 */}
          <motion.div
            className="absolute z-20"
            style={{
              left: personX,
              top: personY,
              transform: 'translateX(-50%)',
              width: 50,
              height: 50,
            }}
            animate={{
              x: isMoving ? [0, 10, -10, 0] : 0,
            }}
            transition={{ duration: 0.3 }}
          >
            <img
              src={currentAvatarUrl}
              alt="小人"
              className="w-full h-full object-contain"
              draggable={false}
            />
          </motion.div>

          {/* 小屋名称标签 - 居中 */}
          <motion.div
            className="absolute -top-12 left-1/2 -translate-x-1/2 bg-white/90 backdrop-blur-xl px-6 py-2 rounded-full shadow-xl border-4 border-white/60 flex items-center justify-center"
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
          >
            <span className="text-lg font-black text-amber-600">🏠 影子小屋</span>
          </motion.div>

          {/* 进度显示 */}
          <motion.div
            className="absolute -right-32 top-1/2 -translate-y-1/2 bg-white/80 backdrop-blur-xl rounded-2xl p-4 shadow-xl border-4 border-white/60"
            initial={{ x: 20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            <div className="text-center">
              <div className="text-xs text-gray-500 font-bold mb-2">点亮的房间</div>
              <div className="text-3xl font-black text-amber-600">
                {litCount} / {SHADOWS.length}
              </div>
              <div className="flex gap-1 justify-center mt-2">
                {[...Array(SHADOWS.length)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="w-3 h-3 rounded-full"
                    animate={{
                      scale: i < litCount ? 1.2 : 1,
                      backgroundColor: i < litCount ? '#F59E0B' : '#D1D5DB',
                    }}
                  />
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* 顶部返回按钮 */}
      <div className="absolute top-4 left-4 z-50">
        <motion.button
          onClick={handleBackToHouse}
          className="bg-white/80 backdrop-blur-xl px-5 py-2.5 rounded-full shadow-xl font-black text-gray-700 border-4 border-white/60"
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.95 }}
        >
          ← 返回入口
        </motion.button>
      </div>

      {/* 影子对话弹窗 */}
      <AnimatePresence>
        {selectedShadow && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center px-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {/* 背景遮罩 */}
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={handleCloseDialog} />

            {/* 对话框 */}
            <motion.div
              className="relative bg-white rounded-3xl p-6 shadow-2xl max-w-md w-full"
              initial={{ scale: 0.5, y: 50 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.5, y: 50 }}
              transition={{ type: 'spring', damping: 15 }}
            >
              {/* 影子表情 */}
              <motion.div
                className="text-7xl text-center mb-4 flex justify-center"
                animate={{ y: [0, -10, 0], rotate: [0, 5, -5, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                {selectedShadow.emoji}
              </motion.div>

              {/* 影子名字 */}
              <div className={`text-center mb-4 bg-gradient-to-r ${selectedShadow.color} rounded-xl py-2 flex justify-center`}>
                <span className="text-xl font-black text-white">
                  {selectedShadow.name}的影子
                </span>
              </div>

              {/* 解锁消息 */}
              <p className="text-gray-500 text-sm text-center mb-4 font-bold italic">
                {selectedShadow.unlockMessage}
              </p>

              {/* 温暖鼓励的话 */}
              <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-2xl p-5 mb-6 border-2 border-amber-200">
                <p className="text-gray-700 text-base leading-relaxed font-bold text-center">
                  {selectedShadow.currentMessage}
                </p>
              </div>

              {/* 关闭按钮 */}
              <motion.button
                onClick={handleCloseDialog}
                className="w-full bg-gradient-to-r from-amber-400 via-orange-400 to-yellow-400 text-white font-black text-lg py-3 rounded-full shadow-xl"
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
              >
                谢谢你来听 💕
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 底部提示 */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-40 pointer-events-none">
        <motion.div
          className="bg-white/80 backdrop-blur-xl rounded-full px-6 py-3 shadow-xl border-4 border-white/60"
          animate={{ y: [0, -5, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <p className="text-gray-700 font-bold text-sm">💡 点击未点亮的房间</p>
        </motion.div>
      </div>
    </div>
  );
};
