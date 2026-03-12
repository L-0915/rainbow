/**
 * 情绪记录 API 服务
 * 与后端交互的情绪数据接口
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

// API 响应类型
export interface ApiResponse<T> {
  code: number;
  message: string;
  data: T;
}

// 情绪记录类型
export interface EmotionRecord {
  id: string;
  date: string;         // YYYY-MM-DD
  emotion: string;
  intensity: number;    // 1-5
  note?: string;
}

// API 响应数据类型
interface EmotionListData {
  records: EmotionRecord[];
}

interface EmotionSaveData {
  saved: boolean;
  saved_count?: number;
}

interface EmotionDeleteData {
  deleted_count: number;
}

/**
 * 获取指定月份的情绪记录
 */
export async function getEmotions(year: number, month: number): Promise<EmotionRecord[]> {
  try {
    const url = `${API_BASE_URL}/api/emotions?year=${year}&month=${month}`;
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const data: ApiResponse<EmotionListData> = await response.json();

    if (data.code === 0) {
      return data.data.records;
    } else {
      console.error('获取情绪记录失败:', data.message);
      return [];
    }
  } catch (error) {
    console.error('获取情绪记录异常:', error);
    return [];
  }
}

/**
 * 保存单条情绪记录
 */
export async function saveEmotion(record: EmotionRecord): Promise<boolean> {
  try {
    const url = `${API_BASE_URL}/api/emotions`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ record }),
    });

    const data: ApiResponse<EmotionSaveData> = await response.json();

    if (data.code === 0) {
      return data.data.saved;
    } else {
      console.error('保存情绪记录失败:', data.message);
      return false;
    }
  } catch (error) {
    console.error('保存情绪记录异常:', error);
    return false;
  }
}

/**
 * 批量保存情绪记录
 */
export async function saveEmotionsBatch(records: EmotionRecord[]): Promise<number> {
  try {
    const url = `${API_BASE_URL}/api/emotions/batch`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ records }),
    });

    const data: ApiResponse<{ saved_count: number }> = await response.json();

    if (data.code === 0) {
      return data.data.saved_count;
    } else {
      console.error('批量保存情绪记录失败:', data.message);
      return 0;
    }
  } catch (error) {
    console.error('批量保存情绪记录异常:', error);
    return 0;
  }
}

/**
 * 删除所有情绪记录（用于月度重置）
 */
export async function deleteAllEmotions(): Promise<boolean> {
  try {
    const url = `${API_BASE_URL}/api/emotions`;
    const response = await fetch(url, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const data: ApiResponse<EmotionDeleteData> = await response.json();

    if (data.code === 0) {
      return true;
    } else {
      console.error('删除情绪记录失败:', data.message);
      return false;
    }
  } catch (error) {
    console.error('删除情绪记录异常:', error);
    return false;
  }
}

/**
 * 获取所有情绪记录（用于调试）
 */
export async function getAllEmotions(): Promise<EmotionRecord[]> {
  try {
    const url = `${API_BASE_URL}/api/emotions/all`;
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const data: ApiResponse<EmotionListData & { total: number }> = await response.json();

    if (data.code === 0) {
      console.log(`获取所有情绪记录：${data.data.total} 条`);
      return data.data.records;
    } else {
      console.error('获取所有情绪记录失败:', data.message);
      return [];
    }
  } catch (error) {
    console.error('获取所有情绪记录异常:', error);
    return [];
  }
}
