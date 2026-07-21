// background.js - 使用枭熊2 SDK 注册右键菜单（带详细日志）

import OBR from '@owlbear-rodeo/sdk';

console.log('🔥 FU角色卡扩展后台已加载！');

// 存储键名
const STORAGE_PREFIX = 'cc-fu-data-';
const BINDING_KEY = 'fu-binding-';
const LOCK_KEY = 'fu-lock-';

// 获取角色卡列表
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

// 查找Token元素（适配枭熊2的DOM结构）
function findTokenElement(tokenId) {
  // 尝试多种选择器
  let el = document.querySelector(`[data-token-id="${tokenId}"]`);
  if (!el) el = document.querySelector(`[data-item-id="${tokenId}"]`);
  if (!el) el = document.querySelector(`[data-id="${tokenId}"]`);
  if (!el) el = document.querySelector(`#${tokenId}`);
  return el;
}

// 注入气泡
function injectBubble(tokenId, tokenEl, data, cardId) {
  const oldContainer = document.querySelector(`.fu-token-bubble-container[data-token-id="${tokenId}"]`);
  if (oldContainer) oldContainer.remove();

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

  const hpPercent = data.hpMax > 0 ? Math.min((data.hp / data.hpMax) * 100, 100) : 0;
  const mpPercent = data.mpMax > 0 ? Math.min((data.mp / data.mpMax) * 100, 100) : 0;

  function shieldBlue(value) {
    return `<svg viewBox="0 0 28 28" style="width:20px;height:20px;display:block;"><path d="M14 2L3 7.5v8c0 6.5 11 12.5 11 12.5s11-6 11-12.5v-8L14 2z" fill="#3498db" stroke="#2980b9" stroke-width="1.5"/><text x="14" y="18" text-anchor="middle" font-size="12" font-weight="bold" fill="white">${value}</text></svg>`;
  }
  function shieldPurple(value) {
    return `<svg viewBox="0 0 28 28" style="width:20px;height:20px;display:block;"><path d="M14 2L3 7.5v8c0 6.5 11 12.5 11 12.5s11-6 11-12.5v-8L14 2z" fill="#9b59b6" stroke="#8e44ad" stroke-width="1.5"/><text x="14" y="18" text-anchor="middle" font-size="12" font-weight="bold" fill="white">${value}</text></svg>`;
  }

  let isLocked = false;
  try {
    const lockData = JSON.parse(localStorage.getItem(`${LOCK_KEY}${tokenId}`));
    isLocked = lockData?.locked || false;
  } catch (e) {}
  const lockIcon = isLocked ? '🔒' : '🔓';

  container.innerHTML = `
    <div style="position:relative;width:100%;aspect-ratio:1/1;pointer-events:auto;cursor:pointer;border-radius:50%;background:radial-gradient(circle at 35% 35%,#4a2a6a,#1a0a2a);border:2px solid #f0c060;box-shadow:0 0 20px rgba(240,192,96,0.12);overflow:visible;">
      <div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);font-size:24px;font-weight:bold;color:#f0c060;line-height:1;user-select:none;">👤</div>
      <div style="position:absolute;bottom:-4px;right:2px;display:flex;gap:0;align-items:flex-end;max-width:55%;max-height:55%;font-size:0;">
        <div style="width:20px;height:20px;display:inline-flex;align-items:center;justify-content:center;font-size:initial;">${shieldBlue(data.pd || 0)}</div>
        <div style="width:20px;height:20px;display:inline-flex;align-items:center;justify-content:center;font-size:initial;">${shieldPurple(data.md || 0)}</div>
        <div style="width:16px;height:16px;display:inline-flex;align-items:center;justify-content:center;font-size:10px;cursor:pointer;color:#f0c060;margin-left:2px;opacity:0.7;" class="fu-lock-btn">${lockIcon}</div>
      </div>
    </div>
    <div style="width:100%;padding-top:1px;display:flex;flex-direction:column;gap:1.5px;">
      <div style="position:relative;height:5px;min-height:3px;background:rgba(20,20,40,0.85);border-radius:3px;overflow:hidden;border:0.5px solid rgba(255,255,255,0.06);width:100%;">
        <div style="height:100%;border-radius:3px;transition:width 0.3s ease;background:linear-gradient(90deg,#c0392b,#e74c3c);width:${hpPercent}%;"></div>
        <span style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);font-size:6.5px;font-weight:bold;color:#fff;text-shadow:0 1px 4px rgba(0,0,0,0.95);white-space:nowrap;letter-spacing:0.2px;line-height:1;">HP ${data.hp}/${data.hpMax}</span>
      </div>
      <div style="position:relative;height:5px;min-height:3px;background:rgba(20,20,40,0.85);border-radius:3px;overflow:hidden;border:0.5px solid rgba(255,255,255,0.06);width:100%;">
        <div style="height:100%;border-radius:3px;transition:width 0.3s ease;background:linear-gradient(90deg,#2471a3,#5dade2);width:${mpPercent}%;"></div>
        <span style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);font-size:6.5px;font-weight:bold;color:#fff;text-shadow:0 1px 4px rgba(0,0,0,0.95);white-space:nowrap;letter-spacing:0.2px;line-height:1;">MP ${data.mp}/${data.mpMax}</span>
      </div>
    </div>
    <div style="width:100%;text-align:center;font-size:10px;font-weight:600;color:#f0c060;letter-spacing:0.5px;padding-top:1px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;line-height:1.3;text-shadow:0 1px 6px rgba(0,0,0,0.8);flex-shrink:0;">${data.name}</div>
  `;

  document.body.appendChild(container);

  function updatePosition() {
    const rect = tokenEl.getBoundingClientRect();
    const diameter = Math.min(rect.width, rect.height);
    const containerWidth = diameter * 1.2;
    const containerHeight = diameter + diameter * 0.7;
    const left = rect.left + rect.width / 2 - containerWidth / 2;
    const top = rect.top;
    container.style.left = left + 'px';
    container.style.top = top + 'px';
    container.style.width = containerWidth + 'px';
    container.style.height = containerHeight + 'px';
    container.style.opacity = '1';
  }

  const observer = new MutationObserver(updatePosition);
  observer.observe(tokenEl, { attributes: true, attributeFilter: ['style', 'transform'] });
  window.addEventListener('resize', updatePosition);

  const tokenLayer = container.querySelector('div[style*="position:relative"]');
  if (tokenLayer) {
    tokenLayer.addEventListener('click', (e) => {
      if (e.target.closest('.fu-lock-btn')) return;
      if (cardId) {
        console.log('🃏 打开卡片:', cardId);
        // TODO: 通过 OBR 或自定义事件打开卡片
      } else {
        alert(`📊 ${data.name}\nHP: ${data.hp}/${data.hpMax}\nMP: ${data.mp}/${data.mpMax}\n物防: ${data.pd}\n魔防: ${data.md}`);
      }
    });
  }

  const lockBtn = container.querySelector('.fu-lock-btn');
  if (lockBtn) {
    lockBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      isLocked = !isLocked;
      localStorage.setItem(`${LOCK_KEY}${tokenId}`, JSON.stringify({ locked: isLocked }));
      lockBtn.textContent = isLocked ? '🔒' : '🔓';
    });
  }

  const bindingData = { type: cardId ? 'role' : 'hpbar', cardId, tokenId, data };
  localStorage.setItem(`${BINDING_KEY}${tokenId}`, JSON.stringify(bindingData));

  setTimeout(updatePosition, 50);
  console.log(`✅ 气泡已注入到Token: ${tokenId}`);
  return container;
}

// 绑定角色卡到Token
function bindRoleToToken(tokenId, cardId) {
  console.log('🔗 绑定角色卡:', tokenId, cardId);
  const tokenEl = findTokenElement(tokenId);
  if (!tokenEl) {
    console.warn('❌ 未找到Token元素:', tokenId);
    return;
  }
  const data = JSON.parse(localStorage.getItem(`${STORAGE_PREFIX}${cardId}`));
  if (!data) {
    console.warn('❌ 未找到卡片数据:', cardId);
    return;
  }
  injectBubble(tokenId, tokenEl, data, cardId);
}

// 绑定血条组件
function bindHpBarToToken(tokenId) {
  console.log('❤️ 绑定血条组件:', tokenId);
  const tokenEl = findTokenElement(tokenId);
  if (!tokenEl) {
    console.warn('❌ 未找到Token元素:', tokenId);
    return;
  }
  const data = { name: '测试勇士', pd: 8, md: 12, hp: 75, hpMax: 100, mp: 40, mpMax: 80 };
  injectBubble(tokenId, tokenEl, data, null);
}

// ============================================================
// 使用枭熊2 SDK 注册右键菜单
// ============================================================

OBR.onReady(() => {
  console.log('🎯 OBR SDK 已就绪');

  // 注册：绑定角色卡
  OBR.contextMenu.create({
    id: 'fu-character-extension/bind-role',
    icons: [{
      icon: '📋',
      label: '绑定FU角色卡',
      filter: {
        every: [{ key: 'type', value: 'TOKEN' }]
      }
    }],
    onClick: async (context) => {
      try {
        console.log('🔔 绑定角色卡菜单被点击');
        const cards = getCardList();
        console.log('📋 角色卡列表:', cards);

        if (cards.length === 0) {
          OBR.notification.show('暂无角色卡，请先导入');
          return;
        }

        const items = await OBR.scene.items.getSelected();
        console.log('🟢 选中的Token:', items);

        if (items.length === 0) {
          OBR.notification.show('请先选择一个Token');
          return;
        }

        const token = items[0];
        console.log('🔵 Token ID:', token.id);

        const cardId = cards[0].id;
        bindRoleToToken(token.id, cardId);
        OBR.notification.show(`已绑定角色卡: ${cards[0].name}`);
      } catch (err) {
        console.error('❌ 绑定角色卡失败:', err);
        OBR.notification.show('绑定失败: ' + err.message);
      }
    }
  });

  // 注册：绑定血条组件
  OBR.contextMenu.create({
    id: 'fu-character-extension/bind-hpbar',
    icons: [{
      icon: '❤️',
      label: '绑定FU血条组件',
      filter: {
        every: [{ key: 'type', value: 'TOKEN' }]
      }
    }],
    onClick: async (context) => {
      try {
        console.log('🔔 绑定血条菜单被点击');
        const items = await OBR.scene.items.getSelected();
        if (items.length === 0) {
          OBR.notification.show('请先选择一个Token');
          return;
        }
        const token = items[0];
        console.log('🔵 Token ID:', token.id);
        bindHpBarToToken(token.id);
        OBR.notification.show('已绑定血条组件');
      } catch (err) {
        console.error('❌ 绑定血条失败:', err);
        OBR.notification.show('绑定失败: ' + err.message);
      }
    }
  });

  // 注册：解绑
  OBR.contextMenu.create({
    id: 'fu-character-extension/unbind',
    icons: [{
      icon: '🗑️',
      label: '解绑',
      filter: {
        every: [{ key: 'type', value: 'TOKEN' }]
      }
    }],
    onClick: async (context) => {
      try {
        console.log('🔔 解绑菜单被点击');
        const items = await OBR.scene.items.getSelected();
        if (items.length === 0) return;
        const token = items[0];
        const container = document.querySelector(`.fu-token-bubble-container[data-token-id="${token.id}"]`);
        if (container) container.remove();
        localStorage.removeItem(`${BINDING_KEY}${token.id}`);
        OBR.notification.show('已解绑');
      } catch (err) {
        console.error('❌ 解绑失败:', err);
        OBR.notification.show('解绑失败: ' + err.message);
      }
    }
  });

  console.log('✅ 右键菜单已注册');
});

console.log('✅ background.js 完全加载');