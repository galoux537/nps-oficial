import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { createRouter, createWebHistory } from 'vue-router'
import './style.css'
import App from './App.vue'
import Dashboard from './views/Dashboard.vue'
import Reports from './views/Reports.vue'
import Engagement from './views/Engagement.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { 
      path: '/', 
      name: 'Dashboard',
      component: Dashboard 
    },
    { 
      path: '/reports', 
      name: 'Reports',
      component: Reports 
    },
    { 
      path: '/engagement', 
      name: 'Engagement',
      component: Engagement 
    }
  ]
})

const pinia = createPinia()
const app = createApp(App)

app.use(pinia)
app.use(router)
app.mount('#app')