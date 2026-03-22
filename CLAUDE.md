# 彩虹创口贴项目指南

## 项目信息
- **GitHub 仓库**: https://github.com/L-0915/rainbow
- **在线体验**: https://l-0915.github.io/rainbow/

## ⚠️ 核心工作原则

### 遇到问题时必须遵守的规则：
- **查看全部代码**，不要只看局部
- **找出根本原因**，不管用什么方法
- **一定不要提"浏览器缓存"**
- **一定不要提"没有部署"**
- **一定不要确认依赖安装**（依赖早就安装好了）
- **一定是代码本身的问题**

## 开发规则

### 代码提交规则
- **修改完代码后立马上传到 GitHub 上**
- 提交信息使用中文，格式：`<type>: <描述>`
  - feat: 新功能
  - fix: 修复 bug
  - refactor: 重构代码
  - style: 样式调整
  - docs: 文档更新

### 技术栈
- 前端：React 18 + TypeScript + Vite + Tailwind CSS
- 后端：Python FastAPI
- AI：通义千问 API



## 常用命令
```bash
# 开发
cd client && npm run dev

# 构建
cd client && npm run build

# 部署到 GitHub Pages
cd client && npm run build && git add . && git commit -m "deploy" && git push
```