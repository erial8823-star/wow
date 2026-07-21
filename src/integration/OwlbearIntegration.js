// src/integration/OwlbearIntegration.js
// 枭熊2平台集成模块 - 负责与枭熊2交互

import { DataManager } from '../core/DataManager.js';
import { ExcelParser } from '../core/ExcelParser.js';
import { TokenBinder } from './TokenBinder.js';
import { RoleCardManager } from '../ui/RoleCardManager.js';
import { FullCard } from '../ui/FullCard.js';

export class OwlbearIntegration {
  constructor() {
    this.binder = null;
    this.roleManager = null;
    this.uploadModal = null;
    this.isInitialized = false;
    this._pendingFile = null;
    this._pendingToken = null;
    this._contextToken = null;
    this._fileInput = null;

    // 绑定方法
    this._onTokenClick = this._onTokenClick.bind(this);
    this._onTokenContextMenu = this._onTokenContextMenu.bind(this);
    this._onToolbarClick = this._onToolbarClick.bind(this);
    this._onDocumentClick = this._onDocumentClick.bind(this);
  }

  // ============================================================
  // 初始化
  // ============================================================
  init() {
    if (this.isInitialized) return;
    console.log('🦉 枭熊2集成模块初始化中...');

    // 等待枭熊2环境就绪
    this._waitForOwlbear().then(() => {
      this._setupToolbarButton();
      this._setupTokenEvents();
      this._setupGlobalEvents();
      this._restoreBindings();
      this.isInitialized = true;
      console.log('✅ 枭熊2集成模块初始化完成');
    }).catch((err) => {
      console.warn('⚠️ 枭熊2环境未就绪，将在DOM加载完成后重试');
      // 如果枭熊2还未加载，等待DOM就绪后重试
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => this.init());
      } else {
        setTimeout(() => this.init(), 2000);
      }
    });
  }

  // ============================================================
  // 等待枭熊2环境就绪
  // ============================================================
  _waitForOwlbear() {
    return new Promise((resolve, reject) => {
      // 检查是否存在枭熊2的全局对象
      // 枭熊2 2.0 使用 OBR 全局对象
      const check = () => {
        if (typeof window.OBR !== 'undefined') {
          resolve();
        } else {
          // 等待最多10秒
          let attempts = 0;
          const interval = setInterval(() => {
            attempts++;
            if (typeof window.OBR !== 'undefined') {
              clearInterval(interval);
              resolve();
            } else if (attempts > 20) {
              clearInterval(interval);
              reject(new Error('枭熊2环境加载超时'));
            }
          }, 500);
        }
      };
      check();
    });
  }

  // ============================================================
  // 获取Token列表（枭熊2 API 封装）
  // ============================================================
  _getTokens() {
    // 枭熊2 2.0 通过 OBR 获取Token
    try {
      // 方法1：通过 OBR API
      if (typeof window.OBR !== 'undefined' && window.OBR.scene) {
        // OBR.scene.tokens 可能是一个数组或对象
        const tokens = window.OBR.scene.tokens;
        if (Array.isArray(tokens)) return tokens;
        if (tokens && typeof tokens === 'object') {
          return Object.values(tokens);
        }
      }
    } catch (e) {
      console.warn('通过OBR API获取Token失败:', e);
    }

    // 方法2：通过DOM查找
    try {
      // 枭熊2的Token元素通常有 .token 类名或 data-token-id 属性
      const tokenEls = document.querySelectorAll('.token, [data-token-id]');
      const tokens = [];
      tokenEls.forEach(el => {
        const id = el.dataset.tokenId || el.id;
        if (id) {
          tokens.push({
            id: id,
            element: el,
            getBoundingClientRect: () => el.getBoundingClientRect()
          });
        }
      });
      return tokens;
    } catch (e) {
      console.warn('通过DOM查找Token失败:', e);
    }

    return [];
  }

  // ============================================================
  // 获取当前选中的Token
  // ============================================================
  _getSelectedToken() {
    try {
      // 方法1：通过 OBR API
      if (typeof window.OBR !== 'undefined' && window.OBR.scene) {
        const selected = window.OBR.scene.selectedTokens;
        if (selected && selected.length > 0) {
          const token = selected[0];
          const element = this._findTokenElement(token.id || token);
          if (element) {
            return { id: token.id || token, element: element };
          }
          return { id: token.id || token, element: null };
        }
      }
    } catch (e) {
      console.warn('通过OBR API获取选中Token失败:', e);
    }

    // 方法2：通过DOM查找选中的Token
    try {
      const selectedEl = document.querySelector('.token.selected, [data-token-id].selected');
      if (selectedEl) {
        const id = selectedEl.dataset.tokenId || selectedEl.id;
        return { id: id, element: selectedEl };
      }
    } catch (e) {
      console.warn('通过DOM查找选中Token失败:', e);
    }

    return null;
  }

  // ============================================================
  // 查找Token对应的DOM元素
  // ============================================================
  _findTokenElement(tokenId) {
    if (!tokenId) return null;
    try {
      // 通过data属性查找
      const el = document.querySelector(`[data-token-id="${tokenId}"]`);
      if (el) return el;
      // 通过id查找
      const el2 = document.getElementById(tokenId);
      if (el2) return el2;
    } catch (e) {}
    return null;
  }

  // ============================================================
  // 创建隐藏的文件输入
  // ============================================================
  _createFileInput() {
    if (this._fileInput) return this._fileInput;
    this._fileInput = document.createElement('input');
    this._fileInput.type = 'file';
    this._fileInput.accept = '.xlsx,.xls';
    this._fileInput.style.display = 'none';
    this._fileInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        this._handleFileUpload(file);
      }
      this._fileInput.value = '';
    });
    document.body.appendChild(this._fileInput);
    return this._fileInput;
  }

  // ============================================================
  // 处理文件上传
  // ============================================================
  async _handleFileUpload(file) {
    try {
      console.log('📂 开始解析Excel文件:', file.name);
      const data = await ExcelParser.parse(file);
      console.log('✅ 解析成功:', data);

      // 生成卡片ID
      const cardId = data.name || `card-${Date.now()}`;

      // 保存数据
      DataManager.save(cardId, data);
      console.log(`💾 角色卡已保存: ${cardId}`);

      // 如果有待绑定的Token，自动绑定
      if (this._pendingToken) {
        const token = this._pendingToken;
        this._pendingToken = null;
        this._bindRoleToToken(token.id, token.element, cardId);
      } else {
        // 否则让用户选择Token
        alert(`✅ 角色卡 "${data.name}" 已导入！\n请右键点击一个Token，选择"绑定FU角色卡"来绑定。`);
        // 刷新管理界面
        if (this.roleManager && this.roleManager.isOpen) {
          this.roleManager.refresh();
        }
      }
    } catch (error) {
      console.error('❌ 解析失败:', error);
      alert('❌ 解析失败：' + error.message);
    }
  }

  // ============================================================
  // 绑定角色卡到Token
  // ============================================================
  _bindRoleToToken(tokenId, tokenElement, cardId) {
    if (!this.binder) {
      this.binder = new TokenBinder();
    }
    const success = this.binder.bindRole(tokenId, tokenElement, cardId);
    if (success) {
      const data = DataManager.load(cardId);
      console.log(`✅ Token ${tokenId} 已绑定角色卡: ${data?.name || cardId}`);
    }
    return success;
  }

  // ============================================================
  // 绑定血条组件到Token
  // ============================================================
  _bindHpBarToToken(tokenId, tokenElement) {
    if (!this.binder) {
      this.binder = new TokenBinder();
    }
    const success = this.binder.bindHpBar(tokenId, tokenElement, {
      name: '测试勇士',
      pd: 8,
      md: 12,
      hp: 75,
      hpMax: 100,
      mp: 40,
      mpMax: 80,
    });
    if (success) {
      console.log(`✅ Token ${tokenId} 已绑定血条组件`);
    }
    return success;
  }

  // ============================================================
  // 设置工具栏按钮
  // ============================================================
  _setupToolbarButton() {
    // 查找枭熊2的工具栏
    let toolbar = document.querySelector('.or-toolbar, .toolbar, [class*="toolbar"]');
    
    // 如果没有找到，等待
    if (!toolbar) {
      console.warn('⚠️ 未找到工具栏，将在DOM变化时重试');
      const observer = new MutationObserver(() => {
        const tb = document.querySelector('.or-toolbar, .toolbar, [class*="toolbar"]');
        if (tb) {
          observer.disconnect();
          this._addToolbarButton(tb);
        }
      });
      observer.observe(document.body, { childList: true, subtree: true });
      return;
    }

    this._addToolbarButton(toolbar);
  }

  _addToolbarButton(toolbar) {
    // 检查是否已存在
    if (document.querySelector('.fu-toolbar-btn')) return;

    const btn = document.createElement('button');
    btn.className = 'fu-toolbar-btn';
    btn.innerHTML = '📋 FU角色卡';
    btn.title = '打开FU角色卡管理';
    btn.style.cssText = `
      padding: 6px 14px;
      background: #2a2a4e;
      color: #f0c060;
      border: 1px solid #4a4a6e;
      border-radius: 6px;
      cursor: pointer;
      font-size: 13px;
      font-family: inherit;
      transition: all 0.2s;
      margin: 0 4px;
    `;
    btn.addEventListener('mouseenter', () => {
      btn.style.background = '#3a3a6e';
      btn.style.borderColor = '#f0c060';
    });
    btn.addEventListener('mouseleave', () => {
      btn.style.background = '#2a2a4e';
      btn.style.borderColor = '#4a4a6e';
    });
    btn.addEventListener('click', this._onToolbarClick);

    // 插入到工具栏
    if (toolbar.firstChild) {
      toolbar.insertBefore(btn, toolbar.firstChild);
    } else {
      toolbar.appendChild(btn);
    }

    console.log('✅ FU角色卡工具栏按钮已添加');
  }

  // ============================================================
  // 工具栏按钮点击事件
  // ============================================================
  _onToolbarClick(e) {
    e.stopPropagation();
    this._openRoleCardManager();
  }

  // ============================================================
  // 打开角色卡管理界面
  // ============================================================
  _openRoleCardManager() {
    if (this.roleManager && this.roleManager.isOpen) {
      this.roleManager.close();
      this.roleManager = null;
      return;
    }

    this.roleManager = new RoleCardManager();
    this.roleManager.onClose = () => {
      this.roleManager = null;
    };
    this.roleManager.open();

    // 添加"导入角色卡"按钮到管理界面
    this._addImportButtonToManager();
  }

  _addImportButtonToManager() {
    // 等待管理界面渲染完成
    setTimeout(() => {
      const header = document.querySelector('.fu-manager-header');
      if (header && !header.querySelector('.fu-manager-import-btn')) {
        const importBtn = document.createElement('button');
        importBtn.className = 'fu-manager-import-btn';
        importBtn.innerHTML = '📄 导入Excel';
        importBtn.style.cssText = `
          padding: 4px 14px;
          background: #2d7d46;
          color: #fff;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 13px;
          margin-right: 12px;
        `;
        importBtn.addEventListener('mouseenter', () => {
          importBtn.style.background = '#3da05a';
        });
        importBtn.addEventListener('mouseleave', () => {
          importBtn.style.background = '#2d7d46';
        });
        importBtn.addEventListener('click', () => {
          const fileInput = this._createFileInput();
          fileInput.click();
        });
        // 插入到关闭按钮前面
        const closeBtn = header.querySelector('.fu-manager-close');
        if (closeBtn) {
          header.insertBefore(importBtn, closeBtn);
        } else {
          header.appendChild(importBtn);
        }
      }
    }, 100);
  }

  // ============================================================
  // 设置Token事件（点击和右键菜单）
  // ============================================================
  _setupTokenEvents() {
    // 使用事件委托监听所有Token的点击和右键
    document.addEventListener('click', this._onTokenClick);
    document.addEventListener('contextmenu', this._onTokenContextMenu);
    console.log('✅ Token事件已注册');
  }

  // ============================================================
  // Token点击事件（打开全屏卡片）
  // ============================================================
  _onTokenClick(e) {
    const tokenEl = this._findTokenElementFromEvent(e);
    if (!tokenEl) return;

    const tokenId = this._getTokenIdFromElement(tokenEl);
    if (!tokenId) return;

    // 获取绑定的数据
    if (this.binder) {
      const binding = this.binder.getBinding(tokenId);
      if (binding && binding.type === 'role' && binding.cardId) {
        // 打开全屏卡片
        const data = DataManager.load(binding.cardId);
        if (data) {
          const card = new FullCard(binding.cardId, data, () => {
            console.log('📕 卡片已关闭');
          });
          card.open();
          e.stopPropagation();
        }
      }
    }
  }

  // ============================================================
  // Token右键菜单
  // ============================================================
  _onTokenContextMenu(e) {
    const tokenEl = this._findTokenElementFromEvent(e);
    if (!tokenEl) return;

    const tokenId = this._getTokenIdFromElement(tokenEl);
    if (!tokenId) return;

    e.preventDefault();
    e.stopPropagation();

    this._contextToken = {
      id: tokenId,
      element: tokenEl
    };

    this._showContextMenu(e.clientX, e.clientY, tokenId);
  }

  // ============================================================
  // 显示右键菜单
  // ============================================================
  _showContextMenu(x, y, tokenId) {
    // 移除已有菜单
    const oldMenu = document.querySelector('.fu-context-menu');
    if (oldMenu) oldMenu.remove();

    const menu = document.createElement('div');
    menu.className = 'fu-context-menu';
    menu.style.cssText = `
      position: fixed;
      left: ${x}px;
      top: ${y}px;
      background: #1a1a2e;
      border: 1px solid #4a4a6e;
      border-radius: 8px;
      padding: 6px 0;
      min-width: 200px;
      z-index: 30000;
      box-shadow: 0 8px 32px rgba(0,0,0,0.8);
      font-family: 'Segoe UI', system-ui, sans-serif;
    `;

    // 获取角色卡列表
    const summaries = DataManager.listSummary();

    // 菜单项：绑定角色卡
    const roleItem = document.createElement('div');
    roleItem.style.cssText = `
      padding: 8px 16px;
      color: #f0c060;
      cursor: default;
      font-size: 13px;
      border-bottom: 1px solid #2a2a44;
    `;
    roleItem.textContent = '📋 绑定FU角色卡';
    menu.appendChild(roleItem);

    if (summaries.length === 0) {
      const emptyItem = document.createElement('div');
      emptyItem.style.cssText = `
        padding: 6px 16px 6px 28px;
        color: #666;
        font-size: 12px;
        font-style: italic;
      `;
      emptyItem.textContent = '暂无角色卡，请先导入';
      menu.appendChild(emptyItem);
    } else {
      summaries.forEach((item) => {
        const subItem = document.createElement('div');
        subItem.style.cssText = `
          padding: 6px 16px 6px 28px;
          color: #ddd;
          cursor: pointer;
          font-size: 12px;
          transition: background 0.1s;
        `;
        subItem.textContent = `${item.name} (${item.id})`;
        subItem.addEventListener('mouseenter', () => {
          subItem.style.background = 'rgba(240,192,96,0.1)';
        });
        subItem.addEventListener('mouseleave', () => {
          subItem.style.background = 'transparent';
        });
        subItem.addEventListener('click', () => {
          this._contextMenuSelect(item.id);
          menu.remove();
        });
        menu.appendChild(subItem);
      });
    }

    // 分割线
    const divider = document.createElement('div');
    divider.style.cssText = `border-top: 1px solid #2a2a44; margin: 4px 0;`;
    menu.appendChild(divider);

    // 菜单项：绑定血条组件
    const hpItem = document.createElement('div');
    hpItem.style.cssText = `
      padding: 8px 16px;
      color: #5dade2;
      cursor: pointer;
      font-size: 13px;
      transition: background 0.1s;
    `;
    hpItem.textContent = '❤️ 绑定FU血条组件';
    hpItem.addEventListener('mouseenter', () => {
      hpItem.style.background = 'rgba(93,173,226,0.1)';
    });
    hpItem.addEventListener('mouseleave', () => {
      hpItem.style.background = 'transparent';
    });
    hpItem.addEventListener('click', () => {
      if (this._contextToken) {
        this._bindHpBarToToken(this._contextToken.id, this._contextToken.element);
        menu.remove();
        alert('✅ 血条组件已绑定！\n点击气泡上的数值可编辑（HP/MP/物防/魔防/角色名）');
      }
    });
    menu.appendChild(hpItem);

    // 如果有绑定，显示解绑选项
    if (this.binder) {
      const binding = this.binder.getBinding(tokenId);
      if (binding) {
        const unbindItem = document.createElement('div');
        unbindItem.style.cssText = `
          padding: 8px 16px;
          color: #e74c3c;
          cursor: pointer;
          font-size: 13px;
          border-top: 1px solid #2a2a44;
          transition: background 0.1s;
        `;
        unbindItem.textContent = '🗑️ 解绑';
        unbindItem.addEventListener('mouseenter', () => {
          unbindItem.style.background = 'rgba(231,76,60,0.1)';
        });
        unbindItem.addEventListener('mouseleave', () => {
          unbindItem.style.background = 'transparent';
        });
        unbindItem.addEventListener('click', () => {
          if (this._contextToken) {
            this.binder.unbind(this._contextToken.id);
            menu.remove();
            alert('✅ 已解绑');
          }
        });
        menu.appendChild(unbindItem);
      }
    }

    // 点击外部关闭菜单
    const closeMenu = (e2) => {
      if (!menu.contains(e2.target)) {
        menu.remove();
        document.removeEventListener('click', closeMenu);
      }
    };
    setTimeout(() => {
      document.addEventListener('click', closeMenu);
    }, 10);

    document.body.appendChild(menu);
  }

  // ============================================================
  // 右键菜单选择角色卡
  // ============================================================
  _contextMenuSelect(cardId) {
    if (!this._contextToken) return;
    const token = this._contextToken;
    this._bindRoleToToken(token.id, token.element, cardId);
    alert('✅ 角色卡已绑定到Token！\n点击Token可打开全屏卡片。');
  }

  // ============================================================
  // 辅助：从事件中查找Token元素
  // ============================================================
  _findTokenElementFromEvent(e) {
    // 枭熊2的Token可能使用 .token 类名或其他选择器
    let target = e.target.closest('.token, [data-token-id]');
    if (!target) {
      // 尝试通过父级查找
      target = e.target.closest('[class*="token"]');
    }
    return target;
  }

  // ============================================================
  // 辅助：从元素获取Token ID
  // ============================================================
  _getTokenIdFromElement(el) {
    if (!el) return null;
    return el.dataset.tokenId || el.id || null;
  }

  // ============================================================
  // 恢复绑定（页面刷新后）
  // ============================================================
  _restoreBindings() {
    if (!this.binder) {
      this.binder = new TokenBinder();
    }
    // 使用TokenBinder的恢复功能
    this.binder.restoreAllBindings((tokenId) => {
      return this._findTokenElement(tokenId);
    });
  }

  // ============================================================
  // 设置全局事件
  // ============================================================
  _setupGlobalEvents() {
    // 监听自定义事件：打开卡片
    document.addEventListener('fu-open-card', (e) => {
      const cardId = e.detail.cardId;
      const data = DataManager.load(cardId);
      if (data) {
        const card = new FullCard(cardId, data, () => {});
        card.open();
      }
    });

    // 监听角色卡数据变化
    document.addEventListener('fu-card-data-changed', (e) => {
      // 刷新管理界面
      if (this.roleManager && this.roleManager.isOpen) {
        this.roleManager.refresh();
      }
    });

    console.log('✅ 全局事件已注册');
  }

  // ============================================================
  // 销毁
  // ============================================================
  destroy() {
    document.removeEventListener('click', this._onTokenClick);
    document.removeEventListener('contextmenu', this._onTokenContextMenu);

    const btn = document.querySelector('.fu-toolbar-btn');
    if (btn) btn.remove();

    const menu = document.querySelector('.fu-context-menu');
    if (menu) menu.remove();

    if (this.roleManager) {
      this.roleManager.close();
      this.roleManager = null;
    }

    this.isInitialized = false;
    console.log('🦉 枭熊2集成模块已销毁');
  }
}