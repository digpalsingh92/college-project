import { Card, CardHeader } from "@/components/ui/Card";
import Link from "next/link";

export default function Page() {
  return (
    <Card className="space-y-4">
      <CardHeader
        title="Patients"
        description="Patient roster and visit history will appear here."
      />
      <p className="text-sm text-muted">
        For now, see scheduled visits on your{" "}
        <Link href="/doctor" className="font-medium text-emerald-600 hover:underline">
          dashboard
        </Link>
        .
      </p>
      <div className="rounded-lg border border-emerald-100 bg-emerald-50/60 p-4 text-sm text-emerald-900">
        Upcoming additions in this section: searchable patient list, last visit snapshot, and follow-up notes.
      </div>
    </Card>
  );
}
