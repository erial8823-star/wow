import OBR from '@owlbear-rodeo/sdk';

console.log('🔥 FU角色卡扩展后台已加载！');

const STORAGE_PREFIX = 'cc-fu-data-';
const base = window.location.href.substring(0, window.location.href.lastIndexOf('/'));

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

OBR.onReady(() => {
  console.log('🎯 OBR SDK 已就绪');

  // 1. 右键菜单：绑定角色卡（打开列表选择并进行绑定）
  OBR.contextMenu.create({
    id: 'fu-character-extension/bind-role',
    icons: [{
      icon: `${base}/assets/icon.png`,
      label: '📋 绑定角色卡',
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
      
      // 打开列表选择弹窗进入“绑定模式”
      OBR.popover.open({
        id: 'com.wow.fu-character/popover',
        url: `${base}/popover.html?bindTokenId=${token.id}&t=${Date.now()}`,
        width: 400,
        height: 600
      });
    }
  });

  // 2. 右键菜单：绑定默认血条组件
  OBR.contextMenu.create({
    id: 'fu-character-extension/bind-hpbar',
    icons: [{
      icon: `${base}/assets/icon.png`,
      label: '❤️ 绑定FU默认血条',
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
      const data = {
        name: token.name || '测试勇士',
        level: 5,
        pd: 8,
        md: 12,
        hp: 75,
        hpMax: 100,
        mp: 40,
        mpMax: 80,
        ip: 6,
        ipMax: 6,
        dex: 8,
        ins: 10,
        mig: 8,
        wlp: 8,
        init: 6,
        crisisCurrent: 6,
        crisisMax: 6
      };

      await OBR.scene.items.updateItems([token.id], (items) => {
        for (let item of items) {
          if (item.type === 'IMAGE') {
            item.metadata['com.wow.fu-character/data'] = data;
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
      OBR.notification.show('已成功绑定默认血条');
    }
  });

  // 3. 右键菜单：打开角色卡 (popover)
  OBR.contextMenu.create({
    id: 'fu-character-extension/open-card',
    icons: [{
      icon: `${base}/assets/icon.png`,
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
      
      OBR.popover.open({
        id: 'fu-card-popover',
        url: `${base}/full-card.html?tokenId=${token.id}&t=${Date.now()}`,
        width: 620,
        height: 600
      });
    }
  });

  // 4. 右键菜单：解绑角色卡
  OBR.contextMenu.create({
    id: 'fu-character-extension/unbind',
    icons: [{
      icon: `${base}/assets/icon.png`,
      label: '🗑️ 解除绑定',
      filter: {
        every: [{ key: 'type', value: 'IMAGE' }],
        some: [{ key: ['metadata', 'com.wow.fu-character/data'], operator: 'EXISTS' }]
      }
    }],
    onClick: async (context) => {
      const items = context.items;
      if (items.length === 0) return;
      const token = items[0];

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
      OBR.notification.show('已解除角色卡绑定');
    }
  });

  // 5. 『选中棋子自动弹出角色卡』监听器已移除
  // 原因：OBR 中右键点击棋子也会触发 selection 变化，为避免右键菜单与卡片重叠冲突，
  // 现统一改为通过右键菜单「打开FU角色卡」或左侧栏面板中点击进行查看。

  console.log('✅ 右键菜单已成功注册');
});