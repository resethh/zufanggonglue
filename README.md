# zufanggonglue · 租房攻略小程序

一个基于 **微信小程序 + 云开发** 的租房攻略应用，包含三大模块：

1. **攻略问答（对话机器人）** — 给你看房观察清单：味道/潮湿、噪音/隔音、采光、水电网设施、签约注意等。
   当前为 Mock 规则实现，并结合「避雷库」做 RAG 检索增强（报小区名即可查到相关避雷帖）。
2. **小区避雷** — 用户上传帖子吐槽哪些小区不好，支持按 **城市 / 小区名** 检索；这些帖子同时作为
   对话机器人的 RAG 数据源。
3. **合同模板** — 提供可填写、可编辑、可导出的租房合同模板。模板内置 **「租户 5 天无理由退房」** 条款。

## 目录结构

```
zufanggonglue/
├── app.js / app.json / app.wxss     # 入口、页面与 tabBar、全局样式
├── project.config.json              # 项目配置（appid 占位）
├── sitemap.json
├── utils/db.js                      # 云数据库封装
├── pages/
│   ├── chat/            攻略问答（对话机器人）
│   ├── avoid/           避雷列表 + 城市/小区检索
│   ├── avoid-post/      发布避雷帖
│   ├── avoid-detail/    帖子详情
│   ├── contract/        合同模板列表
│   └── contract-edit/   合同填写 / 编辑 / 导出
└── cloudfunctions/
    ├── chat/            对话云函数（Mock 攻略 + 避雷库 RAG）
    └── seed/            初始化示例数据（避雷帖 + 合同模板）
```

## 运行步骤

1. **安装并打开**：用「微信开发者工具」导入本项目根目录。
2. **填写 AppID**：在 `project.config.json` 把 `appid` 改成你自己的小程序 AppID（测试可用测试号）。
3. **开通云开发**：点击工具栏「云开发」→ 创建一个环境。
   - 若环境 ID 非默认，请在 `app.js` 把 `env: 'DYNAMIC_CURRENT_ENV'` 改成你的环境 ID。
4. **部署云函数**：在 `cloudfunctions/` 下分别右键 `chat`、`seed` → **上传并部署：云端安装依赖**。
5. **初始化数据**：右键 `seed` 云函数 → **云端测试**（或本地调用）执行一次，会写入示例避雷帖与合同模板。
6. **创建数据库索引（可选，建议）**：云开发控制台 → 数据库 → `posts` 集合，为 `city`、`community` 建索引，检索更快。
7. 编译运行，三个 tab 即可使用。

## 数据库集合

- `posts`（避雷帖）：`{ city, community, title, content, author, _openid, createTime }`
- `contracts`（合同模板）：`{ order, name, summary, clauses[], fields[], body }`
  - `body` 用 `${key}` 占位符，前端按 `fields` 填充后渲染，并支持手动编辑。

## 后续接入真实大模型

当前对话为 Mock 规则实现。要接入真实 LLM，只需修改 `cloudfunctions/chat/index.js`：
保留 `ragSearch()` 检索避雷库，把 `buildReply()` 换成调用大模型（如已配置的
`maas.marketingforce.com` / `claude-opus-4-8`），并把检索到的 `posts` 作为上下文一起传入。
返回结构 `{ reply, sources }` 保持不变，前端无需改动。

## 说明

- 本项目的合同模板与攻略内容仅供参考，正式签约请以双方协商及当地法律法规为准。
- 避雷帖请客观真实描述，避免不实信息与人身攻击。
