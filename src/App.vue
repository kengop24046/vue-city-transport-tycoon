<template>
  <div class="app-container">
    <Header />
    <div class="main-content">
      <div class="nav-tabs">
        <button 
          v-for="tab in tabs"
          :key="tab.id"
          :class="{ active: currentTab === tab.id, locked: tab.locked }"
          @click="handleTabClick(tab)"
        >
          {{ tab.icon }} {{ tab.name }}
          <span v-if="tab.locked" class="lock-icon">🔒</span>
        </button>
      </div>
      <div class="tab-content">
        <Dashboard v-if="currentTab === 'dashboard'" />
        <BusStatus v-else-if="currentTab === 'busStatus'" />
        <CoachStatus v-else-if="currentTab === 'coachStatus'" />
        <TaxiStatus v-else-if="currentTab === 'taxiStatus'" />
        <PlaneStatus v-else-if="currentTab === 'planeStatus'" />
        <MetroStatus v-else-if="currentTab === 'metroStatus'" />
        <HighSpeedRailStatus v-else-if="currentTab === 'hsrStatus'" />
        <Finance v-else-if="currentTab === 'finance'" />
        <Shop v-else-if="currentTab === 'shop'" />
        <EmployeeManagement v-else-if="currentTab === 'employees'" />
        <RouteManagement v-else-if="currentTab === 'routes'" />
        <SharedBike v-else-if="currentTab === 'bikes'" />
        <Settings v-else-if="currentTab === 'settings'" />
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useStore } from 'vuex'
import Header from './components/Header.vue'
import Dashboard from './components/Dashboard.vue'
import BusStatus from './components/BusStatus.vue'
import CoachStatus from './components/CoachStatus.vue'
import TaxiStatus from './components/TaxiStatus.vue'
import PlaneStatus from './components/PlaneStatus.vue'
import MetroStatus from './components/MetroStatus.vue'
import HighSpeedRailStatus from './components/HighSpeedRailStatus.vue'
import Finance from './components/Finance.vue'
import Shop from './components/Shop.vue'
import EmployeeManagement from './components/EmployeeManagement.vue'
import RouteManagement from './components/RouteManagement.vue'
import SharedBike from './components/SharedBike.vue'
import Settings from './components/Settings.vue'

export default {
  name: 'App',
  components: {
    Header,
    Dashboard,
    BusStatus,
    CoachStatus,
    TaxiStatus,
    PlaneStatus,
    MetroStatus,
    HighSpeedRailStatus,
    Finance,
    Shop,
    EmployeeManagement,
    RouteManagement,
    SharedBike,
    Settings
  },
  setup() {
    const store = useStore()
    const currentTab = ref('dashboard')
    let gameLoop = null
    let saveLoop = null

    const companyLevel = computed(() => store.state?.companyLevel ?? 1)

    const tabs = computed(() => [
      { id: 'dashboard', name: '总览', icon: '📊', locked: false },
      { id: 'busStatus', name: '城市巴士', icon: '🚌', locked: false },
      { id: 'coachStatus', name: '长途巴士', icon: '🚍', locked: false },
      { id: 'taxiStatus', name: '的士运营', icon: '🚕', locked: false },
      { id: 'planeStatus', name: '飞机状态', icon: '✈️', locked: companyLevel.value < 6 },
      { id: 'metroStatus', name: '地铁状态', icon: '🚇', locked: companyLevel.value < 10 },
      { id: 'hsrStatus', name: '高铁状态', icon: '🚄', locked: companyLevel.value < 20 },
      { id: 'finance', name: '财务报表', icon: '📈', locked: false },
      { id: 'shop', name: '商店', icon: '🛒', locked: false },
      { id: 'employees', name: '员工管理', icon: '👥', locked: false },
      { id: 'routes', name: '线路管理', icon: '🛣️', locked: false },
      { id: 'bikes', name: '共享单车', icon: '🚲', locked: false },
      { id: 'settings', name: '设置', icon: '⚙️', locked: false }
    ])

    const handleTabClick = (tab) => {
      if (!tab.locked) {
        currentTab.value = tab.id
      }
    }

    const startGameLoops = () => {
      // 游戏主循环 - 每秒更新
      gameLoop = setInterval(() => {
        try {
          store.dispatch('updateGame')
        } catch (e) {
          console.error('游戏更新失败:', e)
        }
      }, 1000)

      // 自动保存 - 每30秒
      saveLoop = setInterval(() => {
        try {
          store.dispatch('saveGame')
        } catch (e) {
          console.error('游戏保存失败:', e)
        }
      }, 30000)
    }

    const stopGameLoops = () => {
      if (gameLoop) {
        clearInterval(gameLoop)
        gameLoop = null
      }
      if (saveLoop) {
        clearInterval(saveLoop)
        saveLoop = null
      }
    }

    onMounted(() => {
      try {
        store.dispatch('loadGame')
      } catch (e) {
        console.error('游戏加载失败:', e)
      }
      startGameLoops()
    })

    onUnmounted(() => {
      stopGameLoops()
      try {
        store.dispatch('saveGame')
      } catch (e) {
        console.error('卸载时保存失败:', e)
      }
    })

    return {
      currentTab,
      tabs,
      handleTabClick
    }
  }
}
</script>

<style scoped>
.app-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.main-content {
  max-width: 1400px;
  margin: 0 auto;
  padding: 20px;
}

.nav-tabs {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 20px;
  background: rgba(255, 255, 255, 0.1);
  padding: 15px;
  border-radius: 15px;
  backdrop-filter: blur(10px);
}

.nav-tabs button {
  padding: 10px 20px;
  border: none;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.2);
  color: white;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 5px;
}

.nav-tabs button:hover:not(.locked) {
  background: rgba(255, 255, 255, 0.3);
  transform: translateY(-2px);
}

.nav-tabs button.active {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
  box-shadow: 0 4px 15px rgba(245, 87, 108, 0.4);
}

.nav-tabs button.locked {
  opacity: 0.5;
  cursor: not-allowed;
}

.lock-icon {
  font-size: 12px;
}

.tab-content {
  background: rgba(255, 255, 255, 0.95);
  border-radius: 20px;
  padding: 30px;
  min-height: 500px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
}
</style>