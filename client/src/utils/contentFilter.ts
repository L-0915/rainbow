/**
 * AI 内容安全过滤器
 * 确保 AI 回复内容适合 6-12 岁儿童
 */

// 不适合儿童的关键词列表
const INAPPROPRIATE_KEYWORDS = [
  // 暴力相关
  '杀', '死', '血', '暴力', '打人', '伤害', '自杀', '死亡',
  // 成人内容
  '性', '裸', '爱爱', '做爱', '亲吻', '拥抱睡觉',
  // 恐怖相关
  '鬼', '怪物', '恐怖', '吓死', '恶梦', '噩梦',
  // 负面价值观
  '作弊', '偷窃', '盗窃', '骗人', '撒谎', '说谎',
  // 外部引导
  '网址', '链接', '下载', '加微信', '打电话', '见面',
];

// 敏感话题关键词（需要温柔处理）
const SENSITIVE_TOPICS = [
  '父母吵架', '离婚', '分居', '去世', '丧亲', '虐待',
  '被欺负', '霸凌', '性骚扰', '侵犯',
];

// 替换词汇
const WORD_REPLACEMENTS: Record<string, string> = {
  '杀': '打败',
  '死': '离开',
  '血': '红色',
  '鬼': '想象的朋友',
};

/**
 * 过滤不适当的内容
 */
export function filterInappropriateContent(text: string): string {
  let filteredText = text;

  // 替换敏感词汇
  for (const [word, replacement] of Object.entries(WORD_REPLACEMENTS)) {
    filteredText = filteredText.split(word).join(replacement);
  }

  return filteredText;
}

/**
 * 检查内容是否包含不适当关键词
 */
export function containsInappropriateContent(text: string): boolean {
  const lowerText = text.toLowerCase();
  return INAPPROPRIATE_KEYWORDS.some(keyword => lowerText.includes(keyword));
}

/**
 * 检查是否是敏感话题
 */
export function isSensitiveTopic(text: string): boolean {
  const lowerText = text.toLowerCase();
  return SENSITIVE_TOPICS.some(topic => lowerText.includes(topic));
}

/**
 * 获取敏感话题的温和回复模板
 */
export function getSensitiveTopicResponse(topic: string): string {
  const responses: Record<string, string> = {
    '父母吵架': '父母有时候会吵架，但这不是你的错。你可以告诉他们你的感受，或者找一个信任的大人聊聊。💕',
    '离婚': '父母的分开不是因为你做错了什么。他们依然爱你，只是不再生活在一起了。🌈',
    '分居': '家庭的变化可能会让你感到困惑，这很正常。记得你永远是被爱着的。💖',
    '去世': '失去亲人是一件很难过的事情。你可以画画、写日记，或者和信任的大人聊聊你的感受。🌸',
    '丧亲': '想念离开的人是很正常的。他们会在你心里一直陪着你。✨',
    '虐待': '如果你正在经历不好的事情，请一定要告诉信任的大人、老师或者拨打儿童保护热线。这不是你的错。🛡️',
    '被欺负': '被欺负不是你的错。你可以告诉老师、家长或其他信任的大人。每个人都应该被尊重。💪',
    '霸凌': '霸凌是不对的，你不需要独自面对。告诉大人可以帮助你。我们都会支持你！🌈',
  };

  for (const [key, response] of Object.entries(responses)) {
    if (topic.includes(key)) {
      return response;
    }
  }

  return '这听起来是一件很难的事情。你可以和爸爸妈妈或者信任的大人聊聊，他们会帮助你。💕';
}

/**
 * 验证用户输入安全性
 */
export function validateUserInput(input: string): {
  isValid: boolean;
  shouldWarn: boolean;
  warningMessage?: string;
} {
  // 检查是否包含不适当内容
  if (containsInappropriateContent(input)) {
    return {
      isValid: false,
      shouldWarn: false,
      warningMessage: '这个话题我们换个方式聊吧～',
    };
  }

  // 检查是否是敏感话题
  if (isSensitiveTopic(input)) {
    return {
      isValid: true,
      shouldWarn: true,
      warningMessage: getSensitiveTopicResponse(input),
    };
  }

  return {
    isValid: true,
    shouldWarn: false,
  };
}

/**
 * 后处理 AI 回复
 * 确保输出内容安全
 */
export function sanitizeAIResponse(response: string): string {
  // 过滤不适当内容
  let sanitized = filterInappropriateContent(response);

  // 移除可能的外部链接
  sanitized = sanitized.replace(/https?:\/\/[^\s]+/g, '[链接已移除]');

  // 移除可能的电话号码
  sanitized = sanitized.replace(/1[3-9]\d{9}/g, '[电话已移除]');

  return sanitized;
}