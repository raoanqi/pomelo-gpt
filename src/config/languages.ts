/**
 * 语言配置文件
 * 包含应用中可以使用的所有语言选项
 */
import { Language } from '../i18n'

export interface LanguageOption {
  value: Language // 语言代码
  label: string // 语言显示名称
  nativeName: string // 语言的本地名称
  icon?: string // 语言图标/国旗
}

/**
 * 应用支持的语言列表
 */
export const availableLanguages: LanguageOption[] = [
  {
    value: 'zh',
    label: 'Chinese',
    nativeName: '简体中文',
    icon: '🇨🇳',
  },
  {
    value: 'en',
    label: 'English',
    nativeName: 'English',
    icon: '🇺🇸',
  },
]

/**
 * 获取默认语言
 * 尝试匹配浏览器语言，如果没有匹配项则使用第一个语言
 */
export const getDefaultLanguage = (): LanguageOption => {
  const browserLang = navigator.language.split('-')[0] as Language
  const matchedLanguage = availableLanguages.find(lang => lang.value === browserLang)
  return matchedLanguage || availableLanguages[0]
}

/**
 * 根据语言代码获取语言信息
 */
export const getLanguageByValue = (value: Language): LanguageOption | undefined => {
  return availableLanguages.find(lang => lang.value === value)
}

/**
 * 获取语言的显示文本，包含图标和本地名称
 */
export const getLanguageDisplayText = (lang: LanguageOption): string => {
  return `${lang.icon ? lang.icon + ' ' : ''}${lang.nativeName}`
}
