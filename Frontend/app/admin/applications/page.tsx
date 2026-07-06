"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  getAllApplications,
  getApplicationDetails,
  adminApproveApplication,
  adminRejectApplication,
  adminRequestNewPaymentProof
} from "@/lib/api";
import Link from "next/link";
import { useToast } from "@/lib/toast-context";
import { exportToCsv } from "@/lib/csv-export";
import Image from "next/image";
import {
  ClipboardText, ArrowLeft, Check, X, CheckCircle, UserCircle, DownloadSimple, ImageSquare, ArrowClockwise
} from "@phosphor-icons/react";
import { SkeletonTable } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";

const STATUSES = [
  "all",
  "Draft",
  "WaitingForPretest",
  "PretestFailed",
  "WaitingForPayment",
  "PaymentSubmitted",
  "PaymentUnderReview",
  "RequestingNewPaymentProof",
  "Approved",
  "Rejected"
];
const FINAL_STATUSES = ["Approved", "Rejected", "Cancelled"];

export default function AdminApplicationsPage() {
  const [apps, setApps] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const { toast } = useToast();

  const [selectedAppId, setSelectedAppId] = useState<string | null>(null);
  const [appDetails, setAppDetails] = useState<any>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [confirmAction, setConfirmAction] = useState<{
    id: string;
    decision: "Approve" | "Reject" | "RequestNewProof";
  } | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");

  // Refresh applications
  const refreshApplications = async () => {
    setLoading(true);
    try {
      const data = await getAllApplications(statusFilter === "all" ? undefined : statusFilter);
      setApps(data?.items ?? []);
    } catch (err) {
      toast("Failed to load applications", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshApplications();
  }, [statusFilter, toast]);

  useEffect(() => {
    if (!selectedAppId) {
      setAppDetails(null);
      return;
    }
    setDetailsLoading(true);
    getApplicationDetails(selectedAppId)
      .then(res => setAppDetails(res))
      .catch(() => {
        toast("Failed to load application details", "error");
      })
      .finally(() => setDetailsLoading(false));
  }, [selectedAppId, toast]);

  const handleAction = async () => {
    if (!confirmAction) return;
    try {
      if (confirmAction.decision === "Approve") {
        await adminApproveApplication(confirmAction.id);
        toast("Application approved and student enrolled", "success");
      } else if (confirmAction.decision === "Reject") {
        await adminRejectApplication(confirmAction.id, rejectionReason);
        toast("Application rejected", "success");
      } else if (confirmAction.decision === "RequestNewProof") {
        await adminRequestNewPaymentProof(confirmAction.id);
        toast("New payment proof requested", "success");
      }
      await refreshApplications();
      if (selectedAppId === confirmAction.id) {
        setDetailsLoading(true);
        await getApplicationDetails(selectedAppId)
          .then(res => setAppDetails(res))
          .catch(() => toast("Failed to refresh details", "error"))
          .finally(() => setDetailsLoading(false));
      }
      setConfirmAction(null);
      setRejectionReason("");
    } catch (e: any) {
      toast(e.message || "Failed", "error");
    }
  };

  const handleExport = () => {
    const data = apps.map(a => ({
      "Student Name": a.studentName,
      "Email": a.studentEmail,
      "Course": a.courseTitle,
      "Cohort": a.roundName || "General Admission",
      "Status": a.status,
      "Price EGP": a.amountEgp || a.coursePrice || "",
      "Pretest Score": a.pretestScore != null ? `${a.pretestScore}%` : "",
      "Submitted": a.submittedAt,
      "Payment Proof URL": a.paymentProofUrl || "",
      "Application ID": a.id,
    }));
    exportToCsv(data, `applications-${statusFilter}`, {
      "Student Name": "Student Name",
      "Email": "Email",
      "Course": "Course",
      "Status": "Status",
      "Price EGP": "Price (EGP)",
      "Pretest Score": "Pretest Score",
      "Submitted": "Submitted Date",
      "Payment Proof URL": "Payment Proof URL",
      "Application ID": "Application ID",
    });
    toast("Applications exported to CSV", "success");
  };

  // Get status badge color
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Approved":
        return "bg-green-100 text-green-700";
      case "Rejected":
        return "bg-red-100 text-red-700";
      case "WaitingForPayment":
      case "RequestingNewPaymentProof":
        return "bg-purple-100 text-purple-700";
      case "PaymentSubmitted":
      case "PaymentUnderReview":
        return "bg-amber-100 text-amber-700";
      case "WaitingForPretest":
      case "PretestFailed":
        return "bg-orange-100 text-orange-700";
      default:
        return "bg-brand-hover text-zinc-900";
    }
  };

  if (loading) return <div className="w-full px-4 sm:px-6 lg:px-12 pt-4 sm:pt-6 pb-24"><SkeletonTable rows={6} cols={4} /></div>;

  return (
    <div className="w-full px-4 sm:px-6 lg:px-12 pt-4 sm:pt-6 pb-24 relative">
      <div className="mb-6 sm:mb-8">
        <Link href="/admin" className="text-brand text-xs font-black uppercase tracking-[0.2em] mb-3 sm:mb-4 flex items-center gap-2 hover:underline">
          <ArrowLeft size={14} weight="bold" /> Back to Dashboard
        </Link>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl sm:text-3xl lg:text-4xl font-black text-zinc-900 tracking-tight mb-2">Application Intake</h1>
            <p className="text-zinc-500 font-medium">Review applications, approve payments, and enroll students.</p>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={handleExport} className="flex items-center gap-2 bg-white px-5 py-3 rounded-2xl shadow-sm border border-black/5 hover:bg-zinc-50 transition-all text-sm font-bold text-zinc-700 micro-hover">
              <DownloadSimple size={18} weight="bold" /> Export CSV
            </button>
            <button onClick={refreshApplications} className="flex items-center gap-2 bg-white px-5 py-3 rounded-2xl shadow-sm border border-black/5 hover:bg-zinc-50 transition-all text-sm font-bold text-zinc-700 micro-hover">
              <ArrowClockwise size={18} weight="bold" /> Refresh
            </button>
            <div className="flex items-center gap-3 bg-white px-6 py-4 rounded-2xl shadow-sm border border-black/5">
              <ClipboardText size={20} weight="fill" className="text-brand" />
              <span className="font-bold text-zinc-900">{apps.length}</span>
              <span className="text-sm text-zinc-500">applications</span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
        {STATUSES.map((tab) => (
          <button key={tab} onClick={() => setStatusFilter(tab)}
            className={`px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap micro-hover ${
              statusFilter === tab
                ? "bg-zinc-900 text-white shadow-lg"
                : "bg-white text-zinc-500 border border-black/5 hover:bg-zinc-50"
            }`}
          >
            {tab === "all" ? "All" : tab.replace(/([A-Z])/g, ' $1').trim()}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {apps.length === 0 ? (
          <div className="bg-white rounded-[2.5rem] border border-black/5">
            <EmptyState icon={<CheckCircle size={32} weight="fill" />} title="No Applications" description="No applications match this filter." />
          </div>
        ) : (
          apps.map((app) => {
            const isFinal = FINAL_STATUSES.includes(app.status);
            const isPaymentReview = app.status === "PaymentSubmitted" || app.status === "PaymentUnderReview";
            return (
              <div
                key={app.id}
                onClick={() => setSelectedAppId(app.id)}
                className="bg-white rounded-[1.5rem] p-5 shadow-sm border border-black/5 hover:border-black/20 hover:shadow-md cursor-pointer transition-all duration-300"
              >
                <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <div className="w-11 h-11 rounded-xl bg-zinc-100 flex items-center justify-center shrink-0">
                      <UserCircle size={26} weight="fill" className="text-zinc-400" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-bold text-zinc-900 truncate">{app.studentName}</h3>
                      <p className="text-xs text-zinc-500 truncate">{app.studentEmail} · {app.courseTitle}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 flex-shrink-0">
                    <div className="text-right hidden sm:block">
                      <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Price</div>
                      <div className="font-bold text-zinc-900 text-sm">{app.coursePrice != null ? `${app.coursePrice} EGP` : '-'}</div>
                    </div>
                    <div className="text-right hidden sm:block">
                      <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Pretest</div>
                      <div className="font-bold text-zinc-900 text-sm">{app.pretestScore != null ? `${app.pretestScore}%` : 'N/A'}</div>
                    </div>
                    <div className="text-right hidden lg:block">
                      <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Submitted</div>
                      <div className="text-xs font-bold text-zinc-600">{app.createdAt ? new Date(app.createdAt).toLocaleDateString() : '-'}</div>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest whitespace-nowrap ${getStatusBadge(app.status)}`}>
                      {app.status.replace(/([A-Z])/g, ' $1').trim()}
                    </span>
                    {!isFinal && isPaymentReview ? (
                      <div className="flex gap-1.5">
                        <button onClick={(e) => { e.stopPropagation(); setConfirmAction({ id: app.id, decision: "Approve" }); }}
                          className="w-9 h-9 rounded-xl bg-green-100 text-green-700 flex items-center justify-center hover:bg-green-200 transition-colors micro-hover"
                          title="Approve Payment">
                          <Check size={16} weight="bold" />
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); setConfirmAction({ id: app.id, decision: "RequestNewProof" }); }}
                          className="w-9 h-9 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center hover:bg-amber-200 transition-colors micro-hover"
                          title="Request New Proof">
                          <ArrowClockwise size={16} weight="bold" />
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); setConfirmAction({ id: app.id, decision: "Reject" }); }}
                          className="w-9 h-9 rounded-xl bg-red-100 text-red-700 flex items-center justify-center hover:bg-red-200 transition-colors micro-hover"
                          title="Reject">
                          <X size={16} weight="bold" />
                        </button>
                      </div>
                    ) : !isFinal ? (
                      <div className="text-zinc-200"><CheckCircle size={18} weight="fill" /></div>
                    ) : (
                      <div className="text-zinc-200"><CheckCircle size={18} weight="fill" /></div>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Slide-over Details Panel */}
      {selectedAppId && (
        <div className="fixed inset-0 z-[100] flex justify-end">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-md transition-opacity"
            onClick={() => setSelectedAppId(null)}
          />

          {/* Drawer Panel */}
          <div className="relative w-full max-w-2xl h-full bg-zinc-50 shadow-2xl flex flex-col z-10 animate-in slide-in-from-right duration-500 ease-out border-l border-black/10">
            {/* Header */}
            <div className="p-8 border-b border-black/5 flex items-start justify-between bg-white relative overflow-hidden shrink-0">
              <div className="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.02)_1px,transparent_1px)] bg-[size:16px_16px] pointer-events-none" />
              <div className="relative z-10">
                <span className="text-[10px] font-black uppercase tracking-widest text-brand mb-3 flex items-center gap-2">
                  <span className="w-6 h-px bg-brand"></span> Candidate Review
                </span>
                <h2 className="text-3xl font-display font-black text-zinc-900 tracking-tight leading-none">
                  {detailsLoading ? "Loading Profile..." : appDetails?.studentName || "Candidate Profile"}
                </h2>
              </div>
              <button
                onClick={() => setSelectedAppId(null)}
                className="w-10 h-10 rounded-full border border-black/5 flex items-center justify-center text-zinc-400 hover:text-zinc-900 transition-colors bg-white hover:bg-zinc-50 hover:shadow-sm relative z-10 active:scale-95"
              >
                <X size={18} weight="bold" />
              </button>
            </div>

            {/* Content Body - Scrollable */}
            <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">
              {detailsLoading ? (
                <div className="flex flex-col items-center justify-center py-32 space-y-4">
                  <div className="w-12 h-12 border-4 border-brand/20 border-t-brand rounded-full animate-spin shadow-lg shadow-brand/10" />
                  <span className="text-sm text-zinc-400 font-bold uppercase tracking-widest">Retrieving dossier...</span>
                </div>
              ) : appDetails ? (
                <>
                  {/* Student & Cohort Metadata Bento Card */}
                  <div className="bg-white border border-black/5 rounded-[2rem] p-6 shadow-sm">
                    <div className="grid grid-cols-2 gap-y-6 gap-x-4">
                      <div>
                        <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest block mb-1">Email Address</span>
                        <span className="font-bold text-zinc-900 text-sm break-all">{appDetails.studentEmail}</span>
                      </div>
                      <div>
                        <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest block mb-1">Applied Course</span>
                        <span className="font-bold text-zinc-900 text-sm">{appDetails.courseTitle}</span>
                      </div>
                      <div>
                        <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest block mb-1">Target Cohort</span>
                        <span className="font-bold text-zinc-900 text-sm">{appDetails.roundName || "General Admission"}</span>
                      </div>
                      <div>
                        <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest block mb-1">Application Date</span>
                        <span className="font-bold text-zinc-900 text-sm">{appDetails.createdAt ? new Date(appDetails.createdAt).toLocaleDateString() : '-'}</span>
                      </div>
                      <div className="col-span-2 pt-4 border-t border-black/5">
                        <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest block mb-2">Pretest Score</span>
                        <span className="font-black text-brand text-2xl">{appDetails.pretestScore != null ? `${appDetails.pretestScore}%` : "N/A"}</span>
                      </div>

                      {/* Price Section */}
                      {appDetails.coursePrice > 0 && (
                        <div className="col-span-2 pt-4 border-t border-black/5">
                          <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest block mb-3">Pricing</span>
                          <div className="bg-zinc-50 rounded-xl p-4 space-y-2">
                            <div className="flex justify-between items-center">
                              <span className="text-xs font-bold text-zinc-500">Course Price</span>
                              <span className="text-sm font-black text-zinc-900">{appDetails.coursePrice} EGP</span>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Payment Proof */}
                      {appDetails.paymentProofUrl && (
                        <div className="col-span-2 pt-4 border-t border-black/5">
                          <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest block mb-3">Payment Proof</span>
                          <a href={appDetails.paymentProofUrl} target="_blank" rel="noopener noreferrer" className="block relative w-full aspect-video max-w-md rounded-xl overflow-hidden border border-black/10 bg-zinc-100 group">
                            <Image src={appDetails.paymentProofUrl} alt="Payment proof" fill className="object-contain group-hover:scale-105 transition-transform duration-500" />
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                              <span className="text-white text-xs font-bold bg-black/60 px-4 py-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">View Full Image</span>
                            </div>
                          </a>
                          <div className="mt-3 space-y-1">
                            {appDetails.paymentTransactionNumber && (
                              <p className="text-sm text-zinc-600 font-medium">
                                <span className="text-zinc-400 font-bold text-xs uppercase tracking-wider">Transaction:</span> {appDetails.paymentTransactionNumber}
                              </p>
                            )}
                            {appDetails.paymentNotes && (
                              <p className="text-sm text-zinc-600 font-medium">
                                <span className="text-zinc-400 font-bold text-xs uppercase tracking-wider">Notes:</span> {appDetails.paymentNotes}
                              </p>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </>
              ) : (
                <div className="bg-white border border-dashed border-black/10 rounded-[2rem] p-10 text-center">
                  <p className="text-zinc-500 text-sm font-bold">Failed to retrieve candidate profile.</p>
                </div>
              )}
            </div>

            {/* Footer Review Decision Panel - Sticky */}
            {appDetails && !FINAL_STATUSES.includes(appDetails.status) && (
              <div className="p-6 border-t border-black/5 bg-white flex items-center gap-4 shrink-0 shadow-[0_-10px_40px_rgba(0,0,0,0.03)] z-20">
                {(appDetails.status === "PaymentSubmitted" || appDetails.status === "PaymentUnderReview") ? (
                  <>
                    <button
                      onClick={() => setConfirmAction({ id: appDetails.id, decision: "Approve" })}
                      className="flex-1 py-4 bg-green-600 hover:bg-green-700 text-white rounded-2xl font-black uppercase tracking-wider text-xs transition-all flex items-center justify-center gap-2 active:scale-95 shadow-md shadow-green-600/20 btn-micro"
                    >
                      <Check size={18} weight="bold" /> Approve Payment
                    </button>
                    <button
                      onClick={() => setConfirmAction({ id: appDetails.id, decision: "RequestNewProof" })}
                      className="w-40 py-4 bg-white border border-amber-200 hover:border-amber-500 text-amber-700 rounded-2xl font-bold uppercase tracking-wider text-xs transition-all flex items-center justify-center gap-2 active:scale-95 hover:bg-amber-50"
                    >
                      <ArrowClockwise size={16} weight="bold" /> New Proof
                    </button>
                    <button
                      onClick={() => setConfirmAction({ id: appDetails.id, decision: "Reject" })}
                      className="w-32 py-4 bg-white border border-red-200 hover:border-red-500 text-red-600 rounded-2xl font-bold uppercase tracking-wider text-xs transition-all flex items-center justify-center gap-2 active:scale-95 hover:bg-red-50"
                    >
                      Reject
                    </button>
                  </>
                ) : null}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      <AnimatePresence>
        {confirmAction && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => { setConfirmAction(null); setRejectionReason(""); }} />
            <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }} className="relative bg-white rounded-[2.5rem] w-full max-w-md p-8 shadow-2xl border border-black/5">
              <div className="w-14 h-14 rounded-2xl bg-zinc-100 flex items-center justify-center mb-4">
                {confirmAction.decision === "Approve" ? (
                  <CheckCircle size={32} className="text-green-600" weight="fill" />
                ) : confirmAction.decision === "RequestNewProof" ? (
                  <ArrowClockwise size={32} className="text-amber-600" weight="bold" />
                ) : (
                  <X size={32} className="text-red-500" weight="bold" />
                )}
              </div>
              <h3 className="text-2xl font-display font-black text-zinc-900 mb-2">
                {confirmAction.decision === "Approve"
                  ? "Approve Payment"
                  : confirmAction.decision === "RequestNewProof"
                  ? "Request New Payment Proof"
                  : "Reject Application"}
              </h3>
              <p className="text-sm text-zinc-500 font-medium mb-6">
                {confirmAction.decision === "Approve"
                  ? "This will approve the payment and enroll the student in the course."
                  : confirmAction.decision === "RequestNewProof"
                  ? "This will request the student to upload a new payment proof."
                  : "This will reject the application and notify the student."}
              </p>

              {confirmAction.decision === "Reject" && (
                <div className="mb-6">
                  <label className="text-xs font-bold text-zinc-700 uppercase tracking-widest block mb-2">
                    Rejection Reason
                  </label>
                  <textarea
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="Why are you rejecting this application?"
                    className="w-full px-4 py-3 rounded-xl border border-zinc-200 focus:border-brand focus:ring-2 focus:ring-brand/20 outline-none text-sm"
                    rows={4}
                  />
                </div>
              )}

              <div className="flex gap-3">
                <button onClick={() => { setConfirmAction(null); setRejectionReason(""); }} className="flex-1 py-3.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded-xl font-bold text-sm transition-all">
                  Cancel
                </button>
                <button
                  onClick={handleAction}
                  className={`flex-1 py-3.5 rounded-xl font-bold text-sm transition-all text-white ${
                    confirmAction.decision === "Approve"
                      ? "bg-green-600 hover:bg-green-700"
                      : confirmAction.decision === "RequestNewProof"
                      ? "bg-amber-600 hover:bg-amber-700"
                      : "bg-red-600 hover:bg-red-700"
                  }`}
                  disabled={confirmAction.decision === "Reject" && !rejectionReason.trim()}
                >
                  {confirmAction.decision === "Approve"
                    ? "Yes, Approve"
                    : confirmAction.decision === "RequestNewProof"
                    ? "Yes, Request"
                    : "Yes, Reject"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
