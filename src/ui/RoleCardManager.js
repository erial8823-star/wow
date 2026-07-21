// src/ui/RoleCardManager.js
// 角色卡管理界面 - 左右两栏（左预览 + 右列表）

import { DataManager } from '../core/DataManager.js';

// 存储上次选中卡片的 key
const PREVIEW_KEY = 'fu-preview-selected-id';

export class RoleCardManager {
  constructor() {
    this.element = null;
    this.overlay = null;
    this.selectedId = localStorage.getItem(PREVIEW_KEY) || null;
    this.isOpen = false;
    this.onClose = null;
  }

  // ---------- 渲染主界面 ----------
  render() {
    // 创建遮罩层
    this.overlay = document.createElement('div');
    this.overlay.className = 'fu-manager-overlay';

    // 创建主容器
    this.element = document.createElement('div');
    this.element.className = 'fu-manager-container';

    // ---- 头部 ----
    const header = document.createElement('div');
    header.className = 'fu-manager-header';
    header.innerHTML = `
      <span class="fu-manager-title">📋 FU角色卡管理</span>
      <button class="fu-manager-close" id="fuManagerClose">✕</button>
    `;

    // ---- 主体（左右两栏） ----
    const body = document.createElement('div');
    body.className = 'fu-manager-body';

    // 左栏：预览区
    const leftPane = document.createElement('div');
    leftPane.className = 'fu-manager-left';
    leftPane.id = 'fuManagerPreview';
    leftPane.innerHTML = `
      <div class="fu-manager-preview-placeholder">
        <span style="color:#666;font-size:16px;">👈 请从右侧选择一张角色卡</span>
      </div>
    `;

    // 右栏：列表区
    const rightPane = document.createElement('div');
    rightPane.className = 'fu-manager-right';
    rightPane.id = 'fuManagerList';

    // 组装
    body.appendChild(leftPane);
    body.appendChild(rightPane);
    this.element.appendChild(header);
    this.element.appendChild(body);
    this.overlay.appendChild(this.element);

    // ---- 事件绑定 ----
    // 关闭按钮
    const closeBtn = this.element.querySelector('#fuManagerClose');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => this.close());
    }

    // 点击遮罩层关闭（点击遮罩本身才关闭，点击容器内部不关闭）
    this.overlay.addEventListener('click', (e) => {
      if (e.target === this.overlay) {
        this.close();
      }
    });

    // ESC 键关闭
    this._escHandler = (e) => {
      if (e.key === 'Escape' && this.isOpen) {
        this.close();
      }
    };
    document.addEventListener('keydown', this._escHandler);

    // 渲染列表
    this._renderList();

    // 如果有选中的 ID，加载预览
    if (this.selectedId) {
      this._loadPreview(this.selectedId);
    }

    return this.overlay;
  }

  // ---------- 渲染右侧列表 ----------
  _renderList() {
    const listContainer = this.element.querySelector('#fuManagerList');
    if (!listContainer) return;

    const summaries = DataManager.listSummary();

    if (summaries.length === 0) {
      listContainer.innerHTML = `
        <div class="fu-manager-empty">
          <span>📭 暂无角色卡</span>
          <span style="font-size:12px;color:#666;margin-top:4px;">请先导入角色卡</span>
        </div>
      `;
      return;
    }

    let html = '<div class="fu-manager-list">';
    summaries.forEach((item) => {
      const isActive = (item.id === this.selectedId) ? 'active' : '';
      html += `
        <div class="fu-manager-list-item ${isActive}" data-id="${item.id}">
          <span class="fu-manager-list-name">${item.name}</span>
          <span class="fu-manager-list-id">${item.id}</span>
        </div>
      `;
    });
    html += '</div>';

    listContainer.innerHTML = html;

    // ---- 点击列表项 ----
    const items = listContainer.querySelectorAll('.fu-manager-list-item');
    items.forEach((item) => {
      item.addEventListener('click', () => {
        const id = item.dataset.id;
        this.selectedId = id;
        localStorage.setItem(PREVIEW_KEY, id);
        // 更新列表高亮
        items.forEach((el) => el.classList.remove('active'));
        item.classList.add('active');
        // 加载预览
        this._loadPreview(id);
      });
    });
  }

  // ---------- 加载预览（左侧） ----------
  _loadPreview(cardId) {
    const previewContainer = this.element.querySelector('#fuManagerPreview');
    if (!previewContainer) return;

    const data = DataManager.load(cardId);
    if (!data) {
      previewContainer.innerHTML = `
        <div class="fu-manager-preview-placeholder">
          <span style="color:#e74c3c;">⚠️ 未找到角色数据</span>
        </div>
      `;
      return;
    }

    // 生成只读预览卡片
    previewContainer.innerHTML = this._renderPreviewCard(data);
  }

  // ---------- 生成只读预览卡片（可滚动） ----------
  _renderPreviewCard(d) {
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

    // ✅ 修复：使用 flex 布局，body 区域可滚动
    return `
      <div class="fu-preview-card-wrapper">
        <div class="fu-preview-card-header">
          <div>
            <span style="font-size:20px;color:#f0c060;">${d.name || '未命名'}</span>
            <span class="level" style="font-size:13px;background:#2c2c44;padding:2px 12px;border-radius:20px;color:#aab;margin-left:10px;border:1px solid #3a3a55;">Lv.${d.level || 0}</span>
          </div>
          <span style="color:#666;font-size:11px;background:#1a1a2e;padding:2px 10px;border-radius:10px;border:1px solid #333;">预览</span>
        </div>
        <div class="fu-preview-card-body">
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

  // ---------- 打开 / 关闭 ----------
  open() {
    if (this.isOpen) return;
    if (!this.element) {
      this.render();
    }
    document.body.appendChild(this.overlay);
    this.isOpen = true;
    // 重新渲染列表（确保数据最新）
    this._renderList();
    // 如果有选中的 ID，重新加载预览
    if (this.selectedId) {
      this._loadPreview(this.selectedId);
    }
  }

  close() {
    if (!this.isOpen) return;
    this.overlay?.remove();
    this.isOpen = false;
    if (this._escHandler) {
      document.removeEventListener('keydown', this._escHandler);
      this._escHandler = null;
    }
    if (this.onClose) {
      this.onClose();
    }
  }

  // ---------- 刷新列表 ----------
  refresh() {
    if (this.isOpen) {
      this._renderList();
      if (this.selectedId) {
        this._loadPreview(this.selectedId);
      }
    }
  }

  // ---------- 销毁 ----------
  destroy() {
    this.close();
    this.element = null;
    this.overlay = null;
  }
}