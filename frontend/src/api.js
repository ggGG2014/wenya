import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  timeout: 60000, // AI 评分可能需要较长时间
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json'
  }
})

// 响应拦截器
api.interceptors.response.use(
  response => {
    // 统一处理后端 { code, data, message } 格式
    const body = response.data
    if (body && typeof body === 'object' && 'code' in body && body.code !== 0) {
      // 业务错误
      return Promise.reject({
        response: { status: response.status, data: body },
        message: body.error || body.message || '请求失败'
      })
    }
    return response
  },
  error => {
    // 401 认证错误：静默处理，因为现在无需登录
    if (error.response?.status === 401) {
      return Promise.reject({
        response: { status: 401, data: { error: 'auth_required', silent: true } },
        message: '请求失败，请稍后重试'
      })
    }
    return Promise.reject(error)
  }
)

// 后端英文错误文案 → 中文提示，避免原始英文泄漏到界面上
const ERROR_TEXT = {
  'Not found': '内容不存在或已被删除'
}

// 从错误中提取可展示的提示文字（后端错误格式：{ code: 1, error, message? }）
export const errorMessage = (err, fallback = '请求失败，请稍后重试') => {
  const data = err?.response?.data
  if (data && typeof data === 'object') {
    // 静默错误：不显示提示
    if (data.silent) return ''
    // 忽略认证错误，因为现在无需登录
    if (data.error === 'Authentication required' || data.error === 'auth_required') return fallback
    if (ERROR_TEXT[data.error]) return ERROR_TEXT[data.error]
    if (data.error && data.message && data.message !== data.error) return `${data.error}：${data.message}`
    return data.error || data.message || fallback
  }
  if (err?.response?.status === 429) return '请求过于频繁，请稍后再试'
  if (err?.code === 'ECONNABORTED') return '请求超时，请稍后重试'
  return fallback
}

export default api
