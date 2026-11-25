import { useEffect, useState } from 'react';
import { newProject, uid } from './defaults.js';
import { DEFAULT_COST_TABLES } from './costTable.js';

const KEY = 'urp-eval-v2';

export function loadState() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const s = JSON.parse(raw);
      if (s.projects?.length) return s;
    }
  } catch (e) { /* ignore */ }
  const p = newProject({ name: '新專案' });
  return { projects: [p], currentId: p.id };
}

export function saveState(s) {
  try { localStorage.setItem(KEY, JSON.stringify(s)); return true; } catch (e) { return false; }
}

/* ---------- IndexedDB 圖片 ---------- */
let dbp;
function db() {
  if (!dbp) {
    dbp = new Promise((res, rej) => {
      const r = indexedDB.open('urp-images', 1);
      r.onupgradeneeded = () => r.result.createObjectStore('img');
      r.onsuccess = () => res(r.result);
      r.onerror = () => rej(r.error);
    });
  }
  return dbp;
}
const cache = new Map();
export async function putImage(id, dataUrl) {
  cache.set(id, dataUrl);
  const d = await db();
  return new Promise((res, rej) => {
    const t = d.transaction('img', 'readwrite');
    t.objectStore('img').put(dataUrl, id);
    t.oncomplete = () => res();
    t.onerror = () => rej(t.error);
  });
}
export async function getImage(id) {
  if (cache.has(id)) return cache.get(id);
  const d = await db();
  return new Promise((res) => {
    const r = d.transaction('img').objectStore('img').get(id);
    r.onsuccess = () => { if (r.result) cache.set(id, r.result); res(r.result || null); };
    r.onerror = () => res(null);
  });
}
export async function delImage(id) {
  cache.delete(id);
  const d = await db();
  d.transaction('img', 'readwrite').objectStore('img').delete(id);
}
export function useImage(id) {
  const [url, setUrl] = useState(id ? cache.get(id) || null : null);
  useEffect(() => {
    let on = true;
    if (!id) { setUrl(null); return; }
    getImage(id).then((u) => on && setUrl(u));
    return () => { on = false; };
  }, [id]);
  return url;
}

/* 壓縮圖片 → dataURL */
export function fileToDataUrl(file, max = 1800) {
  return new Promise((res, rej) => {
    const fr = new FileReader();
    fr.onload = () => {
      const img = new Image();
      img.onload = () => {
        const sc = Math.min(1, max / Math.max(img.width, img.height));
        const w = Math.round(img.width * sc), h = Math.round(img.height * sc);
        const c = document.createElement('canvas');
        c.width = w; c.height = h;
        const ctx = c.getContext('2d');
        ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, w, h);
        ctx.drawImage(img, 0, 0, w, h);
        res({ dataUrl: c.toDataURL('image/jpeg', 0.88), w, h });
      };
      img.onerror = rej;
      img.src = fr.result;
    };
    fr.onerror = rej;
    fr.readAsDataURL(file);
  });
}

/* ---------- 匯出／匯入 ---------- */
export async function exportProjects(projects) {
  const images = {};
  for (const p of projects) {
    for (const v of Object.values(p.images || {})) {
      if (v?.imgId) images[v.imgId] = await getImage(v.imgId);
    }
  }
  return { app: 'urban-renewal-eval', version: 1, exportedAt: new Date().toISOString(), projects, images };
}

export async function importBundle(json) {
  const data = typeof json === 'string' ? JSON.parse(json) : json;
  const list = data.projects || (data.id ? [data] : []);
  const idMap = {};
  for (const [id, url] of Object.entries(data.images || {})) {
    if (!url) continue;
    const nid = uid();
    idMap[id] = nid;
    await putImage(nid, url);
  }
  return list.map((p) => {
    const q = JSON.parse(JSON.stringify(p));
    q.id = uid();
    for (const v of Object.values(q.images || {})) if (v?.imgId) v.imgId = idMap[v.imgId] || null;
    if (!q.costTables?.length) q.costTables = JSON.parse(JSON.stringify(DEFAULT_COST_TABLES));
    return q;
  });
}

export function download(name, text, type = 'application/json') {
  const b = new Blob([text], { type });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(b);
  a.download = name;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500);
}
