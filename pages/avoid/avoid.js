// pages/avoid/avoid.js — 避雷帖列表 + 检索
const app = getApp();
const { searchPosts, toast } = require('../../utils/db.js');

Page({
  data: {
    city: '',
    community: '',
    posts: [],
    loading: false,
    loaded: false
  },

  onShow() {
    // 从对话页跳转过来时携带的检索词
    const pending = app.globalData && app.globalData.pendingSearch;
    if (pending) {
      this.setData({
        city: pending.city || '',
        community: pending.community || ''
      });
      app.globalData.pendingSearch = null;
    }
    this.fetch();
  },

  onPullDownRefresh() {
    this.fetch(() => wx.stopPullDownRefresh());
  },

  onCityInput(e) {
    this.setData({ city: e.detail.value });
  },

  onCommunityInput(e) {
    this.setData({ community: e.detail.value });
  },

  onSearch() {
    this.fetch();
  },

  onReset() {
    this.setData({ city: '', community: '' }, this.fetch);
  },

  fetch(done) {
    this.setData({ loading: true });
    searchPosts({ city: this.data.city.trim(), community: this.data.community.trim() })
      .then((res) => {
        this.setData({ posts: res.data || [], loading: false, loaded: true });
      })
      .catch((err) => {
        console.error(err);
        toast('加载失败，请确认已开通云开发并执行 seed');
        this.setData({ loading: false, loaded: true });
      })
      .finally(() => done && done());
  },

  goDetail(e) {
    wx.navigateTo({
      url: '/pages/avoid-detail/avoid-detail?id=' + e.currentTarget.dataset.id
    });
  },

  goPost() {
    wx.navigateTo({ url: '/pages/avoid-post/avoid-post' });
  }
});
