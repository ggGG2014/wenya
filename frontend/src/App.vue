<template>
  <div id="app" class="min-h-screen bg-gray-50">
    <!-- 顶部导航栏 -->
    <header v-if="userStore.isAuthenticated" class="bg-white shadow-sm border-b">
      <nav class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between h-16">
          <!-- 左侧：Logo 和导航 -->
          <div class="flex">
            <div class="flex-shrink-0 flex items-center">
              <router-link to="/" class="text-2xl font-bold text-green-600">
                🌱 文芽
              </router-link>
            </div>

            <!-- PC 端导航 -->
            <div class="hidden sm:ml-8 sm:flex sm:space-x-8">
              <router-link
                v-for="item in navItems"
                :key="item.path"
                :to="item.path"
                class="inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
                :class="isActive(item) ? 'border-green-500 text-gray-900' : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'"
              >
                {{ item.name }}
              </router-link>
            </div>
          </div>

          <!-- 右侧：通知与用户菜单 -->
          <div class="flex items-center space-x-4">
            <!-- 通知 -->
            <div class="relative" ref="notificationRef">
              <button @click="toggleNotifications" class="relative p-2 text-gray-400 hover:text-gray-500" aria-label="通知">
                <svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/>
                </svg>
                <span v-if="unreadCount > 0"
                      class="absolute top-1 right-1 min-w-[1rem] h-4 px-1 rounded-full bg-red-500 text-white text-[10px] leading-4 text-center">
                  {{ unreadCount }}
                </span>
              </button>
              <div v-if="showNotifications" class="absolute right-0 mt-2 w-72 bg-white rounded-md shadow-lg py-2 z-50">
                <div class="px-4 pb-2 text-sm font-medium text-gray-900 border-b">通知</div>
                <div v-if="notifications.length === 0" class="px-4 py-6 text-center text-sm text-gray-500">暂无通知</div>
                <div v-for="n in notifications" :key="n.id" class="px-4 py-3 hover:bg-gray-50">
                  <div class="text-sm font-medium text-gray-900">
                    {{ n.type === 'achievement' ? '🏅' : '🎯' }} {{ n.title }}
                  </div>
                  <div class="text-xs text-gray-500 mt-1">{{ n.content }}</div>
                </div>
              </div>
            </div>

            <!-- 用户头像 -->
            <div class="relative" ref="userMenuRef">
              <button @click="showUserMenu = !showUserMenu" class="flex items-center space-x-2">
                <img
                  v-if="userStore.user?.avatar_url"
                  :src="userStore.user.avatar_url"
                  class="h-8 w-8 rounded-full"
                  alt="头像"
                />
                <div v-else class="h-8 w-8 rounded-full bg-green-500 flex items-center justify-center text-white font-medium">
                  {{ userStore.user?.nickname?.[0] || userStore.user?.username?.[0] || 'U' }}
                </div>
                <span class="hidden md:block text-sm font-medium text-gray-700">
                  {{ userStore.user?.nickname || userStore.user?.username }}
                </span>
              </button>

              <!-- 下拉菜单 -->
              <div v-if="showUserMenu" class="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50">
                <router-link to="/profile" class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                  个人中心
                </router-link>
                <router-link to="/writings" class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                  我的作文
                </router-link>
                <router-link to="/settings" class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                  设置
                </router-link>
                <button
                  @click="handleLogout"
                  class="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                >
                  退出登录
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- 移动端导航 -->
        <div class="sm:hidden pb-4">
          <div class="flex space-x-4">
            <router-link
              v-for="item in navItems"
              :key="item.path"
              :to="item.path"
              class="px-3 py-2 rounded-md text-sm font-medium"
              :class="isActive(item) ? 'bg-green-50 text-green-700' : 'text-gray-500 hover:bg-gray-50'"
            >
              {{ item.name }}
            </router-link>
          </div>
        </div>
      </nav>
    </header>

    <!-- 主内容区 -->
    <main class="py-6">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <router-view v-slot="{ Component }">
          <transition name="fade" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </div>
    </main>

    <!-- 底部：合规信息 -->
    <footer class="bg-white border-t mt-12">
      <div class="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div class="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
          <div class="text-sm text-gray-500">
            © 2024 文芽 - 未成年人 AI 写作练习平台
          </div>
          <div class="flex space-x-6 text-sm text-gray-500">
            <a :href="complianceInfo.privacy_policy_url || '/privacy-policy'" class="hover:text-gray-700">隐私政策</a>
            <a :href="complianceInfo.terms_of_service_url || '/terms-of-service'" class="hover:text-gray-700">服务条款</a>
            <a v-if="complianceInfo.icp_number" href="https://beian.miit.gov.cn/" target="_blank" class="hover:text-gray-700">
              {{ complianceInfo.icp_number }}
            </a>
          </div>
        </div>
        <div v-if="complianceInfo.algorithm_number" class="mt-4 text-center text-xs text-gray-400">
          算法备案编号：{{ complianceInfo.algorithm_number }}
        </div>
      </div>
    </footer>
  </div>
</template>

<script setup>
import { ref, watch, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import api from '@/api'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const showUserMenu = ref(false)
const showNotifications = ref(false)
const notifications = ref([])
const unreadCount = ref(0)
const notificationRef = ref(null)
const userMenuRef = ref(null)
const complianceInfo = ref({
  icp_number: '',
  algorithm_number: '',
  privacy_policy_url: '',
  terms_of_service_url: ''
})

const navItems = [
  { name: '首页', path: '/', exact: true },
  { name: '写作', path: '/writing' },
  { name: '我的作文', path: '/writings' },
  { name: '排行榜', path: '/ranking' },
  { name: '社区', path: '/community' }
]

const isActive = (item) => {
  if (item.exact) return route.path === item.path
  return route.path === item.path || route.path.startsWith(item.path + '/')
}

// 获取合规信息
const fetchComplianceInfo = async () => {
  try {
    const res = await api.get('/compliance/info')
    complianceInfo.value = res.data.data
  } catch (error) {
    console.error('Failed to fetch compliance info:', error)
  }
}

const fetchNotifications = async () => {
  if (!userStore.isAuthenticated) return
  try {
    const res = await api.get('/notifications')
    notifications.value = res.data.data.notifications || []
    unreadCount.value = res.data.data.unread_count || 0
  } catch (error) {
    console.error('Failed to fetch notifications:', error)
  }
}

const toggleNotifications = () => {
  showNotifications.value = !showNotifications.value
  showUserMenu.value = false
  if (showNotifications.value) unreadCount.value = 0  // 打开即视为已读
}

// 登出
const handleLogout = async () => {
  showUserMenu.value = false
  await userStore.logout()
  router.push('/login')
}

// 点击菜单外部时关闭
const handleClickOutside = (event) => {
  if (notificationRef.value && !notificationRef.value.contains(event.target)) showNotifications.value = false
  if (userMenuRef.value && !userMenuRef.value.contains(event.target)) showUserMenu.value = false
}

watch(() => route.fullPath, () => {
  showUserMenu.value = false
  showNotifications.value = false
})

watch(() => userStore.isAuthenticated, (loggedIn) => {
  if (loggedIn) fetchNotifications()
}, { immediate: true })

onMounted(() => {
  fetchComplianceInfo()
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>

<style>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
