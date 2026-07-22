import OBR from "@owlbear-rodeo/sdk";

// 定义存储在 Token Metadata 中的专用命名空间键名
export const METADATA_KEY = "com.wow.fu-character";

/**
 * 兼容性随机 ID 生成器
 */
function generateUniqueId() {
  return "id_" + Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
}

/**
 * 获取当前用户的角色 (GM 或 PLAYER) —— 修正 API 调用的地方！
 */
async function getUserRole() {
  return await OBR.player.getRole();
}

/**
 * 创建并绑定气泡到 Token 上
 */
export async function createBubble(tokenId, characterData) {
  await removeBubble(tokenId);

  const role = await getUserRole();
  const isGM = role === "GM";
  const isLocked = characterData.locked ?? false;

  const hpMax = characterData.hpMax || 100;
  const hp = Math.max(0, Math.min(characterData.hp ?? hpMax, hpMax));
  const hpRatio = hpMax > 0 ? hp / hpMax : 0;

  const mpMax = characterData.mpMax || 100;
  const mp = Math.max(0, Math.min(characterData.mp ?? mpMax, mpMax));
  const mpRatio = mpMax > 0 ? mp / mpMax : 0;

  const baseUrl = { x: 0, y: -75 };

  const commonProps = {
    attachedTo: tokenId,
    disableHit: true,
    disableSelection: true,
    disableAttachment: true,
    layer: "ATTACHMENT",
    visible: true,
  };

  const bgItem = {
    ...commonProps,
    type: "RECTANGLE",
    id: generateUniqueId(),
    position: { x: baseUrl.x, y: baseUrl.y },
    width: 140,
    height: 65,
    fillColor: "rgba(16, 16, 30, 0.92)",
    strokeColor: "#f0c060",
    strokeWidth: 1,
    cornerRadius: 6,
  };

  const hpBgItem = {
    ...commonProps,
    type: "RECTANGLE",
    id: generateUniqueId(),
    position: { x: baseUrl.x + 10, y: baseUrl.y + 12 },
    width: 120,
    height: 8,
    fillColor: "#331111",
    cornerRadius: 2,
  };

  const hpFillItem = {
    ...commonProps,
    type: "RECTANGLE",
    id: generateUniqueId(),
    position: { x: baseUrl.x + 10, y: baseUrl.y + 12 },
    width: Math.max(2, 120 * hpRatio),
    height: 8,
    fillColor: "#e74c3c",
    cornerRadius: 2,
  };

  const mpBgItem = {
    ...commonProps,
    type: "RECTANGLE",
    id: generateUniqueId(),
    position: { x: baseUrl.x + 10, y: baseUrl.y + 24 },
    width: 120,
    height: 6,
    fillColor: "#112244",
    cornerRadius: 2,
  };

  const mpFillItem = {
    ...commonProps,
    type: "RECTANGLE",
    id: generateUniqueId(),
    position: { x: baseUrl.x + 10, y: baseUrl.y + 24 },
    width: Math.max(2, 120 * mpRatio),
    height: 6,
    fillColor: "#3498db",
    cornerRadius: 2,
  };

  const lockIcon = isLocked ? "🔒" : "🔓";
  const nameText = characterData.name || "未命名角色";

  let statsLine = "";
  let defLine = "";

  if (isLocked && !isGM) {
    statsLine = "HP ??/??  MP ??/??";
    defLine = "物防:??  魔防:??";
  } else {
    statsLine = `HP ${hp}/${hpMax}  MP ${mp}/${mpMax}`;
    defLine = `物防:${characterData.pd ?? "-"}  魔防:${characterData.md ?? "-"}`;
  }

  const textItem = {
    ...commonProps,
    type: "TEXT",
    id: generateUniqueId(),
    position: { x: baseUrl.x + 70, y: baseUrl.y + 34 },
    text: {
      plainText: `${lockIcon} ${nameText}\n${statsLine}\n${defLine}`,
      style: {
        fillColor: "#ffffff",
        fontSize: 10,
        fontFamily: "sans-serif",
        textAlign: "CENTER",
        fontWeight: 600,
      },
    },
  };

  const allBubbleItems = [bgItem, hpBgItem, hpFillItem, mpBgItem, mpFillItem, textItem];
  await OBR.scene.items.addItems(allBubbleItems);

  const attachments = {
    bgId: bgItem.id,
    hpBgId: hpBgItem.id,
    hpFillId: hpFillItem.id,
    mpBgId: mpBgItem.id,
    mpFillId: mpFillItem.id,
    textId: textItem.id,
  };

  const finalData = {
    ...characterData,
    hp,
    hpMax,
    mp,
    mpMax,
    locked: isLocked,
    attachments,
  };

  await OBR.scene.items.updateItems([tokenId], (items) => {
    for (let item of items) {
      if (!item.metadata) item.metadata = {};
      item.metadata[METADATA_KEY] = finalData;
    }
  });
}

/**
 * 更新现有气泡显示
 */
export async function updateBubble(tokenId, updatedData) {
  const [token] = await OBR.scene.items.getItems([tokenId]);
  if (!token) return;

  const currentData = token.metadata ? token.metadata[METADATA_KEY] : null;
  if (!currentData || !currentData.attachments) {
    return await createBubble(tokenId, updatedData);
  }

  const role = await getUserRole();
  const isGM = role === "GM";

  const data = { ...currentData, ...updatedData };
  const { attachments } = data;

  const isLocked = data.locked ?? false;
  const hpMax = data.hpMax || 100;
  const hp = Math.max(0, Math.min(data.hp ?? hpMax, hpMax));
  const hpRatio = hpMax > 0 ? hp / hpMax : 0;

  const mpMax = data.mpMax || 100;
  const mp = Math.max(0, Math.min(data.mp ?? mpMax, mpMax));
  const mpRatio = mpMax > 0 ? mp / mpMax : 0;

  await OBR.scene.items.updateItems(
    [attachments.hpFillId, attachments.mpFillId],
    (items) => {
      for (let item of items) {
        if (item.id === attachments.hpFillId) {
          item.width = Math.max(2, 120 * hpRatio);
        } else if (item.id === attachments.mpFillId) {
          item.width = Math.max(2, 120 * mpRatio);
        }
      }
    }
  );

  const lockIcon = isLocked ? "🔒" : "🔓";
  const nameText = data.name || "未命名角色";

  let statsLine = "";
  let defLine = "";

  if (isLocked && !isGM) {
    statsLine = "HP ??/??  MP ??/??";
    defLine = "物防:??  魔防:??";
  } else {
    statsLine = `HP ${hp}/${hpMax}  MP ${mp}/${mpMax}`;
    defLine = `物防:${data.pd ?? "-"}  魔防:${data.md ?? "-"}`;
  }

  await OBR.scene.items.updateItems([attachments.textId], (items) => {
    for (let item of items) {
      if (item.text) {
        item.text.plainText = `${lockIcon} ${nameText}\n${statsLine}\n${defLine}`;
      }
    }
  });

  await OBR.scene.items.updateItems([tokenId], (items) => {
    for (let item of items) {
      if (!item.metadata) item.metadata = {};
      item.metadata[METADATA_KEY] = data;
    }
  });
}

/**
 * 删除 Token 上的绑定气泡并清除 Metadata
 */
export async function removeBubble(tokenId) {
  const [token] = await OBR.scene.items.getItems([tokenId]);
  if (!token) return;

  const data = token.metadata ? token.metadata[METADATA_KEY] : null;
  if (data && data.attachments) {
    const idsToDelete = Object.values(data.attachments);
    await OBR.scene.items.deleteItems(idsToDelete);
  }

  await OBR.scene.items.updateItems([tokenId], (items) => {
    for (let item of items) {
      if (item.metadata) {
        delete item.metadata[METADATA_KEY];
      }
    }
  });
}