<template>
  <div class="space-y-8">
    <!-- 欢迎区 -->
    <div class="bg-gradient-to-r from-green-500 to-green-600 rounded-lg shadow-lg p-8 text-white">
      <h1 class="text-3xl font-bold mb-2">
        👋 欢迎来到文芽！
      </h1>
      <p class="text-green-100">
        继续你的写作之旅，今天也要加油哦～
      </p>
    </div>

    <!-- 快速入口 -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
      <!-- 开始写作 -->
      <div class="bg-white rounded-lg shadow p-6">
        <h2 class="text-xl font-bold text-gray-900 mb-4">📝 开始写作</h2>
        <p class="text-gray-600 mb-4">选择一个题目，开始你的创作吧</p>
        <button
          @click="$router.push('/writing')"
          class="w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
        >
          新建作文
        </button>
      </div>

      <!-- 继续写作 -->
      <div class="bg-white rounded-lg shadow p-6">
        <h2 class="text-xl font-bold text-gray-900 mb-4">📖 继续写作</h2>
        <div v-if="recentDraft" class="space-y-2">
          <p class="text-gray-600 truncate">{{ recentDraft.title }}</p>
          <p class="text-sm text-gray-500">上次编辑：{{ formatDate(recentDraft.updated_at) }}</p>
          <button
            @click="$router.push(`/writing/${recentDraft.id}`)"
            class="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
          >
            继续编辑
          </button>
        </div>
        <p v-else class="text-gray-500 text-sm">暂无草稿</p>
      </div>
    </div>

    <!-- 写作挑战 -->
    <div class="bg-white rounded-lg shadow p-6">
      <h2 class="text-xl font-bold text-gray-900 mb-4">🎯 本周写作挑战</h2>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div v-for="c in challenges" :key="c.id" class="p-4 border rounded-lg flex flex-col">
          <div class="flex justify-between items-center mb-1">
            <h3 class="font-medium text-gray-900">{{ c.title }}</h3>
            <span class="text-xs text-gray-500">{{ c.genre }} · {{ difficultyLabel(c.difficulty) }}</span>
          </div>
          <p class="text-sm text-gray-600 flex-1">{{ c.description }}</p>
          <button
            @click="$router.push({ path: '/writing', query: { challenge: c.id } })"
            class="mt-3 self-start text-sm text-green-600 hover:text-green-700"
          >
            开始挑战 →
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import api from '@/api'
import { formatDate } from '@/utils'

const recentDraft = ref(null)
const challenges = ref([])

const difficultyLabel = (d) => ({ easy: '简单', medium: '中等', hard: '挑战' }[d] || d)

const loadChallenges = async () => {
  try {
    const res = await api.get('/challenges')
    challenges.value = res.data.data.challenges || []
  } catch (error) {
    console.error('Failed to load challenges:', error)
  }
}

const loadRecentDraft = async () => {
  try {
    const res = await api.get('/writing', { params: { page: 1, per_page: 1, status: 'draft' } })
    recentDraft.value = (res.data.data || [])[0] || null
  } catch (error) {
    console.error('Failed to load recent draft:', error)
  }
}

onMounted(() => {
  loadRecentDraft()
  loadChallenges()
})
</script>
