<template>
  <div id="app" class="min-h-screen bg-gray-50">
    <!-- 顶部导航栏 -->
    <header class="bg-white shadow-sm border-b">
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
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import api from '@/api'

const route = useRoute()

const complianceInfo = ref({
  icp_number: '',
  algorithm_number: '',
  privacy_policy_url: '',
  terms_of_service_url: ''
})

const navItems = [
  { name: '首页', path: '/', exact: true },
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

onMounted(() => {
  fetchComplianceInfo()
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
