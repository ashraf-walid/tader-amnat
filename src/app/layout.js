import "./globals.css";
import { Alexandria, Outfit } from "next/font/google";
import ServiceWorkerRegister from "@/components/ServiceWorkerRegister";

const outfit = Outfit({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-sans",
});

const alexandria = Alexandria({
  subsets: ["arabic", "latin"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata = {
  title: "أمانات - تحليل الحسابات",
  description: "نظام ذكي لتحليل موازين المراجعة واستخراج بيانات العملاء",
  manifest: "/manifest.json",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#0b1120",
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="ar"
      className={`${alexandria.variable} ${outfit.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        {/*
          ── Theme Script ──────────────────────────────────────────────────────
          يعمل هذا السكريبت قبل أول رسم للصفحة (synchronous) لمنع وميض الألوان.
          يقرأ التفضيل من localStorage، وعند أول زيارة يقرأ إعداد النظام.
          ─────────────────────────────────────────────────────────────────────
        */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('theme');if(!t){t=window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';}document.documentElement.setAttribute('data-theme',t);}catch(e){}})();`,
          }}
        />
        {/* Microsoft Clarity Analytics */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(c,l,a,r,i,t,y){c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);})(window, document, "clarity", "script", "x80sprsik2");`,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col">
        <ServiceWorkerRegister />
        {children}
      </body>
    </html>
  );
}
