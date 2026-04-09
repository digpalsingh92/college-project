import { Card, CardHeader } from "@/components/ui/Card";

export default function Page() {
  return (
    <Card>
      <CardHeader
        title="Users"
        description="Manage staff and role access. Detailed directory tools ship next."
      />
      <p className="text-sm text-muted">
        Connect your admin APIs here to list, invite, and deactivate accounts.
      </p>
    </Card>
  );
}
