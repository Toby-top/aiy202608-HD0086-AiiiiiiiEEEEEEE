import type { Metadata } from 'next';
import { Inspector } from 'react-dev-inspector';
import './globals.css';

export const metadata: Metadata = {
  title: 'AI Interview Coach | AI 国际高中面试辅导系统',
  description: '24小时在线的AI面试官，提供真实面试模拟 + 即时多维度反馈。帮助国际高中学生准备海外大学面试。',
  keywords: ['AI面试', '大学面试', 'Common App', '校友面试', 'Initialview', '国际高中', '面试辅导'],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const isDev = process.env.COZE_PROJECT_ENV === 'DEV';

  return (
    <html lang="zh-CN">
      <body className="antialiased">
        {isDev && <Inspector />}
        {children}
      </body>
    </html>
  );
}
