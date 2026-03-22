import Link from 'next/link';
import { HeartPulse, Target, Users, Sparkles, ChevronRight } from 'lucide-react';

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-[#0a0e1a]">
      <nav className="border-b border-[#1e2d4a] px-6 py-4 flex items-center justify-between max-w-6xl mx-auto">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
            <HeartPulse className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-[#e8eaf0]">MedCare</span>
        </Link>
        <Link href="/" className="text-sm text-[#8892a4] hover:text-[#e8eaf0] transition-colors">← Home</Link>
      </nav>

      <div className="max-w-4xl mx-auto px-6 py-20">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-[#e8eaf0] mb-4">About <span className="gradient-text">MedCare</span></h1>
          <p className="text-[#8892a4] text-lg max-w-xl mx-auto leading-relaxed">
            A modern healthcare management system built on a microservices architecture, connecting patients, doctors, and administrators seamlessly.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
          {[
            { icon: Target,    title: 'Our Mission',   desc: 'Simplify healthcare management by providing intelligent tools for every stakeholder in the healthcare ecosystem.' },
            { icon: Users,     title: 'Who We Serve',  desc: 'Patients booking appointments, doctors managing schedules, and administrators overseeing the platform.' },
            { icon: Sparkles,  title: 'AI-Powered',    desc: 'Machine learning models predict wait times and analyze symptoms to assist in better clinical decisions.' },
          ].map((item) => (
            <div key={item.title} className="glass-card p-6">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center mb-4">
                <item.icon className="w-5 h-5 text-blue-400" />
              </div>
              <h3 className="font-semibold text-[#e8eaf0] mb-2">{item.title}</h3>
              <p className="text-sm text-[#8892a4] leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>

        <div className="glass-card p-8 text-center">
          <h2 className="text-2xl font-bold text-[#e8eaf0] mb-3">Ready to get started?</h2>
          <p className="text-[#8892a4] mb-6">Join thousands of patients and healthcare providers on MedCare.</p>
          <Link href="/auth/patient/register" className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold px-6 py-3 rounded-xl transition-all duration-200">
            Get Started <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
