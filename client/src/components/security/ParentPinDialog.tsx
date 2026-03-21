import { useState, useCallback, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ParentAuth, InputValidator } from '@/utils/security';

interface ParentPinDialogProps {
  isOpen: boolean;
  onSuccess: () => void;
  onClose?: () => void;
  mode?: 'verify' | 'set';
}

/**
 * 家长密码验证/设置对话框
 */
export const ParentPinDialog = memo(({ isOpen, onSuccess, onClose, mode = 'verify' }: ParentPinDialogProps) => {
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [error, setError] = useState('');
  const [step, setStep] = useState<'input' | 'confirm'>('input');

  const handleVerify = useCallback(() => {
    if (mode === 'set') {
      const validation = InputValidator.pin(pin);
      if (!validation.valid) {
        setError(validation.message);
        return;
      }

      if (step === 'input') {
        setStep('confirm');
        setError('');
      } else {
        if (pin !== confirmPin) {
          setError('两次输入的密码不一致');
          return;
        }
        ParentAuth.setPin(pin);
        onSuccess();
        setPin('');
        setConfirmPin('');
        setStep('input');
      }
    } else {
      if (ParentAuth.verifyPin(pin)) {
        onSuccess();
        setPin('');
        setError('');
      } else {
        setError('密码错误，请重试');
      }
    }
  }, [pin, confirmPin, mode, step, onSuccess]);

  const handleNumberClick = useCallback((num: string) => {
    const currentPin = step === 'confirm' ? confirmPin : pin;
    if (currentPin.length < 4) {
      if (step === 'confirm') {
        setConfirmPin(confirmPin + num);
      } else {
        setPin(pin + num);
      }
      setError('');
    }
  }, [pin, confirmPin, step]);

  const handleDelete = useCallback(() => {
    if (step === 'confirm') {
      setConfirmPin(confirmPin.slice(0, -1));
    } else {
      setPin(pin.slice(0, -1));
    }
    setError('');
  }, [pin, confirmPin, step]);

  const handleClear = useCallback(() => {
    if (step === 'confirm') {
      setConfirmPin('');
    } else {
      setPin('');
    }
    setError('');
  }, [step]);

  if (!isOpen) return null;

  const currentPin = step === 'confirm' ? confirmPin : pin;
  const title = mode === 'set'
    ? (step === 'confirm' ? '确认新密码' : '设置家长密码')
    : '输入家长密码';
  const subtitle = mode === 'set'
    ? '设置4位数字密码保护家长端'
    : '请输入密码访问家长功能';

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[150] flex items-center justify-center bg-black/50"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div
          className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl"
          initial={{ scale: 0.8, y: 50 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.8, y: 50 }}
        >
          {/* 标题 */}
          <div className="text-center mb-6">
            <div className="text-4xl mb-2">🔐</div>
            <h3 className="text-xl font-bold text-gray-700">{title}</h3>
            <p className="text-sm text-gray-400 mt-1">{subtitle}</p>
          </div>

          {/* PIN 显示 */}
          <div className="flex justify-center gap-3 mb-6">
            {[0, 1, 2, 3].map((i) => (
              <div
                key={i}
                className={`w-12 h-12 rounded-xl border-2 flex items-center justify-center text-2xl font-bold ${
                  i < currentPin.length
                    ? 'bg-purple-100 border-purple-400 text-purple-600'
                    : 'bg-gray-100 border-gray-200'
                }`}
              >
                {i < currentPin.length ? '●' : ''}
              </div>
            ))}
          </div>

          {/* 错误提示 */}
          {error && (
            <motion.p
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-red-500 text-sm text-center mb-4"
            >
              {error}
            </motion.p>
          )}

          {/* 数字键盘 */}
          <div className="grid grid-cols-3 gap-2 mb-4">
            {['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'del'].map((num, i) => {
              if (num === '') {
                return <div key={i} />;
              }

              if (num === 'del') {
                return (
                  <motion.button
                    key={i}
                    onClick={handleDelete}
                    className="h-14 rounded-xl bg-gray-100 text-gray-600 font-bold text-lg"
                    whileTap={{ scale: 0.95 }}
                  >
                    ⌫
                  </motion.button>
                );
              }

              return (
                <motion.button
                  key={i}
                  onClick={() => handleNumberClick(num)}
                  className="h-14 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xl"
                  whileTap={{ scale: 0.95 }}
                >
                  {num}
                </motion.button>
              );
            })}
          </div>

          {/* 操作按钮 */}
          <div className="flex gap-3">
            {onClose && (
              <motion.button
                onClick={onClose}
                className="flex-1 bg-gray-200 text-gray-600 font-bold py-3 rounded-xl"
                whileTap={{ scale: 0.95 }}
              >
                取消
              </motion.button>
            )}
            <motion.button
              onClick={handleVerify}
              disabled={currentPin.length !== 4}
              className="flex-1 bg-gradient-to-r from-purple-400 to-pink-400 text-white font-bold py-3 rounded-xl disabled:opacity-50"
              whileTap={{ scale: 0.95 }}
            >
              {mode === 'set' ? (step === 'confirm' ? '确认' : '下一步') : '确认'}
            </motion.button>
          </div>

          {/* 清除按钮 */}
          {mode === 'verify' && ParentAuth.hasPin() && (
            <motion.button
              onClick={() => {
                if (confirm('确定要清除家长密码吗？')) {
                  ParentAuth.clearPin();
                  onSuccess();
                }
              }}
              className="w-full mt-3 text-gray-400 text-sm"
              whileTap={{ scale: 0.95 }}
            >
              忘记密码？清除重置
            </motion.button>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
});

ParentPinDialog.displayName = 'ParentPinDialog';