'use client';
import Link from 'next/link';
import { Heart, Shield, Brain, Calendar, Users, Activity, ChevronRight, Star } from 'lucide-react';

const features = [
  { icon: Shield, title: 'Secure & Private', desc: 'JWT-protected data with role-based access for patients, doctors, and admins.' },
  { icon: Brain, title: 'AI-Powered Insights', desc: 'Wait time predictions and symptom analysis powered by ML models.' },
  { icon: Calendar, title: 'Smart Scheduling', desc: 'Book appointments in seconds, get confirmed, and track status live.' },
  { icon: Users, title: 'Multi-Role Platform', desc: 'Separate dashboards for patients, doctors, and administrators.' },
];

const portals = [
  { role: 'Patient', desc: 'Book appointments, view history & AI health reports', href: '/auth/patient/login', color: 'from-blue-500 to-cyan-400', icon: Activity },
  { role: 'Doctor', desc: 'Manage appointments, add notes & prescriptions', href: '/auth/doctor/login', color: 'from-purple-500 to-pink-400', icon: Heart },
  { role: 'Admin', desc: 'Oversee platform, users, and statistics', href: '/auth/admin/login', color: 'from-emerald-500 to-teal-400', icon: Shield },
];

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#0a0e1a]">
      {/* Navbar */}
      <nav className="border-b border-[#1e2d4a] px-6 py-4 flex items-center justify-between max-w-7xl mx-auto">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
            <Heart className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-xl text-[#e8eaf0]">MedCare</span>
        </div>
        <div className="hidden md:flex items-center gap-6 text-sm text-[#8892a4]">
          <Link href="/about" className="hover:text-[#e8eaf0] transition-colors">About</Link>
          <Link href="/contact" className="hover:text-[#e8eaf0] transition-colors">Contact</Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-7xl mx-auto px-6 py-20 text-center">
        <div className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 rounded-full px-4 py-1.5 mb-6">
          <Star className="w-3.5 h-3.5 text-blue-400" />
          <span className="text-xs text-blue-400 font-medium">AI-Powered Healthcare Platform</span>
        </div>
        <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
          Your Health,{' '}
          <span className="gradient-text">Intelligently</span>
          <br />Managed
        </h1>
        <p className="text-[#8892a4] text-lg md:text-xl max-w-2xl mx-auto mb-10 leading-relaxed">
          A modern microservices healthcare platform connecting patients and doctors with AI-powered insights, seamless scheduling, and real-time updates.
        </p>
        <div className="flex flex-wrap gap-4 justify-center">
          <Link
            href="/auth/patient/register"
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold px-8 py-3.5 rounded-xl transition-all duration-200 shadow-lg shadow-blue-600/30"
          >
            Get Started Free <ChevronRight className="w-4 h-4" />
          </Link>
          <Link
            href="/auth/doctor/login"
            className="inline-flex items-center gap-2 border border-[#1e2d4a] hover:border-blue-500/50 text-[#e8eaf0] font-semibold px-8 py-3.5 rounded-xl transition-all duration-200 hover:bg-blue-500/10"
          >
            I&apos;m a Doctor
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-7xl mx-auto px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((f) => (
            <div key={f.title} className="glass-card p-6 hover:border-blue-500/30 transition-all duration-300">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center mb-4">
                <f.icon className="w-5 h-5 text-blue-400" />
              </div>
              <h3 className="font-semibold text-[#e8eaf0] mb-2">{f.title}</h3>
              <p className="text-sm text-[#8892a4] leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Portal cards */}
      <section className="max-w-7xl mx-auto px-6 py-16">
        <h2 className="text-3xl font-bold text-center text-[#e8eaf0] mb-3">Choose Your Portal</h2>
        <p className="text-center text-[#8892a4] mb-10">Select the role that fits you best</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {portals.map((p) => (
            <Link key={p.role} href={p.href} className="glass-card p-8 hover:border-blue-500/30 transition-all duration-300 group block">
              <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${p.color} flex items-center justify-center mb-5 shadow-lg group-hover:scale-105 transition-transform duration-200`}>
                <p.icon className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-bold text-[#e8eaf0] mb-2">{p.role}</h3>
              <p className="text-sm text-[#8892a4] mb-5 leading-relaxed">{p.desc}</p>
              <span className="inline-flex items-center gap-1.5 text-blue-400 text-sm font-medium group-hover:gap-3 transition-all duration-200">
                Sign In <ChevronRight className="w-4 h-4" />
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#1e2d4a] py-8 text-center text-sm text-[#8892a4]">
        <p>© 2026 MedCare · Built with Next.js · Microservices Architecture</p>
      </footer>
    </div>
  );
}
