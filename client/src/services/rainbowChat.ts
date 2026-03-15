/**
 * 🌈 小彩虹对话服务 - 调用后端 API
 *
 * 后端代理调用千问 API，前端不直接暴露 API 密钥
 */

// 后端 API 基础 URL - 部署时根据实际地址配置
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface RainbowChatResponse {
  success: boolean;
  content?: string;
  suggestions?: string[]; // AI 生成的后续可点击选项
  error?: string;
}

/**
 * 发送消息到后端 API
 */
export const sendChatMessage = async (
  messages: ChatMessage[]
): Promise<RainbowChatResponse> => {
  try {
    // 确保消息格式正确
    const formattedMessages = messages.map(msg => ({
      role: msg.role,
      content: msg.content,
    }));

    console.log('🌈 发送消息:', formattedMessages);

    const response = await fetch(`${API_BASE_URL}/api/rainbow-chat/rainbow-chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages: formattedMessages,
      }),
    });

    console.log('📡 响应状态:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ 响应错误:', errorText);
      throw new Error(`HTTP error! status: ${response.status}, body: ${errorText}`);
    }

    const data = await response.json();
    console.log('✅ 响应数据:', data);

    // 后端返回 {reply: "...", suggestions: ["...", "..."]}
    return {
      success: true,
      content: data.reply,
      suggestions: data.suggestions || [],
    };
  } catch (error) {
    console.error('彩虹聊天 API 调用失败:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '未知错误',
    };
  }
};

/**
 * 获取开场白
 */
export const getGreeting = async (): Promise<string> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/rainbow-chat/greeting`);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    // 后端直接返回 {greeting: "..."}
    if (data.greeting) {
      return data.greeting;
    }
  } catch (error) {
    console.error('获取问候语失败:', error);
  }

  // 默认问候语
  const hour = new Date().getHours();
  let timeGreeting = '';

  if (hour >= 5 && hour < 12) {
    timeGreeting = '早上好呀';
  } else if (hour >= 12 && hour < 14) {
    timeGreeting = '中午好呀';
  } else if (hour >= 14 && hour < 18) {
    timeGreeting = '下午好呀';
  } else {
    timeGreeting = '晚上好呀';
  }

  const greetings = [
    `${timeGreeting}～ 🌈 我是小彩虹，想和你聊聊天，今天有什么开心或不开心的事想和我说吗？ ✨`,
    `${timeGreeting}！🦋 我是你的好朋友小彩虹～ 有什么想分享的吗？我在这里听你说哦～ 💕`,
    `嗨嗨～ ${timeGreeting}！🌟 我是小彩虹，你的知心大姐姐～ 今天过得怎么样呀？ 💖`,
  ];

  return greetings[Math.floor(Math.random() * greetings.length)];
};
