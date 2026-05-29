"use client"
import Link from "next/link"
import React from "react"

export default function ConfirmAppointmentStep() {
  return (
    <div className="min-h-screen bg-background text-on-background font-body-md antialiased">
      <aside className="hidden md:flex bg-surface-container-low text-primary font-label-md text-label-md fixed left-0 top-0 h-full w-70 border-r border-outline-variant flex-col gap-unit p-6 z-40">
        <div className="mb-8">
          <h1 className="font-headline-md text-headline-md font-extrabold text-primary">Mediso</h1>
          <p className="font-body-md text-body-md text-secondary mt-1">Appointment Booking</p>
        </div>
        <nav className="flex flex-col gap-2">
          <div className="flex items-center gap-3 px-4 py-3 rounded-lg text-secondary hover:bg-surface-container-high transition-all duration-300">
            <span className="material-symbols-outlined text-[20px] text-primary" style={{fontVariationSettings: "'FILL' 1"}}>check_circle</span>
            <span>Select Doctor</span>
          </div>
          <div className="flex items-center gap-3 px-4 py-3 rounded-lg text-secondary hover:bg-surface-container-high transition-all duration-300">
            <span className="material-symbols-outlined text-[20px] text-primary" style={{fontVariationSettings: "'FILL' 1"}}>check_circle</span>
            <span>Date &amp; Time</span>
          </div>
          <div className="flex items-center gap-3 px-4 py-3 rounded-lg text-secondary hover:bg-surface-container-high transition-all duration-300">
            <span className="material-symbols-outlined text-[20px] text-primary" style={{fontVariationSettings: "'FILL' 1"}}>check_circle</span>
            <span>Patient Details</span>
          </div>
          <div className="flex items-center gap-3 px-4 py-3 rounded-lg text-secondary hover:bg-surface-container-high transition-all duration-300">
            <span className="material-symbols-outlined text-[20px] text-primary">payments</span>
            <span>Payment Method</span>
          </div>
          <div className="flex items-center gap-3 px-4 py-3 bg-primary text-on-primary rounded-full font-semibold">
            <span className="material-symbols-outlined text-[20px]">task_alt</span>
            <span>Confirm Appointment</span>
          </div>
        </nav>
      </aside>

      <main className="flex-1 md:ml-70 w-full max-w-container-max mx-auto p-margin-mobile md:p-margin-desktop min-h-screen flex flex-col">
        <header className="mb-8">
          <h2 className="font-headline-lg-mobile md:font-headline-lg text-headline-lg-mobile md:text-headline-lg text-on-surface mb-2">Review & Confirm</h2>
          <p className="font-body-lg text-body-lg text-on-surface-variant">Please verify your details before finalizing.</p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter items-start">
          <div className="lg:col-span-7 xl:col-span-8 flex flex-col gap-4">
            {/* Doctor Details Card */}
            <section className="bg-surface border border-outline-variant rounded-xl p-card-padding">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-headline-sm">Doctor Details</h3>
                <Link href="/booking/select-doctor" className="text-primary font-semibold">Edit</Link>
              </div>
              <div className="flex items-center gap-4">
                <img alt="Doctor" className="w-14 h-14 rounded-full object-cover border border-outline-variant" src="/images/doctor-placeholder.jpg" />
                <div>
                  <h4 className="font-headline-sm text-[16px] text-on-surface">Dr. Sarah Jenkins</h4>
                  <p className="font-body-md text-[14px] text-secondary">Cardiology Specialist</p>
                  <p className="font-body-md text-[13px] text-on-surface-variant mt-1">Mediso Central Wing, Suite 402</p>
                </div>
              </div>
            </section>

            {/* Appointment Details Card */}
            <section className="bg-surface border border-outline-variant rounded-xl p-card-padding">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-headline-sm">Appointment Details</h3>
                <Link href="/booking/date-time" className="text-primary font-semibold">Edit</Link>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className="text-label-md font-label-md text-on-surface-variant">Date</div>
                  <div className="font-body-md">Thursday, Oct 24, 2024</div>
                </div>
                <div>
                  <div className="text-label-md font-label-md text-on-surface-variant">Time</div>
                  <div className="font-body-md">10:30 AM (EST)</div>
                </div>
                <div>
                  <div className="text-label-md font-label-md text-on-surface-variant">Consultation Type</div>
                  <div className="font-body-md">In-Person</div>
                </div>
                <div>
                  <div className="text-label-md font-label-md text-on-surface-variant">Estimated Duration</div>
                  <div className="font-body-md">45 Minutes</div>
                </div>
              </div>
            </section>

            {/* Patient Details Card */}
            <section className="bg-surface border border-outline-variant rounded-xl p-card-padding">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-headline-sm">Patient Details</h3>
                <Link href="/booking/patient-details" className="text-primary font-semibold">Edit</Link>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className="text-label-md font-label-md text-on-surface-variant">Full Name</div>
                  <div className="font-body-md">Michael T. Roberts</div>
                </div>
                <div>
                  <div className="text-label-md font-label-md text-on-surface-variant">Date of Birth</div>
                  <div className="font-body-md">Jan 15, 1985</div>
                </div>
                <div>
                  <div className="text-label-md font-label-md text-on-surface-variant">Contact Phone</div>
                  <div className="font-body-md">(555) 123-4567</div>
                </div>
                <div>
                  <div className="text-label-md font-label-md text-on-surface-variant">Email</div>
                  <div className="font-body-md">m.roberts@email.com</div>
                </div>
              </div>
            </section>
          </div>

          <aside className="lg:col-span-5 xl:col-span-4">
            <div className="bg-surface border border-outline-variant rounded-xl shadow-sm sticky top-margin-desktop overflow-hidden p-card-padding">
              <div className="flex items-start justify-between mb-4">
                <h4 className="font-headline-sm">APPOINTMENT ID PREVIEW</h4>
                <div className="text-sm text-on-surface-variant">#MD-8492A</div>
              </div>

              <div className="bg-surface-container-low rounded p-4 mb-4">
                <div className="text-label-sm text-on-surface-variant">Estimated Wait Time</div>
                <div className="font-headline-sm text-headline-sm">5 - 10 mins</div>
              </div>

              <div className="border-t border-outline-variant pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-label-md text-on-surface-variant">Payment Method</div>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="material-symbols-outlined">credit_card</span>
                      <div>
                        <div className="font-body-md">Visa ending in 4242</div>
                        <div className="text-sm text-on-surface-variant">Expires 12/25</div>
                      </div>
                    </div>
                  </div>
                  <div className="text-primary">✔</div>
                </div>

                <div className="mt-4">
                  <div className="flex justify-between items-center">
                    <span className="text-secondary">Consultation Fee</span>
                    <span>$150.00</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-secondary">Platform Fee</span>
                    <span>$5.00</span>
                  </div>
                  <div className="flex justify-between items-center font-semibold mt-3">
                    <span>Total</span>
                    <span>$155.00</span>
                  </div>
                </div>

                <div className="mt-6 flex flex-col gap-3">
                  <button className="w-full bg-primary text-on-primary py-4 rounded-xl font-semibold">Confirm Appointment</button>
                  <Link href="/booking/payment-method" className="w-full inline-flex items-center justify-center border border-outline-variant rounded-xl py-3">Go Back</Link>
                </div>
                <p className="text-xs text-on-surface-variant mt-3">By confirming, you agree to Mediso's <a className="text-primary underline" href="#">Terms of Service</a> &amp; <a className="text-primary underline" href="#">Cancellation Policy</a>.</p>
              </div>
            </div>
          </aside>
        </div>
      </main>
    </div>
  )
}
