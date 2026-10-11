<template>
  <div class="flex flex-col md:flex-row md:h-[calc(100vh-9rem)] gap-4">
    <!-- 移动端 Tab 切换 -->
    <div class="md:hidden flex bg-white rounded-lg shadow overflow-hidden">
      <button
        v-for="tab in [{ id: 'editor', name: '写作' }, { id: 'chat', name: 'AI 指导' }]"
        :key="tab.id"
        @click="activeTab = tab.id"
        :class="['flex-1 px-4 py-2 text-sm font-medium',
                 activeTab === tab.id ? 'text-green-600 border-b-2 border-green-600' : 'text-gray-500']"
      >
        {{ tab.name }}
      </button>
    </div>

    <!-- 左侧：AI 对话区 -->
    <aside :class="['md:flex md:w-1/3 lg:w-1/4 flex-col bg-white rounded-lg shadow min-h-[60vh] md:min-h-0',
                    activeTab === 'chat' ? 'flex' : 'hidden']">
      <div class="px-4 py-3 border-b flex items-center justify-between">
        <h2 class="font-medium text-gray-900">🤖 AI 写作教练</h2>
        <span class="text-xs text-gray-400">只聊写作哦</span>
      </div>

      <p v-if="aiStatus && !aiStatus.chat.configured && !aiStatus.chat.mock_mode"
         class="mx-4 mt-3 text-xs text-amber-700 bg-amber-50 rounded px-2 py-1">
        AI 教练服务暂未开通，暂时无法对话。
      </p>
      <div ref="chatContainer" class="flex-1 overflow-y-auto p-4 space-y-4" data-testid="chat-messages">
        <div v-if="messages.length === 0" class="text-center text-gray-400 text-sm mt-8">
          向 AI 教练提问，或点击下方快捷操作开始
        </div>
        <div v-for="(msg, index) in messages" :key="index"
             :class="['flex', msg.role === 'user' ? 'justify-end' : 'justify-start']">
          <div :class="['max-w-[85%] rounded-lg px-4 py-2',
                        msg.role === 'user' ? 'bg-green-600 text-white'
                          : msg.error ? 'bg-red-50 text-red-700 border border-red-200'
                          : 'bg-gray-100 text-gray-800']">
            <p class="text-sm whitespace-pre-wrap">{{ msg.content }}</p>
            <p v-if="msg.mock" class="text-[10px] mt-1 text-amber-600">模拟回复（AI_MOCK_MODE）</p>
          </div>
        </div>
        <div v-if="chatLoading" class="flex justify-start">
          <div class="bg-gray-100 rounded-lg px-4 py-2">
            <div class="flex space-x-2">
              <div class="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
              <div class="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style="animation-delay: 0.2s"></div>
              <div class="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style="animation-delay: 0.4s"></div>
            </div>
          </div>
        </div>
      </div>

      <div class="border-t p-4">
        <div class="flex flex-wrap gap-2 mb-2">
          <button
            v-for="action in quickActions"
            :key="action.label"
            @click="sendMessage(action.message, action.sessionType)"
            :disabled="chatLoading"
            class="px-3 py-1 text-xs bg-green-50 text-green-700 rounded-full hover:bg-green-100 disabled:opacity-50"
          >
            {{ action.label }}
          </button>
        </div>
        <div class="flex space-x-2">
          <input
            v-model="inputMessage"
            @keydown.enter="onChatEnter"
            type="text"
            maxlength="500"
            placeholder="向 AI 教练提问..."
            class="flex-1 min-w-0 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
          />
          <button
            @click="sendMessage()"
            :disabled="chatLoading || !inputMessage.trim()"
            class="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 text-sm"
          >
            发送
          </button>
        </div>
      </div>
    </aside>

    <!-- 右侧：编辑器 -->
    <section :class="['md:flex flex-1 flex-col bg-white rounded-lg shadow min-h-[70vh] md:min-h-0 min-w-0',
                      activeTab === 'editor' ? 'flex' : 'hidden']">
      <div v-if="loadError" class="flex-1 flex flex-col items-center justify-center p-8 text-center">
        <p class="text-gray-500 mb-4">{{ loadError }}</p>
        <router-link to="/writings" class="text-green-600 hover:text-green-700 text-sm">返回我的作文</router-link>
      </div>

      <template v-else>
        <!-- 标题栏 -->
        <div class="border-b p-4 space-y-2">
          <div class="flex items-center gap-3">
            <input
              v-model="title"
              :readonly="!isDraft"
              type="text"
              maxlength="200"
              placeholder="作文标题"
              class="flex-1 min-w-0 text-xl font-bold border-none focus:outline-none focus:ring-0 p-0"
            />
            <span :class="['px-2 py-1 text-xs rounded whitespace-nowrap', statusInfo.color]">{{ statusInfo.label }}</span>
          </div>
          <div class="flex flex-wrap items-center gap-3 text-sm">
            <button v-if="isDraft" @click="openChallenges" class="text-green-600 hover:text-green-700">
              🎯 选择题目
            </button>
            <button v-if="isDraft || prompt" @click="showPrompt = !showPrompt" class="text-gray-500 hover:text-gray-700">
              📋 写作要求{{ showPrompt ? ' ▲' : ' ▼' }}
            </button>
            <button v-if="isDraft" @click="toggleMaterials" class="text-gray-500 hover:text-gray-700">
              📚 素材库
            </button>
          </div>
          <textarea
            v-if="showPrompt"
            v-model="prompt"
            :readonly="!isDraft"
            rows="2"
            placeholder="题目要求，例如：以“那一次，我读懂了____”为题，写一篇不少于 600 字的记叙文"
            class="w-full text-sm text-gray-600 bg-gray-50 rounded-md border border-gray-200 p-2 focus:outline-none focus:ring-1 focus:ring-green-500 resize-none"
          ></textarea>
        </div>

        <!-- 素材库 -->
        <div v-if="showMaterials" class="border-b bg-amber-50/50 px-4 py-3 max-h-56 overflow-y-auto">
          <div class="flex gap-2 mb-2">
            <button
              v-for="tab in materialTabs"
              :key="tab.key"
              @click="materialTab = tab.key"
              :class="['px-3 py-1 rounded-full text-xs',
                       materialTab === tab.key ? 'bg-amber-500 text-white' : 'bg-white text-gray-600 border']"
            >
              {{ tab.label }}
            </button>
          </div>
          <div class="space-y-2">
            <div v-for="(item, i) in currentMaterials" :key="i" class="flex items-start justify-between gap-3 text-sm">
              <div class="text-gray-700">
                <template v-if="materialTab === 'idiom'"><b>{{ item.word }}</b>：{{ item.meaning }}</template>
                <template v-else-if="materialTab === 'example'"><b>《{{ item.title }}》</b>{{ item.snippet }}</template>
                <template v-else>{{ item }}</template>
              </div>
              <button @click="insertMaterial(item)" class="shrink-0 text-xs text-amber-700 hover:text-amber-900">插入</button>
            </div>
          </div>
        </div>

        <!-- 正文 -->
        <div class="flex-1 p-4 overflow-y-auto">
          <textarea
            v-if="isDraft"
            ref="editor"
            v-model="content"
            placeholder="开始你的写作..."
            class="w-full h-full min-h-[40vh] resize-none border-none focus:outline-none text-base leading-relaxed"
            data-testid="editor"
          ></textarea>
          <div v-else class="space-y-6">
            <p class="whitespace-pre-wrap text-base leading-relaxed text-gray-800">{{ content }}</p>

            <!-- 评分结果 -->
            <div v-if="scores" class="border rounded-lg p-4 bg-gray-50" data-testid="score-panel">
              <div class="flex items-end justify-between mb-4">
                <h3 class="text-lg font-bold text-gray-900">📊 AI 评分</h3>
                <div class="text-right">
                  <span class="text-3xl font-bold text-green-600">{{ overallScore?.toFixed(1) }}</span>
                  <span class="text-sm text-gray-500"> 分</span>
                </div>
              </div>
              <p v-if="isMockScore" class="mb-3 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded px-2 py-1">
                这是模拟评分（AI_MOCK_MODE），仅供开发测试，不代表真实水平。
              </p>
              <p v-else-if="scores.needs_human_review" class="mb-3 text-xs text-amber-700">
                ⚠️ 本次评分置信度较低，已标记待老师复核。
              </p>
              <div class="space-y-2 mb-4">
                <div v-for="dim in dimensionList" :key="dim.key" class="flex items-center gap-3 text-sm">
                  <span class="w-16 shrink-0 text-gray-600">{{ dim.label }}</span>
                  <div class="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div class="h-full bg-green-500 rounded-full" :style="{ width: dim.value + '%' }"></div>
                  </div>
                  <span class="w-8 text-right font-medium text-gray-800">{{ Math.round(dim.value) }}</span>
                </div>
              </div>
              <div v-if="scores.ai_comment" class="mb-3">
                <h4 class="text-sm font-medium text-gray-900 mb-1">总体评语</h4>
                <p class="text-sm text-gray-600">{{ scores.ai_comment }}</p>
              </div>
              <div v-if="scores.ai_suggestions?.length">
                <h4 class="text-sm font-medium text-gray-900 mb-1">改进建议</h4>
                <ul class="list-disc list-inside text-sm text-gray-600 space-y-1">
                  <li v-for="(s, i) in scores.ai_suggestions" :key="i">{{ s }}</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        <p v-if="isDraft && scoringUnavailable" class="mx-4 mb-2 px-3 py-2 rounded text-sm bg-amber-50 text-amber-700"
           data-testid="scoring-unavailable">
          AI 评分服务暂未开通，作文会自动保存为草稿，开通后即可提交评分。
        </p>

        <!-- 提示信息 -->
        <div v-if="notice.text"
             :class="['mx-4 mb-2 px-3 py-2 rounded text-sm',
                      notice.type === 'error' ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700']"
             data-testid="notice">
          {{ notice.text }}
        </div>

        <!-- 底部工具栏 -->
        <div class="border-t p-4 flex flex-wrap gap-3 justify-between items-center">
          <div class="text-sm text-gray-500">
            {{ wordCount }} 字
            <span v-if="isDraft && wordCount < MIN_SUBMIT_WORDS" class="ml-1 text-xs text-gray-400">
              （再写 {{ MIN_SUBMIT_WORDS - wordCount }} 字可提交评分）
            </span>
            <span v-if="saveStatus" class="ml-2 text-xs text-gray-400" data-testid="save-status">{{ saveStatus }}</span>
          </div>
          <div class="flex flex-wrap gap-3">
            <template v-if="isDraft">
              <button
                @click="saveDraft()"
                :disabled="saving || submitting || !content.trim()"
                class="px-4 py-2 text-sm text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 disabled:opacity-50"
              >
                {{ saving ? '保存中...' : '保存草稿' }}
              </button>
              <button
                @click="submitWriting"
                :disabled="!canSubmit"
                :title="submitHint"
                class="px-4 py-2 text-sm text-white bg-green-600 rounded-md hover:bg-green-700 disabled:opacity-50"
              >
                {{ submitting ? 'AI 评分中...' : '提交评分' }}
              </button>
            </template>
            <template v-else>
              <router-link
                v-if="communityWork?.review_status === 'approved'"
                :to="`/community/${communityWork.id}`"
                class="px-4 py-2 text-sm text-green-700 bg-green-50 rounded-md hover:bg-green-100"
              >
                查看社区作品
              </router-link>
              <span v-else-if="communityWork" class="px-4 py-2 text-sm text-amber-700 bg-amber-50 rounded-md">
                社区审核中
              </span>
              <template v-else>
                <select v-model="publishGenre" class="px-3 py-2 text-sm border border-gray-300 rounded-md">
                  <option value="">选择文体</option>
                  <option v-for="g in GENRES" :key="g" :value="g">{{ g }}</option>
                </select>
                <button
                  @click="publishWriting"
                  :disabled="publishing"
                  class="px-4 py-2 text-sm text-white bg-green-600 rounded-md hover:bg-green-700 disabled:opacity-50"
                >
                  {{ publishing ? '发布中...' : '发布到社区' }}
                </button>
              </template>
              <router-link to="/writing" class="px-4 py-2 text-sm text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200">
                写新作文
              </router-link>
            </template>
          </div>
        </div>
      </template>
    </section>

    <!-- 题目选择 -->
    <div v-if="showChallenges" class="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4"
         @click.self="showChallenges = false">
      <div class="bg-white rounded-lg shadow-xl w-full max-w-lg max-h-[80vh] overflow-y-auto">
        <div class="px-5 py-4 border-b flex justify-between items-center">
          <h3 class="font-bold text-gray-900">🎯 选择写作题目</h3>
          <button @click="showChallenges = false" class="text-gray-400 hover:text-gray-600">✕</button>
        </div>
        <div class="divide-y">
          <button
            v-for="c in challenges"
            :key="c.id"
            @click="applyChallenge(c)"
            class="w-full text-left px-5 py-4 hover:bg-green-50"
          >
            <div class="flex justify-between items-center">
              <span class="font-medium text-gray-900">{{ c.title }}</span>
              <span class="text-xs text-gray-500">{{ c.genre }} · {{ difficultyLabel(c.difficulty) }}</span>
            </div>
            <p class="text-sm text-gray-600 mt-1">{{ c.description }}</p>
            <p class="text-xs text-gray-400 mt-1">{{ c.min_words }}–{{ c.max_words }} 字</p>
          </button>
          <div v-if="challenges.length === 0" class="px-5 py-8 text-center text-sm text-gray-500">加载中...</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'
import { useRoute, useRouter, onBeforeRouteLeave } from 'vue-router'
import api, { errorMessage } from '@/api'
import { countWords, MIN_SUBMIT_WORDS, dimensionValues, WRITING_STATUS } from '@/utils'

const route = useRoute()
const router = useRouter()

const GENRES = ['记叙文', '议论文', '说明文', '散文', '诗歌', '想象作文', '书信', '读后感', '其他']

const writingId = ref(null)
const title = ref('')
const prompt = ref('')
const content = ref('')
const status = ref('draft')
const scores = ref(null)
const overallScore = ref(null)
const isMockScore = ref(false)
const communityWork = ref(null)
const loadError = ref('')

const saving = ref(false)
const submitting = ref(false)
const publishing = ref(false)
const publishGenre = ref('')
const saveStatus = ref('')
const notice = ref({ type: 'info', text: '' })
const lastSaved = ref(null)      // 最近一次成功保存的 { title, prompt, content }

const messages = ref([])
const inputMessage = ref('')
const chatLoading = ref(false)
const chatContainer = ref(null)
const editor = ref(null)
const activeTab = ref('editor')

const aiStatus = ref(null)
const showPrompt = ref(false)
const showChallenges = ref(false)
const challenges = ref([])
const showMaterials = ref(false)
const materials = ref(null)
const materialTab = ref('quote')
const materialTabs = [
  { key: 'quote', label: '名言' },
  { key: 'idiom', label: '成语' },
  { key: 'example', label: '范文片段' }
]

const quickActions = [
  { label: '💡 审题指导', message: '请帮我分析一下这个题目的写作要求，应该从哪里入手？', sessionType: 'writing_guidance' },
  { label: '📚 素材启发', message: '能给我一些适合这个题目的写作素材和思路吗？', sessionType: 'brainstorming' },
  { label: '✏️ 段落修改', message: '请帮我看看现在写的内容，哪些段落可以修改得更好？', sessionType: 'revision' },
  { label: '📊 评分标准', message: '这篇作文会按照哪些标准评分？我应该注意什么？', sessionType: 'scoring' }
]

let autoSaveTimer = null
let createPromise = null
let noticeTimer = null
// 离开页面/切换作文时保存：此时不能再 router.replace，否则会打断正在进行的导航
let navigatingAway = false

const isDraft = computed(() => status.value === 'draft')
const wordCount = computed(() => countWords(content.value))
const statusInfo = computed(() => WRITING_STATUS[status.value] || WRITING_STATUS.draft)
const dimensionList = computed(() => dimensionValues(scores.value))
const currentMaterials = computed(() => materials.value?.[materialTab.value] || [])

const snapshot = () => ({ title: title.value.trim(), prompt: prompt.value, content: content.value })
const isDirty = computed(() => {
  if (!isDraft.value || !content.value.trim()) return false
  return JSON.stringify(snapshot()) !== JSON.stringify(lastSaved.value)
})

const scoringUnavailable = computed(() =>
  !!aiStatus.value && !aiStatus.value.scoring.configured && !aiStatus.value.scoring.mock_mode
)
const canSubmit = computed(() =>
  isDraft.value && !submitting.value && !saving.value && !scoringUnavailable.value &&
  title.value.trim() && wordCount.value >= MIN_SUBMIT_WORDS
)
const submitHint = computed(() => {
  if (scoringUnavailable.value) return 'AI 评分服务暂未开通'
  if (!title.value.trim()) return '请先填写标题'
  if (wordCount.value < MIN_SUBMIT_WORDS) return `至少 ${MIN_SUBMIT_WORDS} 字才能提交评分`
  return '提交后将由 AI 进行七维度评分，提交后不能再修改'
})

const showNotice = (text, type = 'info', duration = 5000) => {
  notice.value = { type, text }
  if (noticeTimer) clearTimeout(noticeTimer)
  if (duration) noticeTimer = setTimeout(() => { notice.value = { type: 'info', text: '' } }, duration)
}

const timeNow = () => new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', hour12: false })

// ---------------------------------------------------------------- 加载
const resetEditor = () => {
  writingId.value = null
  title.value = ''
  prompt.value = ''
  content.value = ''
  status.value = 'draft'
  scores.value = null
  overallScore.value = null
  isMockScore.value = false
  communityWork.value = null
  loadError.value = ''
  messages.value = []
  lastSaved.value = null
  saveStatus.value = ''
  showPrompt.value = false
  notice.value = { type: 'info', text: '' }
}

const applyWriting = (w) => {
  writingId.value = w.id
  title.value = w.title || ''
  prompt.value = w.prompt || ''
  content.value = w.content ?? content.value
  status.value = w.status
  scores.value = w.scores || null
  overallScore.value = w.overall_score ?? null
  if (w.community_work !== undefined) communityWork.value = w.community_work
  showPrompt.value = !!prompt.value
  lastSaved.value = snapshot()
}

const loadWriting = async (id) => {
  resetEditor()
  try {
    const res = await api.get(`/writing/${id}`)
    applyWriting(res.data.data.writing)
  } catch (err) {
    loadError.value = err.response?.status === 404 ? '作文不存在或已删除' : errorMessage(err, '作文加载失败')
    return
  }
  try {
    const res = await api.get(`/writing/${id}/ai-chat`)
    messages.value = (res.data.data.messages || []).map(m => ({ role: m.role, content: m.content }))
    scrollToBottom()
  } catch (err) {
    console.error('Failed to load chat history:', err)
  }
}

// ---------------------------------------------------------------- 保存
// 首次保存时创建作文；并发调用只创建一次
const createWriting = () => {
  if (!createPromise) {
    const data = snapshot()
    createPromise = api.post('/writing', { ...data, title: data.title || '未命名作文' })
      .then(res => {
        const w = res.data.data.writing
        writingId.value = w.id
        if (!title.value.trim()) title.value = w.title
        lastSaved.value = { ...data, title: w.title }
        if (!navigatingAway) router.replace({ name: 'WritingDetail', params: { id: w.id } })
        return w.id
      })
      .finally(() => { createPromise = null })
  }
  return createPromise
}

const saveDraft = async ({ silent = false } = {}) => {
  if (!isDraft.value) return true
  if (!content.value.trim()) {
    if (!silent) showNotice('请先输入正文内容', 'error')
    return false
  }
  if (saving.value) {
    await new Promise(resolve => {
      const stop = watch(saving, (v) => { if (!v) { stop(); resolve() } })
    })
  }
  if (writingId.value && !isDirty.value) {
    if (!silent) saveStatus.value = `已保存 ${timeNow()}`
    return true
  }

  saving.value = true
  saveStatus.value = '保存中...'
  try {
    if (!writingId.value) {
      await createWriting()
    } else {
      const data = snapshot()
      await api.post(`/writing/${writingId.value}/draft`, { ...data, title: data.title || '未命名作文' })
      lastSaved.value = data
    }
    saveStatus.value = `已保存 ${timeNow()}`
    return true
  } catch (err) {
    saveStatus.value = '保存失败'
    showNotice(`保存失败：${errorMessage(err)}`, 'error')
    return false
  } finally {
    saving.value = false
  }
}

// 内容变化 3 秒后自动保存
watch([title, prompt, content], () => {
  if (autoSaveTimer) clearTimeout(autoSaveTimer)
  if (!isDirty.value) return
  saveStatus.value = '未保存'
  autoSaveTimer = setTimeout(() => saveDraft({ silent: true }), 3000)
})

// ---------------------------------------------------------------- 提交评分 / 发布
const submitWriting = async () => {
  if (!canSubmit.value) return
  if (!confirm('提交后作文将由 AI 评分，且不能再修改。确定提交吗？')) return

  const saved = await saveDraft()
  if (!saved) return

  submitting.value = true
  showNotice('AI 正在评分，请稍候…', 'info', 0)
  try {
    const res = await api.post(`/writing/${writingId.value}/submit`, null, { timeout: 180000 })
    applyWriting(res.data.data.writing)
    isMockScore.value = !!res.data.data.is_mock
    showNotice(res.data.message || '评分完成', 'info')
  } catch (err) {
    showNotice(errorMessage(err, '提交失败，请稍后重试'), 'error', 8000)
  } finally {
    submitting.value = false
  }
}

const publishWriting = async () => {
  if (!confirm('发布后其他同学可以在社区看到这篇作文，确定发布吗？')) return
  publishing.value = true
  try {
    const res = await api.post(`/community/publish/${writingId.value}`, { genre: publishGenre.value || undefined })
    const work = res.data.data.work
    communityWork.value = { id: work.id, review_status: work.review_status }
    if (work.review_status === 'approved') status.value = 'published'
    showNotice(res.data.message)
  } catch (err) {
    showNotice(errorMessage(err, '发布失败'), 'error')
  } finally {
    publishing.value = false
  }
}

// ---------------------------------------------------------------- AI 对话
const scrollToBottom = async () => {
  await nextTick()
  if (chatContainer.value) chatContainer.value.scrollTop = chatContainer.value.scrollHeight
}

const onChatEnter = (e) => {
  if (e.isComposing || e.keyCode === 229) return  // 中文输入法选词时的回车不发送
  e.preventDefault()
  sendMessage()
}

const sendMessage = async (text, sessionType = 'writing_guidance') => {
  const message = (text ?? inputMessage.value).trim()
  if (!message || chatLoading.value) return

  if (!writingId.value) {
    if (!content.value.trim()) {
      messages.value.push({ role: 'assistant', content: '先在右侧写下题目和几句正文，我就能结合你的作文给出建议啦。' })
      scrollToBottom()
      return
    }
    if (!(await saveDraft())) return
  }

  if (text === undefined) inputMessage.value = ''
  messages.value.push({ role: 'user', content: message })
  chatLoading.value = true
  scrollToBottom()

  try {
    const res = await api.post(`/writing/${writingId.value}/ai-chat`, { message, session_type: sessionType })
    messages.value.push({ role: 'assistant', content: res.data.data.response, mock: res.data.data.is_mock })
  } catch (err) {
    messages.value.push({ role: 'assistant', content: errorMessage(err, 'AI 教练暂时不可用，请稍后再试。'), error: true })
  } finally {
    chatLoading.value = false
    scrollToBottom()
  }
}

// ---------------------------------------------------------------- 题目与素材
const difficultyLabel = (d) => ({ easy: '简单', medium: '中等', hard: '挑战' }[d] || d)

const fetchAiStatus = async () => {
  try {
    const res = await api.get('/ai/status')
    aiStatus.value = res.data.data
  } catch (err) {
    aiStatus.value = null  // 获取失败时不阻止提交，由后端返回具体错误
  }
}

const fetchChallenges = async () => {
  if (challenges.value.length) return challenges.value
  const res = await api.get('/challenges')
  challenges.value = res.data.data.challenges || []
  return challenges.value
}

const openChallenges = async () => {
  showChallenges.value = true
  try {
    await fetchChallenges()
  } catch (err) {
    showChallenges.value = false
    showNotice(errorMessage(err, '题目加载失败'), 'error')
  }
}

const applyChallenge = (c) => {
  if ((title.value || prompt.value) && !confirm('将用所选题目替换当前的标题和写作要求，继续吗？')) return
  title.value = c.title
  prompt.value = `${c.description}（${c.genre}，${c.min_words}–${c.max_words} 字）`
  showPrompt.value = true
  showChallenges.value = false
}

const toggleMaterials = async () => {
  showMaterials.value = !showMaterials.value
  if (showMaterials.value && !materials.value) {
    try {
      const res = await api.get('/materials')
      materials.value = res.data.data.materials
    } catch (err) {
      showMaterials.value = false
      showNotice(errorMessage(err, '素材加载失败'), 'error')
    }
  }
}

const insertMaterial = async (item) => {
  const text = typeof item === 'string' ? item : (item.word || item.snippet || '')
  const el = editor.value
  const start = el ? el.selectionStart : content.value.length
  const end = el ? el.selectionEnd : content.value.length
  content.value = content.value.slice(0, start) + text + content.value.slice(end)
  await nextTick()
  if (el) {
    el.focus()
    el.selectionStart = el.selectionEnd = start + text.length
  }
}

// ---------------------------------------------------------------- 生命周期
const init = async (id) => {
  navigatingAway = false
  if (id) {
    await loadWriting(id)
    return
  }
  resetEditor()
  // 从首页“写作挑战”进入：/writing?challenge=xxx
  if (route.query.challenge) {
    try {
      const c = (await fetchChallenges()).find(item => item.id === route.query.challenge)
      if (c) applyChallenge(c)
    } catch (err) {
      console.error('Failed to load challenge:', err)
    }
  }
}

// 同一组件内切换作文（如从 /writing/5 点导航到 /writing）
watch(() => route.params.id, async (id, oldId) => {
  if (String(id || '') === String(writingId.value || '')) return  // 新建后 replace 路由，不重新加载
  if (isDirty.value) {
    navigatingAway = true
    await saveDraft({ silent: true })
    navigatingAway = false
  }
  init(id)
})

const beforeUnload = (e) => {
  if (isDirty.value) {
    e.preventDefault()
    e.returnValue = ''
  }
}

onBeforeRouteLeave(async () => {
  if (autoSaveTimer) clearTimeout(autoSaveTimer)
  if (isDirty.value) {
    navigatingAway = true
    await saveDraft({ silent: true })
  }
  return true
})

onMounted(() => {
  window.addEventListener('beforeunload', beforeUnload)
  fetchAiStatus()
  init(route.params.id)
})

onUnmounted(() => {
  window.removeEventListener('beforeunload', beforeUnload)
  if (autoSaveTimer) clearTimeout(autoSaveTimer)
  if (noticeTimer) clearTimeout(noticeTimer)
})
</script>
