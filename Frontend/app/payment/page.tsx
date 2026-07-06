"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { 
  CreditCard, ShieldCheck, CheckCircle, ArrowRight, ArrowLeft,
  LockSimple, SealCheck, TrendUp, Sparkle, Receipt, UploadSimple
} from "@phosphor-icons/react";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/lib/toast-context";
import { useCart } from "@/lib/cart-context";
import Link from "next/link";
import { uploadToCloudinary } from "@/lib/cloudinary";
import { uploadPaymentProof, getPaymentInstructions } from "@/lib/api";
import type { Course } from "@/lib/types";

export default function PaymentPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { cart, refreshCart, clearGuestCart } = useCart();
  const router = useRouter();
  const searchParams = useSearchParams();

  const applicationId = searchParams.get("applicationId");
  const courseId = searchParams.get("courseId");
  const courseNameParam = searchParams.get("courseName");
  const amountParam = searchParams.get("amount");
  
  const [paymentInstructions, setPaymentInstructions] = useState<any>(null);
  const [receiptBase64, setReceiptBase64] = useState<string>("");
  const [transactionNumber, setTransactionNumber] = useState<string>("");
  const [paymentNotes, setPaymentNotes] = useState<string>("");
  const [busy, setBusy] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [loadingInstructions, setLoadingInstructions] = useState(true);

  const courseName = courseNameParam || "Academy Enrollment";
  const amount = Number(amountParam) || 2500;

  useEffect(() => {
    if (courseId) {
      getPaymentInstructions(courseId).then(instructions => {
        setPaymentInstructions(instructions);
        setLoadingInstructions(false);
      }).catch(() => setLoadingInstructions(false));
    } else {
      setLoadingInstructions(false);
    }
  }, [courseId]);

  const handlePay = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!receiptBase64) {
      toast("Please upload a screenshot of your transfer receipt.", "error");
      return;
    }

    if (!applicationId) {
      toast("Application ID is missing.", "error");
      return;
    }

    setBusy(true);
    try {
      const secureUrl = await uploadToCloudinary(receiptBase64, "receipts");
      
      await uploadPaymentProof(applicationId, {
        proofUrl: secureUrl,
        transactionNumber: transactionNumber,
        notes: paymentNotes
      });
      
      toast("Payment proof uploaded successfully! Waiting for admin review.", "success");
      setCompleted(true);
      
      setTimeout(() => {
        router.push("/applications");
      }, 4000);
    } catch (e: any) {
      toast(e.message || "Payment failed. Please try again.", "error");
    } finally {
      setBusy(false);
    }
  };

  if (completed) {
    return (
      <div className="w-full px-10 py-8 flex items-center justify-center min-h-[70vh]">
        <div className="bg-white rounded-[3rem] p-16 shadow-sm border border-black/5 text-center max-w-lg w-full">
          <div className="w-28 h-28 bg-[#c2f0ff] rounded-full flex items-center justify-center mx-auto mb-8">
            <CheckCircle size={64} weight="fill" className="text-[#0284c7]" />
          </div>
          <h1 className="font-display text-4xl font-black text-zinc-900 mb-4">
            Payment Proof Submitted!
          </h1>
          <p className="text-zinc-500 font-medium mb-8 text-lg leading-relaxed">
            Your payment proof is now under review. You'll receive access as soon as the academy verifies it.
          </p>
          <div className="flex flex-col gap-3">
            <button 
              onClick={() => router.push("/applications")} 
              className="w-full py-4 bg-brand hover:bg-brand-hover text-brand-fg rounded-2xl font-bold text-lg shadow-[0_8px_20px_-6px_rgba(159,232,112,0.45)] transition-all active:scale-[0.98] flex items-center justify-center gap-2"
            >
              Go to My Applications <ArrowRight size={20} weight="bold" />
            </button>
            <p className="text-zinc-400 text-xs font-medium mt-2">Redirecting in 4 seconds...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full px-10 py-8">
      {/* Header */}
      <div className="flex flex-col mb-8">
        <Link href="/applications" className="text-brand text-sm font-bold hover:underline mb-4 flex items-center gap-2">
          <ArrowLeft weight="bold" /> Back to Applications
        </Link>
        <h1 className="text-4xl font-display font-black tracking-tight text-zinc-900 mb-2">
          Complete Payment for {courseName}
        </h1>
        <p className="text-zinc-500 font-medium">Upload your payment proof to complete your application.</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_420px] gap-8 items-start">
        
        {/* Payment Form */}
        <div className="bg-white rounded-[2.5rem] p-8 lg:p-10 shadow-sm border border-black/5">
          
          {/* Payment Instructions */}
          {loadingInstructions ? (
            <div className="mb-10">
              <div className="h-6 bg-zinc-200 rounded w-1/3 mb-4 animate-pulse"></div>
              <div className="h-4 bg-zinc-200 rounded w-full mb-2 animate-pulse"></div>
              <div className="h-4 bg-zinc-200 rounded w-2/3 animate-pulse"></div>
            </div>
          ) : paymentInstructions ? (
            <div className="mb-10 bg-brand-hover/20 border border-brand/20 rounded-[2rem] p-8">
              <SealCheck size={48} weight="fill" className="text-zinc-900 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-zinc-900 text-center mb-4">Payment Instructions</h3>
              <div className="text-center space-y-2">
                {paymentInstructions.accountName && (
                  <p className="text-zinc-700 font-medium"><strong>Account Name:</strong> {paymentInstructions.accountName}</p>
                )}
                {paymentInstructions.accountNumber && (
                  <p className="text-zinc-700 font-medium"><strong>Account Number:</strong> {paymentInstructions.accountNumber}</p>
                )}
                <p className="text-zinc-700 font-medium"><strong>Amount:</strong> EGP {amount.toLocaleString()}</p>
                {paymentInstructions.instructions && (
                  <p className="text-zinc-700 font-medium mt-4">{paymentInstructions.instructions}</p>
                )}
              </div>
            </div>
          ) : (
            <div className="mb-10 bg-brand-hover/20 border border-brand/20 rounded-[2rem] p-8 text-center">
              <SealCheck size={48} weight="fill" className="text-zinc-900 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-zinc-900 mb-2">Transfer Details</h3>
              <p className="text-zinc-700 font-medium text-sm">Transfer EGP {amount.toLocaleString()} to complete your payment, then upload the screenshot below.</p>
            </div>
          )}

          <form onSubmit={handlePay} className="space-y-6">
            {/* Receipt Upload */}
            <div className="relative border-2 border-dashed border-zinc-900/20 hover:border-zinc-900/40 bg-zinc-50 rounded-2xl p-6 transition-colors group">
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    const r = new FileReader();
                    r.onload = () => {
                      setReceiptBase64(r.result as string);
                    };
                    r.readAsDataURL(file);
                  }
                }}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
              />
              {receiptBase64 ? (
                <div className="flex flex-col items-center">
                  <img src={receiptBase64} alt="Receipt" className="h-32 object-contain rounded-xl mb-2 border border-black/10 shadow-sm" />
                  <span className="text-sm font-bold text-zinc-900">Receipt Attached (Click to change)</span>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2">
                  <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center shadow-sm">
                    <UploadSimple size={24} weight="bold" className="text-zinc-500" />
                  </div>
                  <span className="text-sm font-bold text-zinc-900">Upload Screenshot</span>
                  <span className="text-xs text-zinc-500">PNG or JPG up to 5MB</span>
                </div>
              )}
            </div>

            {/* Transaction Number */}
            <div>
              <label className="block text-sm font-bold text-zinc-700 mb-2">Transaction Number / Reference ID</label>
              <input 
                type="text"
                value={transactionNumber}
                onChange={(e) => setTransactionNumber(e.target.value)}
                placeholder="e.g., TXN123456789"
                className="w-full h-14 px-6 rounded-2xl border bg-canvas-soft text-sm font-medium text-zinc-800 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand/30 transition-all border-black/10"
              />
            </div>

            {/* Payment Notes */}
            <div>
              <label className="block text-sm font-bold text-zinc-700 mb-2">Additional Notes (Optional)</label>
              <textarea 
                rows={3}
                value={paymentNotes}
                onChange={(e) => setPaymentNotes(e.target.value)}
                placeholder="Add any extra information about your payment..."
                className="w-full px-6 py-4 rounded-2xl border bg-canvas-soft text-sm font-medium text-zinc-800 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand/30 transition-all border-black/10 resize-none"
              />
            </div>

            <button 
              type="submit"
              disabled={busy}
              className="w-full mt-8 py-5 bg-brand hover:bg-brand-hover text-brand-fg rounded-2xl font-bold text-lg shadow-[0_8px_20px_-6px_rgba(159,232,112,0.45)] transition-all active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-3"
            >
              {busy ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Uploading Payment Proof...
                </>
              ) : (
                <>
                  <ShieldCheck size={22} weight="bold" />
                  Upload Payment Proof
                </>
              )}
            </button>

            <div className="flex items-center justify-center gap-2 mt-6 text-zinc-400 text-xs font-medium">
              <LockSimple size={14} weight="bold" />
              256-bit SSL encrypted by ElSewedy Secure Gateway
            </div>
          </form>
        </div>

        {/* Order Receipt Sidebar */}
        <div className="sticky top-28 flex flex-col gap-6">
          <div className="bg-ink rounded-[2.5rem] p-8 text-white shadow-xl">
            <div className="flex items-center gap-3 mb-8">
              <Receipt size={24} weight="fill" className="text-brand" />
              <h3 className="text-lg font-bold">Payment Summary</h3>
            </div>
            
            <div className="flex flex-col gap-4 mb-8">
              <div className="flex justify-between items-center pb-4 border-b border-white/10">
                <span className="text-zinc-400 font-medium text-sm">Course</span>
                <span className="font-bold text-sm text-right max-w-[200px] line-clamp-2">{courseName}</span>
              </div>
              <div className="flex justify-between items-center pb-4 border-b border-white/10">
                <span className="text-zinc-400 font-medium text-sm">Amount</span>
                <span className="font-bold text-sm">EGP {amount.toLocaleString()}</span>
              </div>
            </div>

            <div className="flex justify-between items-end">
              <span className="text-zinc-400 font-medium">Total Amount</span>
              <div className="text-right">
                <div className="text-3xl font-display font-black">EGP {amount.toLocaleString()}</div>
              </div>
            </div>
          </div>

          {/* Benefits */}
          <div className="bg-[#c2f0ff] rounded-[2rem] p-6 shadow-sm border border-[#0284c7]/10">
            <h4 className="font-bold text-zinc-900 mb-4">What you get</h4>
            <div className="flex flex-col gap-3">
              {[
                "Lifetime resource access",
                "Official academy certificate", 
                "500 welcome XP bonus",
                "Full refund within first week"
              ].map((benefit, i) => (
                <div key={i} className="flex items-center gap-3 text-sm font-medium text-zinc-800">
                  <CheckCircle size={18} weight="fill" className="text-[#0284c7] shrink-0" />
                  {benefit}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
