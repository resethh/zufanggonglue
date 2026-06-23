// cloudfunctions/chat/index.js
// 看房攻略对话机器人（当前为 Mock 实现 + 避雷库 RAG 检索）
// 后续接入真实大模型：把 buildReply 内部换成调用 Claude 端点即可，返回结构保持不变。
const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();
const _ = db.command;

// ① 关键词 -> 看房攻略 知识库（Mock）
const GUIDES = [
  {
    keys: ['味道', '异味', '潮', '潮湿', '霉', '下水道', '烟'],
    title: '👃 气味/潮湿排查',
    points: [
      '进门先深呼吸：霉味、下水道味、刺鼻油漆味（甲醛）都是危险信号。',
      '看墙角、衣柜内壁、天花板是否有水渍/发黑霉斑。',
      '关窗待 2~3 分钟再闻，闷味会被放大。',
      '卫生间地漏、阳台排水口是否返味。'
    ]
  },
  {
    keys: ['噪音', '吵', '隔音', '马路', '地铁', '楼上'],
    title: '🔊 噪音/隔音观察',
    points: [
      '分时段看房：晚高峰、夜间各看一次最真实。',
      '关窗听：临街车流、地铁、广场舞、学校的影响。',
      '敲墙体判断隔音；问清楼上是否有小孩/宠物。',
      '留意是否临近变电站、电梯井、垃圾房。'
    ]
  },
  {
    keys: ['采光', '光线', '朝向', '暗', '阳光'],
    title: '☀️ 采光/朝向',
    points: [
      '正午前后看房判断真实采光，避免被灯光误导。',
      '看对面楼间距，是否会被遮挡。',
      '南向/东南向通常采光通风最佳。'
    ]
  },
  {
    keys: ['水压', '热水', '马桶', '水', '电', '插座', '网络', '信号'],
    title: '🔧 水电网设施',
    points: [
      '打开最高层龙头测水压，冲马桶看下水是否顺畅。',
      '热水器出热水的等待时间。',
      '逐个试插座、灯具开关；看电表/燃气是否独立。',
      '在房间各角落测手机信号与是否能装宽带。'
    ]
  },
  {
    keys: ['合同', '押金', '中介', '退房', '违约', '签约'],
    title: '📝 签约/合同注意',
    points: [
      '核对房东身份证与房产证一致，避免二房东套路。',
      '押金、租期、付款方式、维修责任写清楚。',
      '约定提前退租与退房规则（本程序模板含 5 天无理由退房条款）。',
      '水电燃气网费抄表数留底，物品清单拍照存证。'
    ]
  }
];

const GENERIC = {
  title: '🏠 看房通用清单',
  points: [
    '气味：霉味/下水道味/甲醛味。',
    '噪音：分时段、关窗听临街与楼上。',
    '采光：正午看真实光线与楼间距。',
    '水电：水压、热水、插座、信号、宽带。',
    '安全：门窗锁、消防通道、楼道监控。',
    '合同：房东身份、押金租期、退房规则。'
  ]
};

function formatGuide(g) {
  return g.title + '\n' + g.points.map((p, i) => `${i + 1}. ${p}`).join('\n');
}

function matchGuides(message) {
  const hit = GUIDES.filter((g) => g.keys.some((k) => message.includes(k)));
  if (hit.length === 0) return formatGuide(GENERIC);
  return hit.map(formatGuide).join('\n\n');
}

// 停用词：句子里常见但不是小区/城市名的片段
const STOP = [
  '看房', '注意', '怎么', '什么', '攻略', '合同', '噪音', '味道', '采光',
  '是否', '可以', '这个', '那个', '怎么样', '如何', '咋样', '小区', '房子',
  '租房', '请问', '帮我', '一下', '推荐'
];

// 从一段连续的中文/字母数字串里，生成可能的小区/地名候选：
// 整串 + 2~4 字的滑动子串（覆盖「阳光花园怎么样」这类未分词的输入）
function expandCandidates(run) {
  const set = new Set();
  if (run.length >= 2) set.add(run);
  const max = Math.min(run.length, 4);
  for (let len = max; len >= 2; len--) {
    for (let i = 0; i + len <= run.length; i++) {
      set.add(run.slice(i, i + len));
    }
  }
  return Array.from(set);
}

// ② RAG：从消息中检索避雷库（按小区/城市模糊匹配）
async function ragSearch(message) {
  const runs = message.match(/[一-龥A-Za-z0-9]{2,12}/g) || [];
  const tokens = Array.from(
    new Set(runs.flatMap(expandCandidates))
  ).filter((t) => !STOP.includes(t));
  if (tokens.length === 0) return [];

  const orConds = [];
  tokens.slice(0, 20).forEach((t) => {
    const re = db.RegExp({ regexp: t, options: 'i' });
    orConds.push({ community: re });
    orConds.push({ city: re });
  });

  try {
    const res = await db
      .collection('posts')
      .where(_.or(orConds))
      .orderBy('createTime', 'desc')
      .limit(5)
      .get();
    return res.data || [];
  } catch (err) {
    console.error('rag search failed', err);
    return [];
  }
}

function buildReply(message, sources) {
  let reply = matchGuides(message);
  if (sources.length) {
    const lines = sources
      .map((s) => `· ${s.city} · ${s.community}：${s.title}`)
      .join('\n');
    reply +=
      `\n\n⚠️ 避雷库提示：检索到 ${sources.length} 条相关记录\n` +
      lines +
      '\n（点下方卡片查看详情）';
  }
  return reply;
}

exports.main = async (event) => {
  const message = (event && event.message ? String(event.message) : '').trim();
  if (!message) {
    return { reply: '请问你想了解哪方面的看房攻略呢？', sources: [] };
  }

  const sources = await ragSearch(message);
  const reply = buildReply(message, sources);

  // 仅回传卡片需要的字段
  const slim = sources.map((s) => ({
    _id: s._id,
    city: s.city,
    community: s.community,
    title: s.title
  }));

  return { reply, sources: slim };
};
