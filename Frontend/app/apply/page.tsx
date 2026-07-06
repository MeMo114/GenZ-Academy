"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { getCourseBySlug, startApplication, getUserApplications } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/lib/toast-context";
import type { Course, CourseApplication } from "@/lib/types";
import { Sparkle, CheckCircle, Warning, ArrowLeft } from "@phosphor-icons/react";
import Link from "next/link";
import Image from "next/image";

const imageFor = (seed: string, width = 1200, height = 400) => `https://picsum.photos/seed/${seed}/${width}/${height}`;

export default function ApplicationWorkflowPage() {
  const searchParams = useSearchParams();
  const slug = searchParams.get("course");
  const router = useRouter();
  const { user } = useAuth();
  const { toast } = useToast();

  const [course, setCourse] = useState<Course | null>(null);
  const [existingApplication, setExistingApplication] = useState<CourseApplication | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!slug || !user) {
      setLoading(false);
      return;
    }
    Promise.all([
      getCourseBySlug(slug),
      getUserApplications()
    ]).then(([c, apps]) => {
      setCourse(c);
      if (c) {
        const app = apps.find(a => a.courseId === c.id);
        setExistingApplication(app || null);
      }
      setLoading(false);
    });
  }, [slug, user]);

  if (!user) {
    return (
      <div className="w-full min-h-[100dvh] flex items-center justify-center bg-canvas-soft px-6 font-body">
        <div className="bg-white rounded-[2rem] p-12 max-w-lg w-full text-center shadow-xl border border-black/5">
          <div className="w-16 h-16 bg-zinc-100 text-zinc-900 rounded-full flex items-center justify-center mx-auto mb-6">
             <Warning size={32} weight="duotone" />
          </div>
          <h2 className="font-display text-2xl font-bold mb-4">Authentication Required</h2>
          <p className="text-zinc-500 mb-8">You need to be logged in to apply for a course.</p>
          <Link href={`/auth?returnUrl=/apply?course=${slug}`} className="bg-ink text-canvas px-8 py-4 rounded-full font-bold shadow-md hover:bg-zinc-800 transition-colors inline-block w-full">
            Sign In to Apply
          </Link>
        </div>
      </div>
    );
  }

  if (loading) return (
    <div className="w-full min-h-[100dvh] flex items-center justify-center bg-canvas-soft">
      <div className="w-8 h-8 border-4 border-black/10 border-t-zinc-900 rounded-full animate-spin"></div>
    </div>
  );

  if (!course) {
    return (
      <div className="w-full min-h-[100dvh] flex items-center justify-center bg-canvas-soft px-6 font-body">
        <div className="bg-white rounded-[2rem] p-12 max-w-lg w-full text-center shadow-xl border border-black/5">
          <Warning size={64} weight="duotone" className="text-ember mx-auto mb-6" />
          <h1 className="font-display text-3xl font-bold mb-4">Course Missing</h1>
          <p className="text-zinc-500 mb-8">The requested course track could not be found in our directory.</p>
          <Link href="/courses" className="bg-ink text-canvas px-8 py-4 rounded-full font-bold shadow-md hover:bg-zinc-800 transition-colors inline-block">
            Browse Active Tracks
          </Link>
        </div>
      </div>
    );
  }

  // If there's an existing application, redirect to applications page
  if (existingApplication) {
    router.push("/applications");
    return null;
  }

  const handleStartApplication = async () => {
    setSubmitting(true);
    try {
      await startApplication(course.id);
      toast("Application started successfully!", "success");
      router.push("/applications");
    } catch (e: any) {
      toast(e.message || "Failed to start application", "error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="w-full min-h-[100dvh] bg-canvas-soft text-zinc-900 font-body relative overflow-x-hidden">
      
      {/* Header Banner */}
      <div className="w-full h-[300px] bg-zinc-950 relative overflow-hidden flex items-end pb-12">
         <Image 
           src={imageFor(`course-${course.slug}`)}
           alt={course.title}
           fill
           className="object-cover opacity-30 mix-blend-overlay"
         />
         <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/50 to-transparent"></div>
         <div className="w-full max-w-[1000px] mx-auto px-6 lg:px-12 relative z-10">
            <Link href={`/courses/${course.slug}`} className="inline-flex items-center gap-2 text-sm font-bold text-zinc-400 hover:text-white transition-colors mb-6">
              <ArrowLeft size={16} weight="bold" /> Back to Course
            </Link>
            <h1 className="font-display text-4xl lg:text-5xl font-black text-white tracking-tight mb-2">
              Apply to {course.title}
            </h1>
            <p className="text-zinc-400 text-lg">Start your application process for this course.</p>
         </div>
      </div>

      <div className="w-full max-w-[1000px] mx-auto px-6 lg:px-12 py-12 -mt-16 relative z-20">
         
         <div className="bg-white rounded-[2.5rem] p-8 lg:p-12 shadow-2xl border border-black/5 flex flex-col gap-10">
           
           <div className="text-center py-16">
             <div className="w-20 h-20 bg-mint/10 rounded-full flex items-center justify-center mx-auto mb-6">
               <CheckCircle size={40} className="text-mint" weight="duotone" />
             </div>
             <h3 className="font-display text-2xl font-bold mb-2">Ready to Apply?</h3>
             <p className="text-zinc-500 mb-8 max-w-sm mx-auto">Click below to start your application journey for {course.title}.</p>

             <div className="pt-8 border-t border-black/5 mt-4 flex items-center justify-center">
                <button 
                  onClick={handleStartApplication} 
                  disabled={submitting}
                  className="bg-[#ff1a1a] text-white px-10 py-5 rounded-full font-bold shadow-[0_8px_20px_-6px_rgba(249,100,77,0.5)] hover:bg-[#cc0000] hover:-translate-y-0.5 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {submitting ? "Starting Application..." : "Start Application"}
                </button>
             </div>
           </div>
         </div>
      </div>
    </div>
  );
}
