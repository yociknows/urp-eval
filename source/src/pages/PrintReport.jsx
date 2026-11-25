import React from 'react';
import { fmt, pct } from '../ui.jsx';
import { IMAGE_SLOTS } from '../defaults.js';
import { AnnotatedImage } from './annot.jsx';
import { RedLines, TierTable } from './Page5.jsx';
import { STRUCT_LABEL } from '../costTable.js';
import { buildingRows } from './Page1.jsx';

export default function PrintReport({ project, scheme: s, res }) {
  const { cad, ar, inv, sw, fe, hc } = res;
  const imgs = IMAGE_SLOTS.filter((x) => project.images?.[x.key]?.imgId).slice(0, 4);
  const kv = (k, v) => (
    <div className="flex justify-between border-b border-stone-200 py-[2px]"><span className="text-stone-500">{k}</span><span className="font-medium tabular-nums text-right">{v}</span></div>
  );
  return (
    <div className="hidden print:block text-[10px] leading-snug text-stone-900 bg-white" id="print-report">
      <div className="flex items-end justify-between border-b-2 border-navy-800 pb-1.5 mb-2">
        <div>
          <div className="text-[9px] text-stone-500">個案投資效益分析表・{project.site.investType}</div>
          <div className="text-[16px] font-bold text-navy-900">{project.name}</div>
          <div className="text-stone-600">{project.site.address}　｜　面臨：{project.site.roads}</div>
        </div>
        <div className="text-right text-stone-600">
          <div>方案：<b className="text-navy-900">{s.name}</b></div>
          <div>{new Date().toLocaleDateString('zh-TW')}</div>
        </div>
      </div>

      <div className="grid grid-cols-[1.25fr_1fr] gap-3 mb-2">
        <div className={`grid ${imgs.length > 1 ? 'grid-cols-2' : 'grid-cols-1'} gap-1.5`}>
          {imgs.length === 0 && <div className="border border-dashed border-stone-300 h-40 flex items-center justify-center text-stone-400">（未上傳圖資）</div>}
          {imgs.map((x) => (
            <div key={x.key} className="border border-stone-300">
              <div className="h-[118px] overflow-hidden flex items-center justify-center bg-stone-50">
                <AnnotatedImage data={project.images[x.key]} className="w-full" imgClass="max-h-[118px] object-contain" />
              </div>
              <div className="px-1 py-[1px] text-[8.5px] bg-stone-100 truncate">{x.name}{project.images[x.key].lots ? `｜${project.images[x.key].lots}` : ''}</div>
            </div>
          ))}
        </div>
        <div>
          <div className="font-bold text-navy-900 mb-1">基地摘要</div>
          {kv('土地面積', `${fmt(cad.area, 2)} ㎡／${fmt(cad.areaPing, 2)} 坪`)}
          {kv('地號筆數／戶數', `${project.lots.filter((l) => l.lotNo).length} 筆／${cad.households} 戶`)}
          {kv('平均容積率／建蔽率', `${pct(cad.far, 2)}／${pct(project.area.bcr, 0)}`)}
          {kv('平均公告現值', `${fmt(cad.avgValue)} 元/㎡（${fmt(cad.avgValue / 0.3025 / 1e4, 1)} 萬/坪）`)}
          {kv('舊權狀／舊室內坪', `${fmt(cad.rightsPing, 1)}／${fmt(cad.oldIndoor, 1)} 坪`)}
          {kv('獎勵＋容移', `${pct(ar.bonusNonTdr, 2)} ＋ ${pct(ar.tdr, 0)}`)}
          {(() => { const bs = buildingRows(project.site); if (!bs.length) return null; const ys = bs.map((r) => +r.builtYear).filter(Boolean); const now = new Date().getFullYear() - 1911;
            return kv('現況建物', `${bs.length} 棟${bs.some((r) => r.type === '未保存登記') ? `（含未保存登記 ${bs.filter((r) => r.type === '未保存登記').length}）` : ''}${ys.length ? `・屋齡 ${now - Math.max(...ys)}～${now - Math.min(...ys)} 年` : ''}`); })()}
          {kv('道路寬／退縮', `${project.site.roadWidth} m／${project.site.setback} m`)}
          <div className="font-bold text-navy-900 mt-2 mb-1">建築規模</div>
          {kv('構造／樓層', `${STRUCT_LABEL[s.structure]} ${s.floorsAbove}F／B${project.area.basementFloors}`)}
          {kv('營建總樓地板', `${fmt(ar.constrM2, 0)} ㎡／${fmt(ar.constrPing, 1)} 坪`)}
          {kv('總銷坪／銷售容積率', `${fmt(ar.salesPing, 1)} 坪／${ar.salesFar.toFixed(2)}`)}
          {kv('汽車位', `${fmt(ar.cars, 0)} 個（建商 ${fmt(inv.builderCars, 1)}）`)}
          {kv('高度檢核', `${fmt(hc.h, 1)}m｜一般 ${hc.okGen ? '✓' : '✗'} 都更 ${hc.okUr ? '✓' : '✗'}${hc.avi ? ` 航高 ${hc.okAvi ? '✓' : '✗'}` : ''}`)}
          {kv('分配比 地主／建商', `${pct(inv.L, 2)}／${pct(inv.g, 2)}`)}
          {kv('地主分回／建商可售', `${fmt(inv.landownerPing, 1)}／${fmt(inv.builderPing, 1)} 坪（1F補貼 ${fmt(inv.subsidy, 1)}）`)}
        </div>
      </div>

      <div className="mb-2"><RedLines inv={inv} sw={sw} cad={cad} s={s} compact /></div>

      <div className="grid grid-cols-[1fr_1.35fr] gap-3">
        <div>
          <div className="font-bold text-navy-900 mb-1">投資成本（萬）</div>
          {inv.lines.filter((l) => l.amt).map((l) => kv(l.name, fmt(l.amt)))}
          <div className="flex justify-between py-[2px] font-bold bg-stone-100 px-1"><span>小計 (A)</span><span>{fmt(inv.A)}</span></div>
          <div className="text-[8.5px] text-stone-500 mt-1">營造 {s.constructionPrice} 萬/坪・工期 {s.durationDays} 天・營建融資 {pct(s.constLoan, 0)}・利率 {pct(s.rate, 2)}・法定造價 {fmt(fe.unit)} 元/㎡</div>
        </div>
        <div>
          <div className="font-bold text-navy-900 mb-1">投資報酬率分析</div>
          <TierTable inv={inv} small target={sw.target} />
        </div>
      </div>
      <div className="mt-2 pt-1 border-t border-stone-300 text-[8px] text-stone-400">本表為內部評估試算，數值依輸入假設計算，實際以建築師規劃及估價報告為準。</div>
    </div>
  );
}
