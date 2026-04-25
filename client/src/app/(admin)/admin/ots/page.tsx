import { AdminResourcePage } from "@/features/admin/resources/AdminResourcePage";

export default function Page() {
  return (
    <AdminResourcePage 
      title="Operation Theaters" 
      description="Manage Operation Theaters pricing, status, and assignments." 
      category="OT" 
      exportFilename="ots_data.csv" 
    />
  );
}
