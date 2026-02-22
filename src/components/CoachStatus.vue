<template>
  <div class="coach-status">
    <h3>🚍 长途巴士运行状况</h3>
    <div v-if="coaches.length === 0" class="empty-state">
      <p>🅿️ 暂无长途巴士,快去商店购买吧!</p>
    </div>
    <div v-else class="coach-list">
      <div v-for="coach in coaches" :key="coach.id" class="coach-card">
        <div class="coach-header">
          <h3>{{ getBusModel(coach.modelId)?.name || '未知车型' }}</h3>
          <span class="status-badge" :class="coach.status">
            {{ getBusStatusText(coach) }}
          </span>
        </div>
        <div class="coach-info">
          <div class="info-row">
            <span class="info-label">🗺️ 线路</span>
            <span class="info-value">{{ getRouteName(coach.routeId) }}</span>
          </div>
          <div class="info-row" v-if="coach.status === 'stopped'">
            <span class="info-label">📍 已到站</span>
            <span class="info-value arrived">
              {{ getCurrentStop(coach) }}
              <span v-if="coach.isAtTerminal" class="terminal-tag">🏁 总站</span>
            </span>
          </div>
          <div class="info-row" v-if="coach.routeId">
            <span class="info-label">🏁 下一站</span>
            <span class="info-value">{{ getNextStop(coach) }}</span>
          </div>
          <div class="info-row" v-if="coach.status === 'stopped'">
            <span class="info-label">⏱️ 发车倒计时</span>
            <span class="info-value countdown" :class="{terminal: coach.isAtTerminal}">
              {{ coach.stopCountdown }} 秒
              <span v-if="coach.isAtTerminal" class="terminal-hint">(总站停靠)</span>
            </span>
          </div>
          <div class="info-row">
            <span class="info-label">👥 乘客</span>
            <span class="info-value">
              {{ coach.passengers }} / {{ getBusModel(coach.modelId)?.capacity || 0 }}
            </span>
          </div>
          <div class="progress-section">
            <div class="progress-label">
              <span>📈 到下一站进度</span>
              <span>{{ Math.floor(coach.progress || 0) }}%</span>
            </div>
            <div class="progress-bar">
              <div class="progress-fill" :style="{ width: `${coach.progress || 0}%` }"></div>
            </div>
          </div>
        </div>
        <div class="resource-bars">
          <div class="resource-bar" v-if="coach.powerType === 'electric'">
            <span class="resource-label">🔋 电量</span>
            <div class="bar-container">
              <div class="bar-fill battery" :style="{ width: `${coach.battery || 0}%` }"></div>
            </div>
            <span class="resource-value">{{ Math.floor(coach.battery || 0) }}%</span>
            <button
              v-if="coach.isAtTerminal && coach.status === 'stopped'"
              class="action-btn charge"
              @click="chargeBus(coach.id)"
            >
              充电
            </button>
            <span v-else-if="coach.needsCharge" class="hint-text">🔌 需到总站充电</span>
          </div>
          <div class="resource-bar" v-else-if="coach.powerType === 'fuel'">
            <span class="resource-label">⛽ 油量</span>
            <div class="bar-container">
              <div class="bar-fill fuel" :style="{ width: `${coach.fuel || 0}%` }"></div>
            </div>
            <span class="resource-value">{{ Math.floor(coach.fuel || 0) }}%</span>
            <button
              v-if="coach.isAtTerminal && coach.status === 'stopped'"
              class="action-btn refuel"
              @click="refuelBus(coach.id)"
            >
              加油
            </button>
            <span v-else-if="coach.needsRefuel" class="hint-text">需到总站加油</span>
          </div>
          <div class="resource-bar">
            <span class="resource-label">🧹 清洁度</span>
            <div class="bar-container">
              <div class="bar-fill cleanliness" :style="{ width: `${coach.cleanliness || 0}%` }"></div>
            </div>
            <span class="resource-value">{{ Math.floor(coach.cleanliness || 0) }}%</span>
            <button
              v-if="coach.isAtTerminal && coach.status === 'stopped'"
              class="action-btn clean"
              @click="cleanBus(coach.id)"
            >
              清洁
            </button>
            <span v-else-if="coach.needsCleaning" class="hint-text">需到总站清洁</span>
          </div>
        </div>
        <div class="coach-upgrades">
          <span class="upgrade-tag" :class="{ active: coach.hasEntertainment }">
            娱乐系统
          </span>
          <span class="upgrade-tag" :class="{ active: coach.hasWiFi }">
            WiFi
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { computed } from 'vue'
import { useStore } from 'vuex'

export default {
  name: 'CoachStatus',
  setup() {
    const store = useStore()
    
    // 筛选长途巴士
    const coaches = computed(() => store.state.buses.filter(b => b.busType === 'coach'))

    // 获取巴士车型信息
    const getBusModel = (modelId) => {
      return store.getters.getBusModel(modelId)
    }

    // 获取线路完整信息
    const getRoute = (routeId) => {
      if (!routeId) return null
      return store.getters.getRoute(routeId)
    }

    // 获取线路名称
    const getRouteName = (routeId) => {
      if (!routeId) return '未分配线路'
      const route = getRoute(routeId)
      return route?.name || '未知线路'
    }

    // 获取当前站点
    const getCurrentStop = (coach) => {
      if (!coach.routeId) return '-'
      const route = getRoute(coach.routeId)
      if (!route) return '-'
      const stops = coach.direction === 'outbound' ? route.stops.outbound : route.stops.inbound
      return stops[coach.currentStopIndex] || '-'
    }

    const getNextStop = (coach) => {
      if (!coach.routeId) return '-'
      const route = getRoute(coach.routeId)
      if (!route) return '-'
      
      const currentStops = coach.direction === 'outbound' ? route.stops.outbound : route.stops.inbound
      const currentIndex = coach.currentStopIndex

      switch (coach.status) {
        case 'running':
          return currentStops[currentIndex] || '-'
        case 'stopped': {
          const nextIndex = currentIndex + 1
          if (nextIndex < currentStops.length) {
            return currentStops[nextIndex] || '-'
          }
          const reverseDirection = coach.direction === 'outbound' ? 'inbound' : 'outbound'
          const reverseStops = reverseDirection === 'outbound' ? route.stops.outbound : route.stops.inbound
          return reverseStops[0] || '-'
        }
        default:
          return '-'
      }
    }

    // 获取巴士状态文本
    const getBusStatusText = (bus) => {
      const statusMap = {
        running: '运行中',
        stopped: '到站停车',
        idle: '💤 闲置'
      }
      return statusMap[bus.status] || '未知状态'
    }

    // 巴士加油操作
    const refuelBus = (busId) => {
      store.dispatch('refuelBus', busId)
    }

    // 巴士充电操作
    const chargeBus = (busId) => {
      store.dispatch('chargeBus', busId)
    }

    // 巴士清洁操作
    const cleanBus = (busId) => {
      store.dispatch('cleanBus', busId)
    }

    return {
      coaches,
      getBusModel,
      getRouteName,
      getCurrentStop,
      getNextStop,
      getBusStatusText,
      refuelBus,
      chargeBus,
      cleanBus
    }
  }
}
</script>

<style scoped>
.coach-status h3 {
  margin: 0 0 25px 0;
  color: #333;
  font-size: 24px;
}

.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: #888;
  font-size: 18px;
}

.coach-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 20px;
}

.coach-card {
  background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%);
  border-radius: 15px;
  padding: 20px;
  box-shadow: 0 4px 15px rgba(30, 60, 114, 0.3);
}

.coach-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.coach-header h3 {
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

.coach-info {
  background: white;
  border-radius: 10px;
  padding: 15px;
  margin-bottom: 15px;
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

.info-value.arrived {
  color: #f5576c;
  font-weight: bold;
  display: flex;
  align-items: center;
  gap: 5px;
  flex-wrap: wrap;
}

.terminal-tag {
  font-size: 11px;
  background: #f5576c;
  color: white;
  padding: 2px 6px;
  border-radius: 4px;
  font-weight: normal;
  white-space: nowrap;
}

.info-value.countdown {
  color: #f5576c;
  font-weight: bold;
  display: flex;
  align-items: center;
  gap: 5px;
  flex-wrap: wrap;
}

.info-value.countdown.terminal {
  color: #ffeb3b;
}

.terminal-hint {
  font-size: 11px;
  font-weight: normal;
  opacity: 0.8;
  white-space: nowrap;
}

.progress-section {
  margin: 15px 0 0 0;
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
  background: linear-gradient(90deg, #4caf50, #8bc34a);
  transition: width 0.3s ease;
}

.resource-bars {
  display: flex;
  flex-direction: column;
  gap: 15px;
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
  color: #fff;
  width: 70px;
  flex-shrink: 0;
}

.bar-container {
  flex: 1;
  height: 8px;
  background: rgba(255,255,255,0.2);
  border-radius: 4px;
  overflow: hidden;
  min-width: 80px;
}

.bar-fill {
  height: 100%;
  transition: width 0.3s ease;
}

.bar-fill.fuel {
  background: linear-gradient(90deg, #ff9800, #ffc107);
}

.bar-fill.battery {
  background: linear-gradient(90deg, #2196f3, #03a9f4);
}

.bar-fill.cleanliness {
  background: linear-gradient(90deg, #00bcd4, #4dd0e1);
}

.resource-value {
  font-size: 12px;
  color: #fff;
  width: 40px;
  text-align: right;
  flex-shrink: 0;
}

.hint-text {
  font-size: 11px;
  color: #ffeb3b;
  width: 80px;
  text-align: center;
  flex-shrink: 0;
}

.action-btn {
  padding: 8px 12px;
  border: none;
  border-radius: 6px;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
  white-space: nowrap;
  flex-shrink: 0;
}

.action-btn.refuel {
  background: linear-gradient(135deg, #ff9800, #ffc107);
  color: white;
}

.action-btn.charge {
  background: linear-gradient(135deg, #2196f3, #03a9f4);
  color: white;
}

.action-btn.clean {
  background: linear-gradient(135deg, #00bcd4, #4dd0e1);
  color: white;
}

.action-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.2);
}

.coach-upgrades {
  display: flex;
  gap: 10px;
  margin-top: 15px;
}

.upgrade-tag {
  padding: 5px 10px;
  border-radius: 12px;
  font-size: 12px;
  background: rgba(255,255,255,0.2);
  color: #fff;
}

.upgrade-tag.active {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
  color: white;
}

@media screen and (max-width: 400px) {
  .coach-list {
    grid-template-columns: 1fr;
  }
  .resource-bar {
    justify-content: space-between;
  }
  .bar-container {
    min-width: 60px;
  }
  .action-btn {
    padding: 6px 8px;
    font-size: 11px;
  }
}
</style>