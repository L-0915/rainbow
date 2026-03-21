/**
 * 安全工具函数
 * 提供数据加密、密码保护等功能
 */

// 简单的加密密钥（生产环境应使用更安全的方式）
const ENCRYPTION_KEY = 'rainbow_bandage_2024';

/**
 * 简单的 Base64 编码加密
 * 注意：这不是真正的加密，仅用于混淆敏感数据
 * 生产环境应使用 Web Crypto API
 */
export const encryptData = (data: string): string => {
  try {
    // 先进行简单的 XOR 混淆
    const encrypted = data.split('').map((char, i) => {
      return String.fromCharCode(
        char.charCodeAt(0) ^ ENCRYPTION_KEY.charCodeAt(i % ENCRYPTION_KEY.length)
      );
    }).join('');

    // 再进行 Base64 编码
    return btoa(encodeURIComponent(encrypted));
  } catch (e) {
    console.error('加密失败:', e);
    return data;
  }
};

/**
 * 解密数据
 */
export const decryptData = (encryptedData: string): string => {
  try {
    // Base64 解码
    const decoded = decodeURIComponent(atob(encryptedData));

    // XOR 解密
    return decoded.split('').map((char, i) => {
      return String.fromCharCode(
        char.charCodeAt(0) ^ ENCRYPTION_KEY.charCodeAt(i % ENCRYPTION_KEY.length)
      );
    }).join('');
  } catch (e) {
    console.error('解密失败:', e);
    return encryptedData;
  }
};

/**
 * 安全存储类
 * 提供加密的本地存储
 */
export class SecureStorage {
  private prefix: string;

  constructor(prefix: string = 'rainbow_secure_') {
    this.prefix = prefix;
  }

  setItem(key: string, value: any, encrypt: boolean = true): void {
    const data = JSON.stringify(value);
    const stored = encrypt ? encryptData(data) : data;
    localStorage.setItem(this.prefix + key, stored);
  }

  getItem<T>(key: string, decrypt: boolean = true): T | null {
    const stored = localStorage.getItem(this.prefix + key);
    if (!stored) return null;

    try {
      const data = decrypt ? decryptData(stored) : stored;
      return JSON.parse(data) as T;
    } catch (e) {
      console.error('读取安全存储失败:', e);
      return null;
    }
  }

  removeItem(key: string): void {
    localStorage.removeItem(this.prefix + key);
  }

  clear(): void {
    const keys = Object.keys(localStorage).filter(k => k.startsWith(this.prefix));
    keys.forEach(k => localStorage.removeItem(k));
  }
}

// 全局安全存储实例
export const secureStorage = new SecureStorage();

/**
 * 家长密码管理
 */
export const ParentAuth = {
  STORAGE_KEY: 'parent_pin',

  // 设置家长密码
  setPin(pin: string): void {
    // 简单存储 PIN 的哈希值
    const hash = this.hashPin(pin);
    secureStorage.setItem(this.STORAGE_KEY, hash);
  },

  // 验证密码
  verifyPin(pin: string): boolean {
    const storedHash = secureStorage.getItem<string>(this.STORAGE_KEY);
    if (!storedHash) return true; // 未设置密码时允许访问
    return this.hashPin(pin) === storedHash;
  },

  // 检查是否设置了密码
  hasPin(): boolean {
    return !!secureStorage.getItem<string>(this.STORAGE_KEY);
  },

  // 清除密码
  clearPin(): void {
    secureStorage.removeItem(this.STORAGE_KEY);
  },

  // 简单的 PIN 哈希（生产环境应使用更强的哈希）
  hashPin(pin: string): string {
    let hash = 0;
    for (let i = 0; i < pin.length; i++) {
      const char = pin.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return hash.toString(36) + '_rainbow';
  },
};

/**
 * 安全验证：检查请求来源
 */
export const validateRequest = (request: Request): boolean => {
  const origin = request.headers.get('origin');
  const allowedOrigins = [
    window.location.origin,
    'http://localhost:5173',
    'http://localhost:3000',
  ];

  return !origin || allowedOrigins.includes(origin);
};

/**
 * 数据脱敏：隐藏敏感信息
 */
export const maskSensitiveData = (data: string, type: 'phone' | 'email' | 'name'): string => {
  switch (type) {
    case 'phone':
      return data.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2');
    case 'email':
      return data.replace(/(.{2}).*@/, '$1***@');
    case 'name':
      return data.length > 2
        ? data[0] + '*'.repeat(data.length - 2) + data[data.length - 1]
        : data[0] + '*';
    default:
      return data;
  }
};

/**
 * 内容安全：XSS 过滤
 */
export const sanitizeHtml = (html: string): string => {
  const div = document.createElement('div');
  div.textContent = html;
  return div.innerHTML;
};

/**
 * 输入验证
 */
export const InputValidator = {
  // 验证昵称（2-10个字符，不含特殊符号）
  nickname: (value: string): { valid: boolean; message: string } => {
    if (!value.trim()) {
      return { valid: false, message: '请输入昵称' };
    }
    if (value.length < 2 || value.length > 10) {
      return { valid: false, message: '昵称需要2-10个字符' };
    }
    if (/[<>\/\\]/.test(value)) {
      return { valid: false, message: '昵称不能包含特殊符号' };
    }
    return { valid: true, message: '' };
  },

  // 验证 PIN 码（4位数字）
  pin: (value: string): { valid: boolean; message: string } => {
    if (!/^\d{4}$/.test(value)) {
      return { valid: false, message: 'PIN码需要4位数字' };
    }
    return { valid: true, message: '' };
  },

  // 验证年龄
  age: (value: number): { valid: boolean; message: string } => {
    if (value < 3 || value > 18) {
      return { valid: false, message: '年龄需要在3-18岁之间' };
    }
    return { valid: true, message: '' };
  },
};