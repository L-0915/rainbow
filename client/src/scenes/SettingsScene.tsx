import { useState, memo } from 'react';
import { motion } from 'framer-motion';
import { NotificationSettingsPanel } from '@/components/settings/NotificationSettingsPanel';
import { PrivacyPolicy } from '@/components/privacy/PrivacyPolicy';
import { useAppStore } from '@/store/appStore';
import { useTheme, ThemeToggle } from '@/hooks/useTheme';

interface SettingsSceneProps {
  onBack: () => void;
}

export const SettingsScene = memo(({ onBack }: SettingsSceneProps) => {
  const [showNotificationSettings, setShowNotificationSettings] = useState(false);
  const [showPrivacyPolicy, setShowPrivacyPolicy] = useState(false);
  const logout = useAppStore((state) => state.logout);
  const { theme } = useTheme();

  const handleLogout = () => {
    if (confirm('确定要退出登录吗？')) {
      logout();
    }
  };

  const settingsGroups = [
    {
      title: '显示设置',
      items: [
        {
          icon: theme === 'dark' ? '🌙' : theme === 'light' ? '☀️' : '🔄',
          label: '深色模式',
          description: theme === 'auto' ? '跟随系统' : theme === 'dark' ? '已开启' : '已关闭',
          customAction: 'toggle',
        },
      ],
    },
    {
      title: '提醒设置',
      items: [
        {
          icon: '🔔',
          label: '每日提醒',
          description: '设置提醒时间，不忘记记录心情',
          onClick: () => setShowNotificationSettings(true),
        },
      ],
    },
    {
      title: '关于',
      items: [
        {
          icon: '🔒',
          label: '隐私政策',
          description: '了解我们如何保护您的隐私',
          onClick: () => setShowPrivacyPolicy(true),
        },
        {
          icon: '📱',
          label: '版本信息',
          description: '彩虹创口贴 v1.0.0',
          onClick: () => {},
        },
        {
          icon: '💬',
          label: '意见反馈',
          description: '帮助我们做得更好',
          onClick: () => alert('反馈邮箱：support@rainbow-bandage.com'),
        },
      ],
    },
    {
      title: '账号',
      items: [
        {
          icon: '🚪',
          label: '退出登录',
          description: '',
          onClick: handleLogout,
          danger: true,
        },
      ],
    },
  ];

  return (
    <div className="relative min-h-screen w-full overflow-hidden">
      {/* 背景 */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-100 via-pink-50 to-blue-100" />

      {/* 顶部栏 */}
      <div className="relative z-10 p-4 pt-12 flex items-center gap-4">
        <motion.button
          onClick={onBack}
          className="w-10 h-10 rounded-full bg-white/80 backdrop-blur-xl flex items-center justify-center text-gray-600 shadow-lg"
          whileTap={{ scale: 0.9 }}
        >
          ←
        </motion.button>
        <h1 className="text-xl font-bold text-gray-700">设置</h1>
      </div>

      {/* 设置列表 */}
      <div className="relative z-10 px-4 py-6 space-y-6">
        {settingsGroups.map((group, groupIndex) => (
          <motion.div
            key={group.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: groupIndex * 0.1 }}
          >
            <h2 className="text-sm font-bold text-gray-400 mb-2 px-2">{group.title}</h2>
            <div className="bg-white/80 backdrop-blur-xl rounded-2xl overflow-hidden shadow-lg">
              {group.items.map((item, itemIndex) => (
                <div
                  key={item.label}
                  className={`w-full flex items-center gap-4 p-4 text-left transition-colors hover:bg-gray-50 ${
                    itemIndex !== group.items.length - 1 ? 'border-b border-gray-100' : ''
                  }`}
                >
                  <span className="text-2xl">{item.icon}</span>
                  <div className="flex-1">
                    <p className={`font-bold ${item.danger ? 'text-red-500' : 'text-gray-700'}`}>
                      {item.label}
                    </p>
                    {item.description && (
                      <p className="text-sm text-gray-400">{item.description}</p>
                    )}
                  </div>
                  {item.customAction === 'toggle' ? (
                    <ThemeToggle />
                  ) : item.onClick ? (
                    <motion.button
                      onClick={item.onClick}
                      className="text-gray-300"
                      whileTap={{ scale: 0.95 }}
                    >
                      ›
                    </motion.button>
                  ) : null}
                </div>
              ))}
            </div>
          </motion.div>
        ))}

        {/* Logo 和版权 */}
        <div className="text-center pt-6">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.3, type: 'spring' }}
            className="text-4xl mb-2"
          >
            🌈
          </motion.div>
          <p className="text-gray-500 font-bold">彩虹创口贴</p>
          <p className="text-gray-400 text-xs mt-1">孩子的情绪创可贴，家长的安心守护</p>
          <p className="text-gray-300 text-xs mt-4">© 2024 Rainbow Bandage. All rights reserved.</p>
        </div>
      </div>

      {/* 通知设置面板 */}
      <NotificationSettingsPanel
        isOpen={showNotificationSettings}
        onClose={() => setShowNotificationSettings(false)}
      />

      {/* 隐私政策 */}
      <PrivacyPolicy
        isOpen={showPrivacyPolicy}
        onClose={() => setShowPrivacyPolicy(false)}
      />
    </div>
  );
});

SettingsScene.displayName = 'SettingsScene';