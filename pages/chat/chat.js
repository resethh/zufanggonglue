// pages/chat/chat.js — 看房攻略对话机器人
const app = getApp();

Page({
  data: {
    messages: [
      {
        role: 'bot',
        text: '你好！我是租房攻略助手 🏠\n问我「看房要注意什么」「卫生间怎么看」，或直接报小区名，我会帮你查避雷库。',
        sources: []
      }
    ],
    input: '',
    sending: false,
    scrollTop: 0,
    quickAsks: ['看房要注意什么', '怎么观察噪音', '异味/潮湿怎么检查', '签合同注意什么']
  },

  onInputChange(e) {
    this.setData({ input: e.detail.value });
  },

  onQuickAsk(e) {
    this.setData({ input: e.currentTarget.dataset.q }, () => this.send());
  },

  async send() {
    const text = (this.data.input || '').trim();
    if (!text || this.data.sending) return;

    const messages = this.data.messages.concat([{ role: 'user', text, sources: [] }]);
    this.setData({ messages, input: '', sending: true }, this.scrollToBottom);

    try {
      const res = await wx.cloud.callFunction({
        name: 'chat',
        data: { message: text }
      });
      const { reply, sources = [] } = res.result || {};
      this.pushBot(reply || '抱歉，我暂时没理解，可以换个说法吗？', sources);
    } catch (err) {
      console.error(err);
      this.pushBot('网络或云函数异常，请确认已上传 chat 云函数并开通云开发。', []);
    } finally {
      this.setData({ sending: false });
    }
  },

  pushBot(text, sources) {
    const messages = this.data.messages.concat([{ role: 'bot', text, sources }]);
    this.setData({ messages }, this.scrollToBottom);
  },

  scrollToBottom() {
    this.setData({ scrollTop: 100000 + this.data.messages.length * 1000 });
  },

  goAvoid(e) {
    const community = e.currentTarget.dataset.community || '';
    // 先暂存检索关键词，再切 tab，确保 avoid 页 onShow 能读到
    app.globalData.pendingSearch = { community };
    wx.switchTab({ url: '/pages/avoid/avoid' });
  }
});
