<template>
  <div class="metro-status">
    <h2>🚇 地铁运行状况</h2>

    <div v-if="companyLevel < 10" class="locked-state">
      <div class="locked-icon">🔒</div>
      <h3>地铁系统未解锁</h3>
      <p>公司等级达到 10 级解锁地铁系统</p>
      <p class="current-level">当前等级: {{ companyLevel }}</p>
    </div>

    <div v-else-if="metros.length === 0" class="empty-state">
      <p>暂无地铁列车,快去商店购买吧!</p>
    </div>

    <div v-else class="metro-list">
      <div v-for="metro in metros" :key="metro.id" class="metro-card">
        <div class="metro-header">
          <h3>{{ getMetroModel(metro.modelId)?.name || '未知车型' }}</h3>
          <span class="status-badge" :class="metro.status">
            {{ metro.status === 'running' ? '🚇 运行中' : '⏸️ 停运' }}
          </span>
        </div>

        <div class="metro-info">
          <div class="info-row">
            <span class="info-label">📍 线路</span>
            <span class="info-value">{{ getRouteName(metro.routeId) }}</span>
          </div>

          <div class="info-row" v-if="metro.routeId">
            <span class="info-label">🏪 当前站点</span>
            <span class="info-value">{{ getCurrentStop(metro) }}</span>
          </div>

          <div class="info-row">
            <span class="info-label">👥 乘客</span>
            <span class="info-value">{{ metro.passengers }} / {{ getMetroModel(metro.modelId)?.capacity || 0 }}</span>
          </div>

          <div class="progress-section">
            <div class="progress-label">
              <span>🛤️ 行程进度</span>
              <span>{{ Math.floor(metro.progress) }}%</span>
            </div>
            <div class="progress-bar">
              <div class="progress-fill" :style="{ width: `${metro.progress}%` }"></div>
            </div>
          </div>

          <div class="resource-bars">
            <div class="resource-bar">
              <span class="resource-label">🧹 清洁度</span>
              <div class="bar-container">
                <div class="bar-fill cleanliness" :style="{ width: `${metro.cleanliness}%` }"></div>
              </div>
              <span class="resource-value">{{ Math.floor(metro.cleanliness) }}%</span>
            </div>
          </div>

          <div class="metro-upgrades">
            <span class="upgrade-tag" :class="{ active: metro.hasWiFi }">
              WiFi
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { computed } from 'vue'
import { useStore } from 'vuex'

export default {
  name: 'MetroStatus',
  setup() {
    const store = useStore()

    const companyLevel = computed(() => store.state.companyLevel)
    const metros = computed(() => store.state.metros)

    const getMetroModel = (modelId) => {
      return store.getters.getMetroModel(modelId)
    }

    const getRoute = (routeId) => {
      return store.getters.getRoute(routeId)
    }

    const getRouteName = (routeId) => {
      if (!routeId) return '未分配线路'
      const route = getRoute(routeId)
      return route?.name || '未知线路'
    }

    const getCurrentStop = (metro) => {
      if (!metro.routeId) return '-'
      const route = getRoute(metro.routeId)
      if (!route) return '-'
      return route.stops[metro.currentStopIndex] || '-'
    }

    return {
      companyLevel,
      metros,
      getMetroModel,
      getRouteName,
      getCurrentStop
    }
  }
}
</script>

<style scoped>
.metro-status h2 {
  margin: 0 0 25px 0;
  color: #333;
  font-size: 24px;
}

.locked-state {
  text-align: center;
  padding: 80px 20px;
}

.locked-icon {
  font-size: 80px;
  margin-bottom: 20px;
}

.locked-state h3 {
  margin: 0 0 10px 0;
  color: #333;
  font-size: 24px;
}

.locked-state p {
  margin: 5px 0;
  color: #666;
  font-size: 16px;
}

.current-level {
  color: #667eea !important;
  font-weight: bold;
  font-size: 18px !important;
}

.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: #888;
  font-size: 18px;
}

.metro-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 20px;
}

.metro-card {
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
  border-radius: 15px;
  padding: 20px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
}

.metro-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.metro-header h3 {
  margin: 0;
  color: white;
  font-size: 18px;
}

.status-badge {
  padding: 5px 12px;
  border-radius: 15px;
  font-size: 12px;
  font-weight: 500;
}

.status-badge.running {
  background: #4caf50;
  color: white;
}

.status-badge.idle {
  background: #ff9800;
  color: white;
}

.metro-info {
  background: white;
  border-radius: 10px;
  padding: 15px;
}

.info-row {
  display: flex;
  justify-content: space-between;
  margin-bottom: 10px;
  font-size: 14px;
}

.info-label {
  color: #666;
}

.info-value {
  color: #333;
  font-weight: 500;
}

.progress-section {
  margin: 15px 0;
}

.progress-label {
  display: flex;
  justify-content: space-between;
  font-size: 14px;
  margin-bottom: 5px;
}

.progress-bar {
  height: 10px;
  background: #e0e0e0;
  border-radius: 5px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #1a1a2e, #16213e);
  transition: width 0.3s ease;
}

.resource-bars {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin: 15px 0;
}

.resource-bar {
  display: flex;
  align-items: center;
  gap: 10px;
}

.resource-label {
  font-size: 12px;
  color: #666;
  width: 70px;
}

.bar-container {
  flex: 1;
  height: 8px;
  background: #e0e0e0;
  border-radius: 4px;
  overflow: hidden;
}

.bar-fill {
  height: 100%;
  transition: width 0.3s ease;
}

.bar-fill.cleanliness {
  background: linear-gradient(90deg, #2196f3, #03a9f4);
}

.resource-value {
  font-size: 12px;
  color: #333;
  width: 40px;
  text-align: right;
}

.metro-upgrades {
  display: flex;
  gap: 10px;
  margin-top: 15px;
}

.upgrade-tag {
  padding: 5px 10px;
  border-radius: 12px;
  font-size: 12px;
  background: #e0e0e0;
  color: #888;
}

.upgrade-tag.active {
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
  color: white;
}
</style>