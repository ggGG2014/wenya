<template>
  <div class="space-y-6">
    <h1 class="text-2xl font-bold text-gray-900">⚙️ 设置</h1>

    <!-- 隐私设置 -->
    <div class="bg-white rounded-lg shadow p-6">
      <h2 class="text-lg font-bold text-gray-900 mb-4">🔒 隐私设置</h2>
      <div class="space-y-4">
        <div v-for="item in privacyItems" :key="item.key" class="flex justify-between items-center gap-4">
          <div>
            <div class="font-medium text-gray-900">{{ item.title }}</div>
            <div class="text-sm text-gray-500">{{ item.description }}</div>
          </div>
          <button
            @click="togglePrivacy(item.key)"
            :disabled="savingPrivacy"
            role="switch"
            :aria-checked="!!privacy[item.key]"
            :aria-label="item.title"
            :class="['relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors disabled:opacity-50',
                     privacy[item.key] ? 'bg-green-600' : 'bg-gray-200']"
          >
            <span :class="['inline-block h-4 w-4 transform rounded-full bg-white transition',
                           privacy[item.key] ? 'translate-x-6' : 'translate-x-1']" />
          </button>
        </div>
        <p v-if="privacyMessage" :class="['text-sm', privacyError ? 'text-red-600' : 'text-green-600']">{{ privacyMessage }}</p>
      </div>
    </div>

    <!-- 监护人信息 -->
    <div class="bg-white rounded-lg shadow p-6">
      <h2 class="text-lg font-bold text-gray-900 mb-4">👨‍👩‍👧 监护人信息</h2>
      <div v-if="guardian" class="space-y-2 text-sm">
        <div class="flex justify-between">
          <span class="text-gray-500">监护人姓名</span>
          <span class="text-gray-900">{{ guardian.name }}</span>
        </div>
        <div class="flex justify-between">
          <span class="text-gray-500">关系</span>
          <span class="text-gray-900">{{ guardian.relationship }}</span>
        </div>
        <div class="flex justify-between">
          <span class="text-gray-500">手机号</span>
          <span class="text-gray-900">{{ guardian.phone_masked }}</span>
        </div>
        <div class="flex justify-between">
          <span class="text-gray-500">验证状态</span>
          <span :class="guardian.is_verified ? 'text-green-600' : 'text-amber-600'">
            {{ guardian.is_verified ? '已验证' : '未验证' }}
          </span>
        </div>
        <div v-if="guardian.consent_given_at" class="flex justify-between">
          <span class="text-gray-500">同意时间</span>
          <span class="text-gray-900">{{ formatDate(guardian.consent_given_at) }}</span>
        </div>
      </div>
      <p v-else class="text-sm text-gray-500">暂无监护人信息</p>
      <p class="mt-4 text-xs text-gray-400">如需更换监护人，请由监护人联系平台客服办理。</p>
    </div>

    <!-- 合规信息 -->
    <div class="bg-white rounded-lg shadow p-6">
      <h2 class="text-lg font-bold text-gray-900 mb-4">📋 合规信息</h2>
      <div class="space-y-3 text-sm">
        <div class="flex justify-between">
          <span class="text-gray-500">ICP 备案</span>
          <span class="text-gray-900">{{ complianceInfo.icp_number || '未公示' }}</span>
        </div>
        <div class="flex justify-between">
          <span class="text-gray-500">算法备案</span>
          <span class="text-gray-900">{{ complianceInfo.algorithm_number || '未公示' }}</span>
        </div>
      </div>
      <div class="mt-4 flex space-x-4">
        <a :href="complianceInfo.privacy_policy_url" target="_blank" class="text-green-600 hover:text-green-700 text-sm">隐私政策</a>
        <a :href="complianceInfo.terms_of_service_url" target="_blank" class="text-green-600 hover:text-green-700 text-sm">服务条款</a>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import api, { errorMessage } from '@/api'
import { formatDate } from '@/utils'

const guardian = ref(null)
const complianceInfo = ref({ icp_number: '', algorithm_number: '', privacy_policy_url: '', terms_of_service_url: '' })

const loadSettings = async () => {
  try {
    const complianceRes = await api.get('/compliance/info')
    complianceInfo.value = complianceRes.data.data
  } catch (err) {
    console.error('Failed to load compliance info:', err)
  }
}

onMounted(loadSettings)
</script>
