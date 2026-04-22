import { AdminResourcePage } from "@/features/admin/resources/AdminResourcePage";

export default function Page() {
  return (
    <AdminResourcePage 
      title="Laboratories" 
      description="Manage diagnostics labs, testing pricing, limits, and records." 
      category="LAB" 
      exportFilename="labs_data.csv" 
    />
  );
}
