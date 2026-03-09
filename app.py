"""
🌈 彩虹创口贴 - 魔塔创空间入口文件
集成 FastAPI 后端和 Gradio 前端
"""

import os
import asyncio
import threading
import time
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import httpx
from dotenv import load_dotenv
import gradio as gr

# 加载环境变量
load_dotenv()

# ============ 配置区 - 从环境变量读取 ============
QWEN_API_KEY = os.getenv("QWEN_API_KEY", "")
QWEN_API_URL = os.getenv("QWEN_API_URL", "https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions")
SERVER_PORT = int(os.getenv("SERVER_PORT", "7860"))

# 检查 API 密钥是否配置
if not QWEN_API_KEY:
    print("⚠️  警告：QWEN_API_KEY 未配置，请在魔塔创空间设置环境变量")

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

# CORS 配置
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
@app.get("/")
async def root():
    return {
        "message": "🌈 彩虹创口贴 API 服务",
        "version": "3.0.0",
        "status": "running"
    }

@app.get("/health")
async def health():
    return {"status": "healthy"}

@app.get("/api/rainbow-chat/greeting")
async def get_greeting():
    """获取问候语"""
    import datetime
    hour = datetime.datetime.now().hour

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
    return {"greeting": random.choice(greetings)}

@app.post("/api/rainbow-chat/rainbow-chat", response_model=ChatResponse)
async def rainbow_chat(request: ChatRequest):
    """小彩虹聊天 - 多轮对话"""
    messages = request.messages

    if not messages:
        return {"reply": "小彩虹在听你说呢～ 能再多告诉我一些吗？💕"}

    # 构建完整消息
    full_messages = [{"role": "system", "content": SYSTEM_PROMPT}]
    for msg in messages[-10:]:
        full_messages.append({"role": msg.role, "content": msg.content})

    print(f"🌈 请求千问 API...")

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

            if response.status_code == 200:
                data = response.json()
                reply = data.get("choices", [{}])[0].get("message", {}).get("content", "")
                if reply:
                    return {"reply": reply}
    except Exception as e:
        print(f"❌ 异常：{e}")

    # 降级回复
    return {"reply": "小彩虹在听你说呢～ 能再多告诉我一些吗？💕"}


# ============ Gradio 前端 ============
chat_history = []

def get_greeting_text():
    """获取问候语"""
    import datetime
    hour = datetime.datetime.now().hour

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
    return random.choice(greetings)

def chat_with_rainbow(message, history):
    """与小彩虹聊天"""
    global chat_history

    # 添加用户消息到历史记录
    chat_history.append({"role": "user", "content": message})

    # 构建请求
    messages = [ChatMessage(role=msg["role"], content=msg["content"]) for msg in chat_history]

    try:
        # 同步调用异步函数
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)

        request = ChatRequest(messages=messages)

        async def call_api():
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.post(
                    f"http://localhost:{SERVER_PORT}/api/rainbow-chat/rainbow-chat",
                    headers={
                        "Authorization": f"Bearer {QWEN_API_KEY}",
                        "Content-Type": "application/json"
                    },
                    json={
                        "model": "qwen-plus",
                        "messages": [{"role": "system", "content": SYSTEM_PROMPT}] +
                                   [{"role": m.role, "content": m.content} for m in messages],
                        "max_tokens": 300,
                        "temperature": 0.8,
                        "top_p": 0.9
                    }
                )
                return response.json()

        result = loop.run_until_complete(call_api())
        loop.close()

        reply = result.get("reply", "小彩虹在听你说呢～ 💕")

    except Exception as e:
        reply = f"小彩虹在听你说呢～ 💕 (网络错误：{str(e)})"

    # 添加 AI 回复到历史记录
    chat_history.append({"role": "assistant", "content": reply})

    # 更新历史显示
    history_display = []
    for msg in chat_history:
        if msg["role"] == "user":
            history_display.append((msg["content"], None))
        else:
            if history_display and history_display[-1][1] is None:
                history_display[-1] = (history_display[-1][0], msg["content"])

    return history_display

# 创建 Gradio 界面
with gr.Blocks(title="彩虹创口贴", theme=gr.themes.Soft()) as demo:
    gr.Markdown("""
    # 🌈 彩虹创口贴 - 小彩虹陪你聊天

    我是你的知心大姐姐小彩虹，有什么开心或不开心的事都可以和我分享哦～ 💕
    """)

    chatbot = gr.Chatbot(
        label="小彩虹",
        bubble_full_width=False,
        height=400
    )

    msg = gr.Textbox(
        label="输入消息",
        placeholder="和小彩虹说说话吧...",
        lines=2
    )

    clear = gr.Button("清除聊天记录")

    greeting = gr.Textbox(
        label="小彩虹的问候",
        value=get_greeting_text(),
        lines=2
    )

    def user_message(message, history):
        if not message.strip():
            return "", history
        return "", history + [[message, None]]

    def bot_response(history):
        if not history or not history[-1][0]:
            return history

        message = history[-1][0]
        global chat_history
        chat_history.append({"role": "user", "content": message})

        try:
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)

            async def call_api():
                async with httpx.AsyncClient(timeout=30.0) as client:
                    response = await client.post(
                        QWEN_API_URL,
                        headers={
                            "Authorization": f"Bearer {QWEN_API_KEY}",
                            "Content-Type": "application/json"
                        },
                        json={
                            "model": "qwen-plus",
                            "messages": [{"role": "system", "content": SYSTEM_PROMPT}] +
                                       [{"role": "user", "content": message}],
                            "max_tokens": 300,
                            "temperature": 0.8,
                            "top_p": 0.9
                        }
                    )
                    return response.json()

            result = loop.run_until_complete(call_api())
            loop.close()

            reply = result.get("choices", [{}])[0].get("message", {}).get("content", "")
            if not reply:
                reply = "小彩虹在听你说呢～ 💕"

        except Exception as e:
            reply = "小彩虹在听你说呢～ 💕"
            print(f"错误：{e}")

        chat_history.append({"role": "assistant", "content": reply})
        history[-1] = (message, reply)
        return history

    def clear_chat(history):
        global chat_history
        chat_history = []
        return [], get_greeting_text()

    msg.submit(user_message, [msg, chatbot], [msg, chatbot]).then(
        bot_response, chatbot, chatbot
    )

    clear.click(clear_chat, [chatbot], [chatbot, greeting])

# ============ 启动函数 ============
def run_fastapi():
    """运行 FastAPI 服务"""
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=SERVER_PORT)

if __name__ == "__main__":
    # 在新线程中启动 FastAPI
    fastapi_thread = threading.Thread(target=run_fastapi, daemon=True)
    fastapi_thread.start()

    # 等待 FastAPI 启动
    time.sleep(1)
    print(f"🌈 FastAPI 服务已启动：http://0.0.0.0:{SERVER_PORT}")

    # 启动 Gradio 前端
    demo.launch(server_name="0.0.0.0", server_port=7861)
