export function calculateOfflineEarnings(state, offlineTime) {
  const maxOfflineTime = 24 * 60 * 60 * 1000
  const effectiveTime = Math.min(offlineTime, maxOfflineTime)
  const hours = effectiveTime / (60 * 60 * 1000)

  let total = 0
  let breakdown = {}

  const busIncome = state.buses
    .filter(b => b.status === 'running' && b.routeId)
    .length * 200 * hours
  if (busIncome > 0) {
    breakdown.bus = busIncome
    total += busIncome
  }

  const planeIncome = state.planes
    .filter(p => p.status === 'running' && p.routeId)
    .length * 800 * hours
  if (planeIncome > 0) {
    breakdown.plane = planeIncome
    total += planeIncome
  }

  if (state.companyLevel >= 10) {
    const metroIncome = state.metros
      .filter(m => m.status === 'running' && m.routeId)
      .length * 500 * hours
    const metroElectricityCost = state.metros
      .filter(m => m.status === 'running' && m.routeId)
      .length * 150 * hours
    if (metroIncome > 0) {
      breakdown.metro = metroIncome - metroElectricityCost
      total += (metroIncome - metroElectricityCost)
    }
  }

  if (state.companyLevel >= 20) {
    const hsrIncome = state.highSpeedRails
      .filter(h => h.status === 'running' && h.routeId)
      .length * 1200 * hours
    const hsrElectricityCost = state.highSpeedRails
      .filter(h => h.status === 'running' && h.routeId)
      .length * 400 * hours
    if (hsrIncome > 0) {
      breakdown.hsr = hsrIncome - hsrElectricityCost
      total += (hsrIncome - hsrElectricityCost)
    }
  }

  const bikeIncome = state.sharedBikes.totalBikes * hours
  if (bikeIncome > 0) {
    breakdown.bike = bikeIncome
    total += bikeIncome
  }

  return { total, breakdown }
}

const STOP_DURATION = 20
const speedMultiplier = {
  bus: 1,
  metro: 2,
  hsr: 2.5
}

export function updateVehicleProgress(vehicle, type, getters) {
  const updates = {}
  let earnedMoney = 0
  let electricityCost = 0

  const modelGetter = {
    bus: 'getBusModel',
    plane: 'getPlaneModel',
    metro: 'getMetroModel',
    hsr: 'getHSRModel'
  }

  const model = getters[modelGetter[type]](vehicle.modelId)
  const route = getters.getRoute(vehicle.routeId)

  if (!model || !route) return updates

  if (type === 'plane') {
    const stops = route.points
    const BOARDING_FULL = 100
    const BOARDING_SPEED = 2
    const FLYING_SPEED = 3

    if (vehicle.flightStage === 'docked') {
      updates.passengers = 0
      updates.flightStage = 'boarding'
      updates.boardingProgress = 0
      return updates
    }

    if (vehicle.flightStage === 'boarding') {
      updates.boardingProgress = (vehicle.boardingProgress || 0) + BOARDING_SPEED
      if (Math.random() < 0.2 && vehicle.passengers < model.capacity) {
        const addPassengers = Math.floor(Math.random() * 20)
        updates.passengers = Math.min(vehicle.passengers + addPassengers, model.capacity)
      }

      if (updates.boardingProgress >= BOARDING_FULL) {
        updates.flightStage = 'flying'
        updates.progress = 0
        if (vehicle.fuel <= 20) updates.needsRefuel = true
        if (Math.random() < 0.1) updates.needsSupplies = true
      }
      return updates
    }

    if (vehicle.flightStage === 'flying') {
      updates.progress = (vehicle.progress || 0) + FLYING_SPEED
      updates.fuel = Math.max(0, (vehicle.fuel || 100) - 0.15)
      if (updates.fuel <= 20) {
        updates.needsRefuel = true
      }

      if (updates.progress >= 100) {
        updates.flightStage = 'arrived'
        updates.progress = 0
      }
      return updates
    }

    if (vehicle.flightStage === 'arrived') {
      const baseFare = route.fare || 10
      const passengers = vehicle.passengers || 0
      earnedMoney = passengers * baseFare
      if (vehicle.hasEntertainment) earnedMoney += passengers * 1
      if (vehicle.hasWiFi) earnedMoney += passengers * 0.5
      if (!vehicle.needsSupplies) earnedMoney += passengers * 5

      updates.currentPointIndex = ((vehicle.currentPointIndex || 0) + 1) % stops.length
      updates.flightStage = 'docked'
      updates.passengers = Math.floor(passengers * 0.2)
      updates.earnedMoney = earnedMoney
      return updates
    }

    return updates
  }

  if (type === 'bus') {
    const outboundStops = route.stops?.outbound || []
    const inboundStops = route.stops?.inbound || []
    const currentDirection = vehicle.direction || 'outbound'
    const currentStops = currentDirection === 'outbound' ? outboundStops : inboundStops
    const currentStopIndex = vehicle.currentStopIndex || 0

    if (vehicle.status === 'stopped') {
      updates.stopCountdown = Math.max(0, (vehicle.stopCountdown || 0) - 1)
      

      if (updates.stopCountdown <= 0) {
        updates.status = 'running'
        updates.progress = 0
        updates.isAtTerminal = false

        let nextStopIndex = currentStopIndex + 1
        let nextDirection = currentDirection

        if (nextStopIndex >= currentStops.length) {
          nextDirection = currentDirection === 'outbound' ? 'inbound' : 'outbound'
          nextStopIndex = 0
          updates.direction = nextDirection
        }

        updates.currentStopIndex = nextStopIndex
      }
      return updates
    }

    if (vehicle.status === 'running' && vehicle.routeId) {
      updates.progress = (vehicle.progress || 0) + (speedMultiplier[type] || 1)
      
      if (vehicle.powerType === 'electric') {
        updates.battery = Math.max(0, (vehicle.battery || 100) - 0.08)
        if (updates.battery <= 20) {
          updates.needsCharge = true
        }
      } else if (vehicle.powerType === 'fuel') {
        updates.fuel = Math.max(0, (vehicle.fuel || 100) - 0.12)
        if (updates.fuel <= 20) {
          updates.needsRefuel = true
        }
      }

      updates.cleanliness = Math.max(0, (vehicle.cleanliness || 100) - 0.05)
      if (updates.cleanliness <= 30) {
        updates.needsCleaning = true
      }

      if (updates.progress >= 100) {
        updates.status = 'stopped'
        updates.stopCountdown = STOP_DURATION
        updates.progress = 100
        const isOutboundEnd = currentDirection === 'outbound' && currentStopIndex === outboundStops.length - 1
        const isInboundEnd = currentDirection === 'inbound' && currentStopIndex === inboundStops.length - 1
        updates.isAtTerminal = isOutboundEnd || isInboundEnd
        const maxCapacity = model.capacity || 0
        const alightPassengers = Math.floor(vehicle.passengers * (0.2 + Math.random() * 0.6))
        let remainingPassengers = Math.max(0, vehicle.passengers - alightPassengers)      
        const boardPassengers = Math.floor(Math.random() * (maxCapacity - remainingPassengers))
        updates.passengers = remainingPassengers + boardPassengers
        const baseFare = route.fare || 2
        earnedMoney = alightPassengers * baseFare
        if (vehicle.hasEntertainment) earnedMoney += alightPassengers * 1
        if (vehicle.hasWiFi) earnedMoney += alightPassengers * 0.5
        updates.earnedMoney = earnedMoney
      }
      return updates
    }
  }

  if (type === 'metro' || type === 'hsr') {
    updates.progress = (vehicle.progress || 0) + (speedMultiplier[type] || 1)
    if (Math.random() < 0.2 && vehicle.passengers < model.capacity) {
      updates.passengers = Math.min(vehicle.passengers + Math.floor(Math.random() * 5), model.capacity)
    }

    const costPerProgress = type === 'metro' ? 0.08 : 0.15
    electricityCost = (speedMultiplier[type] || 1) * costPerProgress
    updates.electricityCost = electricityCost

    updates.cleanliness = Math.max(0, (vehicle.cleanliness || 100) - 0.08)
    if (updates.cleanliness <= 30) {
      updates.needsCleaning = true
    }

    const stops = route.stops.outbound || route.stops
    if (updates.progress >= 100) {
      updates.progress = 0
      updates.currentStopIndex = ((vehicle.currentStopIndex || 0) + 1) % stops.length

      // 结算收入
      const baseFare = route.fare || 10
      const passengers = updates.passengers || vehicle.passengers || 0
      earnedMoney = passengers * baseFare
      if (vehicle.hasEntertainment) earnedMoney += passengers * 1
      if (vehicle.hasWiFi) earnedMoney += passengers * 0.5
      if (type === 'hsr' && !vehicle.needsSupplies) earnedMoney += passengers * 2

      updates.passengers = Math.floor(passengers * 0.2)
      updates.earnedMoney = earnedMoney
    }
    return updates
  }

  return updates
}