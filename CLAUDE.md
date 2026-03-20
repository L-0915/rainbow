# 彩虹创口贴项目指南

## 项目信息
- **GitHub 仓库**: https://github.com/L-0915/rainbow
- **在线体验**: https://l-0915.github.io/rainbow/

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

### 手表端适配
- 屏幕宽度 ≤ 400px 视为手表设备
- 使用 `useIsWatch()` Hook 检测设备类型
- 手表端布局简洁，大按钮，隐藏底部导航

## 常用命令
```bash
# 开发
cd client && npm run dev

# 构建
cd client && npm run build

# 部署到 GitHub Pages
cd client && npm run build && git add . && git commit -m "deploy" && git push
```