"use client"
import React, {useState} from "react"
import Link from "next/link"

type Doctor = { id: string; name: string; specialty: string }

type BookingWizardProps = {
  initialStep?: number
}

export default function BookingWizard({ initialStep = 0 }: BookingWizardProps) {
  const [step, setStep] = useState(initialStep)
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null)
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null)
  const [patientInfo, setPatientInfo] = useState({ fullName: "", phone: "", email: "", dob: "" })
  const [paymentMethod, setPaymentMethod] = useState<string | null>(null)

  const doctors: Doctor[] = [
    { id: "d1", name: "Dr. Sarah Jenkins", specialty: "Cardiology Specialist" },
    { id: "d2", name: "Dr. Mark Liu", specialty: "General Physician" },
  ]

  function next() { setStep(s => Math.min(4, s + 1)) }
  function back() { setStep(s => Math.max(0, s - 1)) }

  return (
    <div className="min-h-screen bg-background text-on-background font-body-md antialiased">
      <div className="flex">
        <aside className="hidden md:flex bg-surface-container-low text-primary font-label-md text-label-md fixed left-0 top-0 h-full w-70 border-r border-outline-variant flex-col gap-unit p-6 z-40">
          <div className="mb-8">
            <h1 className="font-headline-md text-headline-md font-extrabold text-primary">Mediso</h1>
            <p className="font-body-md text-body-md text-secondary mt-1">Appointment Booking</p>
          </div>
          <nav className="flex flex-col gap-3">
            {[
              "Select Doctor",
              "Date & Time",
              "Patient Details",
              "Payment Method",
              "Confirm Appointment",
            ].map((label, i) => (
              <button key={label} onClick={() => setStep(i)} className={"flex items-center gap-3 px-4 py-3 rounded-lg text-secondary " + (i === step ? "bg-primary text-on-primary rounded-full font-semibold" : "hover:bg-surface-container-high")}>
                <span className="material-symbols-outlined text-[18px]">{i < step ? "check_circle" : i === step ? (i===3?"payments":"radio_button_checked") : "radio_button_unchecked"}</span>
                <span>{label}</span>
              </button>
            ))}
          </nav>
        </aside>

        <main className="flex-1 md:ml-70 w-full max-w-container-max mx-auto p-margin-mobile md:p-margin-desktop min-h-screen py-8">
          <div className="mb-6">
            <h2 className="font-headline-lg-mobile md:font-headline-lg text-headline-lg-mobile md:text-headline-lg">{["Select Doctor", "Date & Time", "Patient Details", "Payment Method", "Review & Confirm"][step]}</h2>
            <p className="text-on-surface-variant">{["Choose a doctor", "Pick date and slot", "Enter patient information", "Choose payment", "Review all details"][step]}</p>
          </div>

          <div>
            {step === 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {doctors.map(d => (
                  <div key={d.id} className={"p-4 border rounded-lg " + (selectedDoctor?.id === d.id ? "border-primary bg-surface" : "border-outline-variant")}>
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-semibold">{d.name}</div>
                        <div className="text-sm text-secondary">{d.specialty}</div>
                      </div>
                      <div>
                        <button onClick={() => setSelectedDoctor(d)} className="bg-primary text-on-primary px-3 py-2 rounded">Select</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {step === 1 && (
              <div>
                <div className="mb-4">
                  <div className="font-medium">Available Slots</div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {['09:00 AM','09:30 AM','10:00 AM','10:30 AM'].map(s => (
                    <button key={s} onClick={() => setSelectedSlot(s)} className={"px-3 py-2 border rounded " + (selectedSlot === s ? "bg-primary text-on-primary" : "border-outline-variant")}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {step === 2 && (
              <form onSubmit={(e) => { e.preventDefault(); next() }} className="grid grid-cols-1 gap-4 max-w-md">
                <label className="flex flex-col"><span className="text-sm text-on-surface-variant">Full name</span><input value={patientInfo.fullName} onChange={(e)=>setPatientInfo({...patientInfo, fullName:e.target.value})} className="mt-1 p-3 border rounded"/></label>
                <label className="flex flex-col"><span className="text-sm text-on-surface-variant">Phone</span><input value={patientInfo.phone} onChange={(e)=>setPatientInfo({...patientInfo, phone:e.target.value})} className="mt-1 p-3 border rounded"/></label>
                <label className="flex flex-col"><span className="text-sm text-on-surface-variant">Email</span><input value={patientInfo.email} onChange={(e)=>setPatientInfo({...patientInfo, email:e.target.value})} className="mt-1 p-3 border rounded"/></label>
                <label className="flex flex-col"><span className="text-sm text-on-surface-variant">Date of birth</span><input value={patientInfo.dob} onChange={(e)=>setPatientInfo({...patientInfo, dob:e.target.value})} className="mt-1 p-3 border rounded"/></label>
                <div className="flex gap-3">
                  <button type="button" onClick={back} className="px-4 py-2 border rounded">Back</button>
                  <button type="submit" className="px-4 py-2 bg-primary text-on-primary rounded">Continue</button>
                </div>
              </form>
            )}

            {step === 3 && (
              <div>
                <div className="grid gap-3 max-w-md">
                  {['Credit Card','UPI / QR','Net Banking','Insurance','Cash'].map(m => (
                    <button key={m} onClick={() => setPaymentMethod(m)} className={"p-4 border rounded text-left " + (paymentMethod===m?"border-primary bg-surface":"border-outline-variant")}>
                      {m}
                    </button>
                  ))}
                </div>
                <div className="mt-4 flex gap-3">
                  <button onClick={back} className="px-4 py-2 border rounded">Back</button>
                  <button onClick={()=>next()} className="px-4 py-2 bg-primary text-on-primary rounded">Proceed to Review</button>
                </div>
              </div>
            )}

            {step === 4 && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 flex flex-col gap-4">
                  <section className="bg-surface border border-outline-variant rounded p-4">
                    <h4 className="font-semibold mb-2">Doctor</h4>
                    <div>{selectedDoctor ? `${selectedDoctor.name} — ${selectedDoctor.specialty}` : 'No doctor selected'}</div>
                  </section>

                  <section className="bg-surface border border-outline-variant rounded p-4">
                    <h4 className="font-semibold mb-2">Appointment</h4>
                    <div>Date: Thursday, Oct 24, 2024</div>
                    <div>Time: {selectedSlot ?? 'No slot selected'}</div>
                  </section>

                  <section className="bg-surface border border-outline-variant rounded p-4">
                    <h4 className="font-semibold mb-2">Patient</h4>
                    <div>{patientInfo.fullName}</div>
                    <div>{patientInfo.email}</div>
                  </section>
                </div>

                <aside className="bg-surface border border-outline-variant rounded p-4">
                  <div className="mb-4">
                    <div className="text-sm text-on-surface-variant">Payment</div>
                    <div className="font-medium">{paymentMethod ?? 'Not selected'}</div>
                  </div>
                  <div className="flex flex-col gap-3">
                    <button className="w-full bg-primary text-on-primary py-3 rounded">Confirm Appointment</button>
                    <button onClick={back} className="w-full border py-3 rounded">Go Back</button>
                  </div>
                </aside>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}
