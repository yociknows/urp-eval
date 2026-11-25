import React from 'react';
import { LuShieldCheck, LuBuilding2, LuHandshake } from 'react-icons/lu';
import { Card, NumField, Select, Field, fmt, pct, Tip } from '../ui.jsx';
import { buildingRows, roadRows } from './Page1.jsx';

const roc = () => new Date().getFullYear() - 1911;

function Item({ ok, title, detail, auto }) {
  const c = ok === true ? 'border-emerald-200 bg-emerald-50' : ok === false ? 'border-red-200 bg-red-50' : 'border-oat-200 bg-oat-50';
  const icon = ok === true ? '✓' : ok === false ? '✗' : '？';
  const ic = ok === true ? 'text-emerald-700' : ok === false ? 'text-red-600' : 'text-stone-400';
  return (
    <div className={`rounded-md border px-3 py-2 ${c}`}>
      <div className="flex items-start gap-2">
        <span className={`font-bold ${ic}`}>{icon}</span>
        <div className="min-w-0">
          <div className="text-sm font-semibold text-stone-800">{title}{auto && <span className="ml-2 text-[10px] rounded bg-navy-700/10 text-navy-700 px-1.5 py-0.5 font-normal">自動判斷</span>}</div>
          <div className="text-xs text-stone-600 mt-0.5 leading-relaxed">{detail}</div>
        </div>
      </div>
    </div>
  );
}

export default function Page6({ project, up, res }) {
  const { ar } = res;
  const r = project.rebuild || {};
  const set = (k) => (v) => up((p) => { p.rebuild = p.rebuild || {}; p.rebuild[k] = v; });
  const { cad } = res;
  const bs = buildingRows(project.site);
  const ys = bs.map((b) => +b.builtYear).filter(Boolean);
  const minAge = ys.length ? roc() - Math.max(...ys) : null;
  const maxAge = ys.length ? roc() - Math.min(...ys) : null;
  const unreg = bs.filter((b) => b.type === '未保存登記').length;
  const area = cad.area;

  // ---- 都更：更新單元劃定基準（臺北市都更自治條例第12條，符合其一）----
  const roadsN = r.planRoads !== undefined && r.planRoads !== '' ? +r.planRoads : roadRows(project.site).filter((x) => +x.width > 0).length;
  const blockArea = +r.blockArea || 0;
  const bt = r.blockType || '';
  const blockChecks = [
    { k: 'whole', t: '①完整計畫街廓（無面積下限）', ok: bt === 'whole' ? true : null },
    { k: 'a2000', t: `②街廓內面積 ≧ 2,000㎡（本案 ${fmt(area, 0)}㎡）`, ok: area >= 2000 },
    { k: 'road2', t: `③臨 2 條以上計畫道路（${roadsN} 條）、面積 > 街廓 1/4${blockArea ? `（${fmt(blockArea / 4, 0)}㎡）` : '（街廓面積未填）'}、且 ≧ 1,000㎡`, ok: roadsN >= 2 && area >= 1000 ? (blockArea ? area > blockArea / 4 : null) : false },
    { k: 'built', t: '④相鄰土地已建築完成無法合併：≧1,000㎡；≧500㎡ 經審議會同意', ok: bt === 'built' ? (area >= 1000 ? true : area >= 500 ? null : false) : null },
    { k: 'cross', t: '⑤跨街廓：至少一街廓符合①～④並整體開發', ok: bt === 'cross' ? null : null },
  ];
  const urArea = !area ? null : blockChecks.some((x) => x.ok === true) ? true : blockChecks.some((x) => x.ok === null) ? null : false;
  const urUnit = r.urDesignated ? true : r.urUnitOk === 'yes' ? true : r.urUnitOk === 'no' ? false : null;
  const urConsentNeed = r.urDesignated ? 0.75 : 0.8;
  const urConsent = r.consentPeople === '' || r.consentPeople === undefined || r.consentArea === '' || r.consentArea === undefined ? null
    : +r.consentPeople >= urConsentNeed && +r.consentArea >= urConsentNeed;
  // ---- 危老 ----
  const evalR = r.structEval || '';
  const dangerOk = evalR === 'demolish' || evalR === 'lowest' ? true
    : evalR === 'seismic' ? (maxAge === null ? null : maxAge >= 30)
    : evalR === 'ok' ? false : null;
  const allConsent = r.consentPeople === '' || r.consentPeople === undefined ? null : +r.consentPeople >= 1 && (+r.consentArea || 0) >= 1;
  const legal = unreg ? null : bs.length ? true : null;

  // ---- 臺北市防災型都更 ----
  const idv = r.idValue === '' || r.idValue === undefined ? null : +r.idValue;
  const pre63 = bs.some((b) => b.type !== '未保存登記' && +b.builtYear && +b.builtYear <= 63);
  const seismicFlag = bs.some((b) => b.seismic);
  const dsSeismic = idv !== null ? idv < 0.35 : r.pre63Permit ? true : evalR === 'lowest' || evalR === 'demolish' ? true : (seismicFlag || pre63) ? null : null;
  const dsArea = !area ? null : area >= 1000;
  const totalRatio = 1 + ar.bonusNonTdr;
  const dsCap = totalRatio <= 2;
  const dsTdr = !(ar.tdr > 0);
  const verdict = (arr) => (arr.some((x) => x === false) ? false : arr.every((x) => x === true) ? true : null);
  const urV = verdict([urArea, urUnit, urConsent]);
  const dlV = verdict([dangerOk, allConsent]);
  const dsV = verdict([dsArea, legal, dsSeismic, urConsent]);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-navy-800">重建核心要件：走都更還是危老？</h1>
        <p className="text-sm text-stone-500 mt-1">基地面積、屋齡從第 1、2 頁自動帶入；評估結果與同意比例請依現況填寫。此頁為初步檢視，正式認定以主管機關為準。</p>
      </div>

      <Card title="現況輸入" icon={LuHandshake}>
        <div className="grid grid-cols-4 gap-4">
          <Field label="基地面積（自動）"><div className="rounded-md bg-oat-100 px-2 py-1 text-right text-sm">{fmt(area, 2)} ㎡</div></Field>
          <Field label="屋齡（自動，第1頁現況建物）"><div className="rounded-md bg-oat-100 px-2 py-1 text-right text-sm">{ys.length ? `${minAge}～${maxAge} 年` : '未填'}</div></Field>
          <Field label="結構安全性能評估結果" tip="危老三類：①限期拆除／危險之虞 ②評估未達最低等級 ③屋齡30年以上、耐震未達標且改善不具效益或無電梯">
            <Select value={evalR} onChange={set('structEval')} options={[
              { value: '', label: '尚未評估' },
              { value: 'demolish', label: '經通知限期拆除／危險之虞' },
              { value: 'lowest', label: '評估未達最低等級' },
              { value: 'seismic', label: '耐震未達標＋改善不具效益或無電梯' },
              { value: 'ok', label: '評估無疑慮（甲級）' },
            ]} />
          </Field>
          <Field label="更新單元狀態">
            <Select value={r.urDesignated ? 'designated' : r.urUnitOk || ''} onChange={(v) => up((p) => { p.rebuild = p.rebuild || {}; p.rebuild.urDesignated = v === 'designated'; p.rebuild.urUnitOk = v === 'designated' ? '' : v; })} options={[
              { value: '', label: '尚未檢討' },
              { value: 'designated', label: '位於政府劃定更新地區' },
              { value: 'yes', label: '自劃更新單元：指標符合' },
              { value: 'no', label: '自劃更新單元：指標不符' },
            ]} />
          </Field>
          <NumField label="所有權人同意比例（人數）" pct value={r.consentPeople} onChange={set('consentPeople')} tip="私有土地及合法建物所有權人同意人數比例" />
          <NumField label="所有權人同意比例（面積）" pct value={r.consentArea} onChange={set('consentArea')} tip="同意者之土地面積及建物樓地板面積比例" />
          <Field label="街廓情形" tip="臺北市都更自治條例第12條：更新單元劃定基準，符合其中一款即可">
            <Select value={bt} onChange={set('blockType')} options={[
              { value: '', label: '依面積／道路自動判斷' },
              { value: 'whole', label: '為完整計畫街廓' },
              { value: 'built', label: '相鄰土地已建築完成，無法合併' },
              { value: 'cross', label: '跨街廓更新單元' },
            ]} />
          </Field>
          <NumField label="所在街廓總面積" unit="㎡" value={r.blockArea} onChange={set('blockArea')} tip="用於第③款「面積大於該街廓 1/4」檢核" />
          <NumField label="臨接計畫道路數" unit="條" value={r.planRoads} onChange={set('planRoads')} placeholder={String(roadRows(project.site).filter((x) => +x.width > 0).length)} tip="預設帶入第1頁有填路寬的道路數；現有巷道非計畫道路請自行修正" />
          <NumField label="耐震評估 ID 值" value={r.idValue} onChange={set('idValue')} placeholder="初評或詳評" tip="防災型都更：ID 值 < 0.35 為耐震能力不足" />
          <label className="flex items-end gap-2 text-sm pb-1.5"><input type="checkbox" checked={!!r.pre63Permit} onChange={(e) => set('pre63Permit')(e.target.checked)} />63年2月15日前已申請建照（免鑑定）</label>
          <Field label="未保存登記建物（自動）"><div className="rounded-md bg-oat-100 px-2 py-1 text-right text-sm">{unreg} 棟</div></Field>
        </div>
      </Card>

      <div className="grid grid-cols-2 gap-5 items-start">
        <Card title="都市更新" icon={LuBuilding2} right={<Verdict v={urV} />}>
          <div className="space-y-2">
            <div className={`rounded-md border px-3 py-2 ${urArea === true ? 'border-emerald-200 bg-emerald-50' : urArea === false ? 'border-red-200 bg-red-50' : 'border-oat-200 bg-oat-50'}`}>
              <div className="text-sm font-semibold text-stone-800">{urArea === true ? '✓ ' : urArea === false ? '✗ ' : '？ '}更新單元劃定基準（街廓條件，符合其一即可）<span className="ml-2 text-[10px] rounded bg-navy-700/10 text-navy-700 px-1.5 py-0.5 font-normal">自動判斷</span></div>
              <ul className="mt-1 space-y-0.5">
                {blockChecks.map((x) => (
                  <li key={x.k} className={`text-xs ${x.ok === true ? 'text-emerald-700 font-semibold' : x.ok === false ? 'text-stone-400' : 'text-stone-600'}`}>{x.ok === true ? '✓' : x.ok === false ? '✗' : '・'} {x.t}</li>
                ))}
              </ul>
              <div className="text-[11px] text-stone-500 mt-1">另須避免剩餘鄰地成為無法單獨更新的畸零土地，否則需辦理鄰地協調。</div>
            </div>
            <Item ok={urUnit} title="更新地區／自劃更新單元指標"
              detail="位於政府劃定更新地區，或符合「臺北市自行劃定更新單元內重建區段之建築物及地區環境狀況評估標準」（建物老舊、耐震、消防、巷道等指標）。" />
            <Item ok={urConsent} title={`事業計畫同意比例 ≧ ${urConsentNeed * 100}%（人數及面積）`}
              detail={`自劃更新單元 4/5、劃定更新地區 3/4（事業概要 1/2）。目前：人數 ${r.consentPeople !== undefined && r.consentPeople !== '' ? pct(+r.consentPeople, 0) : '未填'}、面積 ${r.consentArea !== undefined && r.consentArea !== '' ? pct(+r.consentArea, 0) : '未填'}。`} />
            <Item ok={null} title="容積獎勵上限" detail="不得超過基準容積 1.5 倍，或原建築容積＋0.3 倍基準容積（第3頁「獎勵上限擇優」自動試算）。" />
            <Item ok={null} title="申請時效" detail="無申請期限；需經公展、公聽會、審議等法定程序，時程較長。" />
          </div>
        </Card>

        <Card title="危老重建" icon={LuShieldCheck} right={<Verdict v={dlV} />}>
          <div className="space-y-2">
            <Item auto={evalR === 'seismic'} ok={dangerOk} title="危險或老舊建築物認定"
              detail={evalR === 'seismic' ? `屋齡須 ≧ 30 年：目前最高屋齡 ${maxAge ?? '未填'} 年。` : '須符合三類之一：限期拆除／危險之虞、結構評估未達最低等級、屋齡30年以上耐震未達標且改善不具效益或無電梯。'} />
            <Item ok={legal} auto title="合法建築物"
              detail={unreg ? `含 ${unreg} 棟未保存登記建物：需先確認合法建物認定（已登記產權但無使照者，臺北市有簡化認定程序）。` : bs.length ? '現況建物均有使照或登記。' : '請在第 1 頁填現況建物。'} />
            <Item ok={allConsent} title="全體土地及合法建物所有權人 100% 同意"
              detail="危老重建計畫須取得全體同意，一戶不同意即無法申請。" />
            <Item auto ok={!area ? null : true} title="基地規模：無面積、街廓限制"
              detail={`不看是否為完整街廓，也不需鄰地協調。合併鄰地重建時，超過 1,000㎡ 的部分不給容積獎勵${area > 1000 ? `（本案 ${fmt(area, 0)}㎡，請留意）` : ''}；合併鄰地面積上限請依主管機關規定確認。`} />
            <Item ok={null} title="容積獎勵上限" detail="基準容積 1.3 倍或原建築容積 1.15 倍，另有時程、規模獎勵；不得再申請其他獎勵。" />
            <Item ok={null} title="申請期限" detail="116 年 5 月 31 日前受理（請留意是否再延長）。" />
          </div>
        </Card>
      </div>

      <Card title="臺北市防災型都更（危險建物獎勵 30%）" icon={LuShieldCheck} right={<Verdict v={dsV} />}
        tip="依「臺北市防災型都市更新細部計畫」（114.05.09 修訂版懶人包）整理；以都更方式重建、四項同時符合">
        <div className="grid grid-cols-2 gap-2">
          <Item auto ok={dsArea} title={`基地面積達 1,000㎡（可建築用地）：本案 ${fmt(area, 0)}㎡`} detail="未達 1,000㎡ 不適用本計畫。" />
          <Item auto ok={legal} title="屬合法建築物" detail="領有使照、領有合法建築物證明文件（含簡化認定）。" />
          <Item ok={dsSeismic} auto={idv !== null} title={`經鑑定為耐震能力不足（ID 值 < 0.35）${idv !== null ? `：本案 ${idv}` : ''}`}
            detail={`結構安全性能評估初評或詳評皆可；63年2月15日（不含）前已申請建照並領有使照者免鑑定。${pre63 && !r.pre63Permit && idv === null ? `第1頁有民國 ${Math.min(...ys)} 年完成的建物，可能適用免鑑定，請確認建照申請日期後勾選。` : ''}`} />
          <Item ok={urConsent} title="同意比率符合都更條例第 37 條" detail={`沿用上方都更同意比例：人數 ${r.consentPeople !== undefined && r.consentPeople !== '' ? pct(+r.consentPeople, 0) : '未填'}、面積 ${r.consentArea !== undefined && r.consentArea !== '' ? pct(+r.consentArea, 0) : '未填'}。`} />
          <Item auto ok={dsCap} title={`總容積上限：基準容積 2 倍（目前 ${totalRatio.toFixed(2)} 倍）`} detail="基準（或原建築容積）＋更新獎勵＋危險建物獎勵 30%，合計以基準容積二倍為上限。獎勵 % 在第 3 頁「防災獎勵」欄填 30%。" />
          <Item auto ok={dsTdr} title="不得再申請其他獎勵及容積移轉" detail={dsTdr ? '目前未設定容積移轉。' : `第 3 頁容積移轉設為 ${pct(ar.tdr, 0)}，與防災型都更不能併用。`} />
        </div>
      </Card>
    </div>
  );
}

function Verdict({ v }) {
  return (
    <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold border ${v === true ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : v === false ? 'bg-red-50 text-red-700 border-red-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>
      {v === true ? '初步可行' : v === false ? '目前不符' : '待確認'}
    </span>
  );
}
