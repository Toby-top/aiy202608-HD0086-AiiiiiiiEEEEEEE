import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

/**
 * 根布局：配置全站元信息、中文语言环境和同学前端使用的 Inter 字体变量。
 */

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'AI 国际高中面试辅导',
  description:
    '帮助学生模拟国际高中面试，提供语音对话、实时评分、面试回放等功能。支持 Common App、校友面试、Initialview 三种面试类型。',
  keywords: ['国际高中', '面试辅导', 'AI面试', 'Common App', 'Initialview', '校友面试'],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" className={inter.variable}>
      <body className="min-h-screen bg-stone-50 font-sans text-stone-900 antialiased">
        {children}
      </body>
    </html>
  );
}
