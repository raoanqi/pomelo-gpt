# Pomelo GPT

一个基于Electron和Vue 3的跨平台AI聊天应用，支持多种大语言模型和多语言界面。

![Pomelo GPT](https://github.com/raoanqi/pomelo-gpt/raw/main/screenshots/app-preview.png)

## 功能特点

- 🚀 使用Vue 3 + TypeScript + Electron构建
- 🔄 支持连接多种大语言模型API (DeepSeek, Meta Llama, Mistral, OpenAI等)
- 🌐 多语言支持 (中文, 英文)
- 🌙 明/暗模式切换
- 💾 本地保存设置和偏好
- 🎨 美观的UI界面，基于Element Plus
- 📋 代码语法高亮和Markdown渲染
- 🔒 本地化API密钥管理，保护您的数据

## 安装

### 环境要求

- Node.js >= 16
- npm, yarn 或 pnpm (推荐使用pnpm)

### 开发环境设置

```bash
# 安装依赖
pnpm install

# 启动开发服务器
pnpm run dev

# 启动Electron开发模式
pnpm run electron:dev
```

### 构建应用

```bash
# 构建桌面应用
pnpm run electron:build
```

构建完成后，可以在 `release` 目录下找到安装包。

## 配置

在设置面板中，您可以配置：

- API密钥和端点
- 语言模型选择
- 温度和最大令牌数
- 界面语言
- 暗色/亮色主题

## 技术栈

- 前端框架: Vue 3
- UI组件库: Element Plus
- 桌面框架: Electron
- 类型系统: TypeScript
- 构建工具: Vite
- 格式化工具: ESLint + Prettier
- 样式处理: Tailwind CSS
- 国际化: 自定义i18n实现

## 项目结构

```
pomelo-gpt/
├── electron/           # Electron主进程代码
├── src/
│   ├── components/     # Vue组件
│   ├── config/         # 配置文件
│   ├── i18n/           # 国际化文件
│   ├── services/       # API服务
│   ├── App.vue         # 主应用组件
│   └── main.ts         # 应用入口
├── ...配置文件
```

## 许可证

MIT 