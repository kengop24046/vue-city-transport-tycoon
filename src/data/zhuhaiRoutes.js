export default [
  {
    id: 'zhuhai_1',
    name: '1路 🚌',
    city: 'zhuhai',
    type: 'bus',
    fare: 2,
    stops: {
      outbound: [
        '香洲总站',
        '凤凰北',
        '湾仔沙',
        '吉大',
        '拱北口岸'
      ],
      inbound: [
        '拱北口岸',
        '吉大',
        '湾仔沙',
        '凤凰北',
        '香洲总站'
      ]
    },
    requiredLevel: 3
  },
  {
    id: 'zhuhai_k10',
    name: 'K10快线 🚌',
    city: 'zhuhai',
    type: 'bus',
    fare: 3,
    stops: {
      outbound: [
        '香洲总站',
        '吉大',
        '横琴口岸',
        '长隆'
      ],
      inbound: [
        '长隆',
        '横琴口岸',
        '吉大',
        '香洲总站'
      ]
    },
    requiredLevel: 4
  },
  {
    id: 'zhuhai_macau_short',
    name: '珠海→澳门 短途航线 ✈️',
    city: 'zhuhai',
    type: 'plane',
    fare: 500,
    points: [
      '珠海金湾机场',
      '澳门国际机场'
    ],
    requiredLevel: 3
  }
]