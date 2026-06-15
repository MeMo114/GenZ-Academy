"use client";

import { ArrowLeft, Calendar, Clock, Video, FileText, Pencil } from "@phosphor-icons/react";
import Link from "next/link";
import { useEffect, useState, use } from "react";
import { getEngineerWeek, updateEngineerWeek } from "@/lib/api";
import { useParams, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";

export default function SessionDetailPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(searchParams.get('edit') === 'true');
  const [formData, setFormData] = useState<any>({});
  const [submitting, setSubmitting] = useState(false);

  const loadSession = async () => {
    try {
      const data = await getEngineerWeek(params.cohortId as string, params.sessionId as string);
      setSession(data);
      
      // Initialize form data for editing
      const date = data.scheduledAt ? new Date(data.scheduledAt).toISOString().split('T')[0] : '';
      const time = data.scheduledAt ? new Date(data.scheduledAt).toTimeString().slice(0, 5) : '';
      const endTime = data.scheduledAt && data.durationMinutes 
        ? new Date(new Date(data.scheduledAt).getTime() + data.durationMinutes * 60000).toTimeString().slice(0,5) 
        : '';
      
      setFormData({
        sessionTitle: data.weekTitle,
        sessionType: data.sessionType,
        sessionStatus: data.status,
        weekNumber: data.weekNumber,
        sessionDate: date,
        startTime: time,
        endTime: endTime,
        sessionLink: data.sessionLink,
        recordingUrl: data.recordingUrl
      });
    } catch (error) {
      console.error("Failed to load session:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSession();
  }, [params.cohortId, params.sessionId]);

  const handleUpdateSession = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      // Combine date and start time into DateTimeOffset
      let scheduledAt = undefined;
      let durationMinutes = formData.DurationMinutes || session.DurationMinutes || 120;
      
      if (formData.sessionDate && formData.startTime) {
        const [hours, minutes] = formData.startTime.split(':').map(Number);
        const date = new Date(formData.sessionDate);
        date.setHours(hours, minutes, 0, 0);
        scheduledAt = new Date(date).toISOString();
        
        // Calculate duration from start and end time
        if (formData.endTime) {
          const [endHours, endMinutes] = formData.endTime.split(':').map(Number);
          const startTotal = hours * 60 + minutes;
          const endTotal = endHours * 60 + endMinutes;
          durationMinutes = endTotal - startTotal;
          if (durationMinutes < 0) durationMinutes += 24 * 60; // Handle midnight wrap
        }
      }
      
      await updateEngineerWeek(params.cohortId as string, params.sessionId as string, {
        WeekTitle: formData.sessionTitle,
        SessionType: formData.sessionType,
        Status: formData.sessionStatus,
        WeekNumber: formData.weekNumber,
        SessionLink: formData.sessionLink,
        RecordingUrl: formData.recordingUrl,
        ScheduledAt: scheduledAt,
        DurationMinutes: durationMinutes
      });
      
      await loadSession();
      setIsEditing(false);
    } catch (error) {
      console.error("Failed to update session:", error);
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusColor = (status?: string) => {
    const statusLower = (status || "").toLowerCase();
    if (statusLower.includes("active") || statusLower.includes("upcoming")) return "bg-green-100 text-green-700";
    if (statusLower.includes("completed")) return "bg-blue-100 text-blue-700";
    if (statusLower.includes("cancelled")) return "bg-red-100 text-red-700";
    return "bg-zinc-100 text-zinc-700";
  };

  if (loading) {
    return <div className="page-loader"><div className="spinner" /></div>;
  }

  if (!session) {
    return (
      <div className="w-full px-4 sm:px-8 py-6 sm:py-8 lg:px-12">
        <div className="mb-10">
          <Link href={`/engineer/rounds/${params.cohortId}`} className="flex items-center gap-2 text-zinc-500 font-bold mb-4 hover:text-zinc-900 transition-colors">
            <ArrowLeft size={18} />
            <span>Back to Round</span>
          </Link>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-display font-black tracking-tight text-zinc-900 leading-tight mb-2">
            Session Not Found
          </h1>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full px-4 sm:px-8 py-6 sm:py-8 lg:px-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
        <div>
          <Link href={`/engineer/rounds/${params.cohortId}`} className="flex items-center gap-2 text-zinc-500 font-bold mb-2 hover:text-zinc-900 transition-colors">
            <ArrowLeft size={18} />
            <span>Back to Round</span>
          </Link>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-display font-black tracking-tight text-zinc-900 leading-tight mb-2">
            {session.weekTitle}
          </h1>
          <div className="flex items-center gap-3">
            <span className={`px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-widest ${getStatusColor(session.status)}`}>
              {session.status}
            </span>
            <span className="text-zinc-500 font-medium">Week {session.weekNumber}</span>
          </div>
        </div>
        <button
          onClick={() => setIsEditing(!isEditing)}
          className="flex items-center gap-2 px-4 py-2 bg-zinc-900 text-white rounded-lg font-bold text-sm hover:bg-black transition-all"
        >
          <Pencil size={16} weight="bold" />
          {isEditing ? "Cancel" : "Edit Session"}
        </button>
      </div>

      {isEditing ? (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-[1.5rem] sm:rounded-[3rem] p-8 shadow-sm border border-black/5"
        >
          <form onSubmit={handleUpdateSession} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2">Session Title</label>
                <input
                  type="text"
                  value={formData.sessionTitle}
                  onChange={(e) => setFormData({ ...formData, sessionTitle: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-zinc-200 focus:border-zinc-400 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2">Session Type</label>
                <select
                  value={formData.sessionType}
                  onChange={(e) => setFormData({ ...formData, sessionType: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-zinc-200 focus:border-zinc-400 outline-none"
                >
                  <option value="Live">Live</option>
                  <option value="Recorded">Recorded</option>
                  <option value="Workshop">Workshop</option>
                  <option value="OfficeHours">Office Hours</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2">Status</label>
                <select
                  value={formData.sessionStatus}
                  onChange={(e) => setFormData({ ...formData, sessionStatus: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-zinc-200 focus:border-zinc-400 outline-none"
                >
                  <option value="Upcoming">Upcoming</option>
                  <option value="Completed">Completed</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2">Week Number</label>
                <input
                  type="number"
                  value={formData.weekNumber}
                  onChange={(e) => setFormData({ ...formData, weekNumber: parseInt(e.target.value) })}
                  className="w-full px-4 py-3 rounded-xl border border-zinc-200 focus:border-zinc-400 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2">Date</label>
                <input
                  type="date"
                  value={formData.sessionDate}
                  onChange={(e) => setFormData({ ...formData, sessionDate: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-zinc-200 focus:border-zinc-400 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2">Start Time</label>
                <input
                  type="time"
                  value={formData.startTime}
                  onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-zinc-200 focus:border-zinc-400 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2">End Time</label>
                <input
                  type="time"
                  value={formData.endTime}
                  onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-zinc-200 focus:border-zinc-400 outline-none"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2">Session Link</label>
                <input
                  type="url"
                  value={formData.sessionLink || ""}
                  onChange={(e) => setFormData({ ...formData, sessionLink: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-zinc-200 focus:border-zinc-400 outline-none"
                  placeholder="https://zoom.us/j/..."
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2">Recording URL</label>
                <input
                  type="url"
                  value={formData.recordingUrl || ""}
                  onChange={(e) => setFormData({ ...formData, recordingUrl: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-zinc-200 focus:border-zinc-400 outline-none"
                  placeholder="https://drive.google.com/..."
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="px-4 py-2 text-zinc-500 font-bold text-sm hover:text-zinc-900 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-2 bg-zinc-900 text-white rounded-lg font-bold text-sm hover:bg-black transition-all disabled:opacity-50"
              >
                {submitting ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </form>
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-1 lg:grid-cols-3 gap-6"
        >
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-[1.5rem] sm:rounded-[3rem] p-8 shadow-sm border border-black/5">
              <h3 className="text-xl font-bold text-zinc-900 mb-6">Session Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-brand-hover rounded-xl flex items-center justify-center">
                    <Calendar size={20} />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Date</p>
                    <p className="font-bold text-zinc-900">
                      {session.scheduledAt ? new Date(session.scheduledAt).toLocaleDateString() : "Not set"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-brand-hover rounded-xl flex items-center justify-center">
                    <Clock size={20} />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Time</p>
                    <p className="font-bold text-zinc-900">
                      {session.scheduledAt
                        ? `${new Date(session.scheduledAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} - ${new Date(new Date(session.scheduledAt).getTime() + (session.durationMinutes || 120) * 60000).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`
                        : "Not set"}
                    </p>
                  </div>
                </div>
                {session.sessionLink && (
                  <div className="md:col-span-2 flex items-center gap-3">
                    <div className="w-10 h-10 bg-brand-hover rounded-xl flex items-center justify-center">
                      <Video size={20} />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Session Link</p>
                      <a href={session.sessionLink} target="_blank" rel="noopener noreferrer" className="font-bold text-blue-600 hover:text-blue-800">
                        {session.sessionLink}
                      </a>
                    </div>
                  </div>
                )}
                {session.recordingUrl && (
                  <div className="md:col-span-2 flex items-center gap-3">
                    <div className="w-10 h-10 bg-brand-hover rounded-xl flex items-center justify-center">
                      <FileText size={20} />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Recording</p>
                      <a href={session.recordingUrl} target="_blank" rel="noopener noreferrer" className="font-bold text-blue-600 hover:text-blue-800">
                        {session.recordingUrl}
                      </a>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className="space-y-6">
            <div className="bg-white rounded-[1.5rem] sm:rounded-[3rem] p-6 shadow-sm border border-black/5">
              <h4 className="font-bold text-zinc-900 mb-4">Quick Actions</h4>
              <div className="space-y-3">
                {session.sessionLink && (
                  <a
                    href={session.sessionLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 px-4 py-3 bg-brand-hover rounded-xl font-bold text-sm hover:bg-opacity-80 transition-all"
                  >
                    <Video size={18} weight="bold" />
                    Join Session
                  </a>
                )}
                {session.recordingUrl && (
                  <a
                    href={session.recordingUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 px-4 py-3 bg-zinc-100 rounded-xl font-bold text-sm hover:bg-zinc-200 transition-all"
                  >
                    <FileText size={18} weight="bold" />
                    View Recording
                  </a>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
