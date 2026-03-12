@echo off
chcp 65001 >nul
echo ╔════════════════════════════════════════════════════════╗
echo ║     🌈 彩虹创口贴 - 前端打包成 App                       ║
echo ║     后端地址：http://rainbow.cpolar.top                 ║
echo ╚════════════════════════════════════════════════════════╝
echo.

cd /d "%~dp0client"

echo [1/4] 使用生产环境配置...
echo     VITE_API_BASE_URL=http://rainbow.cpolar.top
echo.

echo [2/4] 安装依赖...
call npm install

if %errorlevel% neq 0 (
    echo ❌ 依赖安装失败
    pause
    exit /b 1
)

echo.
echo [3/4] 构建前端...
call npm run build

if %errorlevel% neq 0 (
    echo ❌ 前端构建失败
    pause
    exit /b 1
)

echo.
echo [4/4] 同步到 Android...
call npx cap sync

if %errorlevel% neq 0 (
    echo ❌ 同步失败
    pause
    exit /b 1
)

echo.
echo ════════════════════════════════════════════════════════
echo ✅ 打包完成！
echo.
echo 📱 下一步：
echo    1. 打开 Android Studio
echo       命令：npx cap open android
echo.
echo    2. 等待 Gradle 同步完成
echo.
echo    3. 构建 APK:
echo       Build → Build Bundle(s)/APK(s) → Build APK(s)
echo.
echo 📂 APK 位置:
echo    client\android\app\build\outputs\apk\debug\app-debug.apk
echo ════════════════════════════════════════════════════════
echo.
pause
