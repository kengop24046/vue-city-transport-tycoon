<template>
<div class="routes">
  <h2>🛣️ 线路管理</h2>
  <div class="route-tabs">
    <button
      v-for="tab in tabs"
      :key="tab.id"
      :class="{ active: currentTab === tab.id, locked: tab.locked }"
      @click="!tab.locked && (currentTab = tab.id)"
    >
      {{ tab.icon }} {{ tab.name }}
      <span v-if="tab.locked" class="lock-icon">🔒</span>
    </button>
  </div>

  <div class="city-selector">
    <h3>选择城市</h3>
    <div class="city-buttons">
      <button
        v-for="city in availableCities"
        :key="city.id"
        :class="{ active: selectedCity === city.id }"
        @click="selectedCity = city.id"
      >
        {{ city.name }}
      </button>
    </div>
  </div>

  <div class="routes-content">
    <div v-if="availableRoutes.length === 0" class="empty-state">
      <p>该城市暂无可用线路</p>
    </div>

    <div v-else class="route-list">
      <div v-for="route in availableRoutes" :key="route.id" class="route-card">
        <div class="route-header">
          <h4>{{ route.name }}</h4>
          <span class="route-fare">💴 ¥{{ route.fare }}</span>
        </div>

        <div class="route-start-end" v-if="getRouteStartEnd(route)">
          <span class="start-end-text">{{ getRouteStartEnd(route) }}</span>
        </div>

        <div class="route-stops">
          <div class="stop-list">
            <span
              v-for="(stop, index) in getRouteStops(route)"
              :key="index"
              class="stop-tag"
            >
              {{ stop }}
            </span>
          </div>
        </div>

        <div class="route-footer">
          <span v-if="route.requiredLevel > companyLevel" class="level-requirement">
            需要 {{ route.requiredLevel }} 级
          </span>
          <span v-else-if="isRouteActive(route.id)" class="active-status">
            已开通
          </span>
          <button
            v-else
            class="create-btn"
            :disabled="!canCreateRoute(route)"
            @click="createRoute(route)"
          >
            开通线路
          </button>
        </div>
      </div>
    </div>
  </div>

  <div class="active-routes">
    <h3>已开通线路</h3>
    <div v-if="activeRoutesList.length === 0" class="empty-state">
      <p>暂无已开通线路</p>
    </div>
    <div v-else class="active-list">
      <div
        v-for="routeId in activeRoutesList"
        :key="routeId"
        class="active-item"
        :class="`type-${getRouteInfo(routeId)?.type || 'default'}`"
      >
        <div class="route-main">
          <span class="route-name">{{ getRouteInfo(routeId)?.name || routeId }}</span>
          <span class="route-start-end" v-if="getRouteInfo(routeId)">
            {{ getRouteStartEnd(getRouteInfo(routeId)) }}
          </span>
        </div>
        <span class="route-type">{{ getRouteTypeIcon(routeId) }}</span>
      </div>
    </div>
  </div>
</div>
</template>

<script>
import { computed, ref } from 'vue'
import { useStore } from 'vuex'
import macauRoutes from '../data/macauRoutes'
import hongkongRoutes from '../data/hongkongRoutes'
import zhuhaiRoutes from '../data/zhuhaiRoutes'
import guangzhouRoutes from '../data/guangzhouRoutes'
import shenzhenRoutes from '../data/shenzhenRoutes'
import beijingRoutes from '../data/beijingRoutes'
import shanghaiRoutes from '../data/shanghaiRoutes'

export default {
  name: 'RouteManagement',
  setup() {
    const store = useStore()
    const currentTab = ref('bus')
    const selectedCity = ref('macau')

    const companyLevel = computed(() => store.state.companyLevel)
    const unlockedCities = computed(() => store.state.unlockedCities)
    const activeRoutes = computed(() => store.state.activeRoutes)
    const buses = computed(() => store.state.buses)
    const planes = computed(() => store.state.planes)
    const metros = computed(() => store.state.metros)
    const highSpeedRails = computed(() => store.state.highSpeedRails)

    const tabs = computed(() => [
      { id: 'bus', name: '城市巴士', icon: '🚌', locked: false },
      { id: 'coach', name: '长途巴士', icon: '🚍', locked: false },
      { id: 'plane', name: '飞机航线', icon: '✈️', locked: companyLevel.value < 6 },
      { id: 'metro', name: '地铁线路', icon: '🚇', locked: companyLevel.value < 10 },
      { id: 'hsr', name: '高铁线路', icon: '🚄', locked: companyLevel.value < 20 }
    ])

    const allRoutes = {
      macau: macauRoutes,
      hongkong: hongkongRoutes,
      zhuhai: zhuhaiRoutes,
      guangzhou: guangzhouRoutes,
      shenzhen: shenzhenRoutes,
      beijing: beijingRoutes,
      shanghai: shanghaiRoutes
    }

    const availableCities = computed(() => {
      return unlockedCities.value.map(cityId => {
        const cityInfo = store.getters.getCityInfo(cityId)
        return cityInfo || { id: cityId, name: cityId }
      })
    })

    const availableRoutes = computed(() => {
      const cityRoutes = allRoutes[selectedCity.value] || []
      return cityRoutes.filter(route => route.type === currentTab.value)
    })

    const activeRoutesList = computed(() => {
      return activeRoutes.value[currentTab.value] || []
    })

    const getRouteStops = (route) => {
      if (route.type === 'plane') return route.points
      if (route.stops?.outbound) return route.stops.outbound
      return route.stops || []
    }

    const isRouteActive = (routeId) => {
      return activeRoutesList.value.includes(routeId)
    }

    const getRouteInfo = (routeId) => {
      return store.getters.getRoute(routeId)
    }

    const getRouteTypeIcon = (routeId) => {
      const route = getRouteInfo(routeId)
      const icons = {
        bus: '🚌',
        coach: '🚍',
        plane: '✈️',
        metro: '🚇',
        hsr: '🚄'
      }
      return icons[route?.type] || '🛣️'
    }

    const getRouteStartEnd = (route) => {
      if (!route) return ''
      if (route.type === 'bus' || route.type === 'coach' && route.stops?.outbound?.length) {
        const start = route.stops.outbound[0]
        const end = route.stops.outbound[route.stops.outbound.length - 1]
        return `${start} ↔ ${end}`
      }
      if (route.type === 'plane' && route.points?.length) {
        const start = route.points[0]
        const end = route.points[route.points.length - 1]
        return `${start} ↔ ${end}`
      }
      if ((route.type === 'metro' || route.type === 'hsr') && route.stops?.length) {
        const start = route.stops[0]
        const end = route.stops[route.stops.length - 1]
        return `${start} ↔ ${end}`
      }
      return ''
    }

    const canCreateRoute = (route) => {
      if (route.requiredLevel > companyLevel.value) return false
      if (isRouteActive(route.id)) return false

      if (route.type === 'bus') {
        const hasIdleBus = buses.value.find(b => !b.routeId && b.busType === 'city')
        const hasAvailableDriver = store.getters.availableBusDrivers
        return hasIdleBus && hasAvailableDriver
      }

      if (route.type === 'coach') {
        const hasIdleCoach = buses.value.find(b => !b.routeId && b.busType === 'coach')
        const hasAvailableDriver = store.getters.availableCoachDrivers
        return hasIdleCoach && hasAvailableDriver
      }

      if (route.type === 'plane') {
        if (companyLevel.value < 6) return false
        const hasIdlePlane = planes.value.find(p => !p.routeId)
        const hasAvailablePilots = store.getters.availablePilots
        const hasAvailableAttendants = store.getters.availableFlightAttendants
        return hasIdlePlane && hasAvailablePilots && hasAvailableAttendants
      }

      if (route.type === 'metro') {
        if (companyLevel.value < 10) return false
        const hasIdleMetro = metros.value.find(m => !m.routeId)
        const hasAvailableDriver = store.getters.availableMetroDrivers
        return hasIdleMetro && hasAvailableDriver
      }

      if (route.type === 'hsr') {
        if (companyLevel.value < 20) return false
        const hasIdleHSR = highSpeedRails.value.find(h => !h.routeId)
        const hasAvailableDriver = store.getters.availableHSRDrivers
        return hasIdleHSR && hasAvailableDriver
      }

      return false
    }

    const createRoute = (route) => {
      if (!canCreateRoute(route)) return
      store.commit('ADD_ROUTE', { type: currentTab.value, routeId: route.id })
      
      if (route.type === 'bus') {
        const idleBus = buses.value.find(b => !b.routeId && b.busType === 'city')
        if (idleBus) {
          store.commit('UPDATE_BUS', {
            id: idleBus.id,
            updates: {
              routeId: route.id,
              status: 'running',
              currentStopIndex: 0,
              progress: 0,
              direction: 'outbound'
            }
          })
        }
      }

      if (route.type === 'coach') {
        const idleCoach = buses.value.find(b => !b.routeId && b.busType === 'coach')
        if (idleCoach) {
          store.commit('UPDATE_BUS', {
            id: idleCoach.id,
            updates: {
              routeId: route.id,
              status: 'running',
              currentStopIndex: 0,
              progress: 0,
              direction: 'outbound'
            }
          })
        }
      }

      if (route.type === 'plane') {
        const idlePlane = planes.value.find(p => !p.routeId)
        if (idlePlane) {
          store.commit('UPDATE_PLANE', {
            id: idlePlane.id,
            updates: {
              routeId: route.id,
              status: 'running',
              currentPointIndex: 0,
              progress: 0
            }
          })
        }
      }

      if (route.type === 'metro') {
        const idleMetro = metros.value.find(m => !m.routeId)
        if (idleMetro) {
          store.commit('UPDATE_METRO', {
            id: idleMetro.id,
            updates: {
              routeId: route.id,
              status: 'running',
              currentStopIndex: 0,
              progress: 0
            }
          })
        }
      }

      if (route.type === 'hsr') {
        const idleHSR = highSpeedRails.value.find(h => !h.routeId)
        if (idleHSR) {
          store.commit('UPDATE_HIGH_SPEED_RAIL', {
            id: idleHSR.id,
            updates: {
              routeId: route.id,
              status: 'running',
              currentStopIndex: 0,
              progress: 0
            }
          })
        }
      }
    }

    return {
      currentTab,
      selectedCity,
      tabs,
      companyLevel,
      availableCities,
      availableRoutes,
      activeRoutesList,
      getRouteStops,
      isRouteActive,
      getRouteInfo,
      getRouteTypeIcon,
      getRouteStartEnd,
      canCreateRoute,
      createRoute
    }
  }
}
</script>

<style scoped>
.routes h2 {
  margin: 0 0 25px 0;
  color: #333;
  font-size: 24px;
}

.route-tabs {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 25px;
}

.route-tabs button {
  padding: 12px 24px;
  border: 2px solid #e0e0e0;
  border-radius: 12px;
  background: white;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 5px;
}

.route-tabs button:hover:not(.locked) {
  border-color: #667eea;
  transform: translateY(-2px);
}

.route-tabs button.active {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-color: transparent;
}

.route-tabs button.locked {
  opacity: 0.5;
  cursor: not-allowed;
}

.lock-icon {
  font-size: 12px;
}

.city-selector {
  margin-bottom: 25px;
}

.city-selector h3 {
  margin: 0 0 15px 0;
  color: #333;
  font-size: 18px;
}

.city-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.city-buttons button {
  padding: 10px 20px;
  border: 2px solid #e0e0e0;
  border-radius: 10px;
  background: white;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.city-buttons button:hover {
  border-color: #667eea;
}

.city-buttons button.active {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-color: transparent;
}

.routes-content {
  margin-bottom: 30px;
}

.empty-state {
  text-align: center;
  padding: 40px 20px;
  color: #888;
}

.route-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 20px;
}

.route-card {
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  border-radius: 15px;
  padding: 20px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
}

.route-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 8px;
}

.route-header h4 {
  margin: 0;
  color: #333;
  font-size: 18px;
}

.route-fare {
  font-size: 18px;
  font-weight: bold;
  color: #667eea;
}

.route-start-end {
  margin-bottom: 15px;
}

.start-end-text {
  font-size: 13px;
  color: #667eea;
  font-weight: 500;
}

.route-stops {
  margin-bottom: 15px;
}

.stop-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.stop-tag {
  padding: 4px 10px;
  background: white;
  border-radius: 12px;
  font-size: 11px;
  color: #555;
}

.route-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.level-requirement {
  color: #ff9800;
  font-size: 14px;
}

.active-status {
  color: #4caf50;
  font-size: 14px;
  font-weight: 500;
}

.create-btn {
  padding: 10px 20px;
  border: none;
  border-radius: 10px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.create-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
}

.create-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.active-routes h3 {
  margin: 0 0 15px 0;
  color: #333;
  font-size: 18px;
}

.active-list {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.active-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 15px;
  padding: 12px 18px;
  background: #4caf50;
  color: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(76, 175, 80, 0.3);
  transition: all 0.3s ease;
  min-width: 240px;
}

.active-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(76, 175, 80, 0.4);
}

.route-main {
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex: 1;
  min-width: 0;
}

.route-name {
  font-size: 14px;
  font-weight: 500;
  line-height: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.route-start-end {
  font-size: 12px;
  opacity: 0.9;
  line-height: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.route-type {
  font-size: 20px;
  flex-shrink: 0;
}

.active-item.type-bus {
  background: linear-gradient(135deg, #4caf50 0%, #66bb6a 100%);
}

.active-item.type-coach {
  background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%);
}

.active-item.type-plane {
  background: linear-gradient(135deg, #1fa2ff 0%, #12d8fa 100%);
}

.active-item.type-metro {
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
}

.active-item.type-hsr {
  background: linear-gradient(135deg, #d31027 0%, #ea384d 100%);
}
</style>