"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { 
  ArrowLeft, 
  User, 
  ShieldCheck, 
  Envelope, 
  Calendar, 
  CheckCircle, 
  XCircle, 
  Sparkle, 
  IdentificationCard,
  Bell,
  HardDrive
} from "@phosphor-icons/react";
import { apiGet } from "@/lib/api";
import { SkeletonTable } from "@/components/ui/Skeleton";
import { useToast } from "@/lib/toast-context";

export default function UserProfilePage() {
  const { id } = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiGet(`/api/admin/users/${id}`, null)
      .then(setData)
      .catch(err => {
        toast(err.message || "Failed to load user profile", "error");
        router.push("/admin/users");
      })
      .finally(() => setLoading(false));
  }, [id, router, toast]);

  if (loading) return <div className="p-12"><SkeletonTable rows={10} cols={1} /></div>;
  if (!data) return null;

  return (
    <div className="w-full px-4 sm:px-6 lg:px-12 pt-4 sm:pt-6 pb-24">
      <div className="mb-8">
        <Link href="/admin/users" className="text-brand text-xs font-black uppercase tracking-[0.2em] mb-4 flex items-center gap-2 hover:underline">
          <ArrowLeft size={14} weight="bold" /> Back to Directory
        </Link>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="w-20 h-20 rounded-3xl bg-zinc-100 border border-zinc-200 flex items-center justify-center text-3xl font-black text-zinc-400">
              {data.displayName?.charAt(0)}
            </div>
            <div>
              <h1 className="font-display text-3xl font-black text-zinc-900 tracking-tight">{data.displayName}</h1>
              <div className="flex items-center gap-3 mt-1">
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${
                  data.roleKey === "academy_admin" ? "bg-red-100 text-red-700" : "bg-brand-hover text-zinc-900"
                }`}>
                  {data.roleKey === "academy_admin" && <ShieldCheck size={12} weight="fill" />}
                  {data.roleKey}
                </span>
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${
                  data.isActive ? "bg-green-100 text-green-700" : "bg-zinc-100 text-zinc-500"
                }`}>
                  {data.isActive ? <CheckCircle size={12} weight="fill" /> : <XCircle size={12} weight="fill" />}
                  {data.isActive ? "Active" : "Inactive"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Identity Details */}
        <div className="lg:col-span-2 space-y-8">
          <section className="bg-white rounded-[2.5rem] p-8 border border-black/5 shadow-sm">
            <h3 className="text-xs font-black text-zinc-400 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
              <IdentificationCard size={18} weight="bold" className="text-brand" />
              Identity Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-1">
                <label className="block text-[10px] font-black text-zinc-400 uppercase tracking-widest">Email Address</label>
                <div className="flex items-center gap-2 text-zinc-900 font-bold">
                  <Envelope size={16} className="text-zinc-400" />
                  {data.email}
                </div>
              </div>
              <div className="space-y-1">
                <label className="block text-[10px] font-black text-zinc-400 uppercase tracking-widest">Joined Date</label>
                <div className="flex items-center gap-2 text-zinc-900 font-bold">
                  <Calendar size={16} className="text-zinc-400" />
                  {new Date(data.createdAt).toLocaleDateString('en-US', { dateStyle: 'long' })}
                </div>
              </div>
              <div className="space-y-1">
                <label className="block text-[10px] font-black text-zinc-400 uppercase tracking-widest">Total Experience</label>
                <div className="flex items-center gap-2 text-brand font-black">
                  <Sparkle size={16} weight="fill" />
                  {data.totalXp} XP
                </div>
              </div>
              <div className="space-y-1">
                <label className="block text-[10px] font-black text-zinc-400 uppercase tracking-widest">User ID</label>
                <div className="text-[10px] font-mono text-zinc-400 break-all">
                  {data.id}
                </div>
              </div>
            </div>
          </section>

          {/* Profile Specifics */}
          <section className="bg-white rounded-[2.5rem] p-8 border border-black/5 shadow-sm">
            <h3 className="text-xs font-black text-zinc-400 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
              <HardDrive size={18} weight="bold" className="text-brand" />
              Profile Details
            </h3>
            
            {data.roleKey === 'student' && data.profiles?.student ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-1">
                  <label className="block text-[10px] font-black text-zinc-400 uppercase tracking-widest">Referral Code</label>
                  <div className="text-zinc-900 font-bold font-mono">{data.profiles.student.referralCode}</div>
                </div>
                <div className="space-y-1">
                  <label className="block text-[10px] font-black text-zinc-400 uppercase tracking-widest">Onboarding</label>
                  <div className="text-zinc-900 font-bold">
                    {data.profiles.student.isOnboardingCompleted ? "Completed" : "Pending"}
                  </div>
                </div>
              </div>
            ) : data.profiles?.staff ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-1">
                  <label className="block text-[10px] font-black text-zinc-400 uppercase tracking-widest">Position</label>
                  <div className="text-zinc-900 font-bold">{data.profiles.staff.position}</div>
                </div>
                <div className="space-y-1">
                  <label className="block text-[10px] font-black text-zinc-400 uppercase tracking-widest">Department</label>
                  <div className="text-zinc-900 font-bold">{data.profiles.staff.department}</div>
                </div>
              </div>
            ) : (
              <div className="text-zinc-400 text-sm font-medium italic">No extended profile data available for this role.</div>
            )}
          </section>
        </div>

        {/* Sidebar info */}
        <div className="space-y-8">
          <section className="bg-zinc-900 text-white rounded-[2.5rem] p-8 shadow-xl">
            <h3 className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
              <Bell size={18} weight="bold" className="text-brand" />
              Notification Settings
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold">Email Notifications</span>
                {data.notificationSettings?.emailEnabled ? <CheckCircle size={20} weight="fill" className="text-green-400" /> : <XCircle size={20} weight="fill" className="text-zinc-600" />}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold">WhatsApp Alerts</span>
                {data.notificationSettings?.whatsAppEnabled ? <CheckCircle size={20} weight="fill" className="text-green-400" /> : <XCircle size={20} weight="fill" className="text-zinc-600" />}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold">In-App Messages</span>
                {data.notificationSettings?.inAppEnabled ? <CheckCircle size={20} weight="fill" className="text-green-400" /> : <XCircle size={20} weight="fill" className="text-zinc-600" />}
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
