import "./globals.css";
import { Alexandria } from "next/font/google";
import ServiceWorkerRegister from "@/components/ServiceWorkerRegister";
import ClientNavWrapper from "@/components/ClientNavWrapper";
import { Providers } from "@/components/Providers";
import AnalyticsTracker from "@/components/AnalyticsTracker";

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
      className={`${alexandria.variable} h-full antialiased`}
    >
      <head>
      </head>
      <body className="min-h-full flex flex-col">
        <Providers>
          <ServiceWorkerRegister />
          <AnalyticsTracker />
          <ClientNavWrapper />
          {children}
        </Providers>
      </body>
    </html>
  );
}
