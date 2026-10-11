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

    <!-- 账号安全 -->
    <div class="bg-white rounded-lg shadow p-6">
      <h2 class="text-lg font-bold text-gray-900 mb-4">🛡️ 账号安全</h2>

      <button
        v-if="!showPasswordForm"
        @click="openPasswordForm"
        class="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 text-sm"
      >
        修改密码
      </button>
      <form v-else @submit.prevent="changePassword" class="space-y-3" data-testid="password-form">
        <input v-model="passwordForm.old_password" type="password" required autocomplete="current-password"
               placeholder="原密码" class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
        <input v-model="passwordForm.new_password" type="password" required autocomplete="new-password"
               placeholder="新密码（至少 8 位，包含字母和数字）" class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
        <input v-model="passwordForm.confirm" type="password" required autocomplete="new-password"
               placeholder="再次输入新密码" class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
        <div class="flex gap-3">
          <button type="submit" :disabled="changingPassword"
                  class="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm disabled:opacity-50">
            {{ changingPassword ? '提交中...' : '确认修改' }}
          </button>
          <button type="button" @click="showPasswordForm = false" class="px-4 py-2 text-gray-500 text-sm">取消</button>
        </div>
      </form>
      <p v-if="passwordMessage" :class="['mt-2 text-sm', passwordError ? 'text-red-600' : 'text-green-600']">{{ passwordMessage }}</p>
    </div>

    <!-- 我的数据 -->
    <div class="bg-white rounded-lg shadow p-6">
      <h2 class="text-lg font-bold text-gray-900 mb-2">📦 我的数据</h2>
      <p class="text-sm text-gray-500 mb-4">你可以导出账号资料和全部作文（JSON 格式），每天最多 3 次。</p>
      <button
        @click="exportData"
        :disabled="exporting"
        class="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 text-sm mb-3 disabled:opacity-50"
      >
        {{ exporting ? '导出中...' : '导出我的数据' }}
      </button>
      <p v-if="exportMessage" :class="['text-sm mb-3', exportError ? 'text-red-600' : 'text-green-600']">{{ exportMessage }}</p>
      <button
        @click="showDeleteInfo = !showDeleteInfo"
        class="w-full px-4 py-2 border border-red-200 text-red-600 rounded-md hover:bg-red-50 text-sm"
      >
        注销账号
      </button>
      <p v-if="showDeleteInfo" class="mt-2 text-sm text-gray-600 bg-gray-50 rounded p-3">
        根据未成年人保护相关规定，注销账号需由监护人联系平台客服核实身份后办理。注销前建议先导出你的数据。
      </p>
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
import { useUserStore } from '@/stores/user'
import api, { errorMessage } from '@/api'
import { formatDate } from '@/utils'

const userStore = useUserStore()

const privacyItems = [
  { key: 'show_in_ranking', title: '在排行榜中显示', description: '开启后你的成绩将出现在同年级排行榜中' },
  { key: 'show_works_publicly', title: '公开展示作品', description: '关闭后你已发布的作品将从社区隐藏' }
]
const privacy = ref({ show_in_ranking: true, show_works_publicly: true })
const savingPrivacy = ref(false)
const privacyMessage = ref('')
const privacyError = ref(false)

const guardian = ref(null)
const complianceInfo = ref({ icp_number: '', algorithm_number: '', privacy_policy_url: '', terms_of_service_url: '' })

const showPasswordForm = ref(false)
const passwordForm = ref({ old_password: '', new_password: '', confirm: '' })
const changingPassword = ref(false)
const passwordMessage = ref('')
const passwordError = ref(false)

const exporting = ref(false)
const exportMessage = ref('')
const exportError = ref(false)
const showDeleteInfo = ref(false)

const loadSettings = async () => {
  try {
    const [profileRes, complianceRes] = await Promise.all([api.get('/auth/profile'), api.get('/compliance/info')])
    const { user, guardian: g } = profileRes.data.data
    privacy.value = { show_in_ranking: user.show_in_ranking, show_works_publicly: user.show_works_publicly }
    guardian.value = g
    complianceInfo.value = complianceRes.data.data
  } catch (err) {
    privacyMessage.value = errorMessage(err, '设置加载失败')
    privacyError.value = true
  }
}

const togglePrivacy = async (key) => {
  const value = !privacy.value[key]
  savingPrivacy.value = true
  privacyMessage.value = ''
  try {
    const res = await api.put('/auth/profile', { [key]: value })
    const user = res.data.data.user
    privacy.value[key] = user[key]
    userStore.updateUser({ [key]: user[key] })
    privacyError.value = false
    privacyMessage.value = '已保存'
  } catch (err) {
    privacyError.value = true
    privacyMessage.value = errorMessage(err, '保存失败')
  } finally {
    savingPrivacy.value = false
  }
}

const openPasswordForm = () => {
  passwordForm.value = { old_password: '', new_password: '', confirm: '' }
  passwordMessage.value = ''
  showPasswordForm.value = true
}

const changePassword = async () => {
  const form = passwordForm.value
  if (form.new_password !== form.confirm) {
    passwordError.value = true
    passwordMessage.value = '两次输入的新密码不一致'
    return
  }
  changingPassword.value = true
  try {
    const res = await api.post('/auth/change-password', {
      old_password: form.old_password,
      new_password: form.new_password
    })
    passwordError.value = false
    passwordMessage.value = res.data.message || '密码修改成功'
    showPasswordForm.value = false
  } catch (err) {
    passwordError.value = true
    passwordMessage.value = errorMessage(err, '密码修改失败')
  } finally {
    changingPassword.value = false
  }
}

const exportData = async () => {
  exporting.value = true
  exportMessage.value = ''
  try {
    const res = await api.post('/auth/export-data')
    const blob = new Blob([JSON.stringify(res.data.data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `wenya-${userStore.user?.username || 'data'}-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
    exportError.value = false
    exportMessage.value = `已导出 ${res.data.data.writings.length} 篇作文`
  } catch (err) {
    exportError.value = true
    exportMessage.value = errorMessage(err, '导出失败')
  } finally {
    exporting.value = false
  }
}

onMounted(loadSettings)
</script>
