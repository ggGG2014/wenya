<template>
  <div class="space-y-4">
    <router-link to="/community" class="text-sm text-gray-500 hover:text-gray-700">← 返回社区</router-link>

    <div v-if="work" class="bg-white rounded-lg shadow overflow-hidden">
      <!-- 头部 -->
      <div class="border-b p-6">
        <div class="flex items-start justify-between gap-4">
          <h1 class="text-2xl font-bold text-gray-900 mb-2">{{ work.title }}</h1>
          <span v-if="work.is_featured" class="px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded whitespace-nowrap">精选</span>
        </div>
        <div class="flex flex-wrap items-center gap-4 text-sm text-gray-500">
          <span>📚 {{ stageLabel(work.author_school_stage) }}{{ work.author_grade }}年级</span>
          <span v-if="work.genre">🏷️ {{ work.genre }}</span>
          <span>✏️ {{ work.word_count }}字</span>
          <span>📅 {{ formatDate(work.published_at || work.created_at) }}</span>
        </div>
        <p v-if="work.is_mine && work.review_status !== 'approved'" class="mt-3 text-sm text-amber-700 bg-amber-50 rounded px-3 py-2">
          作品正在审核中，审核通过后其他同学才能看到。
        </p>
      </div>

      <!-- 内容 -->
      <div class="p-6">
        <p class="whitespace-pre-wrap text-gray-800 leading-relaxed">{{ work.content }}</p>
      </div>

      <!-- 评分 -->
      <div v-if="dimensionList.length" class="border-t p-6 bg-gray-50">
        <div class="flex justify-between items-end mb-4">
          <h2 class="text-lg font-bold text-gray-900">📊 AI 评分</h2>
          <div v-if="work.overall_score" class="text-2xl font-bold text-green-600">{{ work.overall_score.toFixed(1) }} 分</div>
        </div>
        <div class="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3 mb-6">
          <div v-for="dim in dimensionList" :key="dim.key" class="text-center p-3 bg-white rounded-lg shadow">
            <div class="text-2xl font-bold text-green-600">{{ Math.round(dim.value) }}</div>
            <div class="text-xs text-gray-500 mt-1">{{ dim.label }}</div>
          </div>
        </div>
        <div v-if="work.dimension_scores?.ai_comment" class="bg-white rounded-lg p-4">
          <h3 class="font-medium text-gray-900 mb-2">总体评语</h3>
          <p class="text-gray-600 text-sm">{{ work.dimension_scores.ai_comment }}</p>
        </div>
      </div>

      <!-- 互动 -->
      <div class="border-t p-6">
        <div class="flex space-x-6 mb-6">
          <button
            @click="toggleLike"
            :disabled="liking"
            :class="['flex items-center space-x-2 text-sm', isLiked ? 'text-red-600' : 'text-gray-500 hover:text-red-500']"
            data-testid="like-button"
          >
            <span>{{ isLiked ? '❤️' : '🤍' }}</span>
            <span>{{ work.like_count }}</span>
          </button>
          <div class="flex items-center space-x-2 text-sm text-gray-500">
            <span>💬</span>
            <span>{{ work.comment_count }}</span>
          </div>
          <div class="flex items-center space-x-2 text-sm text-gray-500">
            <span>👁</span>
            <span>{{ work.view_count }}</span>
          </div>
        </div>

        <!-- 评论区 -->
        <div class="space-y-4">
          <h3 class="font-bold text-gray-900">评论</h3>

          <div v-if="replyTo" class="text-xs text-gray-500">
            回复 {{ replyTo.author_name }}：
            <button @click="replyTo = null" class="text-green-600 ml-1">取消</button>
          </div>
          <div class="flex space-x-2">
            <input
              v-model="commentContent"
              @keydown.enter="onCommentEnter"
              type="text"
              maxlength="500"
              :placeholder="replyTo ? `回复 ${replyTo.author_name}...` : '写下你的评论（友善发言哦）...'"
              class="flex-1 min-w-0 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
            />
            <button
              @click="postComment"
              :disabled="!commentContent.trim() || posting"
              class="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 text-sm"
            >
              发布
            </button>
          </div>
          <p v-if="commentError" class="text-sm text-red-600">{{ commentError }}</p>

          <div class="space-y-3">
            <div v-for="comment in comments" :key="comment.id" class="p-3 bg-gray-50 rounded-lg" data-testid="comment">
              <div class="flex justify-between items-start mb-1">
                <div class="text-sm font-medium text-gray-900">
                  {{ comment.author_name }}
                  <span v-if="comment.parent_id" class="text-xs font-normal text-gray-500">
                    回复 {{ authorOf(comment.parent_id) }}
                  </span>
                </div>
                <div class="text-xs text-gray-500">{{ formatDateTime(comment.created_at) }}</div>
              </div>
              <p class="text-sm text-gray-700">{{ comment.content }}</p>
              <div class="mt-1 flex gap-3 text-xs">
                <button @click="replyTo = comment" class="text-gray-400 hover:text-green-600">回复</button>
                <button v-if="comment.is_mine" @click="deleteComment(comment)" class="text-gray-400 hover:text-red-600">删除</button>
              </div>
            </div>
            <p v-if="comments.length === 0" class="text-sm text-gray-500">还没有评论，来说点什么吧。</p>
          </div>
        </div>
      </div>
    </div>

    <div v-else-if="loading" class="text-center py-12 text-gray-500">加载中...</div>
    <div v-else class="text-center py-12">
      <p class="text-gray-500">{{ loadError || '作品不存在' }}</p>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import api, { errorMessage } from '@/api'
import { stageLabel, formatDate, formatDateTime, dimensionValues } from '@/utils'

const route = useRoute()
const work = ref(null)
const loading = ref(true)
const loadError = ref('')
const isLiked = ref(false)
const liking = ref(false)
const comments = ref([])
const commentContent = ref('')
const commentError = ref('')
const posting = ref(false)
const replyTo = ref(null)

const dimensionList = computed(() => dimensionValues(work.value?.dimension_scores))
const authorOf = (commentId) => comments.value.find(c => c.id === commentId)?.author_name || '已删除的评论'

const loadWork = async (id) => {
  loading.value = true
  loadError.value = ''
  work.value = null
  try {
    const res = await api.get(`/community/works/${id}`)
    work.value = res.data.data.work
    isLiked.value = res.data.data.is_liked
  } catch (err) {
    loadError.value = err.response?.status === 404 ? '作品不存在或尚未通过审核' : errorMessage(err, '作品加载失败')
  } finally {
    loading.value = false
  }
}

const loadComments = async (id) => {
  try {
    const res = await api.get(`/community/works/${id}/comments`)
    comments.value = res.data.data.comments || []
  } catch (err) {
    console.error('Failed to load comments:', err)
  }
}

const toggleLike = async () => {
  liking.value = true
  try {
    const res = await api.post(`/community/works/${route.params.id}/like`)
    isLiked.value = res.data.data.is_liked
    work.value.like_count = res.data.data.like_count
  } catch (err) {
    commentError.value = errorMessage(err, '操作失败')
  } finally {
    liking.value = false
  }
}

const onCommentEnter = (e) => {
  if (e.isComposing || e.keyCode === 229) return
  e.preventDefault()
  postComment()
}

const postComment = async () => {
  const content = commentContent.value.trim()
  if (!content || posting.value) return
  posting.value = true
  commentError.value = ''
  try {
    const res = await api.post(`/community/works/${route.params.id}/comment`, {
      content,
      parent_id: replyTo.value?.id
    })
    comments.value.push(res.data.data.comment)
    work.value.comment_count++
    commentContent.value = ''
    replyTo.value = null
  } catch (err) {
    commentError.value = errorMessage(err, '评论失败')
  } finally {
    posting.value = false
  }
}

const deleteComment = async (comment) => {
  if (!confirm('确定删除这条评论吗？')) return
  try {
    await api.delete(`/community/works/${route.params.id}/comments/${comment.id}`)
    comments.value = comments.value.filter(c => c.id !== comment.id)
    work.value.comment_count = Math.max(0, work.value.comment_count - 1)
  } catch (err) {
    commentError.value = errorMessage(err, '删除失败')
  }
}

const load = (id) => {
  loadWork(id)
  loadComments(id)
}

watch(() => route.params.id, (id) => { if (id) load(id) })
onMounted(() => load(route.params.id))
</script>
