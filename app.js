// app.js — 小程序入口，初始化云开发
App({
  globalData: {
    // 云开发环境 ID。请在微信开发者工具「云开发」控制台创建环境后，
    // 将下面的 env 替换为你的环境 ID（或使用 DYNAMIC_CURRENT_ENV 自动选择默认环境）。
    env: 'DYNAMIC_CURRENT_ENV'
  },

  onLaunch() {
    if (!wx.cloud) {
      console.error('当前基础库版本过低，无法使用云开发能力，请升级到 2.2.3 及以上。');
      return;
    }
    wx.cloud.init({
      env: this.globalData.env,
      traceUser: true
    });
  }
});
