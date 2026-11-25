// 解析「臺北地政雲 → 整合資訊查詢結果（土地）」複製下來的文字
const ZONES = {
  '住一': [0.6, 0.3], '住二': [1.2, 0.35], '住二之一': [1.6, 0.35], '住二之二': [2.25, 0.35],
  '住三': [2.25, 0.45], '住三之一': [3.0, 0.45], '住三之二': [4.0, 0.45], '住四': [3.0, 0.5], '住四之一': [4.0, 0.5],
  '商一': [3.6, 0.55], '商二': [6.3, 0.65], '商三': [5.6, 0.65], '商四': [8.0, 0.75],
};
const short = (z) => z.replace(/第(.+?)種(住宅|商業)區/, (_, a, b) => (b === '住宅' ? '住' : '商') + a);

export function parseLandCloud(text, city = '臺北市') {
  const t = String(text || '')
    .replace(/\r/g, '')
    .replace(/[\uFF10-\uFF19]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0xFEE0))
    .replace(/[\uFF0D\u2010-\u2015\u2212\uFE63]/g, '-')
    .replace(/[\uFF0C]/g, ',').replace(/[\uFF0F]/g, '/').replace(/\u00A0|\u3000/g, ' ');
  const lotM = t.match(/(\d{4})\s*-\s*(\d{4})/) || t.match(/段\s*(\d{1,4})(?:\s*-\s*(\d{1,4}))?\s*地號/);
  if (!lotM) return null;
  const main = String(+lotM[1]), sub = +(lotM[2] || 0);
  const lotNo = sub ? `${main}-${sub}` : main;
  const secM = t.match(/([一-龥]{1,6}段(?:[一二三四五六七八九十]+小段)?)\s*\d{4}-\d{4}/);
  const nums = [...t.matchAll(/([\d,]+(?:\.\d+)?)\s*(元\s*\/\s*)?平方公尺/g)];
  const areaM = nums.find((m) => !m[2]);
  const priceM = nums.filter((m) => m[2]);
  const zoneM = t.match(/(第[一二三四五]種(?:之[一二])?(?:住宅|商業)區|第[一二三四五]之[一二]種(?:住宅|商業)區)(?:[及、與]((?:第[一二三四五](?:之[一二])?種(?:住宅|商業)區)))*/g);
  let zones = [];
  if (zoneM) zones = [...new Set(zoneM.join('及').split(/[及、與]/).filter(Boolean).map(short))];
  else {
    const z = t.match(/使用分區[\s\S]*?\n?([^\n\t]*?(?:區|用地))[。\s]/);
    if (z) zones = [z[1].trim()];
  }
  const own = /公私共有/.test(t) ? '公私' : /公有/.test(t) && !/私有/.test(t) ? '公' : /私有/.test(t) && /公有/.test(t) ? '公私' : '私';
  const num = (m) => (m ? +m[1].replace(/,/g, '') : '');
  let far = '', bcr = '', note = '';
  if (city === '臺北市' && zones.length === 1 && ZONES[zones[0]]) [far, bcr] = ZONES[zones[0]];
  else if (zones.length > 1) {
    note = '跨分區：已拆成分區子列，請填各分區面積';
    const bs = zones.map((z) => ZONES[z]?.[1]);
    if (city === '臺北市' && bs.every((b) => b && b === bs[0])) bcr = bs[0];
  }
  else if (zones.length === 1 && city !== '臺北市') note = '新北市容積率依各都市計畫，請手動確認';
  const pubM = t.match(/公有\s*[（(]\s*([\d.]+)\s*%/);
  const pubPct = own === '公' ? 1 : own === '公私' && pubM ? +pubM[1] / 100 : '';
  const parts = zones.length > 1 ? zones.map((z) => ({ zone: z, area: '', far: ZONES[z]?.[0] ?? '', bcr: ZONES[z]?.[1] ?? '' })) : null;
  return {
    pubPct, parts,
    lotNo, section: secM?.[1] || '', area: num(areaM), value: num(priceM[0]), landPrice: num(priceM[1]),
    zone: zones.join('／'), far, bcr, owner: own, note,
  };
}
