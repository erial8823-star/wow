import{n as e,r as t,t as n}from"./assets/lib-lFk-3uXt.js";/* empty css                    */t((()=>{e();var t=`cc-fu-data-`,r=new URLSearchParams(window.location.search),i=r.get(`tokenId`),a=r.get(`cardId`),o=null,s=!1,c=a;!i&&!a?document.getElementById(`cardContainer`).innerHTML=`
    <div style="text-align: center; padding: 40px; color: #e74c3c;">
      ❌ 错误：未指定 Token ID 或角色卡 ID
    </div>
  `:n.onReady(async()=>{try{s=await n.player.getRole()===`GM`}catch{s=!0}await l(),i&&n.scene.items.onChange(async e=>{let t=e.find(e=>e.id===i);t&&t.metadata?.[`com.wow.fu-character/data`]&&(o=t.metadata[`com.wow.fu-character/data`],d(o))})});async function l(){if(a){let e=localStorage.getItem(`${t}${a}`);if(e){o=JSON.parse(e),d(o);return}}if(i)try{let e=await n.scene.items.getItems([i]);if(e.length>0&&e[0].metadata?.[`com.wow.fu-character/data`]){o=e[0].metadata[`com.wow.fu-character/data`],o.cardId&&(c=o.cardId,localStorage.setItem(`${t}${c}`,JSON.stringify(o))),d(o);return}}catch(e){console.error(`读取Token数据失败:`,e)}document.getElementById(`cardContainer`).innerHTML=`
    <div style="text-align: center; padding: 40px; color: #e67e22;">
      ⚠️ 未找到角色卡数据
    </div>
  `}async function u(){if(o){if(c&&localStorage.setItem(`${t}${c}`,JSON.stringify(o)),i&&await n.scene.items.updateItems([i],e=>{for(let t of e)t.type===`IMAGE`&&(t.metadata[`com.wow.fu-character/data`]={...o,cardId:c},t.text||={plainText:``,type:`PLAIN`,width:`AUTO`,height:`AUTO`},t.text.plainText=`${o.name}\nHP ${o.hp}/${o.hpMax}`)}),i)try{n.popover.postMessage({type:`refresh-bubble`,tokenId:i,data:o,cardId:c})}catch{}console.log(`💾 数据已保存`)}}function d(e){let t=document.getElementById(`cardContainer`),n=e.isLocked||!1,r=n&&!s,a=s||!i,o=(e,t,n,i,o,s)=>{let c=n>0?Math.min(t/n*100,100):0,l=r?`??`:t,u=r?`??`:n,d=a&&!r?`data-editable="true"`:``;return`
      <div class="resource-row ${s}">
        <span class="label">${e}</span>
        <div class="bar-wrap">
          <div class="bar-fill" style="width:${c}%;"></div>
          <div class="bar-text">
            <span class="editable-num" data-field="${i}" ${d}>${l}</span>
            <span style="margin:0 2px;">/</span>
            <span class="editable-num" data-field="${o}" ${d}>${u}</span>
          </div>
        </div>
      </div>
    `},c=(e,t)=>{if(!e||!e.name||e.name.trim()===``)return`<tr class="empty-row"><td colspan="6" style="text-align:center;color:#555;">（无武器）</td></tr>`;let n=r?`??`:e.attack||`-`,i=r?`??`:e.damage||`-`,o=a&&!r?`data-editable="true"`:``,s=`weapon${t}`;return`
      <tr>
        <td><span class="editable-text" data-field="${s}.category" ${o}>${e.category||`-`}</span></td>
        <td class="weapon-name"><span class="editable-text" data-field="${s}.name" ${o}>${e.name}</span></td>
        <td><span class="editable-text" data-field="${s}.attack" ${o}>${n}</span></td>
        <td><span class="editable-text" data-field="${s}.attr" ${o}>${e.attr||`-`}</span></td>
        <td><span class="editable-text" data-field="${s}.type" ${o}>${e.type||`-`}</span></td>
        <td><span class="editable-text" data-field="${s}.damage" ${o}>${i}</span></td>
      </tr>
    `},l=[{label:`敏捷`,field:`dex`,value:r?`??`:`D${e.dex||0}`},{label:`洞察`,field:`ins`,value:r?`??`:`D${e.ins||0}`},{label:`力量`,field:`mig`,value:r?`??`:`D${e.mig||0}`},{label:`意志`,field:`wlp`,value:r?`??`:`D${e.wlp||0}`}],u=``;l.forEach(e=>{let t=a&&!r?`data-editable="true"`:``;u+=`
      <div class="fu-attr-item">
        <span class="label">${e.label}</span>
        <span class="value editable-num" data-field="${e.field}" ${t}>${e.value}</span>
      </div>
    `});let d=[{label:`⚔️ 先攻`,field:`init`,value:r?`??`:e.init||0},{label:`🛡️ 物防`,field:`pd`,value:r?`??`:e.pd||0},{label:`✨ 魔防`,field:`md`,value:r?`??`:e.md||0}],p=``;d.forEach(e=>{let t=a&&!r?`data-editable="true"`:``;p+=`
      <span>
        ${e.label} 
        <span class="num editable-num" data-field="${e.field}" ${t}>${e.value}</span>
      </span>
    `});let m=n?`🔒`:`🔓`,h=n?`已锁定（非GM隐藏数值）`:`未锁定（所有人可见）`,g=s?`<button id="fuLockBtn" title="${h}" style="background:none; border:none; cursor:pointer; font-size:18px; color:#f0c060; margin-left:8px;">${m}</button>`:`<span title="${h}" style="font-size:18px; margin-left:8px;">${m}</span>`,b=a?`<button id="fuSaveBtn" style="background:#f0c060; border:none; color:#1a1a2e; padding:4px 16px; border-radius:16px; cursor:pointer; font-weight:bold; font-size:13px;">💾 保存</button>`:``;t.innerHTML=`
    <div class="fu-card-header">
      <div style="display:flex; align-items:center; flex-wrap:wrap; gap:4px;">
        <span class="editable-text" data-field="name" style="font-size:22px; color:#f0c060; font-weight:bold; ${a&&!r?`cursor:pointer;`:``}" ${a&&!r?`data-editable="true"`:``}>
          ${e.name||`未命名角色`}
        </span>
        <span class="level" style="margin-left:4px;">Lv.<span class="editable-num" data-field="level" ${a&&!r?`data-editable="true"`:``}>${e.level||0}</span></span>
        ${g}
        ${b}
      </div>
      <button class="fu-card-close" id="fuCloseBtn">×</button>
    </div>

    <div class="fu-card-body">
      <div class="fu-attributes">${u}</div>

      <div class="fu-combat-stats">${p}</div>

      ${o(`HP`,e.hp,e.hpMax,`hp`,`hpMax`,`resource-hp`)}
      ${o(`MP`,e.mp,e.mpMax,`mp`,`mpMax`,`resource-mp`)}
      ${o(`IP`,e.ip,e.ipMax,`ip`,`ipMax`,`resource-ip`)}
      ${o(`命刻`,e.crisisCurrent,e.crisisMax,`crisisCurrent`,`crisisMax`,`resource-crisis`)}

      <div class="fu-crisis-box">
        <div class="title">🔥 零界能力</div>
        <div class="detail">
          <strong><span class="editable-text" data-field="crisisName" ${a&&!r?`data-editable="true"`:``}>${e.crisisName||`（未设置）`}</span></strong>
          <span>｜ 条件：<span class="editable-text" data-field="crisisCondition" ${a&&!r?`data-editable="true"`:``}>${e.crisisCondition||`无`}</span></span>
          <span>｜ 填充格数：<span class="editable-text" data-field="crisisSlots" ${a&&!r?`data-editable="true"`:``}>${e.crisisSlots||`无`}</span></span>
        </div>
      </div>

      <div class="fu-defenses">
        <span class="tag"><strong>弱点：</strong><span class="editable-text" data-field="weakness" ${a&&!r?`data-editable="true"`:``}>${e.weakness||`无`}</span></span>
        <span class="tag"><strong>抵抗：</strong><span class="editable-text" data-field="resistance" ${a&&!r?`data-editable="true"`:``}>${e.resistance||`无`}</span></span>
        <span class="tag"><strong>免疫：</strong><span class="editable-text" data-field="immunity" ${a&&!r?`data-editable="true"`:``}>${e.immunity||`无`}</span></span>
        <span class="tag"><strong>吸收：</strong><span class="editable-text" data-field="absorb" ${a&&!r?`data-editable="true"`:``}>${e.absorb||`无`}</span></span>
      </div>

      <table class="fu-weapons">
        <thead><tr><th>类别</th><th>名称</th><th>检定</th><th>属性</th><th>类型</th><th>伤害</th></tr></thead>
        <tbody>
          ${c(e.weapon1,1)}
          ${c(e.weapon2,2)}
        </tbody>
      </table>
    </div>
  `,f(),v(),y(),_()}function f(){document.querySelectorAll(`.editable-num[data-editable="true"]`).forEach(e=>{e.style.cursor=`pointer`,e.addEventListener(`click`,t=>{t.stopPropagation();let n=e.dataset.field;p(e,n,e.textContent.trim())})}),document.querySelectorAll(`.editable-text[data-editable="true"]`).forEach(e=>{e.style.cursor=`pointer`,e.addEventListener(`click`,t=>{t.stopPropagation();let n=e.dataset.field;m(e,n,e.textContent.trim())})})}function p(e,t,n){let r=document.createElement(`input`);r.type=`number`,r.className=`fu-editable-input`,r.value=n,r.style.width=`60px`,r.style.background=`#0d0d1a`,r.style.color=`#fff`,r.style.border=`1px solid #f0c060`,r.style.borderRadius=`4px`,r.style.padding=`2px 6px`,r.style.fontSize=`inherit`,r.style.fontWeight=`bold`,r.style.textAlign=`center`,e.replaceWith(r),r.focus(),r.select(),r.addEventListener(`blur`,async()=>{let n=r.value.trim();n===``&&(n=`0`);let i=Number(n);if(isNaN(i)){r.replaceWith(e);return}h(t,i),e.textContent=n,r.replaceWith(e)}),r.addEventListener(`keydown`,t=>{t.key===`Enter`&&(t.preventDefault(),r.blur()),t.key===`Escape`&&r.replaceWith(e)})}function m(e,t,n){let r=document.createElement(`input`);r.type=`text`,r.className=`fu-editable-input`,r.value=n,r.style.width=Math.max(n.length*10+30,80)+`px`,r.style.background=`#0d0d1a`,r.style.color=`#fff`,r.style.border=`1px solid #f0c060`,r.style.borderRadius=`4px`,r.style.padding=`2px 8px`,r.style.fontSize=`inherit`,e.replaceWith(r),r.focus(),r.select(),r.addEventListener(`blur`,async()=>{let n=r.value.trim();h(t,n),e.textContent=n||`（空）`,r.replaceWith(e)}),r.addEventListener(`keydown`,t=>{t.key===`Enter`&&(t.preventDefault(),r.blur()),t.key===`Escape`&&r.replaceWith(e)})}function h(e,t){if(o){if(e.includes(`.`)){let n=e.split(`.`),r=o;for(let e=0;e<n.length-1;e++)r[n[e]]||(r[n[e]]={}),r=r[n[e]];r[n[n.length-1]]=t}else o[e]=t;console.log(`📝 字段已更新: ${e} = ${t}`),(e===`hp`||e===`hpMax`||e===`name`)&&g()}}async function g(){if(!(!i||!o))try{await n.scene.items.updateItems([i],e=>{for(let t of e)t.type===`IMAGE`&&(t.text||={plainText:``,type:`PLAIN`,width:`AUTO`,height:`AUTO`},t.text.plainText=`${o.name}\nHP ${o.hp}/${o.hpMax}`)})}catch(e){console.warn(`更新Token标签失败:`,e)}}function _(){let e=document.getElementById(`fuSaveBtn`);e&&e.addEventListener(`click`,async()=>{await u(),n.notification.show(`✅ 数据已保存`)})}function v(){let e=document.getElementById(`fuCloseBtn`);e&&e.addEventListener(`click`,async()=>{await u(),n.popover.close(`fu-card-popover`)})}function y(){let e=document.getElementById(`fuLockBtn`);e&&e.addEventListener(`click`,async()=>{if(!s){n.notification.show(`只有GM可以切换锁定状态`);return}let e=!o.isLocked;if(o.isLocked=e,c&&localStorage.setItem(`${t}${c}`,JSON.stringify(o)),i&&await n.scene.items.updateItems([i],t=>{for(let n of t)n.type===`IMAGE`&&n.metadata[`com.wow.fu-character/data`]&&(n.metadata[`com.wow.fu-character/data`].isLocked=e)}),localStorage.setItem(`fu-lock-${i}`,JSON.stringify({locked:e})),i)try{n.popover.postMessage({type:`refresh-bubble`,tokenId:i,data:o,cardId:c})}catch{}d(o),n.notification.show(e?`🔒 已锁定`:`🔓 已解锁`)})}n.popover.onMessage(e=>{e.type===`data-updated`&&l()})}))();