// src/ui/FullCard.js - 添加数据变更监听，实时刷新

import { DataManager } from '../core/DataManager.js';

export class FullCard {
  constructor(cardId, data, onClose) {
    this.cardId = cardId;
    this.data = data;
    this.onClose = onClose || (() => {});
    this.element = null;
    this.isDragging = false;
    this.isResizing = false;
    this.dragOffsetX = 0;
    this.dragOffsetY = 0;
    this.resizeStartX = 0;
    this.resizeStartY = 0;
    this.resizeStartWidth = 0;
    this.resizeStartHeight = 0;

    this._onDragMove = this._onDragMove.bind(this);
    this._onDragEnd = this._onDragEnd.bind(this);
    this._onResizeMove = this._onResizeMove.bind(this);
    this._onResizeEnd = this._onResizeEnd.bind(this);
    this._onCardDataChanged = this._onCardDataChanged.bind(this);

    // 监听自定义事件，当角色卡数据被其他模块修改时刷新
    document.addEventListener('fu-card-data-changed', this._onCardDataChanged);
  }

  // ---------- 数据变更回调 ----------
  _onCardDataChanged(e) {
    if (e.detail.cardId === this.cardId) {
      const newData = DataManager.load(this.cardId);
      if (newData) {
        // 更新数据
        this.data = newData;
        // 重新渲染卡片
        this._rerender();
        console.log(`🔄 卡片已刷新 (${this.cardId})`);
      }
    }
  }

  // ---------- 重新渲染（保留位置和大小） ----------
  _rerender() {
    if (!this.element) return;
    // 保存当前尺寸和位置
    const rect = this.element.getBoundingClientRect();
    const width = this.element.style.width || rect.width + 'px';
    const height = this.element.style.height || rect.height + 'px';
    const left = this.element.style.left || rect.left + 'px';
    const top = this.element.style.top || rect.top + 'px';
    const transform = this.element.style.transform || 'none';

    // 移除旧元素，创建新元素
    const parent = this.element.parentNode;
    if (parent) {
      parent.removeChild(this.element);
    }
    // 重新渲染
    this.render();
    // 恢复位置和大小
    this.element.style.width = width;
    this.element.style.height = height;
    this.element.style.left = left;
    this.element.style.top = top;
    this.element.style.transform = transform;
    // 重新添加到页面
    if (parent) {
      parent.appendChild(this.element);
    } else {
      document.body.appendChild(this.element);
    }
    // 更新字体大小
    this._updateFontSize(parseFloat(width) || 620);
  }

  render() {
    const d = this.data;
    this.element = document.createElement('div');
    this.element.className = 'fu-full-card';

    this.element.innerHTML = `
      <div class="fu-card-header">
        <div>
          <span style="font-size:22px; color:#f0c060;">${d.name || '未命名'}</span>
          <span class="level">Lv.${d.level || 0}</span>
        </div>
        <button class="fu-card-close" id="fuCloseBtn">×</button>
      </div>

      <div class="fu-card-body">
        <div class="fu-attributes">
          <div class="fu-attr-item"><span class="label">敏捷</span><span class="value">D${d.dex || 0}</span></div>
          <div class="fu-attr-item"><span class="label">洞察</span><span class="value">D${d.ins || 0}</span></div>
          <div class="fu-attr-item"><span class="label">力量</span><span class="value">D${d.mig || 0}</span></div>
          <div class="fu-attr-item"><span class="label">意志</span><span class="value">D${d.wlp || 0}</span></div>
        </div>

        <div class="fu-combat-stats">
          <span>⚔️ 先攻 <span class="num fu-editable" data-field="init">${d.init || 0}</span></span>
          <span>🛡️ 物防 <span class="num fu-editable" data-field="pd">${d.pd || 0}</span></span>
          <span>✨ 魔防 <span class="num fu-editable" data-field="md">${d.md || 0}</span></span>
        </div>

        ${this._renderResource('HP', d.hp, d.hpMax, 'hp', 'resource-hp')}
        ${this._renderResource('MP', d.mp, d.mpMax, 'mp', 'resource-mp')}
        ${this._renderResource('IP', d.ip, d.ipMax, 'ip', 'resource-ip')}
        ${this._renderResource('命刻', d.crisisCurrent, d.crisisMax, 'crisis', 'resource-crisis')}

        <div class="fu-crisis-box">
          <div class="title">🔥 零界能力</div>
          <div class="detail">
            <strong>${d.crisisName || '（未设置）'}</strong>
            ${d.crisisCondition ? `｜ 条件：${d.crisisCondition}` : ''}
            ${d.crisisSlots ? `｜ 填充格数：${d.crisisSlots}` : ''}
          </div>
        </div>

        <div class="fu-defenses">
          <span class="tag"><strong>弱点：</strong>${d.weakness || '无'}</span>
          <span class="tag"><strong>抵抗：</strong>${d.resistance || '无'}</span>
          <span class="tag"><strong>免疫：</strong>${d.immunity || '无'}</span>
          <span class="tag"><strong>吸收：</strong>${d.absorb || '无'}</span>
        </div>

        <table class="fu-weapons">
          <thead><tr><th>类别</th><th>名称</th><th>检定</th><th>属性</th><th>类型</th><th>伤害</th></tr></thead>
          <tbody>
            ${this._renderWeaponRow(d.weapon1)}
            ${this._renderWeaponRow(d.weapon2)}
          </tbody>
        </table>
      </div>

      <div class="fu-resize-handle" id="fuResizeHandle">↘</div>
    `;

    const closeBtn = this.element.querySelector('#fuCloseBtn');
    if (closeBtn) closeBtn.addEventListener('click', () => this.close());

    this._setupEditableFields();

    const header = this.element.querySelector('.fu-card-header');
    if (header) {
      header.addEventListener('mousedown', (e) => this._onDragStart(e));
    }

    const resizeHandle = this.element.querySelector('#fuResizeHandle');
    if (resizeHandle) {
      resizeHandle.addEventListener('mousedown', (e) => this._onResizeStart(e));
    }

    this.element.addEventListener('selectstart', (e) => e.preventDefault());

    this._loadSize();

    return this.element;
  }

  _renderResource(label, current, max, fieldKey, cssClass) {
    const safeCur = Number(current) || 0;
    const safeMax = Number(max) || 1;
    const percent = Math.min((safeCur / safeMax) * 100, 100);
    return `
      <div class="resource-row ${cssClass}">
        <span class="label">${label}</span>
        <div class="bar-wrap" data-field="${fieldKey}">
          <div class="bar-fill" style="width:${percent}%;"></div>
          <div class="bar-text">
            <span class="fu-editable" data-field="${fieldKey}Cur">${safeCur}</span>
            <span style="margin:0 2px;">/</span>
            <span class="fu-editable" data-field="${fieldKey}Max">${safeMax}</span>
          </div>
        </div>
      </div>
    `;
  }

  _renderWeaponRow(weapon) {
    if (!weapon || !weapon.name || weapon.name.trim() === '') {
      return `<tr class="empty-row"><td colspan="6" style="text-align:center; color:#555;">（无武器）</td></tr>`;
    }
    return `
      <tr>
        <td>${weapon.category || '-'}</td>
        <td class="weapon-name">${weapon.name}</td>
        <td>${weapon.attack || '-'}</td>
        <td>${weapon.attr || '-'}</td>
        <td>${weapon.type || '-'}</td>
        <td>${weapon.damage || '-'}</td>
      </tr>
    `;
  }

  _setupEditableFields() {
    const editables = this.element.querySelectorAll('.fu-editable');
    editables.forEach((el) => {
      el.addEventListener('click', (e) => {
        e.stopPropagation();
        const field = el.dataset.field;
        const oldValue = el.textContent.trim();
        const input = document.createElement('input');
        input.type = 'number';
        input.className = 'fu-editable-input';
        input.value = oldValue;
        input.style.width = '50px';
        el.replaceWith(input);
        input.focus();
        input.select();

        const saveNewValue = () => {
          let newVal = input.value.trim();
          if (newVal === '') newVal = '0';
          const numVal = Number(newVal);
          if (isNaN(numVal)) {
            alert('请输入有效数字');
            input.replaceWith(el);
            return;
          }
          this._updateField(field, numVal);
          el.textContent = numVal;
          input.replaceWith(el);
        };

        input.addEventListener('blur', saveNewValue);
        input.addEventListener('keydown', (ev) => {
          if (ev.key === 'Enter') {
            ev.preventDefault();
            input.blur();
          }
          if (ev.key === 'Escape') {
            input.replaceWith(el);
          }
        });
      });
    });
  }

  _updateField(field, value) {
    let targetKey = '';
    if (field === 'init' || field === 'pd' || field === 'md') {
      targetKey = field;
    } else if (field.endsWith('Cur')) {
      const base = field.slice(0, -3);
      if (base === 'hp') targetKey = 'hp';
      else if (base === 'mp') targetKey = 'mp';
      else if (base === 'ip') targetKey = 'ip';
      else if (base === 'crisis') targetKey = 'crisisCurrent';
    } else if (field.endsWith('Max')) {
      const base = field.slice(0, -3);
      if (base === 'hp') targetKey = 'hpMax';
      else if (base === 'mp') targetKey = 'mpMax';
      else if (base === 'ip') targetKey = 'ipMax';
      else if (base === 'crisis') targetKey = 'crisisMax';
    }

    if (!targetKey) return;

    this.data[targetKey] = value;
    DataManager.save(this.cardId, this.data);
    console.log(`💾 已更新 ${targetKey} = ${value}`);
    this._updateProgressBars();

    document.dispatchEvent(new CustomEvent('fu-card-data-changed', {
      detail: { cardId: this.cardId }
    }));
  }

  _updateProgressBars() {
    const d = this.data;
    const mappings = [
      { key: 'hp', cur: d.hp, max: d.hpMax, cls: 'resource-hp' },
      { key: 'mp', cur: d.mp, max: d.mpMax, cls: 'resource-mp' },
      { key: 'ip', cur: d.ip, max: d.ipMax, cls: 'resource-ip' },
      { key: 'crisis', cur: d.crisisCurrent, max: d.crisisMax, cls: 'resource-crisis' },
    ];

    mappings.forEach(({ key, cur, max, cls }) => {
      const row = this.element.querySelector(`.${cls}`);
      if (!row) return;
      const fill = row.querySelector('.bar-fill');
      const text = row.querySelector('.bar-text');
      if (fill) {
        const percent = max > 0 ? Math.min((cur / max) * 100, 100) : 0;
        fill.style.width = `${percent}%`;
      }
      if (text) {
        const curSpan = text.querySelector(`[data-field="${key}Cur"]`);
        const maxSpan = text.querySelector(`[data-field="${key}Max"]`);
        if (curSpan) curSpan.textContent = cur;
        if (maxSpan) maxSpan.textContent = max;
      }
    });
  }

  // ---------- 拖拽 ----------
  _onDragStart(e) {
    if (e.button !== 0) return;
    if (e.target.closest('.fu-card-close') || e.target.closest('input')) return;

    this.isDragging = true;
    const rect = this.element.getBoundingClientRect();
    this.dragOffsetX = e.clientX - rect.left;
    this.dragOffsetY = e.clientY - rect.top;

    this.element.style.transform = 'none';
    this.element.style.left = rect.left + 'px';
    this.element.style.top = rect.top + 'px';

    document.addEventListener('mousemove', this._onDragMove);
    document.addEventListener('mouseup', this._onDragEnd);
    e.preventDefault();
  }

  _onDragMove(e) {
    if (!this.isDragging) return;
    const newX = e.clientX - this.dragOffsetX;
    const newY = e.clientY - this.dragOffsetY;
    const maxX = window.innerWidth - this.element.offsetWidth;
    const maxY = window.innerHeight - this.element.offsetHeight;
    this.element.style.left = Math.max(0, Math.min(newX, maxX)) + 'px';
    this.element.style.top = Math.max(0, Math.min(newY, maxY)) + 'px';
  }

  _onDragEnd(e) {
    if (!this.isDragging) return;
    this.isDragging = false;
    document.removeEventListener('mousemove', this._onDragMove);
    document.removeEventListener('mouseup', this._onDragEnd);
  }

  // ---------- 缩放 ----------
  _onResizeStart(e) {
    e.preventDefault();
    e.stopPropagation();
    this.isResizing = true;
    const rect = this.element.getBoundingClientRect();
    this.resizeStartX = e.clientX;
    this.resizeStartY = e.clientY;
    this.resizeStartWidth = rect.width;
    this.resizeStartHeight = rect.height;

    document.addEventListener('mousemove', this._onResizeMove);
    document.addEventListener('mouseup', this._onResizeEnd);
  }

  _onResizeMove(e) {
    if (!this.isResizing) return;
    const deltaX = e.clientX - this.resizeStartX;
    const deltaY = e.clientY - this.resizeStartY;

    const minWidth = 400;
    const minHeight = 300;
    let newWidth = Math.max(minWidth, this.resizeStartWidth + deltaX);
    let newHeight = Math.max(minHeight, this.resizeStartHeight + deltaY);

    this.element.style.width = newWidth + 'px';
    this.element.style.height = newHeight + 'px';
    this._updateFontSize(newWidth);
    this._saveSize(newWidth, newHeight);
  }

  _onResizeEnd(e) {
    if (!this.isResizing) return;
    this.isResizing = false;
    document.removeEventListener('mousemove', this._onResizeMove);
    document.removeEventListener('mouseup', this._onResizeEnd);
  }

  _updateFontSize(cardWidth) {
    if (!this.element) return;
    const baseWidth = 620;
    const baseFontSize = 14;
    let scale = cardWidth / baseWidth;
    scale = Math.max(0.6, Math.min(1.8, scale));
    const newFontSize = baseFontSize * scale;

    this.element.style.fontSize = newFontSize + 'px';

    const headerSpan = this.element.querySelector('.fu-card-header > div > span');
    if (headerSpan) headerSpan.style.fontSize = (22 * scale) + 'px';

    const attrValues = this.element.querySelectorAll('.fu-attr-item .value');
    attrValues.forEach(el => { el.style.fontSize = (22 * scale) + 'px'; });

    const combatNums = this.element.querySelectorAll('.fu-combat-stats .num');
    combatNums.forEach(el => { el.style.fontSize = (18 * scale) + 'px'; });

    const barTexts = this.element.querySelectorAll('.bar-text');
    barTexts.forEach(el => { el.style.fontSize = (13 * scale) + 'px'; });

    const table = this.element.querySelector('.fu-weapons');
    if (table) table.style.fontSize = (13 * scale) + 'px';

    const crisisDetail = this.element.querySelector('.fu-crisis-box .detail');
    if (crisisDetail) crisisDetail.style.fontSize = (13 * scale) + 'px';

    const defenses = this.element.querySelector('.fu-defenses');
    if (defenses) defenses.style.fontSize = (12 * scale) + 'px';
  }

  _saveSize(width, height) {
    const key = `fu-card-size-${this.cardId}`;
    try { localStorage.setItem(key, JSON.stringify({ width, height })); } catch (e) {}
  }

  _loadSize() {
    const key = `fu-card-size-${this.cardId}`;
    try {
      const raw = localStorage.getItem(key);
      if (raw) {
        const { width, height } = JSON.parse(raw);
        this.element.style.width = width + 'px';
        this.element.style.height = height + 'px';
        this._updateFontSize(width);
      }
    } catch (e) {}
  }

  open() {
    if (!this.element) this.render();
    const old = document.querySelector('.fu-full-card');
    if (old) old.remove();
    document.body.appendChild(this.element);

    if (!localStorage.getItem(`fu-card-size-${this.cardId}`)) {
      setTimeout(() => {
        const rect = this.element.getBoundingClientRect();
        if (rect.width > 0) this._updateFontSize(rect.width);
      }, 50);
    }
  }

  close() {
    this.element?.remove();
    document.removeEventListener('mousemove', this._onDragMove);
    document.removeEventListener('mouseup', this._onDragEnd);
    document.removeEventListener('mousemove', this._onResizeMove);
    document.removeEventListener('mouseup', this._onResizeEnd);
    // 移除事件监听
    document.removeEventListener('fu-card-data-changed', this._onCardDataChanged);
    if (this.onClose) this.onClose();
  }
}