<template>
<div class="finance">
<h2>💰 财务报表</h2>
<div class="date-section">
  <label class="date-label">查看日期：</label>
  <input 
    v-model="selectedDate" 
    type="date" 
    class="date-input"
  />
  <span class="date-tip" v-if="selectedDate === todayDate">【今天】</span>
</div>
<div class="finance-summary">
<div class="summary-card income">
<div class="summary-icon">📈</div>
<div class="summary-content">
<h3>当日总收入</h3>
<p class="big-number">¥{{ formatMoney(totalIncome) }}</p>
</div>
</div>
<div class="summary-card expense">
<div class="summary-icon">📉</div>
<div class="summary-content">
<h3>当日总支出</h3>
<p class="big-number">¥{{ formatMoney(totalExpense) }}</p>
</div>
</div>
<div class="summary-card profit">
<div class="summary-icon">💹</div>
<div class="summary-content">
<h3>当日净利润</h3>
<p class="big-number" :class="{ negative: netProfit < 0 }">
{{ netProfit >= 0 ? '+' : '' }}¥{{ formatMoney(Math.abs(netProfit)) }}
</p>
</div>
</div>
</div>
<div class="filter-section">
<select v-model="filterType" class="filter-select">
<option value="all">全部类型</option>
<option value="income">仅收入</option>
<option value="expense">仅支出</option>
</select>
<select v-model="filterCategory" class="filter-select">
<option value="all">全部分类</option>
<option value="bus">巴士</option>
<option value="plane">飞机</option>
<option value="metro">地铁</option>
<option value="hsr">高铁</option>
<option value="bike">共享单车</option>
<option value="salary">工资</option>
<option value="purchase">采购</option>
<option value="fuel">燃油</option>
<option value="electricity">电费</option>
<option value="other">其他</option>
</select>
</div>
<div class="records-list">
<div v-if="filteredRecords.length === 0" class="empty-state">
<p>该日期暂无财务记录</p>
</div>
<div 
  v-for="(record, index) in filteredRecords" 
  :key="index" 
  class="record-card" 
  :class="record.type"
>
<div class="record-icon">
{{ getCategoryIcon(record.category) }}
</div>
<div class="record-info">
<h4>{{ record.description }}</h4>
<p class="record-time">{{ formatTime(record.timestamp) }}</p>
</div>
<div class="record-amount" :class="record.type">
{{ record.type === 'income' ? '+' : '-' }}¥{{ formatMoney(record.amount) }}
</div>
</div>
</div>
</div>
</template>
<script>
import { computed, ref, onMounted, onUnmounted, onActivated } from 'vue'
import { useStore } from 'vuex'
export default {
name: 'Finance',
setup() {
const store = useStore()
const todayDate = ref('')
const selectedDate = computed({
get: () => store.state.financeSelectedDate,
set: (val) => store.commit('SET_FINANCE_SELECTED_DATE', val)
})
const filterType = computed({
get: () => store.state.financeFilterType,
set: (val) => store.commit('SET_FINANCE_FILTER_TYPE', val)
})
const filterCategory = computed({
get: () => store.state.financeFilterCategory,
set: (val) => store.commit('SET_FINANCE_FILTER_CATEGORY', val)
})
const financialRecords = computed(() => store.state.financialRecords || [])
const initToday = () => {
  const d = new Date()
  todayDate.value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}
const getDateStr = (timestamp) => {
  const d = new Date(timestamp)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}
const MIN_VALID_AMOUNT = 1
const isValidAmount = (amount) => {
  if (amount === undefined || amount === null) return false
  const num = Number(amount)
  const valid = !isNaN(num) && isFinite(num) && num >= MIN_VALID_AMOUNT
  return valid
}
const totalIncome = computed(() => {
  return financialRecords.value
  .filter(r => {
    if (typeof r !== 'object' || r === null) return false
    return getDateStr(r.timestamp) === selectedDate.value
    && r.type === 'income'
    && isValidAmount(r.amount)
  })
  .reduce((sum, r) => sum + Number(r.amount), 0)
})
const totalExpense = computed(() => {
  return financialRecords.value
  .filter(r => {
    if (typeof r !== 'object' || r === null) return false
    return getDateStr(r.timestamp) === selectedDate.value
    && r.type === 'expense'
    && isValidAmount(r.amount)
  })
  .reduce((sum, r) => sum + Number(r.amount), 0)
})
const netProfit = computed(() => totalIncome.value - totalExpense.value)
const filteredRecords = computed(() => {
  const validRecords = financialRecords.value.filter(r => typeof r === 'object' && r !== null)
  const dateFiltered = validRecords.filter(r => getDateStr(r.timestamp) === selectedDate.value)
  const finalFiltered = dateFiltered.filter(r => {
    const typeMatch = filterType.value === 'all' || r.type === filterType.value
    const categoryMatch = filterCategory.value === 'all' || r.category === filterCategory.value
    const amountValid = isValidAmount(r.amount)
    return typeMatch && categoryMatch && amountValid
  })
  const zeroAmountRecords = dateFiltered.filter(r => !isValidAmount(r.amount))
  if (zeroAmountRecords.length > 0 && process.env.NODE_ENV === 'development') {
    console.log(`【${selectedDate.value}】过滤的无效金额记录数：`, zeroAmountRecords.length)
  }
  return finalFiltered
})
const formatMoney = (amount) => {
  const num = Number(amount)
  if (isNaN(num) || num < MIN_VALID_AMOUNT) return '0'
  
  if (num >= 100000000) {
    return (num / 100000000).toFixed(2) + '亿'
  } else if (num >= 10000) {
    return (num / 10000).toFixed(2) + '万'
  }
  return Math.floor(num).toLocaleString()
}
const formatTime = (timestamp) => {
  const date = new Date(timestamp)
  return date.toLocaleString('zh-CN')
}
const getCategoryIcon = (category) => {
  const icons = {
    bus: '🚌',
    plane: '✈️',
    metro: '🚇',
    hsr: '🚄',
    bike: '🚲',
    salary: '👥',
    purchase: '🛒',
    fuel: '⛽',
    electricity: '⚡',
    cleaning: '🧹',
    supplies: '🍽️',
    hiring: '📝',
    city: '🏙️',
    upgrade: '⬆️',
    levelUp: '🎊',
    offline: '🕐',
    other: '📋'
  }
  return icons[category] || '📋'
}

let refreshTimer = null
const startAutoRefresh = () => {
  if (refreshTimer) {
    clearInterval(refreshTimer)
  }
  refreshTimer = setInterval(() => {
    console.log('财务报表自动刷新（无数据篡改）')
  }, 5000)
}

onMounted(() => {
  initToday()
  startAutoRefresh()
})

onActivated(() => {
  initToday()
  startAutoRefresh()
  store.state.financialRecords = [...store.state.financialRecords]
})

onUnmounted(() => {
  // 不清除定时器，防止切走就停
  // if (refreshTimer) clearInterval(refreshTimer)
})

return {
  todayDate,
  selectedDate,
  filterType,
  filterCategory,
  totalIncome,
  totalExpense,
  netProfit,
  filteredRecords,
  formatMoney,
  formatTime,
  getCategoryIcon
}
}
}
</script>
<style scoped>
.date-section {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 20px;
  flex-wrap: wrap;
}
.date-label {
  font-size: 14px;
  color: #333;
  font-weight: 500;
}
.date-input {
  padding: 10px 15px;
  border: 2px solid #e0e0e0;
  border-radius: 10px;
  font-size: 14px;
  background: white;
  cursor: pointer;
  transition: all 0.3s ease;
}
.date-input:focus {
  outline: none;
  border-color: #667eea;
}
.date-tip {
  color: #4caf50;
  font-size: 14px;
  font-weight: 500;
}
.finance h2 {
margin: 0 0 25px 0;
color: #333;
font-size: 24px;
}
.finance-summary {
display: grid;
grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
gap: 20px;
margin-bottom: 30px;
}
.summary-card {
border-radius: 15px;
padding: 20px;
display: flex;
align-items: center;
gap: 15px;
color: white;
box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
}
.summary-card.income {
background: linear-gradient(135deg, #4caf50 0%, #8bc34a 100%);
}
.summary-card.expense {
background: linear-gradient(135deg, #ff5722 0%, #ff9800 100%);
}
.summary-card.profit {
background: linear-gradient(135deg, #2196f3 0%, #03a9f4 100%);
}
.summary-icon {
font-size: 40px;
}
.summary-content h3 {
margin: 0;
font-size: 14px;
opacity: 0.9;
}
.big-number {
margin: 5px 0 0 0;
font-size: 28px;
font-weight: bold;
}
.big-number.negative {
color: #ff5722;
}
.filter-section {
display: flex;
gap: 15px;
margin-bottom: 20px;
flex-wrap: wrap;
}
.filter-select {
padding: 10px 15px;
border: 2px solid #e0e0e0;
border-radius: 10px;
font-size: 14px;
background: white;
cursor: pointer;
transition: all 0.3s ease;
}
.filter-select:focus {
outline: none;
border-color: #667eea;
}
.records-list {
display: flex;
flex-direction: column;
gap: 10px;
max-height: 500px;
overflow-y: auto;
}
.empty-state {
text-align: center;
padding: 60px 20px;
color: #888;
font-size: 18px;
}
.record-card {
display: flex;
align-items: center;
gap: 15px;
padding: 15px;
background: #f8f9fa;
border-radius: 10px;
transition: all 0.3s ease;
}
.record-card:hover {
transform: translateX(5px);
box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}
.record-icon {
font-size: 30px;
}
.record-info {
flex: 1;
}
.record-info h4 {
margin: 0 0 5px 0;
color: #333;
font-size: 14px;
}
.record-time {
margin: 0;
color: #888;
font-size: 12px;
}
.record-amount {
font-size: 18px;
font-weight: bold;
}
.record-amount.income {
color: #4caf50;
}
.record-amount.expense {
color: #ff5722;
}
</style>