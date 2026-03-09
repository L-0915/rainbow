import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '@/store/appStore';
import { useCharacterStore } from '@/store/characterStore';
import { useState } from 'react';

// 卡通风格输入框
const CartoonInput = ({ value, onChange, placeholder, type = 'text', icon }: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  type?: string;
  icon?: string;
}) => {
  return (
    <div className="relative w-full max-w-xs">
      {icon && (
        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl z-10">
          {icon}
        </span>
      )}
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`
          w-full ${icon ? 'pl-14' : 'px-6'} py-4 rounded-full
          bg-white/95 backdrop-blur-md
          border-4 border-white
          shadow-xl
          text-gray-700 font-bold text-base
          placeholder-gray-400
          focus:outline-none focus:ring-4 focus:ring-pink-300 focus:border-pink-300
          transition-all duration-200
        `}
      />
    </div>
  );
};

// 彩虹渐变按钮
const RainbowButton = ({ onClick, children, disabled }: {
  onClick: () => void;
  children: React.ReactNode;
  disabled?: boolean;
}) => {
  return (
    <motion.button
      onClick={onClick}
      whileHover={{ scale: disabled ? 1 : 1.08, rotate: disabled ? 0 : -2 }}
      whileTap={{ scale: disabled ? 1 : 0.95 }}
      className={`
        bg-gradient-to-r from-pink-400 via-purple-400 via-blue-400 via-green-400 via-yellow-400 to-orange-400
        bg-[length:300%_100%]
        px-12 py-5 rounded-full
        text-white font-extrabold text-2xl tracking-wide
        shadow-2xl border-4 border-white/60
        transition-all duration-300
        animate-gradient
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-[0_0_40px_rgba(255,255,255,0.5)]'}
      `}
      style={{
        animation: 'gradient-shift 3s ease infinite',
      }}
      disabled={disabled}
    >
      {children}
    </motion.button>
  );
};

// 标签页按钮 - 完全居中版本
const TabButton = ({ active, onClick, children }: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) => {
  return (
    <motion.button
      onClick={onClick}
      className={`px-8 py-3 rounded-full font-extrabold text-lg transition-all duration-300 ${
        active
          ? 'bg-gradient-to-r from-pink-400 to-purple-400 text-white shadow-xl scale-110'
          : 'text-white/80 hover:text-white hover:bg-white/10'
      }`}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      {children}
    </motion.button>
  );
};

// 验证码输入框 - 花哨版本
const CodeInput = ({ value, onChange }: {
  value: string;
  onChange: (value: string) => void;
}) => {
  return (
    <div className="flex gap-3 justify-center">
      {[0, 1, 2, 3].map((i) => (
        <motion.input
          key={i}
          type="text"
          maxLength={1}
          value={value[i] || ''}
          onChange={(e) => {
            const newValue = value.split('');
            newValue[i] = e.target.value;
            onChange(newValue.join(''));
            if (e.target.value && i < 3) {
              (e.target.nextElementSibling as HTMLElement | null)?.focus();
            }
          }}
          className="
            w-16 h-16 text-center text-3xl font-black
            bg-gradient-to-br from-white to-pink-50 backdrop-blur-md
            border-4 border-white rounded-2xl
            shadow-xl
            text-gray-700
            focus:outline-none focus:ring-4 focus:ring-pink-300 focus:border-pink-300
            transition-all duration-200
          "
          initial={{ scale: 0, rotate: -180 }}
          animate={{
            scale: [0, 1.2, 1],
            rotate: [-180, 0, 0],
            y: value[i] ? [0, -5, 0] : 0,
          }}
          transition={{
            scale: { delay: i * 0.1, duration: 0.3 },
            rotate: { delay: i * 0.1, duration: 0.3 },
            y: { duration: 0.5 }
          }}
        />
      ))}
    </div>
  );
};

export const LoginScene = () => {
  const login = useAppStore((state) => state.login);
  const setHasInitialized = useCharacterStore((state) => state.setHasInitialized);
  const hasInitialized = useCharacterStore((state) => state.hasInitialized);
  const { config: characterConfig } = useCharacterStore();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoginMode, setIsLoginMode] = useState(true);

  // 获取当前角色图片路径 - 根据 avatarStyle id 映射到实际文件名
  const currentAvatarUrl = characterConfig?.avatarStyle
    ? (characterConfig.avatarStyle === '卡通2' ? '/卡通数字人2.png' : '/卡通数字人.png')
    : '/卡通数字人.png';

  // 忘记密码相关状态
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [verifyStep, setVerifyStep] = useState<'method' | 'phone' | 'wechat' | 'code'>('method');
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [countdown, setCountdown] = useState(0);

  const handleLogin = () => {
    if (!hasInitialized) {
      setHasInitialized(true);
    }
    login();
  };

  const handleSendCode = () => {
    if (phone.length < 11) return;
    setCountdown(60);
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleVerifyCode = () => {
    if (code.length === 4) {
      // 验证成功，重置状态
      setShowForgotPassword(false);
      setVerifyStep('method');
      setPhone('');
      setCode('');
      alert('✅ 验证成功！请设置新密码～');
    }
  };

  return (
    <div className="relative min-h-screen w-full overflow-y-auto overflow-x-hidden">
      {/* 背景图片 */}
      <div
        className="fixed inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `url('/login-bg.png')`,
        }}
      />

      {/* 渐变遮罩，让文字更清晰 */}
      <div className="fixed inset-0 bg-gradient-to-b from-purple-900/40 via-pink-900/20 to-blue-900/50" />

      {/* 漂浮的云朵装饰 */}
      <motion.div
        className="absolute top-20 left-10 w-32 h-20 bg-white/25 rounded-full blur-xl"
        animate={{ x: [0, 20, 0] }}
        transition={{ duration: 5, repeat: Infinity }}
      />
      <motion.div
        className="absolute top-40 right-20 w-24 h-16 bg-pink-200/20 rounded-full blur-xl"
        animate={{ x: [0, -15, 0] }}
        transition={{ duration: 4, repeat: Infinity }}
      />

      {/* 漂浮的爱心装饰 */}
      {[...Array(5)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute text-2xl opacity-40"
          style={{
            left: `${20 + i * 15}%`,
            top: `${30 + (i % 3) * 20}%`,
          }}
          animate={{
            y: [0, -30, 0],
            opacity: [0.3, 0.8, 0.3],
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: 3 + i,
            repeat: Infinity,
            delay: i * 0.5,
          }}
        >
          💖
        </motion.div>
      ))}

      {/* 主内容 - 完全居中 */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-6 py-12">

        {/* 标题区域 - 飘逸卡通化 */}
        <motion.div
          className="text-center mb-6"
          initial={{ y: -60, opacity: 0, rotate: -5 }}
          animate={{ y: 0, opacity: 1, rotate: 0 }}
          transition={{ type: 'spring', bounce: 0.6, delay: 0.2 }}
        >
          {/* 彩虹创口贴 - 每个字不同颜色，更卡通 */}
          <div className="flex justify-center items-center gap-2 mb-3">
            <motion.span
              className="text-5xl md:text-7xl font-black drop-shadow-2xl"
              style={{
                textShadow: '0 4px 20px rgba(255,107,107,0.5), 0 0 40px rgba(255,255,255,0.4), 4px 4px 0 rgba(0,0,0,0.2)',
                fontFamily: '"Comic Sans MS", "Varela Round", cursive',
              }}
              animate={{ y: [0, -3, 0], rotate: [-2, 2, -2], scale: [1, 1.05, 1] }}
              transition={{ duration: 2, repeat: Infinity, delay: 0 }}
            >
              🌈
            </motion.span>
            <motion.span
              className="text-5xl md:text-7xl font-black"
              style={{
                background: 'linear-gradient(180deg, #FF6B6B 0%, #FF8E8E 50%, #FFA0A0 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                textShadow: '0 4px 20px rgba(255,107,107,0.5), 0 0 40px rgba(255,255,255,0.4)',
                filter: 'drop-shadow(4px 4px 0 rgba(0,0,0,0.2))',
                fontFamily: '"Comic Sans MS", "Varela Round", cursive',
              }}
              animate={{ y: [0, -5, 0], scale: [1, 1.08, 1], rotate: [-3, 3, -3] }}
              transition={{ duration: 2.5, repeat: Infinity, delay: 0.1 }}
            >
              彩
            </motion.span>
            <motion.span
              className="text-5xl md:text-7xl font-black"
              style={{
                background: 'linear-gradient(180deg, #FFA94D 0%, #FFB961 50%, #FFC981 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                textShadow: '0 4px 20px rgba(255,169,77,0.5), 0 0 40px rgba(255,255,255,0.4)',
                filter: 'drop-shadow(4px 4px 0 rgba(0,0,0,0.2))',
                fontFamily: '"Comic Sans MS", "Varela Round", cursive',
              }}
              animate={{ y: [0, -5, 0], scale: [1, 1.08, 1], rotate: [-3, 3, -3] }}
              transition={{ duration: 2.5, repeat: Infinity, delay: 0.2 }}
            >
              虹
            </motion.span>
            <motion.span
              className="text-5xl md:text-7xl font-black"
              style={{
                background: 'linear-gradient(180deg, #FFE066 0%, #FFF080 50%, #FFFF9A 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                textShadow: '0 4px 20px rgba(255,224,102,0.5), 0 0 40px rgba(255,255,255,0.4)',
                filter: 'drop-shadow(4px 4px 0 rgba(0,0,0,0.2))',
                fontFamily: '"Comic Sans MS", "Varela Round", cursive',
              }}
              animate={{ y: [0, -5, 0], scale: [1, 1.08, 1], rotate: [-3, 3, -3] }}
              transition={{ duration: 2.5, repeat: Infinity, delay: 0.3 }}
            >
              创
            </motion.span>
            <motion.span
              className="text-5xl md:text-7xl font-black"
              style={{
                background: 'linear-gradient(180deg, #69DB7C 0%, #8CE99A 50%, #A3EBA0 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                textShadow: '0 4px 20px rgba(105,219,124,0.5), 0 0 40px rgba(255,255,255,0.4)',
                filter: 'drop-shadow(4px 4px 0 rgba(0,0,0,0.2))',
                fontFamily: '"Comic Sans MS", "Varela Round", cursive',
              }}
              animate={{ y: [0, -5, 0], scale: [1, 1.08, 1], rotate: [-3, 3, -3] }}
              transition={{ duration: 2.5, repeat: Infinity, delay: 0.4 }}
            >
              口
            </motion.span>
            <motion.span
              className="text-5xl md:text-7xl font-black"
              style={{
                background: 'linear-gradient(180deg, #4DABF7 0%, #74C0FC 50%, #90D0FC 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                textShadow: '0 4px 20px rgba(77,171,247,0.5), 0 0 40px rgba(255,255,255,0.4)',
                filter: 'drop-shadow(4px 4px 0 rgba(0,0,0,0.2))',
                fontFamily: '"Comic Sans MS", "Varela Round", cursive',
              }}
              animate={{ y: [0, -5, 0], scale: [1, 1.08, 1], rotate: [-3, 3, -3] }}
              transition={{ duration: 2.5, repeat: Infinity, delay: 0.5 }}
            >
              贴
            </motion.span>
          </div>

          {/* 副标题 - 渐变粉色 */}
          <motion.p
            className="text-2xl md:text-3xl font-bold mt-4"
            style={{
              background: 'linear-gradient(90deg, #FFB6C1 0%, #FF69B4 50%, #FFB6C1 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              textShadow: '0 2px 10px rgba(255,182,193,0.5)',
              filter: 'drop-shadow(2px 2px 0 rgba(0,0,0,0.1))',
              fontFamily: '"Varela Round", cursive',
            }}
            animate={{ opacity: [0.8, 1, 0.8], scale: [1, 1.02, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            ✨ 你的情绪好朋友 ✨
          </motion.p>
        </motion.div>

        {/* 数字人图片 - 使用你提供的图片 */}
        <motion.div
          className="mb-6 relative"
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', bounce: 0.5, delay: 0.4 }}
        >
          {/* 光晕背景 */}
          <div className="absolute inset-0 bg-gradient-to-r from-pink-400/30 via-purple-400/30 to-blue-400/30 rounded-full blur-2xl scale-125" />

          {/* 数字人图片 - 使用用户选择的角色 */}
          <motion.img
            key={currentAvatarUrl}
            src={currentAvatarUrl}
            alt="卡通数字人"
            className="w-40 h-40 md:w-48 md:h-48 object-contain relative z-10 drop-shadow-2xl"
            animate={{ y: [0, -10, 0], rotate: [0, 3, 0, -3, 0], scale: [1, 1.05, 1] }}
            transition={{ duration: 3, repeat: Infinity }}
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />

          {/* 闪烁的星星 */}
          {[...Array(4)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute text-xl"
              style={{
                top: i % 2 === 0 ? '-10px' : undefined,
                bottom: i % 2 === 1 ? '-10px' : undefined,
                left: i < 2 ? '-20px' : 'auto',
                right: i >= 2 ? '-20px' : 'auto',
              }}
              animate={{ scale: [0, 1, 0], opacity: [0, 1, 0], rotate: [0, 180, 360] }}
              transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.3 }}
            >
              ⭐
            </motion.div>
          ))}
        </motion.div>

        {/* 登录/注册切换标签 - 完全居中 */}
        <motion.div
          className="bg-white/20 backdrop-blur-xl rounded-full p-2 mb-6 shadow-xl border-2 border-white/30"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <div className="flex gap-2 justify-center">
            <TabButton active={isLoginMode} onClick={() => setIsLoginMode(true)}>
              🔑 登录
            </TabButton>
            <div className="w-px bg-white/30 my-2" />
            <TabButton active={!isLoginMode} onClick={() => setIsLoginMode(false)}>
              📝 注册
            </TabButton>
          </div>
        </motion.div>

        {/* 登录表单卡片 - 居中 */}
        <motion.div
          className="bg-white/30 backdrop-blur-xl rounded-[2rem] p-8 mb-6 shadow-2xl border-3 border-white/50 w-full max-w-md"
          initial={{ scale: 0.8, opacity: 0, y: 30 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          transition={{ delay: 0.6, type: 'spring', bounce: 0.4 }}
        >
          {/* 输入框 - 完全居中 */}
          <div className="space-y-4 mb-6 flex flex-col items-center">
            <CartoonInput
              value={username}
              onChange={setUsername}
              placeholder="👤 用户名 / 手机号"
            />
            <CartoonInput
              value={password}
              onChange={setPassword}
              placeholder="🔒 密码"
              type="password"
            />
          </div>

          {/* 忘记密码 - 居中 */}
          {isLoginMode && (
            <div className="text-center mb-6">
              <button
                onClick={() => setShowForgotPassword(true)}
                className="text-white/80 hover:text-white text-sm font-bold transition-colors underline underline-offset-4"
              >
                🔍 忘记密码？
              </button>
            </div>
          )}

          {/* 登录按钮 - 居中 */}
          <div className="flex justify-center mb-6">
            <RainbowButton onClick={handleLogin}>
              {isLoginMode ? '🌈 登 录' : '✨ 注 册'}
            </RainbowButton>
          </div>

          {/* 第三方登录 - 居中 */}
          <div className="text-center">
            <p className="text-white/70 text-sm font-bold mb-4">━━ 其他方式登录 ━━</p>
            <div className="flex justify-center gap-4">
              {['微信', 'QQ', 'Apple'].map((item, i) => (
                <motion.button
                  key={item}
                  className="w-14 h-14 rounded-full bg-white/40 backdrop-blur-sm flex items-center justify-center text-2xl hover:bg-white/60 hover:scale-125 transition-all shadow-lg border-2 border-white/50"
                  whileHover={{ scale: 1.2, rotate: 10 }}
                  whileTap={{ scale: 0.9 }}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.8 + i * 0.1 }}
                  title={item}
                >
                  {item === '微信' && '💬'}
                  {item === 'QQ' && '🐧'}
                  {item === 'Apple' && '🍎'}
                </motion.button>
              ))}
            </div>
          </div>
        </motion.div>

        {/* 底部提示 - 居中 */}
        <motion.p
          className="text-white/50 text-xs font-medium text-center max-w-md"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
        >
          登录即代表你同意
          <span className="underline underline-offset-2 mx-1">《服务协议》</span>
          和
          <span className="underline underline-offset-2 mx-1">《隐私政策》</span>
        </motion.p>

        {/* 占位空间 */}
        <div className="h-8" />
      </div>

      {/* 忘记密码弹窗 */}
      <AnimatePresence>
        {showForgotPassword && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {/* 背景遮罩 */}
            <div
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => {
                setShowForgotPassword(false);
                setVerifyStep('method');
              }}
            />

            {/* 弹窗内容 */}
            <motion.div
              className="relative bg-gradient-to-br from-pink-100 via-purple-100 to-blue-100 rounded-3xl p-8 shadow-2xl border-4 border-white/60 max-w-md w-full"
              initial={{ scale: 0.5, rotate: -10, y: 50 }}
              animate={{ scale: 1, rotate: 0, y: 0 }}
              exit={{ scale: 0.5, rotate: 10, y: 50 }}
              transition={{ type: 'spring', bounce: 0.5 }}
            >
              {/* 关闭按钮 */}
              <button
                onClick={() => {
                  setShowForgotPassword(false);
                  setVerifyStep('method');
                }}
                className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/60 hover:bg-white/80 flex items-center justify-center text-xl shadow-lg transition-all"
              >
                ✕
              </button>

              {/* 标题 */}
              <div className="text-center mb-6">
                <motion.div
                  className="text-5xl mb-3"
                  animate={{ y: [0, -5, 0], rotate: [0, 10, -10, 0] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  🔐
                </motion.div>
                <h3 className="text-2xl font-black text-gray-700 mb-2">
                  找回密码
                </h3>
                <p className="text-gray-500 text-sm">
                  验证身份后设置新密码
                </p>
              </div>

              {/* 步骤 1：选择验证方式 */}
              {verifyStep === 'method' && (
                <motion.div
                  className="space-y-4"
                  initial={{ x: -50, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  exit={{ x: 50, opacity: 0 }}
                >
                  <p className="text-center text-gray-600 font-bold mb-4">选择验证方式：</p>
                  <button
                    onClick={() => setVerifyStep('phone')}
                    className="w-full bg-gradient-to-r from-green-400 to-emerald-500 text-white font-bold py-4 px-6 rounded-2xl shadow-xl hover:shadow-2xl transition-all flex items-center justify-center gap-3"
                  >
                    <span className="text-3xl">📱</span>
                    <span>手机号验证</span>
                  </button>
                  <button
                    onClick={() => setVerifyStep('wechat')}
                    className="w-full bg-gradient-to-r from-green-500 to-green-600 text-white font-bold py-4 px-6 rounded-2xl shadow-xl hover:shadow-2xl transition-all flex items-center justify-center gap-3"
                  >
                    <span className="text-3xl">💬</span>
                    <span>微信验证</span>
                  </button>
                </motion.div>
              )}

              {/* 步骤 2：手机验证 */}
              {verifyStep === 'phone' && (
                <motion.div
                  className="space-y-4"
                  initial={{ x: 50, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  exit={{ x: -50, opacity: 0 }}
                >
                  <p className="text-center text-gray-600 font-bold mb-2">输入手机号：</p>
                  <CartoonInput
                    value={phone}
                    onChange={setPhone}
                    placeholder="📱 请输入手机号"
                    type="tel"
                  />
                  <div className="flex gap-3">
                    <RainbowButton onClick={() => setVerifyStep('code')}>
                      下一步
                    </RainbowButton>
                    <button
                      onClick={() => setVerifyStep('method')}
                      className="px-6 py-3 rounded-full font-bold text-gray-600 bg-white/60 hover:bg-white/80 transition-all"
                    >
                      返回
                    </button>
                  </div>
                </motion.div>
              )}

              {/* 步骤 3：微信验证 */}
              {verifyStep === 'wechat' && (
                <motion.div
                  className="space-y-4 text-center"
                  initial={{ x: 50, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  exit={{ x: -50, opacity: 0 }}
                >
                  <div className="text-6xl mb-4">💬</div>
                  <p className="text-gray-600 font-bold">
                    请使用微信扫描下方二维码
                  </p>
                  <div className="bg-white rounded-2xl p-6 shadow-xl mx-auto w-fit">
                    <div className="w-32 h-32 bg-gradient-to-br from-green-400 to-green-600 rounded-xl flex items-center justify-center text-6xl">
                      💬
                    </div>
                  </div>
                  <p className="text-sm text-gray-500">
                    扫码后在微信中确认身份
                  </p>
                  <button
                    onClick={() => setVerifyStep('code')}
                    className="w-full bg-gradient-to-r from-green-500 to-green-600 text-white font-bold py-4 px-6 rounded-2xl shadow-xl hover:shadow-2xl transition-all"
                  >
                    ✅ 已完成验证
                  </button>
                  <button
                    onClick={() => setVerifyStep('method')}
                    className="w-full px-4 py-2 text-gray-600 font-bold hover:text-gray-800"
                  >
                    返回
                  </button>
                </motion.div>
              )}

              {/* 步骤 4：验证码 */}
              {verifyStep === 'code' && (
                <motion.div
                  className="space-y-4"
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                >
                  <p className="text-center text-gray-600 font-bold mb-2">
                    {verifyStep === 'code' && phone ? (
                      <>验证码已发送至<br /><span className="text-pink-500">{phone}</span></>
                    ) : (
                      '请输入验证码'
                    )}
                  </p>

                  <CodeInput value={code} onChange={setCode} />

                  <div className="text-center mt-4">
                    {countdown > 0 ? (
                      <p className="text-gray-500 text-sm">
                        {countdown}秒后重新发送
                      </p>
                    ) : (
                      <button
                        onClick={handleSendCode}
                        className="text-pink-500 font-bold text-sm hover:text-pink-600"
                      >
                        📩 重新发送验证码
                      </button>
                    )}
                  </div>

                  <div className="flex gap-3 mt-4">
                    <RainbowButton onClick={handleVerifyCode} disabled={code.length !== 4}>
                      ✅ 验证并重置
                    </RainbowButton>
                    <button
                      onClick={() => {
                        setVerifyStep('method');
                        setPhone('');
                        setCode('');
                      }}
                      className="px-6 py-3 rounded-full font-bold text-gray-600 bg-white/60 hover:bg-white/80 transition-all"
                    >
                      返回
                    </button>
                  </div>
                </motion.div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 添加渐变动画样式 */}
      <style>{`
        @keyframes gradient-shift {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
      `}</style>
    </div>
  );
};
