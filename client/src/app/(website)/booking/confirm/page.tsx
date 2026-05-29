import React from "react"
import BookingWizard from "../../../../modules/website/booking/BookingWizard"

export const metadata = {
  title: "Confirm Appointment - Booking",
}

export default function Page() {
  return <BookingWizard initialStep={4} />
}
