import { computeAll } from '../src/calc.js';
import { newProject, newScheme } from '../src/defaults.js';

const $ = (id) => document.getElementById(id);
// 臺北市土地使用分區管制自治條例：容積率、建蔽率
const ZONES = [
  ['住一', 60, 30], ['住二', 120, 35], ['住二之一', 160, 35], ['住二之二', 225, 35],
  ['住三', 225, 45], ['住三之一', 300, 45], ['住三之二', 400, 45], ['住四', 300, 50], ['住四之一', 400, 50],
  ['商一', 360, 55], ['商二', 630, 65], ['商三', 560, 65], ['商四', 800, 75],
];
const F = [
  { id: 'ping', label: '基地面積', unit: '坪', def: 600, step: 10, chips: [300, 600, 1000] },
  { id: 'far', label: '容積率', unit: '%', def: 300, step: 5, chips: [225, 300, 400] },
  { id: 'bcr', label: '建蔽率', unit: '%', def: 45, step: 5, chips: [45, 50, 60] },
  { id: 'bf', label: '地下層數', unit: '層', def: 4, step: 1, chips: [3, 4, 5] },
  { id: 'bonus', label: '都更／危老獎勵', unit: '%', def: 50, step: 5, chips: [30, 50, 80] },
  { id: 'tdr', label: '容積移轉（買容積）', unit: '% 基準', def: 0, step: 1, chips: [0, 20, 30, 40], hint: '0＝不買容移；上限 40%' },
  { id: 'fb', label: '容移回饋地主', unit: '%', def: 10, step: 5, chips: [10, 20, 30], tdrOnly: true },
  { id: 'valM2', label: '公告現值（容移成本用）', unit: '元/㎡', def: 300000, step: 1000, chips: [200000, 300000, 450000], tdrOnly: true, hint: 'val' },
  { id: 'old', label: '舊建物權狀總坪', unit: '坪', def: 2400, step: 10, hint: '約＝基地坪 × 舊樓層數' },
  { id: 'hh', label: '戶數', unit: '戶', def: 80, step: 1, chips: [40, 80, 120] , grp: 'rent'},
  { id: 'rentU', label: '單價', unit: '元/坪/月', def: 1000, step: 50, chips: [800, 1000, 1500] , grp: 'rent'},
  { id: 'rentP', label: '每戶坪數', unit: '坪', def: 30, step: 1, chips: [25, 30, 35] , grp: 'rent'},
  { id: 'months', label: '月數', unit: '月', def: 48, step: 6, chips: [36, 48, 60], grp: 'rent' },
  { id: 'move', label: '每戶', unit: '萬', def: 4, step: 0.5, grp: 'move' },
  { id: 'ill', label: '戶數', unit: '戶', def: 0, step: 1, grp: 'ill' },
  { id: 'illPing', label: '每戶增建坪數', unit: '坪', def: 20, step: 1, grp: 'ill' },
  { id: 'illUnit', label: '每坪補貼', unit: '萬/坪', def: 3, step: 0.5, grp: 'ill' },
  { id: 'f1', label: '1F 補貼坪數（加給地主）', unit: '坪', def: 0, step: 5, chips: [0, 50, 100, 200], hint: 'f1ref' },
  { id: 'otherSub', label: '其他補貼總額', unit: '萬', def: 0, step: 10, chips: [0, 100, 300], hint: '例：2F、3F 增建補貼（24 戶 × 6 萬 ＝ 144 萬）' },
  { id: 'lb', label: '地主分配：基準容積部分', unit: '%', def: 63, step: 1, chips: [55, 60, 63] },
  { id: 'lr', label: '地主分配：獎勵容積部分', unit: '%', def: 50, step: 1, chips: [40, 45, 50], hint: 'comb' },
  { id: 'price', label: '新案單價', unit: '萬/坪', def: 120, step: 1, chips: [70, 90, 120] },
  { id: 'cost', label: '營造單價', unit: '萬/坪', def: 28, step: 0.5, chips: [25, 28, 30.5] },
  { id: 'comm', label: '每坪', unit: '萬/坪', def: 4, step: 0.5, grp: 'comm' },
  { id: 'rate', label: '銀行利率', unit: '%', def: 2.5, step: 0.25, chips: [2.5, 3, 3.5], adv: true },
  { id: 'cif', label: '工程款平均動用比例', unit: '%', def: 100, step: 10, chips: [100, 50], adv: true, hint: '公司預設 100%（不 ÷2）；以平均動用一半估時填 50%' },
  { id: 'carP', label: '車位單價', unit: '萬/個', def: 300, step: 10, chips: [250, 300, 350], adv: true },
  { id: 'carStep', label: '車位單價級距（單價一／三）', unit: '± 萬', def: 20, step: 10, chips: [0, 20, 50], adv: true },
  { id: 'selfCars', label: '自設汽車位（法定以外）', unit: '輛', def: 0, step: 1, chips: [0, 20, 30], adv: true },
  { id: 'dur', label: '工期', unit: '天', def: 1500, step: 30, chips: [1200, 1500, 1800], adv: true },
  { id: 'cl', label: '營建融資比率', unit: '%', def: 50, step: 5, chips: [40, 50, 60], adv: true },
  { id: 'urFee', label: '都更費用', unit: '萬/坪', def: 1, step: 0.5, chips: [0.5, 1, 1.5], adv: true },
  { id: 'trust', label: '信託費用', unit: '萬/坪', def: 1, step: 0.5, chips: [0.5, 1, 1.5], adv: true },
  { id: 'sfee', label: '銷售費率', unit: '%', def: 5.5, step: 0.5, chips: [4, 5, 5.5], adv: true },
  { id: 'mfee', label: '管理費率（× 建築工程）', unit: '%', def: 5, step: 0.5, chips: [3, 5], adv: true },
  { id: 'pstep', label: '單價級距（單價一／三）', unit: '± 萬', def: 5, step: 1, chips: [3, 5, 10], adv: true },
  { id: 'legal', label: '法定造價', unit: '元/㎡', def: 0, step: 100, chips: ['自動'], adv: true, hint: 'legal' },
];
let S = {};
let MYDEF = {};
try { MYDEF = JSON.parse(localStorage.getItem('urp-quick-def') || '{}'); } catch (e) {}
let curAuto = 0;
try { S = JSON.parse(localStorage.getItem('urp-quick') || '{}'); } catch (e) {}
F.forEach((f) => { if (MYDEF[f.id] !== undefined) f.def = MYDEF[f.id]; if (S[f.id] === undefined) S[f.id] = f.def; });
if (!S.struct) S.struct = 'RC';
if (S.cifV !== 2) { S.cif = 100; S.cifV = 2; }

function model() {
  const A = S.ping / 0.3025;
  const p = newProject();
  p.lots = [{ id: 'q', lotNo: 'Q', area: A, far: S.far / 100, bcr: S.bcr / 100, value: S.valM2, owner: '私', floors: 4, households: 0 }];
  p.area.tdr = S.tdr / 100; p.area.bcr = S.bcr / 100; p.area.basementFloors = S.bf; p.area.selfCars = S.selfCars;
  p.oldBuilding = { rightsPing: S.old, publicRatio: 0.1, indoorOverride: '' };
  p.area.urBonus = S.bonus / 100;
  const hh = S.hh;
  const estFloors = Math.max(1, Math.ceil(((S.far / 100) * (1 + (S.bonus + S.tdr) / 100) * 1.58) / (S.bcr / 100)));
  const s = newScheme({
    floorsAbove: estFloors,
    ratioMode: 'B', baseLandowner: S.lb / 100, bonusLandowner: S.lr / 100,
    tdrCfg: { selfShare: 0.5, roadCostRatio: 0.25, appraisalRatio: 0.8, feedback: S.fb / 100 }, price2: S.price, constructionPrice: S.cost,
    structure: S.struct, commission: S.comm, rate: S.rate / 100, constInterestFactor: S.cif / 100, durationDays: S.dur, constLoan: S.cl / 100, urFeePerPing: S.urFee, trustPerPing: S.trust, salesFeeRate: S.sfee / 100, mgmtRate: S.mfee / 100, priceStep: S.pstep, carPriceStep: S.carStep, carPrice: S.carP, legalPriceOverride: S.legal || '',
    subsidyRows: [{ id: 'f1', name: '1F 補貼', type: 'fixed', ping: S.f1 }],
    demolition: { households: S.ill, ping: S.illPing, unit: S.illUnit * 10000, times: 1 },
    extraCosts: S.otherSub ? [{ name: '其他補貼', amt: S.otherSub }] : [],
    rentRows: [{ id: 'r', name: '租金', households: hh, unit: S.rentU, ping: S.rentP, months: S.months }],
    moving: { households: hh, unit: S.move * 10000, times: 1 },
  });
  p.schemes = [s]; p.activeSchemeId = s.id;
  return computeAll(p, s);
}

const f1 = (v, d = 0) => (isFinite(v) ? v.toLocaleString('zh-TW', { maximumFractionDigits: d, minimumFractionDigits: d }) : '—');
const pc = (v, d = 1) => (v === null || !isFinite(v) ? '—' : (v * 100).toFixed(d) + '%');

function render() {
  try { localStorage.setItem('urp-quick', JSON.stringify(S)); } catch (e) {}
  if (window._syncZone) window._syncZone();
  if (!(S.ping > 0 && S.far > 0)) return;
  const { ar, inv, sw, fe } = model();
  curAuto = fe.unit;
  const lh = document.getElementById('legal');
  if (lh) {
    const lg = $('legal'); if (lg && !S.legal && document.activeElement !== lg) { lg.value = ''; lg.placeholder = `自動 ${f1(fe.unit)}`; }
    const hEl = lg.closest('.field').querySelector('#legal-h');
    if (hEl) hEl.textContent = S.legal ? `手動指定；查表值為 ${f1(fe.autoUnit)} 元/㎡（點「自動」恢復）` : `自動查表：${S.struct} ${Math.ceil(ar.estFloors)} 層 → ${f1(fe.unit)} 元/㎡（臺北市 114 年 8 月造價表）`;
  }
  const illCost = S.ill * S.illPing * S.illUnit;
  const subAt = (m) => (S.hh * S.rentU * S.rentP * m / 10000 + S.hh * S.move + illCost + (S.otherSub || 0)) / 10000;
  const csm = document.getElementById('commSum'); if (csm) csm.textContent = `${f1(S.ping * S.comm)} 萬`;
  const msum = document.getElementById('moveSum'); if (msum) msum.textContent = `${f1(S.hh * S.move)} 萬`;
  const isum = document.getElementById('illSum'); if (isum) isum.textContent = `${f1(illCost)} 萬`;
  const sb = null;
  if (sb) sb.innerHTML = `增建補貼 ${S.ill} 戶 × ${S.illPing} 坪 × ${S.illUnit} 萬 ＝ ${f1(illCost)} 萬<br><b>補貼費用約 ${f1(subAt(S.months), 2)} 億</b>（租金 36～60 個月：${f1(subAt(36), 2)}～${f1(subAt(60), 2)} 億；含搬家、增建）`;
  const vh = document.getElementById('val'); if (vh) vh.textContent = `跟地政雲一樣填「元/㎡」；＝ ${f1(S.valM2 / 0.3025 / 10000, 2)} 萬/坪`;
  const fr = document.getElementById('f1ref');
  if (fr) fr.textContent = `參考：基地坪 ÷ 4 層 × 銷售容積率 × 地主% × 30% ≈ ${f1((S.ping / 4) * ar.salesFar * inv.L * 0.3)} 坪（從建商可售扣除）`;
  const ch = document.getElementById('comb'); if (ch) ch.textContent = `綜合地主 ${pc(inv.L)}／建商 ${pc(inv.g)}（依獎勵 ${S.bonus}% 加權）`;
  document.querySelectorAll('.ill-only').forEach((el) => { el.style.display = S.ill > 0 ? '' : 'none'; });
  const sb2 = document.getElementById('sub2');
  if (sb2) sb2.innerHTML = `<b>補貼費用約 ${f1(subAt(S.months), 2)} 億</b>（租金 36～60 個月：${f1(subAt(36), 2)}～${f1(subAt(60), 2)} 億；含搬家、增建）`;
  document.querySelectorAll('.tdr-only').forEach((el) => { el.style.display = S.tdr > 0 ? '' : 'none'; });
  const ok1 = inv.swap >= 1, ok2 = inv.roi2 >= 0.2;
  const band = sw.ok ? [Math.max(sw.floor, sw.ceil - 0.03), sw.ceil] : null;
  let cls, title, sub;
  if (ok1 && ok2) { cls = 'go'; title = '值得深入評估'; sub = '地主室內一坪換一坪，公司投報也守得住。'; }
  else if (sw.ok) {
    cls = 'mid'; title = '調整分配比可以做';
    sub = `建議地主分配 ${pc(band[0])}～${pc(band[1])}（公司守住 20% 的上限往下 3%），目前 ${pc(inv.L)}。`;
  } else {
    cls = 'no'; title = '條件不足，先不建議';
    sub = sw.floor === null ? '再多分給地主也換不回一坪換一坪。' : sw.ceil === null ? '單價或獎勵太低，公司投報守不住 20%。' : `地主至少要 ${pc(sw.floor)}，但公司最多只能給 ${pc(sw.ceil)}。`;
  }
  const v = $('verdict'); v.className = 'verdict ' + cls;
  $('vt').textContent = title; $('vs').textContent = sub;
  const mi = $('mini'); mi.className = 'mini ' + cls + (mi.classList.contains('show') ? ' show' : '');
  $('mi-v').textContent = title; $('mi-s').textContent = inv.swap ? inv.swap.toFixed(2) : '—'; $('mi-r').textContent = pc(inv.roi2, 2);
  $('m-swap').textContent = inv.swap ? inv.swap.toFixed(2) : '—';
  $('m-swap').parentElement.className = 'metric ' + (ok1 ? 'ok' : 'bad');
  $('m-roi').textContent = pc(inv.roi2, 2);
  $('m-roi').parentElement.className = 'metric ' + (ok2 ? 'ok' : 'bad');
  $('m-sweet').textContent = sw.ok ? `${pc(band[0], 1)}～${pc(band[1], 1)}` : '無交集';
  $('m-floor').textContent = sw.floor === null ? '' : `一坪換一坪底線 ${pc(sw.floor)}`;
  $('m-sales').textContent = f1(ar.salesPing);
  const t = inv.tiers[1];
  const parkNeed = ar.cars * 12 + ar.motors * 1.9, parkHave = ar.basement * 0.3025;
  $('scale').innerHTML = [
    ['地上層數（未削線）', `約 ${Math.ceil(ar.estFloors)} 層`, `銷售容積率 ${ar.salesFar.toFixed(2)} ÷ 建蔽率 ${S.bcr}%`],
    ['地下層數', `${S.bf} 層`, `開挖率 70%，地下室 ${f1(parkHave)} 坪`],
    ['汽車位（法定）', `${f1(ar.cars)} 輛`, '允建樓地板 ÷ 120㎡'],
    ['機車位（法定）', `${f1(ar.motors)} 輛`, '允建樓地板 ÷ 100㎡'],
    ['營建總樓地板', `${f1(ar.constrPing)} 坪`, '不含陽台，營造成本計算基礎'],
  ].map(([k, x, h]) => `<div class="row"><span>${k}<small>${h}</small></span><b>${x}</b></div>`).join('')
    + `<div class="row"><span>地下室停車餘裕<small>汽車 12 坪／位、機車 1.9 坪／位</small></span><b style="color:${parkHave >= parkNeed ? 'var(--go)' : 'var(--no)'}">${parkHave >= parkNeed ? '足夠' : '不足'} ${f1(parkHave - parkNeed)} 坪</b></div>`
    + `<div class="row"><span>仍可增建汽車位<small>地下室餘裕 ÷ 12 坪／位</small></span><b style="color:${parkHave >= parkNeed ? 'var(--go)' : 'var(--no)'}">${f1((parkHave - parkNeed) / 12, 1)} 位</b></div>`;
  $('detail').innerHTML = [
    ['銷售容積率', ar.salesFar.toFixed(2)],
    ['地主分回', f1(inv.landownerPing - inv.subsidy) + ' 坪'],
    ['1F 補貼（加給地主）', f1(inv.subsidy) + ' 坪'],
    ['建商可售', f1(inv.builderPing) + ' 坪'],
    ['建商總銷 (S)', f1(t.S / 10000, 1) + ' 億'],
    ['總成本 (C)', f1(t.C / 10000, 1) + ' 億'],
    ['損益 (R)', f1(t.R / 10000, 1) + ' 億'],
    ['毛利率', pc(t.grossRate)],
    ['全案總銷', f1(t.whole / 10000, 1) + ' 億'],
    ['自有資金報酬率', pc(t.eqRoi, 2)],
    ...inv.tiers.map((x, i) => [`投報率 單價${['一', '二', '三'][i]}（${x.p} 萬）`, pc(x.roi, 2)]),
    ['補貼費用', f1((inv.subsidyCost + (S.otherSub || 0)) / 10000, 2) + ' 億'],
    ...(S.tdr > 0 ? [['容移總銷坪', f1(inv.tdrTotal) + ' 坪'], ['回饋地主', f1(inv.tdrFeedback) + ' 坪'], ['容移成本', f1(inv.landCost / 10000, 2) + ' 億']] : []),
  ].map(([k, x]) => `<div class="row"><span>${k}</span><b>${x}</b></div>`).join('');
}

function build() {
  $('struct').innerHTML = ['RC', 'SRC'].map((k) => `<button type="button" data-s="${k}" class="${S.struct === k ? 'on' : ''}">${k}<small>${k === 'RC' ? '鋼筋混凝土' : '鋼骨鋼筋混凝土'}</small></button>`).join('');
  $('struct').addEventListener('click', (e) => {
    const b = e.target.closest('button'); if (!b) return;
    const prev = S.struct; S.struct = b.dataset.s;
    // 營造單價還是另一構造的預設值時，跟著切換
    if (prev === 'RC' && S.struct === 'SRC' && S.cost === 28) S.cost = 30.5;
    if (prev === 'SRC' && S.struct === 'RC' && S.cost === 30.5) S.cost = 28;
    $('cost').value = S.cost;
    [...$('struct').children].forEach((x) => x.classList.toggle('on', x.dataset.s === S.struct));
    render();
  });
  const tpl = (f) => `
    <div class="field${f.tdrOnly ? ' tdr-only' : ''}${f.illOnly ? ' ill-only' : ''}">
      <label for="${f.id}">${f.label}<span>${f.unit}</span></label>
      <div class="stepper">
        <button type="button" data-d="-1" data-k="${f.id}" aria-label="減少">−</button>
        <input id="${f.id}" inputmode="decimal" value="${f.id === 'legal' && !S.legal ? '' : S[f.id]}" placeholder="${f.id === 'legal' ? '自動查表' : ''}">
        <button type="button" data-d="1" data-k="${f.id}" aria-label="增加">＋</button>
      </div>
      ${f.chips ? `<div class="chips">${f.chips.map((c) => `<button type="button" data-k="${f.id}" data-v="${c}">${c}</button>`).join('')}</div>` : ''}
      ${f.hint === 'comb' ? '<div class="hint" id="comb"></div>' : f.hint === 'sub' ? '<div class="hint" id="sub"></div>' : f.hint === 'sub2' ? '<div class="hint" id="sub2"></div>' : f.hint === 'f1ref' ? '<div class="hint" id="f1ref"></div>' : f.hint === 'val' ? '<div class="hint" id="val"></div>' : f.hint === 'legal' ? '<div class="hint" id="legal-h"></div>' : f.hint ? `<div class="hint">${f.hint}</div>` : ''}
    </div>`;
  const ctpl = (f) => `
    <div class="cf">
      <label for="${f.id}">${f.label.replace('（租金・搬遷）', '')}<span>${f.unit}</span></label>
      <div class="cstep">
        <button type="button" data-d="-1" data-k="${f.id}" aria-label="減少">−</button>
        <input id="${f.id}" inputmode="decimal" value="${S[f.id]}">
        <button type="button" data-d="1" data-k="${f.id}" aria-label="增加">＋</button>
      </div>
    </div>`;
  const main = [];
  F.filter((f) => !f.adv).forEach((f) => {
    if (f.grp === 'rent') {
      if (f.id === 'hh') main.push(`<div class="field"><label>租金補貼<span>戶數 × 單價 × 坪數 × 月數</span></label><div class="cgrid">${F.filter((x) => x.grp === 'rent').map(ctpl).join('')}</div>${'<div class="hint" id="sub2"></div>'}</div>`);
    } else if (f.grp === 'comm') {
      main.push(`<div class="field"><label>土地佣金（仲人）<span>基地坪 × 每坪</span></label><div class="cgrid">${ctpl(f)}<div class="cf"><label>佣金小計</label><div class="csum" id="commSum">—</div></div></div></div>`);
    } else if (f.grp === 'move') {
      main.push(`<div class="field"><label>搬家補貼<span>戶數同租金補貼</span></label><div class="cgrid">${ctpl(f)}<div class="cf"><label>搬家補貼小計</label><div class="csum" id="moveSum">—</div></div></div></div>`);
    } else if (f.grp === 'ill') {
      if (f.id === 'ill') main.push(`<div class="field"><label>違章增建／占有戶<span>戶數 × 坪數 × 每坪補貼</span></label><div class="cgrid">${F.filter((x) => x.grp === 'ill').map(ctpl).join('')}<div class="cf"><label>增建補貼小計</label><div class="csum" id="illSum">—</div></div></div></div>`);
    } else main.push(tpl(f));
  });
  $('fields').innerHTML = main.join('');
  const zf = document.createElement('div'); zf.className = 'field';
  zf.innerHTML = `<label for="zone">使用分區<span>臺北市，自動帶入容積率、建蔽率</span></label>
    <select id="zone" class="zsel"><option value="">自訂（手動輸入下方數值）</option>${ZONES.map(([z, f, b]) => `<option value="${z}">${z}（容積 ${f}%／建蔽 ${b}%）</option>`).join('')}</select>`;
  $('fields').insertBefore(zf, $('far').closest('.field'));
  const syncZone = () => { const z = ZONES.find(([, f, b]) => f === S.far && b === S.bcr && (S.zone ? true : false)); $('zone').value = S.zone && ZONES.some((x) => x[0] === S.zone && x[1] === S.far && x[2] === S.bcr) ? S.zone : ''; };
  $('zone').addEventListener('change', (e) => {
    const z = ZONES.find((x) => x[0] === e.target.value); S.zone = e.target.value;
    if (z) { S.far = z[1]; S.bcr = z[2]; $('far').value = S.far; $('bcr').value = S.bcr; }
    render();
  });
  window._syncZone = syncZone; syncZone();
  $('adv').innerHTML = F.filter((f) => f.adv).map(tpl).join('');
  F.forEach((f) => {
    $(f.id).addEventListener('input', (e) => { if (f.id === 'legal' && e.target.value.trim() === '') { S.legal = 0; render(); return; } const n = parseFloat(e.target.value.replace(/,/g, '')); if (!isNaN(n)) { S[f.id] = n; render(); } });
  });
  const onClick = (e) => {
    const b = e.target.closest('button'); if (!b) return;
    const f = F.find((x) => x.id === b.dataset.k); if (!f) return;
    if (b.dataset.v === '自動') { S[f.id] = 0; $(f.id).value = ''; render(); return; }
    if (b.dataset.v) S[f.id] = +b.dataset.v;
    else if (f.id === 'legal' && !S.legal) S.legal = curAuto;
    else S[f.id] = Math.max(0, +(S[f.id] + f.step * +b.dataset.d).toFixed(2));
    $(f.id).value = S[f.id]; render();
  };
  $('fields').addEventListener('click', onClick); $('adv').addEventListener('click', onClick);
  $('saveDef').addEventListener('click', () => {
    F.filter((f) => f.adv).forEach((f) => { MYDEF[f.id] = S[f.id]; f.def = S[f.id]; });
    try { localStorage.setItem('urp-quick-def', JSON.stringify(MYDEF)); } catch (e) {}
    $('saveDef').textContent = '已存成預設！之後「恢復預設值」會用這組';
    setTimeout(() => { $('saveDef').textContent = '把目前進階設定存成我的預設'; }, 3000);
  });
  $('copyIn').addEventListener('click', async () => {
    const lines = ['【都更快篩輸入】', `構造：${S.struct}`, `使用分區：${S.zone || '自訂'}`]
      .concat(F.map((f) => `${f.grp === 'rent' ? '租金補貼' : f.grp === 'ill' ? '違章增建' : f.grp === 'move' ? '搬家補貼' : f.grp === 'comm' ? '土地佣金' : ''}${f.label}：${f.id === 'legal' && !S.legal ? '自動' : S[f.id]} ${f.unit}`))
      .concat(['【結果】', `判斷：${$('vt').textContent}`, `一坪換：${$('m-swap').textContent}`, `投報率：${$('m-roi').textContent}`, `建議分配比例：${$('m-sweet').textContent}`]);
    const t = lines.join('\n');
    const b = $('copyIn');
    try { await navigator.clipboard.writeText(t); b.textContent = '已複製！到對話框貼上即可'; }
    catch (e) { const ta = document.createElement('textarea'); ta.value = t; ta.style.cssText = 'width:100%;height:200px;margin-top:8px'; b.after(ta); ta.select(); b.textContent = '請長按下方文字全選複製'; }
    setTimeout(() => { b.textContent = '複製目前輸入（傳給 Claude 檢查）'; }, 3000);
  });
  $('reset').addEventListener('click', () => { F.forEach((f) => { S[f.id] = f.def; $(f.id).value = f.def; }); S.struct = 'RC'; S.zone = ''; [...$('struct').children].forEach((x) => x.classList.toggle('on', x.dataset.s === 'RC')); render(); });
}
build(); render();
{ const io = new IntersectionObserver(([e]) => $('mini').classList.toggle('show', !e.isIntersecting)); io.observe($('verdict')); }
