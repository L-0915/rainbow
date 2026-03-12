# 🌈 彩虹创口贴 - 后端服务

## 文件结构

```
backend/
├── main.py              # 主入口文件（小彩虹聊天）
├── app.py               # 完整后端 API（情绪记录 + 聊天）
├── requirements.txt     # Python 依赖
├── Dockerfile          # Docker 镜像构建文件
├── start.bat           # Windows 启动脚本
├── start_server.sh     # Linux 保活启动脚本
├── deploy.sh           # 一键部署脚本
├── docker-deploy.sh    # Docker 部署脚本
├── rainbow-helper.service  # systemd 服务配置
├── app/                # 后端模块
│   ├── api/           # API 路由
│   ├── models/        # 数据模型
│   ├── schemas/       # 数据校验
│   └── database.py    # 数据库配置
└── 部署指南*.md        # 部署文档
```

## 快速启动

### Windows
```bash
start.bat
```

### Linux/DSW
```bash
chmod +x start_server.sh
./start_server.sh
```

## 部署

详见 `部署指南.md` 或 `云服务器部署指南.md`
