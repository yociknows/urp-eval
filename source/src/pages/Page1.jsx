import React, { useEffect, useRef, useState } from 'react';
import { LuExternalLink, LuImage, LuPencil, LuTrash2, LuClipboardPaste, LuChevronDown, LuChevronRight, LuMap, LuInfo, LuListPlus, LuMapPin, LuCopy, LuPlus } from 'react-icons/lu';
import { Card, Field, NumField, TextInput, Select, Btn, Tip, ask, notify, ComboInput, NumInput } from '../ui.jsx';
import { LINKS, IMAGE_SLOTS, uid } from '../defaults.js';
import { putImage, delImage, fileToDataUrl } from '../store.js';
import { AnnotatedImage, Annotator } from './annot.jsx';

export default function Page1({ project, up, state }) {
  const s = project.site;
  const set = (k) => (v) => up((p) => { p.site[k] = v; });
  const [active, setActive] = useState(null);
  const [editing, setEditing] = useState(null);

  const setImage = async (key, file) => {
    if (!file || !file.type.startsWith('image/')) return;
    const { dataUrl, w, h } = await fileToDataUrl(file);
    const id = uid();
    await putImage(id, dataUrl);
    const old = project.images?.[key]?.imgId;
    up((p) => {
      p.images = p.images || {};
      p.images[key] = { ...(p.images[key] || {}), imgId: id, w, h, annotations: [] };
    });
    if (old) delImage(old);
  };

  useEffect(() => {
    const onPaste = (e) => {
      if (!active) return;
      const tag = document.activeElement?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;
      const item = [...(e.clipboardData?.items || [])].find((i) => i.type.startsWith('image/'));
      if (item) { e.preventDefault(); setImage(active, item.getAsFile()); }
    };
    window.addEventListener('paste', onPaste);
    return () => window.removeEventListener('paste', onPaste);
  });

  const lotsText = project.lots.map((l) => l.lotNo).filter(Boolean).join('、');

  return (
    <div className="space-y-5">
      <h1 className="text-xl font-bold text-navy-800">基地現況與圖資</h1>

      <LotScope project={project} up={up} state={state} />

      <Card title="台北土開五合一官網快捷列" icon={LuExternalLink} tip="點擊開新分頁查詢；查到的圖用 Win+Shift+S 截圖，再回到下方圖資格按 Ctrl+V 貼上。">
        <div className="grid grid-cols-5 gap-3">
          {LINKS.map((l, i) => (
            <a key={l.url} href={l.url} target="_blank" rel="noopener noreferrer"
              className="group flex items-center justify-between rounded-lg border border-oat-200 bg-oat-50 px-3 py-2.5 hover:border-navy-500 hover:bg-white transition-colors">
              <span className="text-sm font-medium text-navy-800"><span className="text-amber-600 mr-1">{i + 1}.</span>{l.name}</span>
              <LuExternalLink className="w-4 h-4 text-stone-400 group-hover:text-navy-600" />
            </a>
          ))}
        </div>
      </Card>

      <Card title="基本資料" icon={LuInfo}>
        <div className="grid grid-cols-4 gap-4">
          <Field label="案名" className="col-span-2"><TextInput value={project.name} onChange={(v) => up((p) => { p.name = v; })} /></Field>
          <Field label="投資方式">
            <Select value={s.investType} onChange={set('investType')} options={['都更協議合建', '危老重建', '土地買賣', '權利變換']} />
          </Field>
          <Field label="鄰近捷運"><TextInput value={s.mrt} onChange={set('mrt')} /></Field>
          <Field label="基地位置" className="col-span-2"><TextInput value={s.address} onChange={set('address')} placeholder="例：台北市松山區健康路196號" /></Field>
          <div className="col-span-2" />
          <RoadList project={project} up={up} />
          <NumField label="預計退縮" unit="m" value={s.setback} onChange={set('setback')} />
          <NumField label="航高限制" unit="m" value={s.aviationLimit} onChange={set('aviationLimit')} placeholder="未查可空白" tip="民航局航高查詢結果（建築物最高高度）。留白則不檢核。" />
          <div />
          <BuildingList project={project} up={up} />
          <Field label="周邊環境備註" className="col-span-4">
            <textarea className="w-full rounded-md border border-oat-300 px-2 py-1.5 text-sm h-20 focus:outline-none focus:ring-2 focus:ring-navy-500/30"
              value={s.notes} onChange={(e) => set('notes')(e.target.value)} />
          </Field>
        </div>
      </Card>

      <Card title="圖資區（核心 3 格＋選填 3 格）" icon={LuImage}
        tip={'每格可：點擊上傳、拖曳檔案、或滑鼠移到格上按 Ctrl+V 貼上截圖。\n未上傳的格子在 PDF 會自動略過。'}>
        <div className="grid grid-cols-3 gap-4">
          {IMAGE_SLOTS.map((slot) => (
            <ImageSlot key={slot.key} slot={slot} data={project.images?.[slot.key]} active={active === slot.key}
              onHover={() => setActive(slot.key)}
              onFile={(f) => setImage(slot.key, f)}
              onEdit={() => setEditing(slot.key)}
              onRemove={() => { const id = project.images[slot.key]?.imgId; up((p) => { delete p.images[slot.key].imgId; p.images[slot.key].annotations = []; }); if (id) delImage(id); }}
              onLots={(v) => up((p) => { p.images = p.images || {}; p.images[slot.key] = { ...(p.images[slot.key] || {}), lots: v }; })}
              autoLots={() => up((p) => { p.images = p.images || {}; p.images[slot.key] = { ...(p.images[slot.key] || {}), lots: lotsText }; })} />
          ))}
        </div>
      </Card>

      {editing && project.images?.[editing]?.imgId && (
        <Annotator data={project.images[editing]} title={IMAGE_SLOTS.find((x) => x.key === editing).name}
          onClose={() => setEditing(null)}
          onSave={(shapes) => { up((p) => { p.images[editing].annotations = shapes; }); setEditing(null); }} />
      )}
    </div>
  );
}

function ImageSlot({ slot, data, active, onHover, onFile, onEdit, onRemove, onLots, autoLots }) {
  const ref = useRef();
  const [drag, setDrag] = useState(false);
  const [help, setHelp] = useState(false);
  const has = !!data?.imgId;
  return (
    <div className={`rounded-lg border bg-white ${active ? 'border-navy-500 ring-2 ring-navy-500/20' : 'border-oat-200'}`} onMouseEnter={onHover}>
      <div className="flex items-center justify-between px-3 py-2 border-b border-oat-100">
        <div className="text-sm font-semibold text-navy-800">
          {slot.name}
          <span className={`ml-2 text-[10px] rounded px-1.5 py-0.5 ${slot.core ? 'bg-navy-700/10 text-navy-700' : 'bg-oat-100 text-stone-500'}`}>{slot.core ? '核心' : '選填'}</span>
        </div>
        {has && (
          <div className="flex gap-1">
            <Btn small variant="ghost" icon={LuPencil} onClick={onEdit}>標註</Btn>
            <Btn small variant="ghost" icon={LuTrash2} onClick={onRemove} title="移除圖片" />
          </div>
        )}
      </div>
      <div
        tabIndex={0}
        onClick={() => !has && ref.current.click()}
        onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => { e.preventDefault(); setDrag(false); onFile(e.dataTransfer.files?.[0]); }}
        className={`m-3 rounded-md ${has ? '' : 'border-2 border-dashed cursor-pointer h-44 flex flex-col items-center justify-center text-center'} ${drag ? 'border-navy-500 bg-navy-700/5' : 'border-oat-300 bg-oat-50 hover:bg-oat-100'} outline-none`}
      >
        {has ? (
          <div className="relative group">
            <AnnotatedImage data={data} className="rounded overflow-hidden border border-oat-200" imgClass="max-h-64 object-contain" />
            <button onClick={() => ref.current.click()} className="absolute bottom-2 right-2 hidden group-hover:block rounded bg-white/90 text-xs px-2 py-1 shadow cursor-pointer">更換圖片</button>
          </div>
        ) : (
          <>
            <LuClipboardPaste className="w-7 h-7 text-stone-400 mb-2" />
            <div className="text-sm text-stone-600">點擊上傳／拖曳檔案</div>
            <div className="text-xs text-stone-500 mt-1">{active ? <b className="text-navy-700">現在可按 Ctrl+V 貼上截圖</b> : '滑鼠移到此格按 Ctrl+V 貼上'}</div>
          </>
        )}
        <input ref={ref} type="file" accept="image/*" className="hidden" onChange={(e) => { onFile(e.target.files?.[0]); e.target.value = ''; }} />
      </div>
      <div className="px-3 pb-3 space-y-2">
        <div className="flex gap-1.5 items-center">
          <TextInput value={data?.lots || ''} onChange={onLots} placeholder="範圍地號" className="!text-xs" />
          <Btn small icon={LuListPlus} onClick={autoLots} title="從清冊自動帶入地號">帶入</Btn>
        </div>
        <button onClick={() => setHelp(!help)} className="flex items-center gap-1 text-xs text-navy-600 cursor-pointer">
          {help ? <LuChevronDown /> : <LuChevronRight />} 3 步驟截圖教學（{slot.src}）
        </button>
        {help && (
          <ol className="text-xs text-stone-600 bg-oat-50 rounded-md p-2.5 space-y-1 list-decimal list-inside">
            {slot.steps.map((t) => <li key={t}>{t}</li>)}
          </ol>
        )}
      </div>
    </div>
  );
}

const DISTRICTS = {
  '臺北市': ['中正區', '大同區', '中山區', '松山區', '大安區', '萬華區', '信義區', '士林區', '北投區', '內湖區', '南港區', '文山區'],
  '新北市': ['板橋區', '三重區', '中和區', '永和區', '新莊區', '新店區', '樹林區', '鶯歌區', '三峽區', '淡水區', '汐止區', '瑞芳區', '土城區', '蘆洲區', '五股區', '泰山區', '林口區', '深坑區', '石碇區', '坪林區', '三芝區', '石門區', '八里區', '平溪區', '雙溪區', '貢寮區', '金山區', '萬里區', '烏來區'],
};

export function parseLots(text) {
  const out = [];
  for (const raw of String(text || '').split(/[、,，;；\s]+/)) {
    const t = raw.replace(/地號$/, '').trim();
    if (!t) continue;
    const m = t.match(/^(\d+)[-~～至](\d+)$/);
    if (m && +m[2] > +m[1] && +m[2] - +m[1] <= 200) {
      for (let i = +m[1]; i <= +m[2]; i++) out.push(String(i));
    } else out.push(t);
  }
  return [...new Set(out)];
}

function LotScope({ project, up, state }) {
  const s = project.site;
  const city = s.city || '臺北市';
  // 段／小段下拉：彙整所有專案輸入過的紀錄（同行政區優先）
  const hist = (k) => [...new Set(state.projects.filter((p) => (p.site.district || '') === (s.district || '')).map((p) => p.site[k]).filter(Boolean)
    .concat(state.projects.map((p) => p.site[k]).filter(Boolean)))];
  const set = (k) => (v) => up((p) => { p.site[k] = v; });
  const nums = parseLots(s.lotsText);
  const prefix = `${s.district || ''}${s.section || ''}${s.subsection || ''}`;
  const title = nums.length ? `${prefix}${nums[0]}地號${nums.length > 1 ? `等${nums.length}筆` : ''}` : '';

  const sync = async () => {
    if (!nums.length) return notify('請先輸入地號');
    const drop = project.lots.filter((l) => l.lotNo && !nums.includes(String(l.lotNo)) && (l.area || l.value));
    if (drop.length && !(await ask(`清冊中這些地號已有資料，但不在新範圍內，會被移除：\n${drop.map((l) => l.lotNo).join('、')}\n確定更新？`))) return;
    up((p) => {
      const map = Object.fromEntries(p.lots.filter((l) => l.lotNo).map((l) => [String(l.lotNo), l]));
      p.lots = nums.map((n) => map[n] || { id: uid(), lotNo: n, zone: '', area: '', far: '', bcr: '', value: '', owner: '私', floors: 4, households: '' });
      if (!p.name || p.name.startsWith('新專案')) p.name = title;
      for (const v of Object.values(p.images || {})) if (v && !v.lots) v.lots = nums.join('、');
    });
    notify(`已建立 ${nums.length} 筆地號到「2. 地籍清冊」，接著到清冊填面積、容積率、公告現值。`);
  };
  const copy = async () => {
    try { await navigator.clipboard.writeText(`${city}${prefix} ${nums.join('、')}`); notify('已複製，可貼到地政雲查詢'); } catch { notify('瀏覽器不允許複製，請手動選取文字'); }
  };

  return (
    <Card title="第一步：基地範圍（區・段・地號）" icon={LuMapPin}
      tip={'先輸入地號範圍，按「建立清冊」會自動：\n1. 在地籍清冊產生每一筆地號列\n2. 帶入下方圖資格的「範圍地號」\n3. 案名若還是「新專案」，自動改為「○○段○○地號等N筆」'}>
      <div className="grid grid-cols-[110px_130px_1fr_150px_2.3fr] gap-3 items-end">
        <Field label="縣市">
          <Select value={city} onChange={(v) => up((p) => { p.site.city = v; p.site.district = ''; })} options={Object.keys(DISTRICTS)} />
        </Field>
        <Field label="行政區">
          <Select value={s.district || ''} onChange={set('district')} options={[{ value: '', label: '請選擇' }, ...DISTRICTS[city].map((d) => ({ value: d, label: d }))]} />
        </Field>
        <Field label="段">
          <TextInput value={s.section} onChange={set('section')} placeholder="例：西松段" />
        </Field>
        <Field label="小段">
          <ComboInput value={s.subsection} onChange={set('subsection')} options={['一小段', '二小段', '三小段', '四小段', '五小段', '六小段', '七小段', '八小段']} placeholder="無則空白" />
        </Field>
        <Field label="地號" tip={'用頓號、逗號或空白分隔；連號可寫 302-308\n例：302-308、311、312、315、316、695-2'}>
          <TextInput value={s.lotsText} onChange={set('lotsText')} placeholder="例：302-308、311、312、315、316、695-2" />
        </Field>
      </div>
      <div className="flex items-center justify-between mt-3 rounded-lg bg-oat-50 px-3 py-2">
        <div className="text-sm min-w-0">
          {nums.length ? (
            <>
              <span className="text-stone-500">共 <b className="text-navy-800">{nums.length}</b> 筆：</span>
              <span className="text-navy-800">{prefix} {nums.join('、')}</span>
            </>
          ) : <span className="text-stone-500">輸入地號後會在這裡預覽</span>}
        </div>
        <div className="flex gap-2 shrink-0 ml-3">
          <Btn small icon={LuCopy} onClick={copy}>複製地號</Btn>
          <Btn small variant="primary" icon={LuListPlus} onClick={sync}>建立清冊</Btn>
        </div>
      </div>
    </Card>
  );
}

export const roadRows = (site) => {
  const r = site.roadList?.length ? site.roadList : [{ name: site.roads || '', width: site.roadWidth ?? '' }];
  return [0, 1, 2, 3].map((i) => r[i] || { name: '', width: '' });
};

function RoadList({ project, up }) {
  const rows = roadRows(project.site);
  const setRow = (i, k, v) => up((p) => {
    const list = roadRows(p.site);
    list[i] = { ...list[i], [k]: v };
    p.site.roadList = list;
    const ws = list.map((x) => +x.width || 0);
    p.site.roadWidth = Math.max(0, ...ws);
    p.site.roads = list.filter((x) => x.name).map((x) => x.name + (x.width ? ` ${x.width}m` : '')).join('、');
  });
  return (
    <div className="col-span-4">
      <div className="flex items-center text-xs text-stone-600 mb-1">面臨道路（最多 4 條）
        <Tip text={'高度削線以最寬道路計算：一般 3.6×(路寬+退縮)、都更 5×(路寬/2+退縮)\n路寬也會影響容積率加級、容積移轉資格，頁3「法規提醒」會自動檢核'} />
      </div>
      <div className="grid grid-cols-4 gap-3">
        {rows.map((r, i) => (
          <div key={i} className="flex gap-1.5 items-center rounded-md bg-oat-50 p-1.5">
            <span className="text-xs text-stone-400 w-4 text-center">{i + 1}</span>
            <TextInput value={r.name} onChange={(v) => setRow(i, 'name', v)} placeholder={i === 0 ? '例：健康路' : '道路名稱'} />
            <div className="w-20 shrink-0"><NumInput value={r.width} onChange={(v) => setRow(i, 'width', v)} placeholder="路寬" /></div>
            <span className="text-xs text-stone-500">m</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export const buildingRows = (site) => site.buildings?.length ? site.buildings
  : (site.permitNo || site.builtYear || site.curFloors)
    ? [{ id: 'b0', type: site.unregistered ? '未保存登記' : '有使照', permitNo: site.permitNo || '', builtYear: site.builtYear || '', floors: site.curFloors || '', struct: site.curStruct || '', households: '', lots: '', area: '', seismic: !!site.seismicFail }]
    : [];
const rocNow = () => new Date().getFullYear() - 1911;

function BuildingList({ project, up }) {
  const rows = buildingRows(project.site);
  const edit = (fn) => up((p) => { p.site.buildings = buildingRows(p.site).map((x) => ({ ...x })); fn(p.site.buildings); });
  const add = (type) => edit((b) => b.push({ id: uid(), type, permitNo: '', builtYear: '', floors: '', struct: type === '未保存登記' ? '加強磚造' : 'RC', households: '', lots: '', area: '', seismic: false }));
  const th = 'font-normal text-left px-1';
  // 從 Excel／Claude 辨識結果整批貼上（Tab 分隔）：類型、使照字號、範圍地號門牌、完成年、樓層、構造、戶數、使照樓地板
  const onPaste = (e) => {
    const t = e.clipboardData.getData('text/plain');
    if (!t.includes('\t')) return;
    e.preventDefault();
    const lines = t.replace(/\r/g, '').split('\n').filter((x) => x.trim()).map((x) => x.split('\t'));
    const num = (v) => { const z = String(v || '').replace(/[^\d.]/g, ''); return z === '' ? '' : +z; };
    edit((b) => lines.forEach((c) => b.push({
      id: uid(), type: c[0] || '有使照', permitNo: c[1] || '', lots: c[2] || '', builtYear: num(c[3]), floors: num(c[4]),
      struct: c[5] || '', households: num(c[6]), area: num(c[7]), seismic: false,
    })));
    notify(`已貼上 ${lines.length} 棟建物`);
  };
  return (
    <div tabIndex={0} className="col-span-4 rounded-lg border border-oat-200 bg-oat-50 p-3 outline-none focus:ring-2 focus:ring-navy-500/30" onPaste={onPaste}>
      <div className="flex items-center justify-between mb-2">
        <div className="text-xs font-semibold text-navy-800 flex items-center">現況建物（可多棟：不同使照、未保存登記、較新建物分開列）
          <Tip text={'大基地常有多棟、多張使照，或混有未保存登記建物，請每棟／每張使照各列一筆。\n範圍地號填該棟坐落的地號，方便對照清冊。\n\n把使照存根圖傳給 Claude 辨識，複製回傳的表格，點這區任一處按 Ctrl+V 即可整批新增。'} /></div>
        <div className="flex gap-1">
          <Btn small icon={LuPlus} onClick={() => add('有使照')}>有使照建物</Btn>
          <Btn small icon={LuPlus} onClick={() => add('未保存登記')}>未保存登記</Btn>
        </div>
      </div>
      {rows.length === 0 ? (
        <div className="text-xs text-stone-500 py-2">尚未新增。看完使照存根／建物謄本後，按右上角新增每一棟。</div>
      ) : (
        <table className="w-full text-sm">
          <thead><tr className="text-xs text-stone-500">
            <th className={th}>類型</th><th className={th}>使照字號</th><th className={th}>範圍地號／門牌</th><th className={th}>完成年(民國)</th><th className={th}>屋齡</th>
            <th className={th}>樓層</th><th className={th}>構造</th><th className={th}>戶數</th><th className={th} title="使照核准總樓地板，扣除陽台等不計入面積＝原建築容積">使照樓地板(扣陽台)㎡</th><th className={th} title="耐震初評未達標或海砂屋">耐震/海砂</th><th />
          </tr></thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={r.id || i} className="border-t border-oat-200">
                <td className="px-1 py-1 w-28"><Select value={r.type} onChange={(v) => edit((b) => { b[i].type = v; })} options={['有使照', '未保存登記', '新建物', '其他']} /></td>
                <td className="px-1 w-36"><TextInput value={r.permitNo} onChange={(v) => edit((b) => { b[i].permitNo = v; })} placeholder={r.type === '未保存登記' ? '無' : '例：060使1378'} /></td>
                <td className="px-1"><TextInput value={r.lots} onChange={(v) => edit((b) => { b[i].lots = v; })} placeholder="例：304-307" /></td>
                <td className="px-1 w-20"><NumInput value={r.builtYear} onChange={(v) => edit((b) => { b[i].builtYear = v; })} placeholder="60" /></td>
                <td className="px-1 w-14 text-right tabular-nums text-xs">{r.builtYear ? `${rocNow() - r.builtYear}年` : '—'}</td>
                <td className="px-1 w-16"><NumInput value={r.floors} onChange={(v) => edit((b) => { b[i].floors = v; })} /></td>
                <td className="px-1 w-28"><Select value={r.struct || ''} onChange={(v) => edit((b) => { b[i].struct = v; })} options={['', '加強磚造', 'RC', '磚造', '木造', '鐵皮', '其他']} /></td>
                <td className="px-1 w-16"><NumInput value={r.households} onChange={(v) => edit((b) => { b[i].households = v; })} /></td>
                <td className="px-1 w-24"><NumInput value={r.area} onChange={(v) => edit((b) => { b[i].area = v; })} /></td>
                <td className="px-1 w-16 text-center"><input type="checkbox" checked={!!r.seismic} onChange={(e) => edit((b) => { b[i].seismic = e.target.checked; })} /></td>
                <td className="w-6 text-center"><button className="text-stone-400 hover:text-red-600 cursor-pointer" onClick={() => edit((b) => { b.splice(i, 1); })}><LuTrash2 className="w-3.5 h-3.5" /></button></td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-oat-300 text-xs text-navy-800 font-semibold">
              <td className="px-1 py-1" colSpan={3}>共 {rows.length} 棟（未保存登記 {rows.filter((r) => r.type === '未保存登記').length} 棟）</td>
              <td className="px-1 text-right" colSpan={2}>{(() => { const ys = rows.map((r) => +r.builtYear).filter(Boolean); return ys.length ? `屋齡 ${rocNow() - Math.max(...ys)}～${rocNow() - Math.min(...ys)} 年` : ''; })()}</td>
              <td colSpan={2} />
              <td className="px-1 text-right">{rows.reduce((a, r) => a + (+r.households || 0), 0) || ''}</td>
              <td className="px-1 text-right">{rows.reduce((a, r) => a + (+r.area || 0), 0).toLocaleString() || ''}</td>
              <td colSpan={2} />
            </tr>
          </tfoot>
        </table>
      )}
    </div>
  );
}
