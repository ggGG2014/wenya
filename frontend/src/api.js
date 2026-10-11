import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  timeout: 60000, // AI 评分可能需要较长时间
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json'
  }
})

// 未登录也可以访问的页面：在这些页面收到 401 时不跳转登录页
const GUEST_PATHS = ['/login', '/register']

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
    const isSessionCheck = error.config?.url === '/auth/me'
    if (error.response?.status === 401 && !isSessionCheck &&
        !GUEST_PATHS.includes(window.location.pathname)) {
      const redirect = encodeURIComponent(window.location.pathname + window.location.search)
      window.location.href = `/login?redirect=${redirect}`
    }
    return Promise.reject(error)
  }
)

// 从错误中提取可展示的提示文字（后端错误格式：{ code: 1, error, message? }）
export const errorMessage = (err, fallback = '请求失败，请稍后重试') => {
  const data = err?.response?.data
  if (data && typeof data === 'object') {
    if (data.error && data.message && data.message !== data.error) return `${data.error}：${data.message}`
    return data.error || data.message || fallback
  }
  if (err?.response?.status === 429) return '请求过于频繁，请稍后再试'
  if (err?.code === 'ECONNABORTED') return '请求超时，请稍后重试'
  return fallback
}

export default api
