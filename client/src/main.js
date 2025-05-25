import { createApp } from 'vue'
import { createPinia } from 'pinia'
import './assets/main.css'
import Loading from 'vue-loading-overlay'
import 'vue-loading-overlay/dist/css/index.css'

import Toast from 'vue-toastification'
import 'vue-toastification/dist/index.css'

import App from './App.vue'
import router from './router'

const app = createApp(App)

const toastOptions = {
  position: 'bottom-center',
  timeout: 1500,
  closeOnClick: true,
  pauseOnHover: true,
  draggable: true,
  showCloseButtonOnHover: false,
  hideProgressBar: false,
  icon: true,
}

app.use(Toast, toastOptions)
app.use(createPinia())
app.use(router)
app.component('VueLoading', Loading) // 全域註冊 VueLoading 元件

app.mount('#app')
