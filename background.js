// background.js - 枭熊2扩展后台脚本

import OBR from '@owlbear-rodeo/sdk';
import { DataManager } from './src/core/DataManager.js';
import { TokenBinder } from './src/integration/TokenBinder.js';
import { FullCard } from './src/ui/FullCard.js';

// 扩展的唯一ID（建议用反向域名格式）
const EXTENSION_ID = 'com.fu-character-extension';

let binder = null;

// 等待SDK就绪
OBR.onReady(() => {
  console.log('🎯 FU角色卡扩展后台已启动');
  
  // 初始化Token绑定器
  binder = new TokenBinder();
  
  // 注册右键菜单
  setupContextMenu();
  
  // 监听Token点击事件
  setupTokenClick();
  
  // 监听来自popover的消息
  setupMessageListener();
});

// ---------- 注册右键菜单 ----------
function setupContextMenu() {
  // 获取所有角色卡列表
  const getCardList = () => {
    const keys = Object.keys(localStorage);
    const ourKeys = keys.filter(k => k.startsWith('cc-fu-data-'));
    return ourKeys.map(key => {
      const id = key.slice('cc-fu-data-'.length);
      try {
        const data = JSON.parse(localStorage.getItem(key));
        return { id, name: data.name || '未命名' };
      } catch (e) {
        return { id, name: '未知' };
      }
    });
  };

  // 主菜单：绑定FU角色卡
  OBR.contextMenu.create({
    id: `${EXTENSION_ID}/bind-role`,
    icons: [{
      icon: '/icon.svg',
      label: '📋 绑定FU角色卡',
      filter: {
        every: [{ key: 'type', value: 'TOKEN' }]  // 只在Token上显示
      }
    }],
    onClick: async (context) => {
      // 当用户点击"绑定FU角色卡"时，显示子菜单
      // 由于Context Menu API不支持二级菜单，我们用一个弹窗代替
      const cards = getCardList();
      if (cards.length === 0) {
        OBR.notification.show('暂无角色卡，请先导入');
        return;
      }
      
      // 获取当前选中的Token
      const selected = await OBR.scene.items.getSelected();
      if (!selected || selected.length === 0) {
        OBR.notification.show('请先选择一个Token');
        return;
      }
      
      const token = selected[0];
      // 显示选择列表（用简单的弹窗或通知）
      // 这里简化处理：直接绑定第一张卡
      // 实际应该弹窗让用户选择
      const cardId = cards[0].id;
      bindRoleToToken(token.id, cardId);
      OBR.notification.show(`已绑定角色卡: ${cards[0].name}`);
    }
  });

  // 菜单：绑定FU血条组件
  OBR.contextMenu.create({
    id: `${EXTENSION_ID}/bind-hpbar`,
    icons: [{
      icon: '/icon.svg',
      label: '❤️ 绑定FU血条组件',
      filter: {
        every: [{ key: 'type', value: 'TOKEN' }]
      }
    }],
    onClick: async (context) => {
      const selected = await OBR.scene.items.getSelected();
      if (!selected || selected.length === 0) {
        OBR.notification.show('请先选择一个Token');
        return;
      }
      const token = selected[0];
      bindHpBarToToken(token.id);
      OBR.notification.show('已绑定血条组件');
    }
  });

  // 菜单：解绑
  OBR.contextMenu.create({
    id: `${EXTENSION_ID}/unbind`,
    icons: [{
      icon: '/icon.svg',
      label: '🗑️ 解绑',
      filter: {
        every: [{ key: 'type', value: 'TOKEN' }]
      }
    }],
    onClick: async (context) => {
      const selected = await OBR.scene.items.getSelected();
      if (!selected || selected.length === 0) return;
      const token = selected[0];
      if (binder) {
        binder.unbind(token.id);
        OBR.notification.show('已解绑');
      }
    }
  });

  console.log('✅ 右键菜单已注册');
}

// ---------- 绑定角色卡到Token ----------
function bindRoleToToken(tokenId, cardId) {
  // 获取Token的DOM元素
  const tokenEl = document.querySelector(`[data-token-id="${tokenId}"]`);
  if (!tokenEl) return;
  
  if (!binder) binder = new TokenBinder();
  binder.bindRole(tokenId, tokenEl, cardId);
}

// ---------- 绑定血条组件到Token ----------
function bindHpBarToToken(tokenId) {
  const tokenEl = document.querySelector(`[data-token-id="${tokenId}"]`);
  if (!tokenEl) return;
  
  if (!binder) binder = new TokenBinder();
  binder.bindHpBar(tokenId, tokenEl, {
    name: '测试勇士',
    pd: 8,
    md: 12,
    hp: 75,
    hpMax: 100,
    mp: 40,
    mpMax: 80,
  });
}

// ---------- 监听Token点击 ----------
function setupTokenClick() {
  // 使用OBR的item点击事件
  OBR.scene.items.onChange((items) => {
    // 检查是否有选中的Token
    items.forEach(item => {
      if (item.type === 'TOKEN' && item.selected) {
        // 检查是否绑定了角色卡
        if (binder) {
          const binding = binder.getBinding(item.id);
          if (binding && binding.type === 'role' && binding.cardId) {
            // 打开全屏卡片（在popover中打开）
            const data = DataManager.load(binding.cardId);
            if (data) {
              // 通过postMessage通知popover打开卡片
              // 或者直接在这里打开
              openFullCard(binding.cardId);
            }
          }
        }
      }
    });
  });
}

// ---------- 打开全屏卡片 ----------
function openFullCard(cardId) {
  const data = DataManager.load(cardId);
  if (!data) return;
  
  // 创建卡片并添加到页面
  const card = new FullCard(cardId, data, () => {});
  card.open();
}

// ---------- 监听来自popover的消息 ----------
function setupMessageListener() {
  window.addEventListener('message', (event) => {
    const data = event.data;
    if (data.type === 'fu-open-card' && data.cardId) {
      openFullCard(data.cardId);
    }
    if (data.type === 'fu-import-excel') {
      // 触发文件选择（需要在popover中实现）
      // 或者在这里实现文件上传逻辑
      OBR.notification.show('请使用管理界面的导入功能');
    }
  });
}

console.log('🎯 background.js 已加载');