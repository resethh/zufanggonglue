// pages/avoid-detail/avoid-detail.js — 避雷帖详情
const { getPost, toast } = require('../../utils/db.js');

Page({
  data: {
    post: null,
    loading: true
  },

  onLoad(options) {
    const id = options.id;
    if (!id) {
      toast('参数错误');
      this.setData({ loading: false });
      return;
    }
    getPost(id)
      .then((res) => this.setData({ post: res.data, loading: false }))
      .catch((err) => {
        console.error(err);
        toast('加载失败');
        this.setData({ loading: false });
      });
  }
});
