<template>
  <div class="space-y-6">
    <div class="flex justify-between items-center">
      <h1 class="text-2xl font-bold text-gray-900">📚 我的作文</h1>
      <router-link to="/writing" class="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm">
        新建作文
      </router-link>
    </div>

    <!-- 筛选 -->
    <div class="flex flex-wrap gap-3">
      <button
        v-for="item in statuses"
        :key="item.value"
        @click="changeStatus(item.value)"
        :class="[
          'px-4 py-2 rounded-md text-sm font-medium',
          currentStatus === item.value
            ? 'bg-green-600 text-white'
            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
        ]"
      >
        {{ item.label }}
      </button>
    </div>

    <p v-if="error" class="text-sm text-red-600">{{ error }}</p>

    <!-- 列表 -->
    <div class="bg-white rounded-lg shadow divide-y">
      <div
        v-for="writing in writings"
        :key="writing.id"
        @click="$router.push(`/writing/${writing.id}`)"
        class="p-4 hover:bg-gray-50 cursor-pointer transition"
        data-testid="writing-row"
      >
        <div class="flex justify-between items-start gap-4">
          <div class="flex-1 min-w-0">
            <h3 class="font-medium text-gray-900 truncate">{{ writing.title }}</h3>
            <p class="text-sm text-gray-500 mt-1">
              {{ writing.word_count }}字 · {{ formatDate(writing.updated_at || writing.created_at) }}
            </p>
          </div>
          <div class="text-right space-y-1">
            <div v-if="writing.overall_score" class="text-2xl font-bold text-green-600">
              {{ writing.overall_score.toFixed(1) }}
            </div>
            <span :class="['px-2 py-1 text-xs rounded', statusOf(writing).color]">
              {{ statusOf(writing).label }}
            </span>
            <div v-if="writing.status === 'draft'">
              <button
                @click.stop="deleteWriting(writing)"
                class="text-xs text-gray-400 hover:text-red-600"
              >
                删除
              </button>
            </div>
          </div>
        </div>
      </div>
      <div v-if="!loading && writings.length === 0" class="p-10 text-center text-gray-500 text-sm">
        还没有{{ currentStatus === 'all' ? '' : statuses.find(s => s.value === currentStatus).label }}作文，
        <router-link to="/writing" class="text-green-600">去写一篇吧</router-link>
      </div>
    </div>

    <!-- 分页 -->
    <div v-if="pagination && pagination.pages > 1" class="flex justify-center items-center gap-4 text-sm">
      <button :disabled="!pagination.has_prev" @click="loadWritings(page - 1)"
              class="px-3 py-1 border rounded disabled:opacity-40">上一页</button>
      <span class="text-gray-500">{{ pagination.current_page }} / {{ pagination.pages }}</span>
      <button :disabled="!pagination.has_next" @click="loadWritings(page + 1)"
              class="px-3 py-1 border rounded disabled:opacity-40">下一页</button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import api, { errorMessage } from '@/api'
import { formatDate, WRITING_STATUS } from '@/utils'

const statuses = [
  { value: 'all', label: '全部' },
  { value: 'draft', label: '草稿' },
  { value: 'submitted', label: '已评分' },
  { value: 'published', label: '已发布' }
]

const currentStatus = ref('all')
const writings = ref([])
const pagination = ref(null)
const page = ref(1)
const loading = ref(false)
const error = ref('')

const statusOf = (w) => WRITING_STATUS[w.status] || WRITING_STATUS.draft

const loadWritings = async (targetPage = 1) => {
  loading.value = true
  error.value = ''
  try {
    const res = await api.get('/writing', {
      params: { status: currentStatus.value, page: targetPage, per_page: 10 }
    })
    writings.value = res.data.data || []
    pagination.value = res.data.pagination
    page.value = targetPage
  } catch (err) {
    error.value = errorMessage(err, '作文列表加载失败')
  } finally {
    loading.value = false
  }
}

const changeStatus = (value) => {
  currentStatus.value = value
  loadWritings(1)
}

const deleteWriting = async (writing) => {
  if (!confirm(`确定删除草稿《${writing.title}》吗？`)) return
  try {
    await api.delete(`/writing/${writing.id}`)
    const targetPage = writings.value.length === 1 && page.value > 1 ? page.value - 1 : page.value
    loadWritings(targetPage)
  } catch (err) {
    error.value = errorMessage(err, '删除失败')
  }
}

onMounted(() => loadWritings(1))
</script>
