import { createRouter, createWebHistory } from 'vue-router'

// 页面组件
import Home from '@/views/Home.vue'
import Writing from '@/views/Writing.vue'
import WritingList from '@/views/WritingList.vue'
import Ranking from '@/views/Ranking.vue'
import Community from '@/views/Community.vue'
import WorkDetail from '@/views/WorkDetail.vue'
import Profile from '@/views/Profile.vue'
import Settings from '@/views/Settings.vue'

const routes = [
  {
    path: '/',
    name: 'Home',
    component: Home
  },
  {
    path: '/writing',
    name: 'Writing',
    component: Writing
  },
  {
    path: '/writing/:id',
    name: 'WritingDetail',
    component: Writing
  },
  {
    path: '/writings',
    name: 'WritingList',
    component: WritingList
  },
  {
    path: '/ranking',
    name: 'Ranking',
    component: Ranking
  },
  {
    path: '/community',
    name: 'Community',
    component: Community
  },
  {
    path: '/community/:id',
    name: 'WorkDetail',
    component: WorkDetail
  },
  {
    path: '/profile',
    name: 'Profile',
    component: Profile
  },
  {
    path: '/settings',
    name: 'Settings',
    component: Settings
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
