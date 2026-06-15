"use client";

import { Calendar, Clock, VideoCamera, Users, CheckCircle, XCircle, Plus, Trash } from "@phosphor-icons/react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { getEngineerSessions, deleteEngineerWeek } from "@/lib/api";
import { motion } from "framer-motion";

export default function EngineerSessionsPage() {
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingSessionId, setDeletingSessionId] = useState<string | null>(null);
  const [deletingCohortId, setDeletingCohortId] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const res = await getEngineerSessions();
      setSessions(res || []);
    } catch (error) {
      console.error("Failed to load sessions:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSession = async () => {
    if (!deletingSessionId || !deletingCohortId) return;
    setSubmitting(true);
    try {
      await deleteEngineerWeek(deletingCohortId, deletingSessionId);
      await loadData();
      setShowDeleteConfirm(false);
      setDeletingSessionId(null);
      setDeletingCohortId(null);
    } catch (error) {
      console.error("Failed to delete session:", error);
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

  return (
    <div className="w-full px-6 lg:px-12 pt-6 pb-24">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10">
        <div>
          <h1 className="font-display text-4xl font-black text-zinc-900 tracking-tight mb-2">Manage Sessions</h1>
          <p className="text-zinc-500 font-medium">Your upcoming teaching schedule and room access.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full text-zinc-500 font-bold">Loading sessions...</div>
        ) : sessions.length > 0 ? (
          sessions.map((session) => (
            <div key={session.id} className="bg-white rounded-[1.5rem] sm:rounded-[3rem] p-6 shadow-sm border border-black/5 hover:shadow-md transition-shadow flex flex-col">
              <div className="flex justify-between items-start mb-4">
                <h4 className="font-bold text-zinc-900">{session.weekTitle || session.title}</h4>
                <span className={`px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-widest ${getStatusColor(session.status)}`}>
                  {session.status}
                </span>
              </div>
              
              <div className="space-y-3 mb-6">
                <div className="flex items-center gap-2 text-sm text-zinc-600">
                  <Calendar size={16} className="text-zinc-400" />
                  <span>Week {session.weekNumber} • {session.group}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-zinc-600">
                  <Clock size={16} className="text-zinc-400" />
                  <span>{session.date} • {session.time}</span>
                </div>
                {session.instructorName && (
                  <div className="flex items-center gap-2 text-sm text-zinc-600">
                    <Users size={16} className="text-zinc-400" />
                    <span>Instructor: {session.instructorName}</span>
                  </div>
                )}
                {session.students > 0 && (
                  <div className="flex items-center gap-2 text-sm text-zinc-600">
                    <Users size={16} className="text-zinc-400" />
                    <span>{session.students} students</span>
                  </div>
                )}
                {session.sessionLink && (
                  <div className="flex items-center gap-2 text-sm">
                    <VideoCamera size={16} className="text-zinc-400" />
                    <a 
                      href={session.sessionLink} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="text-blue-600 hover:text-blue-800 font-medium truncate"
                    >
                      Join Session
                    </a>
                  </div>
                )}
              </div>
              
              <div className="mt-auto pt-4 border-t border-zinc-100 flex flex-col gap-2">
                {session.zoomStartUrl && (
                  <a 
                    href={session.zoomStartUrl} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="w-full py-3 bg-brand hover:bg-brand-hover text-white rounded-xl font-bold text-sm transition-all active:scale-[0.98] flex items-center justify-center gap-2 shadow-md shadow-brand/30"
                  >
                    <VideoCamera size={18} weight="fill" />
                    Start Live Zoom
                  </a>
                )}
                {session.cohortId && session.sessionId && (
                  <Link 
                    href={`/engineer/rounds/${session.cohortId}/sessions/${session.sessionId}`} 
                    className="w-full py-3 bg-zinc-100 hover:bg-zinc-200 text-zinc-900 rounded-xl font-bold text-sm transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                  >
                    View Details
                  </Link>
                )}
                {session.cohortId && session.sessionId && (
                  <button
                    onClick={() => {
                      setDeletingSessionId(session.sessionId);
                      setDeletingCohortId(session.cohortId);
                      setShowDeleteConfirm(true);
                    }}
                    className="w-full py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl font-bold text-sm transition-all text-center flex items-center justify-center gap-2"
                  >
                    <Trash size={16} weight="bold" />
                    Delete
                  </button>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full text-zinc-500 font-medium">No sessions scheduled at this time.</div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-[2rem] p-8 max-w-md w-full mx-4 shadow-2xl"
          >
            <h3 className="text-xl font-bold text-zinc-900 mb-4">Delete Session</h3>
            <p className="text-zinc-600 mb-6">
              Are you sure you want to delete this session? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setDeletingSessionId(null);
                  setDeletingCohortId(null);
                }}
                disabled={submitting}
                className="px-4 py-2 text-zinc-500 font-bold text-sm hover:text-zinc-900 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteSession}
                disabled={submitting}
                className="px-6 py-2 bg-red-600 text-white rounded-xl font-bold text-sm hover:bg-red-700 transition-all disabled:opacity-50 flex items-center gap-2"
              >
                {submitting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
