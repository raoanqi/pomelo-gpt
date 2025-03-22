<template>
  <div class="chat-container" :class="{ 'dark-mode': isDarkMode }">
    <!-- 顶部标题栏 -->
    <div class="header">
      <div class="header-left">
        <el-button class="action-button settings-button" circle @click="showSettings = true">
          <el-icon>
            <Setting />
          </el-icon>
        </el-button>
      </div>

      <div class="header-center">
        <h1 class="title">Pomelo GPT</h1>
      </div>

      <div class="header-right">
        <el-button class="action-button theme-toggle" circle @click="toggleDarkMode"
          :type="isDarkMode ? 'info' : 'warning'">
          <el-icon v-if="isDarkMode">
            <Sunny />
          </el-icon>
          <el-icon v-else>
            <Moon />
          </el-icon>
        </el-button>
      </div>
    </div>

    <!-- 消息内容区域，可滚动 -->
    <div class="message-container" ref="messageContainer">
      <!-- 用户和助手消息 -->
      <div v-for="(message, index) in messages" :key="index"
        :class="['message', message.type === 'user' ? 'message-user' : 'message-assistant']">
        <el-avatar :icon="message.type === 'user' ? 'User' : 'ChatDotSquare'"
          :class="message.type === 'user' ? 'bg-blue-500' : 'bg-green-500'"></el-avatar>
        <div class="message-content" v-html="formatMessage(message.content)"></div>
      </div>

      <!-- 加载状态 -->
      <div v-if="isLoading" class="message message-assistant">
        <el-avatar icon="ChatDotSquare" class="bg-green-500"></el-avatar>
        <div class="message-content loading-message">
          <div class="typing-dots">
            <span></span>
            <span></span>
            <span></span>
          </div>
        </div>
      </div>

      <!-- 当消息为空时显示的欢迎内容 -->
      <div v-if="messages.length === 0 && !isLoading" class="welcome-container">
        <el-empty :description="t('welcomeMessage')">
          <el-button type="primary" @click="focusInput">{{ t('startChat') }}</el-button>
        </el-empty>
      </div>
    </div>

    <!-- 底部输入区域，固定在底部 -->
    <div class="input-container">
      <div class="input-wrapper">
        <el-input v-model="inputMessage" type="textarea" :rows="3" :placeholder="t('typePlaceholder')" clearable
          @keyup.enter.ctrl="sendMessage" ref="inputRef" :disabled="isLoading" resize="none" />
        <!-- 独立的发送按钮 -->
        <el-button type="primary" @click="sendMessage" :loading="isLoading" :disabled="isLoading" class="send-button">
          <template v-if="!isLoading">
            <el-icon>
              <Position />
            </el-icon>
            <span>{{ t('send') }}</span>
          </template>
          <template v-else>
            <span>{{ t('thinking') }}</span>
          </template>
        </el-button>
      </div>
    </div>

    <!-- 设置对话框 -->
    <SettingsDialog v-model="showSettings" :settings="settings" @save="saveSettings" />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, nextTick, reactive, watch } from 'vue'
import { Moon, Sunny, Setting, Position } from '@element-plus/icons-vue'
import { ChatMessage, ChatSettings, defaultChatSettings } from './services/api'
import { createChatService, getStoredSettings } from './services/chat'
import SettingsDialog from './components/SettingsDialog.vue'
import { translate, type Language } from './i18n'
import { getDefaultLanguage } from './config/languages'
import { marked } from 'marked'
import hljs from 'highlight.js'
import 'highlight.js/styles/github.css'

interface Message {
  content: string
  type: 'user' | 'assistant'
}

const messages = ref<Message[]>([])
const inputMessage = ref('')
const messageContainer = ref<HTMLElement | null>(null)
const inputRef = ref<HTMLElement | null>(null)
const isLoading = ref(false)
const isDarkMode = ref(false)
const showSettings = ref(false)

// 当前设置
const settings = reactive<ChatSettings & { language: Language }>({
  ...defaultChatSettings,
  language: getDefaultLanguage().value
})

// 临时设置（在对话框中编辑）
const tempSettings = reactive({ ...settings })

// 翻译函数
const t = (key: string): string => {
  return translate(key, settings.language)
}

// 创建聊天服务
const chatService = createChatService(t)

// 切换暗色模式
const toggleDarkMode = () => {
  isDarkMode.value = !isDarkMode.value
  // 保存到本地存储
  localStorage.setItem('darkMode', isDarkMode.value ? 'true' : 'false')

  // 设置文档元素的暗色模式类
  if (isDarkMode.value) {
    document.documentElement.classList.add('dark')
  } else {
    document.documentElement.classList.remove('dark')
  }
}

// 保存设置
const saveSettings = (newSettings: ChatSettings & { language: string }) => {
  // 复制新设置到当前设置
  Object.assign(settings, newSettings)

  // 保存语言和 UI 设置到本地存储
  localStorage.setItem('settings', JSON.stringify({
    language: settings.language
  }))

  // 保存 API 设置到本地存储
  localStorage.setItem('chatSettings', JSON.stringify({
    apiKey: settings.apiKey,
    apiEndpoint: settings.apiEndpoint,
    model: settings.model,
    temperature: settings.temperature,
    maxTokens: settings.maxTokens
  }))
}

// 发送消息
const sendMessage = async () => {
  if (!inputMessage.value.trim() || isLoading.value) return

  // 添加用户消息
  messages.value.push({
    content: inputMessage.value,
    type: 'user'
  })

  // 清空输入框
  const userMessage = inputMessage.value
  inputMessage.value = ''

  // 滚动到底部
  await nextTick()
  scrollToBottom()

  // 设置加载状态
  isLoading.value = true

  try {
    // 构建聊天消息历史
    const chatMessages: ChatMessage[] = []

    // 添加前 10 条消息作为上下文
    const recentMessages = messages.value.slice(-10)
    for (const msg of recentMessages) {
      chatMessages.push({
        role: msg.type === 'user' ? 'user' : 'assistant',
        content: msg.content
      })
    }

    // 确保最后一条是用户消息
    if (chatMessages[chatMessages.length - 1].role !== 'user') {
      chatMessages.push({ role: 'user', content: userMessage })
    }

    // 调用 API
    const response = await chatService.sendMessage(chatMessages, {
      apiKey: settings.apiKey,
      apiEndpoint: settings.apiEndpoint,
      model: settings.model,
      temperature: settings.temperature,
      maxTokens: settings.maxTokens
    })

    // 添加 AI 响应
    messages.value.push({
      content: response,
      type: 'assistant'
    })

  } catch (error) {
    console.error('Error sending message:', error)

    // 添加错误响应
    messages.value.push({
      content: t('errors.unknown'),
      type: 'assistant'
    })
  } finally {
    // 关闭加载状态
    isLoading.value = false

    // 消息更新后再次滚动到底部
    nextTick(() => {
      scrollToBottom()
    })
  }
}

// 滚动到底部
const scrollToBottom = () => {
  if (messageContainer.value) {
    messageContainer.value.scrollTop = messageContainer.value.scrollHeight
  }
}

// 聚焦输入框
const focusInput = () => {
  if (inputRef.value) {
    // @ts-ignore: Element Plus 的 ref 类型问题
    inputRef.value.focus()
  }
}

// 加载设置
const loadSettings = () => {
  // 从本地存储加载设置
  const savedSettings = localStorage.getItem('settings')
  if (savedSettings) {
    try {
      const parsedSettings = JSON.parse(savedSettings)
      Object.assign(settings, parsedSettings)

      // 同步到临时设置
      Object.assign(tempSettings, settings)
    } catch (e) {
      console.error('Failed to parse settings:', e)
    }
  }

  // 加载 API 设置
  const storedApiSettings = getStoredSettings()
  if (storedApiSettings) {
    settings.apiKey = storedApiSettings.apiKey || settings.apiKey
    settings.apiEndpoint = storedApiSettings.apiEndpoint || settings.apiEndpoint
    settings.model = storedApiSettings.model || settings.model
    settings.temperature = storedApiSettings.temperature || settings.temperature
    settings.maxTokens = storedApiSettings.maxTokens || settings.maxTokens

    // 同步到临时设置
    Object.assign(tempSettings, settings)
  }
}

// 监听语言变化
watch(() => settings.language, (newLang) => {
  document.documentElement.lang = newLang
})

// 组件挂载后
onMounted(() => {
  // 从本地存储读取暗色模式设置
  const savedDarkMode = localStorage.getItem('darkMode')
  if (savedDarkMode === 'true') {
    isDarkMode.value = true
    document.documentElement.classList.add('dark')
  }

  // 检测系统颜色模式
  const prefersDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches
  if (savedDarkMode === null && prefersDarkMode) {
    isDarkMode.value = true
    document.documentElement.classList.add('dark')
  }

  // 加载设置
  loadSettings()

  // 设置语言
  document.documentElement.lang = settings.language

  // 聚焦输入框
  focusInput()
})

// 添加一个简单的HTML过滤函数
const sanitizeHtml = (html: string): string => {
  // 这只是一个简单的过滤，生产环境应该使用更完整的库
  // 移除可能的脚本标签和事件处理属性
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/on\w+="[^"]*"/g, '')
    .replace(/on\w+='[^']*'/g, '');
}

// 添加formatMessage函数
const formatMessage = (content: string) => {
  try {
    // 处理所有未标记语言的代码块，将它们标记为JavaScript
    let processedContent = content.replace(/```(?!\w+)([\s\S]*?)```/g, '```javascript$1```');

    // 确保换行符保持一致
    processedContent = processedContent.replace(/\r\n/g, '\n');

    // 解析Markdown
    let html = marked.parse(processedContent) as string;

    // 查找所有代码块并应用语法高亮
    html = html.replace(/<pre><code class="language-(\w+)">([\s\S]*?)<\/code><\/pre>/g,
      (_match, lang, code) => {
        const decodedCode = code.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
        try {
          const highlighted = lang && hljs.getLanguage(lang)
            ? hljs.highlight(decodedCode, { language: lang }).value
            : hljs.highlightAuto(decodedCode).value;

          return `<pre><code class="hljs language-${lang}">${highlighted}</code></pre>`;
        } catch (e) {
          return `<pre><code class="hljs language-${lang}">${code}</code></pre>`;
        }
      }
    );

    // 使用简单的HTML过滤取代DOMPurify
    return sanitizeHtml(html);
  } catch (error) {
    console.error('Error formatting message:', error);
    return content;
  }
}
</script>

<style scoped>
.chat-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background-color: #f5f7fa;
  transition: all 0.3s ease;
  width: 100%;
}

.dark-mode {
  background-color: #1a1a1a;
  color: #f0f0f0;
}

.header {
  padding: 16px;
  background-color: #ffffff;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  z-index: 10;
  position: relative;
  transition: all 0.3s ease;
  display: flex;
  justify-content: space-between;
  align-items: center;
  /* border-radius: 0 0 12px 12px; */
}

.dark-mode .header {
  background-color: #222222;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.3);
}

.header-left {
  display: flex;
  align-items: center;
  width: 48px;
  /* 确保左右两侧区域宽度相等 */
}

.header-center {
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
}

.header-right {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  width: 48px;
  /* 确保左右两侧区域宽度相等 */
}

.title {
  margin: 0;
  font-size: 24px;
  font-weight: 600;
  text-align: center;
  transition: color 0.3s ease;
  background-image: linear-gradient(135deg, #409eff, #67c23a);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
  padding: 0 10px;
}

.dark-mode .title {
  background-image: linear-gradient(135deg, #67c23a, #409eff);
  -webkit-text-fill-color: transparent;
}

.action-button {
  transition: all 0.3s ease;
  border: none !important;
}

.action-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.theme-toggle {
  position: relative;
}

.settings-button {
  position: relative;
}

.message-container {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 20px;
  transition: background-color 0.3s ease;
}

.dark-mode .message-container {
  background-color: #1a1a1a;
}

.message {
  display: flex;
  gap: 12px;
  max-width: 85%;
  align-items: flex-start;
}

.message-user {
  align-self: flex-end;
  flex-direction: row-reverse;
}

.message-assistant {
  align-self: flex-start;
}

.message-content {
  padding: 12px 16px;
  border-radius: 8px;
  background-color: #ffffff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  line-height: 1.5;
  transition: all 0.3s ease;
}

.dark-mode .message-content {
  background-color: #333333;
  color: #f0f0f0;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}

.message-user .message-content {
  background-color: #ecf5ff;
}

.dark-mode .message-user .message-content {
  background-color: #1e1e1e;
  color: #ffffff;
}

.welcome-container {
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
}

.input-container {
  padding: 16px;
  background-color: #ffffff;
  border-top: 1px solid #ebeef5;
  transition: all 0.3s ease;
}

.dark-mode .input-container {
  background-color: #222222;
  border-top: 1px solid #333333;
}

.input-wrapper {
  position: relative;
  max-width: 800px;
  margin: 0 auto;
}

.input-wrapper :deep(.el-textarea__inner) {
  padding-right: 100px;
  border-radius: 12px;
  font-size: 14px;
  line-height: 1.6;
  background-color: #f5f7fa;
  border: 1px solid #e4e7ed;
  transition: all 0.3s ease;
}

.dark-mode .input-wrapper :deep(.el-textarea__inner) {
  background-color: #333333;
  border-color: #4a4a4a;
  color: #f0f0f0;
}

.input-wrapper :deep(.el-textarea__inner:focus) {
  border-color: #409eff;
  box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.1);
}

.send-button {
  position: absolute !important;
  right: 8px;
  bottom: 8px;
  border-radius: 8px;
  padding: 8px 16px;
  height: auto;
  min-width: 88px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  transition: all 0.3s ease;
  z-index: 1;
}

.send-button:hover {
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(64, 158, 255, 0.2);
}

.send-button:active {
  transform: translateY(0);
}

.send-button .el-icon {
  font-size: 16px;
}

.send-button.is-loading {
  padding-left: 16px;
  padding-right: 16px;
}

/* 加载动画 */
.loading-message {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  min-height: 40px;
  gap: 12px;
  padding: 10px 5px;
}

.loading-skeleton {
  width: 100%;
  max-width: 550px;
  animation: skeleton-loading 1.5s ease-in-out infinite;
}

.skeleton-line {
  height: 14px;
  background-color: rgba(190, 190, 190, 0.2);
  border-radius: 4px;
  margin-bottom: 12px;
}

.skeleton-paragraph {
  margin: 16px 0;
}

.skeleton-code-block {
  background-color: rgba(0, 0, 0, 0.03);
  border-radius: 6px;
  padding: 12px;
  margin: 8px 0;
  border-left: 3px solid #409eff;
}

.dark-mode .skeleton-code-block {
  background-color: rgba(255, 255, 255, 0.05);
  border-left-color: #67c23a;
}

.dark-mode .skeleton-line {
  background-color: rgba(255, 255, 255, 0.1);
}

@keyframes skeleton-loading {
  0% {
    opacity: 0.6;
  }

  50% {
    opacity: 1;
  }

  100% {
    opacity: 0.6;
  }
}

/* 打字指示动画 */
.typing-dots {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  background-color: rgba(0, 0, 0, 0.04);
  border-radius: 20px;
  margin: 0 auto;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.dark-mode .typing-dots {
  background-color: rgba(255, 255, 255, 0.1);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}

.typing-dots span {
  height: 10px;
  width: 10px;
  display: block;
  border-radius: 50%;
  opacity: 0.8;
  animation: dot-pulse 1.2s infinite ease-in-out;
}

.dark-mode .typing-dots span {
  /* background-color 已被移至各个子元素 */
}

.typing-dots span:nth-child(1) {
  animation-delay: 0s;
  background-color: #409eff;
}

.typing-dots span:nth-child(2) {
  animation-delay: 0.3s;
  background-color: #67c23a;
}

.typing-dots span:nth-child(3) {
  animation-delay: 0.6s;
  background-color: #e6a23c;
}

.dark-mode .typing-dots span:nth-child(1) {
  background-color: #409eff;
}

.dark-mode .typing-dots span:nth-child(2) {
  background-color: #67c23a;
}

.dark-mode .typing-dots span:nth-child(3) {
  background-color: #e6a23c;
}

@keyframes dot-pulse {

  0%,
  100% {
    transform: scale(0.6);
    opacity: 0.5;
  }

  50% {
    transform: scale(1.3);
    opacity: 1;
  }
}

/* 设置对话框样式 */
.dialog-footer {
  display: flex;
  justify-content: flex-end;
  margin-top: 20px;
  gap: 10px;
}

/* Markdown样式 */
.message-content {
  line-height: 1.6;
}

.message-content pre {
  background-color: #f8f8f8;
  border-radius: 6px;
  padding: 16px;
  overflow-x: auto;
  margin: 16px 0;
  border: 1px solid #e0e0e0;
  font-family: 'Courier New', Courier, monospace;
  white-space: pre-wrap;
  word-break: break-all;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  position: relative;
}

.message-content pre::before {
  content: 'JavaScript';
  position: absolute;
  top: 0;
  right: 0;
  background: #f1f1f1;
  color: #666;
  padding: 2px 8px;
  font-size: 12px;
  border-radius: 0 6px 0 6px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
}

.dark-mode .message-content pre {
  background-color: #1e1e1e;
  color: #f8f8f8;
  border: 1px solid #444;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}

.dark-mode .message-content pre::before {
  background: #333;
  color: #ccc;
}

.dark-mode .message-content .hljs {
  background-color: #1e1e1e;
  color: #e0e0e0;
}

.dark-mode .message-content .hljs-keyword,
.dark-mode .message-content .hljs-selector-tag,
.dark-mode .message-content .hljs-title,
.dark-mode .message-content .hljs-section,
.dark-mode .message-content .hljs-doctag,
.dark-mode .message-content .hljs-name,
.dark-mode .message-content .hljs-strong {
  color: #569cd6;
}

.dark-mode .message-content .hljs-comment {
  color: #608b4e;
}

.dark-mode .message-content .hljs-string,
.dark-mode .message-content .hljs-title.inherited__,
.dark-mode .message-content .hljs-meta,
.dark-mode .message-content .hljs-literal,
.dark-mode .message-content .hljs-quote {
  color: #ce9178;
}

.dark-mode .message-content .hljs-attr,
.dark-mode .message-content .hljs-variable,
.dark-mode .message-content .hljs-template-variable,
.dark-mode .message-content .hljs-selector-id,
.dark-mode .message-content .hljs-selector-class {
  color: #9cdcfe;
}

.dark-mode .message-content .hljs-number,
.dark-mode .message-content .hljs-built_in,
.dark-mode .message-content .hljs-builtin-name,
.dark-mode .message-content .hljs-symbol {
  color: #b5cea8;
}

.dark-mode .message-content .hljs-function {
  color: #dcdcaa;
}

.message-content code {
  font-family: 'Courier New', Courier, monospace;
  padding: 2px 4px;
  background-color: #f0f0f0;
  border-radius: 3px;
  font-size: 0.9em;
  color: #e83e8c;
}

.dark-mode .message-content code {
  background-color: #333;
  color: #eee;
}

.message-content p {
  margin: 8px 0;
}

.message-content ul,
.message-content ol {
  padding-left: 20px;
  margin: 8px 0;
}

.message-content blockquote {
  border-left: 4px solid #ddd;
  padding-left: 10px;
  color: #666;
  margin: 8px 0;
}

.dark-mode .message-content blockquote {
  border-left-color: #555;
  color: #aaa;
}

.message-content table {
  border-collapse: collapse;
  width: 100%;
  margin: 8px 0;
}

.message-content th,
.message-content td {
  border: 1px solid #ddd;
  padding: 8px;
  text-align: left;
}

.dark-mode .message-content th,
.dark-mode .message-content td {
  border-color: #555;
}

.message-content th {
  background-color: #f2f2f2;
}

.dark-mode .message-content th {
  background-color: #333;
}

.message-content img {
  max-width: 100%;
  height: auto;
  border-radius: 4px;
  margin: 8px 0;
}

.message-content a {
  color: #409eff;
  text-decoration: none;
}

.message-content a:hover {
  text-decoration: underline;
}

.dark-mode .message-content a {
  color: #67c23a;
}

.message-content pre code {
  background-color: transparent;
  padding: 0;
  border-radius: 0;
  font-family: 'Courier New', Courier, monospace;
  font-size: 14px;
  line-height: 1.5;
  tab-size: 2;
}

/* hljs基本样式 */
.message-content .hljs {
  display: block;
  overflow-x: auto;
  padding: 0;
  color: #333;
  background: transparent;
}

.message-content pre {
  position: relative;
  padding-top: 30px !important;
}

.message-content pre::before {
  content: 'JavaScript';
  position: absolute;
  top: 0;
  right: 0;
  background: #f1f1f1;
  color: #666;
  padding: 2px 10px;
  font-size: 12px;
  border-radius: 0 6px 0 6px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', sans-serif;
}

/* 添加头像样式 */
.message .el-avatar {
  flex-shrink: 0;
  margin-top: 6px;
}

.message-user .el-avatar {
  align-self: flex-start;
}

.message-assistant .el-avatar {
  align-self: flex-start;
}
</style>