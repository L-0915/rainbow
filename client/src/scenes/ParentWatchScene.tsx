import { useState, useEffect, memo } from 'react';
import { motion } from 'framer-motion';

interface ParentInfo {
  parent_id: number;
  nickname: string;
  token: string;
}

interface WatchBinding {
  watch_id: string;
  child_nickname: string;
  bound_at: string;
  parent_name?: string;
}

interface ParentWatchSceneProps {
  onBack: () => void;
}

export const ParentWatchScene = memo(({ onBack }: ParentWatchSceneProps) => {
  const [parentInfo, setParentInfo] = useState<ParentInfo | null>(null);
  const [watchBinding, setWatchBinding] = useState<WatchBinding | null>(null);
  const [showBindDialog, setShowBindDialog] = useState(false);
  const [isRebind, setIsRebind] = useState(false); // 是否是更换绑定
  const [watchId, setWatchId] = useState('');
  const [parentName, setParentName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

  // 检查本地存储的连接状态
  useEffect(() => {
    const savedParent = localStorage.getItem('parentInfo');
    const savedWatch = localStorage.getItem('watchBinding');
    if (savedParent) {
      setParentInfo(JSON.parse(savedParent));
    }
    if (savedWatch) {
      setWatchBinding(JSON.parse(savedWatch));
    }
  }, []);

  // 打开绑定对话框
  const openBindDialog = (isRebindMode = false) => {
    setIsRebind(isRebindMode);
    if (watchBinding) {
      // 如果是更换绑定，预填充当前家长名称
      setParentName(watchBinding.parent_name || '');
    }
    setShowBindDialog(true);
  };

  // 绑定手表
  const handleBindWatch = async () => {
    if (!watchId.trim() || !parentName.trim()) {
      setError('请填写完整信息');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // 先创建或获取家长账号
      let parentData: ParentInfo;
      const registerResponse = await fetch(`${API_BASE_URL}/api/parents/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nickname: parentName,
          password: `watch_${watchId}`, // 使用手表 ID 作为密码
        }),
      });
      const registerResult = await registerResponse.json();

      if (registerResult.code === 0) {
        parentData = registerResult.data;
      } else {
        // 如果注册失败，尝试登录（可能已存在）
        const loginResponse = await fetch(`${API_BASE_URL}/api/parents/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            nickname: parentName,
            password: `watch_${watchId}`,
          }),
        });
        const loginResult = await loginResponse.json();
        if (loginResult.code === 0) {
          parentData = loginResult.data;
        } else {
          setError('绑定失败，请重试');
          setLoading(false);
          return;
        }
      }

      // 绑定手表并创建/更新孩子信息
      const bindResponse = await fetch(`${API_BASE_URL}/api/parents/${parentData.parent_id}/bind-watch-child`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nickname: parentName + '的孩子', // 默认孩子昵称
          watch_id: watchId,
        }),
      });
      const bindResult = await bindResponse.json();

      if (bindResult.code === 0) {
        // 绑定成功
        localStorage.setItem('parentInfo', JSON.stringify(parentData));
        localStorage.setItem('watchBinding', JSON.stringify({
          watch_id: watchId,
          child_nickname: bindResult.data.child_nickname,
          bound_at: new Date().toISOString(),
          parent_name: parentName,
        }));
        setParentInfo(parentData);
        setWatchBinding({
          watch_id: watchId,
          child_nickname: bindResult.data.child_nickname,
          bound_at: new Date().toISOString(),
          parent_name: parentName,
        });
        setShowBindDialog(false);
        setWatchId('');
        setParentName('');
        setIsRebind(false);
      } else {
        setError(bindResult.message || '绑定失败，请检查手表 ID 是否正确');
      }
    } catch (err) {
      setError('网络错误，请检查后端服务是否启动');
    } finally {
      setLoading(false);
    }
  };

  // 解除绑定
  const handleUnbind = () => {
    if (confirm('确定要解除绑定吗？解除后家长将无法查看孩子数据。')) {
      localStorage.removeItem('parentInfo');
      localStorage.removeItem('watchBinding');
      setParentInfo(null);
      setWatchBinding(null);
      setShowBindDialog(false);
      setIsRebind(false);
    }
  };

  // 显示绑定对话框
  if (showBindDialog) {
    return (
      <div className="relative min-h-screen w-full overflow-hidden">
        {/* 背景 */}
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-400 via-purple-400 to-pink-400" />

        {/* 装饰星星 */}
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute text-white/30"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              fontSize: 20 + Math.random() * 30,
            }}
            animate={{
              scale: [1, 1.5, 1],
              opacity: [0.3, 0.8, 0.3],
            }}
            transition={{
              duration: 2 + Math.random() * 2,
              repeat: Infinity,
              delay: Math.random() * 2,
            }}
          >
            ⭐
          </motion.div>
        ))}

        {/* 返回按钮 */}
        <div className="absolute top-2 sm:top-4 left-2 sm:left-4 z-50">
          <motion.button
            onClick={() => {
              setShowBindDialog(false);
              setIsRebind(false);
            }}
            className="bg-white/30 backdrop-blur-xl px-3 py-1.5 sm:px-5 sm:py-2.5 rounded-full shadow-xl font-bold text-white border-2 border-white/40 text-xs sm:text-base"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            ← 返回
          </motion.button>
        </div>

        {/* 绑定表单 */}
        <div className="relative z-10 flex items-center justify-center min-h-screen px-4 py-8">
          <motion.div
            className="bg-white/90 backdrop-blur-xl rounded-3xl p-4 sm:p-6 md:p-8 shadow-2xl border-4 border-white/60 max-w-xs sm:max-w-md w-full"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
          >
            {/* 标题 */}
            <div className="text-center mb-4 sm:mb-8">
              <motion.div
                className="text-4xl sm:text-6xl mb-2 sm:mb-4"
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                ⌚
              </motion.div>
              <h1 className="text-lg sm:text-2xl font-black text-gray-700">
                {isRebind ? '更换家长手表' : '绑定家长手表'}
              </h1>
              <p className="text-gray-500 text-xs sm:text-sm mt-1 sm:mt-2">
                {isRebind ? '输入新的家长手表信息进行绑定' : '输入家长智能手表的 ID 进行绑定'}
              </p>
            </div>

            {/* 错误提示 */}
            {error && (
              <motion.div
                className="bg-red-100 border-2 border-red-300 rounded-2xl p-3 sm:p-4 mb-4 sm:mb-6"
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
              >
                <p className="text-red-600 text-xs sm:text-sm font-bold">{error}</p>
              </motion.div>
            )}

            {/* 表单 */}
            <div className="space-y-3 sm:space-y-4">
              <div>
                <label className="block text-xs sm:text-sm font-bold text-gray-700 mb-1 sm:mb-2">
                  家长称呼
                </label>
                <input
                  type="text"
                  value={parentName}
                  onChange={(e) => setParentName(e.target.value)}
                  className="w-full px-3 py-2 sm:px-4 sm:py-3 rounded-full border-2 border-gray-200 focus:border-purple-400 focus:outline-none text-sm sm:text-base"
                  placeholder="请输入您的称呼（如：妈妈）"
                />
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-bold text-gray-700 mb-1 sm:mb-2">
                  家长手表 ID
                </label>
                <input
                  type="text"
                  value={watchId}
                  onChange={(e) => setWatchId(e.target.value)}
                  className="w-full px-3 py-2 sm:px-4 sm:py-3 rounded-full border-2 border-gray-200 focus:border-purple-400 focus:outline-none text-sm sm:text-base"
                  placeholder="请输入手表背面的 ID"
                />
                <p className="text-xs text-gray-500 mt-1 sm:mt-2 ml-1 sm:ml-2">
                  💡 手表 ID 通常在手表背面或设置 - 关于中查看
                </p>
              </div>

              <motion.button
                onClick={handleBindWatch}
                disabled={loading || !watchId.trim() || !parentName.trim()}
                className="w-full bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 text-white font-black text-base sm:text-xl py-3 sm:py-4 rounded-full shadow-xl disabled:opacity-50"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {loading ? '绑定中...' : (isRebind ? '确认更换' : '立即绑定')}
              </motion.button>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  // 已绑定状态
  if (watchBinding && parentInfo) {
    return (
      <div className="relative min-h-screen w-full overflow-hidden">
        {/* 背景 */}
        <div className="absolute inset-0 bg-gradient-to-br from-green-400 via-emerald-400 to-teal-400" />

        {/* 装饰元素 */}
        {[...Array(15)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute text-white/30"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              fontSize: 20 + Math.random() * 30,
            }}
            animate={{
              scale: [1, 1.3, 1],
              opacity: [0.3, 0.7, 0.3],
            }}
            transition={{
              duration: 2 + Math.random() * 2,
              repeat: Infinity,
              delay: Math.random() * 2,
            }}
          >
            💚
          </motion.div>
        ))}

        {/* 顶部栏 */}
        <div className="absolute top-2 sm:top-4 left-2 sm:left-4 right-2 sm:right-4 z-50 flex items-center justify-between gap-2">
          <motion.button
            onClick={onBack}
            className="bg-white/30 backdrop-blur-xl px-3 py-1.5 sm:px-5 sm:py-2.5 rounded-full shadow-xl font-bold text-white border-2 border-white/40 text-xs sm:text-base"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            ← 返回
          </motion.button>
          <motion.button
            onClick={handleUnbind}
            className="bg-red-100/50 backdrop-blur-xl px-3 py-1.5 sm:px-4 sm:py-2 rounded-full shadow-xl font-bold text-red-600 border-2 border-red-300/60 text-xs sm:text-sm"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            解除绑定
          </motion.button>
        </div>

        {/* 内容 */}
        <div className="relative z-10 flex items-center justify-center min-h-screen px-4 py-8">
          <motion.div
            className="bg-white/90 backdrop-blur-xl rounded-3xl p-4 sm:p-6 md:p-8 shadow-2xl border-4 border-white/60 max-w-xs sm:max-w-md w-full"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
          >
            {/* 成功状态 */}
            <div className="text-center mb-4 sm:mb-8">
              <motion.div
                className="text-4xl sm:text-6xl mb-2 sm:mb-4"
                animate={{ scale: [1, 1.2, 1], rotate: [0, 10, -10, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                ✅
              </motion.div>
              <h1 className="text-lg sm:text-2xl font-black text-gray-700">已绑定家长手表</h1>
              <p className="text-gray-500 text-xs sm:text-sm mt-1 sm:mt-2">
                家长可以随时查看你的情绪日记和漂流瓶了
              </p>
            </div>

            {/* 绑定信息 */}
            <div className="bg-gradient-to-r from-indigo-100 to-purple-100 rounded-2xl p-3 sm:p-6 mb-3 sm:mb-6 border-2 border-white/60">
              <div className="flex items-center gap-2 sm:gap-4 mb-2 sm:mb-4">
                <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-gradient-to-br from-indigo-400 to-purple-400 flex items-center justify-center text-2xl sm:text-3xl">
                  👨‍👩‍👧
                </div>
                <div className="flex-1">
                  <div className="text-xs sm:text-sm text-gray-500 font-bold">家长</div>
                  <div className="text-base sm:text-xl font-black text-gray-700">{watchBinding.parent_name || '家长'}</div>
                </div>
              </div>
              <div className="flex items-center gap-2 sm:gap-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white/60 flex items-center justify-center text-xl sm:text-2xl">
                  ⌚
                </div>
                <div className="flex-1">
                  <div className="text-xs sm:text-sm text-gray-500 font-bold">手表 ID</div>
                  <div className="text-sm sm:text-lg font-bold text-gray-700">{watchBinding.watch_id}</div>
                </div>
              </div>
              <div className="flex items-center gap-2 sm:gap-4 mt-2 sm:mt-4 pt-2 sm:pt-4 border-t-2 border-white/40">
                <div className="w-8 h-8 sm:w-12 sm:h-12 rounded-full bg-pink-100 flex items-center justify-center text-xl sm:text-2xl">
                  👧
                </div>
                <div className="flex-1">
                  <div className="text-xs sm:text-sm text-gray-500 font-bold">孩子昵称</div>
                  <div className="text-sm sm:text-lg font-black text-gray-700">{watchBinding.child_nickname}</div>
                </div>
              </div>
            </div>

            {/* 操作按钮 */}
            <div className="space-y-2 sm:space-y-3">
              <motion.button
                onClick={() => openBindDialog(true)}
                className="w-full bg-gradient-to-r from-orange-400 to-amber-400 text-white font-black text-sm sm:text-lg py-2 sm:py-4 rounded-full shadow-xl"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                🔄 更换家长手表
              </motion.button>
              <motion.button
                onClick={onBack}
                className="w-full bg-white/60 text-gray-700 font-bold text-sm sm:text-lg py-2 sm:py-4 rounded-full shadow-xl border-2 border-white/40"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                关闭
              </motion.button>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  // 未绑定状态 - 显示引导
  return (
    <div className="relative min-h-screen w-full overflow-hidden">
      {/* 背景 */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-400 via-purple-400 to-pink-400" />

      {/* 装饰元素 */}
      {[...Array(20)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute text-white/30"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            fontSize: 20 + Math.random() * 30,
          }}
          animate={{
            scale: [1, 1.5, 1],
            opacity: [0.3, 0.8, 0.3],
          }}
          transition={{
            duration: 2 + Math.random() * 2,
            repeat: Infinity,
            delay: Math.random() * 2,
          }}
        >
          ⭐
        </motion.div>
      ))}

      {/* 返回按钮 */}
      <div className="absolute top-2 sm:top-4 left-2 sm:left-4 z-50">
        <motion.button
          onClick={onBack}
          className="bg-white/30 backdrop-blur-xl px-3 py-1.5 sm:px-5 sm:py-2.5 rounded-full shadow-xl font-bold text-white border-2 border-white/40 text-xs sm:text-base"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          ← 返回
        </motion.button>
      </div>

      {/* 引导内容 */}
      <div className="relative z-10 flex items-center justify-center min-h-screen px-4 py-8">
        <motion.div
          className="bg-white/90 backdrop-blur-xl rounded-3xl p-4 sm:p-6 md:p-8 shadow-2xl border-4 border-white/60 max-w-xs sm:max-w-md w-full"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
        >
          {/* 标题 */}
          <div className="text-center mb-4 sm:mb-8">
            <motion.div
              className="text-4xl sm:text-6xl mb-2 sm:mb-4"
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              ⌚
            </motion.div>
            <h1 className="text-lg sm:text-2xl font-black text-gray-700">绑定家长手表</h1>
            <p className="text-gray-500 text-xs sm:text-sm mt-1 sm:mt-2">
              让家长通过智能手表连接，关心你的成长
            </p>
          </div>

          {/* 功能说明 */}
          <div className="space-y-2 sm:space-y-4 mb-4 sm:mb-8">
            <div className="flex items-center gap-2 sm:gap-3 bg-blue-50 rounded-xl sm:rounded-2xl p-2 sm:p-4">
              <div className="text-2xl sm:text-3xl">📊</div>
              <div>
                <div className="font-bold text-gray-700 text-xs sm:text-sm">家长可以查看</div>
                <div className="text-xs text-gray-500">你的情绪日记，了解你的心情变化</div>
              </div>
            </div>
            <div className="flex items-center gap-2 sm:gap-3 bg-purple-50 rounded-xl sm:rounded-2xl p-2 sm:p-4">
              <div className="text-2xl sm:text-3xl">🍾</div>
              <div>
                <div className="font-bold text-gray-700 text-xs sm:text-sm">查看漂流瓶</div>
                <div className="text-xs text-gray-500">倾听你的心声和想法</div>
              </div>
            </div>
            <div className="flex items-center gap-2 sm:gap-3 bg-pink-50 rounded-xl sm:rounded-2xl p-2 sm:p-4">
              <div className="text-2xl sm:text-3xl">💕</div>
              <div>
                <div className="font-bold text-gray-700 text-xs sm:text-sm">更懂你</div>
                <div className="text-xs text-gray-500">更好地陪伴你健康成长</div>
              </div>
            </div>
          </div>

          {/* 绑定按钮 */}
          <motion.button
            onClick={() => openBindDialog(false)}
            className="w-full bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 text-white font-black text-base sm:text-xl py-3 sm:py-4 rounded-full shadow-xl"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            🔗 绑定家长手表
          </motion.button>

          {/* 提示 */}
          <p className="text-center text-xs text-gray-400 mt-2 sm:mt-4">
            💡 手表 ID 可在手表背面或设置中找到
          </p>
        </motion.div>
      </div>
    </div>
  );
});
ParentWatchScene.displayName = 'ParentWatchScene';
