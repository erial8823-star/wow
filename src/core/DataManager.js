// src/core/DataManager.js
// 这个文件的作用：负责把角色数据保存到浏览器里，以及读取出来

// 我们使用 localStorage 来存储数据，它就像浏览器自带的一个小仓库
// 每个角色卡都有一个唯一的 id，我们用这个 id 来存取数据

// 存储时的前缀，用来区分我们这个扩展的数据和其他网站的数据
const STORAGE_PREFIX = 'cc-fu-data-';

// 定义一个“仓库管理员”类
export class DataManager {

  // 1. 保存数据：把角色数据存到仓库里
  //    cardId: 角色的唯一编号（比如用角色名+时间戳）
  //    data: 角色数据对象（就是我们 ExcelParser 解析出来的那个对象）
  static save(cardId, data) {
    try {
      // 把数据转换成 JSON 字符串（因为 localStorage 只能存文本）
      const jsonString = JSON.stringify(data);
      // 存到 localStorage 里，键名是前缀+id
      localStorage.setItem(`${STORAGE_PREFIX}${cardId}`, jsonString);
      console.log(`✅ 角色数据已保存，ID: ${cardId}`);
      return true;
    } catch (error) {
      console.error('❌ 保存数据失败：', error);
      return false;
    }
  }

  // 2. 读取数据：根据 id 从仓库里取出数据
  //    cardId: 角色的唯一编号
  //    返回：角色数据对象，如果没找到则返回 null
  static load(cardId) {
    try {
      const jsonString = localStorage.getItem(`${STORAGE_PREFIX}${cardId}`);
      if (!jsonString) {
        console.warn(`⚠️ 未找到 ID 为 ${cardId} 的数据`);
        return null;
      }
      // 把 JSON 字符串转换回对象
      const data = JSON.parse(jsonString);
      console.log(`📂 已读取角色数据，ID: ${cardId}`);
      return data;
    } catch (error) {
      console.error('❌ 读取数据失败：', error);
      return null;
    }
  }

  // 3. 删除数据：从仓库里移除指定 id 的数据
  //    cardId: 角色的唯一编号
  static delete(cardId) {
    try {
      localStorage.removeItem(`${STORAGE_PREFIX}${cardId}`);
      console.log(`🗑️ 已删除角色数据，ID: ${cardId}`);
      return true;
    } catch (error) {
      console.error('❌ 删除数据失败：', error);
      return false;
    }
  }

  // 4. 列出所有已保存的角色 id
  //    返回：一个数组，包含所有已保存的角色 id
  static listAllIds() {
    try {
      const keys = Object.keys(localStorage);
      // 只找以我们的前缀开头的键
      const ourKeys = keys.filter(key => key.startsWith(STORAGE_PREFIX));
      // 去掉前缀，只保留 id 部分
      const ids = ourKeys.map(key => key.slice(STORAGE_PREFIX.length));
      console.log(`📋 共找到 ${ids.length} 个已保存的角色:`, ids);
      return ids;
    } catch (error) {
      console.error('❌ 列出数据失败：', error);
      return [];
    }
  }

  // 5. 获取所有已保存的角色摘要（用于下拉菜单显示）
  //    返回：一个数组，每个元素包含 { id, name }
  static listSummary() {
    const ids = this.listAllIds();
    const summaries = [];
    for (const id of ids) {
      const data = this.load(id);
      if (data && data.name) {
        summaries.push({
          id: id,
          name: data.name
        });
      }
    }
    return summaries;
  }
}
export default DataManager;