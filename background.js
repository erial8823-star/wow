// background.js - 无 import 版本（可直接在枭熊2中运行）

console.log('🔥 FU角色卡扩展后台已加载！');

// ----- 存储键名 -----
const STORAGE_PREFIX = 'cc-fu-data-';
const LOCK_KEY = 'fu-lock-';
const BINDING_KEY = 'fu-binding-';

// ============================================================
// 1. 辅助函数
// ============================================================

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

function findTokenElement(tokenId) {
  return document.querySelector(`[data-token-id="${tokenId}"]`);
}

function openFullCard(cardId) {
  try {
    const data = JSON.parse(localStorage.getItem(`${STORAGE_PREFIX}${cardId}`));
    if (!data) {
      console.warn('未找到卡片数据:', cardId);
      return;
    }
    document.dispatchEvent(new CustomEvent('fu-open-card', {
      detail: { cardId: cardId, data: data }
    }));
    console.log('🃏 已触发打开卡片事件:', cardId);
  } catch (e) {
    console.error('打开卡片失败:', e);
  }
}

// ============================================================
// 2. 绑定函数
// ============================================================

function bindRoleToToken(tokenId, cardId) {
  const tokenEl = findTokenElement(tokenId);
  if (!tokenEl) {
    console.warn('未找到Token元素:', tokenId);
    return false;
  }
  const data = JSON.parse(localStorage.getItem(`${STORAGE_PREFIX}${cardId}`));
  if (!data) {
    console.warn('未找到卡片数据:', cardId);
    return false;
  }
  injectBubble(tokenId, tokenEl, data, cardId);
  return true;
}

function bindHpBarToToken(tokenId) {
  const tokenEl = findTokenElement(tokenId);
  if (!tokenEl) {
    console.warn('未找到Token元素:', tokenId);
    return false;
  }
  const data = {
    name: '测试勇士',
    pd: 8,
    md: 12,
    hp: 75,
    hpMax: 100,
    mp: 40,
    mpMax: 80,
  };
  injectBubble(tokenId, tokenEl, data, null);
  return true;
}

// ============================================================
// 3. 气泡注入
// ============================================================

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
    return `<svg viewBox="0 0 28 28" style="width:20px;height:20px;display:block;"><path d="M14 2L3 7.5v8c0 6.5 11 12.5 11 12.5s11-6 11-12.5v-8L14 2z" fill="#3498db" stroke="#2980b9" stroke-width="1.5"/><text x="14" y="18" text-anchor="middle" font-size="12" font-weight="bold" fill="white">${data.pd || 0}</text></svg>`;
  }
  function shieldPurple(value) {
    return `<svg viewBox="0 0 28 28" style="width:20px;height:20px;display:block;"><path d="M14 2L3 7.5v8c0 6.5 11 12.5 11 12.5s11-6 11-12.5v-8L14 2z" fill="#9b59b6" stroke="#8e44ad" stroke-width="1.5"/><text x="14" y="18" text-anchor="middle" font-size="12" font-weight="bold" fill="white">${data.md || 0}</text></svg>`;
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
        <div style="width:20px;height:20px;display:inline-flex;align-items:center;justify-content:center;font-size:initial;">${shieldBlue()}</div>
        <div style="width:20px;height:20px;display:inline-flex;align-items:center;justify-content:center;font-size:initial;">${shieldPurple()}</div>
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
    const scale = diameter / 56;
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
        openFullCard(cardId);
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

// ============================================================
// 4. 右键菜单
// ============================================================

document.addEventListener('contextmenu', function(e) {
  const tokenEl = e.target.closest('[data-token-id]');
  if (!tokenEl) return;
  const tokenId = tokenEl.dataset.tokenId;
  if (!tokenId) return;

  e.preventDefault();
  e.stopPropagation();

  const oldMenu = document.querySelector('.fu-context-menu');
  if (oldMenu) oldMenu.remove();

  const cards = getCardList();

  const menu = document.createElement('div');
  menu.className = 'fu-context-menu';
  menu.style.cssText = `
    position: fixed;
    left: ${e.clientX}px;
    top: ${e.clientY}px;
    background: #1a1a2e;
    border: 1px solid #4a4a6e;
    border-radius: 8px;
    padding: 6px 0;
    min-width: 200px;
    z-index: 30000;
    box-shadow: 0 8px 32px rgba(0,0,0,0.8);
    font-family: 'Segoe UI', system-ui, sans-serif;
  `;

  const roleItem = document.createElement('div');
  roleItem.style.cssText = `padding: 8px 16px; color: #f0c060; cursor: default; font-size: 13px; border-bottom: 1px solid #2a2a44;`;
  roleItem.textContent = '📋 绑定FU角色卡';
  menu.appendChild(roleItem);

  if (cards.length === 0) {
    const emptyItem = document.createElement('div');
    emptyItem.style.cssText = `padding: 6px 16px 6px 28px; color: #666; font-size: 12px; font-style: italic;`;
    emptyItem.textContent = '暂无角色卡，请先导入';
    menu.appendChild(emptyItem);
  } else {
    cards.forEach(card => {
      const subItem = document.createElement('div');
      subItem.style.cssText = `padding: 6px 16px 6px 28px; color: #ddd; cursor: pointer; font-size: 12px; transition: background 0.1s;`;
      subItem.textContent = `${card.name} (${card.id})`;
      subItem.addEventListener('mouseenter', () => { subItem.style.background = 'rgba(240,192,96,0.1)'; });
      subItem.addEventListener('mouseleave', () => { subItem.style.background = 'transparent'; });
      subItem.addEventListener('click', () => {
        bindRoleToToken(tokenId, card.id);
        menu.remove();
        alert(`✅ 已绑定角色卡: ${card.name}`);
      });
      menu.appendChild(subItem);
    });
  }

  const divider = document.createElement('div');
  divider.style.cssText = `border-top: 1px solid #2a2a44; margin: 4px 0;`;
  menu.appendChild(divider);

  const hpItem = document.createElement('div');
  hpItem.style.cssText = `padding: 8px 16px; color: #5dade2; cursor: pointer; font-size: 13px; transition: background 0.1s;`;
  hpItem.textContent = '❤️ 绑定FU血条组件';
  hpItem.addEventListener('mouseenter', () => { hpItem.style.background = 'rgba(93,173,226,0.1)'; });
  hpItem.addEventListener('mouseleave', () => { hpItem.style.background = 'transparent'; });
  hpItem.addEventListener('click', () => {
    bindHpBarToToken(tokenId);
    menu.remove();
    alert('✅ 血条组件已绑定！');
  });
  menu.appendChild(hpItem);

  const bindingData = localStorage.getItem(`${BINDING_KEY}${tokenId}`);
  if (bindingData) {
    const unbindItem = document.createElement('div');
    unbindItem.style.cssText = `padding: 8px 16px; color: #e74c3c; cursor: pointer; font-size: 13px; border-top: 1px solid #2a2a44; transition: background 0.1s;`;
    unbindItem.textContent = '🗑️ 解绑';
    unbindItem.addEventListener('mouseenter', () => { unbindItem.style.background = 'rgba(231,76,60,0.1)'; });
    unbindItem.addEventListener('mouseleave', () => { unbindItem.style.background = 'transparent'; });
    unbindItem.addEventListener('click', () => {
      const container = document.querySelector(`.fu-token-bubble-container[data-token-id="${tokenId}"]`);
      if (container) container.remove();
      localStorage.removeItem(`${BINDING_KEY}${tokenId}`);
      menu.remove();
      alert('✅ 已解绑');
    });
    menu.appendChild(unbindItem);
  }

  const closeMenu = (e2) => {
    if (!menu.contains(e2.target)) {
      menu.remove();
      document.removeEventListener('click', closeMenu);
    }
  };
  setTimeout(() => document.addEventListener('click', closeMenu), 10);

  document.body.appendChild(menu);
}, true);

// ============================================================
// 5. 消息监听
// ============================================================

window.addEventListener('message', function(event) {
  const data = event.data;
  console.log('📨 收到消息:', data);

  if (data.type === 'fu-open-card' && data.cardId) {
    openFullCard(data.cardId);
  }

  if (data.type === 'fu-import-excel') {
    const fileInput = document.getElementById('fu-file-input');
    if (fileInput) {
      fileInput.click();
    } else {
      alert('请使用管理界面的导入功能，或拖拽Excel文件到页面');
    }
  }
});

// ============================================================
// 6. 文件输入
// ============================================================

const fileInput = document.createElement('input');
fileInput.type = 'file';
fileInput.accept = '.xlsx,.xls';
fileInput.id = 'fu-file-input';
fileInput.style.display = 'none';
document.body.appendChild(fileInput);

fileInput.addEventListener('change', function(e) {
  const file = e.target.files[0];
  if (!file) return;
  alert(`📂 文件已选择: ${file.name}\n请使用管理界面完成导入。`);
  fileInput.value = '';
});

// ============================================================
// 7. 恢复绑定
// ============================================================

function restoreBindings() {
  const keys = Object.keys(localStorage);
  const bindingKeys = keys.filter(k => k.startsWith(BINDING_KEY));
  bindingKeys.forEach(key => {
    try {
      const binding = JSON.parse(localStorage.getItem(key));
      const tokenId = binding.tokenId;
      const tokenEl = findTokenElement(tokenId);
      if (tokenEl) {
        if (binding.type === 'role' && binding.cardId) {
          const data = JSON.parse(localStorage.getItem(`${STORAGE_PREFIX}${binding.cardId}`));
          if (data) injectBubble(tokenId, tokenEl, data, binding.cardId);
        } else if (binding.type === 'hpbar' && binding.data) {
          injectBubble(tokenId, tokenEl, binding.data, null);
        }
      } else {
        localStorage.removeItem(key);
      }
    } catch (e) {
      console.warn('恢复绑定失败:', e);
    }
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', restoreBindings);
} else {
  setTimeout(restoreBindings, 500);
}

console.log('✅ FU角色卡扩展后台脚本已完全加载');