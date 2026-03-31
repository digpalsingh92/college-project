import Link from 'next/link';
import { HeartPulse, Mail, Phone, MapPin, ArrowLeft, Send } from 'lucide-react';

export default function ContactPage() {
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
        <section className="mesh-bg mb-10 rounded-3xl border border-[#2a3d62] p-8 text-center">
          <h1 className="text-4xl font-bold sm:text-5xl">Contact <span className="gradient-text">Us</span></h1>
          <p className="mt-4 text-base text-[#9ab2d7]">We&apos;re here to help. Reach out to our team.</p>
        </section>

        <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
          {/* Contact info */}
          <div className="space-y-5">
            {[
              { icon: Mail,    label: 'Email',   value: 'support@medcare.com' },
              { icon: Phone,   label: 'Phone',   value: '+91 98765 43210' },
              { icon: MapPin,  label: 'Address', value: 'Mumbai, Maharashtra, India' },
            ].map((c) => (
              <div key={c.label} className="surface-card flex items-center gap-4 p-5">
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-[#1f83c2]/15">
                  <c.icon className="h-5 w-5 text-[#80d7ff]" />
                </div>
                <div>
                  <p className="text-xs text-[#9ab2d7]">{c.label}</p>
                  <p className="text-sm font-medium text-[#eaf1ff]">{c.value}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Contact form */}
          <div className="surface-card space-y-4 p-6">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-[#9db0cf]">Name</label>
              <input type="text" placeholder="Your name" className="h-11 rounded-xl border border-[#2a3d62] bg-[#0a1326] px-4 text-sm text-[#eaf1ff] placeholder:text-[#7e93b8] focus:border-[#26c5b4]/70 focus:outline-none focus:ring-2 focus:ring-[#26c5b4]/25" />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-[#9db0cf]">Email</label>
              <input type="email" placeholder="you@email.com" className="h-11 rounded-xl border border-[#2a3d62] bg-[#0a1326] px-4 text-sm text-[#eaf1ff] placeholder:text-[#7e93b8] focus:border-[#26c5b4]/70 focus:outline-none focus:ring-2 focus:ring-[#26c5b4]/25" />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-[#9db0cf]">Message</label>
              <textarea rows={4} placeholder="How can we help?" className="resize-none rounded-xl border border-[#2a3d62] bg-[#0a1326] p-3 text-sm text-[#eaf1ff] placeholder:text-[#7e93b8] focus:border-[#26c5b4]/70 focus:outline-none focus:ring-2 focus:ring-[#26c5b4]/25" />
            </div>
            <button className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#1f9d8f] to-[#1f83c2] text-sm font-semibold text-white transition-all duration-200 hover:brightness-110">
              <Send className="h-4 w-4" /> Send Message
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
