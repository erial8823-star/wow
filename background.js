import OBR from "@owlbear-rodeo/sdk";
import { createBubble, removeBubble, METADATA_KEY } from "./src/bubble.js";

OBR.onReady(async () => {
  console.log("FU角色卡扩展：后台服务已启动");

  // 1.1 绑定 FU 角色卡菜单 (仅 GM 可用)
  try {
    OBR.contextMenu.create({
      id: "com.wow.fu-character/bind-card",
      icons: [
        {
          icon: "./assets/icon.png",
          label: "绑定FU角色卡",
          filter: {
            roles: ["GM"],
            every: [{ key: "type", value: "IMAGE" }],
          },
        },
      ],
      onClick(context) {
        const selectedToken = context.items[0];
        if (!selectedToken) return;

        OBR.popover.open({
          id: "com.wow.fu-character/popover",
          url: `./popover.html?mode=bind&tokenId=${selectedToken.id}`,
          width: 800,
          height: 600,
        });
      },
    });
  } catch (err) {
    console.error("注册[绑定角色卡]菜单失败:", err);
  }

  // 1.2 绑定 FU 血条组件菜单 (仅 GM 可用，使用默认通用数据)
  try {
    OBR.contextMenu.create({
      id: "com.wow.fu-character/bind-hpbar",
      icons: [
        {
          icon: "./assets/icon.png",
          label: "绑定FU血条组件",
          filter: {
            roles: ["GM"],
            every: [{ key: "type", value: "IMAGE" }],
          },
        },
      ],
      async onClick(context) {
        const selectedToken = context.items[0];
        if (!selectedToken) return;

        const defaultData = {
          cardId: `hpbar_${selectedToken.id}`,
          name: selectedToken.name || "通用怪物",
          hp: 100,
          hpMax: 100,
          mp: 50,
          mpMax: 50,
          pd: 10,
          md: 10,
          locked: false,
        };

        await createBubble(selectedToken.id, defaultData);
        OBR.notification.show("已成功绑定通用血条组件！");
      },
    });
  } catch (err) {
    console.error("注册[绑定血条]菜单失败:", err);
  }

  // 1.3 解绑角色卡菜单 (仅在已绑定的 Token 上显示，仅 GM 可用)
  try {
    OBR.contextMenu.create({
      id: "com.wow.fu-character/unbind",
      icons: [
        {
          icon: "./assets/icon.png",
          label: "解绑角色卡",
          filter: {
            roles: ["GM"],
            every: [
              { key: "type", value: "IMAGE" },
              { key: `metadata.${METADATA_KEY}`, operator: "!=", value: undefined },
            ],
          },
        },
      ],
      async onClick(context) {
        const selectedToken = context.items[0];
        if (!selectedToken) return;

        await removeBubble(selectedToken.id);
        OBR.notification.show("已解绑角色卡！");
      },
    });
  } catch (err) {
    console.error("注册[解绑]菜单失败:", err);
  }

  // 2. 监听选中事件：左键点击已绑定的 Token 时弹出全屏卡片 (正确 API 为 OBR.player.onChange)
  OBR.player.onChange(async (player) => {
    const selectedIds = player.selection || [];
    if (selectedIds.length !== 1) return;

    const tokenId = selectedIds[0];
    const [token] = await OBR.scene.items.getItems([tokenId]);

    if (token && token.metadata && token.metadata[METADATA_KEY]) {
      const cardData = token.metadata[METADATA_KEY];

      OBR.popover.open({
        id: "com.wow.fu-character/card-view",
        url: `./popover.html?mode=card&tokenId=${tokenId}&cardId=${cardData.cardId || ""}`,
        width: 850,
        height: 650,
      });
    }
  });
});