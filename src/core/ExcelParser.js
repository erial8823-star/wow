// src/core/ExcelParser.js
// 把用户上传的Excel文件，变成程序能看懂的数据

import * as XLSX from 'xlsx';

export class ExcelParser {
  
  static async parse(file) {
    const data = new Uint8Array(await file.arrayBuffer());
    const workbook = XLSX.read(data, { type: 'array' });
    
    const sheet = workbook.Sheets['主要'];
    if (!sheet) {
      throw new Error('在Excel中找不到名为“主要”的工作表，请检查文件');
    }

    const getCell = (addr) => {
      const cell = sheet[addr];
      if (!cell) return '';
      return cell.v !== undefined ? cell.v : (cell.w || '');
    };

    const characterData = {
      name: getCell('E2') || '未命名角色',
      level: Number(getCell('S2')) || 0,

      dex: Number(getCell('H7')) || 0,
      ins: Number(getCell('H8')) || 0,
      mig: Number(getCell('H9')) || 0,
      wlp: Number(getCell('H10')) || 0,

      init: Number(getCell('F14')) || 0,
      pd: Number(getCell('F15')) || 0,
      md: Number(getCell('F16')) || 0,

      hp: Number(getCell('S14')) || 0,
      hpMax: Number(getCell('W14')) || 0,
      mp: Number(getCell('S15')) || 0,
      mpMax: Number(getCell('W15')) || 0,
      ip: Number(getCell('S16')) || 0,
      ipMax: Number(getCell('W16')) || 0,

      weakness: getCell('AE14') || '',
      resistance: getCell('AO14') || '',
      immunity: getCell('AE25') || '',
      absorb: getCell('AO15') || '',

      crisisName: getCell('B20') || '',
      crisisCondition: getCell('H20') || '',
      // ✅ 直接读取文本内容，比如 "1格"、"3格"，不做数字提取
      crisisSlots: getCell('M20') || '',
      crisisCurrent: Number(getCell('S20')) || 0,
      crisisMax: Number(getCell('Z20')) || 0,

      weapon1: {
        category: getCell('B24') || '',
        name: getCell('H24') || '',
        attack: getCell('M24') || '',
        attr: getCell('W24') || '',
        type: getCell('AB24') || '',
        damage: getCell('AH24') || '',
      },

      weapon2: {
        category: getCell('B25') || '',
        name: getCell('H25') || '',
        attack: getCell('M25') || '',
        attr: getCell('W25') || '',
        type: getCell('AB25') || '',
        damage: getCell('AH25') || '',
      }
    };

    return characterData;
  }
}