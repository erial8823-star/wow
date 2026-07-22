import OBR from "@owlbear-rodeo/sdk";
import DataManager from "./core/DataManager.js";
import ExcelParser from "./core/ExcelParser.js";
import { createBubble, updateBubble, METADATA_KEY } from "./bubble.js";

let currentMode = "bind";
let currentTokenId = null;
let currentCardId = null;
let selectedCardData = null;
let currentUserRole = "PLAYER";

OBR.onReady(async () => {
  currentUserRole = await OBR.room.getRole();

  const urlParams = new URLSearchParams(window.location.search);
  currentMode = urlParams.get("mode") || "bind";
  currentTokenId = urlParams.get("tokenId");
  currentCardId = urlParams.get("cardId");

  setupExcelImport();

  if (currentMode === "bind") {
    document.getElementById("page-title").innerText = "选择并绑定角色卡";
    renderBindLayout();
  } else if (currentMode === "card") {
    document.getElementById("page-title").innerText = "编辑角色卡数值";
    const uploadWrapper = document.getElementById("upload-wrapper");
    if (uploadWrapper) uploadWrapper.style.display = "none";
    renderCardLayout();
  }
});

function setupExcelImport() {
  const fileInput = document.getElementById("excel-file-input");
  const triggerBtn = document.getElementById("btn-trigger-upload");

  if (triggerBtn && fileInput) {
    triggerBtn.onclick = () => fileInput.click();
  }

  if (!fileInput) return;

  fileInput.addEventListener("change", async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    try {
      const parsedCards = await ExcelParser.parse(file);
      if (parsedCards && parsedCards.length > 0) {
        parsedCards.forEach((card) => {
          if (DataManager.saveCard) DataManager.saveCard(card);
        });
        OBR.notification.show(`成功导入 ${parsedCards.length} 张角色卡！`);

        if (currentMode === "bind") {
          renderBindLayout();
        }
      }
    } catch (error) {
      console.error("解析 Excel 失败:", error);
      OBR.notification.show("Excel 文件解析失败，请检查文件格式！", "ERROR");
    } finally {
      fileInput.value = "";
    }
  });
}

function renderBindLayout() {
  const mainContent = document.getElementById("main-content");
  mainContent.innerHTML = `
    <div class="bind-layout">
      <div class="card-list" id="card-list-container"></div>
      <div class="preview-panel" id="preview-panel-container">
        <div class="preview-placeholder">请在左侧选择一张角色卡进行预览并绑定</div>
      </div>
    </div>
  `;

  refreshCardList();
}

function refreshCardList() {
  const listContainer = document.getElementById("card-list-container");
  if (!listContainer) return;

  // 兼容调用 DataManager 的获取卡片方法
  let allCards = [];
  if (typeof DataManager.getCards === "function") {
    allCards = DataManager.getCards();
  } else if (typeof DataManager.getAllCards === "function") {
    allCards = DataManager.getAllCards();
  }

  listContainer.innerHTML = "";

  if (allCards.length === 0) {
    listContainer.innerHTML = `<div style="color: #888; text-align: center; padding: 20px;">暂无本地角色卡，请点击右上角导入。</div>`;
    return;
  }

  allCards.forEach((card) => {
    const cardEl = document.createElement("div");
    cardEl.className = `card-item ${selectedCardData?.cardId === card.cardId ? "active" : ""}`;
    cardEl.innerHTML = `
      <div class="card-item-title">${card.name || "未命名角色"}</div>
      <div class="card-item-sub">HP: ${card.hp}/${card.hpMax} | MP: ${card.mp}/${card.mpMax}</div>
    `;

    cardEl.onclick = () => {
      selectedCardData = card;
      refreshCardList();
      renderCardPreview(card);
    };

    listContainer.appendChild(cardEl);
  });
}

function renderCardPreview(card) {
  const previewContainer = document.getElementById("preview-panel-container");
  if (!previewContainer) return;

  previewContainer.innerHTML = `
    <h3 style="color: #f0c060; margin-bottom: 15px;">${card.name || "未命名"}</h3>
    <div class="form-row">
      <div class="form-group">
        <label>当前 HP</label>
        <div class="form-control">${card.hp} / ${card.hpMax}</div>
      </div>
      <div class="form-group">
        <label>当前 MP</label>
        <div class="form-control">${card.mp} / ${card.mpMax}</div>
      </div>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label>物理防御 (PD)</label>
        <div class="form-control">${card.pd ?? "-"}</div>
      </div>
      <div class="form-group">
        <label>魔法防御 (MD)</label>
        <div class="form-control">${card.md ?? "-"}</div>
      </div>
    </div>
    <div class="footer-actions">
      <button class="btn" id="confirm-bind-btn">绑定到选中的 Token</button>
    </div>
  `;

  document.getElementById("confirm-bind-btn").onclick = async () => {
    if (!currentTokenId) {
      OBR.notification.show("未找到绑定的 Target Token！", "ERROR");
      return;
    }

    await createBubble(currentTokenId, card);
    OBR.notification.show(`已成功绑定角色卡：${card.name}`);
    OBR.popover.close("com.wow.fu-character/popover");
  };
}

async function renderCardLayout() {
  const mainContent = document.getElementById("main-content");

  const [token] = await OBR.scene.items.getItems([currentTokenId]);
  if (!token || !token.metadata || !token.metadata[METADATA_KEY]) {
    mainContent.innerHTML = `<div class="preview-placeholder">目标 Token 上未找到绑定数据</div>`;
    return;
  }

  const liveData = token.metadata[METADATA_KEY];
  const isGM = currentUserRole === "GM";

  mainContent.innerHTML = `
    <div style="padding: 20px; width: 100%; height: 100%; overflow-y: auto;">
      <div class="form-group">
        <label>角色名称</label>
        <input type="text" id="edit-name" class="form-control" value="${liveData.name || ""}" ${!isGM ? "disabled" : ""} />
      </div>

      <div class="form-row">
        <div class="form-group">
          <label>当前 HP</label>
          <input type="number" id="edit-hp" class="form-control" value="${liveData.hp ?? 0}" />
        </div>
        <div class="form-group">
          <label>最大 HP</label>
          <input type="number" id="edit-hpMax" class="form-control" value="${liveData.hpMax ?? 100}" ${!isGM ? "disabled" : ""} />
        </div>
      </div>

      <div class="form-row">
        <div class="form-group">
          <label>当前 MP</label>
          <input type="number" id="edit-mp" class="form-control" value="${liveData.mp ?? 0}" />
        </div>
        <div class="form-group">
          <label>最大 MP</label>
          <input type="number" id="edit-mpMax" class="form-control" value="${liveData.mpMax ?? 100}" ${!isGM ? "disabled" : ""} />
        </div>
      </div>

      <div class="form-row">
        <div class="form-group">
          <label>物理防御 (PD)</label>
          <input type="number" id="edit-pd" class="form-control" value="${liveData.pd ?? 0}" ${!isGM ? "disabled" : ""} />
        </div>
        <div class="form-group">
          <label>魔法防御 (MD)</label>
          <input type="number" id="edit-md" class="form-control" value="${liveData.md ?? 0}" ${!isGM ? "disabled" : ""} />
        </div>
      </div>

      ${
        isGM
          ? `
          <div class="form-group" style="margin-top: 15px;">
            <label>GM 数值隐蔽 (锁功能)</label>
            <button type="button" class="btn btn-secondary" id="toggle-lock-btn" style="width: 100%;">
              当前状态：${liveData.locked ? "🔒 已锁定 (非GM玩家显示为 ??)" : "🔓 已解锁 (公开数值)"}
            </button>
          </div>
        `
          : ""
      }

      <div class="footer-actions">
        <button class="btn" id="save-card-btn">保存并同步更新</button>
      </div>
    </div>
  `;

  let currentLockState = liveData.locked ?? false;

  if (isGM) {
    const lockBtn = document.getElementById("toggle-lock-btn");
    lockBtn.onclick = () => {
      currentLockState = !currentLockState;
      lockBtn.innerText = currentLockState
        ? "🔒 已锁定 (非GM玩家显示为 ??)"
        : "🔓 已解锁 (公开数值)";
    };
  }

  document.getElementById("save-card-btn").onclick = async () => {
    const updatedData = {
      ...liveData,
      name: document.getElementById("edit-name").value,
      hp: parseInt(document.getElementById("edit-hp").value) || 0,
      hpMax: parseInt(document.getElementById("edit-hpMax").value) || 1,
      mp: parseInt(document.getElementById("edit-mp").value) || 0,
      mpMax: parseInt(document.getElementById("edit-mpMax").value) || 1,
      pd: parseInt(document.getElementById("edit-pd").value) || 0,
      md: parseInt(document.getElementById("edit-md").value) || 0,
      locked: currentLockState,
    };

    await updateBubble(currentTokenId, updatedData);

    if (updatedData.cardId && DataManager.saveCard) {
      DataManager.saveCard(updatedData);
    }

    OBR.notification.show("角色卡数值已同步成功！");
    OBR.popover.close("com.wow.fu-character/card-view");
  };
}