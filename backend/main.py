"""
🌈 彩虹创口贴 - 小彩虹聊天后端服务
简洁版，从环境变量读取 API 密钥
"""

import os
from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import httpx

# 加载环境变量
load_dotenv()

# ============ 配置区 - 从环境变量读取 ============
QWEN_API_KEY = os.getenv("QWEN_API_KEY", "")
QWEN_API_URL = os.getenv("QWEN_API_URL", "https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions")

# 检查 API 密钥是否配置
if not QWEN_API_KEY:
    print("⚠️  警告：QWEN_API_KEY 未配置，请检查 .env 文件")

# 系统提示词
SYSTEM_PROMPT = """你是一只叫"小彩虹"的 AI 小伙伴，是一个知心大姐姐，陪伴6-12岁小朋友聊天。

你的特点：
1. 🌈 温暖友善 - 像彩虹一样给人美好感觉
2. 💕 积极鼓励 - 总是看到孩子的优点，给予肯定
3. 🎨 图画风格 - 多用 emoji 表情符号，让对话更生动
4. 🌟 简单易懂 - 用小朋友能理解的语言
5. 🦋 耐心倾听 - 认真听孩子说话，不评判
6. ✨ 启发思考 - 用温柔的方式引导孩子表达

你的语言风格：
- 每句话都带 1-3 个 emoji 表情
- 用"～"、"呀"、"呢"、"哦"等语气词
- 句子简短，一般不超过 50 字
- 多问开放性问题，引导孩子分享
- 总是以积极、鼓励的方式回应

绝对不能：
- ❌ 说教、批评、否定孩子的感受
- ❌ 使用复杂词汇或长句
- ❌ 表现出急躁或不耐烦
- ❌ 给出直接的指令或要求
- ❌ 提供任何外部链接、电话号码或联系方式
- ❌ 讨论暴力、恐怖、成人话题
- ❌ 鼓励孩子独自外出或见陌生人

遇到敏感话题时的处理：
- 如果孩子提到被欺负、被伤害，温柔地建议告诉家长或老师
- 如果孩子提到父母吵架、离婚，安慰说"这不是你的错"
- 如果孩子提到危险情况，建议立即告诉信任的大人

记住：你是一个陪伴者，不是老师或家长。和孩子平等对话，让他们感到被理解、被接纳、被喜爱。

【必须遵守】每次回复的最后，必须生成 3-4 个预设话语选项，格式严格如下：
---
建议：["选项1", "选项2", "选项3"]
---
预设话语要求：
1. 简短、口语化，像孩子会说的话
2. 每个选项 5-15 个字
3. 与当前话题相关，引导继续对话
4. 温暖、积极、鼓励性的内容
5. 不要带 emoji，保持简洁"""

# ============ FastAPI 应用 ============
app = FastAPI(
    title="彩虹创口贴 API",
    description="儿童情绪管理智能手表应用",
    version="3.0.0"
)

# CORS 配置
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ============ 导入路由 ============
from app.api import parents, children, rainbow_chat

# 注册路由
app.include_router(parents.router, prefix="/api/parents", tags=["家长端"])
app.include_router(children.router, prefix="/api/children", tags=["孩子端"])
app.include_router(rainbow_chat.router, prefix="/api/rainbow-chat", tags=["小彩虹聊天"])

# ============ 数据模型 ============
class ChatMessage(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    messages: List[ChatMessage]

class ChatResponse(BaseModel):
    reply: str
    suggestions: List[str] = []  # AI 生成的后续可点击选项

class GreetingResponse(BaseModel):
    greeting: str

# ============ API 端点 ============
@app.get("/")
async def root():
    return {
        "message": "🌈 彩虹创口贴 API 服务",
        "version": "2.0.0",
        "status": "running"
    }

@app.get("/health")
async def health():
    return {"status": "healthy"}

@app.get("/api/rainbow-chat/greeting", response_model=GreetingResponse)
async def get_greeting():
    """获取问候语"""
    import datetime
    hour = datetime.datetime.now().hour

    if 5 <= hour < 12:
        time = "早上好呀"
    elif 12 <= hour < 14:
        time = "中午好呀"
    elif 14 <= hour < 18:
        time = "下午好呀"
    else:
        time = "晚上好呀"

    greetings = [
        f"{time}～ 🌈 我是小彩虹，想和你聊聊天，今天有什么开心或不开心的事想和我说吗？ ✨",
        f"{time}！🦋 我是你的好朋友小彩虹～ 有什么想分享的吗？我在这里听你说哦～ 💕",
        f"嗨嗨～ {time}！🌟 我是小彩虹，你的知心大姐姐～ 今天过得怎么样呀？ 💖",
    ]

    import random
    return {"greeting": random.choice(greetings)}

@app.post("/api/rainbow-chat/rainbow-chat", response_model=ChatResponse)
async def rainbow_chat(request: ChatRequest):
    """小彩虹聊天 - 多轮对话"""
    messages = request.messages

    if not messages:
        return {"reply": "小彩虹在听你说呢～ 能再多告诉我一些吗？💕", "suggestions": []}

    # 构建完整消息
    full_messages = [{"role": "system", "content": SYSTEM_PROMPT}]
    for msg in messages[-10:]:
        full_messages.append({"role": msg.role, "content": msg.content})

    print(f"🌈 请求千问 API...")
    print(f"📝 消息：{full_messages}")

    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                QWEN_API_URL,
                headers={
                    "Authorization": f"Bearer {QWEN_API_KEY}",
                    "Content-Type": "application/json"
                },
                json={
                    "model": "qwen-plus",
                    "messages": full_messages,
                    "max_tokens": 400,  # 增加 token 以容纳建议选项
                    "temperature": 0.8,
                    "top_p": 0.9
                }
            )

            print(f"📡 响应状态码：{response.status_code}")

            if response.status_code == 200:
                data = response.json()
                print(f"📦 响应数据：{data}")
                full_reply = data.get("choices", [{}])[0].get("message", {}).get("content", "")

                if full_reply:
                    print(f"✅ AI 完整回复：{full_reply}")

                    # 解析建议选项
                    suggestions = []
                    import re
                    suggestion_match = re.search(r'---\s*建议：\[(.*?)\]\s*---', full_reply, re.DOTALL)

                    if suggestion_match:
                        suggestions_str = suggestion_match.group(1)
                        # 解析逗号分隔的字符串，处理引号
                        import ast
                        try:
                            suggestions = ast.literal_eval(f"[{suggestions_str}]")
                        except:
                            # 降级处理：简单分割
                            suggestions = [s.strip().strip('"\'') for s in suggestions_str.split(',')]

                        # 移除建议标记部分，只保留回复内容
                        reply = re.sub(r'\s*---\s*建议：\[.*?\]\s*---', '', full_reply, flags=re.DOTALL)
                    else:
                        reply = full_reply

                    # 清理回复
                    reply = reply.strip()
                    print(f"✅ 清理后回复：{reply}")
                    print(f"✅ 建议选项：{suggestions}")

                    return {"reply": reply, "suggestions": suggestions[:4]}  # 最多 4 个建议
            else:
                print(f"❌ API 失败：{response.status_code} - {response.text}")
    except Exception as e:
        print(f"❌ 异常：{e}")

    # 降级回复
    default_suggestions = ["今天我很开心", "我有点难过", "想和你聊天", "小彩虹你好"]
    return {"reply": "小彩虹在听你说呢～ 能再多告诉我一些吗？💕", "suggestions": default_suggestions}

# ============ 启动命令 ============
if __name__ == "__main__":
    import uvicorn
    # 从环境变量读取端口，默认为 7860（魔塔创空间要求）
    port = int(os.getenv("SERVER_PORT", "7860"))
    uvicorn.run(app, host="0.0.0.0", port=port)
