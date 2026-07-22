import OBR from '@owlbear-rodeo/sdk';

console.log('🔥 FU角色卡扩展后台已加载！');

const STORAGE_PREFIX = 'cc-fu-data-';
const BINDING_KEY = 'fu-binding-';
const LOCK_KEY = 'fu-lock-';
const base = window.location.href.substring(0, window.location.href.lastIndexOf('/'));

const ICON_BASE64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';

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

async function isGM() {
  const role = await OBR.player.getRole();
  return role === 'GM';
}

// ==================== 气泡存储 ====================
const bubbleContainers = new Map();

// ==================== 气泡注入核心 ====================

async function injectBubble(tokenId, data, cardId) {
  const old = bubbleContainers.get(tokenId);
  if (old) {
    old.container.remove();
    if (old.cleanup) old.cleanup();
    bubbleContainers.delete(tokenId);
  }

  const items = await OBR.scene.items.getItems([tokenId]);
  if (items.length === 0) {
    console.warn('Token不存在:', tokenId);
    return;
  }
  const token = items[0];

  let isLocked = false;
  try {
    const lockData = JSON.parse(localStorage.getItem(`${LOCK_KEY}${tokenId}`));
    isLocked = lockData?.locked || false;
  } catch (e) {}

  const gm = await isGM();
  const showHidden = !gm && isLocked;

  const displayHp = showHidden ? '??' : data.hp;
  const displayHpMax = showHidden ? '??' : data.hpMax;
  const displayMp = showHidden ? '??' : data.mp;
  const displayMpMax = showHidden ? '??' : data.mpMax;
  const displayPd = showHidden ? '??' : data.pd;
  const displayMd = showHidden ? '??' : data.md;

  const hpPercent = data.hpMax > 0 ? Math.min((data.hp / data.hpMax) * 100, 100) : 0;
  const mpPercent = data.mpMax > 0 ? Math.min((data.mp / data.mpMax) * 100, 100) : 0;

  function shieldBlue(value) {
    return `<svg viewBox="0 0 28 28" style="width:20px;height:20px;display:block;"><path d="M14 2L3 7.5v8c0 6.5 11 12.5 11 12.5s11-6 11-12.5v-8L14 2z" fill="#3498db" stroke="#2980b9" stroke-width="1.5"/><text x="14" y="18" text-anchor="middle" font-size="12" font-weight="bold" fill="white">${value}</text></svg>`;
  }
  function shieldPurple(value) {
    return `<svg viewBox="0 0 28 28" style="width:20px;height:20px;display:block;"><path d="M14 2L3 7.5v8c0 6.5 11 12.5 11 12.5s11-6 11-12.5v-8L14 2z" fill="#9b59b6" stroke="#8e44ad" stroke-width="1.5"/><text x="14" y="18" text-anchor="middle" font-size="12" font-weight="bold" fill="white">${value}</text></svg>`;
  }

  const lockIcon = isLocked ? '🔒' : '🔓';

  const container = document.createElement('div');
  container.className = 'fu-token-bubble-container';
  container.dataset.tokenId = tokenId;
  container.style.cssText = `
    position: fixed;
    pointer-events: none;
    z-index: 9998;
    opacity: 0;
    transition: opacity 0.25s ease;
    display: flex;
    flex-direction: column;
    align-items: center;
    font-family: 'Segoe UI', system-ui, sans-serif;
    overflow: visible;
  `;

  container.innerHTML = `
    <div style="position:relative;width:100%;aspect-ratio:1/1;pointer-events:auto;cursor:pointer;border-radius:50%;background:radial-gradient(circle at 35% 35%,#4a2a6a,#1a0a2a);border:2px solid #f0c060;box-shadow:0 0 20px rgba(240,192,96,0.12);overflow:visible;">
      <div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);font-size:24px;font-weight:bold;color:#f0c060;line-height:1;user-select:none;">👤</div>
      <div style="position:absolute;bottom:-4px;right:2px;display:flex;gap:0;align-items:flex-end;max-width:55%;max-height:55%;font-size:0;">
        <div style="width:20px;height:20px;display:inline-flex;align-items:center;justify-content:center;font-size:initial;">${shieldBlue(displayPd)}</div>
        <div style="width:20px;height:20px;display:inline-flex;align-items:center;justify-content:center;font-size:initial;">${shieldPurple(displayMd)}</div>
        <div style="width:16px;height:16px;display:inline-flex;align-items:center;justify-content:center;font-size:10px;cursor:pointer;color:#f0c060;margin-left:2px;opacity:0.7;" class="fu-lock-btn">${lockIcon}</div>
      </div>
    </div>
    <div style="width:100%;padding-top:1px;display:flex;flex-direction:column;gap:1.5px;">
      <div style="position:relative;height:5px;min-height:3px;background:rgba(20,20,40,0.85);border-radius:3px;overflow:hidden;border:0.5px solid rgba(255,255,255,0.06);width:100%;">
        <div style="height:100%;border-radius:3px;transition:width 0.3s ease;background:linear-gradient(90deg,#c0392b,#e74c3c);width:${hpPercent}%;"></div>
        <span style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);font-size:6.5px;font-weight:bold;color:#fff;text-shadow:0 1px 4px rgba(0,0,0,0.95);white-space:nowrap;letter-spacing:0.2px;line-height:1;">HP ${displayHp}/${displayHpMax}</span>
      </div>
      <div style="position:relative;height:5px;min-height:3px;background:rgba(20,20,40,0.85);border-radius:3px;overflow:hidden;border:0.5px solid rgba(255,255,255,0.06);width:100%;">
        <div style="height:100%;border-radius:3px;transition:width 0.3s ease;background:linear-gradient(90deg,#2471a3,#5dade2);width:${mpPercent}%;"></div>
        <span style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);font-size:6.5px;font-weight:bold;color:#fff;text-shadow:0 1px 4px rgba(0,0,0,0.95);white-space:nowrap;letter-spacing:0.2px;line-height:1;">MP ${displayMp}/${displayMpMax}</span>
      </div>
    </div>
    <div style="width:100%;text-align:center;font-size:10px;font-weight:600;color:#f0c060;letter-spacing:0.5px;padding-top:1px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;line-height:1.3;text-shadow:0 1px 6px rgba(0,0,0,0.8);flex-shrink:0;">${data.name}</div>
  `;

  document.body.appendChild(container);

  async function updatePosition() {
    const items = await OBR.scene.items.getItems([tokenId]);
    if (items.length === 0) {
      container.remove();
      bubbleContainers.delete(tokenId);
      return;
    }
    const token = items[0];
    const { x, y } = token.position;

    try {
      const screenPos = await OBR.viewport.convertSceneToScreen({ x, y });
      const tokenScreenX = screenPos.x;
      const tokenScreenY = screenPos.y;

      const tokenWidth = token.width || 1;
      const pixelSize = await OBR.viewport.convertSceneToScreen({ x: tokenWidth, y: 0 });
      const pixelWidth = Math.max(pixelSize.x, 30);

      const diameter = pixelWidth * 1.2;
      const containerWidth = diameter;
      const containerHeight = diameter + diameter * 0.7;

      const left = tokenScreenX - containerWidth / 2;
      const top = tokenScreenY - containerHeight + 10;

      container.style.left = left + 'px';
      container.style.top = top + 'px';
      container.style.width = containerWidth + 'px';
      container.style.height = containerHeight + 'px';
      container.style.opacity = '1';
    } catch (e) {
      console.warn('坐标转换失败:', e);
    }
  }

  const onChangeUnsubscribe = OBR.scene.items.onChange((changes) => {
    for (const change of changes) {
      if (change.item.id === tokenId && change.changes.position) {
        updatePosition();
      }
    }
  });

  const viewportUnsubscribe = OBR.viewport.onChange(() => {
    updatePosition();
  });

  container._cleanup = () => {
    onChangeUnsubscribe();
    viewportUnsubscribe();
  };

  const lockBtn = container.querySelector('.fu-lock-btn');
  if (lockBtn) {
    lockBtn.addEventListener('click', async (e) => {
      e.stopPropagation();
      if (!(await isGM())) {
        OBR.notification.show('只有GM可以切换锁定状态');
        return;
      }
      isLocked = !isLocked;
      localStorage.setItem(`${LOCK_KEY}${tokenId}`, JSON.stringify({ locked: isLocked }));
      lockBtn.textContent = isLocked ? '🔒' : '🔓';
      
      // 更新metadata中的锁状态
      await OBR.scene.items.updateItems([tokenId], (items) => {
        for (let item of items) {
          if (item.type === 'IMAGE' && item.metadata['com.wow.fu-character/data']) {
            item.metadata['com.wow.fu-character/data'].isLocked = isLocked;
          }
        }
      });
      
      // 刷新气泡
      const bindingData = JSON.parse(localStorage.getItem(`${BINDING_KEY}${tokenId}`));
      if (bindingData) {
        const cardData = bindingData.cardId 
          ? JSON.parse(localStorage.getItem(`${STORAGE_PREFIX}${bindingData.cardId}`))
          : bindingData.data;
        if (cardData) {
          cardData.isLocked = isLocked;
          await injectBubble(tokenId, cardData, bindingData.cardId);
        }
      }
    });
  }

  const avatarDiv = container.querySelector('div[style*="border-radius:50%"]');
  if (avatarDiv) {
    avatarDiv.addEventListener('click', async () => {
      if (cardId) {
        OBR.popover.open({
          id: 'fu-card-popover',
          url: `${base}/full-card.html?cardId=${cardId}&tokenId=${tokenId}&t=${Date.now()}`,
          width: 620,
          height: 600
        });
      } else {
        alert(`📊 ${data.name}\nHP: ${data.hp}/${data.hpMax}\nMP: ${data.mp}/${data.mpMax}\n物防: ${data.pd}\n魔防: ${data.md}`);
      }
    });
  }

  const bindingData = { type: cardId ? 'role' : 'hpbar', cardId, tokenId, data };
  localStorage.setItem(`${BINDING_KEY}${tokenId}`, JSON.stringify(bindingData));

  bubbleContainers.set(tokenId, { container, tokenId, cardId, updatePosition, cleanup: container._cleanup });

  await updatePosition();
  console.log(`✅ 气泡已注入到Token: ${tokenId}`);
  return container;
}

// ==================== 绑定函数 ====================

async function bindRoleToToken(tokenId, cardId) {
  const raw = localStorage.getItem(`${STORAGE_PREFIX}${cardId}`);
  if (!raw) {
    OBR.notification.show('角色卡数据不存在');
    return;
  }
  const data = JSON.parse(raw);
  if (data.isLocked === undefined) data.isLocked = false;
  await injectBubble(tokenId, data, cardId);
  await OBR.scene.items.updateItems([tokenId], (items) => {
    for (let item of items) {
      if (item.type === 'IMAGE') {
        if (!item.text) {
          item.text = { plainText: '', type: 'PLAIN', width: 'AUTO', height: 'AUTO' };
        }
        item.text.plainText = data.name || '角色';
        item.metadata['com.wow.fu-character/data'] = {
          ...data,
          cardId: cardId
        };
      }
    }
  });
  OBR.notification.show(`✅ 已绑定角色卡: ${data.name}`);
}

async function bindHpBarToToken(tokenId) {
  const data = { 
    name: '测试勇士', 
    pd: 8, 
    md: 12, 
    hp: 75, 
    hpMax: 100, 
    mp: 40, 
    mpMax: 80,
    isLocked: false
  };
  await injectBubble(tokenId, data, null);
  await OBR.scene.items.updateItems([tokenId], (items) => {
    for (let item of items) {
      if (item.type === 'IMAGE') {
        if (!item.text) {
          item.text = { plainText: '', type: 'PLAIN', width: 'AUTO', height: 'AUTO' };
        }
        item.text.plainText = data.name;
        item.metadata['com.wow.fu-character/data'] = data;
      }
    }
  });
  OBR.notification.show('✅ 已绑定默认血条');
}

// ==================== 检查并恢复气泡 ====================
async function checkAndRestoreBubble(tokenId) {
  const binding = localStorage.getItem(`${BINDING_KEY}${tokenId}`);
  if (!binding) return;
  try {
    const parsed = JSON.parse(binding);
    if (parsed.cardId) {
      const cardData = JSON.parse(localStorage.getItem(`${STORAGE_PREFIX}${parsed.cardId}`));
      if (cardData) {
        await injectBubble(tokenId, cardData, parsed.cardId);
        return;
      }
    } else if (parsed.data) {
      await injectBubble(tokenId, parsed.data, null);
    }
  } catch (e) {
    console.warn('恢复气泡失败:', e);
  }
}

// ==================== 监听场景变化（自动刷新气泡） ====================
OBR.scene.items.onChange(async (changes) => {
  for (const change of changes) {
    if (change.type === 'ADD' && change.item.type === 'IMAGE') {
      await checkAndRestoreBubble(change.item.id);
    }
    if (change.type === 'UPDATE' && change.item.type === 'IMAGE') {
      const tokenId = change.item.id;
      const metadata = change.item.metadata?.['com.wow.fu-character/data'];
      if (metadata) {
        const existing = bubbleContainers.get(tokenId);
        if (existing) {
          const binding = localStorage.getItem(`${BINDING_KEY}${tokenId}`);
          if (binding) {
            try {
              const parsed = JSON.parse(binding);
              const cardData = parsed.cardId 
                ? JSON.parse(localStorage.getItem(`${STORAGE_PREFIX}${parsed.cardId}`))
                : parsed.data;
              if (cardData) {
                Object.assign(cardData, metadata);
                await injectBubble(tokenId, cardData, parsed.cardId);
              }
            } catch (e) {}
          }
        } else {
          await checkAndRestoreBubble(tokenId);
        }
      }
    }
  }
});

// ==================== 注册右键菜单（无 roles 限制） ====================
OBR.onReady(() => {
  console.log('🎯 OBR SDK 已就绪');

  // 1. 绑定角色卡
  OBR.contextMenu.create({
    id: 'fu-character-extension/bind-role',
    icons: [{
      icon: ICON_BASE64,
      label: '📋 绑定FU角色卡',
      filter: { every: [{ key: 'type', value: 'IMAGE' }] }
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
  console.log('✅ 菜单1已注册: 绑定FU角色卡');

  // 2. 绑定血条组件
  OBR.contextMenu.create({
    id: 'fu-character-extension/bind-hpbar',
    icons: [{
      icon: ICON_BASE64,
      label: '❤️ 绑定FU血条组件',
      filter: { every: [{ key: 'type', value: 'IMAGE' }] }
    }],
    onClick: async (context) => {
      const items = context.items;
      if (items.length === 0) {
        OBR.notification.show('请选择一个棋子 Token');
        return;
      }
      const token = items[0];
      await bindHpBarToToken(token.id);
    }
  });
  console.log('✅ 菜单2已注册: 绑定FU血条组件');

  // 3. 打开角色卡
  OBR.contextMenu.create({
    id: 'fu-character-extension/open-card',
    icons: [{
      icon: ICON_BASE64,
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
      let cardId = null;
      const meta = token.metadata?.['com.wow.fu-character/data'];
      if (meta && meta.cardId) {
        cardId = meta.cardId;
      } else {
        const binding = localStorage.getItem(`${BINDING_KEY}${token.id}`);
        if (binding) {
          const parsed = JSON.parse(binding);
          cardId = parsed.cardId;
        }
      }
      if (!cardId) {
        OBR.notification.show('未找到绑定的角色卡ID');
        return;
      }
      OBR.popover.open({
        id: 'fu-card-popover',
        url: `${base}/full-card.html?cardId=${cardId}&tokenId=${token.id}&t=${Date.now()}`,
        width: 620,
        height: 600
      });
    }
  });
  console.log('✅ 菜单3已注册: 打开FU角色卡');

  // 4. 解绑
  OBR.contextMenu.create({
    id: 'fu-character-extension/unbind',
    icons: [{
      icon: ICON_BASE64,
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
      const entry = bubbleContainers.get(token.id);
      if (entry) {
        entry.container.remove();
        if (entry.cleanup) entry.cleanup();
        bubbleContainers.delete(token.id);
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
  console.log('✅ 菜单4已注册: 解绑');

  console.log('✅ 所有右键菜单已注册完成！');
});