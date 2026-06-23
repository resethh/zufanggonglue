// pages/contract/contract.js — 合同模板列表
const { getContracts, toast } = require('../../utils/db.js');

Page({
  data: {
    contracts: [],
    loading: true,
    loaded: false
  },

  onShow() {
    this.fetch();
  },

  fetch() {
    this.setData({ loading: true });
    getContracts()
      .then((res) => this.setData({ contracts: res.data || [], loading: false, loaded: true }))
      .catch((err) => {
        console.error(err);
        toast('加载失败，请确认已执行 seed 云函数');
        this.setData({ loading: false, loaded: true });
      });
  },

  goEdit(e) {
    wx.navigateTo({
      url: '/pages/contract-edit/contract-edit?id=' + e.currentTarget.dataset.id
    });
  }
});
