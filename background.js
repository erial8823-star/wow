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

// 检查 Token 是否已绑定
function isTokenBound(tokenId) {
  return localStorage.getItem(`${BINDING_KEY}${tokenId}`) !== null;
}

// 获取绑定的角色卡 ID
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
        // ★★★ 重要：写入 metadata，让右键菜单的 filter 能检测到 ★★★
        item.metadata['com.wow.fu-character/data'] = {
          ...data,
          cardId: cardId
        };

        // Token 下方只显示角色名
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

  // 保存绑定关系到 localStorage
  const bindingData = { type: 'role', cardId, tokenId, data };
  localStorage.setItem(`${BINDING_KEY}${tokenId}`, JSON.stringify(bindingData));

  OBR.notification.show(`✅ 已绑定角色卡: ${data.name}`);
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

// ==================== 所有逻辑在 OBR.onReady 内部 ====================

OBR.onReady(() => {
  console.log('🎯 OBR SDK 已就绪');

  // ---- 监听 Token 选中（左键点击自动打开大卡片） ----
  let popupedTokenId = null;

  // 监听选中变化
  OBR.scene.items.onChange(async (changes) => {
    // 检查是否有选中的 Token
    const selectedItems = await OBR.scene.items.getSelected();
    if (selectedItems.length === 0) return;

    const token = selectedItems[0];
    if (!token || token.type !== 'IMAGE') return;

    // 检查是否已绑定
    if (!isTokenBound(token.id)) return;

    // 防重复弹出
    if (popupedTokenId === token.id) return;
    popupedTokenId = token.id;
    setTimeout(() => { popupedTokenId = null; }, 1000);

    console.log(`🖱️ 点击了已绑定的 Token: ${token.id}`);
    await openCard(token.id);
  });

  // ---- 右键菜单 ----

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

  // 2. 打开角色卡（手动）
  OBR.contextMenu.create({
    id: 'fu-character-extension/open-card',
    icons: [{
      icon: `${base}/assets/icon.png`,
      label: '🃏 打开FU角色卡',
      filter: {
        every: [{ key: 'type', value: 'IMAGE' }]
        // 不在这里用 filter 过滤，在 onClick 中判断
      }
    }],
    onClick: async (context) => {
      const items = context.items;
      if (items.length === 0) return;
      const token = items[0];
      if (!isTokenBound(token.id)) {
        OBR.notification.show('该 Token 未绑定角色卡');
        return;
      }
      await openCard(token.id);
    }
  });

  // 3. 解绑
  OBR.contextMenu.create({
    id: 'fu-character-extension/unbind',
    icons: [{
      icon: `${base}/assets/icon.png`,
      label: '🗑️ 解绑',
      filter: {
        every: [{ key: 'type', value: 'IMAGE' }]
        // 不在这里用 filter 过滤，在 onClick 中判断
      }
    }],
    onClick: async (context) => {
      const items = context.items;
      if (items.length === 0) return;
      const token = items[0];
      if (!isTokenBound(token.id)) {
        OBR.notification.show('该 Token 未绑定角色卡');
        return;
      }

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

      localStorage.removeItem(`${BINDING_KEY}${token.id}`);
      OBR.notification.show('已解绑');
    }
  });

  console.log('✅ 右键菜单已注册');
  console.log('✅ 左键点击已绑定的 Token 将自动打开大卡片');
});