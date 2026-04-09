import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { ROUTES } from "@/constants/routes";

export function HomePage() {
  return (
    <div className="space-y-10">
      <section className="grid gap-8 lg:grid-cols-2 lg:items-center">
        <div className="space-y-6">
          <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700">Care coordination</p>
          <h1 className="text-4xl font-bold tracking-tight text-slate-900 md:text-5xl">
            Modern scheduling for patients, clinicians, and ops.
          </h1>
          <p className="max-w-xl text-lg text-slate-600">
            Mediso brings a calm, light interface to appointment booking, provider discovery, and admin insights—all
            in one place.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              href={ROUTES.register}
              className="inline-flex h-12 items-center justify-center rounded-md bg-emerald-600 px-6 text-base font-medium text-white shadow-sm transition-colors hover:bg-emerald-700"
            >
              Get started
            </Link>
            <Link
              href={ROUTES.login}
              className="inline-flex h-12 items-center justify-center rounded-md border border-slate-200 bg-white px-6 text-base font-medium text-slate-800 transition-colors hover:bg-slate-50"
            >
              Sign in
            </Link>
          </div>
        </div>
        <Card className="border-emerald-100 bg-gradient-to-br from-white to-emerald-50/40 shadow-md" padding="lg">
          <p className="text-sm font-medium text-emerald-800">Why teams choose Mediso</p>
          <ul className="mt-4 space-y-3 text-sm text-slate-700">
            <li className="flex gap-2">
              <span className="mt-0.5 h-2 w-2 shrink-0 rounded-full bg-emerald-500" />
              Role-based portals for admin, doctor, and patient workflows.
            </li>
            <li className="flex gap-2">
              <span className="mt-0.5 h-2 w-2 shrink-0 rounded-full bg-emerald-500" />
              Clear light UI with accessible contrast and focused density.
            </li>
            <li className="flex gap-2">
              <span className="mt-0.5 h-2 w-2 shrink-0 rounded-full bg-emerald-500" />
              API-ready architecture for real-time data and predictions.
            </li>
          </ul>
        </Card>
      </section>
    </div>
  );
}
