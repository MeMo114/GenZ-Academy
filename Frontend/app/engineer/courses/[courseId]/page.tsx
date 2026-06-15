"use client";

import { Folder, Users, Clock, ArrowLeft, Books, ArrowRight } from "@phosphor-icons/react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { getEngineerCourses } from "@/lib/api";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";

export default function EngineerCourseDetailPage() {
  const params = useParams();
  const [course, setCourse] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const data = await getEngineerCourses();
        const found = data.find((c: any) => String(c.courseId) === String(params.courseId));
        setCourse(found);
      } catch (error) {
        console.error("Failed to load course:", error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [params.courseId]);

  const getStatusColor = (status?: string) => {
    const statusLower = (status || "").toLowerCase();
    if (statusLower.includes("active")) return "bg-green-100 text-green-700";
    if (statusLower.includes("archived")) return "bg-zinc-100 text-zinc-600";
    return "bg-blue-100 text-blue-700";
  };

  if (loading) {
    return <div className="page-loader"><div className="spinner" /></div>;
  }

  if (!course) {
    return (
      <div className="w-full px-4 sm:px-8 py-6 sm:py-8 lg:px-12">
        <div className="mb-10">
          <Link href="/engineer/courses" className="flex items-center gap-2 text-zinc-500 font-bold mb-4 hover:text-zinc-900 transition-colors">
            <ArrowLeft size={18} />
            <span>Back to Courses</span>
          </Link>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-display font-black tracking-tight text-zinc-900 leading-tight mb-2">
            Course Not Found
          </h1>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full px-4 sm:px-8 py-6 sm:py-8 lg:px-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 sm:mb-12">
        <div className="flex flex-col gap-1">
          <Link href="/engineer/courses" className="flex items-center gap-2 text-zinc-500 font-bold mb-2 hover:text-zinc-900 transition-colors w-fit">
            <ArrowLeft size={18} />
            <span>Back to Courses</span>
          </Link>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-display font-black tracking-tight text-zinc-900 leading-tight">
            {course.courseTitle}
          </h1>
          <p className="text-zinc-500 font-medium">
            {course.roundsCount} Round{course.roundsCount !== 1 ? 's' : ''} • {course.studentsCount} Student{course.studentsCount !== 1 ? 's' : ''} • {course.sessionsCount} Session{course.sessionsCount !== 1 ? 's' : ''}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {course.rounds.map((round: any, idx: number) => (
          <motion.div
            key={String(round.cohortId)}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.08, duration: 0.5, ease: "easeOut" }}
            className="bg-white rounded-[1.5rem] sm:rounded-[3rem] p-6 sm:p-8 shadow-sm border border-black/5 hover:-translate-y-1 transition-transform group"
          >
            <div className="flex justify-between items-start mb-6">
              <div className="w-14 h-14 bg-brand-hover text-zinc-900 rounded-xl sm:rounded-2xl flex items-center justify-center">
                <Books size={28} weight="fill" />
              </div>
              <span className={`px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-widest ${getStatusColor(round.status)}`}>
                {round.status}
              </span>
            </div>
            
            <h3 className="font-display text-xl sm:text-2xl font-bold text-zinc-900 mb-6">{round.cohortName}</h3>
            
            <div className="grid grid-cols-2 gap-4 mb-8 border-t border-black/5 pt-6">
              <div>
                <div className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-1 flex items-center gap-1">
                  <Users size={14} /> Students
                </div>
                <div className="text-xl font-black text-zinc-900">{round.studentsCount}</div>
              </div>
              <div>
                <div className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-1 flex items-center gap-1">
                  <Clock size={14} /> Sessions
                </div>
                <div className="text-xl font-black text-zinc-900">{round.sessionsCount}</div>
              </div>
            </div>

            <Link href={`/engineer/rounds/${round.cohortId}`} className="w-full py-3 bg-zinc-900 hover:bg-black text-white rounded-xl font-bold text-sm transition-all active:scale-[0.98] flex items-center justify-center gap-2">
              <span>Manage Round</span>
              <ArrowRight size={16} weight="bold" />
            </Link>
          </motion.div>
        ))}
      </div>
    </div>
  );
}