<template>
<div class="coach-status">
  <h3>🚛 长途巴士运行状况</h3>
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
        <div class="info-row" v-if="coach.driverId">
          <span class="info-label">👨‍✈️ 司机</span>
          <span class="info-value">{{ getDriverName(coach.driverId) }}</span>
        </div>
        <div class="info-row" v-if="coach.conductorId">
          <span class="info-label">💁 售票员</span>
          <span class="info-value">{{ getConductorName(coach.conductorId) }}</span>
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
        <div class="progress-section" v-if="coach.routeId">
          <div class="progress-label">
            <span>📈 到下一站进度</span>
            <span>{{ Math.floor(coach.progress || 0) }}%</span>
          </div>
          <div class="progress-bar">
            <div class="progress-fill" :style="{ width: `${coach.progress || 0}%` }">
            </div>
          </div>
        </div>

        <div v-if="coach.isWaitingTrafficLight" class="traffic-light-warning coach">
          🚦 进出城等红绿灯：{{ coach.trafficLightWaitTime }} 秒
        </div>

        <div v-if="coach.isWaitingTollGate" class="toll-gate-warning">
          🛣️ 高速收费站排队：{{ coach.tollGateWaitTime }} 秒
        </div>
      </div>
      <div class="resource-bars">
        <div class="resource-bar" v-if="coach.powerType === 'electric'">
          <span class="resource-label">🔋 电量</span>
          <div class="bar-container">
            <div class="bar-fill battery" :style="{ width: `${coach.battery || 0}%` }">
            </div>
          </div>
          <span class="resource-value">{{ Math.floor(coach.battery || 0) }}%</span>
          <button
            v-if="getBusCanOperate(coach)"
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
            v-if="getBusCanOperate(coach)"
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
            v-if="getBusCanOperate(coach)"
            class="action-btn clean"
            @click="cleanBus(coach.id)"
          >
            清洁
          </button>
          <span v-else-if="coach.needsCleaning" class="hint-text">需到总站清洁</span>
        </div>
      </div>
      <div class="route-operation">
        <div v-if="!coach.routeId" class="assign-section">
          <div class="assign-form">
            <select v-model="assignForm[coach.id].routeId" class="select-input full-width">
              <option value="">选择要分配的线路</option>
              <option
                v-for="route in getAvailableRoutes()"
                :key="route.id"
                :value="route.id"
              >
                {{ route.name }}
              </option>
            </select>
            <select v-model="assignForm[coach.id].driverId" class="select-input">
              <option value="">选择司机</option>
              <option
                v-for="driver in availableDrivers"
                :key="driver.id"
                :value="driver.id"
              >
                {{ driver.name }}
              </option>
            </select>
            <select v-model="assignForm[coach.id].conductorId" class="select-input">
              <option value="">选择售票员</option>
              <option
                v-for="conductor in availableConductors"
                :key="conductor.id"
                :value="conductor.id"
              >
                {{ conductor.name }}
              </option>
            </select>
            <button
              class="assign-btn"
              :disabled="!canAssignBus(coach.id)"
              @click="assignBusRoute(coach.id)"
            >
              分配线路
            </button>
          </div>
        </div>
        <div v-else class="remove-section">
          <button class="remove-btn" @click="removeBusRoute(coach.id)">
            取消线路
          </button>
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
import { computed, reactive, watch } from 'vue'
import { useStore } from 'vuex'
import { ElMessage } from 'element-plus'
export default {
  name: 'CoachStatus',
  setup() {
    const store = useStore()
    const assignForm = reactive({})
    const coaches = computed(() => store.state.buses.filter(b => b.busType === 'coach'))
    const employees = computed(() => store.state.employees)
    const activeRoutes = computed(() => store.state.activeRoutes)
    const getAvailableRoutes = () => {
      const coachRouteIds = activeRoutes.value.coach || []
      return coachRouteIds.map(id => store.getters.getRoute(id)).filter(Boolean)
    }
    const availableDrivers = computed(() => {
      return store.getters.availableBusDrivers || employees.value.busDrivers.filter(d => !d.assignedVehicleId)
    })
    const availableConductors = computed(() => {
      return store.getters.availableConductors || employees.value.conductors.filter(c => !c.assignedVehicleId)
    })
    const getBusModel = (modelId) => {
      return store.getters.getBusModel(modelId)
    }
    const getBusCanOperate = (bus) => {
      return store.getters.getBusCanOperate(bus)
    }
    const getRoute = (routeId) => {
      if (!routeId) return null
      return store.getters.getRoute(routeId)
    }
    const getRouteName = (routeId) => {
      if (!routeId) return '未分配线路'
      const route = getRoute(routeId)
      return route?.name || '未知线路'
    }
    const getDriverName = (driverId) => {
      const driver = employees.value.busDrivers.find(d => d.id === driverId)
      return driver?.name || '未知司机'
    }
    const getConductorName = (conductorId) => {
      const conductor = employees.value.conductors.find(c => c.id === conductorId)
      return conductor?.name || '未知售票员'
    }
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
    const getBusStatusText = (bus) => {
      const statusMap = {
        running: '🚌 运行中',
        stopped: '到站停车',
        idle: '💤 闲置'
      }
      return statusMap[bus.status] || '未知状态'
    }
    watch(coaches, (newCoaches) => {
      newCoaches.forEach(coach => {
        if (!assignForm[coach.id]) {
          assignForm[coach.id] = {
            routeId: '',
            driverId: '',
            conductorId: ''
          }
        }
      })
    }, { immediate: true })
    const canAssignBus = (busId) => {
      const form = assignForm[busId]
      return !!form?.routeId && !!form?.driverId && !!form?.conductorId
    }
    const assignBusRoute = async (busId) => {
      const form = assignForm[busId]
      if (!canAssignBus(busId)) {
        ElMessage.warning('请完整选择线路､司机和售票员')
        return
      }
      try {
        const success = await store.dispatch('assignBusRoute', {
          busId,
          routeId: form.routeId,
          driverId: form.driverId,
          conductorId: form.conductorId
        })
        if (success) {
          ElMessage.success('线路分配成功!长途巴士已开始运行')
          assignForm[busId] = {
            routeId: '',
            driverId: '',
            conductorId: ''
          }
        }
      } catch (error) {
        console.error('分配线路失败:', error)
        ElMessage.error('线路分配失败,请重试')
      }
    }
    const removeBusRoute = async (busId) => {
      try {
        const success = await store.dispatch('removeBusRoute', busId)
        if (success) {
          ElMessage.success('线路取消成功!')
        }
      } catch (error) {
        console.error('取消线路失败:', error)
        ElMessage.error('线路取消失败,请重试')
      }
    }
    const refuelBus = (busId) => {
      store.dispatch('refuelBus', busId)
    }
    const chargeBus = (busId) => {
      store.dispatch('chargeBus', busId)
    }
    const cleanBus = (busId) => {
      store.dispatch('cleanBus', busId)
    }
    return {
      coaches,
      assignForm,
      availableDrivers,
      availableConductors,
      getBusModel,
      getBusCanOperate,
      getRouteName,
      getCurrentStop,
      getNextStop,
      getBusStatusText,
      getAvailableRoutes,
      getDriverName,
      getConductorName,
      canAssignBus,
      assignBusRoute,
      removeBusRoute,
      refuelBus,
      chargeBus,
      cleanBus
    }
  }
}
</script>
<style scoped>
.coach-status {
  width: 100%;
  padding: 0 10px;
  box-sizing: border-box;
}
.coach-status h3 {
  margin: 0 0 25px 0;
  color: #333;
  font-size: 24px;
  text-align: center;
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
  width: 100%;
  justify-content: center;
  box-sizing: border-box;
}
.coach-card {
  background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%);
  border-radius: 15px;
  padding: 20px;
  box-shadow: 0 4px 15px rgba(30, 60, 114, 0.3);
  width: 100%;
  box-sizing: border-box;
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
  text-align: left;
  margin: 0;
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
  background: rgba(255, 255, 255, 0.2);
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
.route-operation {
  margin: 15px 0;
  padding: 12px;
  background: white;
  border-radius: 10px;
}
.assign-form {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}
.select-input {
  padding: 8px 10px;
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  font-size: 12px;
  min-width: 100px;
}
.select-input.full-width {
  flex: 1;
  min-width: 150px;
}
.assign-btn {
  padding: 8px 16px;
  border: none;
  border-radius: 6px;
  background: linear-gradient(135deg, #4caf50 0%, #66bb6a 100%);
  color: white;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
}
.assign-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 10px rgba(76, 175, 80, 0.3);
}
.assign-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.remove-section {
  display: flex;
  justify-content: center;
}
.remove-btn {
  padding: 8px 20px;
  border: none;
  border-radius: 6px;
  background: linear-gradient(135deg, #f5576c 0%, #e53e52 100%);
  color: white;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s ease;
  width: 100%;
}
.remove-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 10px rgba(245, 87, 108, 0.3);
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
  background: rgba(255, 255, 255, 0.2);
  color: #fff;
}
.upgrade-tag.active {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
  color: white;
}

.traffic-light-warning {
  padding: 6px 12px;
  border-radius: 6px;
  margin: 8px 0;
  font-weight: bold;
  text-align: center;
}
.traffic-light-warning.coach {
  background: #e3f2fd;
  color: #1565c0;
}
.toll-gate-warning {
  background: #e8f5e9;
  color: #2e7d32;
  padding: 6px 12px;
  border-radius: 6px;
  margin: 8px 0;
  font-weight: bold;
  text-align: center;
}

@media screen and (max-width: 400px) {
  .coach-list {
    grid-template-columns: 1fr;
    padding: 0 5px;
  }
  .coach-card {
    padding: 15px;
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
  .assign-form {
    flex-direction: column;
    width: 100%;
  }
  .select-input {
    width: 100%;
  }
  .assign-btn {
    width: 100%;
  }
}
</style>