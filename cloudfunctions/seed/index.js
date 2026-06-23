// cloudfunctions/seed/index.js
// 初始化示例数据：避雷帖(posts) + 合同模板(contracts)
// 在云开发控制台「云函数」中右键 -> 云端测试 / 本地调用 执行一次即可。
const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

const SAMPLE_POSTS = [
  {
    city: '杭州',
    community: '阳光花园',
    title: '隔音差，临街夜里货车不断',
    content:
      '住的是临街那栋，晚上 11 点后还有大货车经过，关窗也挡不住。墙体隔音也一般，楼上拖椅子声音清晰。介意噪音的慎选临街户型。',
    author: '匿名租客'
  },
  {
    city: '杭州',
    community: '阳光花园',
    title: '物业响应慢，电梯常坏',
    content: '报修要等好几天，两部电梯经常只开一部，早高峰排队。',
    author: '小张'
  },
  {
    city: '上海',
    community: '梅园新村',
    title: '一楼返潮严重，墙角发霉',
    content: '梅雨季衣柜内壁全是霉点，墙角返潮，除湿机要天天开。低楼层要特别注意。',
    author: '匿名租客'
  },
  {
    city: '北京',
    community: '望京西园',
    title: '中介押一付三还收高额服务费',
    content: '中介费一个月，合同里维修责任全甩给租客，签前一定逐条看清。',
    author: '阿明'
  },
  {
    city: '成都',
    community: '锦江丽景',
    title: '楼下烧烤油烟大',
    content: '夏天晚上楼下大排档油烟直往上飘，窗户不敢开，味道重。',
    author: '匿名租客'
  }
];

// 合同模板：body 中用 ${key} 作为占位符，前端按 fields 填充
const LEASE_BODY = [
  '房屋租赁合同',
  '',
  '出租方（甲方）：${landlord}',
  '承租方（乙方）：${tenant}',
  '',
  '第一条 房屋基本情况',
  '甲方将位于 ${address} 的房屋出租给乙方居住使用。',
  '',
  '第二条 租赁期限',
  '租赁期限自 ${startDate} 起至 ${endDate} 止。',
  '',
  '第三条 租金及支付方式',
  '月租金为人民币 ${rent} 元，支付方式：${payway}。',
  '押金人民币 ${deposit} 元，租赁关系终止且乙方无违约、无欠费时，甲方应予退还。',
  '',
  '第四条 租户五天无理由退房（重点条款）',
  '自本合同签订或乙方实际入住之日（以较早者为准）起 5 个自然日内，乙方有权无理由提出退房。',
  '退房时乙方应保持房屋及屋内设施基本完好，甲方应在 3 个工作日内全额退还已收取的押金及尚未发生的租金；',
  '该 5 日内甲方不得以任何名义扣留押金或收取违约金，实际居住产生的当期租金可按日据实结算。',
  '',
  '第五条 房屋维修与使用',
  '房屋及附属设施的自然损坏由甲方负责维修；因乙方不当使用造成的损坏由乙方负责。',
  '',
  '第六条 违约责任',
  '除第四条约定的无理由退房情形外，任何一方违约的，应向对方支付违约金人民币 ${penalty} 元。',
  '',
  '第七条 其他约定',
  '${extra}',
  '',
  '本合同一式两份，甲乙双方各执一份，自双方签字（盖章）之日起生效。',
  '',
  '甲方（签字）：____________    乙方（签字）：____________',
  '签订日期：____________'
].join('\n');

const CONTRACTS = [
  {
    order: 1,
    name: '标准房屋租赁合同（含5天无理由退房）',
    summary: '适用于个人整租/合租，含租户 5 天无理由退房、押金退还、维修责任等条款。',
    clauses: ['5天无理由退房', '押金退还', '维修责任', '违约责任'],
    fields: [
      { key: 'landlord', label: '出租方', placeholder: '甲方姓名/单位' },
      { key: 'tenant', label: '承租方', placeholder: '乙方姓名' },
      { key: 'address', label: '房屋地址', placeholder: '详细到门牌号' },
      { key: 'startDate', label: '起租日期', placeholder: '如 2026-07-01' },
      { key: 'endDate', label: '到期日期', placeholder: '如 2027-06-30' },
      { key: 'rent', label: '月租金(元)', placeholder: '如 3000' },
      { key: 'payway', label: '支付方式', placeholder: '如 押一付三', default: '押一付三' },
      { key: 'deposit', label: '押金(元)', placeholder: '如 3000' },
      { key: 'penalty', label: '违约金(元)', placeholder: '如 3000' },
      { key: 'extra', label: '其他约定', placeholder: '可留空' }
    ],
    body: LEASE_BODY
  }
];

exports.main = async () => {
  const result = { posts: 0, contracts: 0 };

  // 确保集合存在（已存在会报错，忽略即可）
  for (const name of ['posts', 'contracts']) {
    try {
      await db.createCollection(name);
    } catch (e) {
      /* 集合已存在 */
    }
  }

  for (const p of SAMPLE_POSTS) {
    await db.collection('posts').add({
      data: Object.assign({ createTime: db.serverDate() }, p)
    });
    result.posts++;
  }

  for (const c of CONTRACTS) {
    await db.collection('contracts').add({ data: c });
    result.contracts++;
  }

  return Object.assign({ ok: true }, result);
};
