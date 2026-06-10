"use client";

import { AdminCourse } from "@/lib/types";
import { CourseIcon } from "@/components/IconMapper";
import { PencilSimple, CheckCircle, Archive, Trash, ArrowRight } from "@phosphor-icons/react";
import { useRouter } from "next/navigation";
import { updateAdminCourse } from "@/lib/api";
import { useToast } from "@/lib/toast-context";

interface CourseCardProps {
  course: AdminCourse;
  onEdit: (course: AdminCourse) => void;
  onPretest: (course: AdminCourse) => void;
  onDelete: (id: string) => void;
  onRefresh: () => void;
}

export function CourseCard({ course, onEdit, onPretest, onDelete, onRefresh }: CourseCardProps) {
  const router = useRouter();
  const { toast } = useToast();

  const handleToggleActive = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const next = !course.isActive;
    try {
      await updateAdminCourse(course.id, { ...course, isActive: next });
      toast(`Course ${next ? 'Published' : 'Unpublished'}`, "success");
      onRefresh();
    } catch (err: any) {
      toast(err.message, "error");
    }
  };

  const handleRestore = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Restore this course?")) return;
    try {
      await updateAdminCourse(course.id, { ...course, isDeleted: false });
      toast("Restored", "success");
      onRefresh();
    } catch (err: any) {
      toast(err.message, "error");
    }
  };

  return (
    <div className={`group bg-white rounded-[2.5rem] p-6 border border-black/[0.03] shadow-[0_20px_50px_rgba(0,0,0,0.04)] hover:shadow-[0_40px_80px_rgba(0,0,0,0.08)] transition-all duration-700 flex flex-col relative overflow-hidden ${course.isDeleted ? 'opacity-70 grayscale-[0.3]' : ''}`}>
      {/* Background Decorative Element */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-red-500/5 to-transparent rounded-bl-[100px] -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-1000" />
      
      {course.isDeleted && (
        <div className="absolute top-8 right-8 z-20 px-4 py-1.5 bg-zinc-900/90 backdrop-blur-md text-white text-[9px] font-black uppercase tracking-[0.2em] rounded-full shadow-xl border border-white/10">
          Archived
        </div>
      )}
      
      <div className="aspect-[16/10] rounded-[2rem] overflow-hidden mb-8 relative bg-zinc-50 shadow-inner group-hover:shadow-2xl transition-all duration-700">
        {course.coverImageUrl || course.imageUrl ? (
          <>
            <img src={course.coverImageUrl || course.imageUrl} alt={course.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000 ease-out" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          </>
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-[#1a1a1a] to-[#0a0a0a] flex flex-col items-center justify-center p-8 text-center">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,26,26,0.05)_0,transparent_70%)]" />
            <div className="w-20 h-20 rounded-[2rem] bg-white/5 backdrop-blur-xl border border-white/10 flex items-center justify-center text-red-500 mb-5 relative z-10 shadow-2xl group-hover:scale-110 group-hover:rotate-6 transition-all duration-700">
              <CourseIcon iconName={course.iconName} className="drop-shadow-[0_0_12px_rgba(255,26,26,0.4)]" size={40} />
            </div>
            <div className="text-[9px] font-black uppercase tracking-[0.4em] text-white/40 relative z-10">
              EL SEWEDY GENZ ACADEMY
            </div>
          </div>
        )}
      </div>

      <div className="flex-1 px-2 relative z-10">
        <div className="flex justify-between items-start mb-3">
          <h3 className="font-display text-2xl font-black text-zinc-900 leading-tight group-hover:text-red-600 transition-colors duration-300">{course.title}</h3>
          <button 
            onClick={handleToggleActive}
            className={`px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest transition-all flex items-center gap-2 border shadow-sm ${
              course.isActive 
                ? 'bg-emerald-50 text-emerald-600 border-emerald-100' 
                : 'bg-zinc-50 text-zinc-400 border-zinc-100'
            }`}
          >
            <div className={`w-1.5 h-1.5 rounded-full ${course.isActive ? 'bg-emerald-500 animate-pulse' : 'bg-zinc-300'}`} />
            {course.isActive ? 'Live' : 'Draft'}
          </button>
        </div>
        
        <p className="text-xs font-bold text-zinc-400 mb-6 flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
          {course.subtitle || course.slug}
        </p>
        
        <div className="flex flex-wrap gap-2 mb-8">
          <span className="px-3.5 py-1.5 bg-zinc-50 text-zinc-600 border border-black/[0.03] rounded-xl text-[9px] font-black uppercase tracking-widest">{course.level}</span>
          <span className="px-3.5 py-1.5 bg-red-50 text-red-600 border border-red-100/50 rounded-xl text-[9px] font-black uppercase tracking-widest">Phase {course.phase}</span>
          <span className="px-3.5 py-1.5 bg-blue-50 text-blue-600 border border-blue-100/50 rounded-xl text-[9px] font-black uppercase tracking-widest">Age {course.minimumAge}-{course.maximumAge}</span>
        </div>

        <div className="bg-zinc-50/50 rounded-[1.5rem] border border-black/[0.02] p-5 mb-8 grid grid-cols-2 gap-4">
          <div className="border-r border-black/5">
            <div className="text-[9px] font-black text-zinc-400 uppercase tracking-widest mb-1.5">Investment</div>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-display font-black text-zinc-900 leading-none">{course.priceEgp}</span>
              <span className="text-[10px] font-black text-zinc-500 uppercase">EGP</span>
            </div>
          </div>
          <div className="pl-2">
            <div className="text-[9px] font-black text-zinc-400 uppercase tracking-widest mb-1.5">Curriculum</div>
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-black text-zinc-700">{course.sessionsCount || (course.coreSessions + (course.supportSessions || 0))} Sessions</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <button 
            onClick={(e) => { e.stopPropagation(); onEdit(course); }}
            className="h-12 bg-white hover:bg-zinc-50 text-zinc-900 rounded-2xl flex items-center justify-center border border-black/[0.08] transition-all active:scale-95 group/btn shadow-sm"
          >
            <PencilSimple size={18} weight="bold" className="group-hover/btn:rotate-12 transition-transform text-zinc-500" />
            <span className="ml-2 text-[10px] font-black uppercase tracking-wider">Edit Details</span>
          </button>
          
          <button 
            onClick={(e) => { e.stopPropagation(); onPretest(course); }}
            className="h-12 bg-white hover:bg-zinc-50 text-zinc-900 rounded-2xl flex items-center justify-center border border-black/[0.08] transition-all active:scale-95 group/btn shadow-sm"
          >
            <CheckCircle size={18} weight="bold" className="group-hover/btn:scale-110 transition-transform text-zinc-500" />
            <span className="ml-2 text-[10px] font-black uppercase tracking-wider">Screening</span>
          </button>

          {course.isDeleted ? (
            <button 
              onClick={handleRestore}
              className="h-12 bg-emerald-50 hover:bg-emerald-500 hover:text-white text-emerald-600 rounded-2xl flex items-center justify-center border border-emerald-100 transition-all active:scale-95 shadow-sm col-span-1"
            >
              <Archive size={18} weight="bold" className="mr-2" />
              <span className="text-[10px] font-black uppercase tracking-wider">Restore</span>
            </button>
          ) : (
            <button 
              onClick={(e) => { e.stopPropagation(); onDelete(course.id); }}
              className="h-12 bg-zinc-50 hover:bg-red-50 text-zinc-400 hover:text-red-500 rounded-2xl flex items-center justify-center border border-black/[0.03] transition-all active:scale-95 group/btn col-span-1"
            >
              <Trash size={18} weight="bold" className="group-hover/btn:shake transition-transform mr-2" />
              <span className="text-[10px] font-black uppercase tracking-wider">Archive</span>
            </button>
          )}

          <button
            onClick={(e) => {
              e.stopPropagation();
              router.push(`/admin/courses/${course.slug || course.id}`);
            }}
            className="h-12 bg-zinc-900 text-white hover:bg-red-600 rounded-2xl flex items-center justify-center transition-all duration-500 active:scale-95 shadow-lg group/view col-span-1"
          >
            <span className="mr-2 text-[10px] font-black uppercase tracking-wider">Manage Rounds</span>
            <ArrowRight size={18} weight="bold" className="group-hover/view:translate-x-1 transition-transform" />
          </button>
        </div>
      </div>
    </div>
  );
}
