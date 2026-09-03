'use client';

import { astro } from 'iztro';
import type { IFunctionalAstrolabe } from 'iztro/lib/astro/FunctionalAstrolabe';
import type { PalaceName } from 'iztro/lib/i18n';
import { ArrowLeft, ArrowUp, Bot, CalendarDays, ChevronDown, Compass, LockKeyhole, MessageCircleQuestion, RotateCcw, Send, Sparkles } from 'lucide-react';
import { FormEvent, useMemo, useState } from 'react';

const HOURS = ['早子時 00:00–00:59','丑時 01:00–02:59','寅時 03:00–04:59','卯時 05:00–06:59','辰時 07:00–08:59','巳時 09:00–10:59','午時 11:00–12:59','未時 13:00–14:59','申時 15:00–16:59','酉時 17:00–18:59','戌時 19:00–20:59','亥時 21:00–22:59','晚子時 23:00–23:59'];
const PALACES: PalaceName[] = ['命宮','兄弟','夫妻','子女','財帛','疾厄','遷移','僕役','官祿','田宅','福德','父母'];
const SUGGESTIONS = ['我適合什麼工作方式？','感情中要注意什麼？','今年該專注哪個面向？','命宮空宮要怎麼看？'];

const STAR_GUIDE: Record<string, { strength: string; reminder: string }> = {
  紫微:{strength:'整合資源與承擔主導角色',reminder:'標準高時，也要聽見不同意見'},天機:{strength:'分析、規劃與快速調整',reminder:'想法多時先排定優先順序'},太陽:{strength:'公開表達與帶動他人',reminder:'照顧全局時別過度消耗'},武曲:{strength:'務實執行與資源管理',reminder:'解決問題之外也要回應感受'},天同:{strength:'同理協調與營造舒服氛圍',reminder:'不要為了和諧延後必要決定'},廉貞:{strength:'策略判斷與界線意識',reminder:'減少試探，直接說清期待'},天府:{strength:'穩定承接與長期經營',reminder:'求穩之餘保留合理變化'},太陰:{strength:'細膩觀察與感受力',reminder:'不確定時用具體資訊降低內耗'},貪狼:{strength:'人際魅力與探索動力',reminder:'選項多時要建立界線'},巨門:{strength:'研究辨析與溝通表達',reminder:'先傾聽再釐清彼此定義'},天相:{strength:'公平協調與品質把關',reminder:'不要為維持和諧壓低需求'},天梁:{strength:'原則判斷與照顧支持',reminder:'幫助他人前先分清責任'},七殺:{strength:'果斷突破與面對挑戰',reminder:'重大變化前保留緩衝'},破軍:{strength:'改革重整與重新開始',reminder:'改變要有節奏，不必一次推翻全部'},
};

type Gender = '男' | '女';
type Message = { role: 'assistant' | 'user'; text: string; basis?: string[] };

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

function answerFor(chart: IFunctionalAstrolabe, question: string) {
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
  const timingText = /今年|流年|運勢|目前|現在/.test(q) ? `你現在虛歲約 ${new Date().getFullYear() - Number(chart.solarDate.slice(0,4)) + 1} 歲；年度問題還要再疊加流年，這裡先用本命提供方向，不把它說成必然事件。` : '';
  return {
    text: `這題先看「${palaceName}」，主題是${topic}。${borrowedText}以${starNames.join('、') || '對宮星系'}來看，你較能運用${strengths}。實際行動上，先留意：${reminders}。${timingText}\n\n建議你把問題再縮小成一個可驗證情境，例如「未來三個月該主動認識新人，還是先整理關係界線？」回答會更有用。`,
    basis: [`${palaceName}：${starNames.join('・') || '空宮'}`, context.borrowed ? `借看${context.opposite.name}` : '本宮主星', ...(mutagens.length ? mutagens : ['本命基礎'])],
  };
}

export default function ConsultPage() {
  const [date, setDate] = useState('1990-08-17');
  const [hour, setHour] = useState(6);
  const [gender, setGender] = useState<Gender>('男');
  const [chart, setChart] = useState(() => makeChart('1990-08-17', 6, '男'));
  const [question, setQuestion] = useState('');
  const [messages, setMessages] = useState<Message[]>([{role:'assistant',text:'命盤已準備好。你可以從下方題目開始，或直接問一個和自己目前處境有關的問題。我會說明參考宮位與星曜，不把解讀說成必然結果。'}]);
  const overview = useMemo(() => (['命宮','官祿','夫妻','福德'] as PalaceName[]).map((name) => palaceContext(chart, name)), [chart]);

  function updateChart(event: FormEvent) {
    event.preventDefault();
    try {
      setChart(makeChart(date, hour, gender));
      setMessages([{role:'assistant',text:'命盤已更新。請選一個方向，或描述你現在真正想處理的問題。'}]);
    } catch { setMessages((items) => [...items,{role:'assistant',text:'出生日期無法排盤，請重新核對後再試一次。'}]); }
  }

  function ask(text = question) {
    const clean = text.trim();
    if (!clean) return;
    const answer = answerFor(chart, clean);
    setMessages((items) => [...items,{role:'user',text:clean},{role:'assistant',...answer}]);
    setQuestion('');
    requestAnimationFrame(() => document.querySelector('.chat-log-end')?.scrollIntoView({behavior:'smooth',block:'end'}));
  }

  return <main className="consult-page">
    <header className="consult-header"><a href="../" className="brand"><span className="brand-mark">紫</span><span><b>紫微命盤</b><small>ZI WEI CHART</small></span></a><a href="../"><ArrowLeft size={15}/> 返回完整命盤</a></header>
    <section className="consult-title"><span className="eyebrow"><Sparkles size={14}/> BETA・本機智慧問答</span><h1>問你的命盤，<em>也看見答案依據。</em></h1><p>回答直接根據目前盤面的宮位與星曜組合產生；不連接外部 AI、不上傳出生資料。</p></section>
    <form className="consult-inputs" onSubmit={updateChart}>
      <div><small>目前命盤</small><b>{chart.solarDate}・{chart.gender}命・{chart.fiveElementsClass}</b></div>
      <label><span>國曆生日</span><div className="control"><CalendarDays size={16}/><input type="date" value={date} onChange={(event) => setDate(event.target.value)} required/></div></label>
      <label><span>出生時辰</span><div className="control"><select value={hour} onChange={(event) => setHour(Number(event.target.value))}>{HOURS.map((label,index) => <option value={index} key={label}>{label}</option>)}</select><ChevronDown size={15}/></div></label>
      <fieldset><legend>性別</legend><div className="gender-choice"><button type="button" className={gender === '男' ? 'selected' : ''} onClick={() => setGender('男')}>男</button><button type="button" className={gender === '女' ? 'selected' : ''} onClick={() => setGender('女')}>女</button></div></fieldset>
      <button type="submit"><RotateCcw size={15}/> 更新命盤</button>
    </form>

    <section className="consult-workspace">
      <div className="consult-chart">
        <div className="consult-section-heading"><div><span className="eyebrow">CURRENT CHART</span><h2>命盤問答脈絡</h2></div><span><LockKeyhole size={13}/> 僅瀏覽器內計算</span></div>
        <div className="consult-overview">{overview.map(({palace,stars,borrowed,opposite}) => <article key={palace.name}><small>{palace.name}</small><h3>{stars.map((star) => star.name).join('・') || '無主星'}</h3><p>{borrowed ? `空宮，借看${opposite.name}` : '本宮主星'}{stars.some((star) => star.mutagen) ? `・${stars.filter((star) => star.mutagen).map((star) => `${star.name}化${star.mutagen}`).join('、')}` : ''}</p></article>)}</div>
        <div className="consult-palaces">{PALACES.map((name) => { const item = palaceContext(chart,name); return <article key={name}><div><span>{item.palace.heavenlyStem}{item.palace.earthlyBranch}</span><b>{name}</b></div><p>{item.stars.map((star) => star.name).join('・') || '空宮'}</p><small>{item.borrowed ? `借 ${item.opposite.name}` : item.palace.changsheng12}</small></article>; })}</div>
        <div className="consult-method"><Compass size={18}/><p><b>回答方式</b>：先辨認問題所屬宮位，再看本宮或空宮借星、星曜特質及四化。建議文字是本站規則映射，不是 iztro 的原始解盤，也不取代專業意見。</p></div>
      </div>

      <aside className="chat-panel">
        <div className="chat-heading"><div className="chat-bot"><Bot size={21}/></div><div><small>命盤 AI 問答</small><h2>想先了解什麼？</h2></div><span>本機版</span></div>
        <div className="chat-suggestions">{SUGGESTIONS.map((item) => <button type="button" key={item} onClick={() => ask(item)}>{item}<ArrowUp size={12}/></button>)}</div>
        <div className="chat-log" aria-live="polite">{messages.map((message,index) => <div className={`chat-message ${message.role}`} key={`${message.role}-${index}`}><span>{message.role === 'assistant' ? <Bot size={14}/> : '你'}</span><div><p>{message.text}</p>{message.basis && <div className="answer-basis">{message.basis.map((item) => <small key={item}>{item}</small>)}</div>}</div></div>)}<i className="chat-log-end"/></div>
        <form className="chat-compose" onSubmit={(event) => {event.preventDefault();ask();}}><label htmlFor="chart-question">問本命盤</label><textarea id="chart-question" value={question} onChange={(event) => setQuestion(event.target.value)} placeholder="例如：感情中我容易忽略什麼？" rows={3}/><div><span><MessageCircleQuestion size={13}/> 請勿輸入姓名或聯絡資訊</span><button type="submit" disabled={!question.trim()}><Send size={14}/> 提問</button></div></form>
      </aside>
    </section>
  </main>;
}
