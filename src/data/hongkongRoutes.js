export default [
  {
    id: 'hongkong_101',
    name: '101路 🚌',
    city: 'hongkong',
    type: 'bus',
    fare: 12,
    stops: {
      outbound: [
        '坚尼地城',
        '中环',
        '金钟',
        '湾仔',
        '铜锣湾',
        '北角'
      ],
      inbound: [
        '北角',
        '铜锣湾',
        '湾仔',
        '金钟',
        '中环',
        '坚尼地城'
      ]
    },
    requiredLevel: 5
  },
  {
    id: 'hongkong_a11',
    name: 'A11机场巴士 🚌',
    city: 'hongkong',
    type: 'bus',
    fare: 40,
    stops: {
      outbound: [
        '香港国际机场',
        '青衣',
        '旺角',
        '尖沙咀',
        '中环'
      ],
      inbound: [
        '中环',
        '尖沙咀',
        '旺角',
        '青衣',
        '香港国际机场'
      ]
    },
    requiredLevel: 6
  },
  {
    id: 'hongkong_macau_ferry',
    name: '香港→澳门 航线 ✈️',
    city: 'hongkong',
    type: 'plane',
    fare: 1200,
    points: [
      '香港国际机场',
      '澳门国际机场'
    ],
    requiredLevel: 5
  },
  {
    id: 'hongkong_shenzhen',
    name: '香港→深圳 航线 ✈️',
    city: 'hongkong',
    type: 'plane',
    fare: 800,
    points: [
      '香港国际机场',
      '深圳宝安国际机场'
    ],
    requiredLevel: 10
  }
]