import React from 'react';
import { LuHandshake, LuGift, LuWallet, LuReceipt, LuPlus, LuTrash2, LuChartBar, LuTarget, LuPrinter } from 'react-icons/lu';
import { Card, NumField, NumInput, TextInput, Select, Btn, Field, fmt, pct, Light, Tip } from '../ui.jsx';
import { doPrint } from '../ui.jsx';
import { STRUCT_LABEL } from '../costTable.js';
import { uid } from '../defaults.js';
import { computeAll } from '../calc.js';

export default function Page5({ project, scheme: s, upScheme, res }) {
  const { inv, ar, cad, sw, fe } = res;
  const set = (k) => (v) => upScheme((x) => { x[k] = v; });
  const setIn = (o, k) => (v) => upScheme((x) => { x[o] = x[o] || {}; x[o][k] = v; });
  const tab = (on) => `flex-1 rounded-md px-3 py-1.5 text-sm cursor-pointer ${on ? 'bg-navy-700 text-white' : 'bg-oat-100 text-navy-800 hover:bg-oat-200'}`;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-navy-800 flex items-center gap-3">合建投報儀表板
          <span className="flex items-center gap-1 text-sm font-normal text-stone-500">方案名稱<TextInput value={s.name} onChange={set('name')} className="!w-72 !text-sm font-semibold text-navy-800" /></span></h1>
        <Btn icon={LuPrinter} variant="primary" onClick={doPrint}>一頁式提報 PDF</Btn>
      </div>
      <div className="grid grid-cols-[440px_1fr] gap-5 items-start">
        {/* 左：參數 */}
        <div className="space-y-4">
          <Card title="合建比例" icon={LuHandshake}>
            <div className="flex gap-2 mb-3">
              <button className={tab(s.ratioMode === 'A')} onClick={() => set('ratioMode')('A')}>A 全案統一比例</button>
              <button className={tab(s.ratioMode === 'B')} onClick={() => set('ratioMode')('B')}>B 基準／獎勵拆算</button>
            </div>
            {s.ratioMode === 'A' ? (
              <div className="grid grid-cols-2 gap-3">
                <NumField label="建商分得（全案）" pct value={s.builderShareA} onChange={set('builderShareA')} />
                <Field label="地主分得"><div className="rounded-md bg-oat-100 px-2 py-1 text-right text-sm">{pct(1 - (+s.builderShareA || 0), 2)}</div></Field>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                <NumField label="基準容積部分：地主分得" pct value={s.baseLandowner} onChange={set('baseLandowner')} />
                <NumField label="獎勵容積部分：地主分得" pct value={s.bonusLandowner} onChange={set('bonusLandowner')} />
                <div className="col-span-2 rounded-md bg-oat-50 p-2.5 text-xs text-stone-600 leading-relaxed">
                  綜合地主 = ({pct(s.baseLandowner, 0)} × 1 + {pct(s.bonusLandowner, 0)} × {pct(ar.bonusNonTdr, 2)}) ÷ (1 + {pct(ar.bonusNonTdr, 2)})
                  = <b className="text-navy-800">{pct(inv.L, 2)}</b>，建商 <b className="text-amber-700">{pct(inv.g, 2)}</b>
                </div>
              </div>
            )}
            <div className="grid grid-cols-2 gap-3 mt-3 pt-3 border-t border-oat-100">
              <NumField label="目標投報率" pct value={s.targetROI} onChange={set('targetROI')} tip="紅線2 與甜蜜點上限的門檻，預設 20%" />
              <NumField label="新房公設比" pct value={s.newPublicRatio} onChange={set('newPublicRatio')} tip="紅線1：地主分回坪 × (1 − 公設比) 換算新房室內坪" />
            </div>
          </Card>

          <Card title="1 樓補貼坪（加給地主）" icon={LuGift} tip={'補貼坪從建商可售坪扣除，加給地主 1 樓戶。\n每列：1F 土地面積(㎡) × 0.3025 × 銷售容積率 × 地主綜合% × 補貼比例\n（同 Excel 表302 H58 寫法）'}>
            <div className="text-xs text-stone-600 bg-amber-50 border border-amber-200 rounded-md px-2.5 py-1.5 mb-3">
              清冊預估 1F 總土地面積 <b>{fmt(cad.f1Area, 2)} ㎡</b>・已分配 <b>{fmt((s.subsidyRows || []).reduce((a, r) => a + (+r.areaM2 || 0), 0), 2)} ㎡</b>・銷售容積率 {ar.salesFar.toFixed(3)}・地主 {pct(inv.L, 2)}
            </div>
            <table className="w-full text-sm">
              <thead><tr className="text-xs text-stone-500"><th className="text-left font-normal">類別</th><th className="font-normal text-right">1F 土地㎡</th><th className="font-normal text-right">補貼%</th><th className="font-normal text-right">補貼坪</th><th /></tr></thead>
              <tbody>
                {(s.subsidyRows || []).map((r, i) => (
                  <tr key={r.id || i}>
                    <td className="pr-1 py-0.5"><TextInput value={r.name} onChange={(v) => upScheme((x) => { x.subsidyRows[i].name = v; })} /></td>
                    <td className="px-0.5 w-24"><NumInput value={r.areaM2} onChange={(v) => upScheme((x) => { x.subsidyRows[i].areaM2 = v; })} /></td>
                    <td className="px-0.5 w-16"><NumInput pct value={r.ratio} onChange={(v) => upScheme((x) => { x.subsidyRows[i].ratio = v; })} /></td>
                    <td className="text-right tabular-nums w-20">{fmt((+r.areaM2 || 0) * 0.3025 * ar.salesFar * inv.L * (+r.ratio || 0), 2)}</td>
                    <td className="w-6 text-center"><button className="text-stone-400 hover:text-red-600 cursor-pointer" onClick={() => upScheme((x) => { x.subsidyRows.splice(i, 1); })}><LuTrash2 className="w-3.5 h-3.5" /></button></td>
                  </tr>
                ))}
              </tbody>
            </table>
            <Btn small className="mt-2" icon={LuPlus} onClick={() => upScheme((x) => { x.subsidyRows = x.subsidyRows || []; x.subsidyRows.push({ id: uid(), name: '新類別 1F', areaM2: '', ratio: 0.1 }); })}>新增補貼類別</Btn>
            {inv.subs[0]?.quick && (
              <div className="mt-3 rounded-md border border-dashed border-oat-300 p-2.5">
                <div className="text-xs text-stone-600 mb-2">尚未填各類 1F 面積，暫以粗估計算：基地坪 ÷ 原樓層數 × 銷售容積率 × 地主% × 補貼比例</div>
                <div className="grid grid-cols-2 gap-3">
                  <NumField label="原樓層數" unit="層" value={s.quick?.origFloors} onChange={setIn('quick', 'origFloors')} />
                  <NumField label="粗估補貼比例" pct value={s.quick?.ratio} onChange={setIn('quick', 'ratio')} />
                </div>
              </div>
            )}
            <div className="mt-3 flex justify-between rounded-md bg-navy-700/5 px-3 py-2 text-sm"><span>1F 補貼坪合計</span><b className="tabular-nums">{fmt(inv.subsidy, 2)} 坪</b></div>
          </Card>

          <Card title="財務與銷售設定" icon={LuWallet}>
            <div className="grid grid-cols-2 gap-3">
              <Field label="構造"><Select value={s.structure} onChange={set('structure')} options={Object.entries(STRUCT_LABEL).map(([value, label]) => ({ value, label }))} /></Field>
              <Field label="地下層（頁3 共用）"><div className="rounded-md bg-oat-100 px-2 py-1 text-right text-sm">B{project.area.basementFloors}</div></Field>
              <NumField label="地上層數" unit="F" value={s.floorsAbove} onChange={set('floorsAbove')} />
              <NumField label="營建造價" unit="萬/坪" value={s.constructionPrice} onChange={set('constructionPrice')} />
              <NumField label="工期" unit="天" value={s.durationDays} onChange={set('durationDays')} />
              <Field label="換算"><div className="rounded-md bg-oat-100 px-2 py-1 text-right text-sm">{fmt(s.durationDays / 30, 1)} 月／{inv.years.toFixed(2)} 年</div></Field>
              <NumField label="土地融資比率" pct value={s.landLoan} onChange={set('landLoan')} tip="影響自有資金" />
              <NumField label="營建融資比率" pct value={s.constLoan} onChange={set('constLoan')} />
              <NumField label="銀行利率" pct value={s.rate} onChange={set('rate')} />
              <NumField label="土地款計息比例" pct value={s.landCarry} onChange={set('landCarry')} tip="土地款利息 = 土地成本 × 此比例 × 利率 × (工期年+0.5)" />
              <NumField label="工程款平均動用比例" pct value={s.constInterestFactor ?? 1} onChange={set('constInterestFactor')} tip={'工程款利息 = 建築工程 × 營建融資比 × 利率 × 工期 × 此比例\n工程款分期撥款、平均只用一半時填 50%'} />
              <NumField label="保證金" unit="萬" value={s.deposit} onChange={set('deposit')} />
              <Field label="車位分回規則" tip="建商分得車位數 = 總車位 × 建商綜合比（或 × 建商基準比）">
                <Select value={s.carRule} onChange={set('carRule')} options={[{ value: 'combined', label: '依綜合比' }, { value: 'base', label: '依基準比' }]} />
              </Field>
              <NumField label="單價二（基準單價）" unit="萬/坪" value={s.price2} onChange={set('price2')} />
              <NumField label="單價級距 ±" unit="萬" value={s.priceStep} onChange={set('priceStep')} />
              <NumField label="平面車位單價" unit="萬/個" value={s.carPrice} onChange={set('carPrice')} />
              <NumField label="車位單價級距 ±" unit="萬" value={s.carPriceStep ?? 0} onChange={set('carPriceStep')} tip="單價一／三的車位價 = 車位單價 ∓ 級距（例：280／300／320）" />
              <NumField label="機械車位數" unit="個" value={s.mechCars} onChange={set('mechCars')} />
              <NumField label="機械車位單價" unit="萬/個" value={s.mechPrice} onChange={set('mechPrice')} />
            </div>
          </Card>

          <Card title="成本明細設定" icon={LuReceipt}>
            <Section title="土地／容積移轉成本" tip={'容移試算（頁3 容移% > 0 才有金額）\n自購道路地 = 移入容積㎡ × 平均公告現值 × 道路地成本倍數 × 自購比例\n容積代金 = (單價二 × 估價降比 − 營建造價) × 建築係數 × 移入容積坪 × 代金比例'}>
              <div className="grid grid-cols-2 gap-3">
                <NumField label="自購道路地比例" pct value={s.tdrCfg?.selfShare} onChange={setIn('tdrCfg', 'selfShare')} tip="其餘以容積代金繳納" />
                <NumField label="道路地成本（公告現值倍）" pct value={s.tdrCfg?.roadCostRatio} onChange={setIn('tdrCfg', 'roadCostRatio')} />
                <NumField label="估價降比" pct value={s.tdrCfg?.appraisalRatio} onChange={setIn('tdrCfg', 'appraisalRatio')} />
                <NumField label="容移回饋地主（10～30%）" pct value={s.tdrCfg?.feedback} onChange={setIn('tdrCfg', 'feedback')} tip={'容移由建商出資購買：地主依比例應得的容移坪由建商扣回，\n再把「容移總銷坪 × 回饋%」回饋給地主（車位同理）。'} />
                <NumField label="土地買賣成本" unit="萬" value={s.landPurchase} onChange={set('landPurchase')} />
                <div className="text-xs text-stone-600 self-end pb-1">移入 {fmt(ar.tdrVol * 0.3025, 1)} 坪：道路地 {fmt(inv.tdrRoad)} 萬＋代金 {fmt(inv.tdrFee)} 萬</div>
              </div>
              <TdrEffect project={project} s={s} ar={ar} inv={inv} />
            </Section>
            <Section title="單價型費用">
              <div className="grid grid-cols-3 gap-3">
                <NumField label="土地佣金" unit="萬/坪" value={s.commission} onChange={set('commission')} />
                <NumField label="都更費用" unit="萬/坪" value={s.urFeePerPing} onChange={set('urFeePerPing')} />
                <NumField label="信託費用" unit="萬/坪" value={s.trustPerPing} onChange={set('trustPerPing')} />
              </div>
            </Section>
            <Section title="補貼費用" tip="全部以「元」輸入，彙總後換算為萬元">
              <div className="text-xs font-medium text-navy-800 mb-1">拆遷增建</div>
              <div className="grid grid-cols-4 gap-2 mb-3">
                <NumField label="棟／戶" value={s.demolition?.households} onChange={setIn('demolition', 'households')} />
                <NumField label="坪數" value={s.demolition?.ping} onChange={setIn('demolition', 'ping')} />
                <NumField label="元/坪" value={s.demolition?.unit} onChange={setIn('demolition', 'unit')} />
                <NumField label="次數" value={s.demolition?.times} onChange={setIn('demolition', 'times')} />
              </div>
              <div className="text-xs font-medium text-navy-800 mb-1">租金補貼</div>
              <table className="w-full text-xs mb-1">
                <thead><tr className="text-stone-500"><th className="text-left font-normal">類別</th><th className="font-normal">戶數</th><th className="font-normal">元/坪/月</th><th className="font-normal">坪數</th><th className="font-normal">月數</th><th /></tr></thead>
                <tbody>
                  {(s.rentRows || []).map((r, i) => (
                    <tr key={r.id}>
                      <td className="pr-1 py-0.5"><TextInput value={r.name} onChange={(v) => upScheme((x) => { x.rentRows[i].name = v; })} className="!text-xs" /></td>
                      {['households', 'unit', 'ping', 'months'].map((k) => (
                        <td key={k} className="px-0.5 w-16"><NumInput value={r[k]} onChange={(v) => upScheme((x) => { x.rentRows[i][k] = v; })} className="!text-xs" /></td>
                      ))}
                      <td><button className="text-stone-400 hover:text-red-600 cursor-pointer" onClick={() => upScheme((x) => { x.rentRows.splice(i, 1); })}><LuTrash2 className="w-3.5 h-3.5" /></button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <Btn small icon={LuPlus} onClick={() => upScheme((x) => { x.rentRows = x.rentRows || []; x.rentRows.push({ id: uid(), name: '新類別', households: 0, unit: 800, ping: 30, months: 60 }); })}>新增類別</Btn>
              <div className="text-xs font-medium text-navy-800 mb-1 mt-3">搬家補貼</div>
              <div className="grid grid-cols-3 gap-2">
                <NumField label="戶數" value={s.moving?.households} onChange={setIn('moving', 'households')} />
                <NumField label="元/戶" value={s.moving?.unit} onChange={setIn('moving', 'unit')} />
                <NumField label="次數" value={s.moving?.times} onChange={setIn('moving', 'times')} />
              </div>
              <div className="text-xs text-stone-600 mt-2 text-right">拆遷 {fmt(inv.demo / 1e4)}＋租金 {fmt(inv.rent / 1e4)}＋搬家 {fmt(inv.moving / 1e4)} ＝ <b>{fmt(inv.subsidyCost)} 萬</b></div>
            </Section>
            <Section title="其他成本（萬）">
              {(s.extraCosts || []).map((x, i) => (
                <div key={i} className="flex gap-2 mb-1.5">
                  <TextInput value={x.name} onChange={(v) => upScheme((y) => { y.extraCosts[i].name = v; })} />
                  <div className="w-32"><NumInput value={x.amt} onChange={(v) => upScheme((y) => { y.extraCosts[i].amt = v; })} /></div>
                  <button className="text-stone-400 hover:text-red-600 cursor-pointer" onClick={() => upScheme((y) => { y.extraCosts.splice(i, 1); })}><LuTrash2 className="w-4 h-4" /></button>
                </div>
              ))}
              <Btn small icon={LuPlus} onClick={() => upScheme((y) => { y.extraCosts = y.extraCosts || []; y.extraCosts.push({ name: '其他費用', amt: 0 }); })}>新增成本細項</Btn>
            </Section>
            <Section title="銷售與管理" last>
              <div className="grid grid-cols-3 gap-3">
                <NumField label="銷售費率" pct value={s.salesFeeRate} onChange={set('salesFeeRate')} tip="× 建方總銷售金額(S)" />
                <NumField label="管理費率" pct value={s.mgmtRate} onChange={set('mgmtRate')} tip="× 建築工程" />
                <NumField label="營業加值稅" unit="萬" value={s.vat} onChange={set('vat')} tip="選填（物交營業稅）" />
              </div>
            </Section>
          </Card>
        </div>

        {/* 右：結果 */}
        <div className="space-y-4 sticky top-[112px]">
          <RedLines inv={inv} sw={sw} cad={cad} s={s} />
          <Card title="面積分配" icon={LuTarget}>
            <div className="grid grid-cols-4 gap-3 text-center">
              <Big label="總銷坪" v={fmt(ar.salesPing, 1)} u="坪" />
              <Big label="地主分回（含補貼）" v={fmt(inv.landownerPing, 1)} u="坪" />
              <Big label="建商可售" v={fmt(inv.builderPing, 1)} u="坪" accent />
              <Big label="建商車位" v={fmt(inv.builderCars, 1)} u={`／${fmt(ar.cars, 1)} 個`} />
            </div>
            <div className="mt-3 h-3 rounded-full bg-amber-400 overflow-hidden flex">
              <div className="bg-navy-700 h-full" style={{ width: `${Math.max(0, Math.min(100, (inv.landownerPing / ar.salesPing) * 100))}%` }} />
            </div>
            <div className="flex justify-between text-[11px] text-stone-500 mt-1"><span>地主實得 {pct(inv.landownerPing / ar.salesPing, 1)}（含 1F 補貼 {fmt(inv.subsidy, 1)} 坪）</span><span>建商實得 {pct(inv.builderPing / ar.salesPing, 1)}</span></div>
          </Card>

          <Card title="投報輸出（單價一／二／三）" icon={LuChartBar}>
            <TierTable inv={inv} target={sw.target} />
          </Card>

          <Card title="投資成本 小計(A)">
            <table className="w-full text-sm">
              <tbody>
                {inv.lines.map((l) => (
                  <tr key={l.key} className="border-b border-oat-100"><td className="py-1">{l.name}</td><td className="text-right tabular-nums">{fmt(l.amt, 0)}</td><td className="text-xs text-stone-500 pl-1 w-6">萬</td><td className="text-right text-xs text-stone-400 w-14">{pct(l.amt / inv.A, 1)}</td></tr>
                ))}
                <tr className="font-bold bg-oat-50 text-navy-800"><td className="py-1.5">小計 (A)</td><td className="text-right tabular-nums">{fmt(inv.A, 0)}</td><td className="text-xs pl-1">萬</td><td /></tr>
              </tbody>
            </table>
          </Card>
        </div>
      </div>
    </div>
  );
}

function Section({ title, tip, children, last }) {
  return (
    <div className={`${last ? '' : 'pb-4 mb-4 border-b border-oat-100'}`}>
      <div className="text-sm font-semibold text-navy-800 mb-2 flex items-center">{title}<Tip text={tip} wide /></div>
      {children}
    </div>
  );
}

function Big({ label, v, u, accent }) {
  return (
    <div className="rounded-lg bg-oat-50 py-2">
      <div className="text-[11px] text-stone-500">{label}</div>
      <div className={`text-xl font-bold tabular-nums ${accent ? 'text-amber-700' : 'text-navy-800'}`}>{v}</div>
      <div className="text-[11px] text-stone-500">{u}</div>
    </div>
  );
}

export function RedLines({ inv, sw, cad, s, compact }) {
  const ok1 = inv.swap >= 1, ok2 = inv.roi2 >= sw.target;
  const box = (ok) => `rounded-xl border-2 ${compact ? 'p-2' : 'p-3'} ${ok ? 'border-emerald-300 bg-emerald-50' : 'border-red-300 bg-red-50'}`;
  return (
    <div className="grid grid-cols-3 gap-3">
      <div className={box(ok1)}>
        <div className="flex items-center gap-2 text-xs font-semibold text-stone-700"><Light ok={ok1} />紅線1 室內一坪換一坪</div>
        <div className={`${compact ? 'text-xl' : 'text-2xl'} font-bold mt-1 ${ok1 ? 'text-emerald-700' : 'text-red-600'}`}>1 換 {inv.swap ? inv.swap.toFixed(2) : '—'} 坪</div>
        <div className="text-[11px] text-stone-600 mt-0.5">{fmt(inv.landownerPing, 0)}×{pct(1 - s.newPublicRatio, 0)}＝{fmt(inv.landownerIndoor, 0)} ÷ 舊室內 {fmt(cad.oldIndoor, 0)} 坪</div>
      </div>
      <div className={box(ok2)}>
        <div className="flex items-center gap-2 text-xs font-semibold text-stone-700"><Light ok={ok2} />紅線2 單價二投報率</div>
        <div className={`${compact ? 'text-xl' : 'text-2xl'} font-bold mt-1 ${ok2 ? 'text-emerald-700' : 'text-red-600'}`}>{pct(inv.roi2, 2)}</div>
        <div className="text-[11px] text-stone-600 mt-0.5">單價二 {s.price2} 萬/坪・目標 ≥ {pct(sw.target, 0)}</div>
      </div>
      <div className={box(sw.ok)}>
        <div className="flex items-center gap-2 text-xs font-semibold text-stone-700"><Light ok={sw.ok} />談判甜蜜點（地主%）</div>
        <div className={`${compact ? 'text-xl' : 'text-2xl'} font-bold mt-1 ${sw.ok ? 'text-navy-800' : 'text-red-600'}`}>
          {sw.ok ? `${pct(sw.floor, 1)}～${pct(sw.ceil, 1)}` : '本案無交集'}
        </div>
        <div className="text-[11px] text-stone-600 mt-0.5">
          底線 {sw.floor === null ? '無解' : pct(sw.floor, 1)}（一坪換一坪）・上限 {sw.ceil === null ? '無解' : pct(sw.ceil, 1)}（投報守住）・目前 {pct(inv.L, 1)}
        </div>
      </div>
    </div>
  );
}

export function TierTable({ inv, small, target = 0.2 }) {
  const rows = [
    ['建方總銷售金額 (S)', (t) => fmt(t.S), '萬'],
    ['全案總銷售金額', (t) => fmt(t.whole), '萬'],
    ['銷售毛利 (S−A)', (t) => fmt(t.gross), '萬'],
    ['銷售毛利率', (t) => pct(t.grossRate, 2), ''],
    ['銷售費＋管理費＋營業稅', (t) => fmt(t.salesFee + t.mgmt + t.vat), '萬'],
    ['總成本 (C)', (t) => fmt(t.C), '萬', true],
    ['損益 (R = S−C)', (t) => fmt(t.R), '萬', true],
    ['投資報酬率 (R/C)', (t) => pct(t.roi, 2), '', true, true],
    ['自有資金 (C−融資)', (t) => fmt(t.equity), '萬'],
    ['自有資金報酬率', (t) => pct(t.eqRoi, 2), ''],
  ];
  return (
    <table className={`w-full ${small ? 'text-[11px]' : 'text-sm'}`}>
      <thead>
        <tr className="border-b-2 border-oat-200">
          <th className="text-left py-1.5 font-medium text-stone-500 text-xs">項目</th>
          {inv.tiers.map((t, i) => (
            <th key={i} className={`text-right py-1.5 px-2 ${i === 1 ? 'bg-navy-700/5 text-navy-800' : 'text-stone-600'}`}>
              單價{['一', '二', '三'][i]}<div className="text-xs font-normal">{t.p} 萬/坪</div>
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map(([label, f, u, strong, roi]) => (
          <tr key={label} className={`border-b border-oat-100 ${strong ? 'font-semibold' : ''}`}>
            <td className={`${small ? 'py-0.5' : 'py-1.5'} text-stone-700`}>{label}{u && <span className="text-[10px] text-stone-400 ml-1">({u})</span>}</td>
            {inv.tiers.map((t, i) => (
              <td key={i} className={`text-right tabular-nums px-2 ${i === 1 ? 'bg-navy-700/5' : ''} ${roi ? (t.roi >= target ? 'text-emerald-700' : 'text-red-600') : ''}`}>{f(t)}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function TdrEffect({ project, s, ar, inv }) {
  if (!(ar.tdr > 0)) return <div className="mt-2 text-xs text-stone-500">第 3 頁容積移轉 % 填入後，這裡會比較「買容移／不買」的差別。</div>;
  const base = computeAll({ ...project, area: { ...project.area, tdr: 0 } }, s).inv;
  const t1 = inv.tiers[1], t0 = base.tiers[1];
  const tdrPing = ar.tdrVol * 0.3025;
  const row = (k, a, b, u = '萬', d = 0) => (
    <tr className="border-b border-oat-100"><td className="py-1">{k}</td><td className="text-right tabular-nums">{a}</td><td className="text-right tabular-nums">{b}</td>
      <td className={`text-right tabular-nums ${typeof d === 'number' ? (d >= 0 ? 'text-emerald-700' : 'text-red-600') : ''}`}>{typeof d === 'number' ? (d >= 0 ? '+' : '') + fmt(d, u === '%' ? 2 : 0) + (u === '%' ? '%' : '') : d}</td></tr>
  );
  return (
    <div className="mt-3 rounded-md border border-oat-200 bg-oat-50 p-2.5">
      <div className="text-xs font-semibold text-navy-800 mb-1">容移分配與效益（單價二）</div>
      <div className="text-xs text-stone-600 mb-2 leading-relaxed">
        容移總銷坪 <b>{fmt(inv.tdrTotal, 1)}</b> 坪：地主應得 {fmt(inv.tdrLandowner, 1)} 坪由建商扣回，回饋地主 <b>{fmt(inv.tdrFeedback, 1)}</b> 坪；
        容移成本每移入坪 {fmt(tdrPing ? inv.landCost / tdrPing : 0, 1)} 萬、每銷售坪 {fmt(inv.tdrTotal ? inv.landCost / inv.tdrTotal : 0, 1)} 萬。
      </div>
      <table className="w-full text-xs">
        <thead><tr className="text-stone-500"><th className="text-left font-normal">項目</th><th className="text-right font-normal">不買容移</th><th className="text-right font-normal">買容移</th><th className="text-right font-normal">差額</th></tr></thead>
        <tbody>
          {row('建商可售坪', fmt(base.builderPing, 0), fmt(inv.builderPing, 0), '坪', inv.builderPing - base.builderPing)}
          {row('地主分回坪', fmt(base.landownerPing, 0), fmt(inv.landownerPing, 0), '坪', inv.landownerPing - base.landownerPing)}
          {row('總成本 (C)', fmt(t0.C), fmt(t1.C), '萬', t1.C - t0.C)}
          {row('損益 (R)', fmt(t0.R), fmt(t1.R), '萬', t1.R - t0.R)}
          {row('投報率', pct(t0.roi, 2), pct(t1.roi, 2), '%', (t1.roi - t0.roi) * 100)}
        </tbody>
      </table>
      <div className={`mt-1.5 text-xs font-semibold ${t1.R >= t0.R ? 'text-emerald-700' : 'text-red-600'}`}>
        {t1.R >= t0.R ? `✓ 買容移讓損益增加 ${fmt(t1.R - t0.R)} 萬` : `✗ 買容移反而少賺 ${fmt(t0.R - t1.R)} 萬（成本高於增加的銷售）`}
        {t1.roi < t0.roi && t1.R >= t0.R ? '，但投資額變大，投報率下降' : ''}
      </div>
    </div>
  );
}
