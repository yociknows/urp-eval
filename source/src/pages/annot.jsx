import React, { useEffect, useRef, useState } from 'react';
import { LuPentagon, LuSquareDashed, LuType, LuUndo2, LuEraser, LuCheck, LuX } from 'react-icons/lu';
import { useImage } from '../store.js';
import { Btn } from '../ui.jsx';

export const VW = 1000;

export function Shapes({ shapes, h, draft, style }) {
  const sw = 4;
  return (
    <>
      {shapes.map((s, i) =>
        s.type === 'poly' ? (
          <polygon key={i} points={s.pts.map((p) => p.join(',')).join(' ')}
            fill={s.style === 'site' ? 'rgba(220,38,38,0.12)' : 'rgba(37,99,235,0.08)'}
            stroke={s.style === 'site' ? '#dc2626' : '#2563eb'} strokeWidth={sw} strokeDasharray={s.style === 'site' ? '' : '14 9'} strokeLinejoin="round" />
        ) : (
          <g key={i}>
            <text x={s.x} y={s.y} fontSize={Math.max(22, h / 28)} fontWeight="700" fill="#fff" stroke="#fff" strokeWidth="7" paintOrder="stroke" textAnchor="middle" dominantBaseline="middle">{s.text}</text>
            <text x={s.x} y={s.y} fontSize={Math.max(22, h / 28)} fontWeight="700" fill={s.color || '#b91c1c'} textAnchor="middle" dominantBaseline="middle">{s.text}</text>
          </g>
        ),
      )}
      {draft && draft.length > 0 && (
        <>
          <polyline points={draft.map((p) => p.join(',')).join(' ')} fill="none"
            stroke={style === 'site' ? '#dc2626' : '#2563eb'} strokeWidth={sw} strokeDasharray={style === 'site' ? '' : '14 9'} />
          {draft.map((p, i) => <circle key={i} cx={p[0]} cy={p[1]} r={i === 0 ? 10 : 6} fill={i === 0 ? '#fde047' : '#fff'} stroke="#111" strokeWidth="2" />)}
        </>
      )}
    </>
  );
}

export function AnnotatedImage({ data, className = '', imgClass = '' }) {
  const url = useImage(data?.imgId);
  if (!url) return null;
  const h = (VW * (data.h || 1)) / (data.w || 1);
  return (
    <div className={`relative ${className}`}>
      <img src={url} className={`block w-full h-auto ${imgClass}`} alt="" />
      <svg viewBox={`0 0 ${VW} ${h}`} className="absolute inset-0 w-full h-full pointer-events-none">
        <Shapes shapes={data.annotations || []} h={h} />
      </svg>
    </div>
  );
}

export function Annotator({ data, title, onSave, onClose }) {
  const url = useImage(data?.imgId);
  const [shapes, setShapes] = useState(() => structuredClone(data.annotations || []));
  const [tool, setTool] = useState('site');
  const [draft, setDraft] = useState([]);
  const [label, setLabel] = useState('基地');
  const svgRef = useRef();
  const h = (VW * (data.h || 1)) / (data.w || 1);

  const pt = (e) => {
    const r = svgRef.current.getBoundingClientRect();
    return [((e.clientX - r.left) / r.width) * VW, ((e.clientY - r.top) / r.height) * h];
  };
  const finish = () => {
    if (draft.length >= 3) setShapes((s) => [...s, { type: 'poly', style: tool, pts: draft }]);
    setDraft([]);
  };
  const click = (e) => {
    const p = pt(e);
    if (tool === 'text') {
      if (label.trim()) setShapes((s) => [...s, { type: 'text', x: p[0], y: p[1], text: label.trim() }]);
      return;
    }
    const last = draft[draft.length - 1];
    if (last && Math.hypot(p[0] - last[0], p[1] - last[1]) < 5) return;
    if (draft.length >= 3) {
      const d = Math.hypot(p[0] - draft[0][0], p[1] - draft[0][1]);
      if (d < 18) return finish();
    }
    setDraft((d) => [...d, p]);
  };
  const undo = () => (draft.length ? setDraft((d) => d.slice(0, -1)) : setShapes((s) => s.slice(0, -1)));

  useEffect(() => {
    const k = (e) => {
      if (e.key === 'Enter') finish();
      if (e.key === 'Escape') setDraft([]);
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') { e.preventDefault(); undo(); }
    };
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  });

  const tools = [
    { id: 'site', name: '紅線＝基地範圍', icon: LuPentagon, c: 'text-red-600' },
    { id: 'neighbor', name: '藍虛線＝鄰地／退縮', icon: LuSquareDashed, c: 'text-blue-600' },
    { id: 'text', name: '文字標籤', icon: LuType, c: 'text-navy-700' },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex flex-col">
      <div className="bg-white flex items-center gap-2 px-4 py-2 shadow">
        <span className="font-semibold text-navy-800 mr-3">標註：{title}</span>
        {tools.map((t) => (
          <button key={t.id} onClick={() => { finish(); setTool(t.id); }}
            className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm border cursor-pointer ${tool === t.id ? 'border-navy-600 bg-navy-700/10' : 'border-oat-300 bg-white hover:bg-oat-100'}`}>
            <t.icon className={`w-4 h-4 ${t.c}`} /> {t.name}
          </button>
        ))}
        {tool === 'text' && (
          <input className="rounded-md border border-oat-300 px-2 py-1 text-sm w-40" value={label} onChange={(e) => setLabel(e.target.value)} placeholder="標籤文字" />
        )}
        {tool !== 'text' && draft.length >= 3 && <Btn small variant="primary" icon={LuCheck} onClick={finish}>完成此框（Enter）</Btn>}
        <div className="flex-1" />
        <Btn icon={LuUndo2} onClick={undo}>復原</Btn>
        <Btn icon={LuEraser} variant="danger" onClick={() => { setShapes([]); setDraft([]); }}>清除</Btn>
        <Btn icon={LuCheck} variant="primary" onClick={() => onSave(draft.length >= 3 ? [...shapes, { type: 'poly', style: tool, pts: draft }] : shapes)}>儲存</Btn>
        <Btn icon={LuX} variant="ghost" onClick={onClose}>取消</Btn>
      </div>
      <div className="text-xs text-oat-100 px-4 py-1.5">
        {tool === 'text' ? '在圖上點一下放置文字。' : '在圖上逐點點擊描框；點回黃色起點、按 Enter 或「完成此框」即可封閉。Ctrl+Z 復原、Esc 取消目前框線。'}
      </div>
      <div className="flex-1 overflow-auto flex items-start justify-center p-4">
        {url && (
          <div className="relative inline-block" style={{ maxWidth: '100%' }}>
            <img src={url} className="block max-h-[calc(100vh-140px)] w-auto max-w-full select-none" draggable={false} alt="" />
            <svg ref={svgRef} viewBox={`0 0 ${VW} ${h}`} className="absolute inset-0 w-full h-full cursor-crosshair" onClick={click} onDoubleClick={finish}>
              <Shapes shapes={shapes} h={h} draft={draft} style={tool} />
            </svg>
          </div>
        )}
      </div>
    </div>
  );
}
