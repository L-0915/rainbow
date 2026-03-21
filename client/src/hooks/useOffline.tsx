import { useState, useEffect, useCallback, useRef } from 'react';

interface OfflineQueueItem {
  id: string;
  type: 'emotion' | 'bottle' | 'achievement';
  data: any;
  timestamp: number;
  retries: number;
}

interface UseOfflineResult {
  isOnline: boolean;
  isOffline: boolean;
  queue: OfflineQueueItem[];
  addToQueue: (type: OfflineQueueItem['type'], data: any) => void;
  syncQueue: () => Promise<void>;
  clearQueue: () => void;
  pendingCount: number;
}

const QUEUE_STORAGE_KEY = 'rainbow_offline_queue';
const MAX_RETRIES = 3;

/**
 * 离线模式 Hook
 * 支持离线保存数据，网络恢复后自动同步
 */
export const useOffline = (): UseOfflineResult => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [queue, setQueue] = useState<OfflineQueueItem[]>([]);
  const syncInProgress = useRef(false);

  // 初始化：加载离线队列
  useEffect(() => {
    const stored = localStorage.getItem(QUEUE_STORAGE_KEY);
    if (stored) {
      try {
        setQueue(JSON.parse(stored));
      } catch (e) {
        console.error('加载离线队列失败:', e);
      }
    }
  }, []);

  // 监听网络状态
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      // 网络恢复时自动同步
      syncQueue();
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // 保存队列到本地
  const saveQueue = useCallback((newQueue: OfflineQueueItem[]) => {
    setQueue(newQueue);
    localStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(newQueue));
  }, []);

  // 添加到离线队列
  const addToQueue = useCallback((type: OfflineQueueItem['type'], data: any) => {
    const item: OfflineQueueItem = {
      id: `${type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      data,
      timestamp: Date.now(),
      retries: 0,
    };

    saveQueue([...queue, item]);
    console.log(`📦 已添加到离线队列: ${type}`, item.id);
  }, [queue, saveQueue]);

  // 同步队列
  const syncQueue = useCallback(async () => {
    if (syncInProgress.current || queue.length === 0 || !navigator.onLine) {
      return;
    }

    syncInProgress.current = true;
    console.log(`🔄 开始同步离线队列，共 ${queue.length} 条`);

    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';
    const failedItems: OfflineQueueItem[] = [];

    for (const item of queue) {
      try {
        let endpoint = '';
        let method = 'POST';

        switch (item.type) {
          case 'emotion':
            endpoint = `${API_BASE_URL}/api/children/1/emotions`;
            break;
          case 'bottle':
            endpoint = `${API_BASE_URL}/api/children/1/bottles`;
            break;
          case 'achievement':
            endpoint = `${API_BASE_URL}/api/children/1/achievements`;
            break;
        }

        const response = await fetch(endpoint, {
          method,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(item.data),
        });

        if (response.ok) {
          console.log(`✅ 同步成功: ${item.type} - ${item.id}`);
        } else {
          throw new Error(`HTTP ${response.status}`);
        }
      } catch (error) {
        console.error(`❌ 同步失败: ${item.type} - ${item.id}`, error);

        // 重试次数未超限，加入失败列表
        if (item.retries < MAX_RETRIES) {
          failedItems.push({
            ...item,
            retries: item.retries + 1,
          });
        }
      }
    }

    // 更新队列（移除成功的，保留失败的）
    saveQueue(failedItems);

    if (failedItems.length === 0 && queue.length > 0) {
      console.log('🎉 所有离线数据已同步完成！');
      // 可以触发一个事件或回调通知用户
      window.dispatchEvent(new CustomEvent('rainbow:sync-complete'));
    }

    syncInProgress.current = false;
  }, [queue, saveQueue]);

  // 清空队列
  const clearQueue = useCallback(() => {
    saveQueue([]);
  }, [saveQueue]);

  return {
    isOnline,
    isOffline: !isOnline,
    queue,
    addToQueue,
    syncQueue,
    clearQueue,
    pendingCount: queue.length,
  };
};

/**
 * 离线状态指示器组件
 */
export const OfflineIndicator = () => {
  const { isOffline, pendingCount } = useOffline();

  if (!isOffline && pendingCount === 0) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[100] bg-yellow-500 text-white text-center py-2 text-sm font-bold">
      {isOffline ? (
        <span>📴 当前离线，数据将在网络恢复后同步</span>
      ) : pendingCount > 0 ? (
        <span>📤 {pendingCount} 条数据等待同步中...</span>
      ) : null}
    </div>
  );
};