import { useAppStore, useAuthStore } from '@/store/appStore';
import { useCharacterStore } from '@/store/characterStore';
import { useState, memo } from 'react';
import { getPublicUrl } from '@/utils/getPublicUrl';

// 输入框组件
const CartoonInput = ({ value, onChange, placeholder, type = 'text' }: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  type?: string;
}) => (
  <input
    type={type}
    value={value}
    onChange={(e) => onChange(e.target.value)}
    placeholder={placeholder}
    className="w-full max-w-xs px-4 py-3 rounded-full bg-white/95 border-2 border-white shadow-lg text-gray-700 font-bold placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-300 transition-all"
  />
);

// 按钮组件
const RainbowButton = ({ onClick, children, disabled }: {
  onClick: () => void;
  children: React.ReactNode;
  disabled?: boolean;
}) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={`bg-gradient-to-r from-pink-400 via-purple-400 to-blue-400 px-8 py-3 rounded-full text-white font-bold shadow-lg border-2 border-white/60 transition-all ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-xl active:scale-95'}`}
  >
    {children}
  </button>
);

// 标签按钮
const TabButton = ({ active, onClick, children }: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) => (
  <button
    onClick={onClick}
    className={`px-4 py-2 rounded-full font-bold text-sm transition-all ${active ? 'bg-white/90 text-pink-500 shadow-lg' : 'text-white/80 hover:text-white'}`}
  >
    {children}
  </button>
);

export const LoginScene = memo(() => {
  const login = useAppStore((state) => state.login);
  const setHasInitialized = useCharacterStore((state) => state.setHasInitialized);
  const hasInitialized = useCharacterStore((state) => state.hasInitialized);
  const { config: characterConfig } = useCharacterStore();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [error, setError] = useState('');
  const setUserInfo = useAuthStore((state) => state.setUserInfo);

  const currentAvatarUrl = characterConfig?.avatarStyle === '卡通2'
    ? getPublicUrl('/卡通数字人2.png')
    : getPublicUrl('/卡通数字人.png');

  const handleLogin = () => {
    if (!username.trim() || !password.trim()) {
      setError('请输入用户名和密码');
      return;
    }
    if (password.length < 6) {
      setError('密码长度至少 6 位');
      return;
    }
    setError('');
    setUserInfo({ id: 1, nickname: username.trim() }, { id: 1, nickname: '宝贝', avatar: 'default.png' });
    if (!hasInitialized) setHasInitialized(true);
    login();
  };

  const handleRegister = () => {
    if (!username.trim() || !password.trim()) {
      setError('请输入用户名和密码');
      return;
    }
    if (password.length < 6) {
      setError('密码长度至少 6 位');
      return;
    }
    setError('');
    setUserInfo({ id: 1, nickname: username.trim() }, { id: 1, nickname: '宝贝', avatar: 'default.png' });
    if (!hasInitialized) setHasInitialized(true);
    login();
  };

  return (
    <div className="relative min-h-screen w-full overflow-y-auto">
      {/* 背景 */}
      <div className="fixed inset-0 bg-gradient-to-br from-pink-300 via-purple-200 to-blue-300" />

      {/* 主内容 */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4 py-8">
        {/* 标题 */}
        <div className="text-center mb-4 animate-fade-in">
          <div className="text-4xl sm:text-5xl font-black mb-2" style={{
            background: 'linear-gradient(90deg, #FF6B6B, #FFA94D, #FFE066, #69DB7C, #4DABF7)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}>
            🌈 彩虹创口贴
          </div>
          <p className="text-white font-bold drop-shadow">✨ 你的情绪好朋友 ✨</p>
        </div>

        {/* 角色 */}
        <div className="mb-6 animate-float">
          <div className="absolute inset-0 bg-pink-300/30 rounded-full blur-2xl scale-125" />
          <img src={currentAvatarUrl} alt="角色" className="w-32 h-32 object-contain drop-shadow-xl relative z-10" loading="lazy" />
        </div>

        {/* 登录/注册切换 */}
        <div className="bg-white/20 backdrop-blur rounded-full p-1 mb-4 shadow-lg">
          <div className="flex gap-1">
            <TabButton active={isLoginMode} onClick={() => setIsLoginMode(true)}>🔑 登录</TabButton>
            <TabButton active={!isLoginMode} onClick={() => setIsLoginMode(false)}>📝 注册</TabButton>
          </div>
        </div>

        {/* 表单 */}
        <div className="bg-white/30 backdrop-blur rounded-3xl p-6 shadow-xl w-full max-w-sm animate-pop-in">
          <div className="space-y-3 mb-4">
            <CartoonInput value={username} onChange={setUsername} placeholder="👤 用户名" />
            <CartoonInput value={password} onChange={setPassword} placeholder="🔒 密码" type="password" />
          </div>

          {error && (
            <div className="bg-red-100/80 border-2 border-red-300 rounded-xl p-3 mb-4 text-center">
              <p className="text-red-600 font-bold text-sm">{error}</p>
            </div>
          )}

          <div className="flex justify-center mb-4">
            <RainbowButton onClick={isLoginMode ? handleLogin : handleRegister}>
              {isLoginMode ? '🌈 登录' : '✨ 注册'}
            </RainbowButton>
          </div>

          {/* 第三方登录 */}
          <div className="text-center">
            <p className="text-white/70 text-xs font-bold mb-2">其他方式登录</p>
            <div className="flex justify-center gap-3">
              {['💬', '🐧', '🍎'].map((icon, i) => (
                <button key={i} className="w-10 h-10 rounded-full bg-white/40 flex items-center justify-center text-xl hover:bg-white/60 transition-all active:scale-90">
                  {icon}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 底部提示 */}
        <p className="text-white/50 text-xs font-medium text-center mt-4 max-w-xs">
          登录即代表你同意《服务协议》和《隐私政策》
        </p>
      </div>
    </div>
  );
});

LoginScene.displayName = 'LoginScene';