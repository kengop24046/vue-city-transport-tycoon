<template>
  <div class="routes">
    <h2>线路管理</h2>
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
              已开通 ({{ getRouteVehicles(route.id).length }}台车辆运营中)
            </span>
            <button
              v-else
              class="create-btn"
              :disabled="!canCreateRoute(route) || createRouteLoading[route.id]"
              @click="createRoute(route)"
            >
              {{ createRouteLoading[route.id] ? '开通中...' : '开通线路' }}
            </button>
            <button
              v-if="isRouteActive(route.id)"
              class="assign-btn"
              @click="openAssignModal(route)"
            >
              车辆分配
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
            <span class="vehicle-count">运营车辆：{{ getRouteVehicles(routeId).length }}台</span>
          </div>
          <span class="route-type">{{ getRouteTypeIcon(routeId) }}</span>
        </div>
      </div>
    </div>

    <div v-if="showAssignModal" class="modal-mask" @click="closeAssignModal">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>车辆分配 - {{ currentAssignRoute?.name }}</h3>
          <button class="close-btn" @click="closeAssignModal">×</button>
        </div>

        <div class="modal-body">
          <div class="assigned-section">
            <h4>已分配车辆 ({{ assignedVehicles.length }}台)</h4>
            <div v-if="assignedVehicles.length === 0" class="empty-tip">
              暂无分配车辆
            </div>
            <div v-else class="vehicle-list">
              <div v-for="bus in assignedVehicles" :key="bus.id" class="vehicle-item">
                <span class="vehicle-name">{{ getBusModel(bus.modelId)?.name }}</span>
                <span class="vehicle-staff">
                  司机：{{ getDriverName(bus.driverId) }}
                  <span v-if="bus.conductorId"> | 售票员：{{ getConductorName(bus.conductorId) }}</span>
                </span>
                <button class="remove-btn" @click="removeVehicleFromRoute(bus.id)">
                  移除
                </button>
              </div>
            </div>
          </div>

          <div class="available-section">
            <h4>可分配车辆</h4>
            <div v-if="availableVehicles.length === 0" class="empty-tip">
              暂无可用{{ currentTab === 'bus' ? '城市巴士' : '长途巴士' }}，请先购买车辆
            </div>
            <div v-else class="vehicle-list">
              <div v-for="bus in availableVehicles" :key="bus.id" class="vehicle-item">
                <span class="vehicle-name">{{ getBusModel(bus.modelId)?.name }}</span>
                <div class="assign-form">
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
                  <select
                    v-if="currentTab === 'coach'"
                    v-model="assignForm[bus.id].conductorId"
                    class="select-input"
                  >
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
                    class="add-btn"
                    :disabled="!canAssign(bus.id)"
                    @click="assignVehicleToRoute(bus.id)"
                  >
                    分配
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { computed, ref, reactive } from 'vue'
import { useStore } from 'vuex'
import { ElMessage } from 'element-plus'
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
    const showAssignModal = ref(false)
    const currentAssignRoute = ref(null)
    const assignForm = reactive({})
    const createRouteLoading = ref({})
    const companyLevel = computed(() => store.state.companyLevel)
    const unlockedCities = computed(() => store.state.unlockedCities)
    const activeRoutes = computed(() => store.state.activeRoutes)
    const buses = computed(() => store.state.buses)
    const planes = computed(() => store.state.planes)
    const metros = computed(() => store.state.metros)
    const highSpeedRails = computed(() => store.state.highSpeedRails)
    const employees = computed(() => store.state.employees)

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

    const getRouteVehicles = (routeId) => {
      return store.getters.getRouteVehicles(routeId)
    }

    const assignedVehicles = computed(() => {
      if (!currentAssignRoute.value) return []
      return getRouteVehicles(currentAssignRoute.value.id)
    })


    const availableVehicles = computed(() => {
      const busType = currentTab.value === 'bus' ? 'city' : 'coach'
      return buses.value.filter(b => b.busType === busType && !b.routeId)
    })

    const availableDrivers = computed(() => {
      return store.getters.availableBusDrivers
    })

    const availableConductors = computed(() => {
      return store.getters.availableConductors
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
      return icons[route?.type] || '🚗'
    }

    const getRouteStartEnd = (route) => {
      if (!route) return ''
      if ((route.type === 'bus' || route.type === 'coach') && route.stops?.outbound?.length) {
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
      return true
    }

    const createRoute = async (route) => {
      if (!canCreateRoute(route)) {
        ElMessage.warning(`无法开通${route.name}：线路已开通或公司等级不足（当前${companyLevel.value}级，需要${route.requiredLevel}级）`)
        return
      }

      if (createRouteLoading.value[route.id]) return
      createRouteLoading.value[route.id] = true

      try {
        const result = await store.dispatch('createRoute', route)
        if (result) {
          ElMessage.success(`成功开通${route.name}线路！`)
        } else {
          ElMessage.error(`开通${route.name}失败：系统错误，请重试`)
        }
      } catch (error) {
        console.error('开通线路失败：', error)
        ElMessage.error(`开通${route.name}失败：${error.message || '未知错误'}`)
      } finally {
        createRouteLoading.value[route.id] = false
      }
    }

    const openAssignModal = (route) => {
      currentAssignRoute.value = route
      showAssignModal.value = true
      availableVehicles.value.forEach(bus => {
        assignForm[bus.id] = {
          driverId: '',
          conductorId: ''
        }
      })
    }

    const closeAssignModal = () => {
      showAssignModal.value = false
      currentAssignRoute.value = null
    }

    const getBusModel = (modelId) => {
      return store.getters.getBusModel(modelId)
    }

    const getDriverName = (driverId) => {
      const driver = employees.value.busDrivers.find(d => d.id === driverId)
      return driver?.name || '未知司机'
    }

    const getConductorName = (conductorId) => {
      const conductor = employees.value.conductors.find(c => c.id === conductorId)
      return conductor?.name || '未知售票员'
    }

    const canAssign = (busId) => {
      const form = assignForm[busId]
      if (!form?.driverId) return false
      if (currentTab.value === 'coach' && !form?.conductorId) return false
      return true
    }

    const assignVehicleToRoute = async (busId) => {
      if (!currentAssignRoute.value) return

      const form = assignForm[busId]
      if (!canAssign(busId)) {
        ElMessage.warning('请选择完整的司机/售票员信息')
        return
      }

      try {
        await store.dispatch('assignBusRoute', {
          busId,
          routeId: currentAssignRoute.value.id,
          driverId: form.driverId,
          conductorId: form.conductorId || null
        })
        ElMessage.success('车辆分配成功！')
        assignForm[busId] = {
          driverId: '',
          conductorId: ''
        }
      } catch (error) {
        console.error('分配车辆失败：', error)
        ElMessage.error('车辆分配失败，请重试')
      }
    }

    const removeVehicleFromRoute = async (busId) => {
      try {
        await store.dispatch('removeBusRoute', busId)
        ElMessage.success('车辆移除成功！')
      } catch (error) {
        console.error('移除车辆失败：', error)
        ElMessage.error('车辆移除失败，请重试')
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
      showAssignModal,
      assignedVehicles,
      availableVehicles,
      availableDrivers,
      availableConductors,
      getRouteStops,
      isRouteActive,
      getRouteInfo,
      getRouteTypeIcon,
      getRouteStartEnd,
      canCreateRoute,
      createRoute,
      getRouteVehicles,
      openAssignModal,
      closeAssignModal,
      getBusModel,
      getDriverName,
      getConductorName,
      canAssign,
      assignVehicleToRoute,
      removeVehicleFromRoute,
      createRouteLoading
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
  flex-wrap: wrap;
  gap: 10px;
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

.assign-btn {
  padding: 10px 16px;
  border: none;
  border-radius: 10px;
  background: linear-gradient(135deg, #4caf50 0%, #66bb6a 100%);
  color: white;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.assign-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 15px rgba(76, 175, 80, 0.4);
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
  min-width: 280px;
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

.vehicle-count {
  font-size: 11px;
  opacity: 0.85;
  line-height: 1;
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

.modal-mask {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
}

.modal-content {
  background: white;
  border-radius: 15px;
  width: 100%;
  max-width: 800px;
  max-height: 80vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid #eee;
}

.modal-header h3 {
  margin: 0;
  color: #333;
  font-size: 18px;
}

.close-btn {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  border: none;
  background: #f5f5f5;
  font-size: 20px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #666;
  transition: all 0.3s ease;
}

.close-btn:hover {
  background: #eee;
}

.modal-body {
  padding: 20px;
  overflow-y: auto;
  flex: 1;
}

.modal-body h4 {
  margin: 0 0 15px 0;
  color: #333;
  font-size: 16px;
}

.empty-tip {
  color: #888;
  font-size: 14px;
  padding: 10px 0;
}

.vehicle-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 25px;
}

.vehicle-item {
  background: #f5f7fa;
  border-radius: 10px;
  padding: 12px 15px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
}

.vehicle-name {
  font-weight: 500;
  color: #333;
  min-width: 120px;
}

.vehicle-staff {
  font-size: 12px;
  color: #666;
  flex: 1;
}

.assign-form {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.select-input {
  padding: 6px 10px;
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  font-size: 12px;
  min-width: 100px;
}

.add-btn {
  padding: 6px 12px;
  border: none;
  border-radius: 6px;
  background: #4caf50;
  color: white;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.add-btn:hover:not(:disabled) {
  background: #43a047;
}

.add-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.remove-btn {
  padding: 6px 12px;
  border: none;
  border-radius: 6px;
  background: #f5576c;
  color: white;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.remove-btn:hover {
  background: #e53e52;
}

@media screen and (max-width: 400px) {
  .route-list {
    grid-template-columns: 1fr;
  }
  .active-item {
    min-width: 100%;
  }
  .vehicle-item {
    flex-direction: column;
    align-items: flex-start;
  }
  .assign-form {
    width: 100%;
  }
  .select-input {
    flex: 1;
    min-width: 80px;
  }
}
</style>