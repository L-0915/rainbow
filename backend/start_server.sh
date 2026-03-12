#!/bin/bash

# 🌈 彩虹创口贴 - 云服务器保活启动脚本
# 功能：自动安装依赖、启动服务、后台持续运行

APP_DIR="/mnt/workspace/rainbow/backend"
LOG_DIR="$APP_DIR/logs"
PID_FILE="$APP_DIR/server.pid"
LOG_FILE="$LOG_DIR/server.log"
ERROR_LOG="$LOG_DIR/error.log"

# 创建日志目录
mkdir -p "$LOG_DIR"

# 进入应用目录
cd "$APP_DIR"

# 创建 .env 文件
cat > .env << 'EOF'
QWEN_API_KEY=sk-646c491c65cb4fad92aecba55e50a142
QWEN_API_URL=https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions
SERVER_PORT=7860
EOF

# 检查 Python 版本
echo "🐍 Python 版本：$(python3 --version)"

# 安装依赖
if [ -f "requirements.txt" ]; then
    echo "📦 安装 Python 依赖..."
    python3 -m pip install -r requirements.txt -q
fi

# 停止旧进程
if [ -f "$PID_FILE" ]; then
    OLD_PID=$(cat "$PID_FILE")
    if ps -p "$OLD_PID" > /dev/null 2>&1; then
        echo "⏹️  停止旧进程：$OLD_PID"
        kill "$OLD_PID" 2>/dev/null
        sleep 2
        # 如果进程还在，强制杀死
        if ps -p "$OLD_PID" > /dev/null 2>&1; then
            kill -9 "$OLD_PID" 2>/dev/null
        fi
    fi
    rm -f "$PID_FILE"
fi

# 清理可能占用端口的进程
echo "🔍 检查端口 7860 占用情况..."
PORT_PID=$(lsof -t -i:7860 2>/dev/null || netstat -tlnp | grep :7860 | awk '{print $7}' | cut -d'/' -f1)
if [ -n "$PORT_PID" ]; then
    echo "⚠️  端口 7860 被占用，进程 ID: $PORT_PID"
    kill "$PORT_PID" 2>/dev/null || true
    sleep 1
fi

# 启动服务（后台运行）并添加保活监控
echo "🚀 启动彩虹创口贴服务 (main.py)..."
nohup python3 -u main.py > "$LOG_FILE" 2> "$ERROR_LOG" &
NEW_PID=$!

# 保存 PID
echo "$NEW_PID" > "$PID_FILE"

# 等待 5 秒检查是否启动成功
echo "⏳ 等待服务启动..."
sleep 5

if ps -p "$NEW_PID" > /dev/null 2>&1; then
    echo ""
    echo "✅ 服务启动成功！"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "  📌 进程 ID: $NEW_PID"
    echo "  📄 运行日志：tail -f $LOG_FILE"
    echo "  ❌ 错误日志：tail -f $ERROR_LOG"
    echo "  🛑 停止服务：kill $NEW_PID"
    echo ""
    echo "  🌐 访问地址："
    echo "     在 Jupyter 左侧边栏打开 PORTS，添加 7860 端口获取公网 URL"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""

    # 启动保活监控（每分钟检查一次，崩溃自动重启）
    echo "🔄 启动保活监控..."
    (
        while true; do
            sleep 60
            if ! ps -p "$NEW_PID" > /dev/null 2>&1; then
                echo "⚠️  检测到服务崩溃，正在重启..." | tee -a "$ERROR_LOG"
                nohup python3 -u main.py > "$LOG_FILE" 2> "$ERROR_LOG" &
                NEW_PID=$!
                echo "$NEW_PID" > "$PID_FILE"
                echo "✅ 服务已重启，新 PID: $NEW_PID"
            fi
        done
    ) &
    MONITOR_PID=$!
    echo "$MONITOR_PID" > "$APP_DIR/monitor.pid"
    echo "✅ 保活监控已启动 (PID: $MONITOR_PID)"
else
    echo ""
    echo "❌ 服务启动失败！查看错误："
    tail -20 "$ERROR_LOG"
    exit 1
fi
