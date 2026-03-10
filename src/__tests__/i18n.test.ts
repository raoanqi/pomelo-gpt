import { describe, it, expect } from 'vitest'
import { translate } from '../i18n'

/**
 * 国际化翻译功能测试套件
 * 测试 i18n 模块的翻译功能是否正常工作
 */
describe('i18n 翻译功能', () => {
  /**
   * 测试中文翻译
   * 验证使用中文语言时，能正确返回中文文本
   */
  it('应该正确翻译中文文本', () => {
    const result = translate('send', 'zh')
    expect(result).toBe('发送')
  })

  /**
   * 测试英文翻译
   * 验证使用英文语言时，能正确返回英文文本
   */
  it('应该正确翻译英文文本', () => {
    const result = translate('send', 'en')
    expect(result).toBe('Send')
  })

  /**
   * 测试嵌套键的翻译
   * 验证能正确访问嵌套对象中的翻译文本
   */
  it('应该正确翻译嵌套键', () => {
    const result = translate('settings.title', 'zh')
    expect(result).toBe('设置')
  })

  /**
   * 测试不存在的键
   * 验证当翻译键不存在时，返回键本身作为后备
   */
  it('当键不存在时应该返回键本身', () => {
    const result = translate('nonexistent.key', 'zh')
    expect(result).toBe('nonexistent.key')
  })

  /**
   * 测试错误提示翻译
   * 验证能正确翻译错误消息
   */
  it('应该正确翻译错误消息', () => {
    const result = translate('errors.unknown', 'zh')
    expect(result).toBe('发生错误，请稍后再试。')
  })
})

