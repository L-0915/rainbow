import { useState, useCallback, useEffect } from 'react';
import { LocalNotifications, ScheduleOptions, LocalNotificationSchema } from '@capacitor/local-notifications';
import { useEmotionStore } from '@/store/emotionStore';

export interface NotificationSettings {
  enabled: boolean;
  hour: number;
  minute: number;
  message: string;
}

const DEFAULT_SETTINGS: NotificationSettings = {
  enabled: true,
  hour: 20, // 晚上8点
  minute: 0,
  message: '小彩虹想你了～今天心情怎么样呀？🌈',
};

const STORAGE_KEY = 'rainbow_notification_settings';

// 提醒消息模板
const NOTIFICATION_MESSAGES = [
  '小彩虹想你了～今天心情怎么样呀？🌈',
  '今天过得怎么样？来记录一下心情吧！✨',
  '嘿！别忘了和小彩虹分享今天的故事哦～💕',
  '今天有什么开心的事想告诉小彩虹吗？🦋',
  '来聊聊今天的心情吧～小彩虹在等你！🌟',
];

/**
 * 每日提醒 Hook
 * 使用 Capacitor Local Notifications 实现本地通知
 */
export const useNotifications = () => {
  const [settings, setSettings] = useState<NotificationSettings>(DEFAULT_SETTINGS);
  const [isSupported, setIsSupported] = useState(false);
  const [permissionGranted, setPermissionGranted] = useState(false);
  const todayEmotion = useEmotionStore((state) => state.todayEmotion);

  // 加载设置
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        setSettings(JSON.parse(saved));
      } catch (e) {
        console.error('加载通知设置失败:', e);
      }
    }
  }, []);

  // 检查支持
  useEffect(() => {
    const checkSupport = async () => {
      try {
        // 检查是否在 Capacitor 环境中
        if (typeof window !== 'undefined' && 'Capacitor' in window) {
          setIsSupported(true);

          // 检查权限
          const result = await LocalNotifications.checkPermissions();
          setPermissionGranted(result.display === 'granted');
        } else {
          // Web 环境使用 Notification API 作为后备
          if ('Notification' in window) {
            setIsSupported(true);
            setPermissionGranted(Notification.permission === 'granted');
          }
        }
      } catch (e) {
        console.log('通知不支持:', e);
        setIsSupported(false);
      }
    };

    checkSupport();
  }, []);

  // 请求权限
  const requestPermission = useCallback(async (): Promise<boolean> => {
    try {
      if (typeof window !== 'undefined' && 'Capacitor' in window) {
        const result = await LocalNotifications.requestPermissions();
        const granted = result.display === 'granted';
        setPermissionGranted(granted);
        return granted;
      } else if ('Notification' in window) {
        const result = await Notification.requestPermission();
        const granted = result === 'granted';
        setPermissionGranted(granted);
        return granted;
      }
      return false;
    } catch (e) {
      console.error('请求通知权限失败:', e);
      return false;
    }
  }, []);

  // 保存设置
  const saveSettings = useCallback((newSettings: NotificationSettings) => {
    setSettings(newSettings);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newSettings));
  }, []);

  // 取消所有通知
  const cancelAllNotifications = useCallback(async () => {
    try {
      if (typeof window !== 'undefined' && 'Capacitor' in window) {
        await LocalNotifications.cancelAll();
      }
    } catch (e) {
      console.error('取消通知失败:', e);
    }
  }, []);

  // 调度每日通知
  const scheduleDailyNotification = useCallback(async (settings: NotificationSettings) => {
    if (!settings.enabled || !permissionGranted) return;

    try {
      // 取消现有通知
      await cancelAllNotifications();

      if (typeof window !== 'undefined' && 'Capacitor' in window) {
        // Capacitor 环境
        const now = new Date();
        const scheduledTime = new Date();
        scheduledTime.setHours(settings.hour, settings.minute, 0, 0);

        // 如果时间已过，安排到明天
        if (scheduledTime <= now) {
          scheduledTime.setDate(scheduledTime.getDate() + 1);
        }

        const notificationId = Date.now();

        const options: ScheduleOptions = {
          notifications: [
            {
              id: notificationId,
              title: '🌈 彩虹创口贴',
              body: settings.message,
              schedule: { at: scheduledTime },
              sound: 'default',
              actionTypeId: 'OPEN_APP',
            },
          ],
        };

        await LocalNotifications.schedule(options);

        // 设置重复通知（每天）
        // Capacitor 不直接支持重复，需要通过后台任务或重新调度
        console.log(`✅ 通知已安排: ${scheduledTime.toLocaleString()}`);
      } else {
        // Web 环境 - 使用 Service Worker 或简单提醒
        console.log('Web 环境，通知功能受限');
      }
    } catch (e) {
      console.error('调度通知失败:', e);
    }
  }, [permissionGranted, cancelAllNotifications]);

  // 立即发送测试通知
  const sendTestNotification = useCallback(async () => {
    if (!permissionGranted) {
      const granted = await requestPermission();
      if (!granted) return;
    }

    try {
      if (typeof window !== 'undefined' && 'Capacitor' in window) {
        await LocalNotifications.schedule({
          notifications: [
            {
              id: Date.now(),
              title: '🌈 彩虹创口贴',
              body: '这是一条测试通知～小彩虹在等你哦！',
              sound: 'default',
            },
          ],
        });
      } else if ('Notification' in window) {
        new Notification('🌈 彩虹创口贴', {
          body: '这是一条测试通知～小彩虹在等你哦！',
          icon: '/icon.png',
        });
      }
    } catch (e) {
      console.error('发送测试通知失败:', e);
    }
  }, [permissionGranted, requestPermission]);

  // 当设置改变或今天未记录心情时，调度通知
  useEffect(() => {
    if (settings.enabled && permissionGranted && !todayEmotion) {
      scheduleDailyNotification(settings);
    }
  }, [settings, permissionGranted, todayEmotion, scheduleDailyNotification]);

  // 设置变更时更新通知
  const updateSettings = useCallback(async (newSettings: Partial<NotificationSettings>) => {
    const updated = { ...settings, ...newSettings };
    saveSettings(updated);

    if (updated.enabled && permissionGranted) {
      await scheduleDailyNotification(updated);
    } else if (!updated.enabled) {
      await cancelAllNotifications();
    }
  }, [settings, saveSettings, permissionGranted, scheduleDailyNotification, cancelAllNotifications]);

  return {
    settings,
    isSupported,
    permissionGranted,
    requestPermission,
    updateSettings,
    sendTestNotification,
    cancelAllNotifications,
    notificationMessages: NOTIFICATION_MESSAGES,
  };
};