// pages/avoid-post/avoid-post.js — 发布避雷帖
const { addPost, toast } = require('../../utils/db.js');

Page({
  data: {
    city: '',
    community: '',
    title: '',
    content: '',
    author: '',
    submitting: false
  },

  onInput(e) {
    this.setData({ [e.currentTarget.dataset.field]: e.detail.value });
  },

  async submit() {
    const { city, community, title, content, author } = this.data;
    if (!city.trim() || !community.trim()) return toast('请填写城市和小区名');
    if (!title.trim()) return toast('请填写标题');
    if (!content.trim()) return toast('请描述具体情况');
    if (this.data.submitting) return;

    this.setData({ submitting: true });
    try {
      await addPost({
        city: city.trim(),
        community: community.trim(),
        title: title.trim(),
        content: content.trim(),
        author: author.trim() || '匿名租客'
      });
      toast('发布成功', 'success');
      setTimeout(() => wx.navigateBack(), 600);
    } catch (err) {
      console.error(err);
      toast('发布失败，请检查云开发是否开通');
    } finally {
      this.setData({ submitting: false });
    }
  }
});
