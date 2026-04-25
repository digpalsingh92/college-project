import { AdminResourcePage } from "@/features/admin/resources/AdminResourcePage";

export default function Page() {
  return (
    <AdminResourcePage 
      title="Beds Management" 
      description="Manage hospital beds and their real-time pricing from the database." 
      category="BED" 
      exportFilename="beds_data.csv" 
    />
  );
}
