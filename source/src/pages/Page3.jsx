import React from 'react';
import { LuSettings2, LuRuler, LuCar, LuTriangleAlert } from 'react-icons/lu';
import { Card, NumField, Row, fmt, pct, Badge, Select, Field, Btn, NumInput, Tip } from '../ui.jsx';
import { buildingRows } from './Page1.jsx';
import { LuScale } from 'react-icons/lu';

const P = 0.3025;
const M = (v) => `${fmt(v, 2)} ㎡`;
const PG = (v) => `${fmt(v * P, 2)} 坪`;

export default function Page3({ project, scheme, up, upScheme, res }) {
  const a = project.area;
  const set = (k) => (v) => up((p) => { p.area[k] = v; });
  const { ar, hc, cad } = res;

  return (
    <div className="space-y-5">
      <h1 className="text-xl font-bold text-navy-800">面積表與法規檢核</h1>
      <div className="grid grid-cols-[380px_1fr] gap-5 items-start">
        <Card title="參數輸入（專案共用）" icon={LuSettings2}>
          <div className="grid grid-cols-2 gap-3">
            <Field label="基準容積率" tip="取自頁2「採用容積率」，要改請到清冊覆寫"><div className="rounded-md bg-oat-100 px-2 py-1 text-right text-sm tabular-nums">{pct(cad.far, 2)}</div></Field>
            <NumField label="建蔽率" pct value={a.bcr} onChange={set('bcr')} />
            <NumField label="容積移轉" pct value={a.tdr} onChange={set('tdr')} tip={'上限 40%（道路容移等）。\n容移部分地主應分得坪，建商收回 90%、回饋地主 10%（回饋比例在頁5設定）。'} />
            <NumField label="都更（危老）獎勵" pct value={a.urBonus} onChange={set('urBonus')} />
            <NumField label="防災獎勵" pct value={a.disaster} onChange={set('disaster')} />
            <NumField label="其他獎勵" pct value={a.otherBonus} onChange={set('otherBonus')} tip="開放空間、歷建容移、地下室開挖等" />
            <div className="col-span-2 rounded-md bg-navy-700/5 px-2.5 py-1.5 text-xs text-navy-800">
              獎勵＋容移合計 <b>{pct(ar.B, 2)}</b>（總容積＝基準 {(1 + ar.B).toFixed(2)} 倍）
              {ar.tdr > 0 && <span className="text-stone-500">・容移成本與回饋在第 5 頁</span>}
            </div>
            <NumField label="建築係數" value={a.coef} onChange={set('coef')} tip="銷售坪 ÷ 容積坪，台北一般 1.55~1.60，預設 1.58" />
            <NumField label="免計容積" pct value={a.exempt} onChange={set('exempt')} />
            <NumField label="陽台比例" pct value={a.balcony} onChange={set('balcony')} />
            <NumField label="其他(車道騎樓)" unit="㎡" value={a.otherArea} onChange={set('otherArea')} />
            <NumField label="地下室開挖率" pct value={a.excav} onChange={set('excav')} />
            <NumField label="地下層數" unit="層" value={a.basementFloors} onChange={set('basementFloors')} />
            <NumField label="屋突層數" unit="層" value={a.roofFloors} onChange={set('roofFloors')} tip="屋突面積 = 最大投影面積 × 12.5% × 層數" />
            <NumField label="每層均高" unit="m" value={a.floorHeight} onChange={set('floorHeight')} />
            <Field label="車位標準" tip="法定汽車位 = 允建樓地板 ÷ 120（台北）或 150（新北）">
              <Select value={String(a.carDivisor)} onChange={(v) => set('carDivisor')(+v)}
                options={[{ value: '120', label: '台北市 ÷120' }, { value: '150', label: '新北市 ÷150' }, ...(![120, 150].includes(+a.carDivisor) ? [{ value: String(a.carDivisor), label: `自訂 ÷${a.carDivisor}` }] : [])]} />
            </Field>
            <NumField label="自訂車位除數" unit="㎡/輛" value={a.carDivisor} onChange={set('carDivisor')} />
            <NumField label="自設汽車位" unit="輛" value={a.selfCars} onChange={set('selfCars')} />
            <NumField label="獎勵機車位" unit="輛" value={a.bonusMotors} onChange={set('bonusMotors')} />
          </div>
        </Card>

        <div className="space-y-5">
          <Card title="面積計算" icon={LuRuler}>
            <table className="w-full">
              <thead><tr className="text-xs text-stone-500 border-b-2 border-oat-200"><th className="text-left py-1.5">項目</th><th className="text-left px-2">計算式</th><th className="text-right">㎡</th><th className="text-left pl-1">坪</th></tr></thead>
              <tbody>
                <Row label="基準容積" formula={`${fmt(ar.A, 2)} × ${pct(ar.f, 2)}`} value={M(ar.baseVol)} unit={PG(ar.baseVol)} />
                <Row label="容積移轉" sub formula={`基準 × ${pct(ar.tdr, 2)}`} value={M(ar.tdrVol)} unit={PG(ar.tdrVol)} />
                <Row label="都更＋防災＋其他獎勵" sub formula={`基準 × ${pct(ar.bonusNonTdr, 2)}`} value={M(ar.baseVol * ar.bonusNonTdr)} unit={PG(ar.baseVol * ar.bonusNonTdr)} />
                <Row label="允建容積合計" strong formula={`基準 × (1 + ${pct(ar.B, 2)})`} value={M(ar.allowed)} unit={PG(ar.allowed)} />
                <Row label="免計容積" formula={`允建 × ${pct(a.exempt, 0)}`} value={M(ar.exempt)} unit={PG(ar.exempt)} />
                <Row label="地上層梯廳" formula="(允建 + 免計) × 5/95" value={M(ar.lobby)} unit={PG(ar.lobby)} />
                <Row label="其他（車道、騎樓）" value={M(+a.otherArea || 0)} unit={PG(+a.otherArea || 0)} />
                <Row label="允建樓地板面積" strong formula="允建 + 免計 + 梯廳 + 其他" value={M(ar.floorArea)} unit={PG(ar.floorArea)} />
                <Row label="陽台面積" formula={`樓地板 × ${pct(a.balcony, 0)}`} value={M(ar.balcony)} unit={PG(ar.balcony)} />
                <Row label="地下室面積" formula={`土地 × ${pct(a.excav, 0)} × ${a.basementFloors} 層`} value={M(ar.basement)} unit={PG(ar.basement)} />
                <Row label="屋突面積" formula={`最大投影 ${fmt(ar.maxProj, 1)} × 12.5% × ${a.roofFloors}`} value={M(ar.roof)} unit={PG(ar.roof)} />
                <Row label="營建總樓地板（不含陽台）" strong tip="頁4 法定造價與頁5 建築工程的計算基礎" formula="樓地板 + 地下室 + 屋突" value={M(ar.constrM2)} unit={PG(ar.constrM2)} />
                <Row label="營建總樓地板（含陽台）" formula="上列 + 陽台" value={M(ar.constrM2Bal)} unit={PG(ar.constrM2Bal)} />
                <Row label="銷售容積率" formula={`${pct(ar.f, 2)} × (1+${pct(ar.B, 2)}) × ${ar.k}`} value={ar.salesFar.toFixed(3)} />
                <Row label="總銷售面積" strong formula={`土地坪 ${fmt(ar.A * P, 2)} × 銷售容積率`} value={`${fmt(ar.salesPing, 2)} 坪`} />
                <Row label="預估地上層數（未削線）" formula="銷售容積率 ÷ 建蔽率" value={fmt(ar.estFloors, 1)} unit="層" />
              </tbody>
            </table>
          </Card>

          <BonusCap project={project} ar={ar} up={up} />

          <RuleAlerts project={project} ar={ar} />

          <div className="grid grid-cols-2 gap-5">
            <Card title="三合一高度檢核" icon={LuTriangleAlert} tip={`本案高度 = 頁5 方案地上層數 ${scheme.floorsAbove} 層 × 每層均高 ${a.floorHeight}m`}>
              <div className="text-sm mb-3">本案預計高度 <b className="text-lg text-navy-800 tabular-nums">{fmt(hc.h, 1)}</b> m
                <span className="text-xs text-stone-500 ml-2">（{scheme.floorsAbove}F × {a.floorHeight}m，方案「{scheme.name}」）</span></div>
              <CheckLine name="一般削線" formula={`3.6 × (最寬路 ${project.site.roadWidth} + ${project.site.setback})`} limit={hc.gen} ok={hc.okGen} />
              <CheckLine name="都更削線" formula={`5 × (${project.site.roadWidth}/2 + ${project.site.setback})`} limit={hc.ur} ok={hc.okUr} />
              <CheckLine name="民航局航高" formula={hc.avi ? '頁1 填入值' : '頁1 未填，不檢核'} limit={hc.avi || null} ok={hc.okAvi} />
            </Card>
            <Card title="車位檢核" icon={LuCar}>
              <table className="w-full"><tbody>
                <Row label="法定汽車位" formula={`樓地板 ÷ ${a.carDivisor}`} value={fmt(ar.legalCars, 1)} unit="輛" />
                <Row label="自設汽車位" value={fmt(+a.selfCars || 0)} unit="輛" />
                <Row label="汽車位合計" strong value={fmt(ar.cars, 1)} unit="輛" />
                <Row label="機車位合計" formula={`樓地板 ÷ ${a.motorDivisor} + 獎勵`} value={fmt(ar.motors, 1)} unit="輛" />
                <Row label="車位所需坪數" tip="汽車 12 坪/位 + 機車 1.9 坪/位（粗估）" value={fmt(ar.cars * 12 + ar.motors * 1.9, 1)} unit="坪" />
                <Row label="地下室坪數" value={fmt(ar.basement * P, 1)} unit="坪" />
                <Row label="地下室餘裕" strong tip="地下室坪 − 車位所需坪；負值代表地下室不夠停" value={<span className={ar.basement * P - (ar.cars * 12 + ar.motors * 1.9) >= 0 ? 'text-emerald-700' : 'text-red-600'}>{fmt(ar.basement * P - (ar.cars * 12 + ar.motors * 1.9), 1)}</span>} unit="坪" />
                <Row label="仍可增建汽車位" tip="地下室餘裕 ÷ 12 坪／位" value={<span className={ar.basement * P - (ar.cars * 12 + ar.motors * 1.9) >= 0 ? 'text-emerald-700' : 'text-red-600'}>{fmt((ar.basement * P - (ar.cars * 12 + ar.motors * 1.9)) / 12, 2)}</span>} unit="位" />
              </tbody></table>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

function CheckLine({ name, formula, limit, ok }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-oat-100 last:border-0">
      <div>
        <div className="text-sm font-medium">{name}</div>
        <div className="text-xs text-stone-500">{formula}{limit ? ` = ${fmt(limit, 1)} m` : ''}</div>
      </div>
      <Badge ok={ok}>{ok === null ? '未檢核' : ok ? '符合' : '超標'}</Badge>
    </div>
  );
}

function RuleAlerts({ project, ar }) {
  const s = project.site;
  const w = +s.roadWidth || 0;
  const plus = project.lots.some((l) => /之[一二]/.test(l.zone || ''));
  const items = [];
  if (plus) items.push({ ok: null, t: '容積率加級分區（住二之一、住三之一等）', d: '臨接道路面寬 16 公尺以下者，容積率回歸原分區（例：住三之一 300% → 住三 225%）。請確認基地臨接合格道路的面寬是否超過 16 公尺，否則頁2容積率要改用原分區。' });
  if (ar.tdr > 0) items.push({ ok: w >= 8, t: `容積移轉 ${(ar.tdr * 100).toFixed(0)}%：最寬道路 ${w} m`, d: w >= 8 ? '已達 8 公尺；另需符合捷運站 800m 或大型公園 500m 等區位條件、基地面積超過 1,000㎡。' : '捷運站周邊接受基地須面臨 8 公尺以上已開闢計畫道路，目前路寬不足，容移可能無法申請。' });
  if (w > 0 && w < 8) items.push({ ok: false, t: `最寬道路僅 ${w} m`, d: '臨 8 公尺以下道路須退縮，且高度削線較嚴，請留意樓層數與容積是否蓋得完。' });
  if (!items.length) return null;
  return (
    <Card title="法規提醒（依路寬與分區自動檢核）" icon={LuTriangleAlert}>
      <div className="space-y-2">
        {items.map((x) => (
          <div key={x.t} className={`rounded-md border px-3 py-2 ${x.ok === null ? 'border-amber-200 bg-amber-50' : x.ok ? 'border-emerald-200 bg-emerald-50' : 'border-red-200 bg-red-50'}`}>
            <div className="text-sm font-semibold">{x.ok === null ? '⚠ ' : x.ok ? '✓ ' : '✗ '}{x.t}</div>
            <div className="text-xs text-stone-600 mt-0.5">{x.d}</div>
          </div>
        ))}
      </div>
    </Card>
  );
}

function BonusCap({ project, ar, up }) {
  const a = project.area;
  const fromB = buildingRows(project.site).reduce((s, b) => s + (+b.area || 0), 0);
  const orig = +a.origVolOverride > 0 ? +a.origVolOverride : fromB;
  const base = ar.baseVol;
  const dis = +a.disaster || 0;
  const planned = base * (1 + ar.bonusNonTdr - dis);
  const ur = [
    { k: '基準容積 × 1.5', v: base * 1.5 },
    { k: '原建築容積 ＋ 基準容積 × 0.3', v: orig + base * 0.3, need: true },
    { k: '原建築容積 × 1.2', v: orig * 1.2, need: true, tip: '依公司原 Excel 設定' },
  ];
  const dl = [
    { k: '基準容積 × 1.3', v: base * 1.3 },
    { k: '原建築容積 × 1.15', v: orig * 1.15, need: true },
  ];
  const best = (arr) => arr.reduce((m, x) => (x.v > m.v ? x : m), arr[0]);
  const urB = best(ur), dlB = best(dl);
  const apply = (cap) => up((p) => {
    const r = base ? cap / base - 1 - (+p.area.otherBonus || 0) : 0;
    p.area.urBonus = Math.max(0, +r.toFixed(4));
  });
  const Tbl = ({ rows, b, title, onApply }) => (
    <div>
      <div className="text-sm font-semibold text-navy-800 mb-1">{title}</div>
      <table className="w-full text-sm">
        <tbody>
          {rows.map((x) => (
            <tr key={x.k} className={`border-b border-oat-100 ${x === b ? 'bg-emerald-50 font-semibold' : ''}`}>
              <td className="py-1">{x === b ? '★ ' : ''}{x.k}<Tip text={x.tip} /></td>
              <td className="text-right tabular-nums">{x.need && !orig ? <span className="text-xs text-stone-400">需原容</span> : `${fmt(x.v, 0)} ㎡`}</td>
              <td className="text-right text-xs text-stone-500 w-24">{base ? `獎勵 ${pct(x.v / base - 1, 1)}` : ''}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <Btn small className="mt-2" onClick={onApply}>套用擇優上限（{base ? pct(b.v / base - 1, 2) : '—'}）到獎勵%</Btn>
    </div>
  );
  return (
    <Card title="容積獎勵上限擇優（原容 vs 基容）" icon={LuScale}
      tip={'原建築容積＝使照核准總樓地板扣除陽台等不計入部分。\n第1頁現況建物「使照樓地板(扣陽台)」會自動加總；也可在這裡直接覆寫。'}>
      <div className="grid grid-cols-3 gap-3 mb-3">
        <Field label="基準容積"><div className="rounded-md bg-oat-100 px-2 py-1 text-right text-sm">{fmt(base, 2)} ㎡</div></Field>
        <Field label={`原建築容積（第1頁加總 ${fmt(fromB, 2)}㎡）`}>
          <NumInput value={a.origVolOverride} onChange={(v) => up((p) => { p.area.origVolOverride = v; })} placeholder={fromB ? fmt(fromB, 2) : '手動輸入'} />
        </Field>
        <Field label="目前規劃（不含防災獎勵）">
          <div className={`rounded-md px-2 py-1 text-right text-sm font-semibold ${planned > Math.max(urB.v, 0) + 0.5 ? 'bg-red-50 text-red-700' : 'bg-oat-100'}`}>{fmt(planned, 0)} ㎡（{pct(ar.bonusNonTdr - dis, 2)}）</div>
        </Field>
      </div>
      <div className="grid grid-cols-2 gap-5">
        <Tbl title="都更：三者擇優" rows={ur} b={urB} onApply={() => apply(urB.v)} />
        <Tbl title="危老：二者擇優（時程、規模獎勵另計）" rows={dl} b={dlB} onApply={() => apply(dlB.v)} />
      </div>
      {planned > urB.v + 0.5 && <div className="mt-3 text-xs text-red-600">⚠ 目前獎勵 % 已超過都更擇優上限，建議按「套用擇優上限」。</div>}
      {dis > 0 && <div className={`mt-2 text-xs ${1 + ar.bonusNonTdr <= 2 ? 'text-emerald-700' : 'text-red-600'}`}>防災獎勵 {pct(dis, 0)} 另計（臺北市防災型都更），含防災後總容積 {(1 + ar.bonusNonTdr).toFixed(2)} 倍基準，上限 2 倍{1 + ar.bonusNonTdr <= 2 ? '，符合。' : '，已超過！'}</div>}
    </Card>
  );
}
