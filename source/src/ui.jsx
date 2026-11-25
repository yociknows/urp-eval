import React, { useEffect, useState } from 'react';
import { LuCircleHelp } from 'react-icons/lu';

export const fmt = (v, d = 0) =>
  v === null || v === undefined || !isFinite(v) ? '—' : Number(v).toLocaleString('zh-TW', { minimumFractionDigits: d, maximumFractionDigits: d });
export const pct = (v, d = 1) => (v === null || v === undefined || !isFinite(v) ? '—' : (v * 100).toFixed(d) + '%');

export function Tip({ text, wide }) {
  if (!text) return null;
  return (
    <span className="group relative inline-flex align-middle ml-1 print:hidden">
      <LuCircleHelp className="w-3.5 h-3.5 text-stone-400 hover:text-navy-600 cursor-help" />
      <span className={`pointer-events-none absolute left-1/2 -translate-x-1/2 top-5 z-50 hidden group-hover:block ${wide ? 'w-96' : 'w-72'} rounded-md bg-navy-900 text-white text-xs leading-relaxed px-3 py-2 shadow-xl whitespace-pre-line font-normal`}>
        {text}
      </span>
    </span>
  );
}

export function Card({ title, icon: Icon, right, children, className = '', tip }) {
  return (
    <section className={`bg-white rounded-xl border border-oat-200 shadow-sm ${className}`}>
      {title && (
        <header className="flex items-center justify-between px-4 py-2.5 border-b border-oat-200 bg-oat-50 rounded-t-xl">
          <h3 className="flex items-center gap-2 text-sm font-semibold text-navy-800">
            {Icon && <Icon className="w-4 h-4 text-navy-500" />}
            {title}
            <Tip text={tip} />
          </h3>
          {right}
        </header>
      )}
      <div className="p-4">{children}</div>
    </section>
  );
}

/* 數字欄位：pct=true 時以百分比顯示、存小數 */
export function NumInput({ value, onChange, pct: isPct, className = '', placeholder, step, disabled }) {
  const toDisp = (v) => (v === '' || v === null || v === undefined ? '' : isPct ? +(v * 100).toFixed(4) + '' : v + '');
  const [s, setS] = useState(toDisp(value));
  const [focus, setFocus] = useState(false);
  useEffect(() => { if (!focus) setS(toDisp(value)); }, [value, focus]);
  return (
    <input
      type="text"
      inputMode="decimal"
      disabled={disabled}
      className={`w-full rounded-md border border-oat-300 bg-white px-2 py-1 text-right text-sm tabular-nums focus:outline-none focus:ring-2 focus:ring-navy-500/30 focus:border-navy-500 disabled:bg-oat-100 disabled:text-stone-500 ${className}`}
      value={s}
      placeholder={placeholder}
      step={step}
      onFocus={() => setFocus(true)}
      onBlur={() => { setFocus(false); setS(toDisp(value)); }}
      onChange={(e) => {
        const t = e.target.value.replace(/,/g, '');
        setS(e.target.value);
        if (t === '') return onChange('');
        if (!isNaN(+t)) onChange(isPct ? +t / 100 : +t);
      }}
    />
  );
}

export function Field({ label, tip, unit, children, className = '' }) {
  return (
    <label className={`block ${className}`}>
      <span className="flex items-center text-xs text-stone-600 mb-1">
        {label}
        <Tip text={tip} />
      </span>
      <div className="flex items-center gap-1.5">
        <div className="flex-1 min-w-0">{children}</div>
        {unit && <span className="text-xs text-stone-500 shrink-0">{unit}</span>}
      </div>
    </label>
  );
}

export function NumField({ label, tip, unit, value, onChange, pct: isPct, className, placeholder }) {
  return (
    <Field label={label} tip={tip} unit={isPct ? '%' : unit} className={className}>
      <NumInput value={value} onChange={onChange} pct={isPct} placeholder={placeholder} />
    </Field>
  );
}

export function TextInput({ value, onChange, className = '', placeholder }) {
  return (
    <input
      className={`w-full rounded-md border border-oat-300 bg-white px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-navy-500/30 focus:border-navy-500 ${className}`}
      value={value ?? ''}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
    />
  );
}

export function Select({ value, onChange, options, className = '' }) {
  return (
    <select
      className={`w-full rounded-md border border-oat-300 bg-white px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-navy-500/30 ${className}`}
      value={value}
      onChange={(e) => onChange(e.target.value)}
    >
      {options.map((o) => (
        <option key={o.value ?? o} value={o.value ?? o}>{o.label ?? o}</option>
      ))}
    </select>
  );
}

export function Btn({ children, onClick, variant = 'default', className = '', title, icon: Icon, small }) {
  const v = {
    default: 'bg-white border border-oat-300 text-navy-800 hover:bg-oat-100',
    primary: 'bg-navy-700 text-white hover:bg-navy-800 border border-navy-700',
    danger: 'bg-white border border-red-200 text-red-700 hover:bg-red-50',
    ghost: 'text-navy-700 hover:bg-oat-100',
  }[variant];
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-md ${small ? 'px-2 py-0.5 text-xs' : 'px-3 py-1.5 text-sm'} font-medium transition-colors cursor-pointer ${v} ${className}`}
    >
      {Icon && <Icon className={small ? 'w-3.5 h-3.5' : 'w-4 h-4'} />}
      {children}
    </button>
  );
}

export function Light({ ok, warn }) {
  const c = ok === null || ok === undefined ? 'bg-stone-300' : ok ? 'bg-emerald-500' : warn ? 'bg-amber-500' : 'bg-red-500';
  return <span className={`inline-block w-2.5 h-2.5 rounded-full ${c} ring-2 ring-white shadow`} />;
}

export function Badge({ ok, children }) {
  const c = ok === null || ok === undefined ? 'bg-stone-100 text-stone-600' : ok ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-red-50 text-red-700 border-red-200';
  return <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-semibold ${c}`}>{children}</span>;
}

/* 計算列：label / 公式 / 數值 */
export function Row({ label, tip, formula, value, unit, strong, sub }) {
  return (
    <tr className={`border-b border-oat-100 ${strong ? 'bg-oat-50 font-semibold text-navy-800' : ''}`}>
      <td className={`py-1.5 pr-2 text-sm ${sub ? 'pl-5 text-stone-600' : ''}`}>
        {label}
        <Tip text={tip} />
      </td>
      <td className="py-1.5 px-2 text-xs text-stone-500">{formula}</td>
      <td className="py-1.5 pl-2 text-right tabular-nums text-sm whitespace-nowrap">{value}</td>
      <td className="py-1.5 pl-1 text-xs text-stone-500 whitespace-nowrap">{unit}</td>
    </tr>
  );
}

/* ---------- 內建對話框（取代 alert/confirm） ---------- */
let pushDlg = null;
export const ask = (msg) => new Promise((res) => (pushDlg ? pushDlg({ msg, res, confirm: true }) : res(window.confirm(msg))));
export const notify = (msg) => (pushDlg ? pushDlg({ msg, res: () => {}, confirm: false }) : null);
export function DialogHost() {
  const [d, setD] = useState(null);
  useEffect(() => { pushDlg = setD; return () => { pushDlg = null; }; }, []);
  if (!d) return null;
  const close = (v) => { d.res(v); setD(null); };
  return (
    <div className="fixed inset-0 z-[60] bg-black/40 flex items-center justify-center print:hidden" onClick={() => close(false)}>
      <div className="bg-white rounded-xl shadow-2xl w-[420px] p-5" onClick={(e) => e.stopPropagation()}>
        <div className="text-sm text-stone-800 whitespace-pre-line">{d.msg}</div>
        <div className="flex justify-end gap-2 mt-5">
          {d.confirm && <Btn onClick={() => close(false)}>取消</Btn>}
          <Btn variant={d.confirm ? 'danger' : 'primary'} onClick={() => close(true)}>{d.confirm ? '確定' : '好'}</Btn>
        </div>
      </div>
    </div>
  );
}

/* 可打字、也可下拉選的欄位（下拉永遠列出全部選項） */
export function ComboInput({ value, onChange, options = [], placeholder }) {
  const [open, setOpen] = useState(false);
  const [typing, setTyping] = useState(false);
  const v = value || '';
  const list = typing && v ? options.filter((o) => o.includes(v)) : options;
  return (
    <div className="relative" onBlur={(e) => { if (!e.currentTarget.contains(e.relatedTarget)) { setOpen(false); setTyping(false); } }}>
      <input
        className="w-full rounded-md border border-oat-300 bg-white pl-2 pr-12 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-navy-500/30 focus:border-navy-500"
        value={v}
        placeholder={placeholder}
        onFocus={() => setOpen(true)}
        onClick={() => { setOpen(true); setTyping(false); }}
        onChange={(e) => { onChange(e.target.value); setTyping(true); setOpen(true); }}
      />
      {v && (
        <button type="button" tabIndex={-1} title="清除" onClick={() => { onChange(''); setTyping(false); }}
          className="absolute right-6 top-1/2 -translate-y-1/2 text-stone-400 hover:text-red-600 cursor-pointer px-1">×</button>
      )}
      <button type="button" tabIndex={-1} title="展開選單" onClick={() => { setTyping(false); setOpen(!open); }}
        className="absolute right-1 top-1/2 -translate-y-1/2 text-stone-500 hover:text-navy-700 cursor-pointer px-1 text-xs">▼</button>
      {open && list.length > 0 && (
        <div className="absolute z-40 mt-1 w-full max-h-60 overflow-y-auto rounded-md border border-oat-300 bg-white shadow-lg">
          {list.map((o) => (
            <button type="button" key={o} onMouseDown={(e) => e.preventDefault()} onClick={() => { onChange(o); setOpen(false); setTyping(false); }}
              className={`block w-full text-left px-2 py-1.5 text-sm hover:bg-oat-100 cursor-pointer ${o === v ? 'bg-navy-700/10 font-semibold' : ''}`}>{o}</button>
          ))}
        </div>
      )}
    </div>
  );
}

/* 列印：在預覽框（iframe）內瀏覽器會擋列印，改提示用法 */
export function doPrint() {
  let framed = false;
  try { framed = window.self !== window.top; } catch { framed = true; }
  if (framed) {
    return notify('目前是在「預覽視窗」裡開啟，瀏覽器不允許從這裡列印。\n\n請先下載「都更投報評估系統.html」，在檔案上點兩下，用 Chrome 或 Edge 開啟，再按「一頁式提報 PDF」→ 目的地選「另存為 PDF」。\n\n（資料存在瀏覽器裡：在 Chrome 開的檔案和預覽視窗是分開的，第一次需要重新輸入，或用「6. 專案總覽」匯出 JSON 再匯入。）');
  }
  window.print();
}
