"use client";

import { useAuth } from "@/lib/auth-context";
import { UsersThree, ClipboardText, CalendarCheck, Sparkle, VideoCamera, GraduationCap } from "@phosphor-icons/react";
import Link from "next/link";
import { useState, useEffect } from "react";
import { getEngineerDashboard } from "@/lib/api";
import { motion } from "framer-motion";

export default function EngineerDashboardOverview() {
  const { user } = useAuth();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getEngineerDashboard().then((res) => {
      setData(res);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return <div className="page-loader"><div className="spinner" /></div>;
  }

  const kpis = [
    { label: "Active Students", value: data?.activeStudents ?? 0, icon: UsersThree, color: "text-[#0284c7]", bg: "bg-[#c2f0ff]" },
    { label: "Upcoming Sessions", value: data?.upcomingSessions?.length ?? 0, icon: CalendarCheck, color: "text-[#7c3aed]", bg: "bg-[#e4d3ff]" },
    { label: "Pending Evaluations", value: data?.pendingEvaluations ?? 0, icon: ClipboardText, color: "text-[#e11d48]", bg: "bg-[#ffd5dc]" },
  ];

  return (
    <div className="w-full px-4 sm:px-8 py-6 sm:py-8 lg:px-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 sm:mb-12">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-display font-black tracking-tight text-zinc-900 leading-tight">
            Engineer Workspace
          </h1>
          <div className="flex items-center gap-2 text-zinc-500 font-bold text-xs uppercase tracking-widest">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
            Welcome, {user?.displayName?.split(" ")[0] || "Engineer"}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
        {kpis.map((kpi, idx) => (
          <motion.div
            key={kpi.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.08, duration: 0.5, ease: "easeOut" }}
            className={`${kpi.bg} rounded-[1.5rem] sm:rounded-[2.5rem] p-5 sm:p-8 shadow-sm border border-black/5 relative overflow-hidden group hover:shadow-md transition-shadow hover:-translate-y-1`}
          >
            <div className="relative z-10">
              <div className="flex justify-between items-start mb-4 sm:mb-6">
                <div className={`${kpi.color} bg-white/40 p-2.5 sm:p-3 rounded-xl sm:rounded-2xl`}>
                  <kpi.icon size={24} weight="fill" />
                </div>
              </div>
              <div className="flex flex-col">
                <span className="text-2xl sm:text-4xl font-black text-zinc-900 mb-1">{kpi.value}</span>
                <span className="text-xs font-bold text-zinc-600 uppercase tracking-widest">{kpi.label}</span>
              </div>
            </div>
            <div className="absolute top-[-10%] right-[-10%] w-32 h-32 bg-white/20 rounded-full blur-2xl group-hover:scale-125 transition-transform duration-700"></div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_420px] gap-6 sm:gap-8">
        <div className="bg-white rounded-[1.5rem] sm:rounded-[3rem] p-4 sm:p-8 lg:p-10 shadow-sm border border-black/5">
          <div className="flex justify-between items-center mb-4 sm:mb-10">
            <h3 className="text-xl sm:text-2xl font-display font-bold text-zinc-900 flex items-center gap-3">
              <CalendarCheck size={24} weight="fill" className="text-zinc-700" />
              Today's Schedule
            </h3>
            <Link href="/engineer/sessions" className="text-zinc-500 text-sm font-bold hover:text-zinc-900 flex items-center gap-1">
              View All Sessions
            </Link>
          </div>
          {data?.upcomingSessions?.length > 0 ? (
            <div className="space-y-4">
              {data.upcomingSessions.map((session: any, idx: number) => (
                <div key={idx} className="p-4 sm:p-6 bg-zinc-50 border border-black/5 rounded-2xl sm:rounded-[1.5rem] flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-white transition-colors">
                  <div className="min-w-0">
                    <div className="font-bold text-zinc-900 text-sm sm:text-base truncate">{session.title}</div>
                    <div className="text-xs text-zinc-500 font-medium">{session.time} • {session.group}</div>
                  </div>
                  <div className="flex items-center gap-2 self-start sm:self-center">
                    {session.zoomStartUrl ? (
                      <a 
                        href={session.zoomStartUrl} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="px-4 py-2 bg-brand hover:bg-brand-hover text-white rounded-xl text-xs font-bold transition-all active:scale-[0.98] flex items-center gap-1"
                      >
                        <VideoCamera size={14} weight="fill" /> Start Zoom
                      </a>
                    ) : (
                      <span className="px-3 py-1.5 bg-zinc-100 text-zinc-400 rounded-lg text-[10px] font-bold">Zoom Link Pending</span>
                    )}
                    <Link 
                      href="/engineer/sessions" 
                      className="px-4 py-2 bg-zinc-900 hover:bg-black text-white rounded-xl text-xs font-bold transition-colors"
                    >
                      Manage
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-16 text-center">
              <CalendarCheck size={48} className="text-zinc-300 mx-auto mb-3" />
              <p className="text-zinc-500 font-medium">No sessions scheduled for today.</p>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-8">
          <div className="bg-ink rounded-[1.5rem] sm:rounded-[3rem] p-6 sm:p-10 text-white relative overflow-hidden shadow-xl">
            <div className="relative z-10">
              <h3 className="text-xl sm:text-2xl font-display font-black mb-6 sm:mb-8 flex items-center gap-3">
                Action Needed <Sparkle size={24} weight="fill" className="text-brand" />
              </h3>
              <div className="space-y-4 mb-8">
                {data?.pendingEvaluations ?? 0 > 0 ? (
                  <div className="bg-white/5 hover:bg-white/10 p-5 rounded-[2rem] border border-white/5 transition-colors group">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-bold text-sm text-white group-hover:text-brand transition-colors">
                          Pending Evaluations
                        </div>
                        <div className="text-xs font-medium text-zinc-400">
                          {data?.pendingEvaluations ?? 0} assignments to grade
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-zinc-500 py-10 text-center border-2 border-dashed border-white/10 rounded-[2rem]">
                    <GraduationCap size={32} weight="fill" className="mx-auto mb-2 opacity-20" />
                    <p className="text-sm font-bold">All caught up!</p>
                  </div>
                )}
              </div>
              <Link href="/engineer/progress" className="w-full py-4 bg-brand-hover hover:bg-brand-neutral text-zinc-900 rounded-2xl font-bold text-sm text-center transition-all block active:scale-[0.98]">
                Grade Assignments
              </Link>
            </div>
            <div className="absolute bottom-[-20%] left-[-20%] w-60 h-60 bg-brand rounded-full blur-[100px] opacity-20"></div>
          </div>
        </div>
      </div>
    </div>
  );
}
