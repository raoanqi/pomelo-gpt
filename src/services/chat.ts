import { ChatMessage, ChatSettings, chatCompletion, defaultChatSettings } from './api'

// 获取本地存储中的设置
export const getStoredSettings = (): ChatSettings => {
  if (typeof window === 'undefined') return { ...defaultChatSettings }
  
  const storedSettings = localStorage.getItem('chatSettings')
  return storedSettings ? { ...defaultChatSettings, ...JSON.parse(storedSettings) } : { ...defaultChatSettings }
}

// 创建一个函数生成翻译方法
export const createChatService = (t: (key: string) => string) => {
  // 包装聊天完成功能，添加国际化错误消息
  const sendMessage = async (messages: ChatMessage[], settings: ChatSettings): Promise<string> => {
    try {
      if (!settings.apiKey) {
        return t('errors.apiKeyRequired')
      }
      
      return await chatCompletion(messages, settings)
    } catch (error: any) {
      console.error('Chat service error:', error)
      
      // 处理常见错误类型
      if (error.message.includes('API Key is required')) {
        return t('errors.apiKeyRequired')
      }
      
      // 根据错误信息或状态码确定错误类型
      if (error.response) {
        const status = error.response.status
        
        if (status === 401) {
          return t('errors.invalidApiKey')
        } else if (status === 429) {
          return t('errors.tooManyRequests')
        } else if (status >= 500) {
          return t('errors.serverError')
        }
      }
      
      return t('errors.unknown')
    }
  }
  
  return { sendMessage }
} 