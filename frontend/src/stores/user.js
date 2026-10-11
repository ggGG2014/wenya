import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import api from '@/api'

export const useUserStore = defineStore('user', () => {
  const user = ref(null)
  const profile = ref(null)
  const initialized = ref(false)

  const isAuthenticated = computed(() => !!user.value)

  // 通过会话 Cookie 恢复登录状态（/auth/me 返回 { user, profile }）
  const fetchUser = async () => {
    try {
      const res = await api.get('/auth/me')
      user.value = res.data.data.user
      profile.value = res.data.data.profile
    } catch (error) {
      user.value = null
      profile.value = null
    }
  }

  const login = async (credentials) => {
    const res = await api.post('/auth/login', credentials)
    user.value = res.data.data.user
    return res.data.data
  }

  const register = async (userData) => {
    const res = await api.post('/auth/register', userData)
    user.value = res.data.data.user
    return res.data.data
  }

  const logout = async () => {
    try {
      await api.post('/auth/logout')
    } catch (e) {
      // 会话已失效时忽略
    }
    user.value = null
    profile.value = null
  }

  const updateUser = (fields) => {
    if (user.value) user.value = { ...user.value, ...fields }
  }

  // 首次进入页面时调用一次
  const init = async () => {
    if (initialized.value) return
    await fetchUser()
    initialized.value = true
  }

  return {
    user,
    profile,
    initialized,
    isAuthenticated,
    fetchUser,
    login,
    register,
    logout,
    updateUser,
    init
  }
})
