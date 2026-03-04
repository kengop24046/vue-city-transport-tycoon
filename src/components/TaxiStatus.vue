<template>
  <div class="taxi-status">
    <h2>🚕 的士运营状况</h2>
    <div v-if="taxis.length === 0" class="empty-state">
      <p>暂无运营的士，快去商店购买吧!</p>
    </div>
    <div v-else class="taxi-list">
      <div v-for="taxi in taxis" :key="taxi.id" class="taxi-card">
        <div class="taxi-header">
          <h3>{{ getTaxiModel(taxi.modelId)?.name || '未知车型' }}</h3>
          <span class="status-badge" :class="getTaxiStatusClass(taxi)">
            {{ getTaxiStatusText(taxi) }}
          </span>
        </div>
        <div class="taxi-info">
          <div class="info-row">
            <span class="info-label">👨‍✈️ 司机</span>
            <span class="info-value">{{ getDriverName(taxi.driverId) || '未分配司机' }}</span>
            <button 
              v-if="!taxi.driverId && availableDrivers.length > 0"
              class="assign-driver-btn"
              @click="openAssignDriverModal(taxi.id)"
            >
              分配司机
            </button>
            <button 
              v-else-if="taxi.driverId"
              class="unassign-driver-btn"
              @click="unassignDriver(taxi.id)"
            >
              解除司机
            </button>
          </div>
          <div class="info-row">
            <span class="info-label">📍 当前位置</span>
            <span class="info-value">{{ taxi.currentRoad || '无' }}</span>
          </div>
          <div class="info-row" v-if="taxi.status === 'hasPassenger'">
            <span class="info-label">🏁 目的地</span>
            <span class="info-value destination">{{ taxi.targetRoad }}</span>
          </div>
          <div class="info-row" v-if="taxi.status === 'hasPassenger'">
            <span class="info-label">💴 本次车费</span>
            <span class="info-value fare">¥{{ taxi.currentFare.toFixed(2) }}</span>
          </div>
          <div class="info-row">
            <span class="info-label">👥 乘客</span>
            <span class="info-value">
              {{ taxi.passengers }} / {{ getTaxiModel(taxi.modelId)?.capacity || 0 }}
            </span>
          </div>
          <div class="progress-section" v-if="taxi.status === 'hasPassenger'">
            <div class="progress-label">
              <span>📈 到目的地进度</span>
              <span>{{ Math.floor(taxi.progress || 0) }}%</span>
            </div>
            <div class="progress-bar">
              <div class="progress-fill" :style="{ width: `${taxi.progress || 0}%` }"></div>
            </div>
          </div>

          <div v-if="isTaxiWaitingTrafficLight" class="traffic-light-warning">
            🚖 正在等红绿灯：{{ taxiTrafficLightTimer }} 秒
          </div>
        </div>
        <div class="resource-bars">
          <div class="resource-bar" v-if="taxi.powerType === 'electric'">
            <span class="resource-label">🔋 电量</span>
            <div class="bar-container">
              <div class="bar-fill battery" :style="{ width: `${taxi.battery || 0}%` }"></div>
            </div>
            <span class="resource-value">{{ Math.floor(taxi.battery || 0) }}%</span>
            <button
              v-if="getTaxiCanOperate(taxi)"
              class="action-btn charge"
              @click="chargeTaxi(taxi.id)"
            >
              充电
            </button>
            <span v-else-if="taxi.needsCharge" class="hint-text">🔌 电量不足</span>
          </div>
          <div class="resource-bar" v-else-if="taxi.powerType === 'fuel'">
            <span class="resource-label">⛽ 油量</span>
            <div class="bar-container">
              <div class="bar-fill fuel" :style="{ width: `${taxi.fuel || 0}%` }"></div>
            </div>
            <span class="resource-value">{{ Math.floor(taxi.fuel || 0) }}%</span>
            <button
              v-if="getTaxiCanOperate(taxi)"
              class="action-btn refuel"
              @click="refuelTaxi(taxi.id)"
            >
              加油
            </button>
            <span v-else-if="taxi.needsRefuel" class="hint-text">油量不足</span>
          </div>
          <div class="resource-bar">
            <span class="resource-label">🧹 清洁度</span>
            <div class="bar-container">
              <div class="bar-fill cleanliness" :style="{ width: `${taxi.cleanliness || 0}%` }"></div>
            </div>
            <span class="resource-value">{{ Math.floor(taxi.cleanliness || 0) }}%</span>
            <button
              v-if="getTaxiCanOperate(taxi)"
              class="action-btn clean"
              @click="cleanTaxi(taxi.id)"
            >
              清洁
            </button>
            <span v-else-if="taxi.needsCleaning" class="hint-text">需要清洁</span>
          </div>
        </div>
      </div>
    </div>
    <div class="modal-overlay" v-if="showAssignDriverModal" @click="closeAssignDriverModal">
      <div class="assign-driver-modal" @click.stop>
        <div class="modal-header">
          <h3>分配司机</h3>
          <button class="close-btn" @click="closeAssignDriverModal">×</button>
        </div>
        <div class="modal-body">
          <p>请选择要分配给该的士的司机：</p>
          <div v-if="availableDrivers.length === 0" class="no-drivers">
            <p>暂无可用司机（请先雇佣的士司机）</p>
          </div>
          <select 
            v-else 
            v-model="selectedDriverId" 
            class="driver-select"
          >
            <option value="">-- 选择司机 --</option>
            <option 
              v-for="driver in availableDrivers" 
              :key="driver.id" 
              :value="driver.id"
            >
              {{ driver.name }} (等级：{{ driver.level || 1 }})
            </option>
          </select>
        </div>
        <div class="modal-footer">
          <button 
            class="cancel-btn" 
            @click="closeAssignDriverModal"
          >
            取消
          </button>
          <button 
            class="confirm-btn" 
            @click="confirmAssignDriver"
            :disabled="!selectedDriverId"
          >
            确认分配
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
<script>
import { computed, ref } from 'vue'
import { useStore } from 'vuex'
export default {
  name: 'TaxiStatus',
  setup() {
    const store = useStore()
    const taxis = computed(() => store.state.taxis)
    const taxiDrivers = computed(() => store.state.employees.taxiDrivers)
    const showAssignDriverModal = ref(false)
    const selectedDriverId = ref('')
    const currentTaxiId = ref('')

    const isTaxiWaitingTrafficLight = computed(() => store.state.isTaxiWaitingTrafficLight)
    const taxiTrafficLightTimer = computed(() => store.state.taxiTrafficLightTimer)

    const availableDrivers = computed(() => {
      const assignedDriverIds = taxis.value
        .filter(taxi => taxi.driverId)
        .map(taxi => taxi.driverId)
        .filter(id => id !== parseInt(currentTaxiId.value))
      return taxiDrivers.value.filter(driver => {
        return driver.hired && 
               !driver.assignedVehicleId &&
               !assignedDriverIds.includes(driver.id)
      })
    })
    const getTaxiModel = (modelId) => store.getters.getTaxiModel(modelId)
    const getTaxiCanOperate = (taxi) => store.getters.getTaxiCanOperate(taxi)
    
    const getDriverName = (driverId) => {
      if (!driverId) return '未分配'
      const driver = taxiDrivers.value.find(d => d.id === driverId && d.hired)
      return driver?.name || '未分配'
    }
    const getTaxiStatusText = (taxi) => {
      const statusMap = {
        idle: '🚕 空车巡游',
        hasPassenger: '👥 已载客',
        offline: '🛑 未运营'
      }
      return statusMap[taxi.status] || '未知状态'
    }
    const getTaxiStatusClass = (taxi) => {
      if (taxi.status === 'hasPassenger') return 'running'
      if (taxi.status === 'idle') return 'idle'
      return 'offline'
    }
    const refuelTaxi = (taxiId) => store.dispatch('refuelTaxi', taxiId)
    const chargeTaxi = (taxiId) => store.dispatch('chargeTaxi', taxiId)
    const cleanTaxi = (taxiId) => store.dispatch('cleanTaxi', taxiId)
    const openAssignDriverModal = (taxiId) => {
      currentTaxiId.value = taxiId
      selectedDriverId.value = ''
      showAssignDriverModal.value = true
    }
    const closeAssignDriverModal = () => {
      showAssignDriverModal.value = false
      selectedDriverId.value = ''
      currentTaxiId.value = ''
    }
    const confirmAssignDriver = () => {
      if (!currentTaxiId.value || !selectedDriverId.value) return
      store.dispatch('assignTaxiDriver', {
        taxiId: parseInt(currentTaxiId.value),
        driverId: parseInt(selectedDriverId.value)
      })
      closeAssignDriverModal()
    }
    const unassignDriver = (taxiId) => store.dispatch('unassignTaxiDriver', taxiId)

    return {
      taxis,
      isTaxiWaitingTrafficLight,
      taxiTrafficLightTimer,
      getTaxiModel,
      getTaxiCanOperate,
      getDriverName,
      getTaxiStatusText,
      getTaxiStatusClass,
      refuelTaxi,
      chargeTaxi,
      cleanTaxi,
      showAssignDriverModal,
      selectedDriverId,
      availableDrivers,
      openAssignDriverModal,
      closeAssignDriverModal,
      confirmAssignDriver,
      unassignDriver
    }
  }
}
</script>
<style scoped>
.taxi-status h2 {
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
.taxi-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 20px;
}
.taxi-card {
  background: linear-gradient(135deg, #ff9800 0%, #f57c00 100%);
  border-radius: 15px;
  padding: 20px;
  box-shadow: 0 4px 15px rgba(255, 152, 0, 0.3);
}
.taxi-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}
.taxi-header h3 {
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
  background: #2196f3;
  color: white;
}
.status-badge.offline {
  background: #9e9e9e;
  color: white;
}
.taxi-info {
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
.info-value.destination {
  color: #f57c00;
  font-weight: bold;
}
.info-value.fare {
  color: #d32f2f;
  font-weight: bold;
}
.assign-driver-btn {
  padding: 4px 8px;
  border: none;
  border-radius: 4px;
  background: #4caf50;
  color: white;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
}
.assign-driver-btn:hover {
  background: #388e3c;
}
.unassign-driver-btn {
  padding: 4px 8px;
  border: none;
  border-radius: 4px;
  background: #f44336;
  color: white;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
}
.unassign-driver-btn:hover {
  background: #d32f2f;
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
  background: linear-gradient(90deg, #ffeb3b, #ffc107);
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
  background: linear-gradient(135deg, #ffeb3b, #ffc107);
  color: #333;
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
.modal-overlay {
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
}
.assign-driver-modal {
  background: white;
  border-radius: 10px;
  width: 90%;
  max-width: 400px;
  padding: 20px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
}
.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
  padding-bottom: 10px;
  border-bottom: 1px solid #eee;
}
.modal-header h3 {
  margin: 0;
  color: #333;
}
.close-btn {
  background: transparent;
  border: none;
  font-size: 20px;
  cursor: pointer;
  color: #999;
}
.close-btn:hover {
  color: #333;
}
.modal-body {
  margin-bottom: 20px;
}
.modal-body p {
  margin: 0 0 10px 0;
  color: #666;
}
.no-drivers {
  color: #999;
  text-align: center;
  padding: 10px 0;
}
.driver-select {
  width: 100%;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 5px;
  font-size: 14px;
  color: #333;
}
.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}
.cancel-btn {
  padding: 8px 16px;
  border: 1px solid #ddd;
  border-radius: 5px;
  background: white;
  color: #666;
  cursor: pointer;
  font-size: 14px;
}
.confirm-btn {
  padding: 8px 16px;
  border: none;
  border-radius: 5px;
  background: #ff9800;
  color: white;
  cursor: pointer;
  font-size: 14px;
}
.confirm-btn:disabled {
  background: #ccc;
  cursor: not-allowed;
}
.confirm-btn:hover:not(:disabled) {
  background: #f57c00;
}
@media screen and (max-width: 400px) {
  .taxi-list {
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

.traffic-light-warning {
  background: #fff3cd;
  color: #856404;
  padding: 6px 12px;
  border-radius: 6px;
  margin: 8px 0;
  font-weight: bold;
  text-align: center;
}
</style>