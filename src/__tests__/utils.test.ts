import { describe, it, expect } from 'vitest'

/**
 * 字符串工具函数测试套件
 * 测试常用的字符串处理功能
 */
describe('字符串工具函数', () => {
  /**
   * 测试字符串去除空格
   * 验证 trim 方法能正确去除首尾空格
   */
  it('应该正确去除字符串首尾空格', () => {
    const input = '  hello world  '
    const result = input.trim()
    expect(result).toBe('hello world')
  })

  /**
   * 测试空字符串检测
   * 验证能正确判断字符串是否为空或只包含空格
   */
  it('应该正确检测空字符串', () => {
    expect(''.trim()).toBe('')
    expect('   '.trim()).toBe('')
    expect('hello'.trim()).not.toBe('')
  })

  /**
   * 测试字符串长度计算
   * 验证能正确计算字符串长度（包括中文字符）
   */
  it('应该正确计算字符串长度', () => {
    expect('hello'.length).toBe(5)
    expect('你好'.length).toBe(2)
    expect('hello 你好'.length).toBe(8)
  })
})

/**
 * 对象工具函数测试套件
 * 测试对象操作相关功能
 */
describe('对象工具函数', () => {
  /**
   * 测试对象深拷贝
   * 验证 JSON 方法能正确进行对象深拷贝
   */
  it('应该正确进行对象深拷贝', () => {
    const original = { name: 'test', nested: { value: 123 } }
    const copied = JSON.parse(JSON.stringify(original))
    
    copied.nested.value = 456
    
    expect(original.nested.value).toBe(123)
    expect(copied.nested.value).toBe(456)
  })

  /**
   * 测试对象合并
   * 验证 Object.assign 能正确合并对象
   */
  it('应该正确合并对象', () => {
    const obj1 = { a: 1, b: 2 }
    const obj2 = { b: 3, c: 4 }
    const result = Object.assign({}, obj1, obj2)
    
    expect(result).toEqual({ a: 1, b: 3, c: 4 })
  })

  /**
   * 测试对象属性检查
   * 验证能正确检查对象是否包含某个属性
   */
  it('应该正确检查对象属性', () => {
    const obj = { name: 'test', value: 123 }
    
    expect(obj).toHaveProperty('name')
    expect(obj).toHaveProperty('value')
    expect(obj).not.toHaveProperty('nonexistent')
  })
})

/**
 * 数组工具函数测试套件
 * 测试数组操作相关功能
 */
describe('数组工具函数', () => {
  /**
   * 测试数组切片
   * 验证 slice 方法能正确获取数组的最后 N 个元素
   */
  it('应该正确获取数组最后 N 个元素', () => {
    const arr = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
    const last3 = arr.slice(-3)
    
    expect(last3).toEqual([8, 9, 10])
    expect(last3.length).toBe(3)
  })

  /**
   * 测试数组过滤
   * 验证 filter 方法能正确过滤数组元素
   */
  it('应该正确过滤数组元素', () => {
    const arr = [1, 2, 3, 4, 5]
    const evens = arr.filter(n => n % 2 === 0)
    
    expect(evens).toEqual([2, 4])
  })

  /**
   * 测试数组映射
   * 验证 map 方法能正确转换数组元素
   */
  it('应该正确映射数组元素', () => {
    const arr = [1, 2, 3]
    const doubled = arr.map(n => n * 2)
    
    expect(doubled).toEqual([2, 4, 6])
  })
})

