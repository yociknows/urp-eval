import React, { useMemo, useRef } from 'react';
import { LuPlus, LuTrash2, LuCopy, LuDownload, LuUpload, LuFolderOpen, LuStar, LuArrowLeftRight } from 'react-icons/lu';
import { Card, Btn, TextInput, fmt, pct, Light, Tip, ask, notify } from '../ui.jsx';
import { newProject, newScheme, uid, autoName } from '../defaults.js';
import { computeAll } from '../calc.js';
import { exportProjects, importBundle, download, delImage } from '../store.js';
import { STRUCT_LABEL } from '../costTable.js';

export default function Page0({ state, setState, project, up, setPage }) {
  const fileRef = useRef();

  const openProject = (id) => setState((s) => ({ ...s, currentId: id }));
  const addProject = (p) => setState((s) => ({ ...s, projects: [...s.projects, p], currentId: p.id }));
  const delProject = async (p) => {
    if (!(await ask(`確定刪除專案「${p.name}」？此動作無法復原（建議先匯出備份）。`))) return;
    Object.values(p.images || {}).forEach((v) => v?.imgId && delImage(v.imgId));
    setState((s) => {
      const projects = s.projects.filter((x) => x.id !== p.id);
      const list = projects.length ? projects : [newProject()];
      return { ...s, projects: list, currentId: s.currentId === p.id ? list[0].id : s.currentId };
    });
  };
  const exportOne = async (p) => download(`${p.name}.json`, JSON.stringify(await exportProjects([p])));
  const exportAll = async () => download(`都更投報備份_${new Date().toISOString().slice(0, 10)}.json`, JSON.stringify(await exportProjects(state.projects)));
  const onImport = async (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    try {
      const list = await importBundle(await f.text());
      if (!list.length) throw new Error('檔案中沒有專案');
      setState((s) => ({ ...s, projects: [...s.projects, ...list], currentId: list[0].id }));
      notify(`已匯入 ${list.length} 個專案`);
    } catch (err) {
      notify('匯入失敗：' + err.message);
    }
    e.target.value = '';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-xl font-bold text-navy-800">專案總覽與方案比較</h1>
          <p className="text-sm text-stone-500 mt-1">點選專案卡片切換目前專案；同一專案可建立多個投報方案並排比較。</p>
        </div>
        <div className="flex gap-2">
          <Btn icon={LuPlus} variant="primary" onClick={() => addProject(newProject({ name: '新專案 ' + (state.projects.length + 1) }))}>新增專案</Btn>
          <Btn icon={LuUpload} onClick={() => fileRef.current.click()}>匯入 JSON</Btn>
          <Btn icon={LuDownload} onClick={exportAll}>全部匯出備份</Btn>
          <input ref={fileRef} type="file" accept=".json,application/json" className="hidden" onChange={onImport} />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {state.projects.map((p) => (
          <ProjectCard key={p.id} p={p} active={p.id === project.id} onOpen={() => openProject(p.id)}
            onEnter={() => { openProject(p.id); setPage(1); }}
            onDelete={() => delProject(p)} onExport={() => exportOne(p)}
            onCopy={() => addProject({ ...structuredClone(p), id: uid(), name: p.name + '（複本）', images: {} })} />
        ))}
      </div>

      <SchemeManager project={project} up={up} setPage={setPage} />
    </div>
  );
}

function ProjectCard({ p, active, onOpen, onEnter, onDelete, onExport, onCopy }) {
  const sc = p.schemes.find((s) => s.id === p.activeSchemeId) || p.schemes[0];
  const r = useMemo(() => { try { return computeAll(p, sc); } catch { return null; } }, [p, sc]);
  return (
    <div onClick={onOpen}
      className={`cursor-pointer rounded-xl border bg-white p-4 shadow-sm transition-all ${active ? 'border-navy-600 ring-2 ring-navy-500/20' : 'border-oat-200 hover:border-oat-300'}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="font-semibold text-navy-800 truncate">{p.name}</div>
          <div className="text-xs text-stone-500 truncate">{p.site?.address || '尚未填寫地址'}</div>
        </div>
        {active && <span className="shrink-0 rounded bg-navy-700 text-white text-[10px] px-1.5 py-0.5">目前</span>}
      </div>
      {r && r.ar.salesPing > 0 && (
        <div className="grid grid-cols-3 gap-2 mt-3 text-center">
          <Mini label="基地坪" v={fmt(r.cad.areaPing, 1)} />
          <Mini label="一坪換" v={r.inv.swap ? r.inv.swap.toFixed(2) : '—'} ok={r.inv.swap >= 1} />
          <Mini label="單價二投報" v={pct(r.inv.roi2, 1)} ok={r.inv.roi2 >= r.sw.target} />
        </div>
      )}
      <div className="flex items-center justify-between mt-3 pt-3 border-t border-oat-100">
        <span className="text-[11px] text-stone-400">{p.schemes.length} 個方案・{new Date(p.updatedAt || Date.now()).toLocaleDateString('zh-TW')}</span>
        <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
          <Btn small variant="ghost" icon={LuFolderOpen} onClick={onEnter}>進入</Btn>
          <Btn small variant="ghost" icon={LuCopy} onClick={onCopy} title="複製專案" />
          <Btn small variant="ghost" icon={LuDownload} onClick={onExport} title="匯出 JSON" />
          <Btn small variant="ghost" icon={LuTrash2} onClick={onDelete} title="刪除" />
        </div>
      </div>
    </div>
  );
}

function Mini({ label, v, ok }) {
  return (
    <div className="rounded-md bg-oat-50 py-1.5">
      <div className="text-[10px] text-stone-500">{label}</div>
      <div className={`text-sm font-semibold tabular-nums ${ok === undefined ? 'text-navy-800' : ok ? 'text-emerald-700' : 'text-red-600'}`}>{v}</div>
    </div>
  );
}

function SchemeManager({ project, up, setPage }) {
  const rows = useMemo(() => project.schemes.map((s) => ({ s, r: computeAll(project, s) })), [project]);
  const dup = (s) => up((p) => {
    const c = { ...structuredClone(s), id: uid(), name: s.name + '（複製）' };
    p.schemes.push(c);
    p.activeSchemeId = c.id;
  });
  const del = async (s) => {
    if (project.schemes.length <= 1) return notify('至少保留一個方案');
    if (!(await ask(`刪除方案「${s.name}」？`))) return;
    up((p) => {
      p.schemes = p.schemes.filter((x) => x.id !== s.id);
      if (p.activeSchemeId === s.id) p.activeSchemeId = p.schemes[0].id;
    });
  };
  const metrics = [
    ['構造／樓層', ({ s }) => `${s.structure} ${s.floorsAbove}F`],
    ['分配模式', ({ s }) => (s.ratioMode === 'A' ? '全案統一' : `基準 ${pct(s.baseLandowner, 0)}／獎勵 ${pct(s.bonusLandowner, 0)}`)],
    ['地主綜合比', ({ r }) => pct(r.inv.L, 2)],
    ['建商綜合比', ({ r }) => pct(r.inv.g, 2)],
    ['1F 補貼坪', ({ r }) => fmt(r.inv.subsidy, 1) + ' 坪'],
    ['地主分回坪', ({ r }) => fmt(r.inv.landownerPing, 1) + ' 坪'],
    ['建商可售坪', ({ r }) => fmt(r.inv.builderPing, 1) + ' 坪'],
    ['營建造價', ({ s }) => s.constructionPrice + ' 萬/坪'],
    ['單價二', ({ s }) => s.price2 + ' 萬/坪'],
    ['總成本 (C)', ({ r }) => fmt(r.inv.tiers[1].C) + ' 萬'],
    ['單價二損益 (R)', ({ r }) => fmt(r.inv.tiers[1].R) + ' 萬'],
    ['單價二投報率', ({ r }) => <span className={r.inv.roi2 >= r.sw.target ? 'text-emerald-700 font-bold' : 'text-red-600 font-bold'}>{pct(r.inv.roi2, 2)}</span>],
    ['室內一坪換回', ({ r }) => <span className={r.inv.swap >= 1 ? 'text-emerald-700 font-bold' : 'text-red-600 font-bold'}>{r.inv.swap.toFixed(2)} 坪</span>],
    ['甜蜜點區間', ({ r }) => (r.sw.ok ? `${pct(r.sw.floor, 1)} ～ ${pct(r.sw.ceil, 1)}` : <span className="text-red-600">無交集</span>)],
  ];
  return (
    <Card title={`多方案並排比較 — ${project.name}`} icon={LuArrowLeftRight}
      tip="每個方案獨立設定構造、分配比、補貼、單價與成本；面積表參數（獎勵、容移等）為專案共用。"
      right={<Btn small icon={LuPlus} variant="primary" onClick={() => up((p) => { const s = newScheme(); s.name = autoName(s); p.schemes.push(s); p.activeSchemeId = s.id; })}>新增方案</Btn>}>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b-2 border-oat-200">
              <th className="text-left py-2 pr-3 text-xs text-stone-500 font-medium w-32">項目</th>
              {rows.map(({ s }) => (
                <th key={s.id} className={`text-left py-2 px-3 min-w-[190px] ${s.id === project.activeSchemeId ? 'bg-navy-700/5' : ''}`}>
                  <TextInput value={s.name} onChange={(v) => up((p) => { p.schemes.find((x) => x.id === s.id).name = v; })} className="font-semibold" />
                  <div className="flex gap-1 mt-1.5">
                    {s.id === project.activeSchemeId
                      ? <span className="text-[11px] rounded bg-navy-700 text-white px-1.5 py-0.5">目前方案</span>
                      : <Btn small onClick={() => up((p) => { p.activeSchemeId = s.id; })}>設為目前</Btn>}
                    <Btn small variant="ghost" onClick={() => { up((p) => { p.activeSchemeId = s.id; }); setPage(5); }}>編輯</Btn>
                    <Btn small variant="ghost" icon={LuCopy} onClick={() => dup(s)} title="一鍵複製" />
                    <Btn small variant="ghost" icon={LuTrash2} onClick={() => del(s)} title="刪除" />
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {metrics.map(([label, f]) => (
              <tr key={label} className="border-b border-oat-100">
                <td className="py-1.5 pr-3 text-stone-600">{label}</td>
                {rows.map((x) => (
                  <td key={x.s.id} className={`py-1.5 px-3 tabular-nums ${x.s.id === project.activeSchemeId ? 'bg-navy-700/5' : ''}`}>{f(x)}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
