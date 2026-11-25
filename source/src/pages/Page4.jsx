import React, { useState } from 'react';
import { LuTable, LuCalculator, LuPlus, LuTrash2, LuCopy } from 'react-icons/lu';
import { Card, NumInput, NumField, TextInput, Select, Btn, Row, fmt, Field, Tip, ask } from '../ui.jsx';
import { STRUCT_LABEL } from '../costTable.js';
import { uid } from '../defaults.js';

export default function Page4({ project, scheme, up, upScheme, res }) {
  const { fe, ar } = res;
  const [viewId, setViewId] = useState(scheme.costTableId || project.costTables[0]?.id);
  const tIdx = Math.max(0, project.costTables.findIndex((t) => t.id === viewId));
  const table = project.costTables[tIdx];

  const copyTable = () => up((p) => {
    const t = { ...structuredClone(table), id: uid(), name: table.name + '（自訂）' };
    p.costTables.push(t);
    setViewId(t.id);
  });
  const delTable = async () => {
    if (project.costTables.length <= 1) return;
    if (!(await ask(`刪除造價表版本「${table.name}」？`))) return;
    up((p) => {
      p.costTables.splice(tIdx, 1);
      p.schemes.forEach((s) => { if (s.costTableId === table.id) s.costTableId = p.costTables[0].id; });
    });
    setViewId(project.costTables.find((t) => t.id !== table.id)?.id);
  };
  const archBr = [[300, 0.08, '300萬以下'], [1500, 0.075, '300萬～1,500萬'], [6000, 0.0725, '1,500萬～6,000萬'], [Infinity, 0.07, '6,000萬以上']];
  const fundBr = [[1000, 0.02, '1,000萬以下', '20‰'], [10000, 0.015, '1,000萬～1億', '15‰'], [100000, 0.005, '1億～10億', '5‰'], [Infinity, 0.003, '10億以上', '3‰']];
  const tierRows = (br, total) => {
    let prev = 0;
    return br.map(([cap, r, label, rl]) => {
      const base = Math.max(0, Math.min(total, cap) - prev);
      prev = cap;
      return { label, r, rl, base, fee: base * r };
    });
  };
  const items = scheme.design?.items || [];

  return (
    <div className="space-y-5">
      <h1 className="text-xl font-bold text-navy-800">法定造價表與費用細算 <span className="text-sm font-normal text-stone-500">（方案：{scheme.name}）</span></h1>

      <div className="grid grid-cols-[1fr_1fr] gap-5 items-start">
        <Card title="臺北市建築物工程造價標準表" icon={LuTable}
          tip="依構造與地上層數自動查表。可複製成自訂版本後修改單價；方案使用的版本在右側選擇。"
          right={<div className="flex gap-1"><Btn small icon={LuCopy} onClick={copyTable}>複製為新版本</Btn><Btn small variant="danger" icon={LuTrash2} onClick={delTable} /></div>}>
          <div className="flex gap-2 mb-3">
            <Select value={table.id} onChange={setViewId} options={project.costTables.map((t) => ({ value: t.id, label: t.name }))} />
          </div>
          <Field label="版本名稱" className="mb-3"><TextInput value={table.name} onChange={(v) => up((p) => { p.costTables[tIdx].name = v; })} /></Field>
          <div className="max-h-[520px] overflow-y-auto border border-oat-200 rounded-md">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-oat-50"><tr className="text-xs text-stone-500"><th className="text-left px-2 py-1.5">構造</th><th className="text-left px-2">樓層級距</th><th className="text-right px-2">元/㎡</th><th /></tr></thead>
              <tbody>
                {table.rows.map((r, i) => {
                  const hit = table.id === (scheme.costTableId || project.costTables[0].id) && r.struct === scheme.structure && scheme.floorsAbove >= r.min && scheme.floorsAbove <= r.max;
                  return (
                    <tr key={i} className={`border-t border-oat-100 ${hit ? 'bg-amber-100' : ''}`}>
                      <td className="px-2 py-1 w-28">
                        <Select value={r.struct} onChange={(v) => up((p) => { p.costTables[tIdx].rows[i].struct = v; })} options={Object.keys(STRUCT_LABEL)} />
                      </td>
                      <td className="px-2 py-1">
                        <div className="flex items-center gap-1 w-36">
                          <NumInput value={r.min} onChange={(v) => up((p) => { p.costTables[tIdx].rows[i].min = v; })} />
                          <span>~</span>
                          <NumInput value={r.max} onChange={(v) => up((p) => { p.costTables[tIdx].rows[i].max = v; })} />
                          <span className="text-xs">F</span>
                        </div>
                      </td>
                      <td className="px-2 py-1 w-28"><NumInput value={r.price} onChange={(v) => up((p) => { p.costTables[tIdx].rows[i].price = v; })} /></td>
                      <td className="w-8 text-center"><button className="text-stone-400 hover:text-red-600 cursor-pointer" onClick={() => up((p) => { p.costTables[tIdx].rows.splice(i, 1); })}><LuTrash2 className="w-3.5 h-3.5" /></button></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <Btn small className="mt-2" icon={LuPlus} onClick={() => up((p) => { p.costTables[tIdx].rows.push({ struct: 'RC', min: 1, max: 5, price: 0 }); })}>新增級距</Btn>
          <p className="text-[11px] text-stone-500 mt-2">999 代表「以上」。黃底＝目前方案查到的單價。</p>
        </Card>

        <div className="space-y-5">
          <Card title="法定造價總額" icon={LuCalculator}>
            <div className="grid grid-cols-4 gap-3 mb-4">
              <Field label="構造"><Select value={scheme.structure} onChange={(v) => upScheme((s) => { s.structure = v; })} options={Object.entries(STRUCT_LABEL).map(([value, label]) => ({ value, label }))} /></Field>
              <NumField label="地上層數" unit="F" value={scheme.floorsAbove} onChange={(v) => upScheme((s) => { s.floorsAbove = v; })} />
              <Field label="造價表版本" className="col-span-2"><Select value={scheme.costTableId} onChange={(v) => upScheme((s) => { s.costTableId = v; })} options={project.costTables.map((t) => ({ value: t.id, label: t.name }))} /></Field>
              <NumField label="手動指定單價" unit="元/㎡" value={scheme.legalPriceOverride} onChange={(v) => upScheme((s) => { s.legalPriceOverride = v; })} placeholder="留白＝查表" className="col-span-2" />
            </div>
            <table className="w-full"><tbody>
              <Row label="法定造價單價" value={fmt(fe.unit)} unit="元/㎡" />
              <Row label="營建總樓地板" value={fmt(ar.constrM2, 2)} unit="㎡" />
              <Row label="法定造價總額" strong formula="單價 × 樓地板 ÷ 10,000" value={fmt(fe.legal, 2)} unit="萬" />
            </tbody></table>
          </Card>

          <Card title="一、建築師費（四級累進）">
            <table className="w-full text-sm">
              <thead><tr className="text-xs text-stone-500 border-b border-oat-200"><th className="text-left py-1">級距</th><th className="text-right">費率</th><th className="text-right">計費基數(萬)</th><th className="text-right">費用(萬)</th></tr></thead>
              <tbody>
                {tierRows(archBr, fe.legal).map((r) => (
                  <tr key={r.label} className="border-b border-oat-100"><td className="py-1">{r.label}</td><td className="text-right">{(r.r * 100).toFixed(2)}%</td><td className="text-right tabular-nums">{fmt(r.base, 2)}</td><td className="text-right tabular-nums">{fmt(r.fee, 2)}</td></tr>
                ))}
                <tr className="font-semibold bg-oat-50 text-navy-800"><td className="py-1.5" colSpan={3}>建築師費合計</td><td className="text-right tabular-nums">{fmt(fe.arch, 2)}</td></tr>
              </tbody>
            </table>
          </Card>

          <Card title="二、相關設計費" right={<Btn small icon={LuPlus} onClick={() => upScheme((s) => { s.design.items.push({ key: uid(), name: '自訂項目', amt: 0, on: true }); })}>新增項目</Btn>}>
            <table className="w-full text-sm">
              <tbody>
                {fe.items.filter((x) => x.auto).map((x) => (
                  <tr key={x.key} className="border-b border-oat-100"><td className="py-1.5 w-8"><input type="checkbox" checked disabled /></td><td>{x.name}</td><td className="text-right tabular-nums w-32">{fmt(x.amt, 2)}</td><td className="w-8 text-xs text-stone-500 pl-1">萬</td><td className="w-6" /></tr>
                ))}
                {items.map((x, i) => (
                  <tr key={x.key} className="border-b border-oat-100">
                    <td className="py-1"><input type="checkbox" checked={!!x.on} onChange={(e) => upScheme((s) => { s.design.items[i].on = e.target.checked; })} /></td>
                    <td className="pr-2"><TextInput value={x.name} onChange={(v) => upScheme((s) => { s.design.items[i].name = v; })} /></td>
                    <td><NumInput value={x.amt} onChange={(v) => upScheme((s) => { s.design.items[i].amt = v; })} /></td>
                    <td className="text-xs text-stone-500 pl-1">萬</td>
                    <td><button className="text-stone-400 hover:text-red-600 cursor-pointer" onClick={() => upScheme((s) => { s.design.items.splice(i, 1); })}><LuTrash2 className="w-3.5 h-3.5" /></button></td>
                  </tr>
                ))}
                <tr className="font-semibold bg-oat-50 text-navy-800"><td /><td className="py-1.5">相關設計費合計</td><td className="text-right tabular-nums">{fmt(fe.related, 2)}</td><td /><td /></tr>
                <tr className="font-bold text-navy-800"><td /><td className="py-1.5">設計費總計（建築師＋相關）→ 帶入頁5</td><td className="text-right tabular-nums">{fmt(fe.design, 2)}</td><td className="text-xs pl-1">萬</td><td /></tr>
              </tbody>
            </table>
            <p className="text-[11px] text-stone-500 mt-2">提醒：風洞試驗／環評住宅達 100m、商業達 70m 才需要；60~100m 需設中繼水箱。室外景觀、室內公設設計已含在建築師費中。</p>
          </Card>

          <Card title="三、管理基金（四級累進）" tip="公寓大廈公共基金，依法定造價總額累進計算">
            <table className="w-full text-sm">
              <thead><tr className="text-xs text-stone-500 border-b border-oat-200"><th className="text-left py-1">級距</th><th className="text-right">費率</th><th className="text-right">計費基數(萬)</th><th className="text-right">費用(萬)</th></tr></thead>
              <tbody>
                {tierRows(fundBr, fe.legal).map((r) => (
                  <tr key={r.label} className="border-b border-oat-100"><td className="py-1">{r.label}</td><td className="text-right">{r.rl}</td><td className="text-right tabular-nums">{fmt(r.base, 2)}</td><td className="text-right tabular-nums">{fmt(r.fee, 2)}</td></tr>
                ))}
                <tr className="font-semibold bg-oat-50 text-navy-800"><td className="py-1.5" colSpan={3}>管理基金合計 → 帶入頁5</td><td className="text-right tabular-nums">{fmt(fe.fund, 2)}</td></tr>
              </tbody>
            </table>
          </Card>
        </div>
      </div>
    </div>
  );
}
