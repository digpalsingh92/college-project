import { AdminResourcePage } from "@/features/admin/resources/AdminResourcePage";

export default function Page() {
  return (
    <AdminResourcePage 
      title="Machines & Equipment" 
      description="Manage hospital machines, scanners, and large medical equipment." 
      category="MACHINE" 
      exportFilename="machines_data.csv" 
    />
  );
}
