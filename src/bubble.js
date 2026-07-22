import OBR from "@owlbear-rodeo/sdk";

// 定义存储在 Token Metadata 中的专用命名空间键名
export const METADATA_KEY = "com.wow.fu-character";

/**
 * 获取当前用户的角色 (GM 或 PLAYER)
 */
async function getUserRole() {
  return await OBR.room.getRole();
}

/**
 * 创建并绑定气泡到 Token 上
 * @param {string} tokenId - 目标 Token 的 ID
 * @param {Object} characterData - 角色卡数据
 */
export async function createBubble(tokenId, characterData) {
  // 如果已经存在气泡，先清理旧气泡
  await removeBubble(tokenId);

  const role = await getUserRole();
  const isGM = role === "GM";
  const isLocked = characterData.locked ?? false;

  // 计算血量与魔力比例 (0 到 1 之间)
  const hpMax = characterData.hpMax || 100;
  const hp = Math.max(0, Math.min(characterData.hp ?? hpMax, hpMax));
  const hpRatio = hpMax > 0 ? hp / hpMax : 0;

  const mpMax = characterData.mpMax || 100;
  const mp = Math.max(0, Math.min(characterData.mp ?? mpMax, mpMax));
  const mpRatio = mpMax > 0 ? mp / mpMax : 0;

  // 基础位置偏移 (相对于 Token 的左上角)
  const baseUrl = { x: 0, y: -75 };

  // 通用图形属性：必须设置 disableHit 和 disableSelection 以实现点击穿透
  const commonProps = {
    attachedTo: tokenId,
    disableHit: true,
    disableSelection: true,
    disableAttachment: true,
    layer: "ATTACHMENT",
    visible: true,
  };

  // 1. 背景框
  const bgItem = {
    ...commonProps,
    type: "RECTANGLE",
    id: window.crypto.randomUUID(),
    position: { x: baseUrl.x, y: baseUrl.y },
    width: 140,
    height: 65,
    fillColor: "rgba(16, 16, 30, 0.92)",
    strokeColor: "#f0c060",
    strokeWidth: 1,
    cornerRadius: 6,
  };

  // 2. HP 槽背景
  const hpBgItem = {
    ...commonProps,
    type: "RECTANGLE",
    id: window.crypto.randomUUID(),
    position: { x: baseUrl.x + 10, y: baseUrl.y + 12 },
    width: 120,
    height: 8,
    fillColor: "#331111",
    cornerRadius: 2,
  };

  // 3. HP 进度条
  const hpFillItem = {
    ...commonProps,
    type: "RECTANGLE",
    id: window.crypto.randomUUID(),
    position: { x: baseUrl.x + 10, y: baseUrl.y + 12 },
    width: Math.max(2, 120 * hpRatio),
    height: 8,
    fillColor: "#e74c3c",
    cornerRadius: 2,
  };

  // 4. MP 槽背景
  const mpBgItem = {
    ...commonProps,
    type: "RECTANGLE",
    id: window.crypto.randomUUID(),
    position: { x: baseUrl.x + 10, y: baseUrl.y + 24 },
    width: 120,
    height: 6,
    fillColor: "#112244",
    cornerRadius: 2,
  };

  // 5. MP 进度条
  const mpFillItem = {
    ...commonProps,
    type: "RECTANGLE",
    id: window.crypto.randomUUID(),
    position: { x: baseUrl.x + 10, y: baseUrl.y + 24 },
    width: Math.max(2, 120 * mpRatio),
    height: 6,
    fillColor: "#3498db",
    cornerRadius: 2,
  };

  // 判断文字遮蔽（锁逻辑）
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

  // 6. 文字信息节点
  const textItem = {
    ...commonProps,
    type: "TEXT",
    id: window.crypto.randomUUID(),
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

  // 批量提交到枭熊场景
  const allBubbleItems = [bgItem, hpBgItem, hpFillItem, mpBgItem, mpFillItem, textItem];
  await OBR.scene.items.addItems(allBubbleItems);

  // 将记录关联 ID 和数据的 Metadata 保存到 Token 上
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
      item.metadata[METADATA_KEY] = finalData;
    }
  });
}

/**
 * 更新现有气泡显示
 * @param {string} tokenId - 目标 Token 的 ID
 * @param {Object} updatedData - 新的角色数据
 */
export async function updateBubble(tokenId, updatedData) {
  const [token] = await OBR.scene.items.getItems([tokenId]);
  if (!token) return;

  const currentData = token.metadata[METADATA_KEY];
  if (!currentData || !currentData.attachments) {
    // 若没有附件关联记录，则重新初始化创建
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

  // 更新 HP 和 MP 进度条宽度
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

  // 更新文字内容
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

  // 更新 Token 上的 Metadata
  await OBR.scene.items.updateItems([tokenId], (items) => {
    for (let item of items) {
      item.metadata[METADATA_KEY] = data;
    }
  });
}

/**
 * 删除 Token 上的绑定气泡并清除 Metadata
 * @param {string} tokenId - 目标 Token 的 ID
 */
export async function removeBubble(tokenId) {
  const [token] = await OBR.scene.items.getItems([tokenId]);
  if (!token) return;

  const data = token.metadata[METADATA_KEY];
  if (data && data.attachments) {
    const idsToDelete = Object.values(data.attachments);
    await OBR.scene.items.deleteItems(idsToDelete);
  }

  // 清空 Token 的 Metadata 标记
  await OBR.scene.items.updateItems([tokenId], (items) => {
    for (let item of items) {
      delete item.metadata[METADATA_KEY];
    }
  });
}