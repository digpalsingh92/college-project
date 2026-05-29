import { Suspense } from "react";
import { BookingWizard } from "@/modules/patient/booking/BookingWizard";

export default function Page() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center p-12 text-sm text-slate-500">
        Loading appointment wizard...
      </div>
    }>
      <BookingWizard />
    </Suspense>
  );
}
