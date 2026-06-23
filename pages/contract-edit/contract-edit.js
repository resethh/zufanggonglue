// pages/contract-edit/contract-edit.js — 合同模板填写 / 编辑 / 导出
const { getContract, toast } = require('../../utils/db.js');

Page({
  data: {
    contract: null,
    fields: [],      // [{ key, label, placeholder }]
    values: {},      // { key: value }
    bodyText: '',    // 渲染后的正文（可编辑）
    edited: false,   // 用户是否手动改过正文
    loading: true
  },

  onLoad(options) {
    const id = options.id;
    if (!id) {
      toast('参数错误');
      return;
    }
    getContract(id)
      .then((res) => {
        const contract = res.data;
        const fields = contract.fields || [];
        const values = {};
        fields.forEach((f) => (values[f.key] = f.default || ''));
        this.setData({ contract, fields, values, loading: false }, this.render);
      })
      .catch((err) => {
        console.error(err);
        toast('加载失败');
        this.setData({ loading: false });
      });
  },

  // 用模板 body 中的 ${key} 占位符渲染正文
  render() {
    if (this.data.edited) return; // 用户改过正文就不再覆盖
    const { contract, values } = this.data;
    let text = contract.body || '';
    Object.keys(values).forEach((k) => {
      const v = values[k] || `（${this.labelOf(k)}）`;
      text = text.split('${' + k + '}').join(v);
    });
    this.setData({ bodyText: text });
  },

  labelOf(key) {
    const f = this.data.fields.find((x) => x.key === key);
    return f ? f.label : key;
  },

  onFieldInput(e) {
    const key = e.currentTarget.dataset.key;
    const values = Object.assign({}, this.data.values, { [key]: e.detail.value });
    this.setData({ values }, this.render);
  },

  onBodyInput(e) {
    this.setData({ bodyText: e.detail.value, edited: true });
  },

  // 恢复为按字段重新生成
  resetBody() {
    this.setData({ edited: false }, this.render);
    toast('已根据字段重新生成');
  },

  copyAll() {
    wx.setClipboardData({
      data: this.data.bodyText,
      success: () => toast('已复制全文', 'success')
    });
  },

  // 导出为 txt 并用系统组件打开（可转发/另存到「文件」）
  exportFile() {
    const fs = wx.getFileSystemManager();
    const name = (this.data.contract.name || '租房合同').replace(/[\\/:*?"<>|]/g, '');
    const filePath = `${wx.env.USER_DATA_PATH}/${name}.txt`;
    try {
      fs.writeFileSync(filePath, this.data.bodyText, 'utf8');
      wx.openDocument({
        filePath,
        fileType: 'txt',
        showMenu: true,
        fail: (err) => {
          console.error(err);
          toast('打开失败，可改用「复制全文」');
        }
      });
    } catch (err) {
      console.error(err);
      toast('导出失败');
    }
  }
});
