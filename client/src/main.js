import { createApp } from 'vue'
import { createPinia } from 'pinia'
import './assets/main.css'
import App from './App.vue'
import router from './router'
// vue loading overlay 設定
import Loading from 'vue-loading-overlay'
import 'vue-loading-overlay/dist/css/index.css'
// vue toastification 設定
import Toast from 'vue-toastification'
import 'vue-toastification/dist/index.css'

const app = createApp(App)

app.use(createPinia())

app.use(router)
// 全域註冊 VueLoading 元件
app.component('VueLoading', Loading)
// 全域註冊 Vue toastification 元件
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

app.mount('#app')
