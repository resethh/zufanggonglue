// utils/db.js — 云数据库封装与通用提示
function getDB() {
  return wx.cloud.database();
}

// 模糊检索避雷帖：支持 city / community 单独或组合，按时间倒序
function searchPosts({ city = '', community = '' } = {}) {
  const db = getDB();
  const _ = db.command;
  const cond = {};
  if (city) cond.city = db.RegExp({ regexp: city, options: 'i' });
  if (community) cond.community = db.RegExp({ regexp: community, options: 'i' });
  return db
    .collection('posts')
    .where(cond)
    .orderBy('createTime', 'desc')
    .limit(50)
    .get();
}

function getPost(id) {
  return getDB().collection('posts').doc(id).get();
}

function addPost(data) {
  return getDB()
    .collection('posts')
    .add({
      data: Object.assign({ createTime: getDB().serverDate() }, data)
    });
}

function getContracts() {
  return getDB().collection('contracts').orderBy('order', 'asc').get();
}

function getContract(id) {
  return getDB().collection('contracts').doc(id).get();
}

function toast(title, icon = 'none') {
  wx.showToast({ title, icon });
}

module.exports = {
  getDB,
  searchPosts,
  getPost,
  addPost,
  getContracts,
  getContract,
  toast
};
