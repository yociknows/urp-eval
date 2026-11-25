import { DEFAULT_COST_TABLES } from './costTable.js';

export const autoName = (s) => `${s.structure} 地主基準${+((s.baseLandowner || 0) * 100).toFixed(2)}/獎勵${+((s.bonusLandowner || 0) * 100).toFixed(2)}`;

export const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);

export const LINKS = [
  { name: '使用分區查詢', url: 'https://historygis.udd.gov.taipei/urban/' },
  { name: '臺北地政雲', url: 'https://cloud.land.gov.taipei/cloud/map/index.html?fun=g51' },
  { name: '都更門檻估算', url: 'https://cloud.land.gov.taipei/urland/urban.html' },
  { name: '使照存根查詢', url: 'https://img2.gov.taipei/F100/F100.aspx' },
  { name: '民航局航高限制', url: 'https://web-gis2000.caa.gov.tw/caaPublic/' },
];

export const IMAGE_SLOTS = [
  { key: 'aerial', name: '空照圖', core: true, src: '臺北地政雲／Google 地圖', steps: ['開啟臺北地政雲，搜尋地段地號', '切換航照底圖並放大到基地範圍', 'Win+Shift+S 截圖後，在此格按 Ctrl+V'] },
  { key: 'zoning', name: '使用分區套繪圖', core: true, src: '使用分區查詢', steps: ['開啟使用分區查詢（historygis）', '輸入地段地號定位，開啟分區圖層', '截圖後在此格按 Ctrl+V'] },
  { key: 'cadastral', name: '地籍圖', core: true, src: '臺北地政雲', steps: ['臺北地政雲 → 地籍圖查詢', '輸入地號並勾選全部範圍地號', '截圖後在此格按 Ctrl+V'] },
  { key: 'permit', name: '使照存根（老屋／未保存登記可免）', core: false, src: '使照存根查詢', steps: ['開啟使照存根查詢 F100', '輸入使照字號（例：060使1378）', '截圖存根後在此格按 Ctrl+V'] },
  { key: 'street', name: '現場街景實拍', core: false, src: '現場照片／Google 街景', steps: ['現場拍照或開 Google 街景', '選出最能表現基地現況的角度', '拖曳照片或 Ctrl+V 貼上'] },
  { key: 'aviation', name: '航高查詢截圖', core: false, src: '民航局航高限制', steps: ['開啟民航局臺北航高查詢', '點選基地位置查詢限高', '截圖後在此格按 Ctrl+V'] },
];

export const defaultDesignItems = () => [
  { key: 'fire', name: '消防預審（中繼水箱）', amt: 200, on: true },
  { key: 'facade', name: '外觀立面設計', amt: 1000, on: true },
  { key: 'evac', name: '防火避難審查', amt: 200, on: true },
  { key: 'wind', name: '結構風洞試驗', amt: 0, on: false },
  { key: 'env', name: '環評及行人風場', amt: 0, on: false },
  { key: 'traffic', name: '交通影響評估', amt: 0, on: false },
];

export function newScheme(over = {}) {
  return {
    id: uid(),
    name: '新方案',
    structure: 'RC',
    floorsAbove: 21,
    costTableId: DEFAULT_COST_TABLES[0].id,
    legalPriceOverride: '',
    ratioMode: 'B',
    builderShareA: 0.4,
    baseLandowner: 0.63,
    bonusLandowner: 0.5,
    subsidyMode: 'quick',
    quick: { origFloors: 4, ratio: 0.3 },
    subsidyRows: [
      { id: 'r1', name: '臨路店面 1F', areaM2: '', ratio: 0.3 },
      { id: 'r2', name: '巷弄住家 1F', areaM2: '', ratio: 0.1 },
    ],
    constructionPrice: 28,
    durationDays: 1500,
    landCarry: 1,
    landLoan: 0,
    constLoan: 0.5,
    constInterestFactor: 1,
    rate: 0.035,
    deposit: 0,
    carRule: 'combined',
    price2: 130,
    priceStep: 5,
    carPrice: 350,
    mechCars: 0,
    mechPrice: 250,
    tdrCfg: { selfShare: 0.5, roadCostRatio: 0.25, appraisalRatio: 0.8, feedback: 0.1 },
    landPurchase: 0,
    commission: 4,
    urFeePerPing: 1,
    trustPerPing: 1,
    demolition: { households: 18, ping: 20, unit: 50000, times: 1 },
    rentRows: [],
    moving: { households: 0, unit: 40000, times: 1 },
    design: { items: defaultDesignItems() },
    extraCosts: [],
    salesFeeRate: 0.055,
    mgmtRate: 0.05,
    vat: 0,
    targetROI: 0.2,
    newPublicRatio: 0.35,
    ...over,
  };
}

export function newProject(over = {}) {
  const sc = newScheme();
  sc.name = autoName(sc);
  return {
    id: uid(),
    name: '新專案',
    updatedAt: Date.now(),
    site: { address: '', roads: '', roadWidth: 8, setback: 0, aviationLimit: '', investType: '都更協議合建', mrt: '', notes: '' },
    images: {},
    lots: [{ id: uid(), lotNo: '', zone: '', area: '', far: '', bcr: '', value: '', owner: '私', floors: 4, households: '' }],
    oldBuilding: { rightsPing: '', publicRatio: 0.1, indoorOverride: '' },
    farOverride: '',
    area: {
      bcr: 0.45, tdr: 0, urBonus: 0.5, disaster: 0, otherBonus: 0, coef: 1.58, exempt: 0.15, lobby: 5 / 95, otherArea: 0,
      balcony: 0.1, excav: 0.7, basementFloors: 4, roofRatio: 0.125, roofFloors: 3, carDivisor: 120, motorDivisor: 100,
      selfCars: 0, bonusMotors: 0, floorHeight: 3.3,
    },
    costTables: JSON.parse(JSON.stringify(DEFAULT_COST_TABLES)),
    schemes: [sc],
    activeSchemeId: sc.id,
    ...over,
  };
}

const L = (lotNo, zone, area, far, value, floors, households, owner = '私') =>
  ({ id: uid(), lotNo, zone, area, far, bcr: 0.45, value, owner, floors, households });

export function sampleProject() {
  const common = {
    rentRows: [
      { id: uid(), name: '大馬路 1F', households: 12, unit: 1500, ping: 30, months: 60 },
      { id: uid(), name: '巷弄 1F', households: 6, unit: 1000, ping: 30, months: 60 },
      { id: uid(), name: '2F 以上', households: 53, unit: 800, ping: 30, months: 60 },
    ],
    demolition: { households: 18, ping: 20, unit: 50000, times: 1 },
    moving: { households: 71, unit: 40000, times: 1 },
  };
  const a = newScheme({ name: 'RC 基準63/獎勵50', ...common });
  const c = newScheme({ name: 'SRC 基準63/獎勵50', ...common, structure: 'SRC', constructionPrice: 30.5, price2: 135 });
  return newProject({
    name: '松山區西松段一小段302地號等12筆',
    site: {
      address: '台北市松山區健康路196號',
      roads: '健康路、南京東路五段59巷、南京東路五段59巷31弄',
      roadWidth: 30, setback: 6.5, aviationLimit: '', investType: '都更協議合建',
      mrt: '南京三民站 1 號出口 600–650m（步行 8–10 分）',
      notes: '民生社區生活圈；臨長壽公園、醫院；學區西松國小／西松高中國中部；現況 4 樓公寓 71 戶，屋齡約 53 年（60~65 使）。',
    },
    lots: [
      L('302', '住三之一', 153, 3, 441176, 4, 4),
      L('303', '住三之一', 112, 3, 441176, 4, 4),
      L('304', '住三之一', 111, 3, 442200, 4, 4),
      L('305', '住三之一', 111, 3, 442200, 4, 4),
      L('306', '住三之一', 110, 3, 442200, 4, 4),
      L('307', '住三之一', 106, 3, 446739, 4, 4),
      L('308', '住三之一', 830, 3, 445345, 4, 24),
      L('311', '住三／住三之一', 393, 3, 390000, 4, 8),
      L('312', '住三／住三之一', 43, 3, 390000, 3, 3),
      L('315', '住三／住三之一', 202, 2.84, 390000, 4, 4),
      L('316', '住三／住三之一', 272, 2.76, 390000, 4, 8),
      L('695-2', '住三之一', 5, 3, 448000, '', 0, '公私'),
    ],
    oldBuilding: { rightsPing: 2089.68, publicRatio: 0.1, indoorOverride: '' },
    farOverride: 2.96,
    area: {
      bcr: 0.45, tdr: 0, urBonus: 0.7953, disaster: 0, otherBonus: 0, coef: 1.58, exempt: 0.15, lobby: 5 / 95, otherArea: 0,
      balcony: 0.1, excav: 0.7, basementFloors: 4, roofRatio: 0.125, roofFloors: 3, carDivisor: 120, motorDivisor: 100,
      selfCars: 0, bonusMotors: 0, floorHeight: 3.3,
    },
    schemes: [a, c],
    activeSchemeId: a.id,
  });
}
