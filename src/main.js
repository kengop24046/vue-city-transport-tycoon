import { createApp } from 'vue'
import App from './App.vue'
import store from './store/gameStore'

const app = createApp(App)
app.use(store)
app.mount('#app')