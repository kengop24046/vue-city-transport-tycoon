<template>
  <div class="dashboard">
    <h2>📊 运营总览</h2>
    <div class="quick-stats">
      <div class="stat-card">
        <div class="stat-card-icon">🚌</div>
        <div class="stat-card-content">
          <h3>运营巴士</h3>
          <p class="big-number">{{ activeBuses }} / {{ totalBuses }}</p>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-card-icon">🚕</div>
        <div class="stat-card-content">
          <h3>运营的士</h3>
          <p class="big-number">{{ activeTaxis }} / {{ totalTaxis }}</p>
        </div>
      </div>
      <div class="stat-card" v-if="companyLevel >= 6">
        <div class="stat-card-icon">✈️</div>
        <div class="stat-card-content">
          <h3>运营飞机</h3>
          <p class="big-number">{{ activePlanes }} / {{ totalPlanes }}</p>
        </div>
      </div>
      <div class="stat-card" v-if="companyLevel >= 10">
        <div class="stat-card-icon">🚇</div>
        <div class="stat-card-content">
          <h3>运营地铁</h3>
          <p class="big-number">{{ activeMetros }} / {{ totalMetros }}</p>
        </div>
      </div>
      <div class="stat-card" v-if="companyLevel >= 20">
        <div class="stat-card-icon">🚄</div>
        <div class="stat-card-content">
          <h3>运营高铁</h3>
          <p class="big-number">{{ activeHSRs }} / {{ totalHSRs }}</p>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-card-icon">🚲</div>
        <div class="stat-card-content">
          <h3>共享单车</h3>
          <p class="big-number">{{ totalBikes }} 辆</p>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-card-icon">👥</div>
        <div class="stat-card-content">
          <h3>员工总数</h3>
          <p class="big-number">{{ totalEmployees }}</p>
        </div>
      </div>
    </div>

    <div class="dashboard-grid">
      <div class="dashboard-section">
        <h3>🏙️ 已解锁城市</h3>
        <div class="city-list">
          <div v-for="city in unlockedCities" :key="city.id" class="city-tag">
            {{ city.name }}
          </div>
        </div>
      </div>

      <div class="dashboard-section">
        <h3>👨‍👩‍👧‍👦 当前乘客</h3>
        <p class="passenger-count">{{ totalPassengers }} 人</p>
      </div>

      <div class="dashboard-section">
        <h3>💵 最近收入</h3>
        <div class="recent-income">
          <p v-if="recentIncomes.length === 0">暂无收入记录</p>
          <div v-for="(income, index) in recentIncomes" :key="index" class="income-item">
            <span>{{ income.description }}</span>
            <span class="income-amount">+ ¥{{ formatMoney(income.amount) }}</span>
          </div>
        </div>
      </div>

      <div class="dashboard-section">
        <h3>⭐ 下一等级</h3>
        <div class="next-level-info">
          <p>还需 <strong>¥{{ formatMoney(experienceToNextLevel - experience) }}</strong> 经验</p>
          <div class="exp-bar-large">
            <div class="exp-fill-large" :style="{ width: `${(experience / experienceToNextLevel) * 100}%` }"></div>
          </div>
          <p v-if="nextLevelUnlock" class="unlock-hint">🔓 {{ nextLevelUnlock }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { computed } from 'vue'
import { useStore } from 'vuex'

export default {
  name: 'Dashboard',
  setup() {
    const store = useStore()

    const companyLevel = computed(() => store.state.companyLevel)
    const experience = computed(() => store.state.experience)
    const experienceToNextLevel = computed(() => store.state.experienceToNextLevel)
    const totalPassengers = computed(() => store.getters.totalPassengers)

    const totalBuses = computed(() => store.state.buses.length)
    const activeBuses = computed(() => store.state.buses.filter(b => b.status === 'running' && b.routeId).length)
    
    const totalTaxis = computed(() => store.state.taxis.length)
    const activeTaxis = computed(() => store.state.taxis.filter(t => t.driverId && t.status !== 'offline').length)

    const totalPlanes = computed(() => store.state.planes.length)
    const activePlanes = computed(() => store.state.planes.filter(p => p.status === 'running' && p.routeId).length)

    const totalMetros = computed(() => store.state.metros.length)
    const activeMetros = computed(() => store.state.metros.filter(m => m.status === 'running' && m.routeId).length)

    const totalHSRs = computed(() => store.state.highSpeedRails.length)
    const activeHSRs = computed(() => store.state.highSpeedRails.filter(h => h.status === 'running' && h.routeId).length)

    const totalBikes = computed(() => store.state.sharedBikes.totalBikes)

    const totalEmployees = computed(() => {
      let count = 0
      Object.values(store.state.employees).forEach(type => {
        count += type.filter(e => e.hired).length
      })
      return count
    })

    const unlockedCities = computed(() => {
      return store.state.unlockedCities.map(cityId => {
        return store.getters.getCityInfo(cityId)
      }).filter(Boolean)
    })

    const recentIncomes = computed(() => {
      return store.state.financialRecords
        .filter(r => r.type === 'income')
        .slice(0, 5)
    })

    const nextLevelUnlock = computed(() => {
      const level = companyLevel.value
      if (level === 5) return '6级解锁✈️ 飞机系统!'
      if (level === 9) return '10级解锁🚇 地铁系统!'
      if (level === 19) return '20级解锁🚄高铁系统!'
      if (level < 30) return '更多🏙️城市和 🛣️线路等待解锁!'
      return '已达到最高等级🎉'
    })

    const formatMoney = (amount) => {
      if (amount >= 100000000) {
        return (amount / 100000000).toFixed(2) + '亿'
      } else if (amount >= 10000) {
        return (amount / 10000).toFixed(2) + '万'
      }
      return Math.floor(amount).toLocaleString()
    }

    return {
      companyLevel,
      experience,
      experienceToNextLevel,
      totalPassengers,
      totalBuses,
      activeBuses,
      totalTaxis,
      activeTaxis,
      totalPlanes,
      activePlanes,
      totalMetros,
      activeMetros,
      totalHSRs,
      activeHSRs,
      totalBikes,
      totalEmployees,
      unlockedCities,
      recentIncomes,
      nextLevelUnlock,
      formatMoney
    }
  }
}
</script>

<style scoped>
.dashboard h2 {
  margin: 0 0 25px 0;
  color: #333;
  font-size: 24px;
}

.quick-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
}

.stat-card {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 15px;
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 15px;
  color: white;
  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
}

.stat-card-icon {
  font-size: 40px;
}

.stat-card-content h3 {
  margin: 0;
  font-size: 14px;
  opacity: 0.9;
}

.big-number {
  margin: 5px 0 0 0;
  font-size: 28px;
  font-weight: bold;
}

.dashboard-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 20px;
}

.dashboard-section {
  background: #f8f9fa;
  border-radius: 15px;
  padding: 20px;
}

.dashboard-section h3 {
  margin: 0 0 15px 0;
  color: #333;
  font-size: 16px;
}

.city-list {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.city-tag {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
  color: white;
  padding: 8px 16px;
  border-radius: 20px;
  font-size: 14px;
  font-weight: 500;
}

.passenger-count {
  font-size: 36px;
  font-weight: bold;
  color: #667eea;
  margin: 0;
}

.recent-income {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.income-item {
  display: flex;
  justify-content: space-between;
  padding: 10px;
  background: white;
  border-radius: 8px;
  font-size: 14px;
}

.income-amount {
  color: #4caf50;
  font-weight: bold;
}

.next-level-info p {
  margin: 0 0 10px 0;
  color: #666;
}

.exp-bar-large {
  width: 100%;
  height: 12px;
  background: #e0e0e0;
  border-radius: 6px;
  overflow: hidden;
  margin: 10px 0;
}

.exp-fill-large {
  height: 100%;
  background: linear-gradient(90deg, #f093fb 0%, #f5576c 100%);
  transition: width 0.3s ease;
}

.unlock-hint {
  color: #f5576c !important;
  font-weight: 500;
}
</style>