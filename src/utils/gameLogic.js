const TERMINAL_STOP_DURATION = 300;
const STOP_DURATION = {
  bus: 30,
  coach: 60,
  metro: 45,
  hsr: { min: 120, max: 300 }
};

const speedMultiplier = {
  bus: 0.8,
  coach: 1.5,
  metro: 1.2,
  hsr: 3,
  taxi: 1,
  plane: 5
};

const BUS_TERMINAL_WHITELIST = {
  macau: ['关闸总站', '妈阁总站', '永宁广场总站', '外港码头总站', '氹仔花城总站', '旅游塔/行车隧道', '路环市区'],
  hongkong: ['坚尼地城', '北角', '香港国际机场', '中环'],
  zhuhai: ['香洲总站', '长隆'],
  guangzhou: ['东山总站', '西关', '体育中心', '天河客运站'],
  shenzhen: ['火车站', '市民中心'],
  shanghai: ['延安西路外滩', '中山公园'],
  beijing: ['四惠枢纽站', '公主坟']
};

const energyConsumption = {
  city: {
    fuel: 0.008,
    electric: 0.006
  },
  coach: {
    fuel: 0.005,
    electric: 0.003
  },
  taxi: {
    fuel: 0.004,
    electric: 0.003
  },
  metro: {
    electric: 120
  },
  hsr: {
    electric: 450
  },
  plane: {
    fuel: 0.002
  }
};

export function calculateOfflineEarnings(state, offlineTime) {
  const maxOfflineTime = 12 * 60 * 60 * 1000;
  const effectiveTime = Math.min(offlineTime, maxOfflineTime);
  const hours = effectiveTime / (60 * 60 * 1000);

  let total = 0;
  let breakdown = {};

  const runningBusCount = state.buses.filter(b => b.status === 'running' && b.routeId && b.busType === 'city').length
  const busIncome = runningBusCount * 300 * hours;
  if (busIncome > 0) {
    breakdown.bus = busIncome;
    total += busIncome;
  }

  const runningCoachCount = state.buses.filter(b => b.status === 'running' && b.routeId && b.busType === 'coach').length
  const coachIncome = runningCoachCount * 1200 * hours;
  if (coachIncome > 0) {
    breakdown.coach = coachIncome;
    total += coachIncome;
  }

  const taxiIncome = state.taxis
    .filter(t => t.driverId && t.status !== 'offline')
    .length * 400 * hours;
  if (taxiIncome > 0) {
    breakdown.taxi = taxiIncome;
    total += taxiIncome;
  }

  const planeIncome = state.planes
    .filter(p => p.status === 'running' && p.routeId)
    .length * 50000 * hours;
  if (planeIncome > 0) {
    breakdown.plane = planeIncome;
    total += planeIncome;
  }

  if (state.companyLevel >= 10) {
    const runningMetroCount = state.metros.filter(m => m.status === 'running' && m.routeId).length
    const metroIncome = runningMetroCount * 8000 * hours;
    const metroElectricityCost = runningMetroCount * 1200 * hours;
    const metroNetIncome = metroIncome - metroElectricityCost;
    if (metroNetIncome > 0) {
      breakdown.metro = metroNetIncome;
      total += metroNetIncome;
    } else if (metroIncome > 0) {
      breakdown.metro = 0;
    }
  }

  if (state.companyLevel >= 20) {
    const runningHsrCount = state.highSpeedRails.filter(h => h.status === 'running' && h.routeId).length
    const hsrIncome = runningHsrCount * 30000 * hours;
    const hsrElectricityCost = runningHsrCount * 8000 * hours;
    const hsrNetIncome = hsrIncome - hsrElectricityCost;
    if (hsrNetIncome > 0) {
      breakdown.hsr = hsrNetIncome;
      total += hsrNetIncome;
    } else if (hsrIncome > 0) {
      breakdown.hsr = 0;
    }
  }

  const bikeIncome = state.sharedBikes.totalBikes * hours * 2;
  if (bikeIncome > 0) {
    breakdown.bike = bikeIncome;
    total += bikeIncome;
  }

  return { total, breakdown };
}

export function updateTaxiProgress(taxi, getters) {
  const updates = {};
  let earnedMoney = 0;
  let electricityCost = 0;
  let fuelCost = 0;

  const model = getters.getTaxiModel(taxi.modelId);
  const cityRoads = getters.getCityRoads(taxi.cityId);
  if (!model || !cityRoads || cityRoads.length === 0) return updates;

  const consumeConfig = energyConsumption.taxi;
  if (taxi.powerType === 'electric') {
    updates.battery = Math.max(0, (taxi.battery || 100) - consumeConfig.electric);
    electricityCost = consumeConfig.electric * 1;
    if (updates.battery <= 20) {
      updates.needsCharge = true;
    }
  } else if (taxi.powerType === 'fuel') {
    updates.fuel = Math.max(0, (taxi.fuel || 100) - consumeConfig.fuel);
    fuelCost = consumeConfig.fuel * 2.5;
    if (updates.fuel <= 20) {
      updates.needsRefuel = true;
    }
  }

  updates.cleanliness = Math.max(0, (taxi.cleanliness || 100) - 0.02);
  if (updates.cleanliness <= 20) {
    updates.needsCleaning = true;
  }

  if (taxi.status === 'idle' && !taxi.needsCharge && !taxi.needsRefuel && !taxi.needsCleaning) {
    if (Math.random() < 0.5) {
      const passengerCount = Math.floor(Math.random() * 4) + 1;
      const startRoad = taxi.currentRoad || cityRoads[Math.floor(Math.random() * cityRoads.length)];
      let targetRoad = cityRoads[Math.floor(Math.random() * cityRoads.length)];
      while (targetRoad === startRoad && cityRoads.length > 1) {
        targetRoad = cityRoads[Math.floor(Math.random() * cityRoads.length)];
      }

      const distance = Math.floor(Math.random() * 10) + 3;
      const baseFare = 13;
      const extraFare = Math.max(0, distance - 3) * 2.3;
      const totalFare = Math.floor(baseFare + extraFare);

      updates.status = 'hasPassenger';
      updates.passengers = passengerCount;
      updates.currentRoad = startRoad;
      updates.targetRoad = targetRoad;
      updates.currentFare = totalFare;
      updates.progress = 0;
    } else {
      if (Math.random() < 0.1) {
        const newRoad = cityRoads[Math.floor(Math.random() * cityRoads.length)];
        updates.currentRoad = newRoad;
      }
    }
  }

  if (taxi.status === 'hasPassenger') {
    const baseSpeed = speedMultiplier.taxi;
    const realSpeed = baseSpeed * (0.8 + Math.random() * 0.4);
    updates.progress = (taxi.progress || 0) + realSpeed;

    if (updates.progress >= 100) {
      earnedMoney = taxi.currentFare;
      updates.status = 'idle';
      updates.currentRoad = taxi.targetRoad;
      updates.targetRoad = '';
      updates.passengers = 0;
      updates.currentFare = 0;
      updates.progress = 0;
      updates.totalMileage = (taxi.totalMileage || 0) + Math.floor(Math.random() * 10) + 3;
    }
  }

  updates.earnedMoney = earnedMoney;
  updates.electricityCost = electricityCost;
  updates.fuelCost = fuelCost;
  return updates;
}

export function updateVehicleProgress(vehicle, type, getters) {
  const updates = {};
  let earnedMoney = 0;
  let electricityCost = 0;
  let fuelCost = 0;

  const modelGetter = {
    bus: 'getBusModel',
    coach: 'getBusModel',
    plane: 'getPlaneModel',
    metro: 'getMetroModel',
    hsr: 'getHSRModel'
  };

  const model = getters[modelGetter[type]](vehicle.modelId);
  const route = getters.getRoute(vehicle.routeId);

  if (!model || !route) return updates;

  if (type === 'plane') {
    const stops = route.points || [];
    const BOARDING_FULL = 100;
    const BOARDING_SPEED = 1;
    const FLYING_SPEED = speedMultiplier.plane;

    if (stops.length === 0) return updates;

    if (vehicle.flightStage === 'docked') {
      updates.passengers = 0;
      updates.flightStage = 'boarding';
      updates.boardingProgress = 0;
      return updates;
    }

    if (vehicle.flightStage === 'boarding') {
      updates.boardingProgress = (vehicle.boardingProgress || 0) + BOARDING_SPEED;
      if (Math.random() < 0.3 && vehicle.passengers < model.capacity * 0.95) {
        const addPassengers = Math.floor(Math.random() * 20);
        const finalAdd = Math.min(addPassengers, model.capacity * 0.95 - vehicle.passengers);
        updates.passengers = (vehicle.passengers || 0) + finalAdd;
        const baseFareIncome = finalAdd * (route.fare || 500);
        const entertainmentIncome = vehicle.hasEntertainment ? finalAdd * 20 : 0;
        const wifiIncome = vehicle.hasWiFi ? finalAdd * 10 : 0;
        const supplyIncome = !vehicle.needsSupplies ? finalAdd * 30 : 0;
        
        earnedMoney += baseFareIncome + entertainmentIncome + wifiIncome + supplyIncome;
      }

      if (updates.boardingProgress >= BOARDING_FULL) {
        updates.flightStage = 'flying';
        updates.progress = 0;
        if (vehicle.fuel <= 20) updates.needsRefuel = true;
        if (Math.random() < 0.1) updates.needsSupplies = true;
      }

      updates.earnedMoney = earnedMoney;
      return updates;
    }

    if (vehicle.flightStage === 'flying') {
      updates.progress = (vehicle.progress || 0) + FLYING_SPEED;
      updates.fuel = Math.max(0, (vehicle.fuel || 100) - energyConsumption.plane.fuel);
      fuelCost = energyConsumption.plane.fuel * 20;
      
      if (updates.fuel <= 10) {
        updates.needsRefuel = true;
      }

      updates.cleanliness = Math.max(0, (vehicle.cleanliness || 100) - 0.03);
      if (updates.cleanliness <= 20) {
        updates.needsCleaning = true;
      }

      if (updates.progress >= 100) {
        updates.flightStage = 'arrived';
        updates.progress = 0;
      }
    }

    if (vehicle.flightStage === 'arrived') {
      updates.currentPointIndex = ((vehicle.currentPointIndex || 0) + 1) % stops.length;
      updates.flightStage = 'docked';
      updates.passengers = Math.floor((vehicle.passengers || 0) * 0.05);
    }

    updates.earnedMoney = earnedMoney;
    updates.fuelCost = fuelCost;
    return updates;
  }

  if (type === 'bus' || type === 'coach') {
    const outboundStops = route.stops?.outbound || [];
    const inboundStops = route.stops?.inbound || [];
    if (outboundStops.length === 0 && inboundStops.length === 0) return updates;

    const currentDirection = vehicle.direction || 'outbound';
    const currentStops = currentDirection === 'outbound' ? outboundStops : inboundStops;
    const currentStopIndex = vehicle.currentStopIndex || 0;
    const currentStopName = currentStops[currentStopIndex] || '';

    const isTerminal = BUS_TERMINAL_WHITELIST[route.city]?.includes(currentStopName) || 
      currentStopIndex === 0 || 
      currentStopIndex === currentStops.length - 1;

    if (vehicle.status === 'stopped') {
      updates.stopCountdown = Math.max(0, (vehicle.stopCountdown || 0) - 1);

      if (updates.stopCountdown <= 0) {
        updates.status = 'running';
        updates.progress = 0;
        updates.isAtTerminal = isTerminal;
        let nextStopIndex = currentStopIndex + 1;
        let nextDirection = currentDirection;

        if (nextStopIndex >= currentStops.length) {
          nextDirection = currentDirection === 'outbound' ? 'inbound' : 'outbound';
          nextStopIndex = 0;
          updates.direction = nextDirection;
          updates.stopCountdown = TERMINAL_STOP_DURATION;
          updates.status = 'stopped';
          
          const reverseStops = nextDirection === 'outbound' ? outboundStops : inboundStops;
          const reverseFirstStopName = reverseStops[0] || '';
          updates.isAtTerminal = BUS_TERMINAL_WHITELIST[route.city]?.includes(reverseFirstStopName) || true;
        }
        updates.currentStopIndex = nextStopIndex;
      }
      return updates;
    }

    if (vehicle.status === 'running' && vehicle.routeId) {
      const trafficJamProbability = type === 'bus' ? 0.2 : 0.05;
      const isTrafficJam = Math.random() < trafficJamProbability;
      const baseSpeed = speedMultiplier[type] || 1;
      const realSpeed = isTrafficJam ? baseSpeed * (0.2 + Math.random() * 0.3) : baseSpeed * (0.8 + Math.random() * 0.4);
      updates.progress = (vehicle.progress || 0) + realSpeed;

      const busType = vehicle.busType || 'city';
      const consumeConfig = energyConsumption[busType] || energyConsumption.city;
      if (vehicle.powerType === 'electric') {
        updates.battery = Math.max(0, (vehicle.battery || 100) - consumeConfig.electric);
        electricityCost = consumeConfig.electric * 1.2;
        if (updates.battery <= 10) {
          updates.needsCharge = true;
        }
      } else if (vehicle.powerType === 'fuel') {
        updates.fuel = Math.max(0, (vehicle.fuel || 100) - consumeConfig.fuel);
        fuelCost = consumeConfig.fuel * 3;
        if (updates.fuel <= 10) {
          updates.needsRefuel = true;
        }
      }

      updates.cleanliness = Math.max(0, (vehicle.cleanliness || 100) - 0.03);
      if (updates.cleanliness <= 20) {
        updates.needsCleaning = true;
      }

      if (updates.progress >= 100) {
        updates.status = 'stopped';
        updates.progress = 100;
        updates.stopCountdown = isTerminal ? TERMINAL_STOP_DURATION : STOP_DURATION[type] || 20;
        updates.isAtTerminal = isTerminal;

        const maxCapacity = model.capacity || 0;
        const alightPassengers = Math.floor((vehicle.passengers || 0) * (0.2 + Math.random() * 0.6));
        let remainingPassengers = Math.max(0, (vehicle.passengers || 0) - alightPassengers);
        const boardPassengers = Math.floor(Math.random() * (maxCapacity - remainingPassengers));
        updates.passengers = remainingPassengers + boardPassengers;

        const baseFare = route.fare || 2;
        earnedMoney = boardPassengers * baseFare;
        if (type === 'coach') {
          if (vehicle.hasEntertainment) earnedMoney += boardPassengers * 5;
          if (vehicle.hasWiFi) earnedMoney += boardPassengers * 2;
        }
      }
    }

    updates.earnedMoney = earnedMoney;
    updates.electricityCost = electricityCost;
    updates.fuelCost = fuelCost;
    return updates;
  }

  if (type === 'metro' || type === 'hsr') {
    const stops = route.stops?.outbound || route.stops || [];
    if (stops.length === 0) return updates;

    const currentStopIndex = vehicle.currentStopIndex || 0;
    const isStopped = vehicle.status === 'stopped';

    if (isStopped) {
      updates.stopCountdown = Math.max(0, (vehicle.stopCountdown || 0) - 1);
      const alightPassengers = Math.floor((vehicle.passengers || 0) * (0.3 + Math.random() * 0.5));
      updates.passengers = Math.max(0, (vehicle.passengers || 0) - alightPassengers);
      
      if (updates.stopCountdown <= 0) {
        updates.status = 'running';
        updates.progress = 0;
      }
      return updates;
    }

    if (vehicle.status === 'running' && vehicle.routeId) {
      updates.progress = (vehicle.progress || 0) + (speedMultiplier[type] || 1);

      if (Math.random() < 0.3 && (vehicle.passengers || 0) < model.capacity * 0.95) {
        const addPassengers = Math.floor(Math.random() * 50);
        const finalAdd = Math.min(addPassengers, model.capacity * 0.95 - (vehicle.passengers || 0));
        updates.passengers = (vehicle.passengers || 0) + finalAdd;
        const baseFare = route.fare || (type === 'metro' ? 5 : 100);
        earnedMoney = finalAdd * baseFare;
        if (vehicle.hasEntertainment) earnedMoney += finalAdd * 10;
        if (vehicle.hasWiFi) earnedMoney += finalAdd * 5;
        if (type === 'hsr' && !vehicle.needsSupplies) earnedMoney += finalAdd * 20;
      }

      updates.cleanliness = Math.max(0, (vehicle.cleanliness || 100) - 0.05);
      if (updates.cleanliness <= 20) {
        updates.needsCleaning = true;
      }

      if (updates.progress >= 100) {
        updates.progress = 0;
        updates.currentStopIndex = ((vehicle.currentStopIndex || 0) + 1) % stops.length;
        updates.status = 'stopped';
        updates.arrived = true;
        electricityCost = energyConsumption[type].electric;

        if (type === 'hsr') {
          const { min, max } = STOP_DURATION.hsr;
          updates.stopCountdown = Math.floor(Math.random() * (max - min + 1)) + min;
        } else {
          updates.stopCountdown = STOP_DURATION.metro;
        }
      }
    }

    updates.earnedMoney = earnedMoney;
    updates.electricityCost = electricityCost;
    return updates;
  }

  return updates;
}