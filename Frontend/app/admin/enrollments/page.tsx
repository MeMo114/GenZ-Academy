"use client";

import { useEffect, useState } from "react";
import { getAdminEnrollments, deleteAdminEnrollment } from "@/lib/api";
import Link from "next/link";
import { Funnel, MagnifyingGlass, ArrowLeft, User, FileCsv, UserPlus, Trash } from "@phosphor-icons/react";
import { Table, type Column } from "@/components/ui/Table";
import { useToast } from "@/lib/toast-context";
import ManualEnrollmentModal from "@/components/ManualEnrollmentModal";
import { SkeletonTable } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { exportToCsv } from "@/lib/csv-export";

export default function AdminEnrollmentsPage() {
  const [enrollments, setEnrollments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showEnrollModal, setShowEnrollModal] = useState(false);
  const { toast } = useToast();

  const fetchEnrollments = () => {
    setLoading(true);
    getAdminEnrollments().then(data => setEnrollments(data.items ?? [])).finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchEnrollments();
  }, []);

  const handleRemove = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!confirm("Are you sure you want to remove this enrollment? The student will lose access to the course room.")) return;

    try {
      await deleteAdminEnrollment(id);
      toast("Enrollment removed successfully", "success");
      fetchEnrollments();
    } catch (err: any) {
      toast(err.message || "Failed to remove enrollment", "error");
    }
  };

  const columns: Column<any>[] = [
    { key: "studentName", label: "Student", sortable: true, render: (r) => <span className="font-bold text-zinc-900">{r.studentName}</span> },
    { key: "studentEmail", label: "Email", sortable: true, render: (r) => <span className="text-zinc-500 text-sm">{r.studentEmail}</span> },
    { key: "courseName", label: "Course", sortable: true, render: (r) => <span className="text-zinc-600 font-medium">{r.courseName}</span> },
    { key: "finalPriceEgp", label: "Price", sortable: true, render: (r) => <span className="font-bold text-zinc-900">{r.finalPriceEgp} EGP</span> },
    {
      key: "enrollmentStatus",
      label: "Status",
      sortable: true,
      render: (r) => (
        <span className={`px-3 py-1 rounded-full text-xs font-bold ${r.enrollmentStatus === 'Active' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
          {r.enrollmentStatus || 'Active'}
        </span>
      ),
    },
    { key: "createdAt", label: "Date", sortable: true, render: (r) => <span className="text-zinc-500 text-sm">{r.createdAt ? new Date(r.createdAt).toLocaleDateString() : '-'}</span> },
    {
      key: "id",
      label: "Actions",
      width: "80px",
      render: (r) => (
        <button 
          onClick={(e) => handleRemove(e, r.id)}
          className="p-2 text-zinc-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
          title="Remove Enrollment"
        >
          <Trash size={18} weight="bold" />
        </button>
      )
    }
  ];

  return (
    <div className="w-full px-4 sm:px-6 lg:px-12 pt-4 sm:pt-6 pb-24">
      <div className="mb-6 sm:mb-10 flex items-center justify-between">
        <div>
          <Link href="/admin" className="text-brand text-xs font-black uppercase tracking-[0.2em] mb-3 sm:mb-4 flex items-center gap-2 hover:underline">
            <ArrowLeft size={14} weight="bold" /> Back to Dashboard
          </Link>
          <h1 className="font-display text-2xl sm:text-3xl lg:text-4xl font-black text-zinc-900 tracking-tight mb-2">Enrollments</h1>
          <p className="text-zinc-500 font-medium">Manage and review student applications.</p>
        </div>
        <div className="flex items-center gap-3">
          {enrollments.length > 0 && (
            <button onClick={() => exportToCsv(enrollments.map((e: any) => ({ Student: e.studentName, Email: e.studentEmail, Course: e.courseName, Price: e.finalPriceEgp, Status: e.enrollmentStatus, Date: e.createdAt })), "enrollments")}
              className="px-5 py-3 bg-zinc-50 border border-black/10 rounded-2xl font-bold text-sm text-zinc-700 flex items-center gap-2 hover:bg-zinc-100 transition-colors micro-hover">
              <FileCsv size={18} weight="bold" /> Export CSV
            </button>
          )}
          <button 
            onClick={() => setShowEnrollModal(true)}
            className="px-5 py-3 bg-zinc-900 text-white rounded-2xl font-bold text-sm flex items-center gap-2 hover:bg-black transition-colors micro-hover shadow-xl shadow-zinc-900/10"
          >
            <UserPlus size={18} weight="bold" />
            Add Enrollment
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-8 shadow-sm border border-black/5">
        {loading ? (
          <SkeletonTable rows={6} cols={6} />
        ) : enrollments.length === 0 ? (
          <EmptyState
            icon={<User size={32} className="text-zinc-300" />}
            title="No enrollments found"
            description="Students haven't enrolled in any courses yet."
          />
        ) : (
          <>
            <div className="flex flex-col md:flex-row gap-4 mb-8">
              <div className="relative flex-1">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <MagnifyingGlass size={20} className="text-zinc-400" />
                </div>
                <input type="text" placeholder="Search applications..." className="w-full bg-zinc-50 border border-black/10 rounded-2xl pl-12 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-black/5" />
              </div>
              <button className="px-6 py-3 bg-zinc-50 border border-black/10 rounded-2xl font-bold text-sm text-zinc-700 flex items-center gap-2 hover:bg-zinc-100 transition-colors micro-hover">
                <Funnel size={18} weight="bold" /> Filter
              </button>
            </div>
            <Table columns={columns} data={enrollments} keyExtractor={(r: any) => r.id || Math.random().toString()} />
          </>
        )}
      </div>

      <ManualEnrollmentModal 
        isOpen={showEnrollModal}
        onClose={() => setShowEnrollModal(false)}
        onSuccess={() => fetchEnrollments()}
      />
    </div>
  );
}
