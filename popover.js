import OBR from '@owlbear-rodeo/sdk';
import * as XLSX from 'xlsx';

const STORAGE_PREFIX = 'cc-fu-data-';
let isSdkReady = false;

const urlParams = new URLSearchParams(window.location.search);
const bindTokenId = urlParams.get('bindTokenId');
let bindTokenName = '';
const base = window.location.href.substring(0, window.location.href.lastIndexOf('/'));

let selectedPreviewCardId = localStorage.getItem('fu-preview-selected-id') || null;

// 根据当前模式设置 Body 类名
if (bindTokenId) {
  document.body.classList.add('bind-mode');
  document.body.classList.remove('preview-mode');
} else {
  document.body.classList.add('preview-mode');
  document.body.classList.remove('bind-mode');
}

// 初始化 OBR SDK
OBR.onReady(async () => {
  isSdkReady = true;
  if (bindTokenId) {
    try {
      const items = await OBR.scene.items.getItems([bindTokenId]);
      if (items.length > 0) {
        bindTokenName = items[0].name || '未知棋子';
      }
    } catch (e) {}
    document.getElementById('statusBar').textContent = `正在为棋子「${bindTokenName}」选择绑定角色卡...`;
  } else {
    document.getElementById('statusBar').textContent = 'SDK 已就绪';
  }
  renderList();
});

// 读取所有本地保存的角色卡列表
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

// 渲染角色卡列表
function renderList() {
  const list = document.getElementById('cardList');
  const cards = getCardList();
  if (cards.length === 0) {
    list.innerHTML = `<div class="empty">暂无角色卡<br>点击"导入Excel"上传</div>`;
    document.getElementById('statusBar').textContent = '共 0 张角色卡';
    if (!bindTokenId) loadPreview(null);
    return;
  }
  let html = '';
  cards.forEach(card => {
    const isActive = (card.id === selectedPreviewCardId && !bindTokenId) ? 'active' : '';
    html += `
      <div class="list-item ${isActive}" data-id="${card.id}">
        <span class="name">${card.name}</span>
        <div class="id-wrap">
          <span class="id">${card.id}</span>
          <span class="delete-btn" title="删除角色卡" onclick="deleteCard(event, '${card.id}')">🗑️</span>
        </div>
      </div>
    `;
  });
  list.innerHTML = html;
  if (bindTokenId) {
    document.getElementById('statusBar').textContent = `正在为棋子「${bindTokenName}」选择绑定角色卡...`;
  } else {
    document.getElementById('statusBar').textContent = `共 ${cards.length} 张角色卡｜点击卡片预览，右键棋子绑定`;
  }

  // 初始化加载预览
  if (!bindTokenId) {
    if (selectedPreviewCardId && cards.some(c => c.id === selectedPreviewCardId)) {
      loadPreview(selectedPreviewCardId);
    } else if (cards.length > 0) {
      selectedPreviewCardId = cards[0].id;
      localStorage.setItem('fu-preview-selected-id', selectedPreviewCardId);
      const items = list.querySelectorAll('.list-item');
      if (items.length > 0) items[0].classList.add('active');
      loadPreview(selectedPreviewCardId);
    } else {
      loadPreview(null);
    }
  }

  // 点击列表项进行 Token 绑定 或 切换左侧预览
  list.querySelectorAll('.list-item').forEach(item => {
    item.addEventListener('click', async (e) => {
      if (e.target.classList.contains('delete-btn')) return; // 点击删除按钮不触发绑定/预览
      const cardId = item.dataset.id;
      
      if (!isSdkReady) {
        alert('OBR SDK 未初始化完成，请稍候');
        return;
      }

      // 如果不是绑定模式，点击切换预览卡片
      if (!bindTokenId) {
        selectedPreviewCardId = cardId;
        localStorage.setItem('fu-preview-selected-id', cardId);
        
        list.querySelectorAll('.list-item').forEach(el => el.classList.remove('active'));
        item.classList.add('active');
        
        loadPreview(cardId);
        return;
      }

      // 绑定模式下：绑定到指定的 bindTokenId
      const tokenId = bindTokenId;
      const data = JSON.parse(localStorage.getItem(STORAGE_PREFIX + cardId));
      if (!data) return;

      // 将属性写入 Token 元数据 (Item Metadata)
      await OBR.scene.items.updateItems([tokenId], (items) => {
        for (let item of items) {
          if (item.type === 'IMAGE') {
            item.metadata['com.wow.fu-character/data'] = {
              cardId: cardId,
              name: data.name,
              level: data.level,
              hp: data.hp,
              hpMax: data.hpMax,
              mp: data.mp,
              mpMax: data.mpMax,
              ip: data.ip,
              ipMax: data.ipMax,
              dex: data.dex,
              ins: data.ins,
              mig: data.mig,
              wlp: data.wlp,
              init: data.init,
              pd: data.pd,
              md: data.md,
              weakness: data.weakness,
              resistance: data.resistance,
              immunity: data.immunity,
              absorb: data.absorb,
              crisisName: data.crisisName,
              crisisCondition: data.crisisCondition,
              crisisSlots: data.crisisSlots,
              crisisCurrent: data.crisisCurrent,
              crisisMax: data.crisisMax,
              weapon1: data.weapon1,
              weapon2: data.weapon2
            };
            
            // 自动更新 Token 的原生 Label（在棋子下方显示血量）
            if (!item.text) {
              item.text = {
                richText: [{ type: "paragraph", children: [{ text: "" }] }],
                plainText: "",
                style: {
                  padding: 8,
                  fontFamily: "Roboto",
                  fontSize: 24,
                  fontWeight: 400,
                  textAlign: "CENTER",
                  textAlignVertical: "BOTTOM",
                  fillColor: "white",
                  fillOpacity: 1,
                  strokeColor: "white",
                  strokeOpacity: 1,
                  strokeWidth: 0,
                  lineHeight: 1.5,
                },
                type: "PLAIN",
                width: "AUTO",
                height: "AUTO",
              };
            }
            item.text.plainText = `${data.name}\nHP ${data.hp}/${data.hpMax}`;
            item.textItemType = 'LABEL';
          }
        }
      });

      alert(`✅ 已成功将角色卡「${data.name}」绑定到棋子「${bindTokenName}」！`);
      
      // 绑定成功后，自动关闭当前选择面板
      OBR.popover.close('com.wow.fu-character/popover');
    });
  });
}

// 删除角色卡
function deleteCard(event, cardId) {
  event.stopPropagation();
  if (!confirm(`确定要删除角色卡「${cardId}」吗？`)) return;
  localStorage.removeItem(STORAGE_PREFIX + cardId);
  if (selectedPreviewCardId === cardId) {
    selectedPreviewCardId = null;
    localStorage.removeItem('fu-preview-selected-id');
  }
  renderList();
}
// 将删除函数挂载 to window 全局，确保 HTML 中的 onclick 能够正常触发
window.deleteCard = deleteCard;

// 绑定导入文件按钮
const importBtn = document.getElementById('importBtn');
const excelFile = document.getElementById('excelFile');

importBtn.addEventListener('click', () => {
  excelFile.click();
});

excelFile.addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if (!file) return;

  document.getElementById('statusBar').textContent = '正在解析 Excel...';
  try {
    const data = new Uint8Array(await file.arrayBuffer());
    const workbook = XLSX.read(data, { type: 'array' });
    const sheet = workbook.Sheets['主要'];
    if (!sheet) {
      throw new Error('在 Excel 中找不到名为“主要”的工作表，请检查文件！');
    }

    const getCell = (addr) => {
      const cell = sheet[addr];
      if (!cell) return '';
      return cell.v !== undefined ? cell.v : (cell.w || '');
    };

    const characterData = {
      name: getCell('E2') || '未命名角色',
      level: Number(getCell('S2')) || 0,
      dex: Number(getCell('H7')) || 0,
      ins: Number(getCell('H8')) || 0,
      mig: Number(getCell('H9')) || 0,
      wlp: Number(getCell('H10')) || 0,
      init: Number(getCell('F14')) || 0,
      pd: Number(getCell('F15')) || 0,
      md: Number(getCell('F16')) || 0,
      hp: Number(getCell('S14')) || 0,
      hpMax: Number(getCell('W14')) || 0,
      mp: Number(getCell('S15')) || 0,
      mpMax: Number(getCell('W15')) || 0,
      ip: Number(getCell('S16')) || 0,
      ipMax: Number(getCell('W16')) || 0,
      weakness: getCell('AE14') || '',
      resistance: getCell('AO14') || '',
      immunity: getCell('AE25') || '',
      absorb: getCell('AO15') || '',
      crisisName: getCell('B20') || '',
      crisisCondition: getCell('H20') || '',
      crisisSlots: getCell('M20') || '',
      crisisCurrent: Number(getCell('S20')) || 0,
      crisisMax: Number(getCell('Z20')) || 0,
      weapon1: {
        category: getCell('B24') || '',
        name: getCell('H24') || '',
        attack: getCell('M24') || '',
        attr: getCell('W24') || '',
        type: getCell('AB24') || '',
        damage: getCell('AH24') || '',
      },
      weapon2: {
        category: getCell('B25') || '',
        name: getCell('H25') || '',
        attack: getCell('M25') || '',
        attr: getCell('W25') || '',
        type: getCell('AB25') || '',
        damage: getCell('AH25') || '',
      }
    };

    const cardId = characterData.name + '_' + Date.now().toString().slice(-4);
    localStorage.setItem(STORAGE_PREFIX + cardId, JSON.stringify(characterData));
    document.getElementById('statusBar').textContent = `成功导入角色: ${characterData.name}`;
    
    // 重置以允许重新上传相同文件
    excelFile.value = '';
    renderList();
  } catch (err) {
    alert('❌ 解析失败: ' + err.message);
    document.getElementById('statusBar').textContent = '解析失败';
    excelFile.value = '';
  }
});

// ---------- 预览卡片渲染逻辑 ----------
function loadPreview(cardId) {
  const previewPane = document.getElementById('previewPane');
  if (!previewPane) return;
  
  if (!cardId) {
    previewPane.innerHTML = `
      <div class="fu-manager-preview-placeholder">
        <span style="color:#666;font-size:16px;">👈 请从右侧选择一张角色卡进行预览</span>
      </div>
    `;
    return;
  }
  
  const data = JSON.parse(localStorage.getItem(STORAGE_PREFIX + cardId));
  if (!data) {
    previewPane.innerHTML = `
      <div class="fu-manager-preview-placeholder">
        <span style="color:#e74c3c;">⚠️ 未找到角色数据</span>
      </div>
    `;
    return;
  }
  
  previewPane.innerHTML = renderPreviewCard(data);
}

function renderPreviewCard(d) {
  // 四维属性
  const attrs = [
    { label: '敏捷', value: `D${d.dex || 0}` },
    { label: '洞察', value: `D${d.ins || 0}` },
    { label: '力量', value: `D${d.mig || 0}` },
    { label: '意志', value: `D${d.wlp || 0}` },
  ];

  let attrsHtml = '';
  attrs.forEach((attr) => {
    attrsHtml += `
      <div class="fu-attr-item">
        <span class="label">${attr.label}</span>
        <span class="value">${attr.value}</span>
      </div>
    `;
  });

  // 资源条
  const resources = [
    { label: 'HP', cur: d.hp, max: d.hpMax, cls: 'resource-hp' },
    { label: 'MP', cur: d.mp, max: d.mpMax, cls: 'resource-mp' },
    { label: 'IP', cur: d.ip, max: d.ipMax, cls: 'resource-ip' },
    { label: '命刻', cur: d.crisisCurrent, max: d.crisisMax, cls: 'resource-crisis' },
  ];

  let resourcesHtml = '';
  resources.forEach((res) => {
    const safeCur = Number(res.cur) || 0;
    const safeMax = Number(res.max) || 1;
    const percent = Math.min((safeCur / safeMax) * 100, 100);
    resourcesHtml += `
      <div class="resource-row ${res.cls}">
        <span class="label">${res.label}</span>
        <div class="bar-wrap">
          <div class="bar-fill" style="width:${percent}%;"></div>
          <div class="bar-text">
            <span>${safeCur}</span>
            <span style="margin:0 2px;">/</span>
            <span>${safeMax}</span>
          </div>
        </div>
      </div>
    `;
  });

  // 零界能力
  let crisisHtml = '';
  if (d.crisisName) {
    crisisHtml = `
      <div class="fu-crisis-box">
        <div class="title">🔥 零界能力</div>
        <div class="detail">
          <strong>${d.crisisName || '（未设置）'}</strong>
          ${d.crisisCondition ? `｜ 条件：${d.crisisCondition}` : ''}
          ${d.crisisSlots ? `｜ 填充格数：${d.crisisSlots}` : ''}
        </div>
      </div>
    `;
  } else {
    crisisHtml = `
      <div class="fu-crisis-box">
        <div class="title">🔥 零界能力</div>
        <div class="detail">（未设置）</div>
      </div>
    `;
  }

  // 防御特性
  const defenses = [
    { label: '弱点', value: d.weakness || '无' },
    { label: '抵抗', value: d.resistance || '无' },
    { label: '免疫', value: d.immunity || '无' },
    { label: '吸收', value: d.absorb || '无' },
  ];
  let defensesHtml = '';
  defenses.forEach((def) => {
    defensesHtml += `<span class="tag"><strong>${def.label}：</strong>${def.value}</span>`;
  });

  // 武器
  const weapons = [d.weapon1, d.weapon2];
  let weaponsHtml = '';
  weapons.forEach((w) => {
    if (!w || !w.name || w.name.trim() === '') {
      weaponsHtml += `<tr class="empty-row"><td colspan="6" style="text-align:center;color:#555;">（无武器）</td></tr>`;
    } else {
      weaponsHtml += `
        <tr>
          <td>${w.category || '-'}</td>
          <td class="weapon-name">${w.name}</td>
          <td>${w.attack || '-'}</td>
          <td>${w.attr || '-'}</td>
          <td>${w.type || '-'}</td>
          <td>${w.damage || '-'}</td>
        </tr>
      `;
    }
  });

  return `
    <div class="fu-preview-card-wrapper" style="display:flex; flex-direction:column; height:100%; background:linear-gradient(145deg, #1e1e2f, #14141f); border:1px solid #3a3a55; border-radius:12px; overflow:hidden;">
      <div class="fu-preview-card-header" style="display:flex; justify-content:space-between; align-items:center; padding:12px 18px; background:rgba(0,0,0,0.3); border-bottom:1px solid #2a2a44; flex-shrink:0;">
        <div>
          <span style="font-size:20px;color:#f0c060;">${d.name || '未命名'}</span>
          <span class="level" style="font-size:13px;background:#2c2c44;padding:2px 12px;border-radius:20px;color:#aab;margin-left:10px;border:1px solid #3a3a55;">Lv.${d.level || 0}</span>
        </div>
        <span style="color:#666;font-size:11px;background:#1a1a2e;padding:2px 10px;border-radius:10px;border:1px solid #333;">预览</span>
      </div>
      <div class="fu-preview-card-body" style="padding:16px 18px 18px 18px; overflow-y:auto; flex:1;">
        <!-- 四维 -->
        <div class="fu-attributes">${attrsHtml}</div>
        <!-- 战斗 -->
        <div class="fu-combat-stats">
          <span>⚔️ 先攻 <span class="num">${d.init || 0}</span></span>
          <span>🛡️ 物防 <span class="num">${d.pd || 0}</span></span>
          <span>✨ 魔防 <span class="num">${d.md || 0}</span></span>
        </div>
        <!-- 资源 -->
        ${resourcesHtml}
        <!-- 零界 -->
        ${crisisHtml}
        <!-- 防御 -->
        <div class="fu-defenses">${defensesHtml}</div>
        <!-- 武器 -->
        <table class="fu-weapons">
          <thead><tr><th>类别</th><th>名称</th><th>检定</th><th>属性</th><th>类型</th><th>伤害</th></tr></thead>
          <tbody>${weaponsHtml}</tbody>
        </table>
      </div>
    </div>
  `;
}
