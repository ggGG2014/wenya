<template>
  <div class="space-y-6">
    <h1 class="text-2xl font-bold text-gray-900">👤 个人中心</h1>

    <!-- 基本信息 -->
    <div class="bg-white rounded-lg shadow p-6">
      <h2 class="text-lg font-bold text-gray-900 mb-4">基本信息</h2>
      <div class="flex items-center space-x-4">
        <div v-if="userStore.user?.avatar_url" class="w-20 h-20 rounded-full overflow-hidden">
          <img :src="userStore.user.avatar_url" alt="头像" class="w-full h-full object-cover" />
        </div>
        <div v-else class="w-20 h-20 rounded-full bg-green-500 flex items-center justify-center text-white text-2xl font-bold">
          {{ userStore.user?.nickname?.[0] || userStore.user?.username?.[0] || 'U' }}
        </div>
        <div class="flex-1">
          <div v-if="!editingNickname" class="flex items-center gap-3">
            <span class="text-xl font-bold text-gray-900">{{ userStore.user?.nickname || userStore.user?.username }}</span>
            <button @click="startEditNickname" class="text-sm text-green-600 hover:text-green-700">修改昵称</button>
          </div>
          <div v-else class="flex items-center gap-2">
            <input
              v-model="nicknameInput"
              maxlength="32"
              placeholder="留空则显示用户名"
              class="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              @keydown.enter="saveNickname"
            />
            <button @click="saveNickname" class="px-3 py-1 bg-green-600 text-white rounded-md text-sm">保存</button>
            <button @click="editingNickname = false" class="px-3 py-1 text-gray-500 text-sm">取消</button>
          </div>
          <div class="text-sm text-gray-500 mt-1">
            @{{ userStore.user?.username }} · {{ stageLabel(userStore.user?.school_stage) }}{{ userStore.user?.grade }}年级
          </div>
          <p v-if="nicknameError" class="text-sm text-red-600 mt-1">{{ nicknameError }}</p>
        </div>
      </div>
    </div>

    <!-- 写作画像 -->
    <div class="bg-white rounded-lg shadow p-6">
      <h2 class="text-lg font-bold text-gray-900 mb-4">📊 写作画像</h2>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div ref="radarChart" class="h-64"></div>
        <div class="space-y-4">
          <div v-for="group in tagGroups" :key="group.key">
            <h3 class="text-sm font-medium text-gray-700 mb-2">{{ group.title }}</h3>
            <div class="flex flex-wrap gap-2">
              <span v-for="tag in profile?.[group.key] || []" :key="tag"
                    :class="['px-3 py-1 rounded-full text-sm', group.color]">
                {{ tag }}
              </span>
              <span v-if="!profile?.[group.key]?.length" class="text-sm text-gray-500">暂无数据</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 统计数据 -->
    <div class="bg-white rounded-lg shadow p-6">
      <h2 class="text-lg font-bold text-gray-900 mb-4">📈 写作统计</h2>
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div class="text-center">
          <div class="text-2xl font-bold text-gray-900">{{ profile?.total_writings || 0 }}</div>
          <div class="text-sm text-gray-500">总写作数</div>
        </div>
        <div class="text-center">
          <div class="text-2xl font-bold text-green-600">{{ profile?.average_score?.toFixed(1) || 0 }}</div>
          <div class="text-sm text-gray-500">平均分</div>
        </div>
        <div class="text-center">
          <div class="text-2xl font-bold text-green-600">{{ profile?.best_score?.toFixed(1) || 0 }}</div>
          <div class="text-sm text-gray-500">最高分</div>
        </div>
        <div class="text-center">
          <div class="text-2xl font-bold text-amber-600">{{ profile?.consecutive_days || 0 }}</div>
          <div class="text-sm text-gray-500">连续天数</div>
        </div>
      </div>
    </div>

    <!-- AI 记忆 -->
    <div class="bg-white rounded-lg shadow p-6">
      <div class="flex justify-between items-center mb-2">
        <h2 class="text-lg font-bold text-gray-900">🧠 AI 教练的记忆</h2>
        <button
          v-if="fragments.length"
          @click="clearMemory"
          class="text-sm text-red-600 hover:text-red-700"
        >
          清空全部记忆
        </button>
      </div>
      <p class="text-sm text-gray-500 mb-4">
        AI 教练会记住你们的交流和作文情况，以便给出更贴合你的建议。你可以随时查看和删除。
        <span v-if="memoryStats">（共 {{ memoryStats.total_fragments }} 条，累计对话 {{ memoryStats.total_interactions }} 次）</span>
      </p>

      <div v-if="memoryProfile && hasMemoryProfile" class="mb-4 p-3 bg-green-50 rounded-lg text-sm text-gray-700 space-y-1">
        <div v-if="memoryProfile.strength_genres?.length">擅长：{{ memoryProfile.strength_genres.join('、') }}</div>
        <div v-if="memoryProfile.weakness_genres?.length">待加强：{{ memoryProfile.weakness_genres.join('、') }}</div>
        <div v-if="memoryProfile.improvement_areas?.length">重点改进：{{ memoryProfile.improvement_areas.join('、') }}</div>
      </div>

      <div class="flex gap-2 mb-3">
        <input
          v-model="memoryQuery"
          @keydown.enter="loadFragments"
          type="search"
          placeholder="搜索记忆，例如：议论文"
          class="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
        />
        <button @click="loadFragments" class="px-4 py-2 bg-gray-100 text-gray-700 rounded-md text-sm hover:bg-gray-200">搜索</button>
      </div>

      <div class="divide-y border rounded-lg" data-testid="memory-list">
        <div v-for="f in fragments" :key="f.id" class="p-3 flex justify-between items-start gap-4">
          <div class="min-w-0">
            <div class="text-sm text-gray-800 break-words">{{ f.content }}</div>
            <div class="text-xs text-gray-400 mt-1">
              {{ categoryLabel(f.category) }} · {{ formatDateTime(f.created_at) }}
            </div>
          </div>
          <button @click="deleteFragment(f)" class="shrink-0 text-xs text-gray-400 hover:text-red-600">删除</button>
        </div>
        <p v-if="fragments.length === 0" class="p-6 text-center text-sm text-gray-500">
          {{ memoryQuery ? '没有找到相关记忆' : '暂无记忆' }}
        </p>
      </div>
      <p v-if="memoryError" class="text-sm text-red-600 mt-2">{{ memoryError }}</p>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'
import { useUserStore } from '@/stores/user'
import api, { errorMessage } from '@/api'
import * as echarts from 'echarts'
import { stageLabel, formatDateTime } from '@/utils'

const userStore = useUserStore()
const radarChart = ref(null)
const profile = ref(null)
let chart = null

const editingNickname = ref(false)
const nicknameInput = ref('')
const nicknameError = ref('')

const fragments = ref([])
const memoryProfile = ref(null)
const memoryStats = ref(null)
const memoryQuery = ref('')
const memoryError = ref('')

const tagGroups = [
  { key: 'strength_tags', title: '✨ 优势标签', color: 'bg-green-100 text-green-700' },
  { key: 'weakness_tags', title: '🌱 需要改进', color: 'bg-amber-100 text-amber-700' },
  { key: 'preferred_genres', title: '📚 偏好文体', color: 'bg-blue-100 text-blue-700' }
]

const CATEGORY_LABELS = { interaction: '对话', feedback: '评分反馈', writing_profile: '写作画像', knowledge: '写作积累' }
const categoryLabel = (c) => CATEGORY_LABELS[c] || c

const hasMemoryProfile = computed(() => {
  const p = memoryProfile.value || {}
  return ['strength_genres', 'weakness_genres', 'improvement_areas'].some(k => p[k]?.length)
})

// ---------------------------------------------------------------- 资料
const startEditNickname = () => {
  nicknameInput.value = userStore.user?.nickname || ''
  nicknameError.value = ''
  editingNickname.value = true
}

const saveNickname = async () => {
  try {
    const res = await api.put('/auth/profile', { nickname: nicknameInput.value.trim() })
    userStore.updateUser(res.data.data.user)
    editingNickname.value = false
  } catch (err) {
    nicknameError.value = errorMessage(err, '昵称修改失败')
  }
}

const loadProfile = async () => {
  try {
    const res = await api.get('/stats')
    profile.value = res.data.data.profile
  } catch (error) {
    console.error('Failed to load profile:', error)
  }
}

const initRadarChart = async () => {
  await nextTick()
  if (!radarChart.value || !profile.value?.dimension_scores) return
  const scores = profile.value.dimension_scores
  chart = chart || echarts.init(radarChart.value)
  chart.setOption({
    tooltip: {},
    radar: {
      indicator: ['立意', '内容', '结构', '语言', '创意'].map(name => ({ name, max: 100 })),
      radius: '65%'
    },
    series: [{
      name: '写作能力',
      type: 'radar',
      data: [{
        value: [scores.theme || 0, scores.content || 0, scores.structure || 0, scores.language || 0, scores.creativity || 0],
        name: '当前水平',
        areaStyle: { color: 'rgba(22, 163, 74, 0.3)' },
        lineStyle: { color: '#16a34a' },
        itemStyle: { color: '#16a34a' }
      }]
    }]
  })
}

// ---------------------------------------------------------------- 记忆
const loadFragments = async () => {
  memoryError.value = ''
  try {
    const res = await api.get('/memory/fragments', {
      params: { q: memoryQuery.value.trim() || undefined, top_k: 50, min_importance: 0 }
    })
    fragments.value = res.data.data.fragments || []
  } catch (err) {
    memoryError.value = errorMessage(err, '记忆加载失败')
  }
}

const loadMemoryInfo = async () => {
  try {
    const [profileRes, statsRes] = await Promise.all([api.get('/memory/profile'), api.get('/memory/stats')])
    memoryProfile.value = profileRes.data.data.profile
    memoryStats.value = statsRes.data.data.user_stats
  } catch (err) {
    console.error('Failed to load memory info:', err)
  }
}

const deleteFragment = async (f) => {
  try {
    await api.delete(`/memory/fragments/${f.id}`)
    fragments.value = fragments.value.filter(item => item.id !== f.id)
    if (memoryStats.value) memoryStats.value.total_fragments = Math.max(0, memoryStats.value.total_fragments - 1)
  } catch (err) {
    memoryError.value = errorMessage(err, '删除失败')
  }
}

const clearMemory = async () => {
  if (!confirm('清空后 AI 教练将不再记得之前的交流和写作情况，确定清空吗？')) return
  try {
    await api.post('/memory/clear', { type: 'all' })
    fragments.value = []
    memoryProfile.value = {}
    loadMemoryInfo()
  } catch (err) {
    memoryError.value = errorMessage(err, '清空失败')
  }
}

const resizeChart = () => chart?.resize()

watch(profile, initRadarChart)

onMounted(() => {
  loadProfile()
  loadFragments()
  loadMemoryInfo()
  window.addEventListener('resize', resizeChart)
})

onUnmounted(() => {
  window.removeEventListener('resize', resizeChart)
  chart?.dispose()
})
</script>
