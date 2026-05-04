import Link from "next/link";
import {
  Activity,
  ArrowRight,
  Bot,
  CalendarCheck,
  LayoutDashboard,
  LineChart,
  ShieldCheck,
  Stethoscope,
  Timer,
} from "lucide-react";
import { ROUTES } from "@/constants/routes";

const features = [
  {
    title: "AI Predictions",
    description: "Estimate surgery price, expected wait time, and bed availability before booking.",
    icon: LineChart,
  },
  {
    title: "Role-Based Dashboards",
    description: "Dedicated views for Admins, Doctors, and Patients with focused workflows.",
    icon: LayoutDashboard,
  },
  {
    title: "Smart Scheduling",
    description: "Coordinate doctor availability, operation slots, and follow-ups in minutes.",
    icon: CalendarCheck,
  },
  {
    title: "Real-Time Data",
    description: "Live updates for appointments, resources, and critical status signals.",
    icon: Activity,
  },
  {
    title: "Admin Analytics",
    description: "Track occupancy, queue flow, and team performance from one control center.",
    icon: Timer,
  },
  {
    title: "Secure Infrastructure",
    description: "Built with privacy and clinical trust in mind for sensitive healthcare data.",
    icon: ShieldCheck,
  },
];

const workflowSteps = [
  {
    title: "Select a doctor or surgery",
    description: "Patients choose a specialist, procedure, or hospital path aligned with their needs.",
  },
  {
    title: "Get AI-powered insights",
    description: "Mediso predicts likely cost, waiting period, and bed readiness for informed decisions.",
  },
  {
    title: "Book with confidence",
    description: "Reserve an appointment instantly and keep everyone synced through role dashboards.",
  },
];

const stats = [
  { label: "Appointments managed", value: "1000+" },
  { label: "Doctors onboarded", value: "200+" },
  { label: "Prediction accuracy", value: "95%" },
];

const faqs = [
  {
    question: "How does AI prediction work?",
    answer:
      "Mediso combines historical appointment and resource trends with live inputs to estimate costs, wait times, and bed availability.",
  },
  {
    question: "Is my data secure?",
    answer:
      "Yes. Access is role-based, and platform architecture is designed for secure handling of sensitive healthcare workflows.",
  },
  {
    question: "Can I book instantly?",
    answer:
      "Absolutely. Once a slot is available, patients can confirm appointments immediately from the booking flow.",
  },
  {
    question: "How accurate are predictions?",
    answer:
      "Current models are tuned for high-confidence guidance and benchmark around 95% accuracy for supported prediction scenarios.",
  },
];

function SectionHeading({ eyebrow, title, description }: { eyebrow: string; title: string; description: string }) {
  return (
    <div className="max-w-3xl space-y-3">
      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-700">{eyebrow}</p>
      <h2 className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">{title}</h2>
      <p className="text-base leading-relaxed text-slate-600 sm:text-lg">{description}</p>
    </div>
  );
}

function DashboardPreview() {
  return (
    <div className="relative rounded-3xl border border-emerald-100 bg-white/90 p-4 shadow-2xl shadow-emerald-100 backdrop-blur sm:p-6">
      <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-emerald-200/60 blur-2xl" />
      <div className="absolute -bottom-5 -left-4 h-20 w-20 rounded-full bg-slate-200/80 blur-2xl" />
      <div className="relative space-y-4">
        <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Today</p>
            <p className="mt-1 text-sm font-semibold text-slate-900">24 appointments scheduled</p>
          </div>
          <span className="inline-flex items-center gap-2 rounded-full bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-800">
            <Activity className="h-3.5 w-3.5" />
            Live
          </span>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 p-4">
            <p className="text-xs text-slate-500">Average wait time</p>
            <p className="mt-2 text-xl font-semibold text-slate-900">18 min</p>
            <p className="mt-2 text-xs text-emerald-700">11% better than last week</p>
          </div>
          <div className="rounded-2xl border border-slate-200 p-4">
            <p className="text-xs text-slate-500">Bed availability</p>
            <p className="mt-2 text-xl font-semibold text-slate-900">87%</p>
            <p className="mt-2 text-xs text-emerald-700">Stable for next 12 hours</p>
          </div>
        </div>

        <div className="rounded-2xl border border-emerald-100 bg-emerald-50/70 p-4">
          <div className="flex items-start gap-3">
            <Bot className="mt-0.5 h-4 w-4 text-emerald-700" />
            <div>
              <p className="text-sm font-medium text-slate-900">AI Assistant</p>
              <p className="mt-1 text-sm text-slate-600">
                Bed utilization may increase after 4 PM. Consider shifting non-urgent procedures.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function HomePage() {
  return (
    <div className="relative overflow-hidden bg-linear-to-b from-emerald-50/60 via-slate-50 to-slate-100">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-80 bg-[radial-gradient(circle_at_top,rgba(16,185,129,0.24),transparent_62%)]" />
      <div className="pointer-events-none absolute inset-x-0 top-56 h-64 bg-[radial-gradient(circle_at_20%_40%,rgba(15,23,42,0.08),transparent_55%)]" />

      <main className="relative mx-auto max-w-6xl space-y-20 px-4 pb-20 pt-12 sm:px-6 lg:px-8 lg:pt-16">
        <section className="grid gap-10 lg:grid-cols-[1.08fr_0.92fr] lg:items-center">
          <div className="space-y-7">
            <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-white/80 px-3 py-1 text-xs font-medium uppercase tracking-wide text-emerald-800">
              <Stethoscope className="h-3.5 w-3.5" />
              Healthcare orchestration platform
            </span>
            <div className="space-y-5">
              <h1 className="text-4xl font-semibold leading-tight tracking-tight text-slate-900 sm:text-5xl lg:text-6xl">
                Smarter healthcare operations, guided by real-time AI.
              </h1>
              <p className="max-w-2xl text-base leading-relaxed text-slate-600 sm:text-lg">
                Mediso helps hospitals and clinics coordinate Admin, Doctor, and Patient workflows with intelligent
                booking, prediction insights, and assistant-led decisions in one connected product.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link
                href={ROUTES.register}
                className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-6 text-sm font-semibold text-white shadow-lg shadow-emerald-200 transition-transform hover:-translate-y-0.5 hover:bg-emerald-700"
              >
                Get Started
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href={ROUTES.login}
                className="inline-flex h-12 items-center justify-center rounded-xl border border-slate-300 bg-white px-6 text-sm font-semibold text-slate-800 transition-colors hover:bg-slate-50"
              >
                Sign In
              </Link>
            </div>
          </div>

          <DashboardPreview />
        </section>

        <section className="space-y-8">
          <SectionHeading
            eyebrow="Core Capabilities"
            title="Everything teams need to run care delivery efficiently"
            description="Purpose-built modules for booking, staffing, and predictive planning help teams move from reactive operations to proactive coordination."
          />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => (
              <article
                key={feature.title}
                className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:-translate-y-1 hover:border-emerald-200 hover:shadow-lg"
              >
                <div className="mb-4 inline-flex rounded-xl bg-emerald-100 p-2 text-emerald-700">
                  <feature.icon className="h-5 w-5" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900">{feature.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">{feature.description}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="space-y-8">
          <SectionHeading
            eyebrow="How It Works"
            title="From selection to confirmation in three clear steps"
            description="A streamlined journey that turns complex care planning into a guided, patient-friendly experience."
          />
          <div className="grid gap-4 lg:grid-cols-3">
            {workflowSteps.map((step, index) => (
              <article key={step.title} className="relative rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-full bg-slate-900 text-sm font-semibold text-white">
                  {index + 1}
                </div>
                <h3 className="text-lg font-semibold text-slate-900">{step.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">{step.description}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="grid gap-8 rounded-3xl border border-emerald-100 bg-linear-to-br from-white to-emerald-50 p-6 shadow-sm sm:p-8 lg:grid-cols-[1fr_1.08fr]">
          <div className="space-y-5">
            <SectionHeading
              eyebrow="AI Intelligence"
              title="Ask Mediso anything about care costs, timing, and capacity"
              description="The AI assistant combines operational signals with predictive models so teams can make decisions faster and patients can book with clarity."
            />
          </div>

          <div className="rounded-2xl border border-emerald-200 bg-white p-5 shadow-md sm:p-6">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-emerald-800">
              <Bot className="h-3.5 w-3.5" />
              AI Assistant
            </div>

            <div className="space-y-4">
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Ask</p>
                <p className="mt-1 text-sm font-medium text-slate-900">What is the cost of knee surgery?</p>
              </div>

              <div className="rounded-xl border border-emerald-100 bg-emerald-50/60 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">Sample response</p>
                <p className="mt-2 text-sm leading-relaxed text-slate-700">
                  Estimated cost range is <span className="font-semibold text-slate-900">$4,800 - $6,200</span>, with
                  an expected wait time of <span className="font-semibold text-slate-900">5-7 days</span>. Current bed
                  availability is <span className="font-semibold text-slate-900">high</span> in your selected facility.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="space-y-8">
          <SectionHeading
            eyebrow="Trusted By Teams"
            title="Proven outcomes across operations and patient flow"
            description="Healthcare teams use Mediso daily to coordinate care delivery and improve resource planning.
            "
          />
          <div className="grid gap-4 sm:grid-cols-3">
            {stats.map((stat) => (
              <article key={stat.label} className="rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm">
                <p className="text-3xl font-semibold tracking-tight text-slate-900">{stat.value}</p>
                <p className="mt-2 text-sm text-slate-600">{stat.label}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="space-y-8">
          <SectionHeading
            eyebrow="FAQ"
            title="Everything you need to know before getting started"
            description="Common questions from hospitals, clinics, and healthcare operations teams."
          />
          <div className="space-y-3">
            {faqs.map((faq) => (
              <details
                key={faq.question}
                className="group rounded-xl border border-slate-200 bg-white px-5 py-4 shadow-sm open:border-emerald-200 open:bg-emerald-50/40"
              >
                <summary className="cursor-pointer list-none text-sm font-semibold text-slate-900 marker:hidden">
                  {faq.question}
                </summary>
                <p className="pt-3 text-sm leading-relaxed text-slate-600">{faq.answer}</p>
              </details>
            ))}
          </div>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-slate-900 p-8 text-center shadow-xl sm:p-10">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-emerald-300">Get Started With Mediso</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
            Start managing healthcare smarter
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-sm leading-relaxed text-slate-300 sm:text-base">
            Bring scheduling, AI insights, and cross-team care coordination into one modern platform.
          </p>
          <div className="mt-6">
            <Link
              href={ROUTES.register}
              className="inline-flex h-12 items-center justify-center rounded-xl bg-emerald-500 px-8 text-sm font-semibold text-slate-900 transition-colors hover:bg-emerald-400"
            >
              Get Started
            </Link>
          </div>
        </section>

        <footer className="border-t border-slate-200 pt-8">
          <div className="flex flex-col items-start justify-between gap-5 sm:flex-row sm:items-center">
            <div>
              <p className="text-lg font-semibold tracking-tight text-slate-900">Mediso</p>
              <p className="text-sm text-slate-500">AI-enabled care operations platform</p>
            </div>
            <nav className="flex items-center gap-6 text-sm text-slate-600">
              <Link href={ROUTES.about} className="transition-colors hover:text-slate-900">
                About
              </Link>
              <Link href={ROUTES.contact} className="transition-colors hover:text-slate-900">
                Contact
              </Link>
              <Link href="#" className="transition-colors hover:text-slate-900">
                Privacy
              </Link>
            </nav>
          </div>
        </footer>
      </main>
    </div>
  );
}
