export default [
  {
    id: 'guangzhou_1',
    name: '1路 🚌',
    city: 'guangzhou',
    type: 'bus',
    fare: 2,
    stops: {
      outbound: [
        '东山总站',
        '烈士陵园',
        '农讲所',
        '北京路',
        '西关'
      ],
      inbound: [
        '西关',
        '北京路',
        '农讲所',
        '烈士陵园',
        '东山总站'
      ]
    },
    requiredLevel: 8
  },
  {
    id: 'guangzhou_b1',
    name: 'B1快速公交 🚌',
    city: 'guangzhou',
    type: 'bus',
    fare: 2,
    stops: {
      outbound: [
        '体育中心',
        '天河城',
        '岗顶',
        '华师',
        '天河客运站'
      ],
      inbound: [
        '天河客运站',
        '华师',
        '岗顶',
        '天河城',
        '体育中心'
      ]
    },
    requiredLevel: 9
  },
  {
    id: 'guangzhou_metro_line1',
    name: '地铁1号线 🚇',
    city: 'guangzhou',
    type: 'metro',
    fare: 3,
    stops: [
      '广州东站',
      '体育中心',
      '体育西路',
      '杨箕',
      '东山口',
      '烈士陵园',
      '农讲所',
      '公园前',
      '西门口',
      '陈家祠',
      '长寿路',
      '黄沙',
      '芳村'
    ],
    requiredLevel: 10
  },
  {
    id: 'guangzhou_shenzhen_hsr',
    name: '广深高铁 🚄',
    city: 'guangzhou',
    type: 'hsr',
    fare: 180,
    stops: [
      '广州南站',
      '庆盛',
      '虎门',
      '光明城',
      '深圳北站'
    ],
    requiredLevel: 20
  }
]