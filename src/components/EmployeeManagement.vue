<template>
  <div class="employees">
    <h2>👥 员工管理</h2>
    
    <div class="employee-tabs">
      <button 
        v-for="tab in tabs" 
        :key="tab.id"
        :class="{ active: currentTab === tab.id }"
        @click="currentTab = tab.id"
      >
        {{ tab.icon }} {{ tab.name }}
      </button>
    </div>

    <div class="employee-content">
      <div class="current-employees">
        <h3>当前员工 ({{ currentEmployees.length }})</h3>
        <div v-if="currentEmployees.length === 0" class="empty-state">
          <p>暂无该类型员工</p>
        </div>
        <div v-else class="employee-list">
          <div v-for="emp in currentEmployees" :key="emp.id" class="employee-card">
            <div class="employee-avatar">{{ tabIcon.charAt(0) }}</div>
            <div class="employee-info">
              <h4>{{ emp.name }}</h4>
              <p class="employee-salary">💰 ¥{{ emp.salary }} / 月</p>
            </div>
            <span class="status-badge hired">✅ 在职</span>
          </div>
        </div>
      </div>

      <div class="hire-section">
        <h3>雇佣新员工</h3>
        <div class="hire-form">
          <input 
            type="text" 
            v-model="newEmployeeName" 
            placeholder="输入员工姓名"
            class="name-input"
          />
          <p class="salary-info">月薪: ¥{{ employeeTypeSalary }} / 月</p>
          <p class="hire-cost-info">雇佣费用: ¥{{ employeeTypeHireCost }}</p>
          <button 
            class="hire-btn"
            :disabled="!newEmployeeName || money < employeeTypeHireCost"
            @click="hireEmployee"
          >
            雇佣
          </button>
        </div>
      </div>
    </div>

    <div class="employee-summary">
      <h3>员工统计</h3>
      <div class="summary-grid">
        <div v-for="tab in tabs" :key="tab.id" class="summary-item">
          <span class="summary-icon">{{ tab.icon }}</span>
          <span class="summary-name">{{ tab.name }}</span>
          <span class="summary-count">{{ getEmployeeCount(tab.id) }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { computed, ref } from 'vue'
import { useStore } from 'vuex'

export default {
  name: 'EmployeeManagement',
  setup() {
    const store = useStore()
    const currentTab = ref('busDrivers')
    const newEmployeeName = ref('')

    const money = computed(() => store.state.money)
    const employees = computed(() => store.state.employees)
    
    const tabs = [
      { id: 'busDrivers', name: '巴士司机', icon: '🚌' },
      { id: 'pilots', name: '飞行员', icon: '✈️' },
      { id: 'flightAttendants', name: '空姐', icon: '💁' },
      { id: 'conductors', name: '售票员', icon: '🎫' },
      { id: 'maintenanceWorkers', name: '维修人员', icon: '🔧' },
      { id: 'cleaners', name: '清洁人员', icon: '🧹' },
      { id: 'supplyWorkers', name: '补给人员', icon: '🍽️' },
      { id: 'bikeRepairers', name: '单车维修员', icon: '🚲' },
      { id: 'metroDrivers', name: '地铁司机', icon: '🚇' },
      { id: 'hsrDrivers', name: '高铁司机', icon: '🚄' },
      { id: 'hsrAttendants', name: '高铁乘务员', icon: '💼' }
    ]
    
    const salaryInfo = {
      busDrivers: 3000,
      pilots: 15000,
      flightAttendants: 8000,
      conductors: 4000,
      maintenanceWorkers: 5000,
      cleaners: 3000,
      supplyWorkers: 4000,
      bikeRepairers: 3500,
      metroDrivers: 6000,
      hsrDrivers: 12000,
      hsrAttendants: 7000
    }
    
    const hireCosts = {
      busDrivers: 5000,
      pilots: 20000,
      flightAttendants: 10000,
      conductors: 8000,
      maintenanceWorkers: 6000,
      cleaners: 4000,
      supplyWorkers: 5000,
      bikeRepairers: 4500,
      metroDrivers: 7000,
      hsrDrivers: 12000,
      hsrAttendants: 9000
    }
    
    const namePrefixes = ['陈', '林', '黄', '张', '李', '王', '刘', '周', '吴', '郑', '孙', '马', '朱', '胡', '郭']
    const nameMiddles = ['小', '大', '文', '武', '明', '华', '建', '国', '志', '伟', '丽', '芳', '娜', '敏', '静']
    const nameLasts = ['明', '华', '强', '芳', '娜', '敏', '静', '丽', '娟', '玲', '辉', '鹏', '超', '勇', '军']
    
    const currentEmployees = computed(() => {
      return employees.value[currentTab.value] || []
    })
    
    const tabIcon = computed(() => {
      const tab = tabs.find(t => t.id === currentTab.value)
      return tab?.icon || '👤'
    })
    
    const employeeTypeSalary = computed(() => salaryInfo[currentTab.value] || 3000)
    const employeeTypeHireCost = computed(() => hireCosts[currentTab.value] || 5000)
    
    const getEmployeeCount = (type) => {
      return (employees.value[type] || []).filter(e => e.hired).length
    }
    
    const generateRandomName = () => {
      const prefix = namePrefixes[Math.floor(Math.random() * namePrefixes.length)]
      const middle = nameMiddles[Math.floor(Math.random() * nameMiddles.length)]
      const last = nameLasts[Math.floor(Math.random() * nameLasts.length)]
      return prefix + (Math.random() > 0.5 ? middle : '') + last
    }
    
    const hireEmployee = () => {
      const name = newEmployeeName.value || generateRandomName()
      const salary = employeeTypeSalary.value
      
      if (store.dispatch('hireEmployee', {
        type: currentTab.value,
        name,
        salary
      })) {
        newEmployeeName.value = ''
      }
    }

    return {
      currentTab,
      newEmployeeName,
      tabs,
      money,
      currentEmployees,
      tabIcon,
      employeeTypeSalary,
      employeeTypeHireCost,
      getEmployeeCount,
      hireEmployee
    }
  }
}
</script>

<style scoped>
.employees h2 {
  margin: 0 0 25px 0;
  color: #333;
  font-size: 24px;
}

.employee-tabs {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 25px;
}

.employee-tabs button {
  padding: 10px 20px;
  border: 2px solid #e0e0e0;
  border-radius: 10px;
  background: white;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.employee-tabs button:hover {
  border-color: #667eea;
  transform: translateY(-2px);
}

.employee-tabs button.active {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-color: transparent;
}

.employee-content {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 25px;
  margin-bottom: 30px;
}

.current-employees h3,
.hire-section h3 {
  margin: 0 0 15px 0;
  color: #333;
  font-size: 18px;
}

.empty-state {
  text-align: center;
  padding: 40px 20px;
  color: #888;
}

.employee-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  max-height: 400px;
  overflow-y: auto;
}

.employee-card {
  display: flex;
  align-items: center;
  gap: 15px;
  padding: 15px;
  background: #f8f9fa;
  border-radius: 10px;
}

.employee-avatar {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 24px;
  font-weight: bold;
}

.employee-info {
  flex: 1;
}

.employee-info h4 {
  margin: 0 0 5px 0;
  color: #333;
  font-size: 16px;
}

.employee-salary {
  margin: 0;
  color: #666;
  font-size: 14px;
}

.status-badge.hired {
  padding: 5px 12px;
  background: #4caf50;
  color: white;
  border-radius: 15px;
  font-size: 12px;
}

.hire-section {
  background: #f8f9fa;
  border-radius: 15px;
  padding: 20px;
}

.hire-form {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.name-input {
  padding: 12px;
  border: 2px solid #e0e0e0;
  border-radius: 10px;
  font-size: 14px;
}

.name-input:focus {
  outline: none;
  border-color: #667eea;
}

.salary-info,
.hire-cost-info {
  margin: 0;
  color: #666;
  font-size: 14px;
}

.hire-btn {
  padding: 12px;
  border: none;
  border-radius: 10px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
}

.hire-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
}

.hire-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.employee-summary h3 {
  margin: 0 0 20px 0;
  color: #333;
  font-size: 18px;
}

.summary-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 15px;
}

.summary-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 5px;
  padding: 15px;
  background: #f8f9fa;
  border-radius: 10px;
}

.summary-icon {
  font-size: 28px;
}

.summary-name {
  font-size: 12px;
  color: #666;
}

.summary-count {
  font-size: 24px;
  font-weight: bold;
  color: #667eea;
}
</style>