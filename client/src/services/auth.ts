/**
 * 用户认证服务
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

export interface LoginRequest {
  nickname: string;
  password: string;
}

export interface RegisterRequest {
  nickname: string;
  password: string;
  phone?: string;
}

export interface UserInfo {
  id: number;
  nickname: string;
  phone?: string;
}

export interface ChildInfo {
  id: number;
  nickname: string;
  avatar: string;
}

export interface AuthResponse {
  parent: UserInfo;
  child: ChildInfo;
  parent_token: string;
  child_token: string;
}

/**
 * 存储 token 到 localStorage
 */
export const storeTokens = (parentToken: string, childToken: string) => {
  localStorage.setItem('parent_token', parentToken);
  localStorage.setItem('child_token', childToken);
};

/**
 * 获取存储的 token
 */
export const getToken = (type: 'parent' | 'child'): string | null => {
  return localStorage.getItem(`${type}_token`);
};

/**
 * 清除 token
 */
export const clearTokens = () => {
  localStorage.removeItem('parent_token');
  localStorage.removeItem('child_token');
};

/**
 * 检查是否已登录
 */
export const isAuthenticated = (): boolean => {
  return !!getToken('child');
};

/**
 * 登录
 */
export const login = async (request: LoginRequest): Promise<AuthResponse> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || '登录失败');
    }

    const data = await response.json();

    if (data.code === 0 && data.data) {
      // 存储 token
      storeTokens(data.data.parent_token, data.data.child_token);
      return data.data;
    } else {
      throw new Error(data.message || '登录失败');
    }
  } catch (error) {
    console.error('登录错误:', error);
    throw error;
  }
};

/**
 * 注册
 */
export const register = async (request: RegisterRequest): Promise<AuthResponse> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || '注册失败');
    }

    const data = await response.json();

    if (data.code === 0 && data.data) {
      // 存储 token
      storeTokens(data.data.parent_token, data.data.child_token);
      return data.data;
    } else {
      throw new Error(data.message || '注册失败');
    }
  } catch (error) {
    console.error('注册错误:', error);
    throw error;
  }
};

/**
 * 获取当前用户信息
 */
export const getCurrentUser = async (): Promise<{ parent: UserInfo; child: ChildInfo } | null> => {
  try {
    const parentToken = getToken('parent');

    if (!parentToken) {
      return null;
    }

    const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${parentToken}`,
      },
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();

    if (data.code === 0 && data.data) {
      return data.data;
    }

    return null;
  } catch (error) {
    console.error('获取用户信息错误:', error);
    return null;
  }
};

/**
 * 登出
 */
export const logout = () => {
  clearTokens();
};
