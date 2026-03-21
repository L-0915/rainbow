import { useState, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNotifications, type NotificationSettings } from '@/hooks/useNotifications';

interface NotificationSettingsProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NotificationSettingsPanel = memo(({ isOpen, onClose }: NotificationSettingsProps) => {
  const {
    settings,
    isSupported,
    permissionGranted,
    requestPermission,
    updateSettings,
    sendTestNotification,
    notificationMessages,
  } = useNotifications();

  const [selectedMessage, setSelectedMessage] = useState(settings.message);

  if (!isOpen) return null;

  const handleToggle = async () => {
    if (!permissionGranted && !settings.enabled) {
      const granted = await requestPermission();
      if (!granted) {
        alert('需要通知权限才能启用提醒功能');
        return;
      }
    }
    await updateSettings({ enabled: !settings.enabled });
  };

  const handleTimeChange = (hour: number, minute: number) => {
    updateSettings({ hour, minute });
  };

  const handleMessageSelect = (message: string) => {
    setSelectedMessage(message);
    updateSettings({ message });
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-end justify-center bg-black/50"
        onClick={onClose}
      >
        <motion.div
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="bg-white w-full max-w-lg rounded-t-3xl max-h-[80vh] overflow-hidden"
          onClick={e => e.stopPropagation()}
        >
          {/* 标题 */}
          <div className="p-4 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-2xl">🔔</span>
              <h2 className="text-lg font-bold text-gray-700">提醒设置</h2>
            </div>
            <button onClick={onClose} className="text-gray-400 text-xl">✕</button>
          </div>

          {/* 不支持提示 */}
          {!isSupported && (
            <div className="p-4 bg-yellow-50 border-b border-yellow-100">
              <p className="text-yellow-700 text-sm">
                ⚠️ 您的设备不支持通知功能，请使用支持通知的浏览器或安装App
              </p>
            </div>
          )}

          {/* 内容 */}
          <div className="p-4 space-y-6 overflow-y-auto">
            {/* 开关 */}
            <div className="flex items-center justify-between">
              <div>
                <p className="font-bold text-gray-700">每日提醒</p>
                <p className="text-sm text-gray-400">提醒孩子记录每天的心情</p>
              </div>
              <motion.button
                onClick={handleToggle}
                disabled={!isSupported}
                className={`w-14 h-8 rounded-full relative transition-colors ${
                  settings.enabled && permissionGranted
                    ? 'bg-gradient-to-r from-purple-400 to-pink-400'
                    : 'bg-gray-200'
                }`}
                whileTap={{ scale: 0.95 }}
              >
                <motion.div
                  className="w-6 h-6 bg-white rounded-full absolute top-1 shadow-md"
                  animate={{
                    left: settings.enabled && permissionGranted ? '30px' : '4px',
                  }}
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                />
              </motion.button>
            </div>

            {/* 权限提示 */}
            {isSupported && !permissionGranted && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-blue-50 rounded-xl p-4"
              >
                <p className="text-blue-700 text-sm mb-3">
                  需要授权通知权限才能发送提醒
                </p>
                <motion.button
                  onClick={requestPermission}
                  className="bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-bold"
                  whileTap={{ scale: 0.95 }}
                >
                  授权通知
                </motion.button>
              </motion.div>
            )}

            {/* 时间选择 */}
            {settings.enabled && permissionGranted && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="space-y-4"
              >
                <div>
                  <p className="font-bold text-gray-700 mb-3">提醒时间</p>
                  <div className="flex items-center gap-4">
                    <select
                      value={settings.hour}
                      onChange={(e) => handleTimeChange(parseInt(e.target.value), settings.minute)}
                      className="flex-1 bg-gray-100 rounded-xl px-4 py-3 text-center text-xl font-bold text-gray-700 appearance-none"
                    >
                      {Array.from({ length: 24 }, (_, i) => (
                        <option key={i} value={i}>{String(i).padStart(2, '0')}时</option>
                      ))}
                    </select>
                    <span className="text-2xl text-gray-400">:</span>
                    <select
                      value={settings.minute}
                      onChange={(e) => handleTimeChange(settings.hour, parseInt(e.target.value))}
                      className="flex-1 bg-gray-100 rounded-xl px-4 py-3 text-center text-xl font-bold text-gray-700 appearance-none"
                    >
                      {[0, 15, 30, 45].map((m) => (
                        <option key={m} value={m}>{String(m).padStart(2, '0')}分</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* 提醒消息选择 */}
                <div>
                  <p className="font-bold text-gray-700 mb-3">提醒消息</p>
                  <div className="space-y-2">
                    {notificationMessages.map((msg, index) => (
                      <motion.button
                        key={index}
                        onClick={() => handleMessageSelect(msg)}
                        className={`w-full text-left p-3 rounded-xl text-sm transition-all ${
                          selectedMessage === msg
                            ? 'bg-purple-100 border-2 border-purple-300 text-purple-700'
                            : 'bg-gray-50 border-2 border-transparent text-gray-600 hover:bg-gray-100'
                        }`}
                        whileTap={{ scale: 0.98 }}
                      >
                        {msg}
                      </motion.button>
                    ))}
                  </div>
                </div>

                {/* 测试按钮 */}
                <motion.button
                  onClick={sendTestNotification}
                  className="w-full bg-gradient-to-r from-purple-400 to-pink-400 text-white font-bold py-3 rounded-xl"
                  whileTap={{ scale: 0.95 }}
                >
                  发送测试通知
                </motion.button>

                {/* 预览 */}
                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-xs text-gray-400 mb-2">预览</p>
                  <div className="bg-white rounded-lg p-3 shadow-sm border border-gray-100">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm">🌈</span>
                      <span className="font-bold text-gray-700 text-sm">彩虹创口贴</span>
                      <span className="text-xs text-gray-400">现在</span>
                    </div>
                    <p className="text-gray-600 text-sm">{settings.message}</p>
                  </div>
                </div>
              </motion.div>
            )}
          </div>

          {/* 底部 */}
          <div className="p-4 border-t border-gray-100">
            <p className="text-xs text-gray-400 text-center">
              💡 提醒只会在今天还没有记录心情时发送
            </p>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
});

NotificationSettingsPanel.displayName = 'NotificationSettingsPanel';