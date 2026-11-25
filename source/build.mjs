import * as esbuild from 'esbuild';
import { compile } from 'tailwindcss';
import fs from 'fs'; import path from 'path';
import sharp from 'sharp';
const out = 'dist'; fs.mkdirSync(out, { recursive: true });
const r = await esbuild.build({ entryPoints: ['src/main.jsx'], bundle: true, minify: true, write: false, format: 'iife',
  jsx: 'automatic', define: { 'process.env.NODE_ENV': '"production"' }, loader: { '.js': 'jsx' }, legalComments: 'none' });
const js = r.outputFiles[0].text;
// tailwind candidates
const files = []; const walk = (d) => fs.readdirSync(d).forEach((f) => { const p = path.join(d, f); fs.statSync(p).isDirectory() ? walk(p) : /\.(jsx?|css)$/.test(f) && files.push(p); });
walk('src');
const cand = new Set(); for (const f of files) for (const t of fs.readFileSync(f, 'utf8').split(/[\s"'`{}(),;=<>]+/)) if (t) cand.add(t);
const tw = 'node_modules/tailwindcss/';
const c = await compile(fs.readFileSync('src/styles.css', 'utf8'), { base: '.', loadStylesheet: async (id, b) => {
  const f = id === 'tailwindcss' ? tw + 'index.css' : id.startsWith('tailwindcss/') ? tw + id.slice(12) : path.resolve(b, id);
  return { path: f, base: path.dirname(f), content: fs.readFileSync(f, 'utf8') }; } });
let css = c.build([...cand]);
css = (await esbuild.transform(css, { loader: 'css', minify: true })).code;
const html = `<!DOCTYPE html>
<html lang="zh-Hant-TW"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>都更投報評估系統</title><meta name="theme-color" content="#121f33">
<link rel="manifest" href="manifest.webmanifest"><link rel="icon" href="icon-192.png"><link rel="apple-touch-icon" href="icon-192.png">
<style>${css}</style></head><body><div id="root"></div><script>${js.replace(/<\/script/g, '<\\/script')}</script></body></html>`;
fs.writeFileSync(out + '/index.html', html);
const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><rect width="512" height="512" rx="96" fill="#121f33"/><g fill="none" stroke="#fcd34d" stroke-width="26" stroke-linejoin="round"><path d="M136 400V176l88-48v272M224 400V96l152 72v232"/><path d="M104 400h304"/></g><g fill="#f4f1ea"><rect x="264" y="200" width="30" height="30"/><rect x="314" y="200" width="30" height="30"/><rect x="264" y="260" width="30" height="30"/><rect x="314" y="260" width="30" height="30"/><rect x="264" y="320" width="30" height="30"/><rect x="314" y="320" width="30" height="30"/></g></svg>`;
for (const s of [192, 512]) await sharp(Buffer.from(svg)).resize(s, s).png().toFile(`${out}/icon-${s}.png`);
fs.writeFileSync(out + '/manifest.webmanifest', JSON.stringify({ name: '都更投報評估系統', short_name: '都更投報', start_url: './', scope: './', display: 'standalone',
  background_color: '#f4f1ea', theme_color: '#121f33', lang: 'zh-TW',
  icons: [{ src: 'icon-192.png', sizes: '192x192', type: 'image/png' }, { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' }] }, null, 1));
const ver = Date.now().toString(36);
fs.writeFileSync(out + '/sw.js', `const C='urp-${ver}';const A=['./','./index.html','./manifest.webmanifest','./icon-192.png','./icon-512.png'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(C).then(c=>c.addAll(A)).then(()=>self.skipWaiting()))});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==C).map(x=>caches.delete(x)))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',e=>{if(e.request.method!=='GET'||new URL(e.request.url).origin!==location.origin)return;
e.respondWith(fetch(e.request).then(r=>{const cp=r.clone();caches.open(C).then(c=>c.put(e.request,cp));return r}).catch(()=>caches.match(e.request).then(r=>r||caches.match('./index.html'))))});
`);
console.log('built', (html.length / 1024).toFixed(0) + 'KB', 'css', (css.length / 1024).toFixed(0) + 'KB');
