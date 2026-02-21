<template>
  <header class="header">
    <div class="header-content">
      <div class="logo">
        <h1>🏙️ 城市交通大亨 🚗</h1>
        <p class="subtitle">{{ companyName }}</p>
      </div>
      <div class="stats">
        <div class="stat-item">
          <span class="stat-icon">💰</span>
          <span class="stat-label">资金</span>
          <span class="stat-value">¥{{ formatMoney(money) }}</span>
        </div>
        <div class="stat-item">
          <span class="stat-icon">🏢</span>
          <span class="stat-label">等级</span>
          <span class="stat-value">Lv.{{ companyLevel }}</span>
        </div>
        <div class="stat-item">
          <span class="stat-icon">⭐</span>
          <span class="stat-label">经验</span>
          <div class="exp-bar">
            <div class="exp-fill" :style="{ width: `${(experience / experienceToNextLevel) * 100}%` }"></div>
          </div>
          <span class="stat-value-small">{{ formatMoney(experience) }} / {{ formatMoney(experienceToNextLevel) }}</span>
        </div>
        <div class="stat-item">
          <span class="stat-icon">🕐</span>
          <span class="stat-label">时间</span>
          <span class="stat-value">{{ currentTime }}</span>
        </div>
      </div>
    </div>
  </header>
</template>

<script>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useStore } from 'vuex'

export default {
  name: 'Header',
  setup() {
    const store = useStore()
    const currentTime = ref('')
    let timeInterval = null

    const money = computed(() => store.state.money)
    const companyLevel = computed(() => store.state.companyLevel)
    const experience = computed(() => store.state.experience)
    const experienceToNextLevel = computed(() => store.state.experienceToNextLevel)
    const companyName = computed(() => store.state.companyName)

    const formatMoney = (amount) => {
      if (amount >= 100000000) {
        return (amount / 100000000).toFixed(2) + '亿'
      } else if (amount >= 10000) {
        return (amount / 10000).toFixed(2) + '万'
      }
      return Math.floor(amount).toLocaleString()
    }

    const updateTime = () => {
      const now = new Date()
      const hours = String(now.getHours()).padStart(2, '0')
      const minutes = String(now.getMinutes()).padStart(2, '0')
      const seconds = String(now.getSeconds()).padStart(2, '0')
      currentTime.value = `${hours}:${minutes}:${seconds}`
    }

    onMounted(() => {
      updateTime()
      timeInterval = setInterval(updateTime, 1000)
    })

    onUnmounted(() => {
      if (timeInterval) clearInterval(timeInterval)
    })

    return {
      money,
      companyLevel,
      experience,
      experienceToNextLevel,
      companyName,
      currentTime,
      formatMoney
    }
  }
}
</script>

<style scoped>
.header {
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(255, 255, 255, 0.85) 100%);
  backdrop-filter: blur(10px);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  padding: 20px 0;
  position: sticky;
  top: 0;
  z-index: 100;
}

.header-content {
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 20px;
}

.logo h1 {
  font-size: 28px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin: 0;
}

.subtitle {
  font-size: 14px;
  color: #666;
  margin: 5px 0 0 0;
}

.stats {
  display: flex;
  gap: 30px;
  flex-wrap: wrap;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 5px;
}

.stat-icon {
  font-size: 24px;
}

.stat-label {
  font-size: 12px;
  color: #888;
  font-weight: 500;
}

.stat-value {
  font-size: 18px;
  font-weight: bold;
  color: #333;
}

.stat-value-small {
  font-size: 12px;
  color: #666;
}

.exp-bar {
  width: 100px;
  height: 8px;
  background: #e0e0e0;
  border-radius: 4px;
  overflow: hidden;
}

.exp-fill {
  height: 100%;
  background: linear-gradient(90deg, #f093fb 0%, #f5576c 100%);
  transition: width 0.3s ease;
}
</style>