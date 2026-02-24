<template>
<div class="bus-status">
  <h2>🚌 车辆运行状况</h2>
  <div v-if="buses.length === 0" class="empty-state">
    <p>暂无城市巴士,快去商店购买吧!</p>
  </div>
  <div v-else class="bus-list">
    <div v-for="bus in buses" :key="bus.id" class="bus-card">
      <div class="bus-header">
        <h3>{{ getBusModel(bus.modelId)?.name || '未知车型' }}</h3>
        <span class="status-badge" :class="bus.status">
          {{ getBusStatusText(bus) }}
        </span>
      </div>

      <div class="bus-info">
        <div class="info-row">
          <span class="info-label">🗺️ 线路</span>
          <span class="info-value">{{ getRouteName(bus.routeId) }}</span>
        </div>
        <div class="info-row" v-if="bus.driverId">
          <span class="info-label">👨‍✈️ 司机</span>
          <span class="info-value">{{ getDriverName(bus.driverId) }}</span>
        </div>
        <div class="info-row" v-if="bus.conductorId">
          <span class="info-label"> 💁 售票员</span>
          <span class="info-value">{{ getConductorName(bus.conductorId) }}</span>
        </div>
        <div class="info-row" v-if="bus.status === 'stopped'">
          <span class="info-label">📍 已到站</span>
          <span class="info-value arrived">
            {{ getCurrentStop(bus) }}
            <span v-if="bus.isAtTerminal" class="terminal-tag">🏁 总站</span>
          </span>
        </div>
        <div class="info-row" v-if="bus.routeId">
          <span class="info-label">🏁 下一站</span>
          <span class="info-value">{{ getNextStop(bus) }}</span>
        </div>
        <div class="info-row" v-if="bus.status === 'stopped'">
          <span class="info-label">⏱️ 发车倒计时</span>
          <span class="info-value countdown" :class="{terminal: bus.isAtTerminal}">
            {{ bus.stopCountdown }} 秒
            <span v-if="bus.isAtTerminal" class="terminal-hint">(总站停靠)</span>
          </span>
        </div>
        <div class="info-row">
          <span class="info-label">👥 乘客</span>
          <span class="info-value">
            {{ bus.passengers }} / {{ getBusModel(bus.modelId)?.capacity || 0 }}
          </span>
        </div>
        <div class="progress-section" v-if="bus.routeId">
          <div class="progress-label">
            <span>📈 到下一站进度</span>
            <span>{{ Math.floor(bus.progress || 0) }}%</span>
          </div>
          <div class="progress-bar">
            <div class="progress-fill" :style="{ width: `${bus.progress || 0}%` }">
            </div>
          </div>
        </div>
      </div>

      <div class="resource-bars">
        <div class="resource-bar" v-if="bus.powerType === 'electric'">
          <span class="resource-label">🔋 电量</span>
          <div class="bar-container">
            <div class="bar-fill battery" :style="{ width: `${bus.battery || 0}%` }">
            </div>
          </div>
          <span class="resource-value">{{ Math.floor(bus.battery || 0) }}%</span>
          <button
            v-if="getBusCanOperate(bus)"
            class="action-btn charge"
            @click="chargeBus(bus.id)"
          >
            充电
          </button>
          <span v-else-if="bus.needsCharge" class="hint-text">🔌 需到总站充电</span>
        </div>

        <div class="resource-bar" v-else-if="bus.powerType === 'fuel'">
          <span class="resource-label"> 油量</span>
          <div class="bar-container">
            <div class="bar-fill fuel" :style="{ width: `${bus.fuel || 0}%` }"></div>
          </div>
          <span class="resource-value">{{ Math.floor(bus.fuel || 0) }}%</span>
          <button 
            v-if="getBusCanOperate(bus)"
            class="action-btn refuel"
            @click="refuelBus(bus.id)"
          >
            加油
          </button>
          <span v-else-if="bus.needsRefuel" class="hint-text">需到总站加油</span>
        </div>

        <div class="resource-bar">
          <span class="resource-label">🧹 清洁度</span>
          <div class="bar-container">
            <div class="bar-fill cleanliness" :style="{ width: `${bus.cleanliness || 0}%` }"></div>
          </div>
          <span class="resource-value">{{ Math.floor(bus.cleanliness || 0) }}%</span>
          <button 
            v-if="getBusCanOperate(bus)"
            class="action-btn clean"
            @click="cleanBus(bus.id)"
          >
            清洁
          </button>
          <span v-else-if="bus.needsCleaning" class="hint-text">需到总站清洁</span>
        </div>
      </div>

      <div class="route-operation">
        <div v-if="!bus.routeId" class="assign-section">
          <div class="assign-form">
            <select v-model="assignForm[bus.id].routeId" class="select-input full-width">
              <option value="">选择要分配的线路</option>
              <option
                v-for="route in getAvailableRoutes(bus.busType)"
                :key="route.id"
                :value="route.id"
              >
                {{ route.name }}
              </option>
            </select>
            <select v-model="assignForm[bus.id].driverId" class="select-input">
              <option value="">选择司机</option>
              <option
                v-for="driver in availableDrivers"
                :key="driver.id"
                :value="driver.id"
              >
                {{ driver.name }}
              </option>
            </select>
            <button
              class="assign-btn"
              :disabled="!canAssignBus(bus.id)"
              @click="assignBusRoute(bus.id)"
            >
              分配线路
            </button>
          </div>
        </div>
        <div v-else class="remove-section">
          <button class="remove-btn" @click="removeBusRoute(bus.id)">
            移除线路
          </button>
        </div>
      </div>

      <div class="bus-upgrades">
        <span class="upgrade-tag disabled">娱乐系统</span>
        <span class="upgrade-tag disabled">WiFi</span>
      </div>
    </div>
  </div>
</div>
</template>

<script>
import { computed, reactive, watch } from 'vue'
import { useStore } from 'vuex'

export default {
  name: 'BusStatus',
  setup() {
    const store = useStore()
    const assignForm = reactive({})
    const buses = computed(() => store.state.buses.filter(bus => bus.busType === 'city'))
    const activeRoutes = computed(() => store.state.activeRoutes)
    const employees = computed(() => store.state.employees)

    const availableDrivers = computed(() => {
      return store.getters.availableBusDrivers
    })

    const availableConductors = computed(() => {
      return store.getters.availableConductors
    })

    const getAvailableRoutes = (busType) => {
      const routeType = busType === 'city' ? 'bus' : 'coach'
      const routeIds = activeRoutes.value[routeType] || []
      return routeIds.map(id => store.getters.getRoute(id)).filter(Boolean)
    }

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

    const getCurrentStop = (bus) => {
      if (!bus.routeId) return '-'
      const route = getRoute(bus.routeId)
      if (!route) return '-'
      const stops = bus.direction === 'outbound' ? route.stops.outbound : route.stops.inbound
      return stops[bus.currentStopIndex] || '-'
    }

    const getNextStop = (bus) => {
      if (!bus.routeId) return '-'
      const route = getRoute(bus.routeId)
      if (!route) return '-'
      const currentStops = bus.direction === 'outbound' ? route.stops.outbound : route.stops.inbound
      const currentIndex = bus.currentStopIndex

      switch (bus.status) {
        case 'running':
          return currentStops[currentIndex] || '-'
        case 'stopped': {
          const nextIndex = currentIndex + 1
          if (nextIndex < currentStops.length) {
            return currentStops[nextIndex] || '-'
          }
          const reverseDirection = bus.direction === 'outbound' ? 'inbound' : 'outbound'
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

    const refuelBus = (busId) => {
      store.dispatch('refuelBus', busId)
    }

    const chargeBus = (busId) => {
      store.dispatch('chargeBus', busId)
    }

    const cleanBus = (busId) => {
      store.dispatch('cleanBus', busId)
    }

    const canAssignBus = (busId) => {
      const form = assignForm[busId]
      return !!form?.routeId && !!form?.driverId
    }

    const assignBusRoute = (busId) => {
      const form = assignForm[busId]
      store.dispatch('assignBusRoute', {
        busId,
        routeId: form.routeId,
        driverId: form.driverId,
        conductorId: null
      }).then(success => {
        if (success) {
          assignForm[busId] = {
            routeId: '',
            driverId: ''
          }
        }
      })
    }

    const removeBusRoute = (busId) => {
      store.dispatch('removeBusRoute', busId)
    }

    watch(buses, (newBuses) => {
      newBuses.forEach(bus => {
        if (!assignForm[bus.id]) {
          assignForm[bus.id] = {
            routeId: '',
            driverId: ''
          }
        }
      })
    }, { immediate: true })

    return {
      buses,
      availableDrivers,
      availableConductors,
      getBusModel,
      getBusCanOperate,
      getRouteName,
      getCurrentStop,
      getNextStop,
      getBusStatusText,
      refuelBus,
      chargeBus,
      cleanBus,
      getAvailableRoutes,
      getDriverName,
      getConductorName,
      assignForm,
      canAssignBus,
      assignBusRoute,
      removeBusRoute
    }
  }
}
</script>

<style scoped>
.bus-status {
  width: 100%;
  padding: 0 10px;
  box-sizing: border-box;
}
.bus-status h2 {
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

.bus-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(380px, 1fr));
  gap: 20px;
  width: 100%;
  justify-content: center;
  box-sizing: border-box;
}

.bus-card {
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  border-radius: 15px;
  padding: 20px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
  width: 100%;
  box-sizing: border-box;
}

.bus-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.bus-header h3 {
  margin: 0;
  color: #333;
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

.bus-info {
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
  color: #d32f2f;
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
  color: #333;
  width: 40px;
  text-align: right;
  flex-shrink: 0;
}

.hint-text {
  font-size: 11px;
  color: #f5576c;
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

.bus-upgrades {
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

.upgrade-tag.disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.upgrade-tag.active {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

@media screen and (max-width: 400px) {
  .bus-list {
    grid-template-columns: 1fr;
    padding: 0 5px;
  }
  .bus-card {
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