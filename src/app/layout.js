import "./globals.css";
import { Alexandria, Outfit } from 'next/font/google';

const outfit = Outfit({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-sans',
});

const alexandria = Alexandria({
  subsets: ['arabic', 'latin'],
  variable: '--font-sans',
  display: 'swap',
});

export const metadata = {
  title: "أمانات - تحليل الحسابات",
  description: "نظام ذكي لتحليل موازين المراجعة واستخراج بيانات العملاء",
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className={`${alexandria.variable} ${outfit.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
