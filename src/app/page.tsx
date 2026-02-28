"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";

const features = [
  {
    icon: "🗂️",
    title: "Life-Based Organisation",
    subtitle: "Not folders. Life categories.",
    description:
      "Documents are grouped by Identity, Education, Health, Finance, Property, Travel, and Work — the way your life actually works.",
    color: "from-violet-500/20 to-purple-500/20",
    border: "border-violet-500/30",
    badge: "bg-violet-500/10 text-violet-300",
  },
  {
    icon: "⏰",
    title: "Smart Expiry Engine",
    subtitle: "Never miss a renewal again.",
    description:
      "Automatically detects expiry dates on passports, insurance, and licenses. Nudges you early — before it's too late.",
    color: "from-amber-500/20 to-orange-500/20",
    border: "border-amber-500/30",
    badge: "bg-amber-500/10 text-amber-300",
  },
  {
    icon: "🧠",
    title: "Usage Intelligence",
    subtitle: "Know where every document lives.",
    description:
      "PAN used for tax, banking, and job? Aadhaar for SIM and KYC? We map it all, so you never accidentally delete something critical.",
    color: "from-emerald-500/20 to-teal-500/20",
    border: "border-emerald-500/30",
    badge: "bg-emerald-500/10 text-emerald-300",
  },
  {
    icon: "🔒",
    title: "Secure Smart Sharing",
    subtitle: "No more raw PDFs on WhatsApp.",
    description:
      "Generate time-limited, watermarked share links for specific purposes — Bank, HR, College. Revoke anytime with one click.",
    color: "from-sky-500/20 to-blue-500/20",
    border: "border-sky-500/30",
    badge: "bg-sky-500/10 text-sky-300",
  },
  {
    icon: "👨‍👩‍👧‍👦",
    title: "Family Vault",
    subtitle: "One system for the whole family.",
    description:
      "Shared documents with role-based access. Emergency access mode for critical situations. Everyone's paperwork, one place.",
    color: "from-rose-500/20 to-pink-500/20",
    border: "border-rose-500/30",
    badge: "bg-rose-500/10 text-rose-300",
  },
  {
    icon: "🔍",
    title: "Category Health Check",
    subtitle: "See your paperwork coverage at a glance.",
    description:
      "Instantly know which life areas are well-documented and which need attention. Never feel blindsided by missing paperwork.",
    color: "from-indigo-500/20 to-blue-500/20",
    border: "border-indigo-500/30",
    badge: "bg-indigo-500/10 text-indigo-300",
  },
];

const steps = [
  {
    number: "01",
    title: "Sign up in 30 seconds",
    description: "Create your secure account with just your email and a password. No credit card needed to start.",
  },
  {
    number: "02",
    title: "Add your documents",
    description: "Log your documents by life category. Add expiry dates, notes, and map where each document is used.",
  },
  {
    number: "03",
    title: "Get reminders that matter",
    description: "We track every expiry date and nudge you well in advance. Never scramble at the last moment.",
  },
  {
    number: "04",
    title: "Share safely, not recklessly",
    description: "Generate secure, watermarked share links instead of forwarding originals on WhatsApp.",
  },
];

const segments = [
  { emoji: "🎓", label: "Students", description: "Marksheets, IDs, internship letters, certificates" },
  { emoji: "👨‍💼", label: "Professionals", description: "PAN, Aadhaar, salary slips, offer letters, insurance" },
  { emoji: "👨‍👩‍👧", label: "Families", description: "Shared access, kids' documents, medical history" },
  { emoji: "👴", label: "Seniors", description: "Pension, medical, insurance, property papers" },
];

const stats = [
  { value: "7", label: "Life categories", suffix: "" },
  { value: "48", label: "hrs saved yearly", suffix: "+" },
  { value: "100", label: "Documents per vault", suffix: "%" },
  { value: "0", label: "WhatsApp PDFs needed", suffix: "" },
];

const testimonials = [
  {
    quote: "I finally know exactly when my car insurance expires. No more panicking at 11 PM before renewal.",
    name: "Priya Sharma",
    role: "Software Engineer, Bengaluru",
    avatar: "P",
    color: "bg-violet-500",
  },
  {
    quote: "Sharing documents with my CA used to be a mess. Now I send a secure link and revoke it after. Game changer.",
    name: "Rahul Mehra",
    role: "Business Owner, Mumbai",
    avatar: "R",
    color: "bg-emerald-500",
  },
  {
    quote: "My parents' medical records and property papers are finally organised. I feel so much more in control.",
    name: "Ananya Iyer",
    role: "Doctor, Chennai",
    avatar: "A",
    color: "bg-rose-500",
  },
];

export default function LandingPage() {
  const [mounted, setMounted] = useState(false);
  const heroRef = useRef<HTMLDivElement>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    setMounted(true);

    const handleMouseMove = (e: MouseEvent) => {
      if (!heroRef.current) return;
      const rect = heroRef.current.getBoundingClientRect();
      setMousePos({
        x: ((e.clientX - rect.left) / rect.width - 0.5) * 30,
        y: ((e.clientY - rect.top) / rect.height - 0.5) * 30,
      });
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  return (
    <div className="min-h-screen bg-[#080B14] text-white overflow-x-hidden">
      {/* ── Nav ── */}
      <nav className="fixed top-0 inset-x-0 z-50 border-b border-white/5 backdrop-blur-xl bg-[#080B14]/80">
        <div className="mx-auto max-w-7xl px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl">📄</span>
            <span className="font-bold text-sm tracking-tight">
              Paperwork <span className="text-violet-400">OS</span>
            </span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm text-slate-400">
            <a href="#features" className="hover:text-white transition-colors">Features</a>
            <a href="#how-it-works" className="hover:text-white transition-colors">How it works</a>
            <a href="#pricing" className="hover:text-white transition-colors">Pricing</a>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard"
              className="text-sm text-slate-400 hover:text-white transition-colors px-3 py-1.5"
            >
              Sign in
            </Link>
            <Link
              href="/dashboard"
              className="bg-violet-600 hover:bg-violet-500 transition-colors text-sm font-medium px-4 py-2 rounded-lg"
            >
              Get started free
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section
        ref={heroRef}
        className="relative min-h-screen flex items-center justify-center pt-24 pb-20 px-6 overflow-hidden"
      >
        {/* Animated background gradient */}
        <div
          className="absolute inset-0 opacity-40 transition-transform duration-700 ease-out"
          style={{
            background: `radial-gradient(ellipse 80% 60% at ${50 + (mounted ? mousePos.x * 0.3 : 0)}% ${40 + (mounted ? mousePos.y * 0.3 : 0)}%, rgba(139,92,246,0.3) 0%, rgba(59,130,246,0.15) 40%, transparent 70%)`,
          }}
        />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,rgba(16,185,129,0.08),transparent_60%)]" />

        {/* Grid texture */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.5) 1px, transparent 1px)`,
            backgroundSize: "60px 60px",
          }}
        />

        {/* Floating doc cards */}
        {mounted && (
          <>
            <div
              className="absolute top-32 left-[8%] hidden lg:block"
              style={{ transform: `translate(${mousePos.x * 0.1}px,${mousePos.y * 0.1}px)` }}
            >
              <div className="bg-white/5 border border-white/10 rounded-xl p-4 backdrop-blur-sm w-52 shadow-xl">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-lg">🪪</span>
                  <span className="text-xs font-medium">Aadhaar Card</span>
                </div>
                <div className="flex gap-1.5 flex-wrap">
                  <span className="text-[10px] bg-violet-500/20 text-violet-300 px-2 py-0.5 rounded-full">Identity</span>
                  <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full">KYC</span>
                </div>
              </div>
            </div>

            <div
              className="absolute top-48 right-[7%] hidden lg:block"
              style={{ transform: `translate(${-mousePos.x * 0.12}px,${mousePos.y * 0.08}px)` }}
            >
              <div className="bg-white/5 border border-white/10 rounded-xl p-4 backdrop-blur-sm w-56 shadow-xl">
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-lg">⚠️</span>
                  <span className="text-xs font-medium text-amber-300">Expiry Alert</span>
                </div>
                <p className="text-[11px] text-slate-400">Passport expires in <span className="text-red-400 font-semibold">23 days</span></p>
              </div>
            </div>

            <div
              className="absolute bottom-40 left-[10%] hidden xl:block"
              style={{ transform: `translate(${mousePos.x * 0.15}px,${-mousePos.y * 0.1}px)` }}
            >
              <div className="bg-white/5 border border-white/10 rounded-xl p-4 backdrop-blur-sm w-52 shadow-xl">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-lg">🔗</span>
                  <span className="text-xs font-medium text-sky-300">Secure Link</span>
                </div>
                <p className="text-[11px] text-slate-400">PAN Card — shared for <span className="font-medium text-white">HR verification</span></p>
                <p className="text-[10px] text-slate-500 mt-1">Expires in 24h · Watermarked</p>
              </div>
            </div>

            <div
              className="absolute bottom-36 right-[9%] hidden xl:block"
              style={{ transform: `translate(${-mousePos.x * 0.1}px,${-mousePos.y * 0.12}px)` }}
            >
              <div className="bg-white/5 border border-white/10 rounded-xl p-4 backdrop-blur-sm w-56 shadow-xl">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-lg">👨‍👩‍👧</span>
                  <span className="text-xs font-medium">Family Vault</span>
                </div>
                <p className="text-[11px] text-slate-400">3 members · Emergency access enabled</p>
              </div>
            </div>
          </>
        )}

        <div className="relative text-center max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-violet-500/10 border border-violet-500/20 text-violet-300 text-xs font-medium px-4 py-2 rounded-full mb-8">
            <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse" />
            Built for Indian life · Launching soon
          </div>

          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black tracking-tight leading-[1.05] mb-6">
            The missing OS for
            <br />
            <span className="bg-gradient-to-r from-violet-400 via-purple-400 to-sky-400 bg-clip-text text-transparent">
              Indian paperwork
            </span>
          </h1>

          <p className="text-lg sm:text-xl text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            Aadhaar in WhatsApp. PAN in email. Marksheet in cupboard.{" "}
            <span className="text-white font-medium">
              Personal Paperwork OS is the one place all your life documents belong — with expiry intelligence, usage
              mapping, and safe sharing.
            </span>
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/dashboard"
              className="group w-full sm:w-auto bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 transition-all duration-200 text-white font-semibold px-8 py-4 rounded-xl shadow-lg shadow-violet-900/40 text-sm flex items-center justify-center gap-2"
            >
              Start for free
              <span className="group-hover:translate-x-1 transition-transform">→</span>
            </Link>
            <a
              href="#features"
              className="w-full sm:w-auto bg-white/5 hover:bg-white/10 border border-white/10 transition-all duration-200 text-sm font-medium px-8 py-4 rounded-xl text-center"
            >
              See how it works
            </a>
          </div>

          <p className="mt-6 text-xs text-slate-600">
            No credit card required · Free forever for basic use
          </p>
        </div>
      </section>

      {/* ── Stats bar ── */}
      <section className="border-y border-white/5 bg-white/[0.02]">
        <div className="mx-auto max-w-5xl px-6 py-12 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {stats.map((stat) => (
            <div key={stat.label}>
              <p className="text-4xl font-black text-white">
                {stat.value}
                <span className="text-violet-400 ml-0.5">{stat.suffix}</span>
              </p>
              <p className="text-sm text-slate-500 mt-1">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Problem statement ── */}
      <section className="py-24 px-6">
        <div className="mx-auto max-w-5xl">
          <div className="text-center mb-16">
            <p className="text-slate-500 text-sm uppercase tracking-widest mb-3">The problem</p>
            <h2 className="text-4xl font-black leading-tight">
              Your documents are{" "}
              <span className="text-slate-500 line-through decoration-red-500">organised</span>
              <br />
              <span className="text-white">scattered everywhere</span>
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            {[
              { tool: "WhatsApp", problem: "Zero organisation. Zero security. Just chaos.", icon: "📱", color: "border-green-900/40 bg-green-950/20" },
              { tool: "Google Drive", problem: "Flat folders. No expiry intelligence. No context.", icon: "📁", color: "border-blue-900/40 bg-blue-950/20" },
              { tool: "DigiLocker", problem: "Government-first. Terrible UX. Never opened daily.", icon: "🏛️", color: "border-orange-900/40 bg-orange-950/20" },
            ].map((item) => (
              <div key={item.tool} className={`rounded-2xl border p-6 ${item.color}`}>
                <div className="text-3xl mb-3">{item.icon}</div>
                <h3 className="font-bold text-lg mb-2">{item.tool}</h3>
                <p className="text-slate-400 text-sm">{item.problem}</p>
                <div className="mt-4 flex items-center gap-2 text-red-400 text-xs font-medium">
                  <span className="text-red-400">✗</span> Broken for Indian life
                </div>
              </div>
            ))}
          </div>

          <div className="mt-12 rounded-2xl border border-violet-500/20 bg-violet-500/5 p-8 text-center">
            <p className="text-slate-400 text-sm mb-2">There is no product that owns this problem end-to-end.</p>
            <p className="text-xl font-bold text-white">
              That&apos;s exactly what Personal Paperwork OS is built to solve.
            </p>
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section id="features" className="py-24 px-6">
        <div className="mx-auto max-w-7xl">
          <div className="text-center mb-16">
            <p className="text-slate-500 text-sm uppercase tracking-widest mb-3">Core features</p>
            <h2 className="text-4xl font-black">
              Everything your paperwork
              <br />
              <span className="bg-gradient-to-r from-violet-400 to-sky-400 bg-clip-text text-transparent">
                deserves, finally
              </span>
            </h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((feature) => (
              <div
                key={feature.title}
                className={`group relative rounded-2xl border ${feature.border} bg-gradient-to-br ${feature.color} p-6 hover:scale-[1.02] transition-all duration-300 cursor-default`}
              >
                <div className="text-4xl mb-4">{feature.icon}</div>
                <span className={`text-[10px] rounded-full px-2.5 py-1 font-semibold uppercase tracking-wide ${feature.badge}`}>
                  {feature.subtitle}
                </span>
                <h3 className="mt-3 text-lg font-bold">{feature.title}</h3>
                <p className="mt-2 text-sm text-slate-400 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section id="how-it-works" className="py-24 px-6 border-t border-white/5">
        <div className="mx-auto max-w-5xl">
          <div className="text-center mb-16">
            <p className="text-slate-500 text-sm uppercase tracking-widest mb-3">How it works</p>
            <h2 className="text-4xl font-black">
              From chaos to clarity
              <br />
              <span className="text-slate-400">in four steps</span>
            </h2>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {steps.map((step, i) => (
              <div
                key={step.number}
                className="relative rounded-2xl border border-white/5 bg-white/[0.03] hover:bg-white/[0.05] transition-colors p-7"
              >
                <div className="flex items-start gap-5">
                  <div className="shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br from-violet-600 to-purple-600 flex items-center justify-center font-black text-sm">
                    {step.number}
                  </div>
                  <div>
                    <h3 className="font-bold text-lg mb-2">{step.title}</h3>
                    <p className="text-slate-400 text-sm leading-relaxed">{step.description}</p>
                  </div>
                </div>
                {i < steps.length - 1 && (
                  <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 md:hidden text-slate-700">↓</div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Who it's for ── */}
      <section className="py-24 px-6">
        <div className="mx-auto max-w-5xl">
          <div className="text-center mb-16">
            <p className="text-slate-500 text-sm uppercase tracking-widest mb-3">For everyone</p>
            <h2 className="text-4xl font-black">Paperwork pain has no age</h2>
            <p className="mt-4 text-slate-400 max-w-xl mx-auto">
              Whether you&apos;re a student or a senior, a professional or a parent — your paperwork deserves a home.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {segments.map((seg) => (
              <div
                key={seg.label}
                className="rounded-2xl border border-white/5 bg-white/[0.03] hover:bg-white/[0.06] hover:border-violet-500/20 transition-all duration-300 p-6 text-center group"
              >
                <div className="text-5xl mb-4 group-hover:scale-110 transition-transform duration-300">{seg.emoji}</div>
                <h3 className="font-bold text-lg mb-2">{seg.label}</h3>
                <p className="text-slate-400 text-sm">{seg.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Testimonials ── */}
      <section className="py-24 px-6 border-t border-white/5">
        <div className="mx-auto max-w-5xl">
          <div className="text-center mb-16">
            <p className="text-slate-500 text-sm uppercase tracking-widest mb-3">Early users</p>
            <h2 className="text-4xl font-black">Finally, someone built this</h2>
          </div>

          <div className="grid md:grid-cols-3 gap-5">
            {testimonials.map((t) => (
              <div
                key={t.name}
                className="rounded-2xl border border-white/5 bg-white/[0.03] p-6 flex flex-col justify-between"
              >
                <div>
                  <div className="text-violet-400 text-2xl mb-4">&ldquo;</div>
                  <p className="text-slate-300 leading-relaxed text-sm">{t.quote}</p>
                </div>
                <div className="flex items-center gap-3 mt-6">
                  <div className={`w-9 h-9 rounded-full ${t.color} flex items-center justify-center text-sm font-bold`}>
                    {t.avatar}
                  </div>
                  <div>
                    <p className="text-sm font-semibold">{t.name}</p>
                    <p className="text-xs text-slate-500">{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pricing ── */}
      <section id="pricing" className="py-24 px-6 border-t border-white/5">
        <div className="mx-auto max-w-4xl">
          <div className="text-center mb-16">
            <p className="text-slate-500 text-sm uppercase tracking-widest mb-3">Pricing</p>
            <h2 className="text-4xl font-black">
              Start free.{" "}
              <span className="bg-gradient-to-r from-violet-400 to-sky-400 bg-clip-text text-transparent">
                Upgrade when you need more.
              </span>
            </h2>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Free */}
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-8">
              <h3 className="text-xl font-bold mb-1">Free</h3>
              <p className="text-slate-500 text-sm mb-6">Get started with the basics</p>
              <div className="text-4xl font-black mb-6">
                ₹0
                <span className="text-slate-500 text-sm font-normal ml-1">/ month</span>
              </div>
              <ul className="space-y-3 mb-8 text-sm text-slate-400">
                {["Up to 15 documents", "Basic expiry reminders", "Secure share links", "1 family member"].map((item) => (
                  <li key={item} className="flex items-center gap-3">
                    <span className="text-emerald-400">✓</span>
                    {item}
                  </li>
                ))}
              </ul>
              <Link
                href="/dashboard"
                className="block w-full text-center bg-white/5 hover:bg-white/10 border border-white/10 transition-colors font-medium py-3 rounded-xl text-sm"
              >
                Get started free
              </Link>
            </div>

            {/* Premium */}
            <div className="relative rounded-2xl border border-violet-500/40 bg-gradient-to-br from-violet-500/10 to-purple-500/5 p-8">
              <div className="absolute -top-3 right-6 bg-violet-600 text-xs font-bold px-3 py-1 rounded-full">
                RECOMMENDED
              </div>
              <h3 className="text-xl font-bold mb-1">Premium</h3>
              <p className="text-slate-400 text-sm mb-6">The full Paperwork OS experience</p>
              <div className="text-4xl font-black mb-1">
                ₹149
                <span className="text-slate-500 text-sm font-normal ml-1">/ month</span>
              </div>
              <p className="text-slate-500 text-xs mb-6">or ₹999/year — save 44%</p>
              <ul className="space-y-3 mb-8 text-sm text-slate-300">
                {[
                  "Unlimited documents",
                  "Advanced expiry intelligence",
                  "Family vault (up to 10 members)",
                  "Watermarked secure sharing",
                  "Usage intelligence graph",
                  "Priority support",
                ].map((item) => (
                  <li key={item} className="flex items-center gap-3">
                    <span className="text-violet-400">✓</span>
                    {item}
                  </li>
                ))}
              </ul>
              <Link
                href="/dashboard"
                className="block w-full text-center bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 transition-all font-semibold py-3 rounded-xl text-sm shadow-lg shadow-violet-900/40"
              >
                Start free trial
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA Banner ── */}
      <section className="py-24 px-6">
        <div className="mx-auto max-w-4xl text-center">
          <div className="relative rounded-3xl border border-violet-500/20 bg-gradient-to-br from-violet-500/10 via-purple-500/5 to-sky-500/10 p-16 overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(139,92,246,0.15),transparent_70%)]" />
            <div className="relative">
              <h2 className="text-4xl sm:text-5xl font-black mb-6 leading-tight">
                Every Indian deserves
                <br />
                a paperwork system
                <br />
                <span className="bg-gradient-to-r from-violet-400 to-sky-400 bg-clip-text text-transparent">
                  that actually works.
                </span>
              </h2>
              <p className="text-slate-400 mb-10 max-w-xl mx-auto">
                Join thousands of Indians who&apos;ve stopped losing documents, missing renewals, and sending PDFs over WhatsApp.
              </p>
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-2 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 transition-all text-white font-bold px-10 py-4 rounded-xl text-base shadow-xl shadow-violet-900/40"
              >
                Start for free →
              </Link>
              <p className="mt-4 text-xs text-slate-600">No credit card · Cancel anytime · Made for India</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-white/5 py-12 px-6">
        <div className="mx-auto max-w-7xl flex flex-col md:flex-row items-center justify-between gap-6 text-sm text-slate-600">
          <div className="flex items-center gap-2">
            <span>📄</span>
            <span className="font-bold text-slate-400">
              Paperwork <span className="text-violet-400">OS</span>
            </span>
            <span className="ml-2">— The missing operating system for Indian life</span>
          </div>
          <div className="flex gap-6">
            <a href="#features" className="hover:text-slate-400 transition-colors">Features</a>
            <a href="#pricing" className="hover:text-slate-400 transition-colors">Pricing</a>
            <Link href="/dashboard" className="hover:text-slate-400 transition-colors">Sign in</Link>
          </div>
          <p>© 2026 Personal Paperwork OS. Built for India.</p>
        </div>
      </footer>
    </div>
  );
}
