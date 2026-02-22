const TERMINAL_STOP_DURATION = 120
const STOP_DURATION = {
  bus: 20,
  coach: 30,
  metro: 30,
  hsr: { min: 60, max: 120 }
}

const speedMultiplier = {
  bus: 1,
  coach: 0.31,
  metro: 2,
  hsr: 2.5,
  taxi: 1
}

const energyConsumption = {
  city: {
    fuel: 0.12,
    electric: 0.08
  },
  coach: {
    fuel: 0.04,
    electric: 0.03
  },
  taxi: {
    fuel: 0.05,
    electric: 0.03
  }
}

export function calculateOfflineEarnings(state, offlineTime) {
  const maxOfflineTime = 24 * 60 * 60 * 1000
  const effectiveTime = Math.min(offlineTime, maxOfflineTime)
  const hours = effectiveTime / (60 * 60 * 1000)

  let total = 0
  let breakdown = {}

  const busIncome = state.buses
    .filter(b => b.status === 'running' && b.routeId && b.busType === 'city')
    .length * 200 * hours
  if (busIncome > 0) {
    breakdown.bus = busIncome
    total += busIncome
  }

  const coachIncome = state.buses
    .filter(b => b.status === 'running' && b.routeId && b.busType === 'coach')
    .length * 600 * hours
  if (coachIncome > 0) {
    breakdown.coach = coachIncome
    total += coachIncome
  }

  const taxiIncome = state.taxis
    .filter(t => t.driverId && t.status !== 'offline')
    .length * 300 * hours
  if (taxiIncome > 0) {
    breakdown.taxi = taxiIncome
    total += taxiIncome
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

export function updateTaxiProgress(taxi, getters) {
  const updates = {}
  let earnedMoney = 0
  let electricityCost = 0

  const model = getters.getTaxiModel(taxi.modelId)
  const cityRoads = getters.getCityRoads(taxi.cityId)
  if (!model || cityRoads.length === 0) return updates

  const consumeConfig = energyConsumption.taxi
  if (taxi.powerType === 'electric') {
    updates.battery = Math.max(0, (taxi.battery || 100) - consumeConfig.electric)
    if (updates.battery <= 20) {
      updates.needsCharge = true
      updates.status = 'idle'
    }
  } else if (taxi.powerType === 'fuel') {
    updates.fuel = Math.max(0, (taxi.fuel || 100) - consumeConfig.fuel)
    if (updates.fuel <= 20) {
      updates.needsRefuel = true
      updates.status = 'idle'
    }
  }

  updates.cleanliness = Math.max(0, (taxi.cleanliness || 100) - 0.03)
  if (updates.cleanliness <= 30) {
    updates.needsCleaning = true
  }

  if (taxi.status === 'idle' && !taxi.needsCharge && !taxi.needsRefuel) {
    if (Math.random() < 0.3) {
      const passengerCount = Math.floor(Math.random() * 4) + 1
      const startRoad = taxi.currentRoad || cityRoads[Math.floor(Math.random() * cityRoads.length)]
      let targetRoad = cityRoads[Math.floor(Math.random() * cityRoads.length)]
      while (targetRoad === startRoad && cityRoads.length > 1) {
        targetRoad = cityRoads[Math.floor(Math.random() * cityRoads.length)]
      }

      const distance = Math.floor(Math.random() * 10) + 3
      const baseFare = 12
      const extraFare = Math.max(0, distance - 3) * 3
      const totalFare = baseFare + extraFare

      updates.status = 'hasPassenger'
      updates.passengers = passengerCount
      updates.currentRoad = startRoad
      updates.targetRoad = targetRoad
      updates.currentFare = totalFare
      updates.progress = 0
    } else {
      if (Math.random() < 0.1) {
        const newRoad = cityRoads[Math.floor(Math.random() * cityRoads.length)]
        updates.currentRoad = newRoad
      }
    }
  }

  if (taxi.status === 'hasPassenger') {
    const baseSpeed = speedMultiplier.taxi
    const realSpeed = baseSpeed * (0.8 + Math.random() * 0.4)
    updates.progress = (taxi.progress || 0) + realSpeed

    if (updates.progress >= 100) {
      earnedMoney = taxi.currentFare
      updates.status = 'idle'
      updates.currentRoad = taxi.targetRoad
      updates.targetRoad = ''
      updates.passengers = 0
      updates.currentFare = 0
      updates.progress = 0
      updates.totalMileage = (taxi.totalMileage || 0) + Math.floor(Math.random() * 10) + 3
    }
  }

  updates.earnedMoney = earnedMoney
  updates.electricityCost = electricityCost
  return updates
}

export function updateVehicleProgress(vehicle, type, getters) {
  const updates = {}
  let earnedMoney = 0
  let electricityCost = 0

  const modelGetter = {
    bus: 'getBusModel',
    coach: 'getBusModel',
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
      if (Math.random() < 0.3 && vehicle.passengers < model.capacity) {
        const addPassengers = Math.floor(Math.random() * 20)
        const finalAdd = Math.min(addPassengers, model.capacity - vehicle.passengers)
        updates.passengers = vehicle.passengers + finalAdd
        earnedMoney += finalAdd * (route.fare || 10)
        if (vehicle.hasEntertainment) earnedMoney += finalAdd * 1
        if (vehicle.hasWiFi) earnedMoney += finalAdd * 0.5
        if (!vehicle.needsSupplies) earnedMoney += finalAdd * 5
      }

      if (updates.boardingProgress >= BOARDING_FULL) {
        updates.flightStage = 'flying'
        updates.progress = 0
        if (vehicle.fuel <= 20) updates.needsRefuel = true
        if (Math.random() < 0.1) updates.needsSupplies = true
      }
      updates.earnedMoney = earnedMoney
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
      updates.currentPointIndex = ((vehicle.currentPointIndex || 0) + 1) % stops.length
      updates.flightStage = 'docked'
      updates.passengers = Math.floor(vehicle.passengers * 0.2)
      return updates
    }

    return updates
  }

  if (type === 'bus' || type === 'coach') {
    const outboundStops = route.stops?.outbound || []
    const inboundStops = route.stops?.inbound || []
    const currentDirection = vehicle.direction || 'outbound'
    const currentStops = currentDirection === 'outbound' ? outboundStops : inboundStops
    const currentStopIndex = vehicle.currentStopIndex || 0
    const isTerminal = currentStopIndex === 0

    if (vehicle.status === 'stopped') {
      updates.stopCountdown = Math.max(0, (vehicle.stopCountdown || 0) - 1)

      if (updates.stopCountdown <= 0) {
        updates.status = 'running'
        updates.progress = 0
        updates.isAtTerminal = isTerminal
        let nextStopIndex = currentStopIndex + 1
        let nextDirection = currentDirection
        if (nextStopIndex >= currentStops.length) {
          nextDirection = currentDirection === 'outbound' ? 'inbound' : 'outbound'
          nextStopIndex = 0
          updates.direction = nextDirection
          updates.stopCountdown = TERMINAL_STOP_DURATION
          updates.status = 'stopped'
          updates.isAtTerminal = true
        }
        updates.currentStopIndex = nextStopIndex
      }
      return updates
    }

    if (vehicle.status === 'running' && vehicle.routeId) {
      const trafficJamProbability = type === 'bus' ? 0.15 : 0.05
      const isTrafficJam = Math.random() < trafficJamProbability
      const baseSpeed = speedMultiplier[type] || 1
      const realSpeed = isTrafficJam ? baseSpeed * (0.2 + Math.random() * 0.3) : baseSpeed * (0.8 + Math.random() * 0.4)
      updates.progress = (vehicle.progress || 0) + realSpeed

      const busType = vehicle.busType || 'city'
      const consumeConfig = energyConsumption[busType] || energyConsumption.city

      if (vehicle.powerType === 'electric') {
        updates.battery = Math.max(0, (vehicle.battery || 100) - consumeConfig.electric)
        if (updates.battery <= 20) {
          updates.needsCharge = true
        }
      } else if (vehicle.powerType === 'fuel') {
        updates.fuel = Math.max(0, (vehicle.fuel || 100) - consumeConfig.fuel)
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
        updates.progress = 100
        updates.stopCountdown = isTerminal ? TERMINAL_STOP_DURATION : STOP_DURATION[type] || 20
        updates.isAtTerminal = isTerminal

        const maxCapacity = model.capacity || 0
        const alightPassengers = Math.floor(vehicle.passengers * (0.2 + Math.random() * 0.6))
        let remainingPassengers = Math.max(0, vehicle.passengers - alightPassengers)
        const boardPassengers = Math.floor(Math.random() * (maxCapacity - remainingPassengers))
        updates.passengers = remainingPassengers + boardPassengers

        const baseFare = route.fare || 2
        earnedMoney = boardPassengers * baseFare
        if (type === 'coach' && vehicle.hasEntertainment) earnedMoney += boardPassengers * 1
        if (type === 'coach' && vehicle.hasWiFi) earnedMoney += boardPassengers * 0.5

        updates.earnedMoney = earnedMoney
      }
      return updates
    }
  }

  if (type === 'metro' || type === 'hsr') {
    const stops = route.stops.outbound || route.stops
    const currentStopIndex = vehicle.currentStopIndex || 0
    const isStopped = vehicle.status === 'stopped'

    if (isStopped) {
      updates.stopCountdown = Math.max(0, (vehicle.stopCountdown || 0) - 1)
      if (updates.stopCountdown <= 0) {
        updates.status = 'running'
        updates.progress = 0
      }
      return updates
    }

    if (vehicle.status === 'running' && vehicle.routeId) {
      updates.progress = (vehicle.progress || 0) + (speedMultiplier[type] || 1)

      if (Math.random() < 0.2 && vehicle.passengers < model.capacity) {
        const addPassengers = Math.floor(Math.random() * 5)
        const finalAdd = Math.min(addPassengers, model.capacity - vehicle.passengers)
        updates.passengers = vehicle.passengers + finalAdd
        const baseFare = route.fare || 10
        earnedMoney = finalAdd * baseFare
        if (vehicle.hasEntertainment) earnedMoney += finalAdd * 1
        if (vehicle.hasWiFi) earnedMoney += finalAdd * 0.5
        if (type === 'hsr' && !vehicle.needsSupplies) earnedMoney += finalAdd * 2
        updates.earnedMoney = earnedMoney
      }

      const costPerProgress = type === 'metro' ? 0.08 : 0.15
      electricityCost = (speedMultiplier[type] || 1) * costPerProgress
      updates.electricityCost = electricityCost

      updates.cleanliness = Math.max(0, (vehicle.cleanliness || 100) - 0.08)
      if (updates.cleanliness <= 30) {
        updates.needsCleaning = true
      }

      if (updates.progress >= 100) {
        updates.progress = 0
        updates.currentStopIndex = ((vehicle.currentStopIndex || 0) + 1) % stops.length
        updates.status = 'stopped'
        if (type === 'hsr') {
          const { min, max } = STOP_DURATION.hsr
          updates.stopCountdown = Math.floor(Math.random() * (max - min + 1)) + min
        } else {
          updates.stopCountdown = STOP_DURATION.metro
        }

        const alightPassengers = Math.floor(vehicle.passengers * (0.3 + Math.random() * 0.5))
        updates.passengers = Math.max(0, vehicle.passengers - alightPassengers)
      }
      return updates
    }
  }

  return updates
}