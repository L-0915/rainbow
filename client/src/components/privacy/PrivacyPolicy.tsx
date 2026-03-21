import { useState, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface PrivacyPolicyProps {
  isOpen: boolean;
  onClose: () => void;
  onAgree?: () => void;
  showAgreeButton?: boolean;
}

export const PrivacyPolicy = memo(({ isOpen, onClose, onAgree, showAgreeButton = false }: PrivacyPolicyProps) => {
  const [scrolledToBottom, setScrolledToBottom] = useState(false);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    if (scrollTop + clientHeight >= scrollHeight - 50) {
      setScrolledToBottom(true);
    }
  };

  if (!isOpen) return null;

  return (
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
        className="bg-white w-full max-w-lg rounded-t-3xl max-h-[85vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* 标题 */}
        <div className="p-4 border-b border-gray-100 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🔒</span>
            <h2 className="text-lg font-black text-gray-700">隐私政策与用户协议</h2>
          </div>
          <button onClick={onClose} className="text-gray-400 text-xl">✕</button>
        </div>

        {/* 内容 */}
        <div
          className="flex-1 overflow-y-auto p-4 text-sm text-gray-600 leading-relaxed"
          onScroll={handleScroll}
        >
          <section className="mb-6">
            <h3 className="font-bold text-gray-700 mb-2">🌈 欢迎使用彩虹创口贴</h3>
            <p>
              彩虹创口贴是一款专为6-12岁儿童设计的情绪管理应用。我们非常重视您和孩子的隐私保护，请仔细阅读以下内容。
            </p>
          </section>

          <section className="mb-6">
            <h3 className="font-bold text-gray-700 mb-2">📊 数据收集说明</h3>
            <p className="mb-2">我们会收集以下数据以提供服务：</p>
            <ul className="list-disc list-inside space-y-1 text-gray-500">
              <li><strong>情绪记录</strong>：孩子记录的心情数据</li>
              <li><strong>聊天内容</strong>：与小彩虹AI的对话记录</li>
              <li><strong>使用数据</strong>：应用使用时长、功能使用情况</li>
            </ul>
          </section>

          <section className="mb-6">
            <h3 className="font-bold text-gray-700 mb-2">🔐 数据安全承诺</h3>
            <ul className="space-y-2">
              <li className="flex items-start gap-2">
                <span className="text-green-500">✓</span>
                <span>数据加密存储，防止信息泄露</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-500">✓</span>
                <span>不会向第三方出售或分享用户数据</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-500">✓</span>
                <span>家长可随时查看、导出或删除孩子数据</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-500">✓</span>
                <span>数据优先存储在本地设备</span>
              </li>
            </ul>
          </section>

          <section className="mb-6">
            <h3 className="font-bold text-gray-700 mb-2">👶 儿童保护条款</h3>
            <ul className="space-y-2">
              <li className="flex items-start gap-2">
                <span className="text-blue-500">🛡️</span>
                <span>AI对话内容经过安全过滤，确保适合儿童</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-500">🛡️</span>
                <span>无广告、无外链、无诱导消费</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-500">🛡️</span>
                <span>家长端需身份验证才能查看孩子数据</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-500">🛡️</span>
                <span>异常情绪自动提醒家长</span>
              </li>
            </ul>
          </section>

          <section className="mb-6">
            <h3 className="font-bold text-gray-700 mb-2">👨‍👩‍👧 家长权利</h3>
            <p className="mb-2">作为家长，您有以下权利：</p>
            <ul className="list-disc list-inside space-y-1 text-gray-500">
              <li>查看孩子的情绪记录和聊天内容</li>
              <li>设置使用时间限制</li>
              <li>申请导出或删除所有数据</li>
              <li>随时解除家长-孩子绑定</li>
            </ul>
          </section>

          <section className="mb-6">
            <h3 className="font-bold text-gray-700 mb-2">⚠️ 免责声明</h3>
            <p className="text-gray-500">
              本应用提供的AI聊天功能仅供参考和陪伴用途，不构成专业心理咨询建议。如孩子出现严重情绪问题，请及时寻求专业帮助。
            </p>
          </section>

          <section className="mb-6">
            <h3 className="font-bold text-gray-700 mb-2">📞 联系我们</h3>
            <p className="text-gray-500">
              如有疑问或建议，请联系：<br />
              邮箱：support@rainbow-bandage.com<br />
              微信公众号：彩虹创口贴
            </p>
          </section>

          <section>
            <p className="text-gray-400 text-xs text-center">
              最后更新：2024年3月<br />
              版本：V1.0
            </p>
          </section>
        </div>

        {/* 底部按钮 */}
        <div className="p-4 border-t border-gray-100 flex-shrink-0">
          {showAgreeButton ? (
            <motion.button
              onClick={onAgree}
              disabled={!scrolledToBottom}
              className={`w-full py-3 rounded-xl font-bold text-white transition-all ${
                scrolledToBottom
                  ? 'bg-gradient-to-r from-purple-400 to-pink-400'
                  : 'bg-gray-300 cursor-not-allowed'
              }`}
              whileTap={scrolledToBottom ? { scale: 0.95 } : {}}
            >
              {scrolledToBottom ? '我已阅读并同意' : '请先阅读完整内容'}
            </motion.button>
          ) : (
            <motion.button
              onClick={onClose}
              className="w-full py-3 rounded-xl font-bold text-gray-600 bg-gray-100"
              whileTap={{ scale: 0.95 }}
            >
              关闭
            </motion.button>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
});

PrivacyPolicy.displayName = 'PrivacyPolicy';