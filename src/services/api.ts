import axios from 'axios'
import { getDefaultModel } from '../config/models'

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
}

export interface ChatCompletionRequest {
  model: string
  messages: ChatMessage[]
  temperature?: number
  max_tokens?: number
  stream?: boolean
}

export interface ChatSettings {
  apiKey?: string
  apiEndpoint?: string
  model: string
  temperature: number
  maxTokens: number
}

// 默认设置
export const defaultChatSettings: ChatSettings = {
  apiEndpoint: 'https://api.siliconflow.cn/v1/chat/completions',
  model: getDefaultModel().value,
  temperature: 0.7,
  maxTokens: getDefaultModel().maxTokens || 2000,
}

export const chatCompletion = async (
  messages: ChatMessage[],
  settings: ChatSettings
): Promise<string> => {
  if (!settings.apiKey) {
    throw new Error('API Key is required')
  }

  try {
    const apiUrl = settings.apiEndpoint || defaultChatSettings.apiEndpoint
    const response = await axios.post(
      apiUrl as string,
      {
        model: settings.model || defaultChatSettings.model,
        messages: messages,
        temperature: settings.temperature,
        max_tokens: settings.maxTokens,
      } as ChatCompletionRequest,
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${settings.apiKey}`,
        },
      }
    )

    // 提取助手回复
    const responseMessage = response.data.choices[0]?.message?.content || ''
    return responseMessage
  } catch (error: any) {
    console.error('API request failed:', error.response?.data || error.message)

    // 返回更友好的错误消息
    if (error.response) {
      const status = error.response.status
      const data = error.response.data

      if (status === 401) {
        return '错误: API 密钥无效或已过期，请检查设置。'
      } else if (status === 429) {
        return '错误: 请求过多，请稍后再试或检查您的 API 使用限制。'
      } else if (status === 500) {
        return '错误: API 服务器错误，请稍后再试。'
      } else {
        return `错误: ${data.error?.message || '未知错误，请检查控制台日志。'}`
      }
    }

    return `错误: ${error.message || '未知错误，请检查网络连接。'}`
  }
}
