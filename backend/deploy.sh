#!/bin/bash

# 🌈 彩虹创口贴 - 一键部署脚本（带保活）
# 使用方法：bash deploy.sh

set -e

APP_DIR="/opt/rainbow-helper"
LOG_DIR="$APP_DIR/logs"

echo "╔════════════════════════════════════════════════════════╗"
echo "║     🌈 彩虹创口贴 - 云服务器一键部署脚本                ║"
echo "╚════════════════════════════════════════════════════════╝"
echo ""

# 检查是否以 root 运行
if [ "$EUID" -ne 0 ]; then
    echo "❌ 请使用 root 用户运行此脚本"
    echo "   执行：sudo bash $0"
    exit 1
fi

# 1. 创建目录
echo "📁 创建应用目录..."
mkdir -p "$APP_DIR"
mkdir -p "$LOG_DIR"

# 2. 安装系统依赖
echo "📦 安装系统依赖..."
apt update -qq
apt install -y python3 python3-pip curl wget -qq

# 3. 安装 Python 依赖（如果 requirements.txt 存在）
if [ -f "requirements.txt" ]; then
    echo "🐍 安装 Python 依赖..."
    pip3 install -r requirements.txt -q
fi

# 4. 创建 .env 文件
if [ ! -f "$APP_DIR/.env" ]; then
    echo "🔑 创建环境配置文件..."
    cat > "$APP_DIR/.env" << 'EOF'
# ⚠️ 请替换为你的实际 API 密钥
QWEN_API_KEY=sk-646c491c65cb4fad92aecba55e50a142
QWEN_API_URL=https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions
SERVER_PORT=7860
EOF
    echo "⚠️  请编辑 $APP_DIR/.env 文件配置你的 API 密钥"
fi

# 5. 复制 systemd 服务文件
echo "⚙️  配置 systemd 服务..."
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
if [ -f "$SCRIPT_DIR/rainbow-helper.service" ]; then
    cp "$SCRIPT_DIR/rainbow-helper.service" /etc/systemd/system/
else
    # 如果当前目录没有，就创建一个
    cat > /etc/systemd/system/rainbow-helper.service << 'EOF'
[Unit]
Description=Rainbow Helper Backend Service
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/opt/rainbow-helper
Environment="PATH=/usr/bin:/usr/local/bin:/usr/local/sbin:/usr/sbin:/sbin"
Environment="PYTHONUNBUFFERED=1"
ExecStart=/usr/bin/python3 /opt/rainbow-helper/app.py
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal
SyslogIdentifier=rainbow-helper

[Install]
WantedBy=multi-user.target
EOF
fi

# 6. 重新加载 systemd 并启动服务
echo "🚀 启动服务..."
systemctl daemon-reload
systemctl enable rainbow-helper
systemctl start rainbow-helper

# 7. 等待服务启动
echo "⏳ 等待服务启动..."
sleep 5

# 8. 检查服务状态
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
if systemctl is-active --quiet rainbow-helper; then
    echo "✅ 部署成功！服务正在运行"
    echo ""
    echo "📊 服务状态:"
    systemctl status rainbow-helper --no-pager -l
    echo ""
    echo "📄 查看日志：journalctl -u rainbow-helper -f"
    echo "🛑 停止服务：systemctl stop rainbow-helper"
    echo "🔄 重启服务：systemctl restart rainbow-helper"
    echo ""
    echo "🌐 访问地址："
    echo "   本地：http://localhost:7860"
    echo "   外网：http://你的服务器 IP:7860"
    echo ""
    echo "⚠️  如果外网无法访问，请开放防火墙端口"
else
    echo "❌ 服务启动失败！"
    echo ""
    echo "📄 查看错误日志:"
    journalctl -u rainbow-helper --no-pager -l
fi
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
