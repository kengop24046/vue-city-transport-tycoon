<template>
  <div class="plane-status">
    <h2>✈️ 飞机运行状况</h2>

    <div v-if="companyLevel < 6" class="locked-state">
      <div class="locked-icon">🔒</div>
      <h3>飞机系统未解锁</h3>
      <p>公司等级达到 6 级解锁飞机系统</p>
      <p class="current-level">当前等级: {{ companyLevel }}</p>
    </div>

    <div v-else-if="planes.length === 0" class="empty-state">
      <p>暂无飞机,快去商店购买吧!</p>
    </div>

    <div v-else class="plane-list">
      <div v-for="plane in planes" :key="plane.id" class="plane-card">
        <div class="plane-header">
          <h3>{{ getPlaneModel(plane.modelId)?.name || '未知机型' }}</h3>
          <span class="status-badge" :class="getPlaneStatusClass(plane)">
            {{ getPlaneStatusText(plane) }}
          </span>
        </div>

        <div class="plane-info">
          <div class="info-row">
            <span class="info-label">📍 航线</span>
            <span class="info-value">{{ getRouteName(plane.routeId) }}</span>
          </div>

          <div class="info-row" v-if="plane.routeId">
            <span class="info-label">🏪 当前位置</span>
            <span class="info-value">{{ getCurrentPoint(plane) }}</span>
          </div>

          <div class="info-row">
            <span class="info-label">👥 乘客</span>
            <span class="info-value">{{ plane.passengers }} / {{ getPlaneModel(plane.modelId)?.capacity || 0 }}</span>
          </div>

          <div class="info-row">
            <span class="info-label">🚀 速度</span>
            <span class="info-value">{{ getPlaneModel(plane.modelId)?.speed || 0 }} km/h</span>
          </div>

          <div class="progress-section" v-if="plane.flightStage === 'boarding'">
            <div class="progress-label">
              <span>🎫 登机进度</span>
              <span>{{ Math.floor(plane.boardingProgress) }}%</span>
            </div>
            <div class="progress-bar">
              <div class="progress-fill boarding" :style="{ width: `${plane.boardingProgress}%` }"></div>
            </div>
          </div>

          <div class="progress-section" v-if="plane.flightStage === 'flying'">
            <div class="progress-label">
              <span>🛫 航程进度</span>
              <span>{{ Math.floor(plane.progress) }}%</span>
            </div>
            <div class="progress-bar">
              <div class="progress-fill flying" :style="{ width: `${plane.progress}%` }"></div>
            </div>
          </div>

          <div class="resource-bars">
            <div class="resource-bar">
              <span class="resource-label">⛽ 油量</span>
              <div class="bar-container">
                <div class="bar-fill fuel" :style="{ width: `${plane.fuel}%` }"></div>
              </div>
              <span class="resource-value">{{ Math.floor(plane.fuel) }}%</span>
            </div>
          </div>

          <div class="plane-upgrades">
            <span class="upgrade-tag" :class="{ active: plane.hasEntertainment }">
              娱乐系统
            </span>
            <span class="upgrade-tag" :class="{ active: plane.hasWiFi }">
              WiFi
            </span>
          </div>
        </div>

        <div class="plane-actions">
          <button
            v-if="plane.needsRefuel"
            class="action-btn refuel"
            @click="refuelPlane(plane.id)"
          >
            ⛽ 加油
          </button>
          <button
            v-if="plane.needsSupplies"
            class="action-btn supply"
            @click="supplyPlane(plane.id)"
          >
            🍽️ 补给
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { computed } from 'vue'
import { useStore } from 'vuex'

export default {
  name: 'PlaneStatus',
  setup() {
    const store = useStore()

    const companyLevel = computed(() => store.state.companyLevel)
    const planes = computed(() => store.state.planes)

    const getPlaneModel = (modelId) => {
      return store.getters.getPlaneModel(modelId)
    }

    const getRoute = (routeId) => {
      return store.getters.getRoute(routeId)
    }

    const getRouteName = (routeId) => {
      if (!routeId) return '未分配航线'
      const route = getRoute(routeId)
      return route?.name || '未知航线'
    }

    const getCurrentPoint = (plane) => {
      if (!plane.routeId) return '-'
      const route = getRoute(plane.routeId)
      if (!route) return '-'
      return route.points[plane.currentPointIndex] || '-'
    }

    const getPlaneStatusText = (plane) => {
      if (plane.status !== 'running') return '停泊'
      const statusMap = {
        docked: '🛬 停靠中',
        boarding: '🎫 登机中',
        flying: '✈️ 飞行中',
        arrived: '🏁 已抵达'
      }
      return statusMap[plane.flightStage] || '✈️ 运行中'
    }

    const getPlaneStatusClass = (plane) => {
      if (plane.status !== 'running') return 'idle'
      if (plane.flightStage === 'boarding') return 'boarding'
      if (plane.flightStage === 'flying') return 'running'
      return 'idle'
    }

    const refuelPlane = (planeId) => {
      store.dispatch('refuelPlane', planeId)
    }

    const supplyPlane = (planeId) => {
      store.dispatch('supplyPlane', planeId)
    }

    return {
      companyLevel,
      planes,
      getPlaneModel,
      getRouteName,
      getCurrentPoint,
      getPlaneStatusText,
      getPlaneStatusClass,
      refuelPlane,
      supplyPlane
    }
  }
}
</script>

<style scoped>
.plane-status h2 {
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

.plane-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 20px;
}

.plane-card {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 15px;
  padding: 20px;
  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
}

.plane-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.plane-header h3 {
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

.status-badge.boarding {
  background: #ff9800;
  color: white;
}

.status-badge.idle {
  background: #9e9e9e;
  color: white;
}

.plane-info {
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
  transition: width 0.3s ease;
}

.progress-fill.flying {
  background: linear-gradient(90deg, #667eea, #764ba2);
}

.progress-fill.boarding {
  background: linear-gradient(90deg, #ff9800, #ffc107);
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

.bar-fill.fuel {
  background: linear-gradient(90deg, #ff9800, #ffc107);
}

.resource-value {
  font-size: 12px;
  color: #333;
  width: 40px;
  text-align: right;
}

.plane-upgrades {
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
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.plane-actions {
  display: flex;
  gap: 10px;
  margin-top: 15px;
}

.action-btn {
  flex: 1;
  padding: 10px;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.action-btn.refuel {
  background: linear-gradient(135deg, #ff9800, #ffc107);
  color: white;
}

.action-btn.supply {
  background: linear-gradient(135deg, #4caf50, #8bc34a);
  color: white;
}

.action-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.2);
}
</style>