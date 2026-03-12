@echo off
chcp 65001 >nul
echo 🌈 彩虹创口贴 - 后端服务 (简洁版)
echo ================================
echo.

cd /d "%~dp0"

echo [信息] 正在安装依赖...
pip install -r requirements.txt
echo.

echo [信息] 正在启动服务...
echo [信息] API 地址：http://localhost:8000
echo [信息] 聊天 API: http://localhost:8000/api/rainbow-chat/rainbow-chat
echo [信息] 按 Ctrl+C 停止服务
echo.

python main.py

pause
