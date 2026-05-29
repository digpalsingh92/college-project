import React from "react"
import BookingWizard from "../../../../modules/website/booking/BookingWizard"

export const metadata = {
  title: "Patient Details - Booking",
}

export default function Page() {
  return <BookingWizard initialStep={2} />
}