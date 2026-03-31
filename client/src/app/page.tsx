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

const services = [
  { title: 'General Medicine', desc: 'Routine checkups, diagnostics, and general health consultations.', icon: Activity },
  { title: 'Cardiology', desc: 'Heart health, ECG analysis, and cardiovascular treatments.', icon: Heart },
  { title: 'Neurology', desc: 'Brain and nervous system disorders with expert neurologists.', icon: Brain },
  { title: 'Scheduling', desc: 'AI-assisted appointment booking with real-time slot availability.', icon: Calendar },
];

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#f0f4f8]">
      {/* Navbar */}
      <nav className="border-b border-[#cbd5e1] px-6 py-4 sticky top-0 z-50 bg-white/90 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
              <Heart className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-xl text-[#0f172a]">MedCare</span>
          </div>
          <div className="hidden md:flex items-center gap-6 text-sm text-[#475569]">
            <a href="#services" className="hover:text-[#0f172a] transition-colors">Services</a>
            <a href="#about" className="hover:text-[#0f172a] transition-colors">About</a>
            <a href="#portals" className="hover:text-[#0f172a] transition-colors">Portals</a>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/auth/patient/login" className="text-sm text-[#475569] hover:text-[#0f172a] transition-colors hidden sm:block">Sign In</Link>
            <Link
              href="/auth/patient/register"
              className="text-sm bg-blue-600 hover:bg-blue-500 text-white font-semibold px-4 py-2 rounded-xl transition-all duration-200"
            >
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-7xl mx-auto px-6 py-24 text-center">
        <div className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 rounded-full px-4 py-1.5 mb-6">
          <Star className="w-3.5 h-3.5 text-blue-400" />
          <span className="text-xs text-blue-400 font-medium">AI-Powered Healthcare Platform</span>
        </div>
        <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight text-[#0f172a]">
          Your Health,{' '}
          <span className="gradient-text">Intelligently</span>
          <br />Managed
        </h1>
        <p className="text-[#475569] text-lg md:text-xl max-w-2xl mx-auto mb-10 leading-relaxed">
          A modern microservices healthcare platform connecting patients and doctors with AI-powered insights, seamless scheduling, and real-time updates.
        </p>
        <div className="flex flex-wrap gap-4 justify-center">
          <Link
            href="/auth/patient/register"
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold px-8 py-3.5 rounded-xl transition-all duration-200 shadow-lg shadow-blue-600/30"
          >
            Book an Appointment <ChevronRight className="w-4 h-4" />
          </Link>
          <Link
            href="/auth/doctor/login"
            className="inline-flex items-center gap-2 border border-[#cbd5e1] hover:border-blue-500/50 text-[#0f172a] font-semibold px-8 py-3.5 rounded-xl transition-all duration-200 hover:bg-blue-500/10"
          >
            I&apos;m a Doctor
          </Link>
        </div>
      </section>

      {/* Services */}
      <section id="services" className="max-w-7xl mx-auto px-6 py-16">
        <h2 className="text-3xl font-bold text-center text-[#0f172a] mb-3">Our Services</h2>
        <p className="text-center text-[#475569] mb-10">Expert care across multiple specialties</p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {services.map((s) => (
            <div key={s.title} className="glass-card p-6 hover:border-blue-500/30 transition-all duration-300">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center mb-4">
                <s.icon className="w-5 h-5 text-blue-400" />
              </div>
              <h3 className="font-semibold text-[#0f172a] mb-2">{s.title}</h3>
              <p className="text-sm text-[#475569] leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="about" className="max-w-7xl mx-auto px-6 py-16">
        <div className="glass-card p-10 md:p-14 text-center">
          <h2 className="text-3xl font-bold text-[#0f172a] mb-4">Why MedCare?</h2>
          <p className="text-[#475569] text-lg mb-10 max-w-xl mx-auto">Built on industry-leading technology to give you the best healthcare experience.</p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((f) => (
              <div key={f.title} className="p-4 rounded-xl bg-[#f0f4f8] border border-[#cbd5e1] hover:border-blue-500/30 transition-all duration-300">
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center mb-4 mx-auto">
                  <f.icon className="w-5 h-5 text-blue-400" />
                </div>
                <h3 className="font-semibold text-[#0f172a] mb-2">{f.title}</h3>
                <p className="text-sm text-[#475569] leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-7xl mx-auto px-6 py-16">
        <div className="glass-card p-12 text-center border-blue-500/20">
          <h2 className="text-3xl font-bold text-[#0f172a] mb-4">Ready to take control of your health?</h2>
          <p className="text-[#475569] mb-8 max-w-xl mx-auto">Register as a patient today and get access to your personal dashboard, appointment booking, and AI-powered health reports.</p>
          <Link
            href="/auth/patient/register"
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold px-10 py-4 rounded-xl transition-all duration-200 shadow-lg shadow-blue-600/30 text-lg"
          >
            Create Free Account <ChevronRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#cbd5e1] py-8 text-center text-sm text-[#475569]">
        <p>© 2026 MedCare · Built with Next.js · Microservices Architecture</p>
      </footer>
    </div>
  );
}
