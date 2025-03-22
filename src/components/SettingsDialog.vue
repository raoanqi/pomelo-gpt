<template>
  <el-dialog :title="t('settings.title')" v-model="dialogVisible" width="500px" :before-close="handleCancel"
    :close-on-click-modal="false">
    <el-tabs v-model="activeTab">
      <!-- API设置选项卡 -->
      <el-tab-pane :label="t('settings.api')" name="api">
        <el-form label-position="top">
          <el-form-item :label="t('settings.apiKey')">
            <el-input v-model="localSettings.apiKey" type="password" show-password />
            <div class="help-text">{{ t('settings.apiKeyHint') }}</div>
          </el-form-item>

          <el-form-item :label="t('settings.apiEndpoint')">
            <el-input v-model="localSettings.apiEndpoint" />
            <div class="help-text">{{ t('settings.apiEndpointHint') }}</div>
          </el-form-item>

          <el-form-item :label="t('settings.model')">
            <el-select v-model="localSettings.model" class="w-full">
              <el-option-group v-for="provider in modelProviders" :key="provider" :label="provider">
                <el-option v-for="model in getModelsByProvider(provider)" :key="model.value" :label="model.label"
                  :value="model.value">
                  <div class="model-option">
                    <div class="model-name">{{ model.label }}</div>
                    <div class="model-description">{{ model.description }}</div>
                  </div>
                </el-option>
              </el-option-group>
            </el-select>
            <div class="help-text">{{ t('settings.modelHint') }}</div>
          </el-form-item>

          <div class="advanced-settings">
            <el-collapse>
              <el-collapse-item :title="t('settings.advanced')" name="1">
                <el-form-item :label="t('settings.temperature')">
                  <el-slider v-model="localSettings.temperature" :min="0" :max="1" :step="0.1" show-stops />
                  <div class="temperature-label">
                    <span>{{ t('settings.precise') }}</span>
                    <span>{{ t('settings.creative') }}</span>
                  </div>
                  <div class="help-text">{{ t('settings.temperatureHint') }}</div>
                </el-form-item>

                <el-form-item :label="t('settings.maxTokens')">
                  <el-input-number v-model="localSettings.maxTokens" :min="100" :max="8192" :step="100" />
                  <div class="help-text">{{ t('settings.maxTokensHint') }}</div>
                </el-form-item>
              </el-collapse-item>
            </el-collapse>
          </div>
        </el-form>
      </el-tab-pane>

      <!-- 界面设置选项卡 -->
      <el-tab-pane :label="t('settings.interface')" name="interface">
        <el-form label-position="top">
          <el-form-item :label="t('settings.language')">
            <el-select v-model="localSettings.language" class="w-full">
              <el-option v-for="lang in availableLanguages" :key="lang.value" :label="getLanguageDisplayText(lang)"
                :value="lang.value" />
            </el-select>
            <div class="help-text">{{ t('settings.languageHint') }}</div>
          </el-form-item>
        </el-form>
      </el-tab-pane>
    </el-tabs>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="handleCancel">{{ t('settings.cancel') }}</el-button>
        <el-button type="primary" @click="handleSave">{{ t('settings.save') }}</el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { computed, ref, reactive } from 'vue'
import { ElMessage } from 'element-plus'
import { ChatSettings } from '../services/api'
import { Language, translate } from '../i18n'
import { availableLanguages, getLanguageDisplayText } from '../config/languages'
import { modelProviders, getModelsByProvider } from '../config/models'

// 属性定义
const props = defineProps<{
  modelValue: boolean
  settings: ChatSettings & { language: Language }
}>()

// 事件定义
const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'save', settings: ChatSettings & { language: Language }): void
}>()

// 本地响应式变量
const activeTab = ref('api')
const localSettings = reactive({ ...props.settings })

// 计算对话框可见性
const dialogVisible = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

// 翻译函数
const t = (key: string) => {
  return translate(key, props.settings.language)
}

// 保存设置
const handleSave = () => {
  // 验证APIKey
  if (activeTab.value === 'api' && !localSettings.apiKey && localSettings.apiEndpoint) {
    ElMessage.warning(t('settings.apiKeyRequired'))
    return
  }

  // 触发保存事件
  emit('save', { ...localSettings })
  dialogVisible.value = false
}

// 取消
const handleCancel = () => {
  // 重置为原始设置
  Object.assign(localSettings, props.settings)
  dialogVisible.value = false
}
</script>

<style scoped>
.w-full {
  width: 100%;
}

.help-text {
  font-size: 12px;
  color: #909399;
  margin-top: 4px;
  line-height: 1.4;
}

.temperature-label {
  display: flex;
  justify-content: space-between;
  margin-top: 4px;
  font-size: 12px;
  color: #606266;
}

.advanced-settings {
  margin-top: 16px;
}

.model-option {
  display: flex;
  flex-direction: column;
}

.model-name {
  font-weight: 500;
}

.model-description {
  font-size: 12px;
  color: #909399;
  margin-top: 2px;
}
</style>