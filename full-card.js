import OBR from '@owlbear-rodeo/sdk';

const STORAGE_PREFIX = 'cc-fu-data-';
const LOCK_KEY = 'fu-lock-';
const BINDING_KEY = 'fu-binding-';

const urlParams = new URLSearchParams(window.location.search);
const tokenId = urlParams.get('tokenId');
const cardId = urlParams.get('cardId');

let characterData = null;
let isGMAccess = false;
let currentCardId = cardId;

if (!tokenId && !cardId) {
  document.getElementById('cardContainer').innerHTML = `
    <div style="text-align: center; padding: 40px; color: #e74c3c;">
      ❌ 错误：未指定 Token ID 或角色卡 ID
    </div>
  `;
} else {
  OBR.onReady(async () => {
    try {
      const role = await OBR.player.getRole();
      isGMAccess = (role === 'GM');
    } catch (e) {
      isGMAccess = true;
    }
    await loadAndRender();

    // 监听数据变化（多人同步）
    if (tokenId) {
      OBR.scene.items.onChange(async (changes) => {
        for (const change of changes) {
          if (change.item.id === tokenId && change.item.metadata?.['com.wow.fu-character/data']) {
            characterData = change.item.metadata['com.wow.fu-character/data'];
            renderCard(characterData);
          }
        }
      });
    }
  });
}

// ==================== 加载数据 ====================
async function loadAndRender() {
  if (cardId) {
    const raw = localStorage.getItem(`${STORAGE_PREFIX}${cardId}`);
    if (raw) {
      characterData = JSON.parse(raw);
      renderCard(characterData);
      return;
    }
  }

  if (tokenId) {
    try {
      const items = await OBR.scene.items.getItems([tokenId]);
      if (items.length > 0 && items[0].metadata?.['com.wow.fu-character/data']) {
        characterData = items[0].metadata['com.wow.fu-character/data'];
        if (characterData.cardId) {
          currentCardId = characterData.cardId;
          localStorage.setItem(`${STORAGE_PREFIX}${currentCardId}`, JSON.stringify(characterData));
        }
        renderCard(characterData);
        return;
      }
    } catch (e) {
      console.error('读取Token数据失败:', e);
    }
  }

  document.getElementById('cardContainer').innerHTML = `
    <div style="text-align: center; padding: 40px; color: #e67e22;">
      ⚠️ 未找到角色卡数据
    </div>
  `;
}

// ==================== 保存数据 ====================
async function saveData() {
  if (!characterData) return;

  // 1. 保存到 localStorage
  if (currentCardId) {
    localStorage.setItem(`${STORAGE_PREFIX}${currentCardId}`, JSON.stringify(characterData));
  }

  // 2. 保存到 Token metadata（background 的 onChange 会自动刷新气泡）
  if (tokenId) {
    await OBR.scene.items.updateItems([tokenId], (items) => {
      for (let item of items) {
        if (item.type === 'IMAGE') {
          item.metadata['com.wow.fu-character/data'] = {
            ...characterData,
            cardId: currentCardId
          };
          if (!item.text) {
            item.text = {
              plainText: '',
              type: 'PLAIN',
              width: 'AUTO',
              height: 'AUTO'
            };
          }
          item.text.plainText = `${characterData.name}\nHP ${characterData.hp}/${characterData.hpMax}`;
        }
      }
    });
  }

  console.log('💾 数据已保存（background 会自动刷新气泡）');
}

// ==================== 渲染卡片 ====================
function renderCard(d) {
  const container = document.getElementById('cardContainer');
  const isLocked = d.isLocked || false;
  const shouldHide = isLocked && !isGMAccess;
  const isEditable = isGMAccess || !tokenId;

  const renderResource = (label, current, max, fieldCur, fieldMax, cssClass) => {
    const percent = max > 0 ? Math.min((current / max) * 100, 100) : 0;
    const curDisplay = shouldHide ? '??' : current;
    const maxDisplay = shouldHide ? '??' : max;
    const editableAttr = isEditable && !shouldHide ? 'data-editable="true"' : '';

    return `
      <div class="resource-row ${cssClass}">
        <span class="label">${label}</span>
        <div class="bar-wrap">
          <div class="bar-fill" style="width:${percent}%;"></div>
          <div class="bar-text">
            <span class="editable-num" data-field="${fieldCur}" ${editableAttr}>${curDisplay}</span>
            <span style="margin:0 2px;">/</span>
            <span class="editable-num" data-field="${fieldMax}" ${editableAttr}>${maxDisplay}</span>
          </div>
        </div>
      </div>
    `;
  };

  const renderWeaponRow = (weapon, index) => {
    if (!weapon || !weapon.name || weapon.name.trim() === '') {
      return `<tr class="empty-row"><td colspan="6" style="text-align:center;color:#555;">（无武器）</td></tr>`;
    }
    const wAttack = shouldHide ? '??' : (weapon.attack || '-');
    const wDamage = shouldHide ? '??' : (weapon.damage || '-');
    const editableAttr = isEditable && !shouldHide ? 'data-editable="true"' : '';
    const prefix = `weapon${index}`;

    return `
      <tr>
        <td><span class="editable-text" data-field="${prefix}.category" ${editableAttr}>${weapon.category || '-'}</span></td>
        <td class="weapon-name"><span class="editable-text" data-field="${prefix}.name" ${editableAttr}>${weapon.name}</span></td>
        <td><span class="editable-text" data-field="${prefix}.attack" ${editableAttr}>${wAttack}</span></td>
        <td><span class="editable-text" data-field="${prefix}.attr" ${editableAttr}>${weapon.attr || '-'}</span></td>
        <td><span class="editable-text" data-field="${prefix}.type" ${editableAttr}>${weapon.type || '-'}</span></td>
        <td><span class="editable-text" data-field="${prefix}.damage" ${editableAttr}>${wDamage}</span></td>
      </tr>
    `;
  };

  const attrs = [
    { label: '敏捷', field: 'dex', value: shouldHide ? '??' : `D${d.dex || 0}` },
    { label: '洞察', field: 'ins', value: shouldHide ? '??' : `D${d.ins || 0}` },
    { label: '力量', field: 'mig', value: shouldHide ? '??' : `D${d.mig || 0}` },
    { label: '意志', field: 'wlp', value: shouldHide ? '??' : `D${d.wlp || 0}` },
  ];

  let attrsHtml = '';
  attrs.forEach((attr) => {
    const editableAttr = isEditable && !shouldHide ? 'data-editable="true"' : '';
    attrsHtml += `
      <div class="fu-attr-item">
        <span class="label">${attr.label}</span>
        <span class="value editable-num" data-field="${attr.field}" ${editableAttr}>${attr.value}</span>
      </div>
    `;
  });

  const combatFields = [
    { label: '⚔️ 先攻', field: 'init', value: shouldHide ? '??' : (d.init || 0) },
    { label: '🛡️ 物防', field: 'pd', value: shouldHide ? '??' : (d.pd || 0) },
    { label: '✨ 魔防', field: 'md', value: shouldHide ? '??' : (d.md || 0) },
  ];

  let combatHtml = '';
  combatFields.forEach((cf) => {
    const editableAttr = isEditable && !shouldHide ? 'data-editable="true"' : '';
    combatHtml += `
      <span>
        ${cf.label} 
        <span class="num editable-num" data-field="${cf.field}" ${editableAttr}>${cf.value}</span>
      </span>
    `;
  });

  const lockIcon = isLocked ? '🔒' : '🔓';
  const lockTitle = isLocked ? '已锁定（非GM隐藏数值）' : '未锁定（所有人可见）';
  const lockBtnHtml = isGMAccess 
    ? `<button id="fuLockBtn" title="${lockTitle}" style="background:none; border:none; cursor:pointer; font-size:18px; color:#f0c060; margin-left:8px;">${lockIcon}</button>`
    : `<span title="${lockTitle}" style="font-size:18px; margin-left:8px;">${lockIcon}</span>`;

  const saveBtnHtml = isEditable 
    ? `<button id="fuSaveBtn" style="background:#f0c060; border:none; color:#1a1a2e; padding:4px 16px; border-radius:16px; cursor:pointer; font-weight:bold; font-size:13px;">💾 保存</button>`
    : '';

  container.innerHTML = `
    <div class="fu-card-header">
      <div style="display:flex; align-items:center; flex-wrap:wrap; gap:4px;">
        <span class="editable-text" data-field="name" style="font-size:22px; color:#f0c060; font-weight:bold; ${isEditable && !shouldHide ? 'cursor:pointer;' : ''}" ${isEditable && !shouldHide ? 'data-editable="true"' : ''}>
          ${d.name || '未命名角色'}
        </span>
        <span class="level" style="margin-left:4px;">Lv.<span class="editable-num" data-field="level" ${isEditable && !shouldHide ? 'data-editable="true"' : ''}>${d.level || 0}</span></span>
        ${lockBtnHtml}
        ${saveBtnHtml}
      </div>
      <button class="fu-card-close" id="fuCloseBtn">×</button>
    </div>

    <div class="fu-card-body">
      <div class="fu-attributes">${attrsHtml}</div>
      <div class="fu-combat-stats">${combatHtml}</div>
      ${renderResource('HP', d.hp, d.hpMax, 'hp', 'hpMax', 'resource-hp')}
      ${renderResource('MP', d.mp, d.mpMax, 'mp', 'mpMax', 'resource-mp')}
      ${renderResource('IP', d.ip, d.ipMax, 'ip', 'ipMax', 'resource-ip')}
      ${renderResource('命刻', d.crisisCurrent, d.crisisMax, 'crisisCurrent', 'crisisMax', 'resource-crisis')}
      <div class="fu-crisis-box">
        <div class="title">🔥 零界能力</div>
        <div class="detail">
          <strong><span class="editable-text" data-field="crisisName" ${isEditable && !shouldHide ? 'data-editable="true"' : ''}>${d.crisisName || '（未设置）'}</span></strong>
          <span>｜ 条件：<span class="editable-text" data-field="crisisCondition" ${isEditable && !shouldHide ? 'data-editable="true"' : ''}>${d.crisisCondition || '无'}</span></span>
          <span>｜ 填充格数：<span class="editable-text" data-field="crisisSlots" ${isEditable && !shouldHide ? 'data-editable="true"' : ''}>${d.crisisSlots || '无'}</span></span>
        </div>
      </div>
      <div class="fu-defenses">
        <span class="tag"><strong>弱点：</strong><span class="editable-text" data-field="weakness" ${isEditable && !shouldHide ? 'data-editable="true"' : ''}>${d.weakness || '无'}</span></span>
        <span class="tag"><strong>抵抗：</strong><span class="editable-text" data-field="resistance" ${isEditable && !shouldHide ? 'data-editable="true"' : ''}>${d.resistance || '无'}</span></span>
        <span class="tag"><strong>免疫：</strong><span class="editable-text" data-field="immunity" ${isEditable && !shouldHide ? 'data-editable="true"' : ''}>${d.immunity || '无'}</span></span>
        <span class="tag"><strong>吸收：</strong><span class="editable-text" data-field="absorb" ${isEditable && !shouldHide ? 'data-editable="true"' : ''}>${d.absorb || '无'}</span></span>
      </div>
      <table class="fu-weapons">
        <thead><tr><th>类别</th><th>名称</th><th>检定</th><th>属性</th><th>类型</th><th>伤害</th></tr></thead>
        <tbody>
          ${renderWeaponRow(d.weapon1, 1)}
          ${renderWeaponRow(d.weapon2, 2)}
        </tbody>
      </table>
    </div>
  `;

  bindEditableFields();
  bindCloseButton();
  bindLockButton();
  bindSaveButton();
}

// ==================== 绑定可编辑字段 ====================
function bindEditableFields() {
  document.querySelectorAll('.editable-num[data-editable="true"]').forEach(el => {
    el.style.cursor = 'pointer';
    el.addEventListener('click', (e) => {
      e.stopPropagation();
      const field = el.dataset.field;
      const oldValue = el.textContent.trim();
      makeEditableNumber(el, field, oldValue);
    });
  });

  document.querySelectorAll('.editable-text[data-editable="true"]').forEach(el => {
    el.style.cursor = 'pointer';
    el.addEventListener('click', (e) => {
      e.stopPropagation();
      const field = el.dataset.field;
      const oldValue = el.textContent.trim();
      makeEditableText(el, field, oldValue);
    });
  });
}

function makeEditableNumber(el, field, oldValue) {
  const input = document.createElement('input');
  input.type = 'number';
  input.className = 'fu-editable-input';
  input.value = oldValue;
  input.style.width = '60px';
  input.style.background = '#0d0d1a';
  input.style.color = '#fff';
  input.style.border = '1px solid #f0c060';
  input.style.borderRadius = '4px';
  input.style.padding = '2px 6px';
  input.style.fontSize = 'inherit';
  input.style.fontWeight = 'bold';
  input.style.textAlign = 'center';
  
  el.replaceWith(input);
  input.focus();
  input.select();

  const saveValue = async () => {
    let newVal = input.value.trim();
    if (newVal === '') newVal = '0';
    const numVal = Number(newVal);
    if (isNaN(numVal)) {
      input.replaceWith(el);
      return;
    }
    updateDataField(field, numVal);
    el.textContent = newVal;
    input.replaceWith(el);
  };

  input.addEventListener('blur', saveValue);
  input.addEventListener('keydown', (ev) => {
    if (ev.key === 'Enter') { ev.preventDefault(); input.blur(); }
    if (ev.key === 'Escape') { input.replaceWith(el); }
  });
}

function makeEditableText(el, field, oldValue) {
  const input = document.createElement('input');
  input.type = 'text';
  input.className = 'fu-editable-input';
  input.value = oldValue;
  input.style.width = Math.max(oldValue.length * 10 + 30, 80) + 'px';
  input.style.background = '#0d0d1a';
  input.style.color = '#fff';
  input.style.border = '1px solid #f0c060';
  input.style.borderRadius = '4px';
  input.style.padding = '2px 8px';
  input.style.fontSize = 'inherit';
  
  el.replaceWith(input);
  input.focus();
  input.select();

  const saveValue = async () => {
    const newVal = input.value.trim();
    updateDataField(field, newVal);
    el.textContent = newVal || '（空）';
    input.replaceWith(el);
  };

  input.addEventListener('blur', saveValue);
  input.addEventListener('keydown', (ev) => {
    if (ev.key === 'Enter') { ev.preventDefault(); input.blur(); }
    if (ev.key === 'Escape') { input.replaceWith(el); }
  });
}

function updateDataField(field, value) {
  if (!characterData) return;

  if (field.includes('.')) {
    const parts = field.split('.');
    let obj = characterData;
    for (let i = 0; i < parts.length - 1; i++) {
      if (!obj[parts[i]]) obj[parts[i]] = {};
      obj = obj[parts[i]];
    }
    obj[parts[parts.length - 1]] = value;
  } else {
    characterData[field] = value;
  }

  console.log(`📝 字段已更新: ${field} = ${value}`);
  if (field === 'hp' || field === 'hpMax' || field === 'name') {
    updateTokenLabel();
  }
}

async function updateTokenLabel() {
  if (!tokenId || !characterData) return;
  try {
    await OBR.scene.items.updateItems([tokenId], (items) => {
      for (let item of items) {
        if (item.type === 'IMAGE') {
          if (!item.text) {
            item.text = { plainText: '', type: 'PLAIN', width: 'AUTO', height: 'AUTO' };
          }
          item.text.plainText = `${characterData.name}\nHP ${characterData.hp}/${characterData.hpMax}`;
        }
      }
    });
  } catch (e) {
    console.warn('更新Token标签失败:', e);
  }
}

function bindSaveButton() {
  const saveBtn = document.getElementById('fuSaveBtn');
  if (saveBtn) {
    saveBtn.addEventListener('click', async () => {
      await saveData();
      OBR.notification.show('✅ 数据已保存');
    });
  }
}

function bindCloseButton() {
  const closeBtn = document.getElementById('fuCloseBtn');
  if (closeBtn) {
    closeBtn.addEventListener('click', async () => {
      await saveData();
      OBR.popover.close('fu-card-popover');
    });
  }
}

function bindLockButton() {
  const lockBtn = document.getElementById('fuLockBtn');
  if (lockBtn) {
    lockBtn.addEventListener('click', async () => {
      if (!isGMAccess) {
        OBR.notification.show('只有GM可以切换锁定状态');
        return;
      }
      const newLocked = !characterData.isLocked;
      characterData.isLocked = newLocked;
      
      if (currentCardId) {
        localStorage.setItem(`${STORAGE_PREFIX}${currentCardId}`, JSON.stringify(characterData));
      }
      
      if (tokenId) {
        await OBR.scene.items.updateItems([tokenId], (items) => {
          for (let item of items) {
            if (item.type === 'IMAGE' && item.metadata['com.wow.fu-character/data']) {
              item.metadata['com.wow.fu-character/data'].isLocked = newLocked;
            }
          }
        });
      }
      
      localStorage.setItem(`${LOCK_KEY}${tokenId}`, JSON.stringify({ locked: newLocked }));
      renderCard(characterData);
      OBR.notification.show(newLocked ? '🔒 已锁定' : '🔓 已解锁');
    });
  }
}