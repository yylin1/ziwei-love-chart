'use client';

import { astro } from 'iztro';
import type { IFunctionalAstrolabe } from 'iztro/lib/astro/FunctionalAstrolabe';
import type { IFunctionalHoroscope } from 'iztro/lib/astro/FunctionalHoroscope';
import type { PalaceName } from 'iztro/lib/i18n';
import { ArrowLeft, ArrowUp, Bot, CalendarDays, ChevronDown, Compass, LockKeyhole, MessageCircleQuestion, RotateCcw, Send, Sparkles } from 'lucide-react';
import { FormEvent, useMemo, useState } from 'react';

const HOURS = ['早子時 00:00–00:59','丑時 01:00–02:59','寅時 03:00–04:59','卯時 05:00–06:59','辰時 07:00–08:59','巳時 09:00–10:59','午時 11:00–12:59','未時 13:00–14:59','申時 15:00–16:59','酉時 17:00–18:59','戌時 19:00–20:59','亥時 21:00–22:59','晚子時 23:00–23:59'];
const PALACES: PalaceName[] = ['命宮','兄弟','夫妻','子女','財帛','疾厄','遷移','僕役','官祿','田宅','福德','父母'];
const SUGGESTIONS = ['我適合什麼工作方式？','感情中要注意什麼？','今年該專注哪個面向？','命宮空宮要怎麼看？'];
const CONTEXT_SCOPES = [
  { key: 'decadal', label: '大限' },
  { key: 'yearly', label: '流年' },
  { key: 'monthly', label: '流月' },
  { key: 'daily', label: '流日' },
  { key: 'hourly', label: '流時' },
] as const;
const NVIDIA_ENDPOINT = 'https://inference-api.nvidia.com/v1/chat/completions';
const NVIDIA_MODEL = 'nvidia/moonshotai/kimi-k3';

const STAR_GUIDE: Record<string, { strength: string; reminder: string }> = {
  紫微:{strength:'整合資源與承擔主導角色',reminder:'標準高時，也要聽見不同意見'},天機:{strength:'分析、規劃與快速調整',reminder:'想法多時先排定優先順序'},太陽:{strength:'公開表達與帶動他人',reminder:'照顧全局時別過度消耗'},武曲:{strength:'務實執行與資源管理',reminder:'解決問題之外也要回應感受'},天同:{strength:'同理協調與營造舒服氛圍',reminder:'不要為了和諧延後必要決定'},廉貞:{strength:'策略判斷與界線意識',reminder:'減少試探，直接說清期待'},天府:{strength:'穩定承接與長期經營',reminder:'求穩之餘保留合理變化'},太陰:{strength:'細膩觀察與感受力',reminder:'不確定時用具體資訊降低內耗'},貪狼:{strength:'人際魅力與探索動力',reminder:'選項多時要建立界線'},巨門:{strength:'研究辨析與溝通表達',reminder:'先傾聽再釐清彼此定義'},天相:{strength:'公平協調與品質把關',reminder:'不要為維持和諧壓低需求'},天梁:{strength:'原則判斷與照顧支持',reminder:'幫助他人前先分清責任'},七殺:{strength:'果斷突破與面對挑戰',reminder:'重大變化前保留緩衝'},破軍:{strength:'改革重整與重新開始',reminder:'改變要有節奏，不必一次推翻全部'},
};

type Gender = '男' | '女';
type Message = { role: 'assistant' | 'user'; text: string; basis?: string[] };
type ShiftUnit = 'year' | 'month' | 'day' | 'hour';

function buildAiPayload(chart: IFunctionalAstrolabe, horoscope: IFunctionalHoroscope, birthTimeIndex: number, contextTimeIndex: number, contextDate: string, question: string, model: string) {
  return {
    schemaVersion: 'ziwei-query.v1',
    model: model || undefined,
    generatedAt: new Date().toISOString(),
    instruction: [
      '請以繁體中文回答，先回答問題，再列出使用到的宮位、星曜與運限依據。',
      'natalChart.palaces 是本命十二宮；queryHoroscope 的各 scope 中，palaceNames[index] 與 stars[index] 對應同一個本命宮位索引。',
      '請區分本命傾向與大限、流年、流月、流日、流時，不把活躍訊號描述成必然事件。',
      '若資料不足，請明確說明限制；不要推測姓名、外貌、疾病、死亡或保證婚姻結果。',
    ],
    question,
    subject: {
      solarDate: chart.solarDate,
      lunarDate: chart.lunarDate,
      birthTimeIndex,
      birthTimeLabel: HOURS[birthTimeIndex],
      gender: chart.gender,
      fiveElementsClass: chart.fiveElementsClass,
      zodiac: chart.zodiac,
      sign: chart.sign,
      soul: chart.soul,
      body: chart.body,
    },
    queryContext: {
      requestedDate: contextDate,
      timeIndex: contextTimeIndex,
      timeLabel: HOURS[contextTimeIndex],
      resolvedSolarDate: horoscope.solarDate,
      resolvedLunarDate: horoscope.lunarDate,
    },
    natalChart: chart.toJSON(),
    queryHoroscope: horoscope.toJSON(),
    source: { engine: 'iztro', version: '2.6.0', locale: 'zh-TW' },
  };
}

function readAiResponse(data: unknown) {
  if (!data || typeof data !== 'object') return null;
  const value = data as { answer?: unknown; output_text?: unknown; basis?: unknown; choices?: Array<{ message?: { content?: unknown } }> };
  const text = typeof value.answer === 'string' ? value.answer
    : typeof value.output_text === 'string' ? value.output_text
      : typeof value.choices?.[0]?.message?.content === 'string' ? value.choices[0].message.content : null;
  return text ? { text, basis: Array.isArray(value.basis) ? value.basis.filter((item): item is string => typeof item === 'string') : ['外部 AI・依完整命盤與問盤時間回答'] } : null;
}

function makeChart(date: string, hour: number, gender: Gender) {
  return astro.bySolar(date, hour, gender, true, 'zh-TW') as IFunctionalAstrolabe;
}

function palaceContext(chart: IFunctionalAstrolabe, name: PalaceName) {
  const palace = chart.palace(name)!;
  const opposite = chart.surroundedPalaces(name).opposite;
  const borrowed = palace.majorStars.length === 0;
  const stars = borrowed ? opposite.majorStars : palace.majorStars;
  return { palace, stars, borrowed, opposite };
}

function formatDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

function shiftDate(value: string, unit: Exclude<ShiftUnit, 'hour'>, amount: number) {
  const next = new Date(`${value}T00:00:00Z`);
  if (unit === 'year') next.setUTCFullYear(next.getUTCFullYear() + amount);
  if (unit === 'month') next.setUTCMonth(next.getUTCMonth() + amount);
  if (unit === 'day') next.setUTCDate(next.getUTCDate() + amount);
  return formatDate(next);
}

function answerFor(chart: IFunctionalAstrolabe, horoscope: IFunctionalHoroscope, contextDate: string, question: string) {
  const q = question.trim();
  let palaceName: PalaceName = '命宮';
  let topic = '你的核心反應模式';
  if (/感情|愛情|伴侶|正緣|結婚|夫妻/.test(q)) { palaceName = '夫妻'; topic = '親密關係中的需要與互動'; }
  else if (/工作|事業|職涯|轉職|適合做/.test(q)) { palaceName = '官祿'; topic = '工作方式與職涯選擇'; }
  else if (/財|收入|金錢|投資/.test(q)) { palaceName = '財帛'; topic = '資源與金錢管理方式'; }
  else if (/健康|壓力|身體|睡眠/.test(q)) { palaceName = '疾厄'; topic = '壓力反應與生活節奏'; }
  else if (/朋友|合作|人際|同事/.test(q)) { palaceName = '僕役'; topic = '人際合作與界線'; }
  else if (/家人|家庭|父母/.test(q)) { palaceName = '父母'; topic = '家庭互動與承接的期待'; }
  else if (/內心|快樂|情緒|精神/.test(q)) { palaceName = '福德'; topic = '內在需求與恢復方式'; }

  const context = palaceContext(chart, palaceName);
  const starNames = context.stars.map((star) => star.name);
  const guides = starNames.map((name) => STAR_GUIDE[name]).filter(Boolean);
  const strengths = guides.map((guide) => guide.strength).slice(0, 2).join('、') || '從實際經驗中逐步辨認適合自己的節奏';
  const reminders = guides.map((guide) => guide.reminder).slice(0, 2).join('；') || '不要只靠單一星曜下結論，應和現況交叉驗證';
  const mutagens = context.stars.filter((star) => star.mutagen).map((star) => `${star.name}化${star.mutagen}`);
  const borrowedText = context.borrowed ? `${palaceName}是空宮，本題借看對宮「${context.opposite.name}」的主星。` : '';
  const flowSignals = CONTEXT_SCOPES.flatMap(({key,label}) => {
    const scope = horoscope[key];
    const index = scope.palaceNames.indexOf(palaceName);
    return (scope.stars?.[index] ?? []).map((star) => `${label}${star.name}`);
  }).slice(0, 6);
  const timingText = `目前問盤上下文是 ${contextDate}・${horoscope.hourly.heavenlyStem}${horoscope.hourly.earthlyBranch}時，落在${horoscope.decadal.heavenlyStem}${horoscope.decadal.earthlyBranch}大限、${horoscope.yearly.heavenlyStem}${horoscope.yearly.earthlyBranch}流年。${flowSignals.length ? `此題相關流曜有${flowSignals.join('、')}。` : '此題宮位沒有額外流曜集中，先以本命傾向為主。'}這些代表議題活躍度，不等於事件必然發生。`;
  return {
    text: `這題先看「${palaceName}」，主題是${topic}。${borrowedText}以${starNames.join('、') || '對宮星系'}來看，你較能運用${strengths}。實際行動上，先留意：${reminders}。\n\n${timingText}\n\n建議你把問題再縮小成一個可驗證情境，例如「未來三個月該主動認識新人，還是先整理關係界線？」回答會更有用。`,
    basis: [`${palaceName}：${starNames.join('・') || '空宮'}`, context.borrowed ? `借看${context.opposite.name}` : '本宮主星', `${horoscope.yearly.heavenlyStem}${horoscope.yearly.earthlyBranch}流年`, ...(mutagens.length ? mutagens : flowSignals.length ? flowSignals.slice(0, 2) : ['本命基礎'])],
  };
}

export default function ConsultPage() {
  const [date, setDate] = useState('1990-08-17');
  const [hour, setHour] = useState(6);
  const [gender, setGender] = useState<Gender>('男');
  const [chart, setChart] = useState(() => makeChart('1990-08-17', 6, '男'));
  const [contextDate, setContextDate] = useState('2026-09-03');
  const [contextHour, setContextHour] = useState(6);
  const [question, setQuestion] = useState('');
  const [apiToken, setApiToken] = useState('');
  const [tokenDraft, setTokenDraft] = useState('');
  const [isAsking, setIsAsking] = useState(false);
  const [messages, setMessages] = useState<Message[]>([{role:'assistant',text:'命盤已準備好。你可以從下方題目開始，或直接問一個和自己目前處境有關的問題。我會說明參考宮位與星曜，不把解讀說成必然結果。'}]);
  const overview = useMemo(() => (['命宮','官祿','夫妻','福德'] as PalaceName[]).map((name) => palaceContext(chart, name)), [chart]);
  const horoscope = useMemo(() => chart.horoscope(contextDate, contextHour), [chart, contextDate, contextHour]);

  function moveContext(unit: ShiftUnit, amount: number) {
    if (unit !== 'hour') { setContextDate((value) => shiftDate(value, unit, amount)); return; }
    setContextHour((value) => {
      const next = value + amount;
      if (next < 0) { setContextDate((dateValue) => shiftDate(dateValue, 'day', -1)); return 12; }
      if (next > 12) { setContextDate((dateValue) => shiftDate(dateValue, 'day', 1)); return 0; }
      return next;
    });
  }

  function updateChart(event: FormEvent) {
    event.preventDefault();
    try {
      setChart(makeChart(date, hour, gender));
      setMessages([{role:'assistant',text:'命盤已更新。請選一個方向，或描述你現在真正想處理的問題。'}]);
    } catch { setMessages((items) => [...items,{role:'assistant',text:'出生日期無法排盤，請重新核對後再試一次。'}]); }
  }

  async function ask(text = question) {
    const clean = text.trim();
    if (!clean || isAsking || !apiToken) return;
    setMessages((items) => [...items,{role:'user',text:clean}]);
    setQuestion('');
    setIsAsking(true);
    try {
      const payload = buildAiPayload(chart, horoscope, hour, contextHour, contextDate, clean, NVIDIA_MODEL);
      const localContext = answerFor(chart, horoscope, contextDate, clean);
      const response = await fetch(NVIDIA_ENDPOINT, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${apiToken}`, 'Content-Type': 'application/json' },
        credentials: 'omit',
        body: JSON.stringify({
          model: NVIDIA_MODEL,
          messages: [
            { role: 'system', content: `${payload.instruction.join('\n')}\n請將回答整理成「直接回答、本命依據、運限依據、現在建議、限制」五段；不可把命理描述成科學定論。` },
            { role: 'user', content: `問題：${clean}\n\n本機規則抽取的初步脈絡：${localContext.text}\n\n完整紫微資料：${JSON.stringify(payload)}` },
          ],
          max_tokens: 1400,
          temperature: 0.35,
          stream: false,
        }),
      });
      if (!response.ok) throw new Error(response.status === 401 ? 'NVIDIA token 無效或已失效' : `NVIDIA API HTTP ${response.status}`);
      const raw = await response.text();
      let parsed: unknown;
      try { parsed = JSON.parse(raw); } catch { parsed = { answer: raw }; }
      const answer = readAiResponse(parsed);
      if (!answer) throw new Error('回應缺少 answer');
      setMessages((items) => [...items,{role:'assistant',...answer}]);
    } catch (error) {
      const reason = error instanceof Error ? error.message : '未知錯誤';
      setMessages((items) => [...items,{role:'assistant',text:`NVIDIA AI 暫時無法回答（${reason}）。請確認自己的 token 仍有效後再試一次。`,basis:['連線失敗・未改用本機文字冒充 AI']}]);
    } finally {
      setIsAsking(false);
    }
    requestAnimationFrame(() => document.querySelector('.chat-log-end')?.scrollIntoView({behavior:'smooth',block:'end'}));
  }

  return <main className="consult-page">
    <header className="consult-header"><a href="../" className="brand"><span className="brand-mark">紫</span><span><b>紫微命盤</b><small>ZI WEI CHART</small></span></a><a href="../"><ArrowLeft size={15}/> 返回完整命盤</a></header>
    <section className="consult-title"><span className="eyebrow"><Sparkles size={14}/> NVIDIA KIMI K3・命盤問答</span><h1>問你的命盤，<em>也看見答案依據。</em></h1><p>{apiToken ? 'NVIDIA AI 已啟用；提問時會直接傳送完整命盤、問盤時間與問題。' : '使用自己的 NVIDIA token 啟用 AI；token 只保留在目前分頁，重新整理即清除。'}</p></section>
    <form className="consult-inputs" onSubmit={updateChart}>
      <div><small>目前命盤</small><b>{chart.solarDate}・{chart.gender}命・{chart.fiveElementsClass}</b></div>
      <label><span>國曆生日</span><div className="control"><CalendarDays size={16}/><input type="date" value={date} onChange={(event) => setDate(event.target.value)} required/></div></label>
      <label><span>出生時辰</span><div className="control"><select value={hour} onChange={(event) => setHour(Number(event.target.value))}>{HOURS.map((label,index) => <option value={index} key={label}>{label}</option>)}</select><ChevronDown size={15}/></div></label>
      <fieldset><legend>性別</legend><div className="gender-choice"><button type="button" className={gender === '男' ? 'selected' : ''} onClick={() => setGender('男')}>男</button><button type="button" className={gender === '女' ? 'selected' : ''} onClick={() => setGender('女')}>女</button></div></fieldset>
      <button type="submit"><RotateCcw size={15}/> 更新命盤</button>
    </form>

    <section className="context-bar" aria-label="當前問盤上下文">
      <div className="context-bar-heading"><span>當前問盤上下文</span><small>右側回答會同步使用這個時間</small></div>
      <div className="context-controls">
        <button type="button" onClick={() => moveContext('year',-10)}>−10年</button><button type="button" onClick={() => moveContext('year',-1)}>−1年</button><button type="button" onClick={() => moveContext('month',-1)}>−1月</button><button type="button" onClick={() => moveContext('day',-1)}>−1日</button><button type="button" onClick={() => moveContext('hour',-1)}>−1時</button>
        <label><span className="sr-only">問盤日期</span><input type="date" value={contextDate} onChange={(event) => setContextDate(event.target.value)}/></label><strong>{horoscope.hourly.earthlyBranch}</strong>
        <button type="button" onClick={() => moveContext('hour',1)}>+1時</button><button type="button" onClick={() => moveContext('day',1)}>+1日</button><button type="button" onClick={() => moveContext('month',1)}>+1月</button><button type="button" onClick={() => moveContext('year',1)}>+1年</button><button type="button" onClick={() => moveContext('year',10)}>+10年</button><button type="button" onClick={() => {const now = new Date();setContextDate(formatDate(now));setContextHour(now.getHours() === 23 ? 12 : Math.ceil(now.getHours()/2));}}>今日</button>
      </div>
      <div className="context-summary"><span>陽曆 <b>{horoscope.solarDate}</b></span><span>農曆 <b>{horoscope.lunarDate}</b></span>{CONTEXT_SCOPES.map(({key,label}) => <span key={key}>{label} <b>{horoscope[key].heavenlyStem}{horoscope[key].earthlyBranch}</b></span>)}</div>
    </section>

    <section className="consult-workspace">
      <div className="consult-chart">
        <div className="consult-section-heading"><div><span className="eyebrow">CURRENT CHART</span><h2>命盤問答脈絡</h2></div><span><LockKeyhole size={13}/> 僅瀏覽器內計算</span></div>
        <div className="consult-overview">{overview.map(({palace,stars,borrowed,opposite}) => <article key={palace.name}><small>{palace.name}</small><h3>{stars.map((star) => star.name).join('・') || '無主星'}</h3><p>{borrowed ? `空宮，借看${opposite.name}` : '本宮主星'}{stars.some((star) => star.mutagen) ? `・${stars.filter((star) => star.mutagen).map((star) => `${star.name}化${star.mutagen}`).join('、')}` : ''}</p></article>)}</div>
        <div className="consult-palaces">{PALACES.map((name) => { const item = palaceContext(chart,name); const palaceIndex = chart.palaces.findIndex((palace) => palace.name === name); const flowStars = CONTEXT_SCOPES.flatMap(({key}) => horoscope[key].stars?.[palaceIndex] ?? []).map((star) => star.name).slice(0,5); return <article key={name}><div><span>{item.palace.heavenlyStem}{item.palace.earthlyBranch}</span><b>{name}</b></div><p>{item.stars.map((star) => star.name).join('・') || '空宮'}</p><div className="palace-context-tags">{CONTEXT_SCOPES.slice(0,3).map(({key,label}) => <span key={key}>{label}・{horoscope[key].palaceNames[palaceIndex]?.replace('宮','')}</span>)}</div>{flowStars.length > 0 && <div className="palace-flow-stars">{flowStars.join('・')}</div>}<small>{item.borrowed ? `借 ${item.opposite.name}` : item.palace.changsheng12}</small></article>; })}</div>
        <div className="consult-method"><Compass size={18}/><p><b>回答方式</b>：先辨認問題所屬宮位，再看本宮或空宮借星、星曜特質及四化。建議文字是本站規則映射，不是 iztro 的原始解盤，也不取代專業意見。</p></div>
      </div>

      <aside className="chat-panel">
        <div className="chat-heading"><div className="chat-bot"><Bot size={21}/></div><div><small>命盤 AI 問答・{contextDate}</small><h2>想先了解什麼？</h2></div><span>{horoscope.yearly.heavenlyStem}{horoscope.yearly.earthlyBranch}流年</span></div>
        <div className={`nvidia-token-bar ${apiToken ? 'is-ready' : ''}`}>{apiToken ? <><span><i/> NVIDIA AI 已啟用・Kimi K3</span><button type="button" onClick={() => {setApiToken('');setTokenDraft('');}}>清除 token</button></> : <><label htmlFor="nvidia-token"><LockKeyhole size={13}/><span><b>輸入自己的 NVIDIA token</b><small>只存於目前分頁，不會寫入 GitHub</small></span></label><div><input id="nvidia-token" type="password" value={tokenDraft} onChange={(event) => setTokenDraft(event.target.value)} placeholder="nvapi-… 或 sk-…" autoComplete="off" spellCheck={false}/><button type="button" disabled={!tokenDraft.trim()} onClick={() => {setApiToken(tokenDraft.trim());setMessages((items) => [...items,{role:'assistant',text:'NVIDIA AI 已啟用。現在提問時，我會把完整命盤與目前問盤時間一起送出分析。',basis:[NVIDIA_MODEL,'token 僅保留於目前分頁']}]);}}>啟用 AI</button></div></>}</div>
        <div className="chat-suggestions">{SUGGESTIONS.map((item) => <button type="button" key={item} onClick={() => apiToken ? ask(item) : setQuestion(item)}>{item}<ArrowUp size={12}/></button>)}</div>
        <div className="chat-log" aria-live="polite">{messages.map((message,index) => <div className={`chat-message ${message.role}`} key={`${message.role}-${index}`}><span>{message.role === 'assistant' ? <Bot size={14}/> : '你'}</span><div><p>{message.text}</p>{message.basis && <div className="answer-basis">{message.basis.map((item) => <small key={item}>{item}</small>)}</div>}</div></div>)}{isAsking && <div className="chat-loading"><Bot size={14}/><span>正在整理命盤脈絡並等待 AI 回覆…</span></div>}<i className="chat-log-end"/></div>
        <form className="chat-compose" onSubmit={(event) => {event.preventDefault();ask();}}><label htmlFor="chart-question">問本命盤</label><textarea id="chart-question" value={question} onChange={(event) => setQuestion(event.target.value)} placeholder="例如：感情中我容易忽略什麼？" rows={3}/><div><span><MessageCircleQuestion size={13}/> {apiToken ? '命盤會直接送往 NVIDIA 分析' : '請先輸入自己的 NVIDIA token'}</span><button type="submit" disabled={!apiToken || !question.trim() || isAsking}><Send size={14}/> {isAsking ? '分析中' : '提問'}</button></div></form>
      </aside>
    </section>
  </main>;
}
