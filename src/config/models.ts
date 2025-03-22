/**
 * 模型配置文件
 * 包含应用中可以使用的所有模型选项
 */

export interface ModelOption {
  value: string // 模型的值，用于API请求
  label: string // 模型的显示名称
  description?: string // 模型的描述信息
  provider?: string // 提供商
  maxTokens?: number // 默认最大token数
}

/**
 * 可用的聊天模型列表
 */
export const availableModels: ModelOption[] = [
  {
    value: 'deepseek-ai/DeepSeek-R1-Distill-Qwen-7B',
    label: 'DeepSeek R1 Distill Qwen (7B)',
    description: '由DeepSeek优化的轻量级模型，快速且响应高效',
    provider: 'DeepSeek AI',
    maxTokens: 2000,
  },
]

/**
 * 获取默认的模型
 */
export const getDefaultModel = (): ModelOption => {
  return availableModels[0]
}

/**
 * 根据模型值获取模型信息
 */
export const getModelByValue = (value: string): ModelOption | undefined => {
  return availableModels.find(model => model.value === value)
}

/**
 * 模型提供商列表，用于分组显示
 */
export const modelProviders = Array.from(
  new Set(availableModels.map(model => model.provider))
).filter(Boolean) as string[]

/**
 * 根据提供商获取模型列表
 */
export const getModelsByProvider = (provider: string): ModelOption[] => {
  return availableModels.filter(model => model.provider === provider)
}
