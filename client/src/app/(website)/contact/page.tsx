import Link from 'next/link';
import { HeartPulse, Mail, Phone, MapPin } from 'lucide-react';

export default function ContactPage() {
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
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-[#e8eaf0] mb-4">Contact <span className="gradient-text">Us</span></h1>
          <p className="text-[#8892a4] text-lg">We&apos;re here to help. Reach out to our team.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Contact info */}
          <div className="space-y-5">
            {[
              { icon: Mail,    label: 'Email',   value: 'support@medcare.com' },
              { icon: Phone,   label: 'Phone',   value: '+91 98765 43210' },
              { icon: MapPin,  label: 'Address', value: 'Mumbai, Maharashtra, India' },
            ].map((c) => (
              <div key={c.label} className="glass-card p-5 flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                  <c.icon className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <p className="text-xs text-[#8892a4]">{c.label}</p>
                  <p className="text-sm font-medium text-[#e8eaf0]">{c.value}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Contact form */}
          <div className="glass-card p-6 space-y-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-[#8892a4]">Name</label>
              <input type="text" placeholder="Your name" className="h-11 bg-[#0a0e1a] border border-[#1e2d4a] rounded-xl text-[#e8eaf0] px-4 text-sm focus:outline-none focus:border-blue-500/60 placeholder:text-[#8892a4]" />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-[#8892a4]">Email</label>
              <input type="email" placeholder="you@email.com" className="h-11 bg-[#0a0e1a] border border-[#1e2d4a] rounded-xl text-[#e8eaf0] px-4 text-sm focus:outline-none focus:border-blue-500/60 placeholder:text-[#8892a4]" />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-[#8892a4]">Message</label>
              <textarea rows={4} placeholder="How can we help?" className="bg-[#0a0e1a] border border-[#1e2d4a] rounded-xl text-[#e8eaf0] p-3 text-sm focus:outline-none focus:border-blue-500/60 placeholder:text-[#8892a4] resize-none" />
            </div>
            <button className="w-full h-11 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold rounded-xl transition-all duration-200">Send Message</button>
          </div>
        </div>
      </div>
    </div>
  );
}
