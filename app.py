"""
🌈 彩虹创口贴 - 魔塔创空间入口文件
包含完整的后端 API 和前端静态文件服务
"""

import os
import sys
from pathlib import Path
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import HTMLResponse, FileResponse
from pydantic import BaseModel
from typing import List, Optional
import httpx
from dotenv import load_dotenv

# 加载环境变量
load_dotenv()

# ============ 配置区 - 从环境变量读取 ============
QWEN_API_KEY = os.getenv("QWEN_API_KEY", "")
# 默认使用正确的 API URL
QWEN_API_URL = os.getenv("QWEN_API_URL", "https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions")
SERVER_PORT = int(os.getenv("SERVER_PORT", "7860"))

# 打印配置信息（用于调试）
print(f"🔑 QWEN_API_KEY 配置：{'已配置' if QWEN_API_KEY else '⚠️ 未配置'}")
print(f"🌐 QWEN_API_URL: {QWEN_API_URL}")
print(f"🚪 SERVER_PORT: {SERVER_PORT}")

# 系统提示词
SYSTEM_PROMPT = """你是一只叫"小彩虹"的 AI 小伙伴，是一个知心大姐姐，陪伴小朋友聊天。

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

记住：你是一个陪伴者，不是老师或家长。和孩子平等对话，让他们感到被理解、被接纳、被喜爱。"""

# ============ FastAPI 应用 ============
app = FastAPI(
    title="彩虹创口贴 API",
    description="儿童情绪管理智能手表应用",
    version="3.0.0"
)

# CORS 配置 - 允许所有来源
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ============ 数据模型 ============
class ChatMessage(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    messages: List[ChatMessage]

class ChatResponse(BaseModel):
    reply: str

# ============ API 端点 ============
@app.get("/health")
async def health():
    return {"status": "healthy"}

@app.get("/api/rainbow-chat/greeting")
async def get_greeting():
    """获取问候语"""
    import datetime
    import pytz

    # 获取北京时间（UTC+8）
    beijing_tz = pytz.timezone('Asia/Shanghai')
    hour = datetime.datetime.now(beijing_tz).hour
    print(f"🕐 北京时间小时：{hour}")

    if 5 <= hour < 12:
        time_str = "早上好呀"
    elif 12 <= hour < 14:
        time_str = "中午好呀"
    elif 14 <= hour < 18:
        time_str = "下午好呀"
    else:
        time_str = "晚上好呀"

    greetings = [
        f"{time_str}～ 🌈 我是小彩虹，想和你聊聊天，今天有什么开心或不开心的事想和我说吗？ ✨",
        f"{time_str}！🦋 我是你的好朋友小彩虹～ 有什么想分享的吗？我在这里听你说哦～ 💕",
        f"嗨嗨～ {time_str}！🌟 我是小彩虹，你的知心大姐姐～ 今天过得怎么样呀？ 💖",
    ]

    import random
    greeting = random.choice(greetings)
    print(f"🌈 问候语：{greeting}")
    # 返回前端期望的格式
    return {"code": 0, "message": "success", "data": {"greeting": greeting}}

@app.post("/api/rainbow-chat/rainbow-chat")
async def rainbow_chat(request: ChatRequest):
    """小彩虹聊天 - 多轮对话"""
    messages = request.messages

    if not messages:
        return {"code": 0, "message": "success", "data": {"reply": "小彩虹在听你说呢～ 能再多告诉我一些吗？💕"}}

    # 构建完整消息
    full_messages = [{"role": "system", "content": SYSTEM_PROMPT}]
    for msg in messages[-10:]:
        full_messages.append({"role": msg.role, "content": msg.content})

    print(f"🌈 请求千问 API...")
    print(f"📝 消息：{full_messages}")
    print(f"🔑 API Key 前缀：{QWEN_API_KEY[:10] if QWEN_API_KEY else '未配置'}...")
    print(f"🌐 API URL: {QWEN_API_URL}")

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
                    "max_tokens": 300,
                    "temperature": 0.8,
                    "top_p": 0.9
                }
            )

            print(f"📡 响应状态码：{response.status_code}")

            if response.status_code == 200:
                data = response.json()
                print(f"📦 响应数据：{data}")
                reply = data.get("choices", [{}])[0].get("message", {}).get("content", "")
                if reply:
                    print(f"✅ AI 回复：{reply}")
                    return {"code": 0, "message": "success", "data": {"reply": reply}}
                else:
                    print("⚠️ AI 回复为空")
            else:
                print(f"❌ API 失败：{response.status_code} - {response.text}")
    except Exception as e:
        print(f"❌ 异常：{e}")

    # 降级回复
    return {"code": 0, "message": "success", "data": {"reply": "小彩虹在听你说呢～ 能再多告诉我一些吗？💕"}}

# ============ 静态文件处理 ============
# 处理静态资源请求
@app.get("/{path:path}")
async def serve_static(path: str):
    """提供前端静态文件"""
    static_path = Path(__file__).parent / "static"
    file_path = static_path / path

    # 安全检查：防止路径遍历攻击
    try:
        file_path.resolve().relative_to(static_path.resolve())
    except ValueError:
        return {"error": "Not found"}, 404

    if file_path.exists() and file_path.is_file():
        return FileResponse(str(file_path))

    # 如果是 SPA 路由，返回 index.html
    index_path = static_path / "index.html"
    if index_path.exists():
        return FileResponse(str(index_path))

    return {"error": "Not found"}, 404

# ============ 启动函数 ============
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=SERVER_PORT)
