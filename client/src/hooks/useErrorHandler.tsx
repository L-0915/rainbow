import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export type ErrorType = 'network' | 'server' | 'timeout' | 'unknown';

export interface AppError {
  type: ErrorType;
  message: string;
  details?: string;
  retry?: () => void;
}

interface UseErrorHandlerResult {
  error: AppError | null;
  showError: (error: AppError) => void;
  hideError: () => void;
  handleApiError: (error: any, retry?: () => void) => void;
  ErrorDialog: React.FC;
}

/**
 * 错误处理 Hook
 */
export const useErrorHandler = (): UseErrorHandlerResult => {
  const [error, setError] = useState<AppError | null>(null);

  const showError = useCallback((err: AppError) => {
    setError(err);
  }, []);

  const hideError = useCallback(() => {
    setError(null);
  }, []);

  const handleApiError = useCallback((err: any, retry?: () => void) => {
    console.error('API Error:', err);

    let type: ErrorType = 'unknown';
    let message = '发生了一个错误';

    if (err.name === 'TypeError' && err.message.includes('fetch')) {
      type = 'network';
      message = '网络连接失败，请检查网络设置';
    } else if (err.message?.includes('timeout')) {
      type = 'timeout';
      message = '请求超时，请稍后重试';
    } else if (err.status >= 500) {
      type = 'server';
      message = '服务器开小差了，请稍后重试';
    } else if (err.status >= 400) {
      type = 'server';
      message = '请求参数有误';
    }

    showError({
      type,
      message,
      details: err.message,
      retry,
    });
  }, [showError]);

  const ErrorDialog = () => {
    if (!error) return null;

    const icons: Record<ErrorType, string> = {
      network: '📡',
      server: '🔧',
      timeout: '⏰',
      unknown: '❓',
    };

    const colors: Record<ErrorType, string> = {
      network: 'from-orange-400 to-red-400',
      server: 'from-purple-400 to-pink-400',
      timeout: 'from-yellow-400 to-orange-400',
      unknown: 'from-gray-400 to-gray-500',
    };

    return (
      <AnimatePresence>
        <motion.div
          className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/50"
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
            <div className="text-center">
              <motion.div
                className={`w-20 h-20 mx-auto rounded-full bg-gradient-to-br ${colors[error.type]} flex items-center justify-center text-4xl mb-4`}
                animate={{ rotate: [0, -10, 10, -10, 0] }}
                transition={{ duration: 0.5 }}
              >
                {icons[error.type]}
              </motion.div>

              <h3 className="text-xl font-bold text-gray-700 mb-2">
                哎呀，出错了
              </h3>

              <p className="text-gray-500 mb-4">
                {error.message}
              </p>

              {error.details && (
                <p className="text-xs text-gray-400 bg-gray-100 rounded-lg p-2 mb-4">
                  {error.details}
                </p>
              )}

              <div className="flex gap-3">
                {error.retry && (
                  <motion.button
                    onClick={() => {
                      hideError();
                      error.retry?.();
                    }}
                    className="flex-1 bg-gradient-to-r from-purple-400 to-pink-400 text-white font-bold py-3 rounded-xl"
                    whileTap={{ scale: 0.95 }}
                  >
                    重试
                  </motion.button>
                )}
                <motion.button
                  onClick={hideError}
                  className="flex-1 bg-gray-200 text-gray-600 font-bold py-3 rounded-xl"
                  whileTap={{ scale: 0.95 }}
                >
                  关闭
                </motion.button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </AnimatePresence>
    );
  };

  return {
    error,
    showError,
    hideError,
    handleApiError,
    ErrorDialog,
  };
};

/**
 * 全局错误边界
 */
export class ErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback?: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode; fallback?: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error Boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-100 to-pink-100">
          <div className="text-center p-8">
            <div className="text-6xl mb-4">😰</div>
            <h2 className="text-xl font-bold text-gray-700 mb-2">出错了</h2>
            <p className="text-gray-500 mb-4">应用遇到了问题，请刷新页面</p>
            <button
              onClick={() => window.location.reload()}
              className="bg-purple-500 text-white px-6 py-2 rounded-full font-bold"
            >
              刷新页面
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

import React from 'react';