import type { Metadata } from 'next';
import { Noto_Sans_TC, Noto_Serif_TC } from 'next/font/google';
import './globals.css';

const sans = Noto_Sans_TC({ variable: '--font-sans', subsets: ['latin'], weight: ['400','500','700'] });
const serif = Noto_Serif_TC({ variable: '--font-serif', subsets: ['latin'], weight: ['400','500','700'] });

export const metadata: Metadata = {
  metadataBase: new URL(process.env.GITHUB_ACTIONS === 'true' ? 'https://yylin1.github.io/ziwei-love-chart/' : 'http://localhost:3000'),
  title: '紫微命盤｜線上紫微斗數排盤',
  description: '輸入出生日期、時辰與性別，即時生成十二宮紫微斗數命盤與七大人生面向分析報告。',
  openGraph: {
    title: '紫微命盤｜線上紫微斗數排盤',
    description: '生成十二宮命盤與性格、事業、財富、感情、人際、家庭、身心七大面向分析。',
    images: [{ url: '/og.png', width: 1200, height: 630, alt: '紫微命盤' }],
    locale: 'zh_TW',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: '紫微命盤｜線上紫微斗數排盤',
    description: '生成十二宮命盤與七大人生面向分析。',
    images: ['/og.png'],
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="zh-Hant"><body className={`${sans.variable} ${serif.variable}`}>{children}</body></html>;
}
