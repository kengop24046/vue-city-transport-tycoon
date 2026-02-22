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
        </div>
        <div class="resource-bars">
          <div class="resource-bar" v-if="taxi.powerType === 'electric'">
            <span class="resource-label">🔋 电量</span>
            <div class="bar-container">
              <div class="bar-fill battery" :style="{ width: `${taxi.battery || 0}%` }"></div>
            </div>
            <span class="resource-value">{{ Math.floor(taxi.battery || 0) }}%</span>
            <button
              v-if="taxi.status === 'idle'"
              class="action-btn charge"
              @click="chargeTaxi(taxi.id)"
            >
              充电
            </button>
            <span v-else-if="taxi.needsCharge" class="hint-text">🔌 需空闲充电</span>
          </div>
          <div class="resource-bar" v-else-if="taxi.powerType === 'fuel'">
            <span class="resource-label">⛽ 油量</span>
            <div class="bar-container">
              <div class="bar-fill fuel" :style="{ width: `${taxi.fuel || 0}%` }"></div>
            </div>
            <span class="resource-value">{{ Math.floor(taxi.fuel || 0) }}%</span>
            <button
              v-if="taxi.status === 'idle'"
              class="action-btn refuel"
              @click="refuelTaxi(taxi.id)"
            >
              加油
            </button>
            <span v-else-if="taxi.needsRefuel" class="hint-text">需空闲加油</span>
          </div>
          <div class="resource-bar">
            <span class="resource-label">🧹 清洁度</span>
            <div class="bar-container">
              <div class="bar-fill cleanliness" :style="{ width: `${taxi.cleanliness || 0}%` }"></div>
            </div>
            <span class="resource-value">{{ Math.floor(taxi.cleanliness || 0) }}%</span>
            <button
              v-if="taxi.status === 'idle'"
              class="action-btn clean"
              @click="cleanTaxi(taxi.id)"
            >
              清洁
            </button>
            <span v-else-if="taxi.needsCleaning" class="hint-text">需空闲清洁</span>
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
  name: 'TaxiStatus',
  setup() {
    const store = useStore()

    const taxis = computed(() => store.state.taxis)
    const taxiDrivers = computed(() => store.state.employees.taxiDrivers)

    const getTaxiModel = (modelId) => {
      return store.getters.getTaxiModel(modelId)
    }

    const getDriverName = (driverId) => {
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

    const refuelTaxi = (taxiId) => {
      store.dispatch('refuelTaxi', taxiId)
    }

    const chargeTaxi = (taxiId) => {
      store.dispatch('chargeTaxi', taxiId)
    }

    const cleanTaxi = (taxiId) => {
      store.dispatch('cleanTaxi', taxiId)
    }

    return {
      taxis,
      getTaxiModel,
      getDriverName,
      getTaxiStatusText,
      getTaxiStatusClass,
      refuelTaxi,
      chargeTaxi,
      cleanTaxi
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
</style>