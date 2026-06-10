"use client";

import { useState, useEffect } from "react";
import { X, CheckCircle, Student, GraduationCap, CalendarBlank } from "@phosphor-icons/react";
import { getCourses, getAdminRounds, createAdminEnrollment, getAdminUsers } from "@/lib/api";
import { useToast } from "@/lib/toast-context";
import type { Course, CourseRound } from "@/lib/types";

interface ManualEnrollmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialStudentId?: string;
  initialStudentName?: string;
  initialCourseId?: string;
  initialRoundId?: string;
}

export default function ManualEnrollmentModal({
  isOpen,
  onClose,
  onSuccess,
  initialStudentId,
  initialStudentName,
  initialCourseId,
  initialRoundId
}: ManualEnrollmentModalProps) {
  const [loading, setLoading] = useState(false);
  const [courses, setCourses] = useState<Course[]>([]);
  const [rounds, setRounds] = useState<CourseRound[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  
  const [selectedStudentId, setSelectedStudentId] = useState(initialStudentId || "");
  const [selectedCourseId, setSelectedCourseId] = useState(initialCourseId || "");
  const [selectedRoundId, setSelectedRoundId] = useState(initialRoundId || "");
  
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      Promise.all([
        getCourses(),
        !initialStudentId ? getAdminUsers("student") : Promise.resolve([])
      ]).then(([coursesData, studentsData]) => {
        setCourses(coursesData);
        if (!initialStudentId) setStudents(studentsData);
      }).finally(() => setLoading(false));
    }
  }, [isOpen, initialStudentId]);

  useEffect(() => {
    if (isOpen) {
        setSelectedStudentId(initialStudentId || "");
        setSelectedCourseId(initialCourseId || "");
        setSelectedRoundId(initialRoundId || "");
    }
  }, [isOpen, initialStudentId, initialCourseId, initialRoundId]);

  useEffect(() => {
    if (selectedCourseId) {
      getAdminRounds(selectedCourseId).then(setRounds).catch(() => setRounds([]));
    } else {
      setRounds([]);
    }
  }, [selectedCourseId]);

  const handleEnroll = async () => {
    if (!selectedStudentId || !selectedCourseId || !selectedRoundId) {
      toast("Please select all required fields", "error");
      return;
    }

    setLoading(true);
    try {
      await createAdminEnrollment({
        studentUserId: selectedStudentId,
        courseId: selectedCourseId,
        courseRoundId: selectedRoundId
      });
      toast("Student enrolled successfully!", "success");
      onSuccess();
      onClose();
    } catch (err: any) {
      toast(err.message || "Enrollment failed", "error");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-[2.5rem] w-full max-w-lg shadow-2xl border border-black/5 overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="p-6 sm:p-8 border-b border-black/5 flex justify-between items-center bg-zinc-50/50">
          <div>
            <h2 className="text-xl font-display font-black text-zinc-900">Manual Enrollment</h2>
            <p className="text-xs text-zinc-500 font-medium mt-1 uppercase tracking-widest">Phase 1 Launch Workflow</p>
          </div>
          <button onClick={onClose} className="w-10 h-10 rounded-full hover:bg-zinc-200 flex items-center justify-center transition-colors">
            <X size={20} weight="bold" />
          </button>
        </div>

        <div className="p-6 sm:p-8 space-y-6">
          {/* Student Selection */}
          <div className="space-y-2">
            <label className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] ml-1 flex items-center gap-2">
              <Student size={14} weight="bold" className="text-brand" />
              Student
            </label>
            {initialStudentId ? (
              <div className="px-5 py-4 bg-zinc-50 border border-black/5 rounded-2xl font-bold text-zinc-900 flex items-center gap-3">
                 <div className="w-8 h-8 rounded-lg bg-zinc-200 flex items-center justify-center text-zinc-500 text-xs">
                    {initialStudentName?.charAt(0).toUpperCase()}
                 </div>
                 {initialStudentName}
              </div>
            ) : (
              <select 
                value={selectedStudentId}
                onChange={(e) => setSelectedStudentId(e.target.value)}
                className="w-full px-5 py-4 bg-zinc-50 border border-black/5 rounded-2xl font-bold text-sm focus:outline-none focus:ring-2 focus:ring-brand/20 transition-all appearance-none"
              >
                <option value="">Select Student...</option>
                {students.map(s => (
                  <option key={s.id} value={s.id}>{s.displayName} ({s.email})</option>
                ))}
              </select>
            )}
          </div>

          {/* Course Selection */}
          <div className="space-y-2">
            <label className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] ml-1 flex items-center gap-2">
              <GraduationCap size={14} weight="bold" className="text-brand" />
              Course
            </label>
            {initialCourseId ? (
              <div className="px-5 py-4 bg-zinc-50 border border-black/5 rounded-2xl font-bold text-zinc-900">
                {courses.find(c => c.id === initialCourseId)?.title || "Selected Course"}
              </div>
            ) : (
              <select 
                value={selectedCourseId}
                onChange={(e) => setSelectedCourseId(e.target.value)}
                className="w-full px-5 py-4 bg-zinc-50 border border-black/5 rounded-2xl font-bold text-sm focus:outline-none focus:ring-2 focus:ring-brand/20 transition-all appearance-none"
              >
                <option value="">Select Course...</option>
                {courses.map(c => (
                  <option key={c.id} value={c.id}>{c.title}</option>
                ))}
              </select>
            )}
          </div>

          {/* Round Selection */}
          <div className="space-y-2">
            <label className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] ml-1 flex items-center gap-2">
              <CalendarBlank size={14} weight="bold" className="text-brand" />
              Course Round
            </label>
            <select 
              value={selectedRoundId}
              onChange={(e) => setSelectedRoundId(e.target.value)}
              disabled={!selectedCourseId || rounds.length === 0}
              className="w-full px-5 py-4 bg-zinc-50 border border-black/5 rounded-2xl font-bold text-sm focus:outline-none focus:ring-2 focus:ring-brand/20 transition-all appearance-none disabled:opacity-50"
            >
              <option value="">{selectedCourseId ? (rounds.length > 0 ? "Select Round..." : "No rounds available") : "Select a course first"}</option>
              {rounds.map(r => (
                <option key={r.id} value={r.id}>{r.name} ({r.currentStudents}/{r.maxStudents})</option>
              ))}
            </select>
          </div>
        </div>

        <div className="p-6 sm:p-8 bg-zinc-50/50 border-t border-black/5 flex gap-3">
          <button 
            onClick={onClose}
            className="flex-1 px-6 py-4 bg-white border border-black/10 rounded-2xl font-bold text-sm text-zinc-600 hover:bg-zinc-100 transition-all"
          >
            Cancel
          </button>
          <button 
            onClick={handleEnroll}
            disabled={loading || !selectedStudentId || !selectedCourseId || !selectedRoundId}
            className="flex-[2] px-6 py-4 bg-zinc-900 text-white rounded-2xl font-bold text-sm hover:bg-black transition-all flex items-center justify-center gap-2 shadow-xl shadow-zinc-900/10 disabled:opacity-50"
          >
            {loading ? "Processing..." : (
              <>
                <CheckCircle size={18} weight="bold" />
                Confirm Enrollment
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
