import React, { useEffect, useMemo, useState } from 'react';
import {
  LuLayoutDashboard, LuMap, LuTable, LuRuler, LuCalculator, LuChartBar, LuBuilding2, LuPrinter, LuWifiOff, LuCopy, LuShieldCheck,
} from 'react-icons/lu';
import { uid, autoName } from './defaults.js';
import { loadState, saveState } from './store.js';
import { computeAll } from './calc.js';
import { fmt, pct, Light, Tip, Select, DialogHost, NumInput } from './ui.jsx';
import { doPrint } from './ui.jsx';
import Page0 from './pages/Page0.jsx';
import Page1 from './pages/Page1.jsx';
import Page2 from './pages/Page2.jsx';
import Page3 from './pages/Page3.jsx';
import Page4 from './pages/Page4.jsx';
import Page5 from './pages/Page5.jsx';
import Page6 from './pages/Page6.jsx';
import PrintReport from './pages/PrintReport.jsx';

const NAV = [
  { id: 6, no: 0, name: '重建核心要件', icon: LuShieldCheck },
  { id: 1, no: 1, name: '基地現況與圖資', icon: LuMap },
  { id: 2, no: 2, name: '地籍清冊', icon: LuTable },
  { id: 3, no: 3, name: '面積表與法規檢核', icon: LuRuler },
  { id: 4, no: 4, name: '造價表與費用細算', icon: LuCalculator },
  { id: 5, no: 5, name: '合建投報儀表板', icon: LuChartBar },
  { id: 0, no: 6, name: '專案總覽與方案比較', icon: LuLayoutDashboard },
];

export default function App() {
  const [state, setState] = useState(loadState);
  const [page, setPage] = useState(() => +(sessionStorage.getItem('urp-page') ?? 6));
  const [saveErr, setSaveErr] = useState(false);
  const [online, setOnline] = useState(navigator.onLine);

  useEffect(() => {
    const t = setTimeout(() => setSaveErr(!saveState(state)), 300);
    return () => clearTimeout(t);
  }, [state]);
  useEffect(() => { sessionStorage.setItem('urp-page', page); window.scrollTo(0, 0); }, [page]);
  useEffect(() => {
    const on = () => setOnline(true), off = () => setOnline(false);
    window.addEventListener('online', on); window.addEventListener('offline', off);
    return () => { window.removeEventListener('online', on); window.removeEventListener('offline', off); };
  }, []);

  const project = state.projects.find((p) => p.id === state.currentId) || state.projects[0];
  const scheme = project?.schemes.find((s) => s.id === project.activeSchemeId) || project?.schemes[0];
  const res = useMemo(() => (project && scheme ? computeAll(project, scheme) : null), [project, scheme]);

  const up = (fn) =>
    setState((s) => ({
      ...s,
      projects: s.projects.map((p) => {
        if (p.id !== project.id) return p;
        const q = structuredClone(p);
        fn(q);
        q.updatedAt = Date.now();
        return q;
      }),
    }));
  const upScheme = (fn) => up((p) => fn(p.schemes.find((x) => x.id === p.activeSchemeId) || p.schemes[0]));

  const ctx = { state, setState, project, scheme, res, up, upScheme, setPage };

  return (
    <>
      <div className="min-h-screen bg-oat-100 text-stone-800 print:hidden">
        {/* 左側導覽 */}
        <aside className="fixed inset-y-0 left-0 w-60 bg-navy-900 text-oat-100 flex flex-col z-30">
          <div className="px-5 py-5 border-b border-white/10">
            <div className="flex items-center gap-2">
              <LuBuilding2 className="w-6 h-6 text-amber-300" />
              <div>
                <div className="font-bold tracking-wide">都更投報評估</div>
                <div className="text-[11px] text-oat-300/80">合建土地開發決策系統</div>
              </div>
            </div>
          </div>
          <nav className="flex-1 py-3">
            {NAV.map((n) => (
              <button
                key={n.id}
                onClick={() => setPage(n.id)}
                className={`w-full flex items-center gap-3 px-5 py-2.5 text-sm text-left cursor-pointer transition-colors ${
                  page === n.id ? 'bg-white/10 text-white border-l-4 border-amber-300 pl-4' : 'text-oat-200/80 hover:bg-white/5'
                }`}
              >
                <n.icon className="w-4 h-4 shrink-0" />
                <span><span className="text-oat-300/60 mr-1">{n.no}</span>{n.name}</span>
              </button>
            ))}
          </nav>
          <div className="p-4 border-t border-white/10 space-y-2">
            <button onClick={doPrint} className="w-full flex items-center justify-center gap-2 rounded-md bg-amber-300 text-navy-900 font-semibold text-sm py-2 hover:bg-amber-200 cursor-pointer">
              <LuPrinter className="w-4 h-4" /> 一頁式提報 PDF
            </button>
            <div className="text-[11px] text-oat-300/70 leading-relaxed">
              資料儲存在本機瀏覽器，請定期到「專案總覽」匯出 JSON 備份。
              {saveErr && <div className="text-red-300 mt-1">⚠ 本機空間不足，存檔失敗，請匯出備份。</div>}
              {!online && <div className="flex items-center gap-1 mt-1 text-amber-200"><LuWifiOff /> 離線模式</div>}
            </div>
          </div>
        </aside>

        {/* 上方決策摘要列 */}
        <div className="pl-60">
          {res && <SummaryBar ctx={ctx} />}
          <main className="p-6 max-w-[1500px]">
            {page === 0 && <Page0 {...ctx} />}
            {page === 1 && <Page1 {...ctx} />}
            {page === 2 && <Page2 {...ctx} />}
            {page === 3 && <Page3 {...ctx} />}
            {page === 4 && <Page4 {...ctx} />}
            {page === 5 && <Page5 {...ctx} />}
            {page === 6 && <Page6 {...ctx} />}
            <StepNav page={page} setPage={setPage} />
          </main>
        </div>
      </div>
      {res && <PrintReport {...ctx} />}
      <DialogHost />
    </>
  );
}

function SummaryBar({ ctx }) {
  const { project, scheme, res, up, upScheme } = ctx;
  const { ar, inv, sw } = res;
  const ok1 = inv.swap >= 1;
  const ok2 = inv.roi2 >= sw.target;
  // 改構造／分配比時，若方案名稱是自動命名就一起更新
  const quick = (fn) => upScheme((x) => {
    const wasAuto = !x.name || x.name === autoName(x);
    fn(x);
    if (wasAuto) x.name = autoName(x);
  });
  return (
    <div className="sticky top-0 z-20 bg-white/95 backdrop-blur border-b border-oat-200 shadow-sm">
      <div className="px-4 pt-2 pb-1.5 text-sm">
        <div className="flex items-center gap-3 pb-1.5 border-b border-oat-100">
          <span className="text-[11px] text-stone-500 shrink-0">目前專案</span>
          <input
            className="flex-1 min-w-[200px] max-w-[460px] font-semibold text-navy-800 bg-transparent rounded px-1 -mx-1 border border-transparent hover:border-oat-300 focus:border-navy-500 focus:bg-white focus:outline-none"
            value={project.name}
            title="點一下即可修改案名"
            onChange={(e) => up((p) => { p.name = e.target.value; })}
          />
          <div className="flex flex-nowrap items-center gap-1.5 text-xs shrink-0">
            <select
              className="rounded border border-oat-300 bg-white px-1 py-0.5 text-xs font-semibold text-navy-800 cursor-pointer"
              title="構造"
              value={scheme.structure}
              onChange={(e) => quick((x) => { x.structure = e.target.value; })}
            >
              {['RC', 'SRC', 'SC'].map((k) => <option key={k} value={k}>{k}</option>)}
            </select>
            <span className="whitespace-nowrap font-semibold text-navy-700 bg-navy-700/10 rounded px-1">地主分</span>
            <span className="text-stone-500 whitespace-nowrap">基準</span>
            <NumInput pct className="!w-12 !px-1 !py-0.5 !text-xs" value={scheme.baseLandowner}
              onChange={(v) => quick((x) => { x.ratioMode = 'B'; x.baseLandowner = v; })} />
            <span className="text-stone-500 whitespace-nowrap">%・獎勵</span>
            <NumInput pct className="!w-12 !px-1 !py-0.5 !text-xs" value={scheme.bonusLandowner}
              onChange={(v) => quick((x) => { x.ratioMode = 'B'; x.bonusLandowner = v; })} />
            <span className="text-stone-500">%</span>
            <Tip text={'這裡填的是「地主」分得比例（建商＝100% − 地主）\n基準＝基準容積部分、獎勵＝獎勵容積部分\n改這裡會即時重算全部指標'} />
            <select
              className="w-6 shrink-0 rounded border border-oat-300 bg-oat-50 py-0.5 text-xs cursor-pointer"
              title="切換方案"
              value={project.activeSchemeId}
              onChange={(e) => up((p) => { p.activeSchemeId = e.target.value; })}
            >
              {project.schemes.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
            <button
              className="shrink-0 rounded border border-oat-300 bg-white p-0.5 hover:bg-oat-100 cursor-pointer"
              title="複製目前方案（另存一份來比較）"
              onClick={() => up((p) => {
                const c = { ...structuredClone(scheme), id: uid(), name: scheme.name + '（複製）' };
                p.schemes.push(c); p.activeSchemeId = c.id;
              })}
            ><LuCopy className="w-3.5 h-3.5 text-navy-700" /></button>
          </div>
        </div>
        <div className="flex items-stretch pt-1.5">
        {!(ar.salesPing > 0) ? (
          <div className="flex items-center px-4 text-sm text-stone-500">
            尚未輸入土地資料：請先到
            <button className="mx-1 font-semibold text-navy-700 underline cursor-pointer" onClick={() => ctx.setPage(2)}>頁 2 地籍清冊</button>
            填地號與面積，指標會自動出現。
          </div>
        ) : (<>
        <Metric label="總銷坪" tip="總銷售面積 = 土地坪 × 基準容積率 × (1+獎勵與容移) × 建築係數">
          <span className="text-base 2xl:text-lg font-bold text-navy-800">{fmt(ar.salesPing, 1)}</span><span className="text-xs text-stone-500 ml-1">坪</span>
        </Metric>
        <Metric label="分配比 地主／建商" tip={'綜合分配比\n拆算模式 = (基準地主% ×1 + 獎勵地主% × 獎勵率) ÷ (1+獎勵率)'}>
          <span className="text-base 2xl:text-lg font-bold text-navy-800">{pct(inv.L, 2)}</span>
          <span className="text-stone-400 mx-1">／</span>
          <span className="text-base 2xl:text-lg font-bold text-amber-700">{pct(inv.g, 2)}</span>
        </Metric>
        <Metric label="紅線1 室內一坪換" tip={'地主分回坪(含1F補貼) × (1 − 新房公設比 ' + pct(scheme.newPublicRatio, 0) + ') ÷ 舊公寓室內坪\n≥ 1.00 綠燈'}>
          <span className="flex items-center gap-2"><Light ok={ok1} />
            <span className={`text-base 2xl:text-lg font-bold ${ok1 ? 'text-emerald-700' : 'text-red-600'}`}>{isFinite(inv.swap) && inv.swap ? inv.swap.toFixed(2) : '—'}</span>
            <span className="text-xs text-stone-500">坪</span></span>
        </Metric>
        <Metric label={'紅線2 單價二投報率'} tip={'投資報酬率 = 損益(R) ÷ 總成本(C)，以單價二 ' + scheme.price2 + ' 萬/坪計\n≥ 目標 ' + pct(sw.target, 0) + ' 綠燈'}>
          <span className="flex items-center gap-2"><Light ok={ok2} />
            <span className={`text-base 2xl:text-lg font-bold ${ok2 ? 'text-emerald-700' : 'text-red-600'}`}>{pct(inv.roi2, 2)}</span>
            <span className="text-xs text-stone-500">目標 {pct(sw.target, 0)}</span></span>
        </Metric>
        <Metric label="談判甜蜜點（地主分配比）" tip={'底線：地主最少要分多少，室內才能一坪換一坪\n上限：地主最多能分多少，公司單價二投報仍 ≥ 目標\n（自動反推，1F補貼依比例同步變動）'} last>
          <span className="flex items-center gap-2"><Light ok={sw.ok} />
            {sw.ok ? (
              <span className="text-base 2xl:text-lg font-bold text-navy-800">{pct(sw.floor, 1)} ～ {pct(sw.ceil, 1)}</span>
            ) : (
              <span className="font-bold text-red-600">
                本案無交集
                <span className="ml-2 text-xs font-normal text-stone-500">底線 {sw.floor === null ? '無解' : pct(sw.floor, 1)}／上限 {sw.ceil === null ? '無解' : pct(sw.ceil, 1)}</span>
              </span>
            )}
          </span>
        </Metric>
        </>)}
        </div>
      </div>
    </div>
  );
}

function StepNav({ page, setPage }) {
  const i = NAV.findIndex((n) => n.id === page);
  const prev = NAV[i - 1], next = NAV[i + 1];
  return (
    <div className="flex justify-between mt-8 pt-4 border-t border-oat-200">
      {prev ? <button onClick={() => setPage(prev.id)} className="text-sm text-navy-700 hover:underline cursor-pointer">← 上一步：{prev.no}. {prev.name}</button> : <span />}
      {next && <button onClick={() => setPage(next.id)} className="rounded-md bg-navy-700 text-white text-sm font-medium px-4 py-2 hover:bg-navy-800 cursor-pointer">下一步：{next.no}. {next.name} →</button>}
    </div>
  );
}

function Metric({ label, tip, children, last }) {
  return (
    <div className={`flex-1 min-w-0 px-3 2xl:px-4 ${last ? '' : 'border-r border-oat-200'} flex flex-col justify-center`}>
      <div className="text-[11px] text-stone-500 flex items-center whitespace-nowrap">{label}<Tip text={tip} /></div>
      <div className="flex items-baseline whitespace-nowrap">{children}</div>
    </div>
  );
}
