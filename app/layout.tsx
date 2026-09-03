import type { Metadata } from 'next';
import { Noto_Sans_TC, Noto_Serif_TC } from 'next/font/google';
import './globals.css';

const sans = Noto_Sans_TC({ variable: '--font-sans', subsets: ['latin'], weight: ['400','500','700'] });
const serif = Noto_Serif_TC({ variable: '--font-serif', subsets: ['latin'], weight: ['400','500','700'] });
const siteUrl = process.env.GITHUB_ACTIONS === 'true' ? 'https://yylin1.github.io/ziwei-love-chart/' : 'http://localhost:3000/';
const socialImage = new URL('og-love.png', siteUrl).toString();

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: '真命天子何時出現｜感情與正緣時機指南',
  description: '輸入出生日期與時辰，查看正緣活躍年份、可能相遇場合、適合對象與關係行動建議。',
  openGraph: {
    title: '真命天子何時出現｜正緣時機指南',
    description: '查看正緣活躍年份、可能相遇場合與適合你的關係行動建議。',
    images: [{ url: socialImage, width: 1200, height: 630, alt: '真命指南・遇見對的人，也看懂適合行動的時機' }],
    locale: 'zh_TW',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: '真命天子何時出現｜正緣時機指南',
    description: '查看正緣時機、相遇場合與關係行動建議。',
    images: [socialImage],
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="zh-Hant"><body className={`${sans.variable} ${serif.variable}`}>{children}</body></html>;
}
