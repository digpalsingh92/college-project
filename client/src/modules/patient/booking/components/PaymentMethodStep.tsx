"use client";

import React from "react";
import { CreditCard, QrCode, Building, ShieldAlert, BadgeCent, Lock, ShieldCheck, ChevronLeft, Loader2 } from "lucide-react";
import { cn } from "@/helpers/cn";
import type { DoctorListItem } from "@/types/api";

interface PaymentMethodStepProps {
  paymentMethod: "CARD" | "UPI" | "INSURANCE" | "NET_BANKING" | "CASH";
  setPaymentMethod: (method: "CARD" | "UPI" | "INSURANCE" | "NET_BANKING" | "CASH") => void;
  cardNumber: string;
  setCardNumber: (num: string) => void;
  cardExpiry: string;
  setCardExpiry: (expiry: string) => void;
  cardCvc: string;
  setCardCvc: (cvc: string) => void;
  cardName: string;
  setCardName: (name: string) => void;
  upiId: string;
  setUpiId: (id: string) => void;
  insuranceProvider: string;
  setInsuranceProvider: (prov: string) => void;
  insurancePolicy: string;
  setInsurancePolicy: (policy: string) => void;
  selectedBank: string;
  setSelectedBank: (bank: string) => void;
  selectedDoctor: DoctorListItem | null;
  date: string;
  startTime: string;
  endTime: string;
  isProcessingPayment: boolean;
  onBack: () => void;
  onNext: () => void;
}

export function PaymentMethodStep({
  paymentMethod,
  setPaymentMethod,
  cardNumber,
  setCardNumber,
  cardExpiry,
  setCardExpiry,
  cardCvc,
  setCardCvc,
  cardName,
  setCardName,
  upiId,
  setUpiId,
  insuranceProvider,
  setInsuranceProvider,
  insurancePolicy,
  setInsurancePolicy,
  selectedBank,
  setSelectedBank,
  selectedDoctor,
  date,
  startTime,
  endTime,
  isProcessingPayment,
  onBack,
  onNext,
}: PaymentMethodStepProps) {

  // Dynamic price calculation
  const docFee = selectedDoctor?.doctorProfile?.consultationFee ?? 500;
  const platformFee = 50;
  const taxes = Math.round(docFee * 0.08); // 8% dynamic tax
  const totalAmount = docFee + platformFee + taxes;

  const isPaymentValid = () => {
    if (paymentMethod === "CARD") {
      return cardNumber.trim().length >= 15 && cardExpiry.trim().length >= 5 && cardCvc.trim().length >= 3 && cardName.trim().length > 0;
    }
    if (paymentMethod === "UPI") {
      return upiId.trim().includes("@") && upiId.trim().length >= 5;
    }
    if (paymentMethod === "INSURANCE") {
      return insuranceProvider.trim().length > 0 && insurancePolicy.trim().length > 0;
    }
    if (paymentMethod === "NET_BANKING") {
      return selectedBank.length > 0;
    }
    if (paymentMethod === "CASH") {
      return true;
    }
    return false;
  };

  const formattedDate = date
    ? new Date(date).toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric", year: "numeric" })
    : "No date selected";

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start relative">
      
      {/* Left Column: Payment Options */}
      <div className="lg:col-span-7 xl:col-span-8 flex flex-col gap-4">
        
        {/* Credit/Debit Card Option */}
        <div className={cn(
          "bg-white border rounded-2xl overflow-hidden shadow-xs transition-all duration-300",
          paymentMethod === "CARD" ? "border-primary ring-1 ring-primary/20" : "border-slate-200"
        )}>
          {/* Header */}
          <div
            onClick={() => setPaymentMethod("CARD")}
            className="p-5 flex items-center justify-between cursor-pointer hover:bg-slate-50/50 transition-colors"
          >
            <div className="flex items-center gap-4">
              <div className={cn(
                "w-5 h-5 rounded-full border flex items-center justify-center transition-all",
                paymentMethod === "CARD" ? "border-primary" : "border-slate-350"
              )}>
                {paymentMethod === "CARD" && <div className="w-2.5 h-2.5 bg-primary rounded-full" />}
              </div>
              <div className="flex items-center gap-3">
                <CreditCard className={cn("h-5 w-5", paymentMethod === "CARD" ? "text-primary" : "text-slate-500")} />
                <span className="text-sm font-bold text-slate-800 font-headline-sm">Credit / Debit Card</span>
              </div>
            </div>
            <div className="flex gap-2">
              <div className="w-8 h-5 bg-slate-100 rounded flex items-center justify-center text-[8px] font-bold text-slate-400 font-sans tracking-wide">VISA</div>
              <div className="w-8 h-5 bg-slate-100 rounded flex items-center justify-center text-[8px] font-bold text-slate-400 font-sans tracking-wide">MC</div>
            </div>
          </div>

          {/* Card Form */}
          {paymentMethod === "CARD" && (
            <div className="px-5 pb-5 pt-2 border-t border-slate-50 animate-slide-down">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2 flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-slate-500 font-label-sm">Card Number</label>
                  <div className="relative">
                    <input
                      type="text"
                      maxLength={19}
                      value={cardNumber}
                      onChange={(e) => {
                        // Format card number to groups of 4: 0000 0000 0000 0000
                        const val = e.target.value.replace(/\D/g, "");
                        const formatted = val.replace(/(\d{4})/g, "$1 ").trim();
                        setCardNumber(formatted);
                      }}
                      placeholder="0000 0000 0000 0000"
                      className="w-full bg-slate-50/50 border border-slate-200 rounded-lg px-4 py-3 font-body-md text-sm text-slate-800 focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary-container outline-none transition-all font-medium pr-10"
                    />
                    <CreditCard className="h-5 w-5 text-slate-400 absolute right-3 top-3.5" />
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-slate-500 font-label-sm">Expiry Date</label>
                  <input
                    type="text"
                    maxLength={5}
                    value={cardExpiry}
                    onChange={(e) => {
                      let val = e.target.value.replace(/\D/g, "");
                      if (val.length > 2) {
                        val = val.slice(0, 2) + "/" + val.slice(2, 4);
                      }
                      setCardExpiry(val);
                    }}
                    placeholder="MM / YY"
                    className="w-full bg-slate-50/50 border border-slate-200 rounded-lg px-4 py-3 font-body-md text-sm text-slate-800 focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary-container outline-none transition-all font-medium"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-slate-500 font-label-sm">CVV</label>
                  <input
                    type="password"
                    maxLength={4}
                    value={cardCvc}
                    onChange={(e) => setCardCvc(e.target.value.replace(/\D/g, ""))}
                    placeholder="•••"
                    className="w-full bg-slate-50/50 border border-slate-200 rounded-lg px-4 py-3 font-body-md text-sm text-slate-800 focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary-container outline-none transition-all font-medium"
                  />
                </div>

                <div className="md:col-span-2 flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-slate-500 font-label-sm">Name on Card</label>
                  <input
                    type="text"
                    value={cardName}
                    onChange={(e) => setCardName(e.target.value)}
                    placeholder="John Doe"
                    className="w-full bg-slate-50/50 border border-slate-200 rounded-lg px-4 py-3 font-body-md text-sm text-slate-800 focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary-container outline-none transition-all font-medium"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* UPI Option */}
        <div className={cn(
          "bg-white border rounded-2xl overflow-hidden shadow-xs transition-all duration-300",
          paymentMethod === "UPI" ? "border-primary ring-1 ring-primary/20" : "border-slate-200"
        )}>
          {/* Header */}
          <div
            onClick={() => setPaymentMethod("UPI")}
            className="p-5 flex items-center justify-between cursor-pointer hover:bg-slate-50/50 transition-colors"
          >
            <div className="flex items-center gap-4">
              <div className={cn(
                "w-5 h-5 rounded-full border flex items-center justify-center transition-all",
                paymentMethod === "UPI" ? "border-primary" : "border-slate-350"
              )}>
                {paymentMethod === "UPI" && <div className="w-2.5 h-2.5 bg-primary rounded-full" />}
              </div>
              <div className="flex items-center gap-3">
                <QrCode className={cn("h-5 w-5", paymentMethod === "UPI" ? "text-primary" : "text-slate-500")} />
                <span className="text-sm font-bold text-slate-800 font-headline-sm">UPI / QR Code</span>
              </div>
            </div>
          </div>

          {/* UPI Form */}
          {paymentMethod === "UPI" && (
            <div className="px-5 pb-5 pt-2 border-t border-slate-50 animate-slide-down">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-500 font-label-sm">UPI ID / VPA Address</label>
                <input
                  type="text"
                  value={upiId}
                  onChange={(e) => setUpiId(e.target.value)}
                  placeholder="username@upi"
                  className="w-full bg-slate-50/50 border border-slate-200 rounded-lg px-4 py-3 font-body-md text-sm text-slate-800 focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary-container outline-none transition-all font-medium"
                />
                <span className="text-[10px] text-slate-400 font-semibold mt-1">UPI transfer supports GPay, PhonePe, Paytm, and active banking apps.</span>
              </div>
            </div>
          )}
        </div>

        {/* Net Banking Option */}
        <div className={cn(
          "bg-white border rounded-2xl overflow-hidden shadow-xs transition-all duration-300",
          paymentMethod === "NET_BANKING" ? "border-primary ring-1 ring-primary/20" : "border-slate-200"
        )}>
          {/* Header */}
          <div
            onClick={() => setPaymentMethod("NET_BANKING")}
            className="p-5 flex items-center justify-between cursor-pointer hover:bg-slate-50/50 transition-colors"
          >
            <div className="flex items-center gap-4">
              <div className={cn(
                "w-5 h-5 rounded-full border flex items-center justify-center transition-all",
                paymentMethod === "NET_BANKING" ? "border-primary" : "border-slate-350"
              )}>
                {paymentMethod === "NET_BANKING" && <div className="w-2.5 h-2.5 bg-primary rounded-full" />}
              </div>
              <div className="flex items-center gap-3">
                <Building className={cn("h-5 w-5", paymentMethod === "NET_BANKING" ? "text-primary" : "text-slate-500")} />
                <span className="text-sm font-bold text-slate-800 font-headline-sm">Net Banking</span>
              </div>
            </div>
          </div>

          {/* Net Banking Form */}
          {paymentMethod === "NET_BANKING" && (
            <div className="px-5 pb-5 pt-2 border-t border-slate-50 animate-slide-down">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-500 font-label-sm">Select Your Bank</label>
                <select
                  value={selectedBank}
                  onChange={(e) => setSelectedBank(e.target.value)}
                  className="w-full bg-slate-50/50 border border-slate-200 rounded-lg px-4 py-3 font-body-md text-sm text-slate-800 focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary-container outline-none transition-all font-semibold"
                >
                  <option value="" disabled>Choose a bank...</option>
                  <option value="sbi">State Bank of India</option>
                  <option value="hdfc">HDFC Bank</option>
                  <option value="icici">ICICI Bank</option>
                  <option value="axis">Axis Bank</option>
                  <option value="kotak">Kotak Mahindra Bank</option>
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Insurance Option */}
        <div className={cn(
          "bg-white border rounded-2xl overflow-hidden shadow-xs transition-all duration-300",
          paymentMethod === "INSURANCE" ? "border-primary ring-1 ring-primary/20" : "border-slate-200"
        )}>
          {/* Header */}
          <div
            onClick={() => setPaymentMethod("INSURANCE")}
            className="p-5 flex items-center justify-between cursor-pointer hover:bg-slate-50/50 transition-colors"
          >
            <div className="flex items-center gap-4">
              <div className={cn(
                "w-5 h-5 rounded-full border flex items-center justify-center transition-all",
                paymentMethod === "INSURANCE" ? "border-primary" : "border-slate-350"
              )}>
                {paymentMethod === "INSURANCE" && <div className="w-2.5 h-2.5 bg-primary rounded-full" />}
              </div>
              <div className="flex items-center gap-3">
                <ShieldAlert className={cn("h-5 w-5", paymentMethod === "INSURANCE" ? "text-primary" : "text-slate-500")} />
                <span className="text-sm font-bold text-slate-800 font-headline-sm">Pay via Insurance</span>
              </div>
            </div>
            <span className="bg-primary-container text-on-primary-container text-[9px] font-bold tracking-wide uppercase px-2 py-0.5 rounded-sm">
              Supported
            </span>
          </div>

          {/* Insurance Form */}
          {paymentMethod === "INSURANCE" && (
            <div className="px-5 pb-5 pt-2 border-t border-slate-50 animate-slide-down">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-slate-500 font-label-sm">Insurance Provider</label>
                  <input
                    type="text"
                    value={insuranceProvider}
                    onChange={(e) => setInsuranceProvider(e.target.value)}
                    placeholder="e.g. Star Health, LIC, Max Bupa"
                    className="w-full bg-slate-50/50 border border-slate-200 rounded-lg px-4 py-3 font-body-md text-sm text-slate-800 focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary-container outline-none transition-all font-medium"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-slate-500 font-label-sm">Policy Number / Member ID</label>
                  <input
                    type="text"
                    value={insurancePolicy}
                    onChange={(e) => setInsurancePolicy(e.target.value)}
                    placeholder="e.g. POL-9876543-ABC"
                    className="w-full bg-slate-50/50 border border-slate-200 rounded-lg px-4 py-3 font-body-md text-sm text-slate-800 focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary-container outline-none transition-all font-medium"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Cash Option */}
        <div className={cn(
          "bg-white border rounded-2xl overflow-hidden shadow-xs transition-all duration-300",
          paymentMethod === "CASH" ? "border-primary ring-1 ring-primary/20" : "border-slate-200"
        )}>
          {/* Header */}
          <div
            onClick={() => setPaymentMethod("CASH")}
            className="p-5 flex items-center justify-between cursor-pointer hover:bg-slate-50/50 transition-colors"
          >
            <div className="flex items-center gap-4">
              <div className={cn(
                "w-5 h-5 rounded-full border flex items-center justify-center transition-all",
                paymentMethod === "CASH" ? "border-primary" : "border-slate-350"
              )}>
                {paymentMethod === "CASH" && <div className="w-2.5 h-2.5 bg-primary rounded-full" />}
              </div>
              <div className="flex items-center gap-3">
                <BadgeCent className={cn("h-5 w-5", paymentMethod === "CASH" ? "text-primary" : "text-slate-500")} />
                <span className="text-sm font-bold text-slate-800 font-headline-sm">Cash at Hospital</span>
              </div>
            </div>
          </div>

          {/* Cash Notice */}
          {paymentMethod === "CASH" && (
            <div className="px-5 pb-5 pt-2 border-t border-slate-50 animate-slide-down">
              <p className="text-xs font-semibold text-slate-400 leading-relaxed">
                Please complete your checkout at the front desk when you arrive for your appointment. Cash, cards, and digital wallets are accepted at the clinic.
              </p>
            </div>
          )}
        </div>

      </div>

      {/* Right Column: Appointment Summary */}
      <div className="lg:col-span-5 xl:col-span-4 flex flex-col gap-6">
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs relative">
          
          {/* Loading Overlay */}
          {isProcessingPayment && (
            <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-white/95 backdrop-blur-xs animate-fade-in">
              <Loader2 className="h-10 w-10 text-primary animate-spin" />
              <p className="mt-4 font-bold text-slate-800 text-sm font-headline-sm">Securing transaction...</p>
              <p className="text-[10px] text-slate-400 font-semibold mt-1">Processing payment via secure gateway</p>
            </div>
          )}

          {/* Header */}
          <div className="bg-slate-50/80 px-6 py-4 border-b border-slate-200">
            <h3 className="text-sm font-bold text-slate-800 font-headline-sm">Appointment Summary</h3>
          </div>

          {/* Doctor Info */}
          <div className="p-6 border-b border-slate-100 border-dashed flex flex-col gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center text-primary border border-primary/20 shrink-0">
                <span className="font-extrabold text-sm tracking-tight">
                  {selectedDoctor?.name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase() || "MD"}
                </span>
              </div>
              <div className="min-w-0">
                <h4 className="font-bold text-sm text-slate-900 truncate font-headline-sm">
                  {selectedDoctor?.name || "Medical Provider"}
                </h4>
                <p className="text-xs font-semibold text-slate-400 truncate mt-0.5 font-body-md">
                  {selectedDoctor?.doctorProfile?.specialization || "General Medicine"}
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-2 pt-2 border-t border-slate-50">
              <p className="text-xs font-bold text-slate-500 font-label-md flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-primary" />
                {formattedDate}
              </p>
              {startTime && (
                <p className="text-xs font-bold text-slate-500 font-label-md flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-primary" />
                  {startTime} - {endTime}
                </p>
              )}
            </div>
          </div>

          {/* Pricing Breakdown */}
          <div className="p-6 flex flex-col gap-3.5 border-b border-slate-50">
            <div className="flex justify-between items-center text-xs font-semibold text-slate-400">
              <span>Consultation Fee</span>
              <span className="text-slate-800 font-bold">₹{docFee}</span>
            </div>
            <div className="flex justify-between items-center text-xs font-semibold text-slate-400">
              <span>Platform Fee</span>
              <span className="text-slate-800 font-bold">₹{platformFee}</span>
            </div>
            <div className="flex justify-between items-center text-xs font-semibold text-slate-400">
              <span>Taxes (GST 8%)</span>
              <span className="text-slate-800 font-bold">₹{taxes}</span>
            </div>
          </div>

          {/* Total & Action */}
          <div className="bg-slate-50/50 p-6 flex flex-col gap-4">
            <div className="flex justify-between items-end">
              <span className="text-sm font-bold text-slate-800 font-headline-sm">Total Amount</span>
              <span className="text-lg font-extrabold text-primary font-headline-md">₹{totalAmount}</span>
            </div>

            <button
              type="button"
              disabled={!isPaymentValid() || isProcessingPayment}
              onClick={onNext}
              className={cn(
                "w-full font-bold py-4 rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 text-sm font-label-md border border-transparent",
                isPaymentValid()
                  ? "bg-primary text-white hover:bg-surface-tint hover:shadow-xs active:scale-[0.98]"
                  : "bg-slate-100 text-slate-400 cursor-not-allowed"
              )}
            >
              <Lock className="h-4 w-4 shrink-0" />
              Pay &amp; Confirm Appointment
            </button>

            <div className="flex items-center justify-center gap-1.5 text-[10px] text-slate-400 font-semibold mt-1">
              <ShieldCheck className="h-3.5 w-3.5 text-primary shrink-0" />
              Secure encrypted payment
            </div>
          </div>

        </div>

        {/* Back Button */}
        <button
          type="button"
          onClick={onBack}
          className="font-semibold text-xs text-slate-500 hover:text-slate-800 py-3 rounded-xl border border-slate-200 hover:bg-slate-50 hover:border-slate-300 transition-colors flex items-center justify-center gap-1.5"
        >
          <ChevronLeft className="h-4 w-4" />
          Go Back
        </button>

      </div>

    </div>
  );
}
