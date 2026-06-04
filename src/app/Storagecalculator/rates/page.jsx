'use client';

import { STORAGE_CONFIG, SERVICES_LIST } from "@/lib/storageConstants";
import {
  ArrowRight,
  Info,
  Package,
  Maximize,
  Truck,
  Wrench,
  AlertTriangle,
  Zap,
  Clock,
  ExternalLink,
  Snowflake,
  ShieldAlert
} from "lucide-react";
import Link from "next/link";

export default function RatesPage() {
  const t20 = STORAGE_CONFIG.IMPORT.TWENTY_FT;
  const t40 = STORAGE_CONFIG.IMPORT.FORTY_FT;
  const svcs = STORAGE_CONFIG.SERVICES;

  const fmt = (n) => Number(n).toLocaleString('ar-EG');

  return (
    <div className="min-h-screen bg-[#0b1120] text-slate-200 p-4 md:p-8" dir="rtl" style={{ fontFamily: "'Tajawal', system-ui, sans-serif" }}>
      <div className="max-w-5xl mx-auto">

        {/* Back Button & Header */}
        <div className="mb-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <Link
              href="/Storagecalculator"
              className="p-3 bg-slate-800/50 hover:bg-slate-700/50 rounded-2xl transition-all group border border-slate-700/50"
            >
              <ArrowRight className="w-5 h-5 text-blue-400 group-hover:translate-x-1 transition-transform" />
            </Link>
            <div>
              <h1 className="text-2xl md:text-4xl font-black bg-clip-text text-transparent bg-linear-to-r from-blue-400 to-indigo-400">
                دليل التعريفات والأسعار
              </h1>
              <p className="text-slate-400 mt-1 font-medium flex items-center gap-2">
                <Info className="w-4 h-4" />
                بيانات رسمية مستخلصة من النظام لحساب فواتير التخزين
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

          {/* SECTION: NON-STANDARD (Primary request) */}
          <section className="bg-linear-to-br from-amber-500/10 to-orange-500/5 border border-amber-500/20 rounded-4xl overflow-hidden shadow-2xl shadow-amber-500/5">
            <div className="p-6 md:p-8">
              <div className="flex items-center gap-4 mb-6">
                <div className="p-4 bg-amber-500/20 text-amber-400 rounded-3xl">
                  <Maximize className="w-8 h-8" />
                </div>
                <div>
                  <h2 className="text-xl md:text-2xl font-bold text-amber-400">الحاويات غير المنتظمة</h2>
                  <p className="text-sm text-slate-400 font-medium">Non-Standard Containers (OOG)</p>
                </div>
              </div>

              <div className="space-y-4">
                <p className="text-sm leading-relaxed text-slate-300">
                  تُعرف الحاويات غير المنتظمة بأنها التي تتجاوز أبعادها أبعاد الحاوية القياسية، مما يتطلب معدات خاصة أو عناية فائقة. يتم احتساب رسومها عن طريق مضاعفة السعر الأساسي.
                </p>

                <div className="grid grid-cols-1 gap-4 mt-6">
                  <div className="bg-slate-900/50 p-5 rounded-2xl border border-slate-800/50 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-full -mr-12 -mt-12 group-hover:scale-150 transition-transform duration-500" />
                    <div className="flex items-start justify-between relative z-10">
                      <div>
                        <h3 className="font-bold text-slate-50">غير منتظم (OOG)</h3>
                        <p className="text-xs text-slate-500 mt-1">الاسبريدر العادي</p>
                      </div>
                      <div className="text-center bg-amber-500 text-slate-950 px-3 py-1 rounded-xl text-xs font-black">
                        السعر × ٢
                      </div>
                    </div>
                  </div>

                  <div className="bg-slate-900/50 p-5 rounded-2xl border border-slate-800/50 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-orange-500/5 rounded-full -mr-12 -mt-12 group-hover:scale-150 transition-transform duration-500" />
                    <div className="flex items-start justify-between relative z-10">
                      <div>
                        <h3 className="font-bold text-slate-50">تصبين (Lashing)</h3>
                        <p className="text-xs text-slate-500 mt-1">الرفع بالويرات</p>
                      </div>
                      <div className="text-center bg-orange-500 text-slate-950 px-3 py-1 rounded-xl text-xs font-black">
                        السعر × ٤
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-6 p-4 bg-slate-900/80 rounded-2xl border border-slate-800 flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-1" />
                  <p className="text-xs text-slate-400 leading-relaxed italic">
                    ملاحظة: يتم تطبيق معامل الضرب (×٢ أو ×٤) على رسوم التخزين اليومية بعد تطبيق فترة السماح، رسوم النقل، رسوم الأوناش، وكذلك رسوم تفريغ المشمول.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* SECTION: BASIC STORAGE (import 20/40) */}
          <section className="bg-slate-900/40 border border-slate-800 rounded-4xl overflow-hidden">
            <div className="p-6 md:p-8">
              <div className="flex items-center gap-4 mb-6">
                <div className="p-4 bg-blue-500/20 text-blue-400 rounded-3xl">
                  <Package className="w-8 h-8" />
                </div>
                <div>
                  <h2 className="text-xl md:text-2xl font-bold text-blue-400">تخزين الوارد (عادي)</h2>
                  <p className="text-sm text-slate-400 font-medium">Standard Storage Rates</p>
                </div>
              </div>

              <div className="space-y-6">
                {/* 20ft */}
                <div className="relative">
                  <div className="flex items-center justify-between mb-3 px-2">
                    <span className="font-bold text-slate-50">حاوية ٢٠ قدم</span>
                    <span className="text-xs px-2 py-1 bg-slate-800 text-slate-400 rounded-lg">سماح ٥ أيام</span>
                  </div>
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-slate-500 text-right">
                        <th className="pb-2 pr-2 font-medium">الشريحة</th>
                        <th className="pb-2 text-center font-medium">الأيام</th>
                        <th className="pb-2 text-left font-medium">السعر اليومي</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                      <tr>
                        <td className="py-3 pr-2 text-slate-300 font-medium">الأولى</td>
                        <td className="py-3 text-center text-slate-400">٦ — ٢٠</td>
                        <td className="py-3 text-left text-blue-400 font-bold">$ {fmt(t20.FULL.TIERS[0].rate)}</td>
                      </tr>
                      <tr>
                        <td className="py-3 pr-2 text-slate-300 font-medium">الثانية</td>
                        <td className="py-3 text-center text-slate-400">٢١ +</td>
                        <td className="py-3 text-left text-blue-400 font-bold">$ {fmt(t20.FULL.TIERS[1].rate)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* 40ft */}
                <div className="relative mt-8 pt-6 border-t border-slate-800">
                  <div className="flex items-center justify-between mb-3 px-2">
                    <span className="font-bold text-slate-50">حاوية ٤٠ قدم</span>
                    <span className="text-xs px-2 py-1 bg-slate-800 text-slate-400 rounded-lg">سماح ٥ أيام</span>
                  </div>
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-slate-500 text-right">
                        <th className="pb-2 pr-2 font-medium">الشريحة</th>
                        <th className="pb-2 text-center font-medium">الأيام</th>
                        <th className="pb-2 text-left font-medium">السعر اليومي</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                      <tr>
                        <td className="py-3 pr-2 text-slate-300 font-medium">الأولى</td>
                        <td className="py-3 text-center text-slate-400">٦ — ٢٠</td>
                        <td className="py-3 text-left text-blue-400 font-bold">$ {fmt(t40.FULL.TIERS[0].rate)}</td>
                      </tr>
                      <tr>
                        <td className="py-3 pr-2 text-slate-300 font-medium">الثانية</td>
                        <td className="py-3 text-center text-slate-400">٢١ +</td>
                        <td className="py-3 text-left text-blue-400 font-bold">$ {fmt(t40.FULL.TIERS[1].rate)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </section>

          {/* SECTION: REEFER STORAGE (مبرّد) */}
          <section className="bg-slate-900/40 border border-slate-800 rounded-4xl overflow-hidden shadow-2xl shadow-cyan-500/5">
            <div className="p-6 md:p-8">
              <div className="flex items-center gap-4 mb-6">
                <div className="p-4 bg-cyan-500/20 text-cyan-400 rounded-3xl">
                  <Snowflake className="w-8 h-8" />
                </div>
                <div>
                  <h2 className="text-xl md:text-2xl font-bold text-cyan-400">تخزين الوارد (ثلاجة ❄️)</h2>
                  <p className="text-sm text-slate-400 font-medium">Reefer Storage Rates</p>
                </div>
              </div>

              <div className="space-y-6">
                {/* 20ft Reefer */}
                <div className="relative">
                  <div className="flex items-center justify-between mb-3 px-2">
                    <span className="font-bold text-slate-50">حاوية ٢٠ قدم ثلاجة</span>
                    <span className="text-xs px-2 py-1 bg-cyan-500/10 text-cyan-400 rounded-lg">لا توجد فترة سماح</span>
                  </div>
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-slate-500 text-right">
                        <th className="pb-2 pr-2 font-medium">الشريحة</th>
                        <th className="pb-2 text-center font-medium">الأيام</th>
                        <th className="pb-2 text-left font-medium">السعر اليومي</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                      {t20.REEFER.TIERS.map((tier, idx) => (
                        <tr key={idx}>
                          <td className="py-3 pr-2 text-slate-300 font-medium">{tier.name}</td>
                          <td className="py-3 text-center text-slate-400">{tier.minDay} — {tier.maxDay === Infinity ? 'ما فوق' : tier.maxDay}</td>
                          <td className="py-3 text-left text-cyan-400 font-bold">$ {fmt(tier.rate)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* 40ft Reefer */}
                <div className="relative mt-8 pt-6 border-t border-slate-800">
                  <div className="flex items-center justify-between mb-3 px-2">
                    <span className="font-bold text-slate-50">حاوية ٤٠ قدم ثلاجة </span>
                    <span className="text-xs px-2 py-1 bg-cyan-500/10 text-cyan-400 rounded-lg">لا توجد فترة سماح</span>
                  </div>
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-slate-500 text-right">
                        <th className="pb-2 pr-2 font-medium">الشريحة</th>
                        <th className="pb-2 text-center font-medium">الأيام</th>
                        <th className="pb-2 text-left font-medium">السعر اليومي</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                      {t40.REEFER.TIERS.map((tier, idx) => (
                        <tr key={idx}>
                          <td className="py-3 pr-2 text-slate-300 font-medium">{tier.name}</td>
                          <td className="py-3 text-center text-slate-400">{tier.minDay} — {tier.maxDay === Infinity ? 'ما فوق' : tier.maxDay}</td>
                          <td className="py-3 text-left text-cyan-400 font-bold">$ {fmt(tier.rate)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </section>

          {/* SECTION: DANGEROUS STORAGE (خطر) */}
          <section className="bg-slate-900/40 border border-slate-800 rounded-4xl overflow-hidden shadow-2xl shadow-red-500/5">
            <div className="p-6 md:p-8">
              <div className="flex items-center gap-4 mb-6">
                <div className="p-4 bg-red-500/20 text-red-400 rounded-3xl">
                  <ShieldAlert className="w-8 h-8" />
                </div>
                <div>
                  <h2 className="text-xl md:text-2xl font-bold text-red-400">تخزين بضائع خطرة (⚠️)</h2>
                  <p className="text-sm text-slate-400 font-medium">Dangerous Goods Storage</p>
                </div>
              </div>

              <div className="space-y-6">
                {/* 20ft Dangerous */}
                <div className="relative">
                  <div className="flex items-center justify-between mb-3 px-2">
                    <span className="font-bold text-slate-50">حاوية ٢٠ قدم خطرة</span>
                    <span className="text-xs px-2 py-1 bg-red-500/10 text-red-400 rounded-lg">لا توجد فترة سماح</span>
                  </div>
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-slate-500 text-right">
                        <th className="pb-2 pr-2 font-medium">الشريحة</th>
                        <th className="pb-2 text-center font-medium">الأيام</th>
                        <th className="pb-2 text-left font-medium">السعر اليومي</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                      {t20.DANGEROUS.TIERS.map((tier, idx) => (
                        <tr key={idx}>
                          <td className="py-3 pr-2 text-slate-300 font-medium">{tier.name}</td>
                          <td className="py-3 text-center text-slate-400">{tier.minDay} — {tier.maxDay === Infinity ? 'ما فوق' : tier.maxDay}</td>
                          <td className="py-3 text-left text-red-400 font-bold">$ {fmt(tier.rate)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* 40ft Dangerous */}
                <div className="relative mt-8 pt-6 border-t border-slate-800">
                  <div className="flex items-center justify-between mb-3 px-2">
                    <span className="font-bold text-slate-50">حاوية ٤٠ قدم خطرة</span>
                    <span className="text-xs px-2 py-1 bg-red-500/10 text-red-400 rounded-lg">لا توجد فترة سماح</span>
                  </div>
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-slate-500 text-right">
                        <th className="pb-2 pr-2 font-medium">الشريحة</th>
                        <th className="pb-2 text-center font-medium">الأيام</th>
                        <th className="pb-2 text-left font-medium">السعر اليومي</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                      {t40.DANGEROUS.TIERS.map((tier, idx) => (
                        <tr key={idx}>
                          <td className="py-3 pr-2 text-slate-300 font-medium">{tier.name}</td>
                          <td className="py-3 text-center text-slate-400">{tier.minDay} — {tier.maxDay === Infinity ? 'ما فوق' : tier.maxDay}</td>
                          <td className="py-3 text-left text-red-400 font-bold">$ {fmt(tier.rate)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </section>

          {/* SECTION: ADDITIONAL SERVICES */}
          <section className="bg-slate-900/40 border border-slate-800 rounded-4xl overflow-hidden md:col-span-2">
            <div className="p-6 md:p-8">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                  <div className="p-4 bg-indigo-500/20 text-indigo-400 rounded-3xl">
                    <Wrench className="w-8 h-8" />
                  </div>
                  <div>
                    <h2 className="text-xl md:text-2xl font-bold text-indigo-400">الخدمات الإضافية</h2>
                    <p className="text-sm text-slate-400 font-medium">Ancillary & Container Services</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">

                {/* Yard Shifting */}
                <div className="bg-slate-950/50 p-6 rounded-3xl border border-slate-800/50 hover:border-indigo-500/30 transition-colors">
                  <div className="flex items-center gap-3 mb-4">
                    <Truck className="w-5 h-5 text-indigo-400" />
                    <h3 className="font-bold text-slate-100">نقل بين الساحات</h3>
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm py-2 border-b border-white/5">
                      <span className="text-slate-400">٢٠ قدم</span>
                      <span className="font-bold text-indigo-400">$ {fmt(svcs.SHIFTING.YARD_TO_YARD.rate20)}</span>
                    </div>
                    <div className="flex justify-between text-sm py-2">
                      <span className="text-slate-400">٤٠ قدم</span>
                      <span className="font-bold text-indigo-400">$ {fmt(svcs.SHIFTING.YARD_TO_YARD.rate40)}</span>
                    </div>
                  </div>
                </div>

                {/* Cargo Stripping */}
                <div className="bg-slate-950/50 p-6 rounded-3xl border border-slate-800/50 hover:border-indigo-500/30 transition-colors">
                  <div className="flex items-center gap-3 mb-4">
                    <Zap className="w-5 h-5 text-indigo-400" />
                    <h3 className="font-bold text-slate-100">تفريغ / شحن المشمول</h3>
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm py-2 border-b border-white/5">
                      <span className="text-slate-400">٢٠ قدم</span>
                      <span className="font-bold text-indigo-400">$ {fmt(t20.CARGO_SERVICE_FEE)}</span>
                    </div>
                    <div className="flex justify-between text-sm py-2">
                      <span className="text-slate-400">٤٠ قدم</span>
                      <span className="font-bold text-indigo-400">$ {fmt(t40.CARGO_SERVICE_FEE)}</span>
                    </div>
                  </div>
                </div>

                {/* Cranes */}
                <div className="bg-slate-950/50 p-6 rounded-3xl border border-slate-800/50 hover:border-indigo-500/30 transition-colors">
                  <div className="flex items-center gap-3 mb-4">
                    <Wrench className="w-5 h-5 text-indigo-400" />
                    <h3 className="font-bold text-slate-100">خدمات الأوناش</h3>
                  </div>
                  <div className="space-y-2">
                    {SERVICES_LIST.filter(s => s.id.startsWith('crane')).map(s => (
                      <div key={s.id} className="flex justify-between text-sm py-1.5 border-b border-white/5 last:border-0">
                        <span className="text-slate-400">{s.name}</span>
                        <span className="font-bold text-indigo-400">$ {fmt(s.rate)}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Fixed Service Fee */}
                <div className="bg-slate-950/50 p-6 rounded-3xl border border-slate-800/50 hover:border-indigo-500/30 transition-colors">
                  <div className="flex items-center gap-3 mb-4">
                    <Clock className="w-5 h-5 text-indigo-400" />
                    <h3 className="font-bold text-slate-100">رسوم خدمات ثابتة</h3>
                  </div>
                  <p className="text-xs text-slate-500 mb-4 leading-relaxed">تُدفع مرة واحدة لكل حاوية في الفاتورة الأولى فقط.</p>
                  <div className="flex justify-between text-sm py-2">
                    <span className="text-slate-400">لكل حاوية</span>
                    <span className="font-bold text-indigo-400">$ {fmt(t20.FULL.FIXED_SERVICE_FEE)}</span>
                  </div>
                </div>

                {/* Emergency Yard */}
                <div className="bg-slate-950/50 p-6 rounded-3xl border border-slate-800/50 hover:border-indigo-500/30 transition-colors">
                  <div className="flex items-center gap-3 mb-4">
                    <AlertTriangle className="w-5 h-5 text-indigo-400" />
                    <h3 className="font-bold text-slate-100">ساحة الطوارئ</h3>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm py-1.5 border-b border-white/5">
                      <span className="text-slate-400">أول ٣ أيام</span>
                      <span className="font-bold text-indigo-400">$ {fmt(svcs.DANGER_YARD.TIERS[0].rate)}</span>
                    </div>
                    <div className="flex justify-between text-sm py-1.5">
                      <span className="text-slate-400">ما بعد ذلك</span>
                      <span className="font-bold text-indigo-400">$ {fmt(svcs.DANGER_YARD.TIERS[1].rate)}</span>
                    </div>
                  </div>
                </div>

                {/* Holiday Release */}
                <div className="bg-linear-to-r from-green-500/10 to-emerald-500/5 p-6 rounded-3xl border border-green-500/20 shadow-lg shadow-green-500/5 flex flex-col justify-center">
                  <div className="flex items-center gap-3 mb-4">
                    <Zap className="w-6 h-6 text-green-400" />
                    <h3 className="font-bold text-white">صرف يوم عطلة</h3>
                  </div>
                  <ul className="text-[11px] space-y-2 text-green-100/70">
                    <li className="flex items-start gap-2">• رسم ثابت <span className="font-bold text-green-400">$١٠</span> لكل بوليصة.</li>
                    <li className="flex items-start gap-2">• <span className="font-bold text-green-400">+٥٠٪</span> على رسوم النقل (بين الساحات).</li>
                    <li className="flex items-start gap-2">• <span className="font-bold text-green-400">+٥٠٪</span> على رسوم تفريغ / شحن المشمول.</li>
                  </ul>
                </div>

                {/* Taxes & Gov Fees */}
                <div className="bg-slate-950/50 p-6 rounded-3xl border border-slate-800/50 hover:border-indigo-500/30 transition-colors flex flex-col justify-center">
                  <div className="flex items-center gap-3 mb-4">
                    <Info className="w-5 h-5 text-indigo-400" />
                    <h3 className="font-bold text-slate-100 font-sans">الضرائب والرسوم السيادية</h3>
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm py-2 border-b border-white/5">
                      <span className="text-slate-400">ضريبة القيمة المضافة</span>
                      <span className="font-bold text-indigo-400">14 %</span>
                    </div>
                    <div className="flex justify-between text-sm py-2">
                      <span className="text-slate-400">رسم دمغة الشهيد</span>
                      <span className="font-bold text-indigo-400">{fmt(STORAGE_CONFIG.GLOBAL.MARTYR_STAMP_FEE)} ج.م (ثابت)</span>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </section>

          {/* SECTION: SPECIAL RULES */}
          <section className="bg-slate-900/40 border border-slate-800 rounded-4xl overflow-hidden md:col-span-2">
            <div className="p-6 md:p-8">
              <div className="flex items-center gap-4 mb-6">
                <div className="p-4 bg-indigo-500/20 text-indigo-400 rounded-3xl">
                  <Info className="w-8 h-8" />
                </div>
                <div>
                  <h2 className="text-xl md:text-2xl font-bold text-indigo-400">قواعد حساب الحالات الخاصة</h2>
                  <p className="text-sm text-slate-400 font-medium">Special Invoice Calculation Rules</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">

                {/* External Storage */}
                <div className="bg-slate-950/50 p-6 rounded-3xl border border-slate-800/50 hover:border-indigo-500/30 transition-colors">
                  <div className="flex items-center gap-3 mb-4">
                    <ExternalLink className="w-5 h-5 text-indigo-400" />
                    <h3 className="font-bold text-slate-100">التخزين الخارجي</h3>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    خروج الحاوية لساحة خارجية يلغي فترة السماح (0 أيام)، ويبدأ حساب التخزين فوراً من اليوم الأول بالتعريفة الأساسية.
                  </p>
                </div>

                {/* LCL Storage - جديد */}
                <div className="bg-slate-950/50 p-6 rounded-3xl border border-amber-500/20 hover:border-amber-500/40 transition-colors shadow-lg shadow-amber-500/5">
                  <div className="flex items-center gap-3 mb-4">
                    <Package className="w-5 h-5 text-amber-400" />
                    <h3 className="font-bold text-slate-100">المخزن المشترك (LCL)</h3>
                  </div>
                  <div className="space-y-2">
                    <p className="text-xs text-slate-400 leading-relaxed">
                      التخزين بالمخزن المشترك يمنح فترة سماح <span className="text-amber-400 font-bold">3 أيام فقط</span> بدلاً من 5 أيام.
                    </p>
                    <ul className="text-[11px] text-slate-500 space-y-1.5 mt-3">
                      <li className="flex items-start gap-2">
                        <span className="text-amber-400">•</span>
                        <span>يتم احتساب تفريغ المشمول تلقائياً بـ <span className="text-amber-400 font-bold">نصف السعر</span></span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-amber-400">•</span>
                        <span>يتم احتساب نقل بين الساحات تلقائياً</span>
                      </li>
                    </ul>
                  </div>
                </div>

                {/* Cargo Storage */}
                <div className="bg-slate-950/50 p-6 rounded-3xl border border-slate-800/50 hover:border-indigo-500/30 transition-colors">
                  <div className="flex items-center gap-3 mb-4">
                    <Package className="w-5 h-5 text-indigo-400" />
                    <h3 className="font-bold text-slate-100">أرضيات المشمول</h3>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    في حالة خروج مشمول الحاوية الوارد خارج الحاوية في الساحة لأي سبب من الأسباب وعدم دخوله
                    مرة أخري إلي الحاوية يتم احتساب أرضيات عن المشمول بعدد (٢) حاوية من نفس مقاس الحاوية (بعد فترة سماح يوم وحد للمشمول) بالإضافة لأرضيات الحاوية الأصلية.                  </p>
                </div>

                {/* Renewal Billing */}
                <div className="bg-slate-950/50 p-6 rounded-3xl border border-slate-800/50 hover:border-indigo-500/30 transition-colors">
                  <div className="flex items-center gap-3 mb-4">
                    <Clock className="w-5 h-5 text-indigo-400" />
                    <h3 className="font-bold text-slate-100">تجديد الفاتورة (تجديد التاريخ)</h3>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    عند تأخر الصرف عن تاريخ الفاتورة، يُجدد تاريخها لحساب الأيام الإضافية: تُستكمل فترة السماح طبيعياً (مجاناً حتى اليوم الخامس)، وتُلغى الرسوم الثابتة ($25) فلا تُدفع مجدداً.
                  </p>
                </div>

              </div>
            </div>
          </section>

        </div>

        {/* Footer info */}
        <div className="mt-12 text-center pb-8">
          <p className="text-[10px] text-slate-600 uppercase tracking-[0.2em] font-medium flex items-center justify-center gap-2">
            <Clock className="w-3 h-3" />
            آخر تحديث للبيانات: ٢٥ مايو ٢٠٢٦ — المصدر: وحدة المحاسبة م. أشرف
          </p>
        </div>

      </div>
    </div>
  );
}
