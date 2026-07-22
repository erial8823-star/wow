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

function isTokenBound(tokenId) {
  return localStorage.getItem(`${BINDING_KEY}${tokenId}`) !== null;
}

function getBoundCardId(tokenId) {
  const binding = localStorage.getItem(`${BINDING_KEY}${tokenId}`);
  if (!binding) return null;
  try {
    const parsed = JSON.parse(binding);
    return parsed.cardId || null;
  } catch (e) {
    return null;
  }
}

// ==================== 打开大卡片 ====================

async function openCard(tokenId) {
  const cardId = getBoundCardId(tokenId);
  if (!cardId) {
    OBR.notification.show('该 Token 未绑定角色卡');
    return;
  }
  OBR.popover.open({
    id: 'fu-card-popover',
    url: `${base}/full-card.html?cardId=${cardId}&tokenId=${tokenId}&t=${Date.now()}`,
    width: 620,
    height: 600
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

  await OBR.scene.items.updateItems([tokenId], (items) => {
    for (let item of items) {
      if (item.type === 'IMAGE') {
        item.metadata['com.wow.fu-character/data'] = {
          ...data,
          cardId: cardId
        };

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

  const bindingData = { type: 'role', cardId, tokenId, data };
  localStorage.setItem(`${BINDING_KEY}${tokenId}`, JSON.stringify(bindingData));

  OBR.notification.show(`✅ 已绑定角色卡: ${data.name}`);
}

// ==================== 解绑函数 ====================

async function unbindToken(tokenId) {
  await OBR.scene.items.updateItems([tokenId], (items) => {
    for (let item of items) {
      if (item.type === 'IMAGE') {
        delete item.metadata['com.wow.fu-character/data'];
        if (item.text) {
          item.text.plainText = item.name || '';
        }
      }
    }
  });

  localStorage.removeItem(`${BINDING_KEY}${tokenId}`);
  OBR.notification.show('已解绑');
}

// ==================== 所有逻辑在 OBR.onReady 内部 ====================

OBR.onReady(() => {
  console.log('🎯 OBR SDK 已就绪');

  // ---- 右键菜单 ----

  // 1. 绑定角色卡（始终显示，仅GM可见）
  OBR.contextMenu.create({
    id: 'fu-character-extension/bind-role',
    icons: [{
      icon: `${base}/assets/icon.png`,
      label: '📋 绑定FU角色卡',
      filter: {
        every: [{ key: 'type', value: 'IMAGE' }]
      },
      roles: ['GM']
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

  // 2. 打开角色卡（始终显示，在 onClick 中判断是否已绑定）
  OBR.contextMenu.create({
    id: 'fu-character-extension/open-card',
    icons: [{
      icon: `${base}/assets/icon.png`,
      label: '🃏 打开FU角色卡',
      filter: {
        every: [{ key: 'type', value: 'IMAGE' }]
      }
    }],
    onClick: async (context) => {
      const items = context.items;
      if (items.length === 0) return;
      const token = items[0];
      if (!isTokenBound(token.id)) {
        OBR.notification.show('该 Token 未绑定角色卡，请先绑定');
        return;
      }
      await openCard(token.id);
    }
  });

  // 3. 解绑（始终显示，在 onClick 中判断是否已绑定）
  OBR.contextMenu.create({
    id: 'fu-character-extension/unbind',
    icons: [{
      icon: `${base}/assets/icon.png`,
      label: '🗑️ 解绑',
      filter: {
        every: [{ key: 'type', value: 'IMAGE' }]
      },
      roles: ['GM']
    }],
    onClick: async (context) => {
      const items = context.items;
      if (items.length === 0) return;
      const token = items[0];
      if (!isTokenBound(token.id)) {
        OBR.notification.show('该 Token 未绑定角色卡');
        return;
      }
      await unbindToken(token.id);
    }
  });

  console.log('✅ 右键菜单已注册：绑定角色卡 | 打开角色卡 | 解绑');
  console.log('💡 提示：打开角色卡和解绑菜单始终可见，点击时会自动检测是否已绑定');
});