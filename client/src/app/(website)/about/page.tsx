import Link from 'next/link';
import { HeartPulse, Target, Users, Sparkles, ChevronRight, ArrowLeft } from 'lucide-react';

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-transparent text-[#eaf1ff]">
      <nav className="mx-auto flex max-w-6xl items-center justify-between border-b border-[#25395f] px-6 py-4">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[#1f9d8f] to-[#1f83c2]">
            <HeartPulse className="h-4 w-4 text-white" />
          </div>
          <span className="font-bold">MedCare</span>
        </Link>
        <Link href="/" className="inline-flex items-center gap-1 text-sm text-[#9ab2d7] transition-colors hover:text-[#eaf1ff]"><ArrowLeft className="h-3.5 w-3.5" /> Home</Link>
      </nav>

      <div className="mx-auto max-w-5xl px-6 py-16">
        <section className="mesh-bg mb-12 rounded-3xl border border-[#2a3d62] p-8 text-center">
          <h1 className="text-4xl font-bold sm:text-5xl">About <span className="gradient-text">MedCare</span></h1>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-[#9ab2d7]">
            MedCare is a healthcare management platform that blends role-based workflows with AI support to make every care interaction clearer and faster.
          </p>
        </section>

        <div className="mb-14 grid grid-cols-1 gap-6 md:grid-cols-3">
          {[
            { icon: Target,    title: 'Our Mission',   desc: 'Simplify healthcare management by providing intelligent tools for every stakeholder in the healthcare ecosystem.' },
            { icon: Users,     title: 'Who We Serve',  desc: 'Patients booking appointments, doctors managing schedules, and administrators overseeing the platform.' },
            { icon: Sparkles,  title: 'AI-Powered',    desc: 'Machine learning models predict wait times and analyze symptoms to assist in better clinical decisions.' },
          ].map((item) => (
            <div key={item.title} className="surface-card p-6">
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-[#1f83c2]/15">
                <item.icon className="h-5 w-5 text-[#80d7ff]" />
              </div>
              <h3 className="mb-2 font-semibold text-[#eaf1ff]">{item.title}</h3>
              <p className="text-sm leading-relaxed text-[#9ab2d7]">{item.desc}</p>
            </div>
          ))}
        </div>

        <div className="surface-card p-8 text-center">
          <h2 className="mb-3 text-2xl font-bold text-[#eaf1ff]">Ready to get started?</h2>
          <p className="mb-6 text-[#9ab2d7]">Join patients and healthcare providers already running on MedCare.</p>
          <Link href="/auth/patient/register" className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-[#1f9d8f] to-[#1f83c2] px-6 py-3 font-semibold text-white transition-all duration-200 hover:brightness-110">
            Get started <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
