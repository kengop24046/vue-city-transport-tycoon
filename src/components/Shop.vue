<template>
  <div class="shop">
    <h2>🛒 商店</h2>

    <div class="shop-tabs">
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

    <!-- 巴士商店 -->
    <div v-if="currentTab === 'buses'" class="shop-content">
      <h3>🚌 巴士商店</h3>
      <div class="product-grid">
        <div v-for="model in busModels" :key="model.id" class="product-card">
          <div class="product-header">
            <h4>{{ model.name }}</h4>
            <span class="product-price">¥{{ formatMoney(model.price) }}</span>
          </div>
          <span class="power-tag" :class="model.powerType">
            {{ model.powerType === 'electric' ? '⚡ 电动' : '⛽ 燃油' }}
          </span>
          <p class="product-desc">{{ model.description }}</p>
          <div class="product-stats">
            <span>👥 容量: {{ model.capacity }}人</span>
            <span>🚀 速度: {{ model.speed }}km/h</span>
            <span>📊 效率: {{ model.energyEfficiency }}</span>
          </div>
          <button
            class="buy-btn"
            :disabled="money < model.price"
            @click="buyBus(model.id)"
          >
            {{ money >= model.price ? '购买' : '资金不足' }}
          </button>
        </div>
      </div>
    </div>

    <!-- 飞机商店 -->
    <div v-if="currentTab === 'planes'" class="shop-content">
      <h3>✈️ 飞机商店</h3>
      <div class="product-grid">
        <div v-for="model in planeModels" :key="model.id" class="product-card">
          <div class="product-header">
            <h4>{{ model.name }}</h4>
            <span class="product-price">¥{{ formatMoney(model.price) }}</span>
          </div>
          <p class="product-desc">{{ model.description }}</p>
          <div class="product-stats">
            <span>👥 容量: {{ model.capacity }}人</span>
            <span>🚀 速度: {{ model.speed }}km/h</span>
            <span>📍 航程: {{ model.range }}km</span>
          </div>
          <button
            class="buy-btn"
            :disabled="money < model.price"
            @click="buyPlane(model.id)"
          >
            {{ money >= model.price ? '购买' : '资金不足' }}
          </button>
        </div>
      </div>
    </div>

    <!-- 地铁商店 -->
    <div v-if="currentTab === 'metros'" class="shop-content">
      <h3>🚇 地铁商店</h3>
      <div class="product-grid">
        <div v-for="model in metroModels" :key="model.id" class="product-card">
          <div class="product-header">
            <h4>{{ model.name }}</h4>
            <span class="product-price">¥{{ formatMoney(model.price) }}</span>
          </div>
          <span class="power-tag electric">⚡ 电网供电</span>
          <p class="product-desc">{{ model.description }}</p>
          <div class="product-stats">
            <span>👥 容量: {{ model.capacity }}人</span>
            <span>🚀 速度: {{ model.speed }}km/h</span>
          </div>
          <button
            class="buy-btn"
            :disabled="money < model.price"
            @click="buyMetro(model.id)"
          >
            {{ money >= model.price ? '购买' : '资金不足' }}
          </button>
        </div>
      </div>
    </div>

    <!-- 高铁商店 -->
    <div v-if="currentTab === 'hsrs'" class="shop-content">
      <h3>🚄 高铁商店</h3>
      <div class="product-grid">
        <div v-for="model in hsrModels" :key="model.id" class="product-card">
          <div class="product-header">
            <h4>{{ model.name }}</h4>
            <span class="product-price">¥{{ formatMoney(model.price) }}</span>
          </div>
          <span class="power-tag electric">⚡ 接触网供电</span>
          <p class="product-desc">{{ model.description }}</p>
          <div class="product-stats">
            <span>👥 容量: {{ model.capacity }}人</span>
            <span>🚀 速度: {{ model.speed }}km/h</span>
          </div>
          <button
            class="buy-btn"
            :disabled="money < model.price"
            @click="buyHSR(model.id)"
          >
            {{ money >= model.price ? '购买' : '资金不足' }}
          </button>
        </div>
      </div>
    </div>

    <!-- 共享单车商店 -->
    <div v-if="currentTab === 'bikes'" class="shop-content">
      <h3>🚲 共享单车商店</h3>
      <div class="bike-shop">
        <div class="info-box">
          <p>当前拥有: <strong>{{ totalBikes }}</strong> 辆</p>
          <p>正在使用: <strong>{{ activeRentals }}</strong> 辆</p>
          <p>单价: <strong>¥800</strong> / 辆</p>
        </div>
        <div class="bike-purchase">
          <input
            type="number"
            v-model.number="bikeQuantity"
            min="1"
            max="100"
            class="quantity-input"
          />
          <button
            class="buy-btn"
            :disabled="money < bikeQuantity * 800"
            @click="buyBikes"
          >
            购买 {{ bikeQuantity }} 辆 (¥{{ formatMoney(bikeQuantity * 800) }})
          </button>
        </div>
      </div>
    </div>

    <!-- 升级商店 -->
    <div v-if="currentTab === 'upgrades'" class="shop-content">
      <h3>⬆️ 车辆升级</h3>

      <div class="upgrade-section">
        <h4>🚌 巴士升级</h4>
        <div class="upgrade-list">
          <div v-for="bus in buses" :key="bus.id" class="upgrade-item">
            <span class="vehicle-name">
              {{ getBusModel(bus.modelId)?.name }}
              <span class="power-mini" :class="bus.powerType">
                {{ bus.powerType === 'electric' ? '⚡ 电动' : '⛽ 燃油' }}
              </span>
            </span>
            <div class="upgrade-buttons">
              <button
                v-if="!bus.hasEntertainment"
                class="upgrade-btn"
                :disabled="money < 50000"
                @click="upgradeVehicle(bus.id, 'bus', 'entertainment')"
              >
                🎬 娱乐系统 (¥50,000)
              </button>
              <span v-else class="upgrade-done">✅ 娱乐系统</span>

              <button
                v-if="!bus.hasWiFi"
                class="upgrade-btn"
                :disabled="money < 30000"
                @click="upgradeVehicle(bus.id, 'bus', 'wifi')"
              >
                📶 WiFi (¥30,000)
              </button>
              <span v-else class="upgrade-done">✅ WiFi</span>
            </div>
          </div>
        </div>
      </div>

      <div class="upgrade-section" v-if="companyLevel >= 6">
        <h4>✈️ 飞机升级</h4>
        <div class="upgrade-list">
          <div v-for="plane in planes" :key="plane.id" class="upgrade-item">
            <span class="vehicle-name">{{ getPlaneModel(plane.modelId)?.name }}</span>
            <div class="upgrade-buttons">
              <button
                v-if="!plane.hasEntertainment"
                class="upgrade-btn"
                :disabled="money < 50000"
                @click="upgradeVehicle(plane.id, 'plane', 'entertainment')"
              >
                🎬 娱乐系统 (¥50,000)
              </button>
              <span v-else class="upgrade-done">✅ 娱乐系统</span>

              <button
                v-if="!plane.hasWiFi"
                class="upgrade-btn"
                :disabled="money < 30000"
                @click="upgradeVehicle(plane.id, 'plane', 'wifi')"
              >
                📶 WiFi (¥30,000)
              </button>
              <span v-else class="upgrade-done">✅ WiFi</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { computed, ref } from 'vue'
import { useStore } from 'vuex'
import busModels from '../data/busModels'
import planeModels from '../data/planeModels'
import metroModels from '../data/metroModels'
import highSpeedRailModels from '../data/highSpeedRailModels'

export default {
  name: 'Shop',
  setup() {
    const store = useStore()
    const currentTab = ref('buses')
    const bikeQuantity = ref(10)

    const money = computed(() => store.state.money)
    const companyLevel = computed(() => store.state.companyLevel)
    const buses = computed(() => store.state.buses)
    const planes = computed(() => store.state.planes)
    const totalBikes = computed(() => store.state.sharedBikes.totalBikes)
    const activeRentals = computed(() => store.state.sharedBikes.activeRentals.length)

    const tabs = computed(() => [
      { id: 'buses', name: '巴士', icon: '🚌', locked: false },
      { id: 'planes', name: '飞机', icon: '✈️', locked: companyLevel.value < 6 },
      { id: 'metros', name: '地铁', icon: '🚇', locked: companyLevel.value < 10 },
      { id: 'hsrs', name: '高铁', icon: '🚄', locked: companyLevel.value < 20 },
      { id: 'bikes', name: '共享单车', icon: '🚲', locked: false },
      { id: 'upgrades', name: '升级', icon: '⬆️', locked: false }
    ])

    const formatMoney = (amount) => {
      if (amount >= 100000000) {
        return (amount / 100000000).toFixed(2) + '亿'
      } else if (amount >= 10000) {
        return (amount / 10000).toFixed(2) + '万'
      }
      return Math.floor(amount).toLocaleString()
    }

    const getBusModel = (modelId) => store.getters.getBusModel(modelId)
    const getPlaneModel = (modelId) => store.getters.getPlaneModel(modelId)

    const buyBus = (modelId) => store.dispatch('buyBus', modelId)
    const buyPlane = (modelId) => store.dispatch('buyPlane', modelId)
    const buyMetro = (modelId) => store.dispatch('buyMetro', modelId)
    const buyHSR = (modelId) => store.dispatch('buyHSR', modelId)
    const buyBikes = () => store.dispatch('buySharedBikes', bikeQuantity.value)
    const upgradeVehicle = (vehicleId, type, upgradeType) => {
      store.dispatch('upgradeVehicle', { vehicleId, type, upgradeType })
    }

    return {
      currentTab,
      bikeQuantity,
      tabs,
      money,
      companyLevel,
      buses,
      planes,
      totalBikes,
      activeRentals,
      busModels,
      planeModels,
      metroModels,
      hsrModels: highSpeedRailModels,
      formatMoney,
      getBusModel,
      getPlaneModel,
      buyBus,
      buyPlane,
      buyMetro,
      buyHSR,
      buyBikes,
      upgradeVehicle
    }
  }
}
</script>

<style scoped>
.shop h2 {
  margin: 0 0 25px 0;
  color: #333;
  font-size: 24px;
}

.shop-tabs {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 25px;
}

.shop-tabs button {
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

.shop-tabs button:hover:not(.locked) {
  border-color: #667eea;
  transform: translateY(-2px);
}

.shop-tabs button.active {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-color: transparent;
}

.shop-tabs button.locked {
  opacity: 0.5;
  cursor: not-allowed;
}

.lock-icon {
  font-size: 12px;
}

.shop-content h3 {
  margin: 0 0 20px 0;
  color: #333;
  font-size: 20px;
}

.product-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 20px;
}

.product-card {
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  border-radius: 15px;
  padding: 20px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
}

.product-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 10px;
}

.product-header h4 {
  margin: 0;
  color: #333;
  font-size: 16px;
}

.product-price {
  font-size: 18px;
  font-weight: bold;
  color: #667eea;
}

.power-tag {
  display: inline-block;
  padding: 4px 8px;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 500;
  color: white;
  margin-bottom: 10px;
}

.power-tag.electric {
  background: linear-gradient(135deg, #2196f3, #03a9f4);
}

.power-tag.fuel {
  background: linear-gradient(135deg, #ff9800, #ffc107);
}

.product-desc {
  margin: 0 0 15px 0;
  color: #666;
  font-size: 13px;
}

.product-stats {
  display: flex;
  flex-direction: column;
  gap: 5px;
  margin-bottom: 15px;
  font-size: 12px;
  color: #555;
}

.buy-btn {
  width: 100%;
  padding: 12px;
  border: none;
  border-radius: 10px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
}

.buy-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
}

.buy-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.bike-shop {
  background: #f8f9fa;
  border-radius: 15px;
  padding: 30px;
}

.info-box {
  margin-bottom: 20px;
}

.info-box p {
  margin: 10px 0;
  font-size: 16px;
  color: #333;
}

.info-box strong {
  color: #667eea;
}

.bike-purchase {
  display: flex;
  gap: 15px;
  align-items: center;
}

.quantity-input {
  width: 100px;
  padding: 12px;
  border: 2px solid #e0e0e0;
  border-radius: 10px;
  font-size: 16px;
  text-align: center;
}

.quantity-input:focus {
  outline: none;
  border-color: #667eea;
}

.upgrade-section {
  margin-bottom: 30px;
}

.upgrade-section h4 {
  margin: 0 0 15px 0;
  color: #333;
  font-size: 18px;
}

.upgrade-list {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.upgrade-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 20px;
  background: #f8f9fa;
  border-radius: 10px;
  flex-wrap: wrap;
  gap: 10px;
}

.vehicle-name {
  font-weight: 500;
  color: #333;
  display: flex;
  align-items: center;
  gap: 5px;
}

.power-mini {
  font-size: 12px;
  padding: 2px 6px;
  border-radius: 4px;
  color: white;
}

.power-mini.electric {
  background: #2196f3;
}

.power-mini.fuel {
  background: #ff9800;
}

.upgrade-buttons {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.upgrade-btn {
  padding: 8px 16px;
  border: none;
  border-radius: 8px;
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
  color: white;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.upgrade-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 2px 8px rgba(245, 87, 108, 0.3);
}

.upgrade-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.upgrade-done {
  padding: 8px 16px;
  background: #4caf50;
  color: white;
  border-radius: 8px;
  font-size: 12px;
}
</style>