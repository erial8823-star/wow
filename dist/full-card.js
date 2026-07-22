import{t as e}from"./assets/modulepreload-polyfill-B-eOYwHK.js";import{_ as t,a as n,b as r,c as i,d as a,f as o,g as s,h as c,i as l,l as u,m as d,n as f,o as p,p as m,r as h,t as g,u as _,v,x as y,y as b}from"./assets/lib-D1lqUKHH-mJqKNSWf-DuRg_PIi-D0UBZoUE-r2blPdp8-C9POc7K9-C38dAS4l--0LU940J.js";e((()=>{r(),_(),y((()=>{t(),u(),d((()=>{m(),b(),n((()=>{l(),s(),o((()=>{g(),i(),p((()=>{f(),a(),h((()=>{v();var e=new URLSearchParams(window.location.search),t=e.get(`tokenId`),n=e.get(`previewCardId`),r=null,i=!1;!t&&!n?document.getElementById(`cardContainer`).innerHTML=`
    <div style="text-align: center; padding: 40px; color: #e74c3c;">
      ❌ 错误：未指定 Token ID 或角色卡 ID
    </div>
  `:c.onReady(async()=>{try{i=await c.player.getRole()===`GM`}catch{i=!0}await a(),t&&c.scene.items.onChange(async e=>{let n=e.find(e=>e.id===t);n&&n.metadata[`com.wow.fu-character/data`]&&(r=n.metadata[`com.wow.fu-character/data`],o(r))})});async function a(){if(n){try{let e=localStorage.getItem(`cc-fu-data-`+n);if(e)r=JSON.parse(e),o(r);else throw Error(`该角色卡已从本地删除`)}catch(e){document.getElementById(`cardContainer`).innerHTML=`
        <div style="text-align: center; padding: 40px; color: #e74c3c;">
          加载预览卡片失败: ${e.message}
        </div>
      `}return}try{let e=await c.scene.items.getItems([t]);e.length>0&&e[0].metadata[`com.wow.fu-character/data`]?(r=e[0].metadata[`com.wow.fu-character/data`],o(r)):document.getElementById(`cardContainer`).innerHTML=`
        <div style="text-align: center; padding: 40px; color: #e67e22;">
          ⚠️ 此 Token 未绑定任何角色卡，或绑定数据已丢失。<br>
          请先在右侧管理界面中，选择棋子并点击一张导入的角色卡进行绑定。
        </div>
      `}catch(e){document.getElementById(`cardContainer`).innerHTML=`
      <div style="text-align: center; padding: 40px; color: #e74c3c;">
        读取数据失败: ${e.message}
      </div>
    `}}function o(e){let r=document.getElementById(`cardContainer`),a=e.isLocked||!1,l=a&&!i,u=i||!t?`fu-editable`:``,d=(e,n,r,a,o)=>{let s=r>0?Math.min(n/r*100,100):0,c=l?`??`:n,u=l?`??`:r,d=!l&&(i||!t)?`fu-editable`:``;return`
      <div class="resource-row ${o}">
        <span class="label">${e}</span>
        <div class="bar-wrap" data-field="${a}">
          <div class="bar-fill" style="width:${s}%;"></div>
          <div class="bar-text">
            <span class="${d}" data-field="${a}Cur">${c}</span>
            <span style="margin:0 2px;">/</span>
            <span class="${d}" data-field="${a}Max">${u}</span>
          </div>
        </div>
      </div>
    `},f=e=>{if(!e||!e.name||e.name.trim()===``)return`<tr class="empty-row"><td colspan="6" style="text-align:center; color:#555;">（无武器）</td></tr>`;let t=l?`??`:e.attack||`-`,n=l?`??`:e.damage||`-`;return`
      <tr>
        <td>${e.category||`-`}</td>
        <td class="weapon-name">${e.name}</td>
        <td>${t}</td>
        <td>${e.attr||`-`}</td>
        <td>${e.type||`-`}</td>
        <td>${n}</td>
      </tr>
    `},p=l?`??`:e.dex||0,m=l?`??`:e.ins||0,h=l?`??`:e.mig||0,g=l?`??`:e.wlp||0,_=l?`??`:e.init||0,v=l?`??`:e.pd||0,y=l?`??`:e.md||0,b=a?`🔒`:`🔓`,x=a?`已锁定（非GM隐藏数值，进度条仍可见）`:`未锁定（所有玩家可见数值）`,S=i||!t?`<button id="fuLockBtn" title="${x}" style="background:none; border:none; cursor:pointer; font-size:16px; margin-left:8px; color:#f0c060;">${b}</button>`:`<span title="${x}" style="font-size:16px; margin-left:8px;">${b}</span>`;r.innerHTML=`
    <div class="fu-card-header">
      <div style="display:flex; align-items:center;">
        <span style="font-size:22px; color:#f0c060;">${e.name||`未命名角色`}</span>
        <span class="level" style="margin-left:8px;">Lv.${e.level||0}</span>
        ${S}
      </div>
      <button class="fu-card-close" id="fuCloseBtn">×</button>
    </div>

    <div class="fu-card-body">
      <div class="fu-attributes">
        <div class="fu-attr-item"><span class="label">敏捷</span><span class="value">D${p}</span></div>
        <div class="fu-attr-item"><span class="label">洞察</span><span class="value">D${m}</span></div>
        <div class="fu-attr-item"><span class="label">力量</span><span class="value">D${h}</span></div>
        <div class="fu-attr-item"><span class="label">意志</span><span class="value">D${g}</span></div>
      </div>

      <div class="fu-combat-stats">
        <span>⚔️ 先攻 <span class="num ${u}" data-field="init">${_}</span></span>
        <span>🛡️ 物防 <span class="num ${u}" data-field="pd">${v}</span></span>
        <span>✨ 魔防 <span class="num ${u}" data-field="md">${y}</span></span>
      </div>

      ${d(`HP`,e.hp,e.hpMax,`hp`,`resource-hp`)}
      ${d(`MP`,e.mp,e.mpMax,`mp`,`resource-mp`)}
      ${d(`IP`,e.ip,e.ipMax,`ip`,`resource-ip`)}
      ${d(`命刻`,e.crisisCurrent,e.crisisMax,`crisis`,`resource-crisis`)}

      <div class="fu-crisis-box">
        <div class="title">🔥 零界能力</div>
        <div class="detail">
          <strong>${e.crisisName||`（未设置）`}</strong>
          ${e.crisisCondition?`｜ 条件：${e.crisisCondition}`:``}
          ${e.crisisSlots?`｜ 填充格数：${e.crisisSlots}`:``}
        </div>
      </div>

      <div class="fu-defenses">
        <span class="tag"><strong>弱点：</strong>${e.weakness||`无`}</span>
        <span class="tag"><strong>抵抗：</strong>${e.resistance||`无`}</span>
        <span class="tag"><strong>免疫：</strong>${e.immunity||`无`}</span>
        <span class="tag"><strong>吸收：</strong>${e.absorb||`无`}</span>
      </div>

      <table class="fu-weapons">
        <thead><tr><th>类别</th><th>名称</th><th>检定</th><th>属性</th><th>类型</th><th>伤害</th></tr></thead>
        <tbody>
          ${f(e.weapon1)}
          ${f(e.weapon2)}
        </tbody>
      </table>
    </div>
  `;let C=document.getElementById(`fuCloseBtn`);C&&C.addEventListener(`click`,async()=>{c.popover.close(`fu-card-popover`),c.popover.close(`fu-card-preview`)});let w=document.getElementById(`fuLockBtn`);w&&(i||!t)&&w.addEventListener(`click`,async()=>{let r=!a;e.isLocked=r,n?(localStorage.setItem(`cc-fu-data-`+n,JSON.stringify(e)),o(e)):t&&await c.scene.items.updateItems([t],e=>{for(let t of e)t.type===`IMAGE`&&t.metadata[`com.wow.fu-character/data`]&&(t.metadata[`com.wow.fu-character/data`].isLocked=r)})}),s()}function s(){document.querySelectorAll(`.fu-editable`).forEach(e=>{e.addEventListener(`click`,t=>{t.stopPropagation();let n=e.dataset.field,r=e.textContent.trim(),i=document.createElement(`input`);i.type=`number`,i.className=`fu-editable-input`,i.value=r,i.style.width=`55px`,i.style.background=`#0d0d1a`,i.style.color=`#fff`,i.style.border=`1px solid #555`,i.style.borderRadius=`3px`,i.style.padding=`2px`,e.replaceWith(i),i.focus(),i.select(),i.addEventListener(`blur`,async()=>{let t=i.value.trim();t===``&&(t=`0`);let r=Number(t);if(isNaN(r)){alert(`请输入有效数字`),i.replaceWith(e);return}await l(n,r),e.textContent=r,i.replaceWith(e)}),i.addEventListener(`keydown`,t=>{t.key===`Enter`&&(t.preventDefault(),i.blur()),t.key===`Escape`&&i.replaceWith(e)})})})}async function l(e,i){let a=``;if(e===`init`||e===`pd`||e===`md`)a=e;else if(e.endsWith(`Cur`)){let t=e.slice(0,-3);t===`hp`?a=`hp`:t===`mp`?a=`mp`:t===`ip`?a=`ip`:t===`crisis`&&(a=`crisisCurrent`)}else if(e.endsWith(`Max`)){let t=e.slice(0,-3);t===`hp`?a=`hpMax`:t===`mp`?a=`mpMax`:t===`ip`?a=`ipMax`:t===`crisis`&&(a=`crisisMax`)}if(a){if(r[a]=i,n){localStorage.setItem(`cc-fu-data-`+n,JSON.stringify(r)),console.log(`💾 本地角色卡数据已更新: ${a} = ${i}`);return}await c.scene.items.updateItems([t],e=>{for(let t of e)if(t.type===`IMAGE`&&t.metadata[`com.wow.fu-character/data`]){t.metadata[`com.wow.fu-character/data`][a]=i;let e=t.metadata[`com.wow.fu-character/data`];t.text||={richText:[{type:`paragraph`,children:[{text:``}]}],plainText:``,style:{padding:8,fontFamily:`Roboto`,fontSize:24,fontWeight:400,textAlign:`CENTER`,textAlignVertical:`BOTTOM`,fillColor:`white`,fillOpacity:1,strokeColor:`white`,strokeOpacity:1,strokeWidth:0,lineHeight:1.5},type:`PLAIN`,width:`AUTO`,height:`AUTO`},t.text.plainText=`${e.name}\nHP ${e.hp}/${e.hpMax}`,t.textItemType=`LABEL`}}),console.log(`💾 元数据已写入: ${a} = ${i}`)}}}))()}))()}))()}))()}))()}))()}))();