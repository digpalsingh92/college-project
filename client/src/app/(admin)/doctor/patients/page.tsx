import { Card, CardHeader } from "@/components/ui/Card";
import Link from "next/link";

export default function Page() {
  return (
    <Card>
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
    </Card>
  );
}
