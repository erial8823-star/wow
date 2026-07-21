// src/integration/TokenBinder.js
// Token 绑定管理器 - 管理所有 Token 的气泡绑定

import { DataManager } from '../core/DataManager.js';
import { TokenBubble } from '../ui/TokenBubble.js';

// 存储绑定关系的 key
const BINDING_KEY = 'fu-token-bindings';

export class TokenBinder {
  constructor() {
    // 绑定关系映射：tokenId -> { type: 'role'|'hpbar', cardId: string, bubble: TokenBubble }
    this.bindings = new Map();
    // 加载已保存的绑定关系
    this._loadBindings();
  }

  // ---------- 绑定角色卡 ----------
  bindRole(tokenId, tokenElement, cardId) {
    // 如果已有绑定，先清除
    this.unbind(tokenId);

    const data = DataManager.load(cardId);
    if (!data) {
      console.error(`❌ 未找到角色卡 ${cardId}`);
      return false;
    }

    // 创建气泡
    const bubble = new TokenBubble({
      type: 'role',
      tokenId: tokenId,
      tokenElement: tokenElement,
      data: data,
      cardId: cardId,
      isRoleCard: true,
    });

    // 存储绑定关系
    this.bindings.set(tokenId, {
      type: 'role',
      cardId: cardId,
      tokenElement: tokenElement,
      bubble: bubble,
    });

    // 保存到 localStorage
    this._saveBindings();

    console.log(`✅ Token ${tokenId} 已绑定角色卡: ${data.name}`);
    return true;
  }

  // ---------- 绑定血条组件（独立） ----------
  bindHpBar(tokenId, tokenElement, initialData) {
    // 如果已有绑定，先清除
    this.unbind(tokenId);

    // 如果没有传入初始数据，使用默认值
    const data = initialData || {
      name: '未命名',
      pd: 0,
      md: 0,
      hp: 50,
      hpMax: 100,
      mp: 30,
      mpMax: 80,
    };

    // 创建气泡
    const bubble = new TokenBubble({
      type: 'hpbar',
      tokenId: tokenId,
      tokenElement: tokenElement,
      data: data,
      cardId: null,
      isRoleCard: false,
    });

    // 存储绑定关系
    this.bindings.set(tokenId, {
      type: 'hpbar',
      tokenElement: tokenElement,
      bubble: bubble,
      data: data,
    });

    // 保存到 localStorage
    this._saveBindings();

    console.log(`✅ Token ${tokenId} 已绑定血条组件`);
    return true;
  }

  // ---------- 解绑 ----------
  unbind(tokenId) {
    const binding = this.bindings.get(tokenId);
    if (binding) {
      binding.bubble?.destroy();
      this.bindings.delete(tokenId);
      this._saveBindings();
      console.log(`🗑️ Token ${tokenId} 已解绑`);
      return true;
    }
    return false;
  }

  // ---------- 获取绑定 ----------
  getBinding(tokenId) {
    return this.bindings.get(tokenId) || null;
  }

  // ---------- 获取气泡 ----------
  getBubble(tokenId) {
    const binding = this.bindings.get(tokenId);
    return binding?.bubble || null;
  }

  // ---------- 更新数据 ----------
  updateData(tokenId, newData) {
    const binding = this.bindings.get(tokenId);
    if (!binding) return false;
    binding.bubble?.updateData(newData);
    if (binding.type === 'hpbar') {
      binding.data = newData;
    }
    this._saveBindings();
    return true;
  }

  // ---------- 持久化 ----------
  _saveBindings() {
    const saveData = [];
    for (const [tokenId, binding] of this.bindings) {
      saveData.push({
        tokenId: tokenId,
        type: binding.type,
        cardId: binding.cardId || null,
        data: binding.data || null,
      });
    }
    try {
      localStorage.setItem(BINDING_KEY, JSON.stringify(saveData));
    } catch (e) {
      console.warn('保存绑定关系失败:', e);
    }
  }

  _loadBindings() {
    // 绑定关系在页面刷新后需要重新创建，这里只做记录
    // 实际恢复由外部调用者处理
    try {
      const raw = localStorage.getItem(BINDING_KEY);
      if (raw) {
        const data = JSON.parse(raw);
        console.log(`📂 加载到 ${data.length} 条绑定记录，等待恢复...`);
        // 存储到临时变量，供外部恢复使用
        this._savedBindings = data;
      }
    } catch (e) {
      console.warn('加载绑定关系失败:', e);
    }
  }

  // ---------- 恢复所有绑定（页面刷新后调用） ----------
  restoreAllBindings(findTokenFn) {
    if (!this._savedBindings || this._savedBindings.length === 0) return;

    let restored = 0;
    for (const record of this._savedBindings) {
      const tokenElement = findTokenFn(record.tokenId);
      if (!tokenElement) {
        console.warn(`⚠️ 未找到 Token ${record.tokenId}，跳过恢复`);
        continue;
      }

      if (record.type === 'role' && record.cardId) {
        const data = DataManager.load(record.cardId);
        if (data) {
          this.bindRole(record.tokenId, tokenElement, record.cardId);
          restored++;
        }
      } else if (record.type === 'hpbar' && record.data) {
        this.bindHpBar(record.tokenId, tokenElement, record.data);
        restored++;
      }
    }

    console.log(`✅ 恢复了 ${restored} 个气泡绑定`);
  }

  // ---------- 获取所有绑定的摘要 ----------
  getSummary() {
    const result = [];
    for (const [tokenId, binding] of this.bindings) {
      result.push({
        tokenId: tokenId,
        type: binding.type,
        name: binding.bubble?.getData()?.name || '未命名',
      });
    }
    return result;
  }
}