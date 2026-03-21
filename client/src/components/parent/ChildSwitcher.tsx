import { useState, useEffect, useCallback, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export interface ChildProfile {
  id: string;
  name: string;
  avatar: string;
  birthYear?: number;
  createdAt: string;
}

interface ChildSwitcherProps {
  currentChildId: string | null;
  onSwitch: (childId: string) => void;
  onAddChild: (child: Omit<ChildProfile, 'id' | 'createdAt'>) => void;
}

const STORAGE_KEY = 'rainbow_child_profiles';
const CURRENT_CHILD_KEY = 'rainbow_current_child';

const DEFAULT_AVATARS = ['👧', '👦', '🧒', '👶', '🧑'];

export const ChildSwitcher = memo(({ currentChildId, onSwitch, onAddChild }: ChildSwitcherProps) => {
  const [children, setChildren] = useState<ChildProfile[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newChildName, setNewChildName] = useState('');
  const [newChildAvatar, setNewChildAvatar] = useState(DEFAULT_AVATARS[0]);
  const [isOpen, setIsOpen] = useState(false);

  // 加载孩子列表
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        setChildren(JSON.parse(stored));
      } catch (e) {
        console.error('加载孩子列表失败:', e);
      }
    }
  }, []);

  // 保存孩子列表
  const saveChildren = useCallback((newChildren: ChildProfile[]) => {
    setChildren(newChildren);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newChildren));
  }, []);

  // 添加孩子
  const handleAddChild = useCallback(() => {
    if (!newChildName.trim()) return;

    const newChild: ChildProfile = {
      id: `child_${Date.now()}`,
      name: newChildName.trim(),
      avatar: newChildAvatar,
      createdAt: new Date().toISOString(),
    };

    const updated = [...children, newChild];
    saveChildren(updated);
    setNewChildName('');
    setShowAddForm(false);
    onSwitch(newChild.id);
    localStorage.setItem(CURRENT_CHILD_KEY, newChild.id);
  }, [children, newChildName, newChildAvatar, saveChildren, onSwitch]);

  // 切换孩子
  const handleSwitch = useCallback((childId: string) => {
    onSwitch(childId);
    localStorage.setItem(CURRENT_CHILD_KEY, childId);
    setIsOpen(false);
  }, [onSwitch]);

  // 删除孩子
  const handleDelete = useCallback((childId: string) => {
    if (!confirm('确定要删除这个孩子的数据吗？此操作不可恢复。')) return;

    const updated = children.filter(c => c.id !== childId);
    saveChildren(updated);

    if (currentChildId === childId && updated.length > 0) {
      onSwitch(updated[0].id);
      localStorage.setItem(CURRENT_CHILD_KEY, updated[0].id);
    }
  }, [children, currentChildId, saveChildren, onSwitch]);

  const currentChild = children.find(c => c.id === currentChildId);

  return (
    <>
      {/* 当前孩子显示 */}
      <motion.button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 bg-white/80 backdrop-blur-xl rounded-full px-4 py-2 shadow-lg"
        whileTap={{ scale: 0.95 }}
      >
        <span className="text-2xl">{currentChild?.avatar || '👧'}</span>
        <span className="font-bold text-gray-700">{currentChild?.name || '添加孩子'}</span>
        <span className="text-gray-400">▼</span>
      </motion.button>

      {/* 切换弹窗 */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="fixed inset-0 z-50 flex items-end justify-center bg-black/50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
          >
            <motion.div
              className="bg-white w-full max-w-lg rounded-t-3xl max-h-[70vh] overflow-hidden"
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              onClick={e => e.stopPropagation()}
            >
              {/* 标题 */}
              <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                <h2 className="text-lg font-bold text-gray-700">选择孩子</h2>
                <button onClick={() => setIsOpen(false)} className="text-gray-400 text-xl">✕</button>
              </div>

              {/* 孩子列表 */}
              <div className="p-4 space-y-2 max-h-[40vh] overflow-y-auto">
                {children.map((child) => (
                  <motion.div
                    key={child.id}
                    className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all ${
                      child.id === currentChildId
                        ? 'bg-purple-100 border-2 border-purple-300'
                        : 'bg-gray-50 hover:bg-gray-100'
                    }`}
                    onClick={() => handleSwitch(child.id)}
                    whileTap={{ scale: 0.98 }}
                  >
                    <span className="text-3xl">{child.avatar}</span>
                    <div className="flex-1">
                      <p className="font-bold text-gray-700">{child.name}</p>
                      <p className="text-xs text-gray-400">
                        添加于 {new Date(child.createdAt).toLocaleDateString('zh-CN')}
                      </p>
                    </div>
                    {child.id === currentChildId && (
                      <span className="text-purple-500 text-xl">✓</span>
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(child.id);
                      }}
                      className="text-red-400 text-sm px-2"
                    >
                      删除
                    </button>
                  </motion.div>
                ))}

                {children.length === 0 && (
                  <div className="text-center py-8">
                    <p className="text-gray-400">还没有添加孩子</p>
                  </div>
                )}
              </div>

              {/* 添加新孩子 */}
              <div className="p-4 border-t border-gray-100">
                {showAddForm ? (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      {/* 头像选择 */}
                      <div className="flex gap-1">
                        {DEFAULT_AVATARS.map((avatar) => (
                          <button
                            key={avatar}
                            onClick={() => setNewChildAvatar(avatar)}
                            className={`text-2xl p-1 rounded-lg ${
                              newChildAvatar === avatar ? 'bg-purple-100' : ''
                            }`}
                          >
                            {avatar}
                          </button>
                        ))}
                      </div>
                    </div>

                    <input
                      type="text"
                      value={newChildName}
                      onChange={(e) => setNewChildName(e.target.value)}
                      placeholder="输入孩子昵称"
                      className="w-full px-4 py-2 rounded-xl border-2 border-gray-200 focus:border-purple-400 focus:outline-none"
                    />

                    <div className="flex gap-2">
                      <motion.button
                        onClick={handleAddChild}
                        disabled={!newChildName.trim()}
                        className="flex-1 bg-purple-500 text-white font-bold py-2 rounded-xl disabled:opacity-50"
                        whileTap={{ scale: 0.95 }}
                      >
                        添加
                      </motion.button>
                      <motion.button
                        onClick={() => setShowAddForm(false)}
                        className="flex-1 bg-gray-200 text-gray-600 font-bold py-2 rounded-xl"
                        whileTap={{ scale: 0.95 }}
                      >
                        取消
                      </motion.button>
                    </div>
                  </div>
                ) : (
                  <motion.button
                    onClick={() => setShowAddForm(true)}
                    className="w-full bg-gradient-to-r from-purple-400 to-pink-400 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2"
                    whileTap={{ scale: 0.95 }}
                  >
                    <span>➕</span> 添加孩子
                  </motion.button>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
});

ChildSwitcher.displayName = 'ChildSwitcher';

// Hook 用于管理当前孩子
export const useCurrentChild = () => {
  const getChildId = (): string => {
    return localStorage.getItem(CURRENT_CHILD_KEY) || 'default';
  };

  const setChildId = (id: string) => {
    localStorage.setItem(CURRENT_CHILD_KEY, id);
  };

  return { getChildId, setChildId };
};