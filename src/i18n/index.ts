import zhLocale from './zh'
import enLocale from './en'

export const translations = {
  zh: zhLocale,
  en: enLocale,
}

export type Language = 'zh' | 'en'

/**
 * 翻译函数
 * @param key 翻译键
 * @param language 当前语言
 * @returns 翻译结果
 */
export const translate = (key: string, language: Language): string => {
  const keys = key.split('.')
  let result: any = translations[language]

  for (const k of keys) {
    if (result && typeof result === 'object' && k in result) {
      result = result[k]
    } else {
      return key
    }
  }

  return String(result)
}

export default translations
