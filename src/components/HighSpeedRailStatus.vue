<template>
<div class="hsr-status">
  <h2>🚄 高铁运行状况</h2>
  <div v-if="companyLevel < 20" class="locked-state">
    <div class="locked-icon">🔒</div>
    <h3>高铁系统未解锁</h3>
    <p>公司等级达到 20 级解锁高铁系统</p>
    <p class="current-level">当前等级: {{ companyLevel }}</p>
  </div>

  <div v-else-if="highSpeedRails.length === 0" class="empty-state">
    <p>暂无高铁列车,快去商店购买吧!</p>
  </div>

  <div v-else class="hsr-list">
    <div v-for="hsr in highSpeedRails" :key="hsr.id" class="hsr-card">
      <div class="hsr-header">
        <h3>{{ getHSRModel(hsr.modelId)?.name || '未知车型' }}</h3>
        <span class="status-badge" :class="hsr.status">
          {{ hsr.status === 'running' ? '🚄 运行中' : '🛑 到站停车' }}
        </span>
      </div>

      <div class="hsr-info">
        <div class="info-row">
          <span class="info-label">📍 线路</span>
          <span class="info-value">{{ getRouteName(hsr.routeId) }}</span>
        </div>

        <div class="info-row" v-if="hsr.routeId">
          <span class="info-label">🏁 下一站</span>
          <span class="info-value">{{ getNextStop(hsr) }}</span>
        </div>

        <div class="info-row" v-if="hsr.status === 'stopped'">
          <span class="info-label">⏱️ 发车倒计时</span>
          <span class="info-value countdown">{{ hsr.stopCountdown }} 秒</span>
        </div>

        <div class="info-row">
          <span class="info-label">👥 乘客</span>
          <span class="info-value">{{ hsr.passengers }} / {{ getHSRModel(hsr.modelId)?.capacity || 0 }}</span>
        </div>

        <div class="info-row">
          <span class="info-label">🚀 速度</span>
          <span class="info-value">{{ getHSRModel(hsr.modelId)?.speed || 0 }} km/h</span>
        </div>

        <div class="progress-section">
          <div class="progress-label">
            <span>📈 到下一站进度</span>
            <span>{{ Math.floor(hsr.progress) }}%</span>
          </div>
          <div class="progress-bar">
            <div class="progress-fill" :style="{ width: `${hsr.progress}%` }"></div>
          </div>
        </div>

        <div class="resource-bars">
          <div class="resource-bar">
            <span class="resource-label">🧹 清洁度</span>
            <div class="bar-container">
              <div class="bar-fill cleanliness" :style="{ width: `${hsr.cleanliness}%` }"></div>
            </div>
            <span class="resource-value">{{ Math.floor(hsr.cleanliness) }}%</span>
            <button
              v-if="hsr.status === 'stopped'"
              class="action-btn-small clean"
              @click="cleanHSR(hsr.id)"
            >
              清洁
            </button>
            <span v-else-if="hsr.needsCleaning" class="hint-text">需到站清洁</span>
          </div>
        </div>

        <div class="hsr-upgrades">
          <span class="upgrade-tag" :class="{ active: hsr.hasEntertainment }">
            娱乐系统
          </span>
          <span class="upgrade-tag" :class="{ active: hsr.hasWiFi }">
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
  name: 'HighSpeedRailStatus',
  setup() {
    const store = useStore()

    const companyLevel = computed(() => store.state.companyLevel)
    const highSpeedRails = computed(() => store.state.highSpeedRails)

    const getHSRModel = (modelId) => {
      return store.getters.getHSRModel(modelId)
    }

    const getRoute = (routeId) => {
      return store.getters.getRoute(routeId)
    }

    const getRouteName = (routeId) => {
      if (!routeId) return '未分配线路'
      const route = getRoute(routeId)
      return route?.name || '未知线路'
    }

    const getNextStop = (hsr) => {
      if (!hsr.routeId) return '-'
      const route = getRoute(hsr.routeId)
      if (!route) return '-'
      return route.stops[hsr.currentStopIndex] || '-'
    }

    const cleanHSR = (hsrId) => {
      store.dispatch('cleanHSR', hsrId)
    }

    return {
      companyLevel,
      highSpeedRails,
      getHSRModel,
      getRouteName,
      getNextStop,
      cleanHSR
    }
  }
}
</script>

<style scoped>
.hsr-status h2 {
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
  color: #f5576c !important;
  font-weight: bold;
  font-size: 18px !important;
}

.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: #888;
  font-size: 18px;
}

.hsr-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 20px;
}

.hsr-card {
  background: linear-gradient(135deg, #d31027 0%, #ea384d 100%);
  border-radius: 15px;
  padding: 20px;
  box-shadow: 0 4px 15px rgba(211, 16, 39, 0.3);
}

.hsr-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.hsr-header h3 {
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

.status-badge.stopped {
  background: #2196f3;
  color: white;
}

.status-badge.idle {
  background: #ff9800;
  color: white;
}

.hsr-info {
  background: white;
  border-radius: 10px;
  padding: 15px;
}

.info-row {
  display: flex;
  justify-content: space-between;
  margin-bottom: 10px;
  font-size: 14px;
  align-items: center;
  flex-wrap: wrap;
  gap: 5px;
}

.info-label {
  color: #666;
}

.info-value {
  color: #333;
  font-weight: 500;
}

.info-value.countdown {
  color: #f5576c;
  font-weight: bold;
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
  background: linear-gradient(90deg, #d31027, #ea384d);
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
  flex-wrap: wrap;
  justify-content: flex-start;
}

.resource-label {
  font-size: 12px;
  color: #666;
  width: 70px;
  flex-shrink: 0;
}

.bar-container {
  flex: 1;
  height: 8px;
  background: #e0e0e0;
  border-radius: 4px;
  overflow: hidden;
  min-width: 60px;
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
  flex-shrink: 0;
}

.hint-text {
  font-size: 11px;
  color: #ea384d;
  width: 80px;
  text-align: center;
  flex-shrink: 0;
}

.action-btn-small {
  padding: 6px 10px;
  border: none;
  border-radius: 6px;
  font-size: 11px;
  cursor: pointer;
  transition: all 0.3s ease;
  white-space: nowrap;
  flex-shrink: 0;
}

.action-btn-small.clean {
  background: linear-gradient(135deg, #2196f3, #03a9f4);
  color: white;
}

.action-btn-small:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.2);
}

.hsr-upgrades {
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
  background: linear-gradient(135deg, #d31027 0%, #ea384d 100%);
  color: white;
}
</style>