"use client"
import Link from "next/link"
import React from "react"
import { cn } from "@/helpers/cn"

export default function PaymentMethodStep() {
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
          <div className="flex items-center gap-3 px-4 py-3 bg-primary text-on-primary rounded-full font-semibold">
            <span className="material-symbols-outlined text-[20px]">payments</span>
            <span>Payment Method</span>
          </div>
          <div className="flex items-center gap-3 px-4 py-3 rounded-lg text-secondary opacity-60 cursor-not-allowed">
            <span className="material-symbols-outlined text-[20px]">task_alt</span>
            <span>Confirm Appointment</span>
          </div>
        </nav>
      </aside>

      <main className="flex-1 md:ml-70 w-full max-w-container-max mx-auto p-margin-mobile md:p-margin-desktop min-h-screen flex flex-col">
        <header className="mb-8">
          <h2 className="font-headline-lg-mobile md:font-headline-lg text-headline-lg-mobile md:text-headline-lg text-on-surface mb-2">Choose Payment Method</h2>
          <p className="font-body-lg text-body-lg text-on-surface-variant">Select how you would like to pay.</p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter items-start">
          <div className="lg:col-span-7 xl:col-span-8 flex flex-col gap-4">
            {/* Credit/Debit Card */}
            <div className="bg-surface border-2 border-primary rounded-xl overflow-hidden shadow-sm transition-all">
              <div className="p-card-padding flex items-center justify-between cursor-pointer bg-primary/5">
                <div className="flex items-center gap-4">
                  <div className="w-5 h-5 rounded-full border-4 border-primary flex items-center justify-center" />
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-primary text-2xl">credit_card</span>
                    <span className="font-headline-sm text-headline-sm text-on-surface">Credit / Debit Card</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <div className="w-8 h-5 bg-surface-container-high rounded flex items-center justify-center text-[10px] font-bold text-secondary">VISA</div>
                  <div className="w-8 h-5 bg-surface-container-high rounded flex items-center justify-center text-[10px] font-bold text-secondary">MC</div>
                </div>
              </div>

              <div className="px-card-padding pb-card-padding pt-2 bg-surface">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="col-span-1 md:col-span-2">
                    <label className="block font-label-sm text-label-sm text-on-surface-variant mb-1.5">Card Number</label>
                    <div className="relative">
                      <input className="w-full bg-surface border border-outline-variant rounded-lg px-4 py-3 font-body-md text-body-md text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors" placeholder="0000 0000 0000 0000" type="text" />
                      <span className="material-symbols-outlined absolute right-3 top-3.5 text-secondary">credit_card</span>
                    </div>
                  </div>

                  <div>
                    <label className="block font-label-sm text-label-sm text-on-surface-variant mb-1.5">Expiry Date</label>
                    <input className="w-full bg-surface border border-outline-variant rounded-lg px-4 py-3 font-body-md text-body-md text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors" placeholder="MM / YY" type="text" />
                  </div>

                  <div>
                    <label className="block font-label-sm text-label-sm text-on-surface-variant mb-1.5">CVV</label>
                    <div className="relative">
                      <input className="w-full bg-surface border border-outline-variant rounded-lg px-4 py-3 font-body-md text-body-md text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors" placeholder="123" type="password" />
                      <span className="material-symbols-outlined absolute right-3 top-3.5 text-secondary text-[18px] cursor-help">help</span>
                    </div>
                  </div>

                  <div className="col-span-1 md:col-span-2">
                    <label className="block font-label-sm text-label-sm text-on-surface-variant mb-1.5">Name on Card</label>
                    <input className="w-full bg-surface border border-outline-variant rounded-lg px-4 py-3 font-body-md text-body-md text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors" placeholder="John Doe" type="text" />
                  </div>
                </div>
              </div>
            </div>

            {/* Other payment options */}
            <div className="bg-surface border border-outline-variant rounded-xl p-card-padding flex items-center justify-between cursor-pointer soft-shadow-hover">
              <div className="flex items-center gap-4">
                <div className="w-5 h-5 rounded-full border-2 border-outline-variant" />
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-secondary text-2xl">qr_code_scanner</span>
                  <span className="font-headline-sm text-headline-sm text-on-surface">UPI / QR Code</span>
                </div>
              </div>
            </div>

            <div className="bg-surface border border-outline-variant rounded-xl p-card-padding flex items-center justify-between cursor-pointer soft-shadow-hover">
              <div className="flex items-center gap-4">
                <div className="w-5 h-5 rounded-full border-2 border-outline-variant" />
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-secondary text-2xl">account_balance</span>
                  <span className="font-headline-sm text-headline-sm text-on-surface">Net Banking</span>
                </div>
              </div>
            </div>

            <div className="bg-surface border border-outline-variant rounded-xl p-card-padding flex items-center justify-between cursor-pointer soft-shadow-hover">
              <div className="flex items-center gap-4">
                <div className="w-5 h-5 rounded-full border-2 border-outline-variant" />
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-secondary text-2xl">health_and_safety</span>
                  <span className="font-headline-sm text-headline-sm text-on-surface">Pay via Insurance</span>
                </div>
              </div>
              <span className="bg-primary-container text-on-primary-container px-2 py-1 rounded text-[10px] font-bold tracking-wide uppercase">Supported</span>
            </div>

            <div className="bg-surface border border-outline-variant rounded-xl p-card-padding flex items-center justify-between cursor-pointer soft-shadow-hover">
              <div className="flex items-center gap-4">
                <div className="w-5 h-5 rounded-full border-2 border-outline-variant" />
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-secondary text-2xl">payments</span>
                  <span className="font-headline-sm text-headline-sm text-on-surface">Cash at Hospital</span>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-5 xl:col-span-4">
            <div className="bg-surface border border-outline-variant rounded-xl shadow-sm sticky top-margin-desktop overflow-hidden">
              <div className="bg-surface-container-low px-card-padding py-4 border-b border-outline-variant">
                <h3 className="font-headline-sm text-headline-sm text-on-surface">Appointment Summary</h3>
              </div>

              <div className="p-card-padding border-b border-outline-variant border-dashed">
                <div className="flex items-center gap-4">
                  <img alt="Doctor" className="w-14 h-14 rounded-full object-cover border border-outline-variant" src="/images/doctor-placeholder.jpg" />
                  <div>
                    <h4 className="font-headline-sm text-[16px] text-on-surface">Dr. Sarah Jenkins</h4>
                    <p className="font-body-md text-[14px] text-secondary">Cardiology Specialist</p>
                  </div>
                </div>
                <div className="mt-4 flex flex-col gap-2">
                  <div className="flex items-center gap-2 text-on-surface-variant">
                    <span className="material-symbols-outlined text-[18px]">calendar_month</span>
                    <span className="font-label-md text-label-md">Thursday, Oct 26, 2024</span>
                  </div>
                  <div className="flex items-center gap-2 text-on-surface-variant">
                    <span className="material-symbols-outlined text-[18px]">schedule</span>
                    <span className="font-label-md text-label-md">10:30 AM - 11:00 AM</span>
                  </div>
                </div>
              </div>

              <div className="p-card-padding flex flex-col gap-3">
                <div className="flex justify-between items-center">
                  <span className="font-body-md text-body-md text-secondary">Consultation Fee</span>
                  <span className="font-label-md text-label-md text-on-surface">$150.00</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-body-md text-body-md text-secondary">Platform Fee</span>
                  <span className="font-label-md text-label-md text-on-surface">$5.00</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-body-md text-body-md text-secondary">Taxes</span>
                  <span className="font-label-md text-label-md text-on-surface">$12.50</span>
                </div>
              </div>

              <div className="bg-surface-container-low p-card-padding">
                <div className="flex justify-between items-end mb-6">
                  <span className="font-headline-sm text-headline-sm text-on-surface">Total Amount</span>
                  <span className="font-headline-md text-headline-md text-primary">$167.50</span>
                </div>
                <Link href="/booking/confirm" className="w-full inline-flex bg-primary hover:bg-on-primary-fixed-variant text-on-primary font-label-md text-label-md py-4 rounded-xl transition-colors shadow-sm items-center justify-center gap-2">
                  <span className="material-symbols-outlined text-[20px]">lock</span>
                  Pay &amp; Confirm Appointment
                </Link>
                <p className="text-center font-label-sm text-[11px] text-secondary mt-3 flex items-center justify-center gap-1">
                  <span className="material-symbols-outlined text-[12px]">verified_user</span>
                  Secure encrypted payment
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
