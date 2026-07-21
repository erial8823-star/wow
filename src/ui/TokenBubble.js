// src/ui/TokenBubble.js - 修正角色名可编辑

import { DataManager } from '../core/DataManager.js';

const LOCK_KEY = 'fu-lock-';
const HPBAR_DATA_KEY = 'fu-hpbar-';

export class TokenBubble {
  constructor(options) {
    this.tokenId = options.tokenId;
    this.tokenElement = options.tokenElement;
    this.type = options.type;
    this.cardId = options.cardId || null;
    this.isRoleCard = options.isRoleCard || false;

    this.data = this._initData(options.data);

    this.container = null;
    this._animationFrame = null;
    this._resizeObserver = null;
    this._mutObserver = null;

    this.isLocked = this._loadLock();
    this.isGM = true;

    this._updatePosition = this._updatePosition.bind(this);
    this._onCardDataChange = this._onCardDataChange.bind(this);

    document.addEventListener('fu-card-data-changed', this._onCardDataChange);

    this._createContainer();
    this._render();
    this._startFollowing();
    this.show();
  }

  _initData(initialData) {
    if (this.isRoleCard && this.cardId) {
      const cardData = DataManager.load(this.cardId);
      if (cardData) {
        return {
          name: cardData.name || '未命名',
          pd: cardData.pd || 0,
          md: cardData.md || 0,
          hp: cardData.hp || 0,
          hpMax: cardData.hpMax || 1,
          mp: cardData.mp || 0,
          mpMax: cardData.mpMax || 1,
        };
      }
    }

    const saved = this._loadHpBarData();
    if (saved) return saved;

    return {
      name: initialData?.name || '未命名',
      pd: initialData?.pd || 0,
      md: initialData?.md || 0,
      hp: initialData?.hp || 0,
      hpMax: initialData?.hpMax || 1,
      mp: initialData?.mp || 0,
      mpMax: initialData?.mpMax || 1,
    };
  }

  _loadHpBarData() {
    const key = `${HPBAR_DATA_KEY}${this.tokenId}`;
    try {
      const raw = localStorage.getItem(key);
      if (raw) return JSON.parse(raw);
    } catch (e) {}
    return null;
  }

  _createContainer() {
    this.container = document.createElement('div');
    this.container.className = 'fu-token-bubble-container';
    this.container.style.opacity = '0';
    this.container.dataset.tokenId = this.tokenId;
    document.body.appendChild(this.container);
  }

  _createShieldSVG(color, stroke, value) {
    const shieldSize = 20;
    return `
      <svg viewBox="0 0 28 28" xmlns="http://www.w3.org/2000/svg" 
           style="width:${shieldSize}px; height:${shieldSize}px; display:block;">
        <path d="M14 2L3 7.5v8c0 6.5 11 12.5 11 12.5s11-6 11-12.5v-8L14 2z" 
              fill="${color}" stroke="${stroke}" stroke-width="1.5"/>
        <text x="14" y="18" text-anchor="middle" 
              font-size="12" font-weight="bold" fill="white"
              font-family="Arial, sans-serif">${value}</text>
      </svg>
    `;
  }

  _getDisplayValue(value) {
    if (this.isLocked && !this.isGM) return '??';
    return value;
  }

  _render() {
    if (!this.container) return;
    const d = this.data;

    const hpPercent = d.hpMax > 0 ? Math.min((d.hp / d.hpMax) * 100, 100) : 0;
    const mpPercent = d.mpMax > 0 ? Math.min((d.mp / d.mpMax) * 100, 100) : 0;

    const shieldBlue = this._createShieldSVG('#3498db', '#2980b9', this._getDisplayValue(d.pd));
    const shieldPurple = this._createShieldSVG('#9b59b6', '#8e44ad', this._getDisplayValue(d.md));

    const lockIcon = this.isLocked ? '🔒' : '🔓';
    const lockTitle = this.isLocked ? '已锁定（非GM隐藏数值）' : '未锁定';

    const hpDisplay = this._getDisplayValue(d.hp);
    const hpMaxDisplay = this._getDisplayValue(d.hpMax);
    const mpDisplay = this._getDisplayValue(d.mp);
    const mpMaxDisplay = this._getDisplayValue(d.mpMax);

    this.container.innerHTML = `
      <div class="fu-bubble-token-layer" id="fuTokenLayer">
        <div class="fu-bubble-avatar">👤</div>
        <div class="fu-bubble-shields">
          <div class="shield-item shield-blue" id="fuShieldPd">${shieldBlue}</div>
          <div class="shield-item shield-purple" id="fuShieldMd">${shieldPurple}</div>
          <div class="shield-item shield-lock" id="fuLockBtn" title="${lockTitle}">${lockIcon}</div>
        </div>
      </div>

      <div class="fu-bubble-bars">
        <div class="fu-bubble-bar" id="fuHpBar">
          <div class="fill hp-fill" style="width:${hpPercent}%;"></div>
          <span class="bar-text">
            HP 
            <span class="fu-editable-value" id="fuHpCur">${hpDisplay}</span>
            /
            <span class="fu-editable-value" id="fuHpMax">${hpMaxDisplay}</span>
          </span>
        </div>
        <div class="fu-bubble-bar" id="fuMpBar">
          <div class="fill mp-fill" style="width:${mpPercent}%;"></div>
          <span class="bar-text">
            MP 
            <span class="fu-editable-value" id="fuMpCur">${mpDisplay}</span>
            /
            <span class="fu-editable-value" id="fuMpMax">${mpMaxDisplay}</span>
          </span>
        </div>
      </div>

      <div class="fu-bubble-name">${d.name || '未命名'}</div>
    `;

    // ===== 绑定事件 =====

    // HP 当前值
    const hpCur = this.container.querySelector('#fuHpCur');
    if (hpCur) {
      hpCur.style.cursor = 'pointer';
      hpCur.addEventListener('click', (e) => {
        e.stopPropagation();
        if (this.isLocked && !this.isGM) return alert('🔒 已锁定');
        this._editSingleValue('hp', this.data.hp, 'HP当前值');
      });
    }

    // HP 最大值
    const hpMax = this.container.querySelector('#fuHpMax');
    if (hpMax) {
      hpMax.style.cursor = 'pointer';
      hpMax.addEventListener('click', (e) => {
        e.stopPropagation();
        if (this.isLocked && !this.isGM) return alert('🔒 已锁定');
        this._editSingleValue('hpMax', this.data.hpMax, 'HP最大值');
      });
    }

    // MP 当前值
    const mpCur = this.container.querySelector('#fuMpCur');
    if (mpCur) {
      mpCur.style.cursor = 'pointer';
      mpCur.addEventListener('click', (e) => {
        e.stopPropagation();
        if (this.isLocked && !this.isGM) return alert('🔒 已锁定');
        this._editSingleValue('mp', this.data.mp, 'MP当前值');
      });
    }

    // MP 最大值
    const mpMaxEl = this.container.querySelector('#fuMpMax');
    if (mpMaxEl) {
      mpMaxEl.style.cursor = 'pointer';
      mpMaxEl.addEventListener('click', (e) => {
        e.stopPropagation();
        if (this.isLocked && !this.isGM) return alert('🔒 已锁定');
        this._editSingleValue('mpMax', this.data.mpMax, 'MP最大值');
      });
    }

    // 物防
    const pdEl = this.container.querySelector('#fuShieldPd');
    if (pdEl) {
      pdEl.style.cursor = 'pointer';
      pdEl.addEventListener('click', (e) => {
        e.stopPropagation();
        if (this.isLocked && !this.isGM) return alert('🔒 已锁定');
        this._editSingleValue('pd', this.data.pd || 0, '物防');
      });
    }

    // 魔防
    const mdEl = this.container.querySelector('#fuShieldMd');
    if (mdEl) {
      mdEl.style.cursor = 'pointer';
      mdEl.addEventListener('click', (e) => {
        e.stopPropagation();
        if (this.isLocked && !this.isGM) return alert('🔒 已锁定');
        this._editSingleValue('md', this.data.md || 0, '魔防');
      });
    }

    // ===== 角色名（修复：确保可点击） =====
    const nameEl = this.container.querySelector('.fu-bubble-name');
    if (nameEl) {
      nameEl.style.cursor = 'pointer';
      nameEl.style.pointerEvents = 'auto'; // 强制允许点击
      nameEl.addEventListener('click', (e) => {
        e.stopPropagation();
        if (this.isLocked && !this.isGM) return alert('🔒 已锁定');
        this._editName();
      });
    }

    // 锁按钮
    const lockBtn = this.container.querySelector('#fuLockBtn');
    if (lockBtn) {
      lockBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this._toggleLock();
      });
    }

    // Token层点击打开卡片
    const tokenLayer = this.container.querySelector('#fuTokenLayer');
    if (tokenLayer) {
      tokenLayer.addEventListener('click', (e) => {
        if (e.target.closest('#fuLockBtn')) return;
        this._openFullCard();
      });
    }

    this._updatePosition();
  }

  // ---------- 统一单值修改 ----------
  _editSingleValue(field, currentValue, label) {
    const newValue = prompt(`输入 ${label}:`, currentValue);
    if (newValue === null) return;
    const num = parseInt(newValue);
    if (isNaN(num) || num < 0) {
      alert('请输入有效数字');
      return;
    }

    if (field === 'hpMax' && num < this.data.hp) {
      alert('HP最大值不能小于当前值');
      return;
    }
    if (field === 'mpMax' && num < this.data.mp) {
      alert('MP最大值不能小于当前值');
      return;
    }
    if (field === 'hp' && num > this.data.hpMax) {
      alert('HP当前值不能大于最大值');
      return;
    }
    if (field === 'mp' && num > this.data.mpMax) {
      alert('MP当前值不能大于最大值');
      return;
    }

    this.data[field] = num;
    this._saveData();
    this._render();
  }

  // ---------- 编辑角色名 ----------
  _editName() {
    const newName = prompt('输入角色名:', this.data.name || '');
    if (newName === null) return;
    const trimmed = newName.trim();
    if (!trimmed) return alert('角色名不能为空');
    this.data.name = trimmed;
    this._saveData();
    this._render();
  }

  // ---------- 保存数据 ----------
  _saveData() {
    const key = `${HPBAR_DATA_KEY}${this.tokenId}`;
    localStorage.setItem(key, JSON.stringify(this.data));

    if (this.isRoleCard && this.cardId) {
      const cardData = DataManager.load(this.cardId);
      if (cardData) {
        cardData.name = this.data.name;
        cardData.pd = this.data.pd;
        cardData.md = this.data.md;
        cardData.hp = this.data.hp;
        cardData.hpMax = this.data.hpMax;
        cardData.mp = this.data.mp;
        cardData.mpMax = this.data.mpMax;
        DataManager.save(this.cardId, cardData);
        document.dispatchEvent(new CustomEvent('fu-card-data-changed', {
          detail: { cardId: this.cardId }
        }));
        console.log(`🔄 已同步更新角色卡: ${this.cardId}`);
      }
    }
  }

  // ---------- 监听角色卡变化 ----------
  _onCardDataChange(e) {
    if (this.isRoleCard && this.cardId && e.detail.cardId === this.cardId) {
      const newData = DataManager.load(this.cardId);
      if (newData) {
        this.data = {
          name: newData.name !== undefined ? newData.name : this.data.name,
          pd: newData.pd !== undefined ? newData.pd : this.data.pd,
          md: newData.md !== undefined ? newData.md : this.data.md,
          hp: newData.hp !== undefined ? newData.hp : this.data.hp,
          hpMax: newData.hpMax !== undefined ? newData.hpMax : this.data.hpMax,
          mp: newData.mp !== undefined ? newData.mp : this.data.mp,
          mpMax: newData.mpMax !== undefined ? newData.mpMax : this.data.mpMax,
        };
        const key = `${HPBAR_DATA_KEY}${this.tokenId}`;
        localStorage.setItem(key, JSON.stringify(this.data));
        this._render();
        this._updatePosition();
        console.log(`🔄 气泡已同步角色卡: ${this.cardId}`);
      }
    }
  }

  // ---------- 锁 ----------
  _toggleLock() {
    if (!this.isGM) return alert('🔒 只有GM可以切换锁状态');
    this.isLocked = !this.isLocked;
    localStorage.setItem(`${LOCK_KEY}${this.tokenId}`, JSON.stringify({ locked: this.isLocked }));
    this._render();
  }

  _loadLock() {
    try {
      const raw = localStorage.getItem(`${LOCK_KEY}${this.tokenId}`);
      if (raw) return JSON.parse(raw).locked || false;
    } catch (e) {}
    return false;
  }

  setGM(isGM) {
    this.isGM = isGM;
    this._render();
  }

  // ---------- 打开卡片 ----------
  _openFullCard() {
    if (this.isRoleCard && this.cardId) {
      if (typeof window.testShowCard === 'function') {
        window.testShowCard(this.cardId);
      }
    } else {
      alert(`📊 ${this.data.name}\nHP: ${this.data.hp}/${this.data.hpMax}\nMP: ${this.data.mp}/${this.data.mpMax}\n物防: ${this.data.pd}\n魔防: ${this.data.md}`);
    }
  }

  updateData(newData) {
    this.data = { ...this.data, ...newData };
    this._render();
  }

  getData() {
    return this.data;
  }

  // ---------- 位置 ----------
  _updatePosition() {
    if (!this.container || !this.tokenElement) return;
    if (this._animationFrame) cancelAnimationFrame(this._animationFrame);
    this._animationFrame = requestAnimationFrame(() => {
      const rect = this.tokenElement.getBoundingClientRect();
      const diameter = Math.min(rect.width, rect.height);
      const scale = diameter / 56;
      const containerWidth = diameter * 1.2;
      const containerHeight = diameter + diameter * 0.7;
      const left = rect.left + rect.width / 2 - containerWidth / 2;
      const top = rect.top;
      this.container.style.left = left + 'px';
      this.container.style.top = top + 'px';
      this.container.style.width = containerWidth + 'px';
      this.container.style.height = containerHeight + 'px';
      this.container.style.setProperty('--bubble-scale', scale);
      this.container.style.opacity = '1';
      this._animationFrame = null;
    });
  }

  _startFollowing() {
    if (window.ResizeObserver) {
      this._resizeObserver = new ResizeObserver(() => this._updatePosition());
      this._resizeObserver.observe(this.tokenElement);
    }
    window.addEventListener('scroll', this._updatePosition, true);
    window.addEventListener('resize', this._updatePosition);
    this._mutObserver = new MutationObserver(() => this._updatePosition());
    this._mutObserver.observe(this.tokenElement, {
      attributes: true,
      attributeFilter: ['style', 'class', 'transform']
    });
  }

  show() {
    if (this.container) {
      this.container.classList.add('visible');
      this._updatePosition();
    }
  }

  hide() {
    if (this.container) {
      this.container.classList.remove('visible');
    }
  }

  destroy() {
    this.hide();
    this.container?.remove();
    this.container = null;
    document.removeEventListener('fu-card-data-changed', this._onCardDataChange);
    window.removeEventListener('scroll', this._updatePosition, true);
    window.removeEventListener('resize', this._updatePosition);
    if (this._resizeObserver) this._resizeObserver.disconnect();
    if (this._mutObserver) this._mutObserver.disconnect();
    if (this._animationFrame) cancelAnimationFrame(this._animationFrame);
  }

  refresh() {
    this._render();
    this._updatePosition();
  }
}