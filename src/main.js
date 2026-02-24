import { createApp } from 'vue'
import App from './App.vue'
import store from './store/gameStore'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'

const app = createApp(App)
createApp(App).use(ElementPlus).use(store).mount('#app')
app.use(store)
app.mount('#app')