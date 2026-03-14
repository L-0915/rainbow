# 📱 彩虹创口贴 - APK 打包指南

## 方法一：使用 Android Studio（推荐）

### 1. 安装 Android Studio

1. 下载地址：https://developer.android.com/studio
2. 安装完成后，打开 Android Studio

### 2. 打开项目

1. 启动 Android Studio
2. 选择 `Open an Existing Project`
3. 选择路径：`D:\parent say\彩虹创口贴\Rainbow_Helper\client\android`

### 3. 构建 APK

#### 方式 A：使用 IDE 构建（最简单）

1. 点击菜单 `Build` → `Build Bundle(s) / APK(s)` → `Build APK(s)`
2. 等待构建完成
3. APK 位置：`client\android\app\build\outputs\apk\debug\app-debug.apk`

#### 方式 B：使用 Gradle 命令

1. 打开终端（Terminal）
2. 进入项目目录：
   ```bash
   cd "D:\parent say\彩虹创口贴\Rainbow_Helper\client\android"
   ```
3. 执行构建命令：
   ```bash
   # 调试版 APK
   gradlew assembleDebug

   # 或发布版 APK（需要签名配置）
   gradlew assembleRelease
   ```

### 4. 获取 APK 文件

构建成功后，APK 文件位置：

**调试版：**
```
D:\parent say\彩虹创口贴\Rainbow_Helper\client\android\app\build\outputs\apk\debug\app-debug.apk
```

**发布版：**
```
D:\parent say\彩虹创口贴\Rainbow_Helper\client\android\app\build\outputs\apk\release\app-release-unsigned.apk
```

---

## 方法二：使用 Capacitor 命令（需要先安装 Java）

### 前置要求

1. **安装 JDK 17**
   - 下载：https://www.oracle.com/java/technologies/downloads/#jdk17-windows
   - 安装后设置环境变量 `JAVA_HOME`

2. **安装 Android SDK**
   - 通过 Android Studio 安装
   - 或使用命令行工具：https://developer.android.com/studio#command-tools

### 构建步骤

```bash
# 1. 进入客户端目录
cd "D:\parent say\彩虹创口贴\Rainbow_Helper\client"

# 2. 构建前端
npm run build

# 3. 同步到 Android
npx cap sync android

# 4. 打开 Android Studio
npx cap open android

# 5. 在 Android Studio 中构建 APK（见方法一）
```

---

## 方法三：在线云构建（无需本地环境）

### 使用 GitHub Actions（推荐）

项目已配置 GitHub Actions，推送代码后自动构建 APK：

1. 推送代码到 GitHub：
   ```bash
   git push github master
   ```

2. 访问 Actions 页面：
   https://github.com/L-0915/rainbow/actions

3. 下载构建产物中的 APK 文件

### 使用 EAS Build（Expo）

如果项目迁移到 Expo，可以使用 EAS Build 云构建服务。

---

## 手表安装说明

### 1. 通过 ADB 安装（推荐）

```bash
# 启用手表的开发者模式
# 连接手表到电脑（USB 或 ADB over WiFi）

# 安装 APK
adb install app-debug.apk

# 或指定设备
adb -s <device_id> install app-debug.apk
```

### 2. 通过文件传输安装

1. 将 APK 文件复制到手表存储
2. 在手表上使用文件管理器打开 APK
3. 点击安装（需要允许"未知来源"）

### 3. 通过 Android Auto 安装

1. 手机安装 APK
2. 通过 Android Auto 同步到手表

---

## 配置 API 地址

打包前请修改 API 地址：

### 修改 `client\.env.production`

```bash
# 替换为你的实际 API 地址
VITE_API_URL=https://your-api-domain.com/api
```

### 或修改 `client\capacitor.config.json`

```json
{
  "server": {
    "url": "https://your-api-domain.com"
  }
}
```

---

## 常见问题

### Q: 构建失败，提示 "SDK not found"
A: 在 Android Studio 中安装 Android SDK：
   - Tools → SDK Manager → 安装 Android SDK Platform

### Q: 构建失败，提示 "Java not found"
A: 安装 JDK 17 并设置环境变量：
   - JAVA_HOME = C:\Program Files\Java\jdk-17
   - Path 中添加 %JAVA_HOME%\bin

### Q: APK 太大（超过 50MB）
A: 可以启用代码压缩：
   ```gradle
   buildTypes {
       release {
           minifyEnabled true
           shrinkResources true
           proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'), 'proguard-rules.pro'
       }
   }
   ```

### Q: 手表无法安装
A: 检查：
   1. 手表的 Android 版本是否满足要求（minSdkVersion）
   2. 是否启用了"未知来源"安装权限
   3. 存储空间是否足够

---

## 快速打包脚本

创建 `build-apk.bat`：

```batch
@echo off
echo 🌈 开始构建彩虹创口贴 APK...

cd /d "%~dp0client"

echo 📦 步骤 1: 安装依赖...
call npm install

echo 🔨 步骤 2: 构建前端...
call npm run build

echo 📱 步骤 3: 同步到 Android...
call npx cap sync android

echo 🚀 步骤 4: 打开 Android Studio...
call npx cap open android

echo ✅ 构建完成！请在 Android Studio 中继续构建 APK
pause
```

双击运行即可自动完成前 3 步，然后在 Android Studio 中点击 Build → Build APK。

---

## 发布签名（可选）

如果要发布到应用商店，需要创建签名密钥：

```bash
# 生成密钥库
keytool -genkey -v -keystore rainbow-release-key.jks -keyalg RSA -keysize 2048 -validity 10000 -alias rainbow

# 在 gradle.properties 中添加签名配置
RAINBOW_RELEASE_STORE_FILE=rainbow-release-key.jks
RAINBOW_RELEASE_KEY_ALIAS=rainbow
RAINBOW_RELEASE_STORE_PASSWORD=你的密码
RAINBOW_RELEASE_KEY_PASSWORD=你的密码
```

---

## 技术支持

- GitHub Issues: https://github.com/L-0915/rainbow/issues
- 文档：查看项目根目录的技术说明文档
