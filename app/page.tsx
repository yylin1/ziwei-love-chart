'use client';

import { astro } from 'iztro';
import type { IFunctionalAstrolabe } from 'iztro/lib/astro/FunctionalAstrolabe';
import type { IFunctionalPalace } from 'iztro/lib/astro/FunctionalPalace';
import type { PalaceName } from 'iztro/lib/i18n';
import { Activity, ArrowRight, Brain, BriefcaseBusiness, CalendarDays, ChevronDown, Coins, Compass, Heart, HomeIcon, Info, LockKeyhole, MapPin, MessageCircleHeart, MoonStar, Printer, RotateCcw, ShieldCheck, Sparkles, Users } from 'lucide-react';
import { FormEvent, useMemo, useState } from 'react';

const HOURS = ['早子時 00:00–00:59','丑時 01:00–02:59','寅時 03:00–04:59','卯時 05:00–06:59','辰時 07:00–08:59','巳時 09:00–10:59','午時 11:00–12:59','未時 13:00–14:59','申時 15:00–16:59','酉時 17:00–18:59','戌時 19:00–20:59','亥時 21:00–22:59','晚子時 23:00–23:59'];
const GRID_ORDER = [5,6,7,8,4,-1,-1,9,3,-1,-1,10,2,1,0,11];
type CalendarType = 'solar' | 'lunar';
type Gender = '男' | '女';

const STAR_PROFILES: Record<string, { gift: string; watch: string }> = {
  紫微: { gift: '整合資源、承擔主導角色', watch: '別把標準拉得太高，也要聽見不同意見' },
  天機: { gift: '分析規劃、快速調整與解決問題', watch: '想法多時容易反覆，先定優先順序' },
  太陽: { gift: '公開表達、熱心投入與帶動他人', watch: '避免為了照顧全局而過度消耗自己' },
  武曲: { gift: '務實執行、管理資源與建立成果', watch: '效率之外，也要保留溝通與彈性' },
  天同: { gift: '同理、協調與營造舒服的氛圍', watch: '安穩很重要，但不必因此延後必要決定' },
  廉貞: { gift: '策略判斷、界線感與制度意識', watch: '原則與人情拉扯時，先釐清真正目標' },
  天府: { gift: '穩定承接、資源配置與長期經營', watch: '避免因求穩而錯過合理的改變時機' },
  太陰: { gift: '細膩觀察、內在感受與審美能力', watch: '不確定時容易內耗，適合用具體資料安定自己' },
  貪狼: { gift: '人際魅力、探索動力與多元才華', watch: '選項多時要建立界線，避免能量過度分散' },
  巨門: { gift: '研究辨析、提問與語言表達', watch: '溝通時先確認彼此定義，減少誤解與爭辯' },
  天相: { gift: '公平協調、品質把關與團隊合作', watch: '不必為了維持和諧而壓低自己的需求' },
  天梁: { gift: '原則判斷、照顧支持與化解問題', watch: '協助別人以前，先確認責任是否真的屬於你' },
  七殺: { gift: '果斷突破、面對挑戰與快速決策', watch: '重大變動前仍要留下評估與緩衝空間' },
  破軍: { gift: '改革重整、打破舊框架與重新開始', watch: '改變需要節奏，別一次推翻所有基礎' },
};

const LOVE_STAR_PROFILES: Record<string, { partner: string; vibe: string; relationship: string; challenge: string }> = {
  紫微: { partner: '有主見、重視品質與承擔', vibe: '穩重、有存在感，對自己有一定要求', relationship: '喜歡有承諾、能共同做決定的關係', challenge: '雙方都強勢時，需要練習輪流主導' },
  天機: { partner: '聪明機敏、擅長規劃與分析', vibe: '反應快、帶點知性，對新知保持好奇', relationship: '需要有話聊、可以一起思考和調整的伴侶', challenge: '想得多或反覆比較時，關係容易停在觀察期' },
  太陽: { partner: '熱情坦率、願意付出與帶領', vibe: '開朗、行動明快，容易成為團體焦點', relationship: '重視坦白、共同目標與彼此成就', challenge: '不要把照顧對方變成單方承擔' },
  武曲: { partner: '務實果斷、重視責任與成果', vibe: '俐落、節制，用行動多於言語表達', relationship: '透過可靠行動和共同經營建立安全感', challenge: '別只談解決方案，也要回應感受' },
  天同: { partner: '溫和體貼、懂得營造舒服氛圍', vibe: '親切、隨和，帶有輕鬆感', relationship: '需要溫暖陪伴與能放鬆做自己的空間', challenge: '為了和諧而逃避問題，反而會累積不滿' },
  廉貞: { partner: '有原則、重視界線與關係品質', vibe: '有魅力、反應敏銳，不輕易表態', relationship: '需要忠誠、公平並能清楚談界線', challenge: '試探或過度防備會削弱信任' },
  天府: { partner: '穩定成熟、擅長照顧與長期經營', vibe: '沉穩、包容，給人可信賴感', relationship: '重視生活秩序、共同累積和未來安排', challenge: '求穩過頭時，容易忽略關係需要新鮮感' },
  太陰: { partner: '細膩有感受力、重視內在與生活品質', vibe: '溫柔、安靜，審美與觀察力強', relationship: '需要被理解、有穩定回應的親密感', challenge: '情緒藏得太深時，對方可能無法理解真正需求' },
  貪狼: { partner: '多才多藝、有人際魅力與探索力', vibe: '活潑、好奇，懂得享受生活', relationship: '需要共同體驗、火花與不斷更新的相處方式', challenge: '選擇多或界線模糊時，容易帶來不安' },
  巨門: { partner: '擅長溝通思辨、對事物有自己觀點', vibe: '理性、口才好，喜歡深入交流', relationship: '需要能說真話、釐清誤會的溝通品質', challenge: '辯論取代傾聽時，容易越解釋越遠' },
  天相: { partner: '公正得體、擅長協調並顧及雙方', vibe: '整齊、有禮，在社交場合尺度很好', relationship: '重視公平分工、彼此支持與對外的伙伴感', challenge: '太在意和諧，可能延後說出真實不滿' },
  天梁: { partner: '心地善良、願意照顧人且原則感強', vibe: '成熟、穩重，氣質偏知性或保守', relationship: '看重長期責任、道德感與能否彼此成長', challenge: '照顧變成說教時，另一方可能感到壓力' },
  七殺: { partner: '果斷獨立、敢於面對挑戰', vibe: '俐落、直接，行動力強', relationship: '需要彼此尊重自主性並共同面對變化', challenge: '決定過快或忽冷忽熱時，要先確認安全感' },
  破軍: { partner: '敢於改變、不受傳統框架限制', vibe: '有個性、節奏鮮明，人生經驗可能較豐富', relationship: '需要真實、自由並能一起突破舊模式', challenge: '變動很大時，需要建立最低限度的穩定約定' },
};

const MUTAGEN_TEXT: Record<string, string> = {
  祿: '化祿使這個面向較容易形成資源、機會或投入感。',
  權: '化權會增加主導性、責任與必須作決定的情境。',
  科: '化科偏向學習、專業表現、名聲與被看見。',
  忌: '化忌代表反覆在意與需要深入整理的課題，不等於一定不好。',
};

type ReportDefinition = {
  id: string;
  title: string;
  subtitle: string;
  primary: PalaceName;
  secondary: PalaceName;
  icon: typeof Brain;
  action: string;
};

const REPORT_DEFINITIONS: ReportDefinition[] = [
  { id: 'self', title: '本質性格', subtitle: '你如何感受、選擇與回應世界', primary: '命宮', secondary: '福德', icon: Brain, action: '把敏感度用在觀察與創作，同時為重要決定設定期限。' },
  { id: 'career', title: '事業天賦', subtitle: '適合的工作方式與成長路徑', primary: '官祿', secondary: '遷移', icon: BriefcaseBusiness, action: '優先選擇能累積專業、解決問題並保有調整空間的任務。' },
  { id: 'wealth', title: '財富模式', subtitle: '創造、管理與累積資源的方法', primary: '財帛', secondary: '田宅', icon: Coins, action: '把收入、固定支出與長期配置分開管理，用制度降低情緒決策。' },
  { id: 'love', title: '感情關係', subtitle: '親密關係中的需要與互動', primary: '夫妻', secondary: '福德', icon: Heart, action: '把期待說成可討論的需求，並為彼此保留獨處與調整空間。' },
  { id: 'social', title: '人際合作', subtitle: '朋友、同事與合作夥伴的相處', primary: '僕役', secondary: '兄弟', icon: Users, action: '合作前先說清角色、責任和完成標準，關係會更穩定。' },
  { id: 'family', title: '家庭根基', subtitle: '原生家庭、居所與安全感', primary: '父母', secondary: '田宅', icon: HomeIcon, action: '分清傳承下來的期待與自己的選擇，逐步建立可掌控的生活基地。' },
  { id: 'wellbeing', title: '身心節奏', subtitle: '壓力反應與日常照顧方向', primary: '疾厄', secondary: '福德', icon: Activity, action: '用規律睡眠、適度運動與壓力紀錄觀察身體；不適仍應尋求醫療專業。' },
];

function resolvePalace(chart: IFunctionalAstrolabe, name: PalaceName) {
  const palace = chart.palace(name)!;
  if (palace.majorStars.length) return { palace, stars: palace.majorStars, borrowedFrom: '' };
  const opposite = chart.surroundedPalaces(name).opposite;
  return { palace, stars: opposite.majorStars, borrowedFrom: opposite.name };
}

function buildReport(chart: IFunctionalAstrolabe, definition: ReportDefinition) {
  const primary = resolvePalace(chart, definition.primary);
  const secondary = resolvePalace(chart, definition.secondary);
  const stars = [...primary.stars, ...secondary.stars];
  const uniqueStars = [...new Map(stars.map((star) => [star.name, star])).values()];
  const profiles = uniqueStars.map((star) => STAR_PROFILES[star.name]).filter(Boolean);
  const mutagens = uniqueStars.filter((star) => star.mutagen).map((star) => `${star.name}化${star.mutagen}`);
  const primaryNames = primary.stars.map((star) => star.name).join('、') || '對宮星系';
  const secondaryNames = secondary.stars.map((star) => star.name).join('、') || '對宮星系';
  const basis = primary.borrowedFrom
    ? `${definition.primary}為空宮，借看對宮「${primary.borrowedFrom}」的${primaryNames}；並參考${definition.secondary}的${secondaryNames}。`
    : `${definition.primary}以${primaryNames}定基調，並參考${definition.secondary}的${secondaryNames}。`;
  const strengths = profiles.length ? profiles.slice(0, 3).map((item) => item.gift).join('；') : '這個面向需要結合對宮與輔星，從實際經驗逐步辨認。';
  const watch = profiles.length ? profiles.slice(0, 2).map((item) => item.watch).join('；') : '空宮不是空白或缺失，重點在對宮與三方四正的互動。';
  const mutagenNote = mutagens.length
    ? `${mutagens.join('、')}。${uniqueStars.filter((s) => s.mutagen).map((s) => MUTAGEN_TEXT[s.mutagen!]).join('')}`
    : '此組主星沒有本命四化，仍須配合輔星與運限觀察。';
  const evidence = [
    `${definition.primary}・${primary.palace.heavenlyStem}${primary.palace.earthlyBranch}`,
    ...primary.stars.map((star) => `${star.name}${star.brightness || ''}${star.mutagen ? `・化${star.mutagen}` : ''}`),
    ...primary.palace.minorStars.slice(0, 3).map((star) => star.name),
  ];
  return { ...definition, basis, strengths, watch, mutagenNote, evidence };
}

const MEETING_SCENES: Record<string, string> = {
  命宮: '從個人興趣、形象更新或主動拓展生活圈開始',
  兄弟: '透過同學、手足、熟人介紹或日常社群互動',
  夫妻: '在明確以交往為前提的約會或關係確認中',
  子女: '在創作、娛樂、聚會或輕鬆活潑的活動裡',
  財帛: '透過工作交易、理財學習或務實合作場合',
  疾厄: '在運動、健康管理、照顧服務或日常作息圈',
  遷移: '在旅行、跨城市、網路社群或新環境中',
  僕役: '經由朋友、團隊、社群活動或共同專案',
  官祿: '在職場、進修、專業合作或公開任務裡',
  田宅: '透過家人、居住圈、空間活動或熟悉社區',
  福德: '在興趣課程、藝文活動或身心探索場域',
  父母: '透過長輩、主管、正式機構或可信任的介紹',
};

type LoveStatus = 'single' | 'developing' | 'partnered';
type ForecastMode = 'balanced' | 'strict' | 'broad';
type LoveQuery = 'guide' | 'personality' | 'timing' | 'pattern' | 'action';

const FORECAST_MODES: Record<ForecastMode, { label: string; description: string; threshold: number; count: number }> = {
  balanced: { label: '平衡模式', description: '綜合夫妻宮、桃花曜、四化與大限，適合一般查詢。', threshold: 6, count: 6 },
  strict: { label: '核心訊號', description: '只顯示同時有多種依據的高分年份，結果較少。', threshold: 8, count: 4 },
  broad: { label: '寬鬆參考', description: '放寬為社交、認識與關係調整期，結果較多。', threshold: 5, count: 9 },
};

const LOVE_QUERIES: { id: LoveQuery; label: string; hint: string }[] = [
  { id: 'guide', label: '真命指南', hint: '對象輪廓與辨識原則' },
  { id: 'personality', label: '個性相處', hint: '吸引力、需求與磨合點' },
  { id: 'timing', label: '出現時機', hint: '年份、訊號與可能場景' },
  { id: 'pattern', label: '愛情運勢', hint: '關係模式與容易踩到的雷' },
  { id: 'action', label: '幸福建議', hint: '依目前關係狀態行動' },
];

const LOVE_STATUS_ADVICE: Record<LoveStatus, { label: string; title: string; steps: string[] }> = {
  single: { label: '目前單身', title: '把緣分變成可遇見的行動', steps: ['依高機會年份的相遇場景，固定參與能重複見面的活動。','前三次互動先看穩定度、尊重與價值觀，不急著把心動等同適合。','每月安排兩次主動邀約或新社群接觸，讓機會有實際入口。'] },
  developing: { label: '曖昧／認識中', title: '讓模糊關係逐步清晰', steps: ['直接確認彼此目前的關係期待，而不是只猜測訊息頻率。','觀察對方遇到不同意見時，能否溝通、修復並尊重界線。','設定自己的觀察期限；持續模糊也是一種答案。'] },
  partnered: { label: '穩定交往中', title: '把感情運用在經營，而非等待', steps: ['每週保留一次不處理工作與家務的專屬相處時間。','用具體請求代替批評，例如說出希望的頻率、方式和期限。','在高機會年份共同規劃旅行、承諾或生活階段，讓關係向前。'] },
};

function buildLoveForecast(chart: IFunctionalAstrolabe) {
  const currentYear = new Date().getFullYear();
  const birthYear = Number(chart.solarDate.split('-')[0]);
  const spouse = resolvePalace(chart, '夫妻');
  const inner = resolvePalace(chart, '福德');
  const spouseProfiles = spouse.stars.map((star) => STAR_PROFILES[star.name]).filter(Boolean);
  const loveProfiles = spouse.stars.map((star) => LOVE_STAR_PROFILES[star.name]).filter(Boolean);
  const partnerKeywords = spouseProfiles.slice(0, 3).map((profile) => profile.gift.split('、')[0]);
  const partnerProfile = spouse.borrowedFrom
    ? `夫妻宮為空宮，借看對宮「${spouse.borrowedFrom}」的${spouse.stars.map((s) => s.name).join('、')}。你較容易注意到${partnerKeywords.join('、')}，並能在現實生活中一起承擔與成長的人。`
    : `夫妻宮坐${spouse.stars.map((s) => `${s.name}${s.brightness || ''}`).join('、')}。你較容易被具備${partnerKeywords.join('、')}特質的人吸引。`;
  const innerProfiles = inner.stars.map((star) => STAR_PROFILES[star.name]).filter(Boolean);
  const relationshipNeed = `關係要走得長久，你需要「${innerProfiles.slice(0, 2).map((profile) => profile.gift).join('」與「') || '安全感與坦白溝通'}」。比起只看第一眼的吸引力，更要觀察對方能否穩定回應、尊重界線並一起處理差異。`;
  const partnerTraits = loveProfiles.map((profile) => profile.partner);
  const partnerVibe = loveProfiles.map((profile) => profile.vibe);
  const relationshipStyles = loveProfiles.map((profile) => profile.relationship);
  const relationshipChallenges = loveProfiles.map((profile) => profile.challenge);

  const rangeStart = Math.max(birthYear + 18, currentYear - 8);
  const years = Array.from({ length: currentYear + 10 - rangeStart + 1 }, (_, offset) => rangeStart + offset).map((year) => {
    const horoscope = chart.horoscope(`${year}-07-01`, 6);
    const index = horoscope.yearly.palaceNames.indexOf('夫妻');
    const landedPalace = chart.palaces[index];
    const flowStars = (horoscope.yearly.stars?.[index] ?? []).map((star) => star.name);
    const palaceStars = [...landedPalace.majorStars, ...landedPalace.minorStars, ...landedPalace.adjectiveStars];
    const palaceStarNames = palaceStars.map((star) => star.name);
    let score = 4;
    const signals: string[] = [];

    if (flowStars.includes('流鸞')) { score += 3; signals.push('紅鸞啟動'); }
    if (flowStars.includes('流喜')) { score += 3; signals.push('天喜啟動'); }
    if (flowStars.includes('流祿')) { score += 2; signals.push('流祿加溫'); }
    if (flowStars.some((star) => ['流魁','流鉞'].includes(star))) { score += 1; signals.push('貴人牽線'); }
    if (flowStars.some((star) => ['流昌','流曲'].includes(star))) { score += 1; signals.push('溝通機會'); }
    if (flowStars.some((star) => ['流羊','流陀'].includes(star))) { score -= 1; signals.push('需要慢下來確認'); }
    if (['夫妻','命宮','福德'].includes(landedPalace.name)) { score += 2; signals.push(`${landedPalace.name}被引動`); }
    else if (['遷移','僕役','官祿'].includes(landedPalace.name)) { score += 1; signals.push(`${landedPalace.name}帶來場景`); }

    horoscope.yearly.mutagen.forEach((starName, mutagenIndex) => {
      if (!palaceStarNames.includes(starName)) return;
      const names = ['祿','權','科','忌'];
      const points = [2, 1, 1, -1];
      score += points[mutagenIndex];
      signals.push(`${starName}化${names[mutagenIndex]}`);
    });

    const nominalAge = year - birthYear + 1;
    const decade = chart.palaces.find((palace) => nominalAge >= palace.decadal.range[0] && nominalAge <= palace.decadal.range[1]);
    if (decade?.name === '夫妻') { score += 2; signals.push('夫妻大限'); }

    const finalScore = Math.max(3, Math.min(10, score));
    const level = finalScore >= 8 ? '緣分聚焦' : finalScore >= 6 ? '適合拓展' : '沉澱觀察';
    return {
      year,
      age: nominalAge,
      score: finalScore,
      level,
      scene: MEETING_SCENES[landedPalace.name] || '在生活圈的自然互動中',
      palace: landedPalace.name,
      signals: [...new Set(signals)].slice(0, 3),
    };
  });

  const topYears = [...years].sort((a, b) => b.score - a.score || a.year - b.year).slice(0, 6).sort((a, b) => a.year - b.year);
  const allLoveStars = chart.palaces.flatMap((palace) => [...palace.minorStars, ...palace.adjectiveStars].map((star) => ({ name: star.name, palace: palace.name })));
  const natalSignals = allLoveStars.filter((star) => ['紅鸞','天喜','天姚','咸池'].includes(star.name));
  return { years, topYears, spouse, partnerProfile, relationshipNeed, natalSignals, partnerTraits, partnerVibe, relationshipStyles, relationshipChallenges };
}

function makeChart(date: string, hour: number, gender: Gender, calendar: CalendarType, leap: boolean) {
  return (calendar === 'solar' ? astro.bySolar(date, hour, gender, true, 'zh-TW') : astro.byLunar(date, hour, gender, leap, true, 'zh-TW')) as IFunctionalAstrolabe;
}

function StarName({ star, major = false }: { star: IFunctionalPalace['majorStars'][number]; major?: boolean }) {
  return <span className={major ? 'star major-star' : 'star'}>{star.name}{star.brightness && <small>{star.brightness}</small>}{star.mutagen && <b className={`mutagen mutagen-${star.mutagen}`}>{star.mutagen}</b>}</span>;
}

function PalaceCard({ palace, active, onSelect }: { palace: IFunctionalPalace; active: boolean; onSelect: () => void }) {
  return <button className={`palace-card ${active ? 'active' : ''}`} onClick={onSelect} type="button">
    <div className="palace-topline"><span>{palace.heavenlyStem}{palace.earthlyBranch}</span><span>{palace.decadal.range[0]}–{palace.decadal.range[1]}</span></div>
    <div className="stars major-stars">{palace.majorStars.length ? palace.majorStars.map((star) => <StarName key={star.name} star={star} major />) : <span className="empty-star">空宮</span>}</div>
    <div className="stars minor-stars">{palace.minorStars.slice(0, 5).map((star) => <StarName key={star.name} star={star} />)}</div>
    <div className="palace-footer"><span>{palace.isBodyPalace && '身・'}{palace.isOriginalPalace && '來因・'}{palace.name}</span><span>{palace.changsheng12}</span></div>
  </button>;
}

export default function Home() {
  const [name, setName] = useState('');
  const [reportName, setReportName] = useState('命盤主人');
  const [date, setDate] = useState('1990-08-17');
  const [hour, setHour] = useState(6);
  const [gender, setGender] = useState<Gender>('男');
  const [calendar, setCalendar] = useState<CalendarType>('solar');
  const [leap, setLeap] = useState(false);
  const [chart, setChart] = useState(() => makeChart('1990-08-17', 6, '男', 'solar', false));
  const [selected, setSelected] = useState(11);
  const [loveStatus, setLoveStatus] = useState<LoveStatus>('single');
  const [forecastMode, setForecastMode] = useState<ForecastMode>('balanced');
  const [loveQuery, setLoveQuery] = useState<LoveQuery>('guide');
  const [selectedLoveYear, setSelectedLoveYear] = useState<number | null>(null);
  const [message, setMessage] = useState('這是一張示範命盤，修改出生資料後即可重新排盤。');
  const selectedPalace = chart.palaces[selected] ?? chart.palaces[0];
  const palaceByIndex = useMemo(() => new Map(chart.palaces.map((p) => [p.index, p])), [chart]);
  const reports = useMemo(() => REPORT_DEFINITIONS.map((definition) => buildReport(chart, definition)), [chart]);
  const nominalAge = new Date().getFullYear() - Number(chart.solarDate.split('-')[0]) + 1;
  const activeDecade = chart.palaces.find((palace) => nominalAge >= palace.decadal.range[0] && nominalAge <= palace.decadal.range[1]);
  const loveForecast = useMemo(() => buildLoveForecast(chart), [chart]);
  const loveAdvice = LOVE_STATUS_ADVICE[loveStatus];
  const modeDefinition = FORECAST_MODES[forecastMode];
  const modeYears = useMemo(() => {
    const matching = loveForecast.years.filter((item) => item.score >= modeDefinition.threshold).sort((a, b) => b.score - a.score || a.year - b.year).slice(0, modeDefinition.count);
    return (matching.length ? matching : [...loveForecast.years].sort((a, b) => b.score - a.score).slice(0, modeDefinition.count)).sort((a, b) => a.year - b.year);
  }, [loveForecast, modeDefinition]);
  const activeLoveYear = modeYears.find((item) => item.year === selectedLoveYear) ?? modeYears.find((item) => item.year >= new Date().getFullYear()) ?? modeYears[0];

  function submit(event: FormEvent) {
    event.preventDefault();
    try {
      const next = makeChart(date, hour, gender, calendar, leap);
      const submitter = (event.nativeEvent as SubmitEvent).submitter as HTMLButtonElement | null;
      const target = submitter?.value === 'chart' ? '#chart' : '#love-timing';
      setChart(next);
      setReportName(name.trim() || '命盤主人');
      setSelected(next.palaces.find((p) => p.name === '命宮')?.index ?? 0);
      setSelectedLoveYear(null);
      setMessage('命盤與正緣時機分析已更新。點選任一宮位，可查看完整星曜。');
      requestAnimationFrame(() => document.querySelector(target)?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
    } catch { setMessage('日期格式無法排盤，請檢查出生年月日後再試一次。'); }
  }

  return <main>
    <header className="site-header">
      <a className="brand" href="#top" aria-label="紫微命盤首頁"><span className="brand-mark">紫</span><span><b>紫微命盤</b><small>ZI WEI CHART</small></span></a>
      <nav aria-label="主選單"><a href="#chart">我的命盤</a><a href="#report">七大分析</a><a href="#love-timing">正緣時機</a><a href="#guide">排盤說明</a></nav>
    </header>

    <section className="hero love-entry" id="top">
      <div className="entry-heading">
        <span className="eyebrow"><Sparkles size={14}/> 紫微斗數・感情專屬解析</span>
        <h1>感情的答案，<em>從看懂自己開始。</em></h1>
        <p>一次輸入出生資料，完成十二宮排盤，並將命盤訊號直接帶入正緣時機分析。</p>
      </div>
      <div className="entry-visual" aria-label="正緣分析可以回答的問題">
        <div className="question-bubble bubble-one">適合我的人，有什麼特質？</div>
        <div className="question-bubble bubble-two">哪幾年緣分訊號較集中？</div>
        <div className="question-bubble bubble-three">如何把關係經營得更穩定？</div>
        <div className="connection-scene">
          <span className="person-orb orb-one"><Users size={35}/></span>
          <span className="heart-orb"><Heart size={42} fill="currentColor"/></span>
          <span className="person-orb orb-two"><MessageCircleHeart size={35}/></span>
          <i className="connection-line line-one"/><i className="connection-line line-two"/>
        </div>
        <div className="visual-caption"><Compass size={17}/><span><b>不只看桃花</b>，也看對的人、對的時機與相處方式。</span></div>
      </div>
      <form className="birth-card entry-form" onSubmit={submit}>
        <div className="form-heading"><span className="form-icon"><MoonStar size={24}/></span><div><h2>開始正緣分析</h2><p>請仔細核對出生資料</p></div></div>
        <label><span>姓名或暱稱</span><div className="control"><input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="報告中如何稱呼你" maxLength={24}/></div></label>
        <div className="segmented" aria-label="曆法"><button className={calendar === 'solar' ? 'selected' : ''} type="button" onClick={() => setCalendar('solar')}>國曆</button><button className={calendar === 'lunar' ? 'selected' : ''} type="button" onClick={() => setCalendar('lunar')}>農曆</button></div>
        <label><span>出生日期</span><div className="control"><CalendarDays size={17}/><input type="date" value={date} onChange={(e) => setDate(e.target.value)} min="1900-01-01" max="2100-12-31" required/></div></label>
        <div className="form-row">
          <label><span>出生時辰</span><div className="control"><select value={hour} onChange={(e) => setHour(Number(e.target.value))}>{HOURS.map((label,index) => <option value={index} key={label}>{label}</option>)}</select><ChevronDown size={16}/></div></label>
          <fieldset><legend>性別</legend><div className="gender-choice"><button className={gender === '男' ? 'selected' : ''} type="button" onClick={() => setGender('男')}>乾造・男</button><button className={gender === '女' ? 'selected' : ''} type="button" onClick={() => setGender('女')}>坤造・女</button></div></fieldset>
        </div>
        {calendar === 'lunar' && <label className="check"><input type="checkbox" checked={leap} onChange={(e) => setLeap(e.target.checked)}/> 此日期為閏月</label>}
        <div className="privacy-note"><LockKeyhole size={14}/><span>資料只在你的瀏覽器內計算，不會上傳或儲存。</span></div>
        <button className="primary-button love-submit" type="submit" value="love"><Heart size={17}/> 立即分析正緣 <ArrowRight size={16}/></button>
        <button className="chart-submit" type="submit" value="chart">先查看完整十二宮命盤</button>
        <div className="entry-steps"><span><b>1</b>填寫資料</span><i/><span><b>2</b>完成排盤</span><i/><span><b>3</b>正緣分析</span></div>
      </form>
    </section>

    <section className="chart-section" id="chart">
      <div className="section-title"><span className="eyebrow">你的本命星盤</span><h2>十二宮命盤</h2><p aria-live="polite">{message}</p></div>
      <div className="chart-shell">
        <div className="chart-grid">
          {GRID_ORDER.map((index,cell) => {
            if (index === -1) {
              if (cell !== 5) return null;
              return <div className="chart-center" key="center"><span className="seal">命</span><h3>{chart.gender}命・{chart.fiveElementsClass}</h3><dl><div><dt>國曆</dt><dd>{chart.solarDate}・{chart.time}</dd></div><div><dt>農曆</dt><dd>{chart.lunarDate}</dd></div><div><dt>四柱</dt><dd>{chart.chineseDate}</dd></div><div><dt>命主</dt><dd>{chart.soul}</dd><dt>身主</dt><dd>{chart.body}</dd></div></dl><div className="zodiac-row"><span>{chart.zodiac}年</span><span>{chart.sign}</span><span>命宮在{chart.earthlyBranchOfSoulPalace}</span></div></div>;
            }
            const palace = palaceByIndex.get(index);
            return palace ? <PalaceCard key={index} palace={palace} active={selected === index} onSelect={() => setSelected(index)}/> : null;
          })}
        </div>
        <aside className="palace-detail">
          <div className="detail-heading"><span>{selectedPalace.heavenlyStem}{selectedPalace.earthlyBranch}</span><div><small>目前選取</small><h3>{selectedPalace.name}</h3></div></div>
          <div className="detail-group"><h4>主星</h4><div className="tag-list">{selectedPalace.majorStars.length ? selectedPalace.majorStars.map((s) => <span className="tag major" key={s.name}>{s.name} <small>{s.brightness}</small>{s.mutagen && <b>{s.mutagen}</b>}</span>) : <span className="muted">此宮無主星</span>}</div></div>
          <div className="detail-group"><h4>輔星・雜曜</h4><div className="tag-list">{[...selectedPalace.minorStars,...selectedPalace.adjectiveStars].slice(0,12).map((s) => <span className="tag" key={s.name}>{s.name}</span>)}</div></div>
          <div className="detail-stats"><div><small>大限</small><b>{selectedPalace.decadal.range[0]}–{selectedPalace.decadal.range[1]} 歲</b></div><div><small>長生</small><b>{selectedPalace.changsheng12}</b></div></div>
          <p className="detail-tip">點選命盤中的其他宮位，查看各宮星曜配置。</p>
        </aside>
      </div>
      <div className="report-bridge"><span>命盤已就緒</span><p>接著從七個人生面向，閱讀星曜之間的關聯。</p><a href="#report">查看完整分析</a></div>
    </section>

    <section className="report-section" id="report">
      <div className="report-header">
        <div><span className="eyebrow">PERSONAL REPORT</span><h2>你的七大面向分析</h2><p>綜合本命宮位、主星、亮度、四化與對宮關係，自動生成專屬閱讀摘要。</p></div>
        <button className="print-button" type="button" onClick={() => window.print()}><Printer size={16}/> 列印／另存 PDF</button>
      </div>

      <div className="report-overview">
        <div className="report-seal">析</div>
        <div className="report-identity"><span>{chart.solarDate}・{chart.time}</span><h3>{reportName}・{chart.gender}命・{chart.fiveElementsClass}</h3><p>命主 {chart.soul}　身主 {chart.body}</p></div>
        <div className="decade-card"><small>目前人生階段・虛歲 {nominalAge}</small><b>{activeDecade ? `${activeDecade.name}大限` : '本命階段'}</b><span>{activeDecade ? `${activeDecade.decadal.range[0]}–${activeDecade.decadal.range[1]} 歲` : '請以實際流年另行參照'}</span></div>
      </div>

      <div className="report-grid">
        {reports.map((report, index) => {
          const Icon = report.icon;
          return <article className="report-card" key={report.id} id={`report-${report.id}`}>
            <div className="report-card-head"><span className="report-number">0{index + 1}</span><span className="report-icon"><Icon size={21}/></span><div><h3>{report.title}</h3><p>{report.subtitle}</p></div></div>
            <div className="evidence-list" aria-label="解讀依據">{report.evidence.map((item) => <span key={item}>{item}</span>)}</div>
            <p className="report-basis">{report.basis}</p>
            <dl className="report-points">
              <div><dt>可發揮的優勢</dt><dd>{report.strengths}</dd></div>
              <div><dt>需要留意</dt><dd>{report.watch}</dd></div>
              <div><dt>四化訊號</dt><dd>{report.mutagenNote}</dd></div>
            </dl>
            <div className="action-note"><span>給你的行動提示</span><p>{report.action}</p></div>
            {report.id === 'love' && <a className="love-deep-link" href="#love-timing">展開正緣時機分析 <span>→</span></a>}
          </article>;
        })}
      </div>

      <div className="report-disclaimer"><Info size={17}/><p><b>閱讀提醒</b>：本報告是依紫微斗數規則產生的文化性、自我探索內容，不是對事件的保證。健康、財務、法律與重大人生決策，請以合格專業人士的意見為準。</p></div>
    </section>

    <section className="love-section" id="love-timing">
      <div className="love-orbit" aria-hidden="true"><span/><span/><span/></div>
      <div className="love-heading">
        <span className="eyebrow"><Heart size={14}/> RELATIONSHIP COMPASS</span>
        <h2>{reportName}的正緣時機導航</h2>
        <p>不是預言某個人必然出現，而是找出關係議題較容易被啟動的年份，以及你能主動創造的相遇條件。</p>
      </div>

      <div className="comparison-note">
        <div><span>結果對照</span><h3>先對齊本命星系，再比較年份口徑</h3></div>
        <p>同一張命盤可能有相同的夫妻宮與借星，卻因「查看年限、桃花曜權重、大限是否加分」而得到不同年份。本站保留每年的訊號依據，不用姓氏、精確外貌或必然結婚當結論。</p>
      </div>

      <div className="love-query-shell">
        <div className="query-tabs" role="tablist" aria-label="感情分析類別">
          {LOVE_QUERIES.map((query) => <button key={query.id} type="button" role="tab" aria-selected={loveQuery === query.id} className={loveQuery === query.id ? 'selected' : ''} onClick={() => setLoveQuery(query.id)}><b>{query.label}</b><small>{query.hint}</small></button>)}
        </div>
        <div className="query-result" role="tabpanel">
          {loveQuery === 'guide' && <><small>01・真命指南</small><h3>{loveForecast.spouse.stars.map((star) => star.name).join('・') || '對宮星系'}型伴侶</h3><p>{loveForecast.partnerProfile}</p><dl><div><dt>容易辨識的特質</dt><dd>{loveForecast.partnerTraits.join('；') || '重視穩定回應、尊重與共同成長。'}</dd></div><div><dt>外在氣質（非生理預測）</dt><dd>{loveForecast.partnerVibe.join('；') || '比起固定外貌，更建議觀察氣質和行為穩定度。'}</dd></div></dl><p className="query-caution">姓氏、手指長短、身材與明星對照無法從命盤穩定驗證，因此不列為核心查詢結果。</p></>}
          {loveQuery === 'personality' && <><small>02・個性相處</small><h3>好相處的關鍵與磨合點</h3><p>{loveForecast.relationshipNeed}</p><dl><div><dt>適合的關係模式</dt><dd>{loveForecast.relationshipStyles.join('；') || '清楚溝通、互相尊重的伴侶關係。'}</dd></div><div><dt>容易出現的課題</dt><dd>{loveForecast.relationshipChallenges.join('；') || '別把心動當成一致的關係意願。'}</dd></div></dl></>}
          {loveQuery === 'timing' && <><small>03・出現時機</small><h3>{activeLoveYear ? `${activeLoveYear.year} 年・${activeLoveYear.level}` : '年份訊號查詢'}</h3>{activeLoveYear && <><p>{activeLoveYear.scene}。此年指數為 {activeLoveYear.score}/10，表示關係議題的相對活躍度，不是交往成功率。</p><div className="signal-detail">{activeLoveYear.signals.map((signal) => <span key={signal}>{signal}</span>)}</div></>}</>}
          {loveQuery === 'pattern' && <><small>04・愛情運勢</small><h3>心動之後，用行動穩定度篩選</h3><p>{loveForecast.relationshipChallenges.join('；') || '容易先被特質吸引，再慢慢確認對方是否真的適合。'}</p><dl><div><dt>婚前觀察</dt><dd>一致的關係意願、守信、能否處理歧見，比訊息頻率更重要。</dd></div><div><dt>長期經營</dt><dd>保留定期溝通與共同規劃，同時讓雙方都有自主空間。</dd></div></dl></>}
          {loveQuery === 'action' && <><small>05・幸福建議</small><h3>{loveAdvice.title}</h3><ol className="query-actions">{loveAdvice.steps.map((step) => <li key={step}>{step}</li>)}</ol></>}
        </div>
      </div>

      <div className="love-hero-card">
        <div className="love-hero-copy">
          <span className="love-kicker">前後十八年・{modeDefinition.label}</span>
          <h3>{modeYears.map((item) => item.year).join('・')}</h3>
          <p>{modeDefinition.description}年份可包含過去，用來回看驗證；未來年份則用來安排社交與關係行動。</p>
          <div className="mode-switch" role="group" aria-label="年份計算口徑">{(Object.keys(FORECAST_MODES) as ForecastMode[]).map((mode) => <button type="button" key={mode} className={forecastMode === mode ? 'selected' : ''} onClick={() => { setForecastMode(mode); setSelectedLoveYear(null); }}>{FORECAST_MODES[mode].label}</button>)}</div>
          <div className="love-evidence">{loveForecast.natalSignals.length ? loveForecast.natalSignals.map((star) => <span key={`${star.name}-${star.palace}`}>{star.name}在{star.palace}</span>) : <span>以夫妻宮與流年三方四正為主</span>}</div>
        </div>
        <div className="top-year-list">
          {modeYears.map((item, index) => <button type="button" className={`top-year ${activeLoveYear?.year === item.year ? 'active' : ''}`} key={item.year} onClick={() => { setSelectedLoveYear(item.year); setLoveQuery('timing'); }}><span>{String(index + 1).padStart(2, '0')}</span><div><b>{item.year}</b><small>虛歲 {item.age}・{item.level}</small></div><strong>{item.score}<small>/10</small></strong></button>)}
        </div>
      </div>

      <div className="love-directions">
        <article><span className="love-icon"><Compass size={20}/></span><small>01・正緣輪廓</small><h3>你容易被什麼人吸引</h3><p>{loveForecast.partnerProfile}</p><div className="love-source">依據：夫妻宮{loveForecast.spouse.borrowedFrom ? `借看${loveForecast.spouse.borrowedFrom}` : ''}・{loveForecast.spouse.stars.map((s) => s.name).join('、')}</div></article>
        <article><span className="love-icon"><Heart size={20}/></span><small>02・相處模式</small><h3>幸福關係需要什麼</h3><p>{loveForecast.relationshipNeed}</p><div className="love-source">依據：福德宮、命宮與夫妻宮交叉閱讀</div></article>
        <article><span className="love-icon"><MapPin size={20}/></span><small>03・相遇方向</small><h3>把機會放進生活場景</h3><p>最值得留意的場景是：{modeYears.slice(0, 4).map((item) => `${item.year} 年${item.scene}`).join('；')}。與其等待命定邂逅，重複出現在對的場域更有效。</p><div className="love-source">依據：各年流年夫妻宮落入的本命宮位</div></article>
        <article><span className="love-icon"><ShieldCheck size={20}/></span><small>04・辨識原則</small><h3>心動之外，也要確認適合</h3><p>桃花訊號代表互動機會增加，不等於對方必然適合。請同時確認一致的關係意願、可靠的行動、衝突修復能力，以及是否尊重你的界線。</p><div className="love-source">避免用單一紅鸞、天喜或化忌直接判定結果</div></article>
      </div>

      <div className="year-forecast">
        <div className="subsection-title"><span>YEARLY OUTLOOK</span><h3>{modeDefinition.label}・年份查詢</h3><p>分數是本站依流年夫妻宮、桃花星、四化、貴人星與大限計算的相對訊號，不是成功率。點選年份可查看詳細依據。</p></div>
        <div className="year-list">{modeYears.map((item) => <button type="button" className={`year-card score-${item.score} ${activeLoveYear?.year === item.year ? 'active' : ''}`} key={item.year} onClick={() => { setSelectedLoveYear(item.year); setLoveQuery('timing'); document.querySelector('.love-query-shell')?.scrollIntoView({ behavior: 'smooth', block: 'center' }); }}><div className="year-top"><span>{item.year}</span><b>{item.level}</b></div><div className="score-track"><i style={{ width: `${item.score * 10}%` }}/></div><p>{item.scene}</p><div>{item.signals.length ? item.signals.map((signal) => <small key={signal}>{signal}</small>) : <small>以日常互動為主</small>}</div></button>)}</div>
      </div>

      <div className="love-plan">
        <div className="love-plan-sidebar"><span>幸福行動計畫</span><h3>你現在的感情狀態？</h3><div className="status-switch" role="group" aria-label="目前感情狀態">{(Object.keys(LOVE_STATUS_ADVICE) as LoveStatus[]).map((status) => <button className={loveStatus === status ? 'selected' : ''} type="button" key={status} onClick={() => setLoveStatus(status)}>{LOVE_STATUS_ADVICE[status].label}</button>)}</div></div>
        <div className="love-plan-content"><small>PERSONAL ACTION PLAN</small><h3>{loveAdvice.title}</h3><ol>{loveAdvice.steps.map((step) => <li key={step}><span>✓</span><p>{step}</p></li>)}</ol></div>
      </div>

      <div className="love-disclaimer"><Info size={17}/><p>「正緣」在這裡代表值得認識與經營的關係機會，不保證特定年份結婚或遇見特定人物。感情仍取決於雙方選擇、溝通與現實條件。</p></div>
    </section>

    <section className="guide" id="guide"><div><span className="eyebrow">快速入門</span><h2>先讀懂一張命盤</h2></div><div className="guide-grid"><article><span>01</span><h3>宮位</h3><p>十二宮代表人生的不同面向，例如命宮、財帛、官祿與夫妻。</p></article><article><span>02</span><h3>星曜</h3><p>十四主星與輔星落入不同宮位，組成命盤的基本個性與傾向。</p></article><article><span>03</span><h3>大限</h3><p>每十年為一個階段。宮位上的歲數區間，是觀察人生節奏的索引。</p></article></div></section>
    <footer><div className="brand"><span className="brand-mark">紫</span><span><b>紫微命盤</b><small>ZI WEI CHART</small></span></div><p>以傳統星學為鏡，照見當下的自己。</p><button type="button" onClick={() => window.scrollTo({top:0,behavior:'smooth'})}><RotateCcw size={14}/> 重新排盤</button></footer>
  </main>;
}
