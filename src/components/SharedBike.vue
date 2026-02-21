<template>
  <div class="shared-bike">
    <h2>🚲 共享单车</h2>
    
    <div class="bike-overview">
      <div class="overview-card">
        <div class="overview-icon">🚲</div>
        <div class="overview-content">
          <h3>总车辆</h3>
          <p class="big-number">{{ totalBikes }}</p>
        </div>
      </div>
      <div class="overview-card">
        <div class="overview-icon">🏃</div>
        <div class="overview-content">
          <h3>使用中</h3>
          <p class="big-number">{{ activeRentals }}</p>
        </div>
      </div>
      <div class="overview-card">
        <div class="overview-icon">✅</div>
        <div class="overview-content">
          <h3>可用</h3>
          <p class="big-number">{{ availableBikes }}</p>
        </div>
      </div>
      <div class="overview-card">
        <div class="overview-icon">🔧</div>
        <div class="overview-content">
          <h3>维修员</h3>
          <p class="big-number">{{ bikeRepairers }}</p>
        </div>
      </div>
    </div>

    <div class="bike-condition">
      <h3>车辆状况</h3>
      <div class="condition-bar">
        <div class="condition-fill" :style="{ width: `${bikeCondition}%` }"></div>
      </div>
      <p class="condition-text">{{ bikeCondition }}% 完好</p>
    </div>

    <div class="active-rentals">
      <h3>正在进行的租赁 ({{ activeRentalsList.length }})</h3>
      <div v-if="activeRentalsList.length === 0" class="empty-state">
        <p>暂无正在进行的租赁</p>
      </div>
      <div v-else class="rentals-list">
        <div v-for="rental in activeRentalsList" :key="rental.id" class="rental-card">
          <div class="rental-info">
            <span class="rental-icon">🚲</span>
            <div class="rental-details">
              <p class="rental-duration">{{ rental.hours }} 小时</p>
              <p class="rental-cost">¥{{ rental.hours * rental.rate }}</p>
            </div>
          </div>
          <div class="rental-progress">
            <div 
              class="rental-progress-fill" 
              :style="{ width: `${rentalProgress(rental)}%` }"
            ></div>
          </div>
        </div>
      </div>
    </div>

    <div class="bike-tips">
      <h3>💡 经营提示</h3>
      <ul>
        <li>共享单车每小时收费 ¥5，不足1小时按1小时计算</li>
        <li>租赁是随机发生的，保持足够的可用车辆可以获得更多收入</li>
        <li>雇佣单车维修员可以保持车辆状况良好</li>
        <li>车辆状况越好，越容易被租赁</li>
        <li>离线时也会结算共享单车收入！</li>
      </ul>
    </div>
  </div>
</template>

<script>
import { computed } from 'vue'
import { useStore } from 'vuex'

export default {
  name: 'SharedBike',
  setup() {
    const store = useStore()

    const totalBikes = computed(() => store.state.sharedBikes.totalBikes)
    const activeRentalsList = computed(() => store.state.sharedBikes.activeRentals)
    const bikeCondition = computed(() => store.state.sharedBikes.bikeCondition)
    const employees = computed(() => store.state.employees)
    
    const activeRentals = computed(() => activeRentalsList.value.length)
    const availableBikes = computed(() => totalBikes.value - activeRentals.value)
    const bikeRepairers = computed(() => 
      (employees.value.bikeRepairers || []).filter(e => e.hired).length
    )
    
    const rentalProgress = (rental) => {
      const elapsed = Date.now() - rental.startTime
      const total = rental.hours * 3600000
      return Math.min(100, (elapsed / total) * 100)
    }

    return {
      totalBikes,
      activeRentalsList,
      bikeCondition,
      activeRentals,
      availableBikes,
      bikeRepairers,
      rentalProgress
    }
  }
}
</script>

<style scoped>
.shared-bike h2 {
  margin: 0 0 25px 0;
  color: #333;
  font-size: 24px;
}

.bike-overview {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
}

.overview-card {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
  border-radius: 15px;
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 15px;
  color: white;
  box-shadow: 0 4px 15px rgba(245, 87, 108, 0.3);
}

.overview-icon {
  font-size: 40px;
}

.overview-content h3 {
  margin: 0;
  font-size: 14px;
  opacity: 0.9;
}

.big-number {
  margin: 5px 0 0 0;
  font-size: 32px;
  font-weight: bold;
}

.bike-condition {
  background: #f8f9fa;
  border-radius: 15px;
  padding: 25px;
  margin-bottom: 30px;
}

.bike-condition h3 {
  margin: 0 0 15px 0;
  color: #333;
  font-size: 18px;
}

.condition-bar {
  width: 100%;
  height: 20px;
  background: #e0e0e0;
  border-radius: 10px;
  overflow: hidden;
  margin-bottom: 10px;
}

.condition-fill {
  height: 100%;
  background: linear-gradient(90deg, #4caf50, #8bc34a);
  transition: width 0.3s ease;
}

.condition-text {
  margin: 0;
  text-align: center;
  font-size: 16px;
  color: #333;
  font-weight: 500;
}

.active-rentals h3 {
  margin: 0 0 15px 0;
  color: #333;
  font-size: 18px;
}

.empty-state {
  text-align: center;
  padding: 40px 20px;
  color: #888;
}

.rentals-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 15px;
  margin-bottom: 30px;
}

.rental-card {
  background: #f8f9fa;
  border-radius: 12px;
  padding: 15px;
}

.rental-info {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 10px;
}

.rental-icon {
  font-size: 30px;
}

.rental-details {
  flex: 1;
}

.rental-duration {
  margin: 0 0 3px 0;
  color: #333;
  font-size: 14px;
  font-weight: 500;
}

.rental-cost {
  margin: 0;
  color: #667eea;
  font-size: 16px;
  font-weight: bold;
}

.rental-progress {
  width: 100%;
  height: 6px;
  background: #e0e0e0;
  border-radius: 3px;
  overflow: hidden;
}

.rental-progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #f093fb, #f5576c);
  transition: width 0.3s ease;
}

.bike-tips {
  background: linear-gradient(135deg, #fff9c4 0%, #fff59d 100%);
  border-radius: 15px;
  padding: 25px;
}

.bike-tips h3 {
  margin: 0 0 15px 0;
  color: #333;
  font-size: 18px;
}

.bike-tips ul {
  margin: 0;
  padding-left: 20px;
}

.bike-tips li {
  margin: 8px 0;
  color: #555;
  line-height: 1.6;
}
</style>