"use client";

import { Folder, Users, Clock, UsersThree, Books } from "@phosphor-icons/react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { getEngineerCourses } from "@/lib/api";
import { motion } from "framer-motion";

export default function EngineerCoursesPage() {
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const data = await getEngineerCourses();
        setCourses(data);
      } catch (error) {
        console.error("Failed to load courses:", error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const getStatusColor = (status?: string) => {
    const statusLower = (status || "").toLowerCase();
    if (statusLower.includes("active")) return "bg-green-100 text-green-700";
    if (statusLower.includes("archived")) return "bg-zinc-100 text-zinc-600";
    return "bg-blue-100 text-blue-700";
  };

  if (loading) {
    return <div className="page-loader"><div className="spinner" /></div>;
  }

  return (
    <div className="w-full px-4 sm:px-8 py-6 sm:py-8 lg:px-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 sm:mb-12">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-display font-black tracking-tight text-zinc-900 leading-tight">
            My Courses
          </h1>
          <div className="text-zinc-500 font-medium">
            {courses.length === 0 ? "You are not assigned to any courses yet." : "Courses you are currently assigned to teach."}
          </div>
        </div>
      </div>

      {courses.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Books size={64} className="text-zinc-300 mb-4" />
          <h3 className="font-display text-2xl font-bold text-zinc-900 mb-2">No courses assigned</h3>
          <p className="text-zinc-500 max-w-md">Once you are assigned to a course, it will appear here.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map((course, idx) => (
            <motion.div
              key={String(course.courseId)}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.08, duration: 0.5, ease: "easeOut" }}
              className="bg-white rounded-[1.5rem] sm:rounded-[3rem] p-6 sm:p-8 shadow-sm border border-black/5 hover:-translate-y-1 transition-transform group"
            >
              <div className="flex justify-between items-start mb-6">
                <div className="w-14 h-14 bg-brand-hover text-zinc-900 rounded-xl sm:rounded-2xl flex items-center justify-center">
                  <Books size={28} weight="fill" />
                </div>
              </div>
              
              <h3 className="font-display text-xl sm:text-2xl font-bold text-zinc-900 mb-1">{course.courseTitle || "Course"}</h3>
              <p className="text-sm font-medium text-zinc-500 mb-6">{course.roundsCount} Round{course.roundsCount !== 1 ? 's' : ''}</p>
              
              <div className="grid grid-cols-3 gap-4 mb-8 border-t border-black/5 pt-6">
                <div>
                  <div className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-1 flex items-center gap-1">
                    <UsersThree size={14} /> Rounds
                  </div>
                  <div className="text-xl font-black text-zinc-900">{course.roundsCount || 0}</div>
                </div>
                <div>
                  <div className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-1 flex items-center gap-1">
                    <Users size={14} /> Students
                  </div>
                  <div className="text-xl font-black text-zinc-900">{course.studentsCount || 0}</div>
                </div>
                <div>
                  <div className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-1 flex items-center gap-1">
                    <Clock size={14} /> Sessions
                  </div>
                  <div className="text-xl font-black text-zinc-900">{course.sessionsCount || 0}</div>
                </div>
              </div>

              <div className="space-y-2 mb-8">
                {course.rounds.map((round: any) => (
                  <div key={String(round.cohortId)} className="flex items-center justify-between bg-zinc-50 rounded-xl p-3">
                    <div className="flex items-center gap-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest ${getStatusColor(round.status)}`}>
                        {round.status}
                      </span>
                      <span className="font-bold text-sm text-zinc-900">{round.cohortName}</span>
                    </div>
                    <span className="text-xs font-bold text-zinc-500">{round.studentsCount} Student{round.studentsCount !== 1 ? 's' : ''}</span>
                  </div>
                ))}
              </div>

              <Link
                href={`/engineer/courses/${course.courseId}`}
                className="w-full py-3 bg-zinc-900 hover:bg-black text-white rounded-xl font-bold text-sm transition-all active:scale-[0.98] flex items-center justify-center"
              >
                View Course
              </Link>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
