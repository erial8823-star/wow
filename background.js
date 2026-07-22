import OBR from '@owlbear-rodeo/sdk';

console.log('🔥 FU角色卡扩展后台已加载！');

const STORAGE_PREFIX = 'cc-fu-data-';
const BINDING_KEY = 'fu-binding-';
const base = window.location.href.substring(0, window.location.href.lastIndexOf('/'));

// ==================== 工具函数 ====================

function getCardList() {
  const keys = Object.keys(localStorage);
  const ourKeys = keys.filter(k => k.startsWith(STORAGE_PREFIX));
  return ourKeys.map(key => {
    const id = key.slice(STORAGE_PREFIX.length);
    try {
      const data = JSON.parse(localStorage.getItem(key));
      return { id, name: data.name || '未命名' };
    } catch (e) {
      return { id, name: '未知' };
    }
  });
}

// ==================== 绑定函数 ====================

async function bindRoleToToken(tokenId, cardId) {
  const raw = localStorage.getItem(`${STORAGE_PREFIX}${cardId}`);
  if (!raw) {
    OBR.notification.show('角色卡数据不存在');
    return;
  }
  const data = JSON.parse(raw);

  // 更新 Token metadata 和文本标签
  await OBR.scene.items.updateItems([tokenId], (items) => {
    for (let item of items) {
      if (item.type === 'IMAGE') {
        // 存储完整数据到 metadata
        item.metadata['com.wow.fu-character/data'] = {
          ...data,
          cardId: cardId
        };

        // 设置 Token 下方的原生标签：只显示角色名
        if (!item.text) {
          item.text = {
            plainText: '',
            type: 'PLAIN',
            width: 'AUTO',
            height: 'AUTO'
          };
        }
        item.text.plainText = data.name || '角色';
      }
    }
  });

  // 保存绑定关系
  const bindingData = { type: 'role', cardId, tokenId, data };
  localStorage.setItem(`${BINDING_KEY}${tokenId}`, JSON.stringify(bindingData));

  OBR.notification.show(`✅ 已绑定角色卡: ${data.name}`);
}

// ==================== 监听 Token 选中（点击打开大卡片） ====================

// 记录已经弹出卡片的 Token，防止重复弹出
let popupedTokenId = null;

OBR.scene.items.onChange(async (changes) => {
  // 检测选中的 Token
  const selectedItems = await OBR.scene.items.getSelected();
  if (selectedItems.length === 0) return;

  const token = selectedItems[0];
  if (!token || token.type !== 'IMAGE') return;

  const binding = localStorage.getItem(`${BINDING_KEY}${token.id}`);
  if (!binding) return;

  const parsed = JSON.parse(binding);
  if (!parsed.cardId) return;

  // 防止同一个 Token 重复弹出
  if (popupedTokenId === token.id) return;
  popupedTokenId = token.id;
  setTimeout(() => { popupedTokenId = null; }, 1000);

  // 打开大卡片
  OBR.popover.open({
    id: 'fu-card-popover',
    url: `${base}/full-card.html?cardId=${parsed.cardId}&tokenId=${token.id}&t=${Date.now()}`,
    width: 620,
    height: 600
  });
});

// ==================== 注册右键菜单 ====================

OBR.onReady(() => {
  console.log('🎯 OBR SDK 已就绪');

  // 1. 绑定角色卡
  OBR.contextMenu.create({
    id: 'fu-character-extension/bind-role',
    icons: [{
      icon: `${base}/assets/icon.png`,
      label: '📋 绑定FU角色卡',
      filter: {
        every: [{ key: 'type', value: 'IMAGE' }]
      }
    }],
    onClick: async (context) => {
      const items = context.items;
      if (items.length === 0) {
        OBR.notification.show('请选择一个棋子 Token');
        return;
      }
      const token = items[0];
      const cards = getCardList();
      if (cards.length === 0) {
        OBR.notification.show('暂无角色卡，请先导入');
        return;
      }

      OBR.popover.open({
        id: 'com.wow.fu-character/popover',
        url: `${base}/popover.html?bindTokenId=${token.id}&t=${Date.now()}`,
        width: 400,
        height: 600
      });
    }
  });

  // 2. 打开角色卡（手动触发）
  OBR.contextMenu.create({
    id: 'fu-character-extension/open-card',
    icons: [{
      icon: `${base}/assets/icon.png`,
      label: '🃏 打开FU角色卡',
      filter: {
        every: [{ key: 'type', value: 'IMAGE' }],
        some: [{ key: ['metadata', 'com.wow.fu-character/data'], operator: 'EXISTS' }]
      }
    }],
    onClick: async (context) => {
      const items = context.items;
      if (items.length === 0) return;
      const token = items[0];
      const binding = localStorage.getItem(`${BINDING_KEY}${token.id}`);
      if (!binding) {
        OBR.notification.show('该 Token 未绑定角色卡');
        return;
      }
      const parsed = JSON.parse(binding);
      if (!parsed.cardId) {
        OBR.notification.show('未找到绑定的角色卡ID');
        return;
      }
      OBR.popover.open({
        id: 'fu-card-popover',
        url: `${base}/full-card.html?cardId=${parsed.cardId}&tokenId=${token.id}&t=${Date.now()}`,
        width: 620,
        height: 600
      });
    }
  });

  // 3. 解绑
  OBR.contextMenu.create({
    id: 'fu-character-extension/unbind',
    icons: [{
      icon: `${base}/assets/icon.png`,
      label: '🗑️ 解绑',
      filter: {
        every: [{ key: 'type', value: 'IMAGE' }],
        some: [{ key: ['metadata', 'com.wow.fu-character/data'], operator: 'EXISTS' }]
      }
    }],
    onClick: async (context) => {
      const items = context.items;
      if (items.length === 0) return;
      const token = items[0];

      // 清除 metadata 中的角色卡数据
      await OBR.scene.items.updateItems([token.id], (items) => {
        for (let item of items) {
          if (item.type === 'IMAGE') {
            delete item.metadata['com.wow.fu-character/data'];
            if (item.text) {
              item.text.plainText = item.name || '';
            }
          }
        }
      });

      // 清除本地绑定记录
      localStorage.removeItem(`${BINDING_KEY}${token.id}`);
      OBR.notification.show('已解绑');
    }
  });

  console.log('✅ 右键菜单已注册（不含血条组件）');
});