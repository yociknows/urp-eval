import { lookupCost } from './costTable.js';

export const P = 0.3025; // ㎡→坪
const n = (v, d = 0) => (v === '' || v === null || v === undefined || isNaN(+v) ? d : +v);

/* ---------- 頁2 清冊彙總 ---------- */
// 跨分區地號：parts = [{ zone, area, far, bcr }]
export function lotEff(l) {
  const parts = (l.parts || []).filter((x) => n(x.area) > 0);
  if (!parts.length) return { far: n(l.far), bcr: n(l.bcr), split: false };
  const pa = parts.reduce((s, x) => s + n(x.area), 0);
  return {
    far: parts.reduce((s, x) => s + n(x.area) * n(x.far), 0) / pa,
    bcr: parts.reduce((s, x) => s + n(x.area) * n(x.bcr), 0) / pa,
    split: true, partArea: pa,
  };
}
export const pubShare = (l) => (l.owner === '公' ? 1 : l.owner === '公私' ? n(l.pubPct) : 0);

export function cadastre(project) {
  const lots = project.lots || [];
  let area = 0, farSum = 0, valSum = 0, hh = 0, pub = 0, f1 = 0;
  const zones = {};
  for (const l of lots) {
    const a = n(l.area);
    const e = lotEff(l);
    area += a;
    farSum += a * e.far;
    valSum += a * n(l.value);
    hh += n(l.households);
    pub += a * pubShare(l);
    if (n(l.floors) > 0) f1 += a / n(l.floors);
    const ps = (l.parts || []).filter((x) => n(x.area) > 0);
    const items = ps.length ? ps.map((x) => ({ zone: x.zone, area: n(x.area) * (a / e.partArea || 1), far: n(x.far) })) : [{ zone: l.zone, area: a, far: n(l.far) }];
    for (const it of items) {
      const k = (it.zone || '未填') + '|' + it.far;
      zones[k] = zones[k] || { zone: it.zone || '未填', far: it.far, area: 0 };
      zones[k].area += it.area;
    }
  }
  const ob = project.oldBuilding || {};
  const farAuto = area ? farSum / area : 0;
  const far = n(project.farOverride, 0) > 0 ? n(project.farOverride) : farAuto;
  const rightsPing = n(ob.rightsPing);
  const indoorAuto = rightsPing * (1 - n(ob.publicRatio, 0.1));
  return {
    area, areaPing: area * P, farAuto, far,
    avgValue: area ? valSum / area : 0,
    households: hh,
    publicRatio: area ? pub / area : 0, publicArea: pub,
    zoneStats: Object.values(zones).sort((x, y) => y.area - x.area),
    f1Area: f1, f1Ping: f1 * P,
    rightsPing,
    oldIndoor: n(ob.indoorOverride, 0) > 0 ? n(ob.indoorOverride) : indoorAuto,
    indoorAuto,
  };
}

/* ---------- 頁3 面積表 ---------- */
export function areaTable(project, cad) {
  const a = project.area;
  const A = cad.area;
  const f = cad.far;
  const tdr = n(a.tdr), ur = n(a.urBonus), dis = n(a.disaster), oth = n(a.otherBonus);
  const bonusNonTdr = ur + dis + oth;
  const B = tdr + bonusNonTdr;
  const baseVol = A * f;
  const tdrVol = baseVol * tdr;
  const allowed = baseVol * (1 + B);
  const exempt = allowed * n(a.exempt, 0.15);
  const lobby = (allowed + exempt) * n(a.lobby, 5 / 95);
  const floorArea = allowed + exempt + lobby + n(a.otherArea);
  const balcony = floorArea * n(a.balcony, 0.1);
  const basement = A * n(a.excav, 0.7) * n(a.basementFloors, 4);
  const maxProj = A * n(a.bcr, 0.45);
  const roof = maxProj * n(a.roofRatio, 0.125) * n(a.roofFloors, 3);
  const constrM2 = floorArea + basement + roof;
  const constrM2Bal = constrM2 + balcony;
  const k = n(a.coef, 1.58);
  const salesPing = A * P * f * (1 + B) * k;
  const salesFar = f * (1 + B) * k;
  const legalCars = floorArea / n(a.carDivisor, 120);
  const cars = legalCars + n(a.selfCars);
  const motors = floorArea / n(a.motorDivisor, 100) + n(a.bonusMotors);
  const estFloors = n(a.bcr) ? salesFar / n(a.bcr) : 0;
  return {
    A, f, tdr, bonusNonTdr, B, baseVol, tdrVol, allowed, exempt, lobby, floorArea, balcony,
    basement, maxProj, roof, constrM2, constrM2Bal, constrPing: constrM2 * P,
    k, salesPing, salesFar, legalCars, cars, motors, estFloors,
  };
}

export function heightCheck(project, scheme) {
  const s = project.site, a = project.area;
  const road = n(s.roadWidth), back = n(s.setback);
  const h = n(scheme?.floorsAbove) * n(a.floorHeight, 3.3);
  const gen = 3.6 * (road + back);
  const ur = 5 * (road / 2 + back);
  const avi = n(s.aviationLimit);
  return { h, gen, ur, avi, okGen: h <= gen, okUr: h <= ur, okAvi: avi ? h <= avi : null };
}

/* ---------- 頁4 造價與費用 ---------- */
export function architectFee(total) {
  const br = [[300, 0.08], [1500, 0.075], [6000, 0.0725], [Infinity, 0.07]];
  let fee = 0, prev = 0;
  for (const [cap, r] of br) {
    if (total > prev) fee += (Math.min(total, cap) - prev) * r;
    prev = cap;
  }
  return fee;
}
export function mgmtFund(total) {
  const br = [[1000, 0.02], [10000, 0.015], [100000, 0.005], [Infinity, 0.003]];
  let fee = 0, prev = 0;
  for (const [cap, r] of br) {
    if (total > prev) fee += (Math.min(total, cap) - prev) * r;
    prev = cap;
  }
  return fee;
}

export function fees(project, scheme, ar) {
  const table = (project.costTables || []).find((t) => t.id === scheme.costTableId) || project.costTables?.[0];
  const unit = n(scheme.legalPriceOverride) > 0 ? n(scheme.legalPriceOverride) : lookupCost(table, scheme.structure, n(scheme.floorsAbove));
  const legal = (unit * ar.constrM2) / 10000;
  const arch = architectFee(legal);
  const d = scheme.design || {};
  const struct = legal * 0.007;
  const mep = (ar.constrM2 * 60) / 10000;
  const items = [
    { key: 'struct', name: '結構設計（法定造價×0.7%）', amt: struct, on: true, auto: true },
    { key: 'mep', name: '機電設計簽證（樓地板㎡×60元）', amt: mep, on: true, auto: true },
    ...(d.items || []).map((x) => ({ ...x, amt: n(x.amt) })),
  ];
  const related = items.filter((x) => x.on).reduce((s, x) => s + x.amt, 0);
  return { unit, autoUnit: lookupCost(table, scheme.structure, n(scheme.floorsAbove)), tableName: table?.name, legal, arch, items, related, design: arch + related, fund: mgmtFund(legal) };
}

/* ---------- 頁5 投報 ---------- */
export function ratios(scheme, ar) {
  if (scheme.ratioMode === 'A') {
    const g = n(scheme.builderShareA, 0.4);
    return { L: 1 - g, g, baseL: 1 - g };
  }
  const lb = n(scheme.baseLandowner, 0.63), lr = n(scheme.bonusLandowner, 0.5);
  const w = ar.bonusNonTdr;
  const L = (lb + w * lr) / (1 + w);
  return { L, g: 1 - L, baseL: lb };
}

function subsidyPing(scheme, ar, cad, L) {
  const all = scheme.subsidyRows || [];
  if (all.some((r) => r.type === 'fixed')) return all.filter((r) => r.type === 'fixed').map((r) => ({ name: r.name, ping: n(r.ping) }));
  const rows = all.filter((r) => n(r.areaM2) > 0);
  if (rows.length) return rows.map((r) => ({ name: r.name, ping: n(r.areaM2) * P * ar.salesFar * L * n(r.ratio) }));
  const q = scheme.quick || {};
  return [{ name: '粗估（未填細項）', ping: (ar.A * P / n(q.origFloors, 4)) * ar.salesFar * L * n(q.ratio, 0.3), quick: true }];
}

export function invest(project, scheme, cad, ar, fe, Loverride) {
  const s = scheme;
  const rt = ratios(s, ar);
  const L = Loverride ?? rt.L;
  const g = 1 - L;
  const fb = n(s.tdrCfg?.feedback, 0.1);
  // 面積分配
  // 容移：建商出資購入，地主依比例應得之容移坪由建商扣回；另回饋地主「容移總銷坪 × 回饋%」
  const tdrTotal = ar.A * P * ar.f * ar.tdr * ar.k;
  const tdrLandowner = tdrTotal * L;
  const tdrFeedback = tdrTotal * fb;
  const takeback = tdrLandowner - tdrFeedback;
  const subs = subsidyPing(s, ar, cad, L);
  const subsidy = subs.reduce((a, x) => a + x.ping, 0);
  const landownerPing = ar.salesPing * L - takeback + subsidy;
  const builderPing = ar.salesPing * g + takeback - subsidy;
  // 車位
  const gCar = s.carRule === 'base' && s.ratioMode === 'B' ? 1 - n(s.baseLandowner, 0.63) : g;
  const carTdr = ar.cars * (ar.B ? ar.tdr / (1 + ar.B) : 0);
  const carTake = carTdr * (1 - gCar) - carTdr * fb;
  const builderCars = ar.cars * gCar + carTake;
  const mech = n(s.mechCars);
  const flatCars = Math.max(0, builderCars - mech);
  // 時程
  const years = n(s.durationDays, 1500) / 365;
  const rate = n(s.rate, 0.035);
  const p2 = n(s.price2, 130), step = n(s.priceStep, 5);
  const prices = [p2 - step, p2, p2 + step];
  // 容移成本
  const tc = s.tdrCfg || {};
  const tdrPing = ar.tdrVol * P;
  const selfShare = n(tc.selfShare, 0.5);
  const tdrRoad = (ar.tdrVol * cad.avgValue * n(tc.roadCostRatio, 0.25) / 10000) * selfShare;
  const tdrFee = Math.max(0, (p2 * n(tc.appraisalRatio, 0.8) - n(s.constructionPrice)) * ar.k * tdrPing * (1 - selfShare));
  const landCost = tdrRoad + tdrFee + n(s.landPurchase);
  // 補貼
  const dm = s.demolition || {};
  const demo = n(dm.households) * n(dm.ping) * n(dm.unit) * n(dm.times, 1);
  const rent = (s.rentRows || []).reduce((a, r) => a + n(r.households) * n(r.unit) * n(r.ping) * n(r.months), 0);
  const mv = s.moving || {};
  const moving = n(mv.households) * n(mv.unit) * n(mv.times, 1);
  const subsidyCost = (demo + rent + moving) / 10000;
  const construction = n(s.constructionPrice) * ar.constrPing;
  const lines = [
    { key: 'land', name: '土地／容積移轉成本', amt: landCost },
    { key: 'comm', name: '土地佣金', amt: cad.areaPing * n(s.commission, 4) },
    { key: 'subs', name: '補貼費用（租金・搬遷・拆遷）', amt: subsidyCost },
    { key: 'urfee', name: '都更費用', amt: cad.areaPing * n(s.urFeePerPing, 1) },
    { key: 'fund', name: '管理基金', amt: fe.fund },
    { key: 'trust', name: '信託費用', amt: cad.areaPing * n(s.trustPerPing, 1) },
    { key: 'build', name: '建築工程', amt: construction },
    { key: 'design', name: '設計費（建築師＋相關設計）', amt: fe.design },
    { key: 'lint', name: '土地款利息', amt: landCost * n(s.landCarry, 1) * rate * (years + 0.5) },
    { key: 'cint', name: '工程款利息', amt: construction * n(s.constLoan, 0.5) * rate * years * n(s.constInterestFactor, 1) },
    { key: 'dint', name: '保證金利息', amt: n(s.deposit) * rate * (years + 2) / 2 },
    ...(s.extraCosts || []).map((x, i) => ({ key: 'x' + i, name: x.name || '其他', amt: n(x.amt) })),
  ];
  const A = lines.reduce((a, x) => a + x.amt, 0);
  const loans = landCost * n(s.landLoan) + construction * n(s.constLoan, 0.5);
  const mgmt = construction * n(s.mgmtRate, 0.05);
  const vat = n(s.vat);
  const tiers = prices.map((p, ti) => {
    const cp = n(s.carPrice, 350) + (ti - 1) * n(s.carPriceStep, 0);
    const S = builderPing * p + flatCars * cp + mech * n(s.mechPrice, 250);
    const salesFee = S * n(s.salesFeeRate, 0.055);
    const C = A + salesFee + mgmt + vat;
    const R = S - C;
    const equity = C - loans;
    return {
      p, cp, S, whole: ar.salesPing * p + ar.cars * cp,
      gross: S - A, grossRate: S ? (S - A) / S : 0,
      salesFee, mgmt, vat, C, R, roi: C ? R / C : 0, equity, eqRoi: equity ? R / equity : 0,
    };
  });
  const landownerIndoor = landownerPing * (1 - n(s.newPublicRatio, 0.35));
  const swap = cad.oldIndoor ? landownerIndoor / cad.oldIndoor : 0;
  return {
    L, g, baseL: rt.baseL, subs, subsidy, takeback, tdrTotal, tdrLandowner, tdrFeedback, carTdr, landownerPing, builderPing, builderCars, flatCars, mech,
    years, prices, tdrRoad, tdrFee, landCost, demo, rent, moving, subsidyCost, construction,
    lines, A, loans, tiers, landownerIndoor, swap, roi2: tiers[1].roi,
  };
}

/* ---------- 甜蜜點反推 ---------- */
function bisect(fn, lo, hi, wantIncreasing) {
  for (let i = 0; i < 50; i++) {
    const m = (lo + hi) / 2;
    if (fn(m) === wantIncreasing) hi = m; else lo = m;
  }
  return (lo + hi) / 2;
}

export function sweetSpot(project, scheme, cad, ar, fe) {
  const target = n(scheme.targetROI, 0.2);
  const ev = (L) => invest(project, scheme, cad, ar, fe, L);
  // 底線：地主比例最低值，使一坪換 >= 1
  let floor = null;
  if (ev(1).swap >= 1) floor = ev(0).swap >= 1 ? 0 : bisect((L) => ev(L).swap >= 1, 0, 1, true);
  // 上限：地主比例最高值，使單價二投報 >= 目標
  let ceil = null;
  if (ev(0).roi2 >= target) ceil = ev(1).roi2 >= target ? 1 : bisect((L) => ev(L).roi2 < target, 0, 1, true);
  const ok = floor !== null && ceil !== null && floor <= ceil;
  return { floor, ceil, ok, target };
}

export function computeAll(project, scheme) {
  const cad = cadastre(project);
  const ar = areaTable(project, cad);
  const fe = fees(project, scheme, ar);
  const inv = invest(project, scheme, cad, ar, fe);
  const sw = sweetSpot(project, scheme, cad, ar, fe);
  const hc = heightCheck(project, scheme);
  return { cad, ar, fe, inv, sw, hc };
}
