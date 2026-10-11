// 文芽 - 前端通用工具

// 与后端 utils/helpers.py count_words 保持一致：中文按字，英文按词
export const countWords = (text) => {
  if (!text) return 0
  const chinese = (text.match(/[一-龥]/g) || []).length
  const english = (text.match(/[a-zA-Z]+/g) || []).length
  return chinese + english
}

// 提交评分的最少字数（后端 routes/writing.py MIN_SUBMIT_WORDS）
export const MIN_SUBMIT_WORDS = 100

const STAGE_LABELS = { elementary: '小学', middle: '初中', high: '高中' }
export const stageLabel = (stage) => STAGE_LABELS[stage] || ''

// 后端以 UTC 存储时间（datetime.utcnow），isoformat 不带时区；不补 Z 的话浏览器会当作本地时间解析
export const parseServerDate = (dateStr) => {
  if (!dateStr) return null
  const hasZone = /([zZ]|[+-]\d{2}:?\d{2})$/.test(dateStr)
  const isDateOnly = /^\d{4}-\d{2}-\d{2}$/.test(dateStr)
  return new Date(hasZone || isDateOnly ? dateStr : dateStr + 'Z')
}

export const formatDate = (dateStr) => {
  if (!dateStr) return '-'
  return parseServerDate(dateStr).toLocaleDateString('zh-CN')
}

export const formatDateTime = (dateStr) => {
  if (!dateStr) return '-'
  return parseServerDate(dateStr).toLocaleString('zh-CN', { hour12: false })
}

// 七维度评分（后端字段 xxx_score；社区作品里也可能是不带 _score 的简写）
export const DIMENSIONS = [
  { key: 'task', label: '任务完成' },
  { key: 'theme', label: '主题立意' },
  { key: 'content', label: '内容充实' },
  { key: 'structure', label: '结构逻辑' },
  { key: 'language', label: '语言表达' },
  { key: 'genre', label: '文体规范' },
  { key: 'thinking', label: '思维深度' }
]

export const dimensionValues = (scores) => {
  if (!scores) return []
  return DIMENSIONS
    .map(d => ({ ...d, value: scores[`${d.key}_score`] ?? scores[d.key] }))
    .filter(d => typeof d.value === 'number')
}

export const WRITING_STATUS = {
  draft: { label: '草稿', color: 'bg-gray-100 text-gray-700' },
  submitted: { label: '已评分', color: 'bg-blue-100 text-blue-700' },
  published: { label: '已发布', color: 'bg-green-100 text-green-700' }
}
