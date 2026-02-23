import { createStore } from 'vuex'
import { encryptData, decryptData } from '../utils/encryption'
import { calculateOfflineEarnings, updateVehicleProgress, updateTaxiProgress } from '../utils/gameLogic'
import macauRoutes from '../data/macauRoutes'
import hongkongRoutes from '../data/hongkongRoutes'
import zhuhaiRoutes from '../data/zhuhaiRoutes'
import guangzhouRoutes from '../data/guangzhouRoutes'
import shenzhenRoutes from '../data/shenzhenRoutes'
import beijingRoutes from '../data/beijingRoutes'
import shanghaiRoutes from '../data/shanghaiRoutes'
import busModels from '../data/busModels'
import taxiModels from '../data/taxiModels'
import planeModels from '../data/planeModels'
import metroModels from '../data/metroModels'
import highSpeedRailModels from '../data/highSpeedRailModels'
import cities from '../data/cities'

const BUS_TERMINAL_WHITELIST = {
  macau: ['关闸总站', '妈阁总站', '永宁广场总站', '外港码头总站', '氹仔花城总站', '旅游塔/行车隧道', '路环市区'],
  hongkong: ['坚尼地城', '北角', '香港国际机场', '中环'],
  zhuhai: ['香洲总站', '长隆'],
  guangzhou: ['东山总站', '西关', '体育中心', '天河客运站'],
  shenzhen: ['火车站', '市民中心'],
  shanghai: ['延安西路外滩', '中山公园'],
  beijing: ['四惠枢纽站', '公主坟']
}
const TAXI_TERMINAL_ROADS = {
  macau: '关闸总站',
  hongkong: '中环总站',
  zhuhai: '香洲总站',
  guangzhou: '东山总站',
  shenzhen: '火车站',
  shanghai: '延安西路外滩',
  beijing: '四惠枢纽站'
}

const allRoutes = {
  macau: macauRoutes,
  hongkong: hongkongRoutes,
  zhuhai: zhuhaiRoutes,
  guangzhou: guangzhouRoutes,
  shenzhen: shenzhenRoutes,
  beijing: beijingRoutes,
  shanghai: shanghaiRoutes
}

const getInitialState = () => ({
  // 基础信息
  companyName: '澳门交通集团',
  companyLevel: 1,
  experience: 0,
  experienceToNextLevel: 150000,
  money: 10000000,
  lastSaveTime: Date.now(),
  lastOnlineTime: Date.now(),

  // 解锁的城市
  unlockedCities: ['macau'],

  // 员工
  employees: {
    busDrivers: [
      { id: 1, name: '陈司机', salary: 6500, hired: true },
      { id: 2, name: '李司机', salary: 6800, hired: true },
      { id: 3, name: '黄司机', salary: 6800, hired: true },
    ],
    taxiDrivers: [
      { id: 1, name: '王司机', salary: 5500, hired: true },
      { id: 2, name: '张司机', salary: 5800, hired: true },
    ],
    pilots: [],
    flightAttendants: [],
    conductors: [
      { id: 1, name: '周售票员', salary: 4500, hired: true }
    ],
    maintenanceWorkers: [],
    cleaners: [],
    supplyWorkers: [],
    bikeRepairers: [],
    metroDrivers: [],
    hsrDrivers: [],
    hsrAttendants: []
  },

  // 初始车辆
  buses: [
    {
      id: 1,
      modelId: 'yu_tong_e10',
      busType: 'city',
      powerType: 'electric',
      routeId: 'macau_1',
      status: 'running',
      currentStopIndex: 0,
      progress: 0,
      passengers: 0,
      battery: 100,
      fuel: 0,
      cleanliness: 100,
      needsCharge: false,
      needsRefuel: false,
      needsCleaning: false,
      hasEntertainment: false,
      hasWiFi: false,
      direction: 'outbound',
      stopCountdown: 0,
      isAtTerminal: false
    },
    {
      id: 2,
      modelId: 'yu_tong_e10',
      busType: 'city',
      powerType: 'electric',
      routeId: 'macau_1A',
      status: 'running',
      currentStopIndex: 0,
      progress: 0,
      passengers: 0,
      battery: 100,
      fuel: 0,
      cleanliness: 100,
      needsCharge: false,
      needsRefuel: false,
      needsCleaning: false,
      hasEntertainment: false,
      hasWiFi: false,
      direction: 'outbound',
      stopCountdown: 0,
      isAtTerminal: false
    },
    {
      id: 3,
      modelId: 'yu_tong_zk6122h',
      busType: 'coach',
      powerType: 'fuel',
      routeId: 'macau_zhuhai_coach',
      status: 'running',
      currentStopIndex: 0,
      progress: 0,
      passengers: 0,
      battery: 0,
      fuel: 100,
      cleanliness: 100,
      needsCharge: false,
      needsRefuel: false,
      needsCleaning: false,
      hasEntertainment: false,
      hasWiFi: false,
      direction: 'outbound',
      stopCountdown: 0,
      isAtTerminal: false
    }
  ],
  // 新增的士数组
  taxis: [
    {
      id: 1,
      modelId: 'byd_qin_ev',
      powerType: 'electric',
      driverId: 1,
      cityId: 'macau',
      status: 'idle',
      currentRoad: '巴波沙大马路',
      targetRoad: '',
      progress: 0,
      passengers: 0,
      currentFare: 0,
      totalMileage: 0,
      battery: 100,
      fuel: 0,
      cleanliness: 100,
      needsCharge: false,
      needsRefuel: false,
      needsCleaning: false,
      isAtTerminal: false
    },
    {
      id: 2,
      modelId: 'toyota_corolla',
      powerType: 'fuel',
      driverId: 2,
      cityId: 'macau',
      status: 'idle',
      currentRoad: '提督马路',
      targetRoad: '',
      progress: 0,
      passengers: 0,
      currentFare: 0,
      totalMileage: 0,
      battery: 0,
      fuel: 100,
      cleanliness: 100,
      needsCharge: false,
      needsRefuel: false,
      needsCleaning: false,
      isAtTerminal: false
    }
  ],
  planes: [],
  metros: [],
  highSpeedRails: [],

  // 共享单车
  sharedBikes: {
    totalBikes: 10,
    activeRentals: [],
    bikeCondition: 100
  },

  activeRoutes: {
    bus: ['macau_1', 'macau_1A'],
    coach: ['macau_zhuhai_coach'],
    plane: [],
    metro: [],
    hsr: []
  },

  // 财务记录
  financialRecords: [],

  // 设置
  settings: {
    soundEnabled: true,
    notificationsEnabled: true
  }
})

export default createStore({
  state: getInitialState(),

  getters: {
    availableBusDrivers: (state) => {
      const assignedBusCount = state.buses.filter(b => b.routeId && b.busType === 'city').length
      const hiredDriversCount = state.employees.busDrivers.filter(d => d.hired).length
      return hiredDriversCount > assignedBusCount
    },
    availableCoachDrivers: (state) => {
      const assignedCoachCount = state.buses.filter(b => b.routeId && b.busType === 'coach').length
      const hiredDriversCount = state.employees.busDrivers.filter(d => d.hired).length
      const hiredConductorsCount = state.employees.conductors.filter(d => d.hired).length
      return hiredDriversCount > assignedCoachCount && hiredConductorsCount > assignedCoachCount
    },
    availableTaxiDrivers: (state) => {
      const assignedTaxiCount = state.taxis.filter(t => t.driverId).length
      const hiredDriversCount = state.employees.taxiDrivers.filter(d => d.hired).length
      return hiredDriversCount > assignedTaxiCount
    },

    availablePilots: (state) => {
      if (state.companyLevel < 6) return false
      const assignedPlaneCount = state.planes.filter(p => p.routeId).length
      const requiredPilots = assignedPlaneCount * 2
      const hiredPilotsCount = state.employees.pilots.filter(p => p.hired).length
      return hiredPilotsCount >= requiredPilots + 2
    },

    availableFlightAttendants: (state) => {
      if (state.companyLevel < 6) return false
      const assignedPlaneCount = state.planes.filter(p => p.routeId).length
      const requiredAttendants = assignedPlaneCount * 4
      const hiredAttendantsCount = state.employees.flightAttendants.filter(f => f.hired).length
      return hiredAttendantsCount >= requiredAttendants + 4
    },

    availableMetroDrivers: (state) => {
      const assignedMetroCount = state.metros.filter(m => m.routeId).length
      const hiredDriversCount = state.employees.metroDrivers.filter(d => d.hired).length
      return hiredDriversCount > assignedMetroCount
    },

    availableHSRDrivers: (state) => {
      const assignedHSRCount = state.highSpeedRails.filter(h => h.routeId).length
      const requiredDrivers = assignedHSRCount * 2
      const hiredDriversCount = state.employees.hsrDrivers.filter(d => d.hired).length
      return hiredDriversCount >= requiredDrivers + 2
    },

    totalPassengers: (state) => {
      const busPassengers = state.buses.reduce((sum, b) => sum + b.passengers, 0)
      const taxiPassengers = state.taxis.reduce((sum, t) => sum + t.passengers, 0)
      const planePassengers = state.planes.reduce((sum, p) => sum + p.passengers, 0)
      const metroPassengers = state.metros.reduce((sum, m) => sum + m.passengers, 0)
      const hsrPassengers = state.highSpeedRails.reduce((sum, h) => sum + h.passengers, 0)
      return busPassengers + taxiPassengers + planePassengers + metroPassengers + hsrPassengers
    },

    getBusModel: () => (modelId) => {
      return busModels.find(m => m.id === modelId)
    },
    getTaxiModel: () => (modelId) => {
      return taxiModels.find(m => m.id === modelId)
    },
    getPlaneModel: () => (modelId) => {
      return planeModels.find(m => m.id === modelId)
    },
    getMetroModel: () => (modelId) => {
      return metroModels.find(m => m.id === modelId)
    },
    getHSRModel: () => (modelId) => {
      return highSpeedRailModels.find(m => m.id === modelId)
    },
    getRoute: () => (routeId) => {
      const cityPrefix = routeId.split('_')[0]
      return allRoutes[cityPrefix]?.find(r => r.id === routeId) || null
    },
    getCityInfo: () => (cityId) => {
      return cities.find(c => c.id === cityId)
    },
    getCityRoads: () => (cityId) => {
      const city = cities.find(c => c.id === cityId)
      return city?.roads || []
    },

    getBusCanOperate: () => (bus) => {
      return bus && bus.isAtTerminal && bus.status === 'stopped'
    },
    getTaxiCanOperate: () => (taxi) => {
      return !!taxi
    },
    getPlaneCanOperate: () => (plane) => {
      return plane && plane.flightStage === 'docked'
    },
    getRailCanOperate: () => {
      return false
    }
  },

  mutations: {
    SET_INITIAL_STATE(state) {
      Object.assign(state, getInitialState())
    },

    LOAD_STATE(state, savedState) {
      Object.assign(state, savedState)
    },

    ADD_MONEY(state, amount) {
      state.money += amount
      if (amount > 0) {
        state.experience += Math.floor(amount / 20)
      }
    },

    ADD_FINANCIAL_RECORD(state, record) {
      state.financialRecords.unshift({
        ...record,
        timestamp: Date.now()
      })
      if (state.financialRecords.length > 1000) {
        state.financialRecords = state.financialRecords.slice(0, 1000)
      }
    },

    UPDATE_LAST_SAVE_TIME(state) {
      state.lastSaveTime = Date.now()
    },

    UPDATE_LAST_ONLINE_TIME(state) {
      state.lastOnlineTime = Date.now()
    },

    SET_COMPANY_LEVEL(state, level) {
      state.companyLevel = level
    },

    SET_EXPERIENCE(state, exp) {
      state.experience = exp
    },

    SET_EXPERIENCE_TO_NEXT_LEVEL(state, exp) {
      state.experienceToNextLevel = exp
    },

    UNLOCK_CITY(state, cityId) {
      if (!state.unlockedCities.includes(cityId)) {
        state.unlockedCities.push(cityId)
      }
    },

    // 员工相关
    ADD_EMPLOYEE(state, { type, employee }) {
      state.employees[type].push({
        ...employee,
        id: state.employees[type].length + 1,
        hired: true
      })
    },

    // 巴士/长途车相关
    ADD_BUS(state, bus) {
      const model = busModels.find(m => m.id === bus.modelId)
      const initBase = {
        id: state.buses.length + 1,
        status: 'idle',
        currentStopIndex: 0,
        progress: 0,
        passengers: 0,
        cleanliness: 100,
        needsCleaning: false,
        hasEntertainment: false,
        hasWiFi: false,
        direction: 'outbound',
        stopCountdown: 0,
        isAtTerminal: false,
        ...bus,
        busType: model.busType || 'city'
      }
      const initData = model.powerType === 'electric'
        ? { ...initBase, battery: 100, fuel: 0, needsCharge: false, needsRefuel: false }
        : { ...initBase, fuel: 100, battery: 0, needsRefuel: false, needsCharge: false }
      state.buses.push(initData)
    },

    UPDATE_BUS(state, { id, updates }) {
      const bus = state.buses.find(b => b.id === id)
      if (bus) {
        Object.assign(bus, updates)
      }
    },

    // 的士相关
    ADD_TAXI(state, taxi) {
      const model = taxiModels.find(m => m.id === taxi.modelId)
      const initBase = {
        id: state.taxis.length + 1,
        status: 'idle',
        driverId: null,
        cityId: 'macau',
        currentRoad: '',
        targetRoad: '',
        progress: 0,
        passengers: 0,
        currentFare: 0,
        totalMileage: 0,
        cleanliness: 100,
        needsCleaning: false,
        isAtTerminal: false,
        ...taxi
      }
      const initData = model.powerType === 'electric'
        ? { ...initBase, battery: 100, fuel: 0, needsCharge: false, needsRefuel: false, powerType: 'electric' }
        : { ...initBase, fuel: 100, battery: 0, needsRefuel: false, needsCharge: false, powerType: 'fuel' }
      state.taxis.push(initData)
    },

    UPDATE_TAXI(state, { id, updates }) {
      const taxi = state.taxis.find(t => t.id === taxiId)
      if (taxi) {
        Object.assign(taxi, updates)
      }
    },

    // 飞机相关
    ADD_PLANE(state, plane) {
      state.planes.push({
        ...plane,
        id: state.planes.length + 1,
        flightStage: 'docked',
        boardingProgress: 0,
        cleanliness: 100,
        needsCleaning: false
      })
    },

    UPDATE_PLANE(state, { id, updates }) {
      const plane = state.planes.find(p => p.id === id)
      if (plane) {
        Object.assign(plane, updates)
      }
    },

    // 地铁相关
    ADD_METRO(state, metro) {
      state.metros.push({
        ...metro,
        id: state.metros.length + 1,
        status: 'idle',
        currentStopIndex: 0,
        progress: 0,
        passengers: 0,
        cleanliness: 100,
        needsCleaning: false,
        hasWiFi: false,
        stopCountdown: 0
      })
    },

    UPDATE_METRO(state, { id, updates }) {
      const metro = state.metros.find(m => m.id === id)
      if (metro) {
        Object.assign(metro, updates)
      }
    },

    // 高铁相关
    ADD_HIGH_SPEED_RAIL(state, hsr) {
      state.highSpeedRails.push({
        ...hsr,
        id: state.highSpeedRails.length + 1,
        status: 'idle',
        currentStopIndex: 0,
        progress: 0,
        passengers: 0,
        cleanliness: 100,
        needsCleaning: false,
        needsSupplies: false,
        hasEntertainment: false,
        hasWiFi: false,
        stopCountdown: 0
      })
    },

    UPDATE_HIGH_SPEED_RAIL(state, { id, updates }) {
      const hsr = state.highSpeedRails.find(h => h.id === id)
      if (hsr) {
        Object.assign(hsr, updates)
      }
    },

    // 共享单车相关
    UPDATE_SHARED_BIKES(state, updates) {
      Object.assign(state.sharedBikes, updates)
    },

    ADD_BIKE_RENTAL(state, rental) {
      state.sharedBikes.activeRentals.push({
        ...rental,
        id: Date.now()
      })
    },

    REMOVE_BIKE_RENTAL(state, rentalId) {
      state.sharedBikes.activeRentals = state.sharedBikes.activeRentals.filter(
        r => r.id !== rentalId
      )
    },

    // 线路相关
    ADD_ROUTE(state, { type, routeId }) {
      if (!state.activeRoutes[type].includes(routeId)) {
        state.activeRoutes[type].push(routeId)
      }
    }
  },

  actions: {
    saveGame({ state, commit }) {
      try {
        const stateToSave = { ...state }
        stateToSave.lastSaveTime = Date.now()
        const encrypted = encryptData(stateToSave)
        localStorage.setItem('transportTycoonSave', encrypted)
        commit('UPDATE_LAST_SAVE_TIME')
        console.log('游戏已自动保存')
      } catch (error) {
        console.error('保存失败:', error)
      }
    },

    loadGame({ commit, dispatch }) {
      try {
        const saved = localStorage.getItem('transportTycoonSave')
        if (saved) {
          const decrypted = decryptData(saved)
          const offlineTime = Date.now() - decrypted.lastOnlineTime

          if (offlineTime > 60000) {
            const offlineEarnings = calculateOfflineEarnings(decrypted, offlineTime)
            decrypted.money += offlineEarnings.total
            decrypted.experience += Math.floor(offlineEarnings.total / 20)
          }

          decrypted.lastOnlineTime = Date.now()
          commit('LOAD_STATE', decrypted)
          dispatch('checkLevelUp')

          if (offlineTime > 60000) {
            commit('ADD_FINANCIAL_RECORD', {
              type: 'income',
              category: 'offline',
              amount: offlineEarnings.total,
              description: '离线收益'
            })
          }
        }
      } catch (error) {
        console.error('加载失败:', error)
      }
    },

    resetGame({ commit }) {
      localStorage.removeItem('transportTycoonSave')
      commit('SET_INITIAL_STATE')
    },

    checkLevelUp({ state, commit }) {
      while (state.experience >= state.experienceToNextLevel && state.companyLevel < 30) {
        commit('SET_EXPERIENCE', state.experience - state.experienceToNextLevel)
        commit('SET_COMPANY_LEVEL', state.companyLevel + 1)
        commit('SET_EXPERIENCE_TO_NEXT_LEVEL', Math.floor(state.experienceToNextLevel * 1.7))

        const bonus = state.companyLevel * 5000
        commit('ADD_MONEY', bonus)
        commit('ADD_FINANCIAL_RECORD', {
          type: 'income',
          category: 'levelUp',
          amount: bonus,
          description: `升级奖励 - 达到${state.companyLevel}级`
        })
      }
    },

    updateGame({ state, commit, getters, dispatch }) {
      commit('UPDATE_LAST_ONLINE_TIME')

      // 更新城市巴士
      state.buses.filter(b => b.busType === 'city').forEach(bus => {
        if ((bus.status === 'running' || bus.status === 'stopped') && bus.routeId) {
          const updates = updateVehicleProgress(bus, 'bus', getters)
          commit('UPDATE_BUS', { id: bus.id, updates })

          if (updates.earnedMoney) {
            commit('ADD_MONEY', updates.earnedMoney)
            commit('ADD_FINANCIAL_RECORD', {
              type: 'income',
              category: 'bus',
              amount: updates.earnedMoney,
              description: `巴士线路票款收入`
            })
          }

          if (updates.electricityCost) {
            commit('ADD_MONEY', -updates.electricityCost)
            commit('ADD_FINANCIAL_RECORD', {
              type: 'expense',
              category: 'electricity',
              amount: updates.electricityCost,
              description: `巴士运营电费`
            })
          }
        }
      })

      // 更新长途巴士
      state.buses.filter(b => b.busType === 'coach').forEach(bus => {
        if ((bus.status === 'running' || bus.status === 'stopped') && bus.routeId) {
          const updates = updateVehicleProgress(bus, 'coach', getters)
          commit('UPDATE_BUS', { id: bus.id, updates })

          if (updates.earnedMoney) {
            commit('ADD_MONEY', updates.earnedMoney)
            commit('ADD_FINANCIAL_RECORD', {
              type: 'income',
              category: 'coach',
              amount: updates.earnedMoney,
              description: `长途巴士票款收入`
            })
          }

          if (updates.electricityCost) {
            commit('ADD_MONEY', -updates.electricityCost)
            commit('ADD_FINANCIAL_RECORD', {
              type: 'expense',
              category: 'electricity',
              amount: updates.electricityCost,
              description: `长途巴士运营电费`
            })
          }
        }
      })

      // 更新的士
      state.taxis.forEach(taxi => {
        if (taxi.driverId && (taxi.status === 'idle' || taxi.status === 'hasPassenger')) {
          const updates = updateTaxiProgress(taxi, getters)
          commit('UPDATE_TAXI', { id: taxi.id, updates })

          if (updates.earnedMoney) {
            commit('ADD_MONEY', updates.earnedMoney)
            commit('ADD_FINANCIAL_RECORD', {
              type: 'income',
              category: 'taxi',
              amount: updates.earnedMoney,
              description: `的士运营车费收入`
            })
          }

          if (updates.electricityCost) {
            commit('ADD_MONEY', -updates.electricityCost)
            commit('ADD_FINANCIAL_RECORD', {
              type: 'expense',
              category: 'electricity',
              amount: updates.electricityCost,
              description: `的士运营电费`
            })
          }
        }
      })

      // 更新飞机
      if (state.companyLevel >= 6) {
        state.planes.forEach(plane => {
          if (plane.status === 'running' && plane.routeId) {
            const updates = updateVehicleProgress(plane, 'plane', getters)
            commit('UPDATE_PLANE', { id: plane.id, updates })

            if (updates.earnedMoney) {
              commit('ADD_MONEY', updates.earnedMoney)
              commit('ADD_FINANCIAL_RECORD', {
                type: 'income',
                category: 'plane',
                amount: updates.earnedMoney,
                description: `飞行线路票款收入`
              })
            }
          }
        })
      }

      // 更新地铁
      if (state.companyLevel >= 10) {
        state.metros.forEach(metro => {
          if (metro.status === 'running' && metro.routeId) {
            const updates = updateVehicleProgress(metro, 'metro', getters)
            commit('UPDATE_METRO', { id: metro.id, updates })

            if (updates.arrived && updates.electricityCost && updates.electricityCost > 0) {
              commit('ADD_MONEY', -updates.electricityCost)
              commit('ADD_FINANCIAL_RECORD', {
                type: 'expense',
                category: 'electricity',
                amount: updates.electricityCost,
                description: `地铁运营电费 - ${getters.getMetroModel(metro.modelId).name}`
              })
            }

            if (updates.earnedMoney) {
              commit('ADD_MONEY', updates.earnedMoney)
              commit('ADD_FINANCIAL_RECORD', {
                type: 'income',
                category: 'metro',
                amount: updates.earnedMoney,
                description: '地铁线路票款收入'
              })
            }
          }
        })
      }

      //更新高铁
      if (state.companyLevel >= 20) {
        state.highSpeedRails.forEach(hsr => {
          if (hsr.status === 'running' && hsr.routeId) {
            const updates = updateVehicleProgress(hsr, 'hsr', getters)
            commit('UPDATE_HIGH_SPEED_RAIL', { id: hsr.id, updates })

            if (updates.arrived && updates.electricityCost && updates.electricityCost > 0) {
              commit('ADD_MONEY', -updates.electricityCost)
              commit('ADD_FINANCIAL_RECORD', {
                type: 'expense',
                category: 'electricity',
                amount: updates.electricityCost,
                description: `高铁运营电费 - ${getters.getHSRModel(hsr.modelId).name}`
              })
            }

            if (updates.earnedMoney) {
              commit('ADD_MONEY', updates.earnedMoney)
              commit('ADD_FINANCIAL_RECORD', {
                type: 'income',
                category: 'hsr',
                amount: updates.earnedMoney,
                description: '高铁线路票款收入'
              })
            }
          }
        })
      }

      //共享单车租赁逻辑
      if (Math.random() < 0.05 && state.sharedBikes.totalBikes > state.sharedBikes.activeRentals.length) {
        const rentalHours = Math.ceil(Math.random() * 3)
        const availableBikes = state.sharedBikes.totalBikes - state.sharedBikes.activeRentals.length
        if (availableBikes > 0) {
          const cityRoads = getters.getCityRoads(state.unlockedCities[0])
          const randomRoad = cityRoads[Math.floor(Math.random() * cityRoads.length)] || '城市道路'
          
          const rental = {
            startTime: Date.now(),
            hours: rentalHours,
            rate: 5,
            rentalRoad: randomRoad
          }
          commit('ADD_BIKE_RENTAL', rental)
        }
      }

      //结算完成的共享单车租赁
      const now = Date.now()
      state.sharedBikes.activeRentals.forEach(rental => {
        if (now >= rental.startTime + rental.hours * 3600000) {
          const income = rental.hours * rental.rate
          commit('ADD_MONEY', income)
          commit('ADD_FINANCIAL_RECORD', {
            type: 'income',
            category: 'bike',
            amount: income,
            description: `共享单车收入 - ${rental.hours}小时`
          })
          commit('REMOVE_BIKE_RENTAL', rental.id)
        }
      })

      // 每分钟扣除员工工资
      if (Math.random() < 0.005) {
        let totalSalary = 0
        Object.values(state.employees).forEach(type => {
          type.forEach(emp => {
            if (emp.hired) {
              totalSalary += emp.salary / (30 * 24 * 60)
            }
          })
        })

        if (totalSalary > 0) {
          commit('ADD_MONEY', -totalSalary)
          commit('ADD_FINANCIAL_RECORD', {
            type: 'expense',
            category: 'salary',
            amount: totalSalary,
            description: '员工工资'
          })
        }
      }

      dispatch('checkLevelUp')
    },

    refuelBus({ state, commit, getters }, busId) {
      const bus = state.buses.find(b => b.id === busId)
      if (bus && bus.powerType === 'fuel' && bus.isAtTerminal && bus.status === 'stopped') {
        const model = getters.getBusModel(bus.modelId)
        const cost = (100 - bus.fuel) * 3
        if (state.money >= cost) {
          commit('ADD_MONEY', -cost)
          commit('UPDATE_BUS', { id: busId, updates: { fuel: 100, needsRefuel: false } })
          commit('ADD_FINANCIAL_RECORD', {
            type: 'expense',
            category: 'fuel',
            amount: cost,
            description: `巴士加油 - ${model.name}`
          })
          return true
        }
      }
      return false
    },

    chargeBus({ state, commit, getters }, busId) {
      const bus = state.buses.find(b => b.id === busId)
      if (bus && bus.powerType === 'electric' && bus.isAtTerminal && bus.status === 'stopped') {
        const model = getters.getBusModel(bus.modelId)
        const cost = (100 - bus.battery) * 1.2
        if (state.money >= cost) {
          commit('ADD_MONEY', -cost)
          commit('UPDATE_BUS', { id: busId, updates: { battery: 100, needsCharge: false } })
          commit('ADD_FINANCIAL_RECORD', {
            type: 'expense',
            category: 'electricity',
            amount: cost,
            description: `巴士充电 - ${model.name}`
          })
          return true
        }
      }
      return false
    },

    cleanBus({ state, commit, getters }, busId) {
      const bus = state.buses.find(b => b.id === busId)
      if (bus && bus.isAtTerminal && bus.status === 'stopped') {
        const model = getters.getBusModel(bus.modelId)
        const cost = 80
        if (state.money >= cost) {
          commit('ADD_MONEY', -cost)
          commit('UPDATE_BUS', { id: busId, updates: { cleanliness: 100, needsCleaning: false } })
          commit('ADD_FINANCIAL_RECORD', {
            type: 'expense',
            category: 'cleaning',
            amount: cost,
            description: `巴士清洁 - ${model.name}`
          })
          return true
        }
      }
      return false
    },

    refuelTaxi({ state, commit, getters }, taxiId) {
      const taxi = state.taxis.find(t => t.id === taxiId)
      if (taxi && taxi.powerType === 'fuel') {
        const model = getters.getTaxiModel(taxi.modelId)
        const cost = (100 - taxi.fuel) * 2.5
        if (state.money >= cost) {
          commit('ADD_MONEY', -cost)
          commit('UPDATE_TAXI', { id: taxiId, updates: { fuel: 100, needsRefuel: false } })
          commit('ADD_FINANCIAL_RECORD', {
            type: 'expense',
            category: 'fuel',
            amount: cost,
            description: `的士加油 - ${model.name}`
          })
          return true
        }
      }
      return false
    },

    chargeTaxi({ state, commit, getters }, taxiId) {
      const taxi = state.taxis.find(t => t.id === taxiId)
      if (taxi && taxi.powerType === 'electric') {
        const model = getters.getTaxiModel(taxi.modelId)
        const cost = (100 - taxi.battery) * 1
        if (state.money >= cost) {
          commit('ADD_MONEY', -cost)
          commit('UPDATE_TAXI', { id: taxiId, updates: { battery: 100, needsCharge: false } })
          commit('ADD_FINANCIAL_RECORD', {
            type: 'expense',
            category: 'electricity',
            amount: cost,
            description: `的士充电 - ${model.name}`
          })
          return true
        }
      }
      return false
    },

    cleanTaxi({ state, commit, getters }, taxiId) {
      const taxi = state.taxis.find(t => t.id === taxiId)
      if (taxi) {
        const model = getters.getTaxiModel(taxi.modelId)
        const cost = 50
        if (state.money >= cost) {
          commit('ADD_MONEY', -cost)
          commit('UPDATE_TAXI', { id: taxiId, updates: { cleanliness: 100, needsCleaning: false } })
          commit('ADD_FINANCIAL_RECORD', {
            type: 'expense',
            category: 'cleaning',
            amount: cost,
            description: `的士清洁 - ${model.name}`
          })
          return true
        }
      }
      return false
    },

    refuelPlane({ state, commit, getters }, planeId) {
      if (state.companyLevel < 6) return false
      const plane = state.planes.find(p => p.id === planeId)
      if (plane && plane.flightStage === 'docked') {
        const model = getters.getPlaneModel(plane.modelId)
        const cost = (100 - plane.fuel) * 20
        if (state.money >= cost) {
          commit('ADD_MONEY', -cost)
          commit('UPDATE_PLANE', { id: planeId, updates: { fuel: 100, needsRefuel: false } })
          commit('ADD_FINANCIAL_RECORD', {
            type: 'expense',
            category: 'fuel',
            amount: cost,
            description: `飞机加油 - ${model.name}`
          })
          return true
        }
      }
      return false
    },

    cleanPlane({ state, commit, getters }, planeId) {
      if (state.companyLevel < 6) return false
      const plane = state.planes.find(p => p.id === planeId)
      if (plane && plane.flightStage === 'docked') {
        const model = getters.getPlaneModel(plane.modelId)
        const cost = 800
        if (state.money >= cost) {
          commit('ADD_MONEY', -cost)
          commit('UPDATE_PLANE', { id: planeId, updates: { cleanliness: 100, needsCleaning: false } })
          commit('ADD_FINANCIAL_RECORD', {
            type: 'expense',
            category: 'cleaning',
            amount: cost,
            description: `飞机清洁 - ${model.name}`
          })
          return true
        }
      }
      return false
    },

    supplyPlane({ state, commit, getters }, planeId) {
      if (state.companyLevel < 6) return false
      const plane = state.planes.find(p => p.id === planeId)
      if (plane && plane.flightStage === 'docked') {
        const model = getters.getPlaneModel(plane.modelId)
        const cost = 1200
        if (state.money >= cost) {
          commit('ADD_MONEY', -cost)
          commit('UPDATE_PLANE', { id: planeId, updates: { needsSupplies: false } })
          commit('ADD_FINANCIAL_RECORD', {
            type: 'expense',
            category: 'supplies',
            amount: cost,
            description: `飞机补给 - ${model.name}`
          })
          return true
        }
      }
      return false
    },

    buyBus({ state, commit, getters }, modelId) {
      const model = getters.getBusModel(modelId)
      if (model && state.money >= model.price) {
        commit('ADD_MONEY', -model.price)
        commit('ADD_BUS', { modelId, powerType: model.powerType })
        commit('ADD_FINANCIAL_RECORD', {
          type: 'expense',
          category: 'purchase',
          amount: model.price,
          description: `购买巴士 - ${model.name}`
        })
        return true
      }
      return false
    },

    buyTaxi({ state, commit, getters }, modelId) {
      const model = getters.getTaxiModel(modelId)
      if (model && state.money >= model.price) {
        commit('ADD_MONEY', -model.price)
        commit('ADD_TAXI', { modelId, powerType: model.powerType })
        commit('ADD_FINANCIAL_RECORD', {
          type: 'expense',
          category: 'purchase',
          amount: model.price,
          description: `购买的士 - ${model.name}`
        })
        return true
      }
      return false
    },

    buyPlane({ state, commit, getters }, modelId) {
      if (state.companyLevel < 6) return false
      const model = getters.getPlaneModel(modelId)
      if (model && state.money >= model.price) {
        commit('ADD_MONEY', -model.price)
        commit('ADD_PLANE', {
          modelId,
          routeId: null,
          status: 'idle',
          currentPointIndex: 0,
          progress: 0,
          passengers: 0,
          fuel: 100,
          needsRefuel: false,
          needsSupplies: false,
          hasEntertainment: false,
          hasWiFi: false
        })
        commit('ADD_FINANCIAL_RECORD', {
          type: 'expense',
          category: 'purchase',
          amount: model.price,
          description: `购买飞机 - ${model.name}`
        })
        return true
      }
      return false
    },

    buyMetro({ state, commit, getters }, modelId) {
      if (state.companyLevel < 10) return false
      const model = getters.getMetroModel(modelId)
      if (model && state.money >= model.price) {
        commit('ADD_MONEY', -model.price)
        commit('ADD_METRO', {
          modelId,
          routeId: null,
          status: 'idle',
          currentStopIndex: 0,
          progress: 0,
          passengers: 0,
          cleanliness: 100,
          needsCleaning: false,
          hasWiFi: false
        })
        commit('ADD_FINANCIAL_RECORD', {
          type: 'expense',
          category: 'purchase',
          amount: model.price,
          description: `购买地铁 - ${model.name}`
        })
        return true
      }
      return false
    },

    buyHSR({ state, commit, getters }, modelId) {
      if (state.companyLevel < 20) return false
      const model = getters.getHSRModel(modelId)
      if (model && state.money >= model.price) {
        commit('ADD_MONEY', -model.price)
        commit('ADD_HIGH_SPEED_RAIL', {
          modelId,
          routeId: null,
          status: 'idle',
          currentStopIndex: 0,
          progress: 0,
          passengers: 0,
          cleanliness: 100,
          needsCleaning: false,
          needsSupplies: false,
          hasEntertainment: false,
          hasWiFi: false
        })
        commit('ADD_FINANCIAL_RECORD', {
          type: 'expense',
          category: 'purchase',
          amount: model.price,
          description: `购买高铁 - ${model.name}`
        })
        return true
      }
      return false
    },

    hireEmployee({ state, commit }, { type, name, salary }) {
      const costs = {
        busDrivers: 8000,
        taxiDrivers: 6000,
        pilots: 50000,
        flightAttendants: 20000,
        conductors: 10000,
        maintenanceWorkers: 8000,
        cleaners: 5000,
        supplyWorkers: 6000,
        bikeRepairers: 5000,
        metroDrivers: 12000,
        hsrDrivers: 20000,
        hsrAttendants: 15000
      }

      const hiringCost = costs[type] || 5000
      if (state.money >= hiringCost) {
        commit('ADD_MONEY', -hiringCost)
        commit('ADD_EMPLOYEE', {
          type,
          employee: { name, salary, hired: true }
        })
        commit('ADD_FINANCIAL_RECORD', {
          type: 'expense',
          category: 'hiring',
          amount: hiringCost,
          description: `雇佣员工 - ${name}`
        })
        return true
      }
      return false
    },

    unlockCity({ state, commit }, cityId) {
      const cityInfo = cities.find(c => c.id === cityId)
      if (cityInfo && !state.unlockedCities.includes(cityId)) {
        if (state.money >= cityInfo.unlockCost && state.companyLevel >= cityInfo.requiredLevel) {
          commit('ADD_MONEY', -cityInfo.unlockCost)
          commit('UNLOCK_CITY', cityId)
          commit('ADD_FINANCIAL_RECORD', {
            type: 'expense',
            category: 'city',
            amount: cityInfo.unlockCost,
            description: `解锁城市 - ${cityInfo.name}`
          })
          return true
        }
      }
      return false
    },

    buySharedBikes({ state, commit }, quantity) {
      const costPerBike = 800
      const totalCost = quantity * costPerBike
      if (state.money >= totalCost) {
        commit('ADD_MONEY', -totalCost)
        commit('UPDATE_SHARED_BIKES', {
          totalBikes: state.sharedBikes.totalBikes + quantity
        })
        commit('ADD_FINANCIAL_RECORD', {
          type: 'expense',
          category: 'purchase',
          amount: totalCost,
          description: `购买共享单车 - ${quantity}辆`
        })
        return true
      }
      return false
    },

    upgradeVehicle({ state, commit, getters }, { vehicleId, type, upgradeType }) {
      const upgradeCosts = {
        entertainment: 50000,
        wifi: 30000
      }
      const cost = upgradeCosts[upgradeType]
      if (!cost || state.money < cost) return false
      if (type === 'bus') return false

      let vehicle, updateFn
      switch (type) {
        case 'coach':
          vehicle = state.buses.find(b => b.id === vehicleId && b.busType === 'coach')
          updateFn = 'UPDATE_BUS'
          break
        case 'taxi':
          vehicle = state.taxis.find(t => t.id === vehicleId)
          updateFn = 'UPDATE_TAXI'
          break
        case 'plane':
          if (state.companyLevel < 6) return false
          vehicle = state.planes.find(p => p.id === vehicleId)
          updateFn = 'UPDATE_PLANE'
          break
        case 'metro':
          vehicle = state.metros.find(m => m.id === vehicleId)
          updateFn = 'UPDATE_METRO'
          break
        case 'hsr':
          vehicle = state.highSpeedRails.find(h => h.id === vehicleId)
          updateFn = 'UPDATE_HIGH_SPEED_RAIL'
          break
        default:
          return false
      }

      if (vehicle) {
        commit('ADD_MONEY', -cost)
        const updates = {}
        updates[upgradeType === 'entertainment' ? 'hasEntertainment' : 'hasWiFi'] = true
        commit(updateFn, { id: vehicleId, updates })
        commit('ADD_FINANCIAL_RECORD', {
          type: 'expense',
          category: 'upgrade',
          amount: cost,
          description: `车辆升级 - ${upgradeType === 'entertainment' ? '娱乐系统' : 'WiFi'}`
        })
        return true
      }
      return false
    }
  }
})