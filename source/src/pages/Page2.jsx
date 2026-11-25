import React, { useState } from 'react';
import { parseLandCloud } from '../landcloud.js';
import { LuPlus, LuTrash2, LuTable, LuBuilding2, LuSigma, LuClipboardPaste } from 'react-icons/lu';
import { Card, NumInput, TextInput, Select, Btn, NumField, Row, fmt, pct, Tip, notify } from '../ui.jsx';
import { uid } from '../defaults.js';
import { lotEff } from '../calc.js';
import { LuSplit } from 'react-icons/lu';

const COLS = [
  { k: 'lotNo', name: '地號', type: 'text', w: 'w-24' },
  { k: 'zone', name: '使用分區', type: 'text', w: 'w-32' },
  { k: 'area', name: '土地面積(㎡)', type: 'num', w: 'w-28' },
  { k: 'far', name: '容積率(%)', type: 'far', w: 'w-24', tip: '同一地號跨分區時，按「分區」拆成子列，系統依面積自動加權' },
  { k: 'bcr', name: '建蔽率(%)', type: 'pct', w: 'w-24' },
  { k: 'value', name: '公告現值(元/㎡)', type: 'num', w: 'w-32' },
  { k: 'owner', name: '權屬（公有%）', type: 'owner', w: 'w-36', tip: '公私共有時，右邊填公有持分比例（例 10.92）' },
  { k: 'floors', name: '地上樓層', type: 'num', w: 'w-20', tip: '用於估算 1 樓土地面積 = 面積 ÷ 樓層數；空地留白不計' },
  { k: 'households', name: '戶數', type: 'num', w: 'w-20' },
];

function parseCell(col, raw) {
  const t = String(raw ?? '').trim().replace(/,/g, '').replace(/%$/, '');
  if (col.type === 'text' || col.type === 'owner') return String(raw ?? '').trim();
  if (t === '' || isNaN(+t)) return '';
  if (col.type === 'pct' || col.type === 'far') return +t > 10 ? +t / 100 : +t; // 300 → 3.00；3 → 3
  return +t;
}

export default function Page2({ project, up, res }) {
  const { cad } = res;
  const ob = project.oldBuilding;

  const setCell = (i, k, v) => up((p) => { p.lots[i][k] = v; });
  const onPaste = (e, rowIdx, colIdx) => {
    const text = e.clipboardData.getData('text/plain');
    if (!text || (!text.includes('\t') && !text.includes('\n'))) return;
    e.preventDefault();
    const rows = text.replace(/\r/g, '').split('\n').filter((r) => r.trim() !== '').map((r) => r.split('\t'));
    up((p) => {
      rows.forEach((cells, ri) => {
        const idx = rowIdx + ri;
        if (!p.lots[idx]) p.lots[idx] = { id: uid(), lotNo: '', zone: '', area: '', far: '', bcr: '', value: '', owner: '私', floors: 4, households: '' };
        cells.forEach((c, ci) => {
          const col = COLS[colIdx + ci];
          if (col) p.lots[idx][col.k] = parseCell(col, c);
        });
      });
    });
  };

  return (
    <div className="space-y-5">
      <h1 className="text-xl font-bold text-navy-800">地籍清冊與現況摘要</h1>

      <LandCloudPaste project={project} up={up} />

      <Card title="地號清冊" icon={LuTable}
        tip={'可從 Excel 選取多列多欄 → 複製 → 點表格任一格 → Ctrl+V，會從該格往右下貼上。\n欄位順序：地號、分區、面積、容積率、建蔽率、公告現值、權屬、樓層、戶數'}
        right={<div className="flex items-center gap-2"><span className="text-xs text-stone-500 flex items-center gap-1"><LuClipboardPaste /> 支援 Excel 多列直接貼上</span>
          <Btn small variant="primary" icon={LuPlus} onClick={() => up((p) => { p.lots.push({ id: uid(), lotNo: '', zone: '', area: '', far: p.lots.at(-1)?.far ?? '', bcr: p.lots.at(-1)?.bcr ?? '', value: '', owner: '私', floors: 4, households: '' }); })}>新增列</Btn></div>}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b-2 border-oat-200 text-xs text-stone-500">
                <th className="py-2 w-8">#</th>
                {COLS.map((c) => <th key={c.k} className={`py-2 px-1 font-medium text-left ${c.w}`}>{c.name}<Tip text={c.tip} /></th>)}
                <th className="py-2 px-1 font-medium text-right">現值×面積占比</th>
                <th className="w-8" />
              </tr>
            </thead>
            <tbody>
              {project.lots.map((l, i) => {
                const e = lotEff(l);
                const parts = l.parts || [];
                return (
                <React.Fragment key={l.id}>
                <tr className={`border-b border-oat-100 ${parts.length ? 'bg-amber-50/40' : ''}`}>
                  <td className="text-center text-xs text-stone-400">{i + 1}</td>
                  {COLS.map((c, ci) => (
                    <td key={c.k} className="px-1 py-1" onPaste={(ev) => onPaste(ev, i, ci)}>
                      {c.type === 'text' && <TextInput value={l[c.k]} onChange={(v) => setCell(i, c.k, v)} />}
                      {c.type === 'num' && <NumInput value={l[c.k]} onChange={(v) => setCell(i, c.k, v)} />}
                      {c.type === 'pct' && (parts.length && c.k === 'bcr'
                        ? <div className="rounded-md bg-amber-100 px-2 py-1 text-right text-sm tabular-nums" title="依分區子列加權">{pct(e.bcr, 2)}</div>
                        : <NumInput pct value={l[c.k]} onChange={(v) => setCell(i, c.k, v)} />)}
                      {c.type === 'far' && (parts.length
                        ? <div className="rounded-md bg-amber-100 px-2 py-1 text-right text-sm tabular-nums font-semibold" title="依分區子列面積加權">{pct(e.far, 2)}</div>
                        : <NumInput pct value={l.far} onChange={(v) => setCell(i, 'far', v)} />)}
                      {c.type === 'owner' && (
                        <div className="flex gap-1">
                          <Select className="!w-16" value={l.owner} onChange={(v) => up((p) => { p.lots[i].owner = v; if (v === '公') p.lots[i].pubPct = 1; if (v === '私') p.lots[i].pubPct = ''; })} options={['私', '公', '公私']} />
                          {l.owner === '公私' && <NumInput pct value={l.pubPct} onChange={(v) => setCell(i, 'pubPct', v)} placeholder="公%" />}
                        </div>
                      )}
                    </td>
                  ))}
                  <td className="px-1 text-right tabular-nums text-xs text-stone-500">{cad.area ? fmt((+l.area || 0) * (+l.value || 0) / cad.area, 0) : '—'}</td>
                  <td className="text-center whitespace-nowrap">
                    <button title="同一地號跨分區：拆成分區子列" className="text-stone-400 hover:text-navy-700 cursor-pointer mr-1" onClick={() => up((p) => {
                      const L = p.lots[i];
                      L.parts = L.parts?.length ? L.parts : [{ zone: L.zone, area: L.area, far: L.far, bcr: L.bcr }];
                      L.parts.push({ zone: '', area: '', far: '', bcr: L.bcr });
                    })}><LuSplit className="w-4 h-4" /></button>
                    <button className="text-stone-400 hover:text-red-600 cursor-pointer" onClick={() => up((p) => { p.lots.splice(i, 1); })}><LuTrash2 className="w-4 h-4" /></button>
                  </td>
                </tr>
                {parts.map((pt, j) => (
                  <tr key={j} className="bg-amber-50/60 border-b border-amber-100 text-xs">
                    <td />
                    <td className="px-1 text-right text-amber-700">└ 分區{j + 1}</td>
                    <td className="px-1 py-0.5"><TextInput className="!text-xs" value={pt.zone} onChange={(v) => up((p) => { p.lots[i].parts[j].zone = v; })} placeholder="例：住三" /></td>
                    <td className="px-1"><NumInput className="!text-xs" value={pt.area} onChange={(v) => up((p) => { p.lots[i].parts[j].area = v; })} placeholder="該分區㎡" /></td>
                    <td className="px-1"><NumInput pct className="!text-xs" value={pt.far} onChange={(v) => up((p) => { p.lots[i].parts[j].far = v; })} /></td>
                    <td className="px-1"><NumInput pct className="!text-xs" value={pt.bcr} onChange={(v) => up((p) => { p.lots[i].parts[j].bcr = v; })} /></td>
                    <td colSpan={5} className="px-2 text-stone-500">
                      {j === parts.length - 1 && (() => {
                        const sum = parts.reduce((s, x) => s + (+x.area || 0), 0);
                        const diff = (+l.area || 0) - sum;
                        return Math.abs(diff) < 0.01
                          ? <span className="text-emerald-700">✓ 分區面積合計 {fmt(sum, 2)}㎡ = 地號面積</span>
                          : <span className="text-red-600">分區合計 {fmt(sum, 2)}㎡，與地號面積差 {fmt(diff, 2)}㎡</span>;
                      })()}
                    </td>
                    <td className="text-center">
                      <button className="text-stone-400 hover:text-red-600 cursor-pointer" title="刪除此分區" onClick={() => up((p) => {
                        const L = p.lots[i]; L.parts.splice(j, 1);
                        if (L.parts.length === 1) { Object.assign(L, { zone: L.parts[0].zone, far: L.parts[0].far, bcr: L.parts[0].bcr }); L.parts = []; }
                      })}><LuTrash2 className="w-3.5 h-3.5" /></button>
                    </td>
                  </tr>
                ))}
                </React.Fragment>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="bg-oat-50 font-semibold text-navy-800">
                <td />
                <td className="py-2 px-1">合計 {project.lots.filter((l) => l.lotNo).length} 筆</td>
                <td />
                <td className="px-1 text-right tabular-nums">{fmt(cad.area, 2)}</td>
                <td className="px-1 text-right tabular-nums">{pct(cad.farAuto, 2)}</td>
                <td />
                <td className="px-1 text-right tabular-nums">{fmt(cad.avgValue, 0)}</td>
                <td /><td />
                <td className="px-1 text-right tabular-nums">{fmt(cad.households)}</td>
                <td className="px-1 text-right tabular-nums">{fmt(cad.avgValue, 0)}</td>
                <td />
              </tr>
            </tfoot>
          </table>
        </div>
      </Card>

      <div className="grid grid-cols-2 gap-5">
        <Card title="原建物面積設定" icon={LuBuilding2} tip="舊室內坪數是紅線1「一坪換一坪」的分母。">
          <div className="grid grid-cols-3 gap-4">
            <NumField label="原建物總權狀" unit="坪" value={ob.rightsPing} onChange={(v) => up((p) => { p.oldBuilding.rightsPing = v; })} tip="建物登記總面積（㎡）× 0.3025" />
            <NumField label="舊建物公設比" pct value={ob.publicRatio} onChange={(v) => up((p) => { p.oldBuilding.publicRatio = v; })} tip="老公寓多為樓梯間，預設 10%" />
            <NumField label="舊室內坪（手動覆寫）" unit="坪" value={ob.indoorOverride} onChange={(v) => up((p) => { p.oldBuilding.indoorOverride = v; })} placeholder={fmt(cad.indoorAuto, 2)} tip="留白＝自動：權狀 × (1 − 公設比)" />
          </div>
          <div className="mt-4 rounded-lg bg-navy-700/5 px-4 py-3 flex items-center justify-between">
            <span className="text-sm text-navy-800">採用舊室內坪數</span>
            <span className="text-xl font-bold text-navy-800 tabular-nums">{fmt(cad.oldIndoor, 2)} <span className="text-sm font-normal">坪</span></span>
          </div>
        </Card>

        <Card title="自動彙總" icon={LuSigma}>
          <div className="mb-3 rounded-md border border-oat-200">
            <div className="px-3 py-1.5 text-xs font-semibold text-navy-800 bg-oat-50 border-b border-oat-200">分區面積統計（平均容積率來源）</div>
            <table className="w-full text-sm">
              <tbody>
                {cad.zoneStats.map((z) => (
                  <tr key={z.zone + z.far} className="border-b border-oat-100 last:border-0">
                    <td className="px-3 py-1">{z.zone}</td><td className="text-right tabular-nums">{pct(z.far, 0)}</td>
                    <td className="text-right tabular-nums">{fmt(z.area, 2)} ㎡</td><td className="text-right px-3 text-xs text-stone-500">{pct(cad.area ? z.area / cad.area : 0, 1)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <table className="w-full">
            <tbody>
              <Row label="總土地面積" value={`${fmt(cad.area, 2)} ㎡`} unit={`${fmt(cad.areaPing, 2)} 坪`} />
              <tr className="border-b border-oat-100">
                <td className="py-1.5 text-sm">平均容積率<Tip text="自動 = Σ(面積×容積率) ÷ 總面積；可手動覆寫（例：依都發局核定值）" /></td>
                <td className="py-1.5 px-2 text-xs text-stone-500">自動 {pct(cad.farAuto, 2)}</td>
                <td className="py-1.5 w-28"><NumInput pct value={project.farOverride} onChange={(v) => up((p) => { p.farOverride = v; })} placeholder="手動覆寫" /></td>
                <td className="text-xs pl-1 text-stone-500">%</td>
              </tr>
              <Row label="採用容積率" value={pct(cad.far, 2)} strong />
              <Row label="加權平均公告現值" value={`${fmt(cad.avgValue, 0)} 元/㎡`} unit={`${fmt(cad.avgValue / 0.3025 / 10000, 2)} 萬/坪`} />
              <Row label="總戶數" value={fmt(cad.households)} unit="戶" />
              <Row label="公有地比例" value={pct(cad.publicRatio, 2)} unit={`${fmt(cad.publicArea, 2)} ㎡`} tip="Σ(面積 × 公有持分%)；公有＝100%，公私共有依填入比例" />
              <Row label="預估 1 樓土地面積" value={`${fmt(cad.f1Area, 2)} ㎡`} unit={`${fmt(cad.f1Ping, 2)} 坪`} tip="Σ(各筆面積 ÷ 地上樓層數)，供 1 樓補貼坪參考" />
            </tbody>
          </table>
        </Card>
      </div>
    </div>
  );
}

function LandCloudPaste({ project, up }) {
  const [log, setLog] = useState([]);
  const [raw, setRaw] = useState('');
  const onPaste = (e) => {
    e.preventDefault();
    const hasImg = [...(e.clipboardData.items || [])].some((i) => i.type.startsWith('image/'));
    let text = e.clipboardData.getData('text/plain');
    if (hasImg && !text.trim()) {
      return notify('您貼上的是「截圖圖片」，系統無法讀圖。\n\n請改用以下任一方式：\n① 在地政雲結果視窗，用滑鼠從「行政區」拖曳反白到「私有(100%)」，按 Ctrl+C，再回來 Ctrl+V。\n② 若地政雲無法反白文字：把截圖傳給 Claude，Claude 會回傳可直接貼進清冊的表格。');
    }
    if (!text.trim()) {
      const h = e.clipboardData.getData('text/html');
      if (h) { const d = document.createElement('div'); d.innerHTML = h; text = d.innerText || d.textContent || ''; }
    }
    apply(text);
  };
  const apply = (text) => {
    const r = parseLandCloud(text, project.site.city || '臺北市');
    if (!r) {
      setRaw(text);
      return notify('看不出地號。系統收到的內容已顯示在框內，請截圖給 Claude 調整格式。\n\n收到的文字（前 150 字）：\n' + (text.trim().slice(0, 150) || '（空白：可能沒有複製到文字，請用滑鼠拖曳反白後再 Ctrl+C）'));
    }
    setRaw('');
    up((p) => {
      let row = p.lots.find((l) => String(l.lotNo) === r.lotNo);
      if (!row) {
        const empty = p.lots.find((l) => !l.lotNo && !l.area);
        row = empty || { id: uid(), owner: '私', floors: 4, households: '' };
        if (!empty) p.lots.push(row);
      }
      Object.assign(row, { lotNo: r.lotNo, area: r.area, value: r.value, zone: r.zone, owner: r.owner, pubPct: r.pubPct });
      if (r.parts && !(row.parts || []).length) row.parts = r.parts;
      if (r.far !== '') row.far = r.far;
      if (r.bcr !== '') row.bcr = r.bcr;
      if (!p.site.section && r.section) {
        const m = r.section.match(/^(.+段)(.+小段)?$/);
        if (m) { p.site.section = m[1]; p.site.subsection = m[2] || ''; }
      }
    });
    setLog((l) => [r, ...l].slice(0, 6));
  };
  return (
    <Card title="從臺北地政雲貼上（自動填入）" icon={LuClipboardPaste}
      tip={'1. 地政雲 → 公地查詢 → 圖面點選地號\n2. 左側「整合資訊查詢結果」土地頁，用滑鼠從「行政區」拖曳選到「土地權屬」，Ctrl+C\n3. 點下方框框，Ctrl+V\n每貼一筆就自動新增／更新清冊那一列，再點下一個地號重複即可'}>
      <div className="grid grid-cols-[1fr_1.4fr] gap-4">
        <div>
        <div className="relative">
        <textarea
          onPaste={onPaste}
          value={raw}
          onChange={(e) => setRaw(e.target.value)}
          className="h-28 w-full rounded-lg border-2 border-dashed border-navy-500/40 bg-navy-700/5 p-3 text-sm focus:outline-none focus:border-navy-500 resize-none"
        />
        {!raw && (
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-sm text-navy-700/70 leading-relaxed">
            <div>點這裡，按 Ctrl+V 貼上地政雲查詢結果</div>
            <div>（一次一筆，貼完會自動填入下方清冊）</div>
          </div>
        )}
        </div>
        {raw && <Btn small variant="primary" onClick={() => apply(raw)}>重新解析框內文字</Btn>}
        </div>
        <div className="text-xs">
          {log.length === 0 ? (
            <div className="text-stone-500 leading-relaxed">會自動帶入：地號、面積、使用分區、公告現值、權屬；臺北市單一分區會同時帶入容積率與建蔽率。<br />跨分區地號會標示提醒，容積率請依各分區面積自行填入。</div>
          ) : (
            <table className="w-full">
              <thead><tr className="text-stone-500"><th className="text-left">地號</th><th className="text-right">面積㎡</th><th className="text-left pl-2">分區</th><th className="text-right">現值</th><th className="text-left pl-2">備註</th></tr></thead>
              <tbody>
                {log.map((r, i) => (
                  <tr key={i} className="border-t border-oat-100">
                    <td className="py-0.5 font-semibold">{r.lotNo}</td><td className="text-right">{fmt(r.area, 2)}</td>
                    <td className="pl-2">{r.zone}{r.far ? ` ${pct(r.far, 0)}` : ''}</td><td className="text-right">{fmt(r.value)}</td>
                    <td className={`pl-2 ${r.note ? 'text-amber-700' : 'text-emerald-700'}`}>{r.note || '✓ 已填入'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </Card>
  );
}
