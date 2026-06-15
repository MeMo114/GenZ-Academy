"use client";

import { ArrowLeft, ArrowRight, Books, Calendar, Users, Clock, Trophy, FileText, Plus, CheckCircle, Pencil, VideoCamera, Trash } from "@phosphor-icons/react";
import Link from "next/link";
import { useEffect, useState } from "react";
import {
  getEngineerCohortDetail,
  createEngineerWeek,
  createEngineerMaterial,
  createEngineerTask,
  deleteEngineerWeek,
  updateEngineerMaterial,
  deleteEngineerMaterial,
  updateEngineerTask,
  deleteEngineerTask,
} from "@/lib/api";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";

type TabType = "overview" | "students" | "sessions" | "materials" | "tasks" | "progress";

export default function EngineerRoundDetailPage() {
  const params = useParams();
  const [round, setRound] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>("overview");
  const [showAddSession, setShowAddSession] = useState(false);
  const [showAddMaterial, setShowAddMaterial] = useState(false);
  const [showAddTask, setShowAddTask] = useState(false);
  const [formData, setFormData] = useState<any>({});
  const [submitting, setSubmitting] = useState(false);
  const [deletingSessionId, setDeletingSessionId] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<any>(null);
  const [editMaterialFormData, setEditMaterialFormData] = useState<any>({});
  const [deletingMaterialId, setDeletingMaterialId] = useState<string | null>(null);
  const [showMaterialDeleteConfirm, setShowMaterialDeleteConfirm] = useState(false);
  const [editingTask, setEditingTask] = useState<any>(null);
  const [editTaskFormData, setEditTaskFormData] = useState<any>({});
  const [deletingTaskId, setDeletingTaskId] = useState<string | null>(null);
  const [showTaskDeleteConfirm, setShowTaskDeleteConfirm] = useState(false);

  const loadData = async () => {
    try {
      const data = await getEngineerCohortDetail(params.cohortId as string);
      setRound(data);
    } catch (error) {
      console.error("Failed to load round:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSession = async () => {
    if (!deletingSessionId) return;
    setSubmitting(true);
    try {
      await deleteEngineerWeek(params.cohortId as string, deletingSessionId);
      await loadData();
      setShowDeleteConfirm(false);
      setDeletingSessionId(null);
    } catch (error) {
      console.error("Failed to delete session:", error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditMaterialClick = (material: any) => {
    setEditingMaterial(material);
    setEditMaterialFormData({
      title: material.title,
      url: material.url,
      description: material.description || "",
      materialType: material.materialType,
      isDownloadable: material.isDownloadable,
      isPublished: true
    });
  };

  const handleEditMaterialSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMaterial) return;
    setSubmitting(true);
    try {
      await updateEngineerMaterial(editingMaterial.id, editMaterialFormData);
      await loadData();
      setEditingMaterial(null);
    } catch (error) {
      console.error("Failed to update material:", error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteMaterial = async () => {
    if (!deletingMaterialId) return;
    setSubmitting(true);
    try {
      await deleteEngineerMaterial(deletingMaterialId);
      await loadData();
      setShowMaterialDeleteConfirm(false);
      setDeletingMaterialId(null);
    } catch (error) {
      console.error("Failed to delete material:", error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditTaskClick = (task: any) => {
    setEditingTask(task);
    setEditTaskFormData({
      title: task.title,
      description: task.description,
      instructions: task.instructions,
      taskType: task.taskType,
      submissionType: task.submissionType,
      maxScore: task.maxScore,
      xpReward: task.xpReward,
      dueHoursAfterSession: task.dueHoursAfterSession,
      rubricJson: task.rubricJson
    });
  };

  const handleEditTaskSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTask) return;
    setSubmitting(true);
    try {
      await updateEngineerTask(editingTask.id, editTaskFormData);
      await loadData();
      setEditingTask(null);
    } catch (error) {
      console.error("Failed to update task:", error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteTask = async () => {
    if (!deletingTaskId) return;
    setSubmitting(true);
    try {
      await deleteEngineerTask(deletingTaskId);
      await loadData();
      setShowTaskDeleteConfirm(false);
      setDeletingTaskId(null);
    } catch (error) {
      console.error("Failed to delete task:", error);
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [params.cohortId]);

  const handleAddSession = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      // Combine date and start time into DateTimeOffset
      let scheduledAt = undefined;
      let durationMinutes = 120;
      
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
      
      await createEngineerWeek(params.cohortId as string, {
        WeekTitle: formData.sessionTitle,
        SessionType: formData.sessionType || "Live",
        Status: formData.sessionStatus || "Upcoming",
        WeekNumber: formData.weekNumber ? parseInt(formData.weekNumber) : 0,
        SessionLink: formData.sessionLink,
        ScheduledAt: scheduledAt,
        DurationMinutes: durationMinutes
      });
      await loadData();
      setShowAddSession(false);
      setFormData({ ...formData, sessionTitle: "", sessionType: "", sessionStatus: "", weekNumber: "", sessionDate: "", startTime: "", endTime: "", sessionLink: "", sessionDescription: "" });
    } catch (error) {
      console.error("Failed to add session:", error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddMaterial = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = {
        title: formData.materialTitle,
        materialType: formData.materialType || "Pdf",
        url: formData.materialUrl,
        description: formData.materialDescription,
        isDownloadable: formData.isDownloadable ?? true,
        courseId: round.courseId,
        courseRoundId: round.cohortId,
        courseLessonId: null,
        isPublished: true,
      };
      console.log("Sending material payload:", payload);
      await createEngineerMaterial(payload);
      await loadData();
      setShowAddMaterial(false);
      setFormData({ ...formData, materialTitle: "", materialType: "", materialUrl: "", materialDescription: "", isDownloadable: true });
    } catch (error) {
      console.error("Failed to add material:", error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await createEngineerTask({
        title: formData.taskTitle,
        description: formData.taskDescription,
        instructions: formData.taskInstructions,
        taskType: formData.taskType || "Code",
        submissionType: formData.submissionType || "File",
        maxScore: formData.maxScore ? parseInt(formData.maxScore) : 100,
        xpReward: formData.xpReward ? parseInt(formData.xpReward) : 100,
        dueHoursAfterSession: formData.dueHours ? parseInt(formData.dueHours) : 24,
        courseSessionId: null,
        courseRoundId: round.cohortId,
        rubricJson: "[]",
      });
      await loadData();
      setShowAddTask(false);
      setFormData({
        ...formData,
        taskTitle: "",
        taskDescription: "",
        taskInstructions: "",
        taskType: "",
        submissionType: "",
        maxScore: "",
        xpReward: "",
        dueHours: "",
      });
    } catch (error) {
      console.error("Failed to add task:", error);
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusColor = (status?: string) => {
    const statusLower = (status || "").toLowerCase();
    if (statusLower.includes("active")) return "bg-green-100 text-green-700";
    if (statusLower.includes("archived")) return "bg-zinc-100 text-zinc-600";
    return "bg-blue-100 text-blue-700";
  };

  if (loading) {
    return <div className="page-loader"><div className="spinner" /></div>;
  }

  if (!round) {
    return (
      <div className="w-full px-4 sm:px-8 py-6 sm:py-8 lg:px-12">
        <div className="mb-10">
          <Link href={`/engineer/courses/${round?.courseId}`} className="flex items-center gap-2 text-zinc-500 font-bold mb-4 hover:text-zinc-900 transition-colors">
            <ArrowLeft size={18} />
            <span>Back to {round?.courseTitle || "Course"}</span>
          </Link>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-display font-black tracking-tight text-zinc-900 leading-tight mb-2">
            Round Not Found
          </h1>
        </div>
      </div>
    );
  }

  const tabs: { id: TabType; label: string; icon: any }[] = [
    { id: "overview", label: "Overview", icon: Books },
    { id: "students", label: "Students", icon: Users },
    { id: "sessions", label: "Sessions", icon: Clock },
    { id: "materials", label: "Materials", icon: FileText },
    { id: "tasks", label: "Tasks", icon: Trophy },
    { id: "progress", label: "Progress", icon: CheckCircle },
  ];

  return (
    <div className="w-full px-4 sm:px-8 py-6 sm:py-8 lg:px-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 sm:mb-12">
        <div className="flex flex-col gap-1">
          <Link href={`/engineer/courses/${round.courseId}`} className="flex items-center gap-2 text-zinc-500 font-bold mb-2 hover:text-zinc-900 transition-colors w-fit">
            <ArrowLeft size={18} />
            <span>Back to {round.courseTitle}</span>
          </Link>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-display font-black tracking-tight text-zinc-900 leading-tight">
            {round.cohortName}
          </h1>
          <p className="text-zinc-500 font-medium">
            {round.courseTitle} • {round.status}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-8 border-b border-zinc-100 pb-2 overflow-x-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-sm transition-all whitespace-nowrap ${
                activeTab === tab.id
                  ? "bg-zinc-900 text-white"
                  : "text-zinc-500 hover:bg-zinc-100"
              }`}
            >
              <Icon size={16} weight="bold" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div className="mt-6">
        {activeTab === "overview" && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
          >
            <div className="bg-white rounded-[1.5rem] sm:rounded-[3rem] p-6 shadow-sm border border-black/5">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-brand-hover rounded-xl flex items-center justify-center">
                  <Users size={20} weight="fill" />
                </div>
                <div>
                  <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Students</p>
                  <p className="text-2xl font-black text-zinc-900">{round.studentsCount} / {round.maxStudents}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-[1.5rem] sm:rounded-[3rem] p-6 shadow-sm border border-black/5">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-brand-hover rounded-xl flex items-center justify-center">
                  <Clock size={20} weight="fill" />
                </div>
                <div>
                  <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Sessions</p>
                  <p className="text-2xl font-black text-zinc-900">{round.sessionsCount}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-[1.5rem] sm:rounded-[3rem] p-6 shadow-sm border border-black/5">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-brand-hover rounded-xl flex items-center justify-center">
                  <Calendar size={20} weight="fill" />
                </div>
                <div>
                  <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Start Date</p>
                  <p className="text-2xl font-black text-zinc-900">{round.startDate}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-[1.5rem] sm:rounded-[3rem] p-6 shadow-sm border border-black/5">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-brand-hover rounded-xl flex items-center justify-center">
                  <FileText size={20} weight="fill" />
                </div>
                <div>
                  <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Materials</p>
                  <p className="text-2xl font-black text-zinc-900">{round.materials?.length || 0}</p>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === "students" && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {round.students.map((student: any, idx: number) => (
              <div key={student.id} className="bg-white rounded-[1.5rem] sm:rounded-[3rem] p-6 shadow-sm border border-black/5">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 bg-brand-hover rounded-full flex items-center justify-center text-lg font-black">
                    {student.name.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2)}
                  </div>
                  <div>
                    <p className="font-bold text-zinc-900">{student.name}</p>
                    <p className="text-xs text-zinc-500">{round.cohortName}</p>
                  </div>
                </div>
              </div>
            ))}
          </motion.div>
        )}

        {activeTab === "sessions" && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-zinc-900">Sessions</h3>
              <button
                onClick={() => setShowAddSession(!showAddSession)}
                className="flex items-center gap-2 px-4 py-2 bg-zinc-900 text-white rounded-xl font-bold text-sm hover:bg-black transition-all"
              >
                <Plus size={16} weight="bold" />
                Add Session
              </button>
            </div>

            {showAddSession && (
              <div className="bg-white rounded-[1.5rem] sm:rounded-[3rem] p-6 shadow-sm border border-black/5 mb-8">
                <form onSubmit={handleAddSession} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2">Session Title</label>
                      <input
                        type="text"
                        value={formData.sessionTitle || ""}
                        onChange={(e) => setFormData({ ...formData, sessionTitle: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl border border-zinc-200 focus:border-zinc-400 outline-none"
                        placeholder="Week 1: Introduction to the Course"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2">Session Type</label>
                      <select
                        value={formData.sessionType || "Live"}
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
                      <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2">Week Number</label>
                      <input
                        type="number"
                        value={formData.weekNumber || ""}
                        onChange={(e) => setFormData({ ...formData, weekNumber: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl border border-zinc-200 focus:border-zinc-400 outline-none"
                        placeholder="1"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2">Date</label>
                      <input
                        type="date"
                        value={formData.sessionDate || ""}
                        onChange={(e) => setFormData({ ...formData, sessionDate: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl border border-zinc-200 focus:border-zinc-400 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2">Start Time</label>
                      <input
                        type="time"
                        value={formData.startTime || ""}
                        onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl border border-zinc-200 focus:border-zinc-400 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2">End Time</label>
                      <input
                        type="time"
                        value={formData.endTime || ""}
                        onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl border border-zinc-200 focus:border-zinc-400 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2">Meeting Link</label>
                      <input
                        type="url"
                        value={formData.sessionLink || ""}
                        onChange={(e) => setFormData({ ...formData, sessionLink: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl border border-zinc-200 focus:border-zinc-400 outline-none"
                        placeholder="https://zoom.us/j/123456789"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2">Status</label>
                      <select
                        value={formData.sessionStatus || "Upcoming"}
                        onChange={(e) => setFormData({ ...formData, sessionStatus: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl border border-zinc-200 focus:border-zinc-400 outline-none"
                      >
                        <option value="Upcoming">Upcoming</option>
                        <option value="Completed">Completed</option>
                        <option value="Cancelled">Cancelled</option>
                      </select>
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2">Description</label>
                      <textarea
                        value={formData.sessionDescription || ""}
                        onChange={(e) => setFormData({ ...formData, sessionDescription: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl border border-zinc-200 focus:border-zinc-400 outline-none"
                        placeholder="Brief description of what will be covered in this session"
                        rows={3}
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => setShowAddSession(false)}
                      className="px-4 py-2 text-zinc-500 font-bold text-sm hover:text-zinc-900 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="px-6 py-2 bg-zinc-900 text-white rounded-xl font-bold text-sm hover:bg-black transition-all disabled:opacity-50"
                    >
                      {submitting ? "Adding..." : "Add Session"}
                    </button>
                  </div>
                </form>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {round.sessions.map((session: any, idx: number) => (
                <div key={session.id} className="bg-white rounded-[1.5rem] sm:rounded-[3rem] p-6 shadow-sm border border-black/5 hover:shadow-md transition-shadow flex flex-col">
                  <div className="flex justify-between items-start mb-4">
                    <h4 className="font-bold text-zinc-900">{session.weekTitle}</h4>
                    <span className={`px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-widest ${getStatusColor(session.status)}`}>
                      {session.status}
                    </span>
                  </div>
                  <div className="space-y-3 mb-6">
                    <div className="flex items-center gap-2 text-sm text-zinc-600">
                      <Calendar size={16} className="text-zinc-400" />
                      <span>Week {session.weekNumber} • {session.sessionType}</span>
                    </div>
                    {session.scheduledAt && (
                      <div className="flex items-center gap-2 text-sm text-zinc-600">
                        <Clock size={16} className="text-zinc-400" />
                        <span>
                          {new Date(session.scheduledAt).toLocaleDateString()} • {new Date(session.scheduledAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                          {session.durationMinutes && ` • ${session.durationMinutes} min`}
                        </span>
                      </div>
                    )}
                    {round.engineerName && (
                      <div className="flex items-center gap-2 text-sm text-zinc-600">
                        <Users size={16} className="text-zinc-400" />
                        <span>Instructor: {round.engineerName}</span>
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
                    <Link
                      href={`/engineer/rounds/${params.cohortId}/sessions/${session.id}`}
                      className="w-full py-2 bg-brand hover:bg-brand-hover text-white rounded-xl font-bold text-sm transition-all text-center active:scale-[0.98]"
                    >
                      View Details
                    </Link>
                    <Link
                      href={`/engineer/rounds/${params.cohortId}/sessions/${session.id}?edit=true`}
                      className="w-full py-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-900 rounded-xl font-bold text-sm transition-all text-center"
                    >
                      Edit
                    </Link>
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        setDeletingSessionId(session.id);
                        setShowDeleteConfirm(true);
                      }}
                      className="w-full py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl font-bold text-sm transition-all text-center flex items-center justify-center gap-2"
                    >
                      <Trash size={16} weight="bold" />
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {activeTab === "materials" && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-zinc-900">Materials</h3>
              <button
                onClick={() => setShowAddMaterial(!showAddMaterial)}
                className="flex items-center gap-2 px-4 py-2 bg-zinc-900 text-white rounded-xl font-bold text-sm hover:bg-black transition-all"
              >
                <Plus size={16} weight="bold" />
                Add Material
              </button>
            </div>

            {showAddMaterial && (
              <div className="bg-white rounded-[1.5rem] sm:rounded-[3rem] p-6 shadow-sm border border-black/5 mb-8">
                <form onSubmit={handleAddMaterial} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2">Title</label>
                    <input
                      type="text"
                      value={formData.materialTitle || ""}
                      onChange={(e) => setFormData({ ...formData, materialTitle: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-zinc-200 focus:border-zinc-400 outline-none"
                      placeholder="Worksheet 1"
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2">Type</label>
                      <select
                        value={formData.materialType || "Pdf"}
                        onChange={(e) => setFormData({ ...formData, materialType: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl border border-zinc-200 focus:border-zinc-400 outline-none"
                      >
                        <option value="Pdf">PDF</option>
                        <option value="PowerPoint">PowerPoint</option>
                        <option value="Video">Video</option>
                        <option value="Link">Link</option>
                        <option value="CodeRepository">Code Repository</option>
                        <option value="Worksheet">Worksheet</option>
                        <option value="Recording">Recording</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2">URL</label>
                      <input
                        type="url"
                        value={formData.materialUrl || ""}
                        onChange={(e) => setFormData({ ...formData, materialUrl: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl border border-zinc-200 focus:border-zinc-400 outline-none"
                        placeholder="https://example.com"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2">Description</label>
                    <textarea
                      value={formData.materialDescription || ""}
                      onChange={(e) => setFormData({ ...formData, materialDescription: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-zinc-200 focus:border-zinc-400 outline-none"
                      placeholder="Material description"
                      rows={2}
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="downloadable"
                      checked={formData.isDownloadable ?? true}
                      onChange={(e) => setFormData({ ...formData, isDownloadable: e.target.checked })}
                      className="w-4 h-4 rounded border-zinc-300 text-zinc-900 focus:ring-zinc-900"
                    />
                    <label htmlFor="downloadable" className="text-sm font-medium text-zinc-700">
                      Allow download
                    </label>
                  </div>
                  <div className="flex justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => setShowAddMaterial(false)}
                      className="px-4 py-2 text-zinc-500 font-bold text-sm hover:text-zinc-900 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="px-6 py-2 bg-zinc-900 text-white rounded-xl font-bold text-sm hover:bg-black transition-all disabled:opacity-50"
                    >
                      {submitting ? "Adding..." : "Add Material"}
                    </button>
                  </div>
                </form>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {round.materials.map((material: any, idx: number) => (
                <div key={material.id} className="bg-white rounded-[1.5rem] sm:rounded-[3rem] p-6 shadow-sm border border-black/5">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-brand-hover rounded-xl flex items-center justify-center">
                      <FileText size={20} weight="fill" />
                    </div>
                    <div className="flex-1">
                      <p className="font-bold text-zinc-900">{material.title}</p>
                      <p className="text-xs text-zinc-500">{material.materialType}</p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEditMaterialClick(material)}
                        className="p-2 bg-zinc-100 hover:bg-zinc-200 rounded-xl transition-colors"
                      >
                        <Pencil size={16} weight="bold" />
                      </button>
                      <button
                        onClick={() => {
                          setDeletingMaterialId(material.id);
                          setShowMaterialDeleteConfirm(true);
                        }}
                        className="p-2 bg-red-100 hover:bg-red-200 rounded-xl transition-colors"
                      >
                        <Trash size={16} weight="bold" />
                      </button>
                    </div>
                  </div>
                  <a
                    href={material.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm font-bold text-blue-600 hover:text-blue-800"
                  >
                    View Material
                  </a>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {activeTab === "tasks" && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-zinc-900">Tasks</h3>
              <button
                onClick={() => setShowAddTask(!showAddTask)}
                className="flex items-center gap-2 px-4 py-2 bg-zinc-900 text-white rounded-xl font-bold text-sm hover:bg-black transition-all"
              >
                <Plus size={16} weight="bold" />
                Add Task
              </button>
            </div>

            {showAddTask && (
              <div className="bg-white rounded-[1.5rem] sm:rounded-[3rem] p-6 shadow-sm border border-black/5 mb-8">
                <form onSubmit={handleAddTask} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2">Task Title</label>
                    <input
                      type="text"
                      value={formData.taskTitle || ""}
                      onChange={(e) => setFormData({ ...formData, taskTitle: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-zinc-200 focus:border-zinc-400 outline-none"
                      placeholder="Homework 1"
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2">Task Type</label>
                      <select
                        value={formData.taskType || "Code"}
                        onChange={(e) => setFormData({ ...formData, taskType: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl border border-zinc-200 focus:border-zinc-400 outline-none"
                      >
                        <option value="Code">Code</option>
                        <option value="Design">Design</option>
                        <option value="Project">Project</option>
                        <option value="Reflection">Reflection</option>
                        <option value="Research">Research</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2">Submission Type</label>
                      <select
                        value={formData.submissionType || "File"}
                        onChange={(e) => setFormData({ ...formData, submissionType: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl border border-zinc-200 focus:border-zinc-400 outline-none"
                      >
                        <option value="File">File Upload</option>
                        <option value="Text">Text</option>
                        <option value="Link">Link</option>
                        <option value="Image">Image</option>
                        <option value="Repository">Repository</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2">Description</label>
                    <textarea
                      value={formData.taskDescription || ""}
                      onChange={(e) => setFormData({ ...formData, taskDescription: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-zinc-200 focus:border-zinc-400 outline-none"
                      placeholder="Task description"
                      rows={3}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2">Instructions</label>
                    <textarea
                      value={formData.taskInstructions || ""}
                      onChange={(e) => setFormData({ ...formData, taskInstructions: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-zinc-200 focus:border-zinc-400 outline-none"
                      placeholder="Task instructions"
                      rows={3}
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2">Max Score</label>
                      <input
                        type="number"
                        value={formData.maxScore || ""}
                        onChange={(e) => setFormData({ ...formData, maxScore: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl border border-zinc-200 focus:border-zinc-400 outline-none"
                        placeholder="100"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2">XP Reward</label>
                      <input
                        type="number"
                        value={formData.xpReward || ""}
                        onChange={(e) => setFormData({ ...formData, xpReward: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl border border-zinc-200 focus:border-zinc-400 outline-none"
                        placeholder="100"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2">Due (hours)</label>
                      <input
                        type="number"
                        value={formData.dueHours || ""}
                        onChange={(e) => setFormData({ ...formData, dueHours: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl border border-zinc-200 focus:border-zinc-400 outline-none"
                        placeholder="24"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => setShowAddTask(false)}
                      className="px-4 py-2 text-zinc-500 font-bold text-sm hover:text-zinc-900 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="px-6 py-2 bg-zinc-900 text-white rounded-xl font-bold text-sm hover:bg-black transition-all disabled:opacity-50"
                    >
                      {submitting ? "Adding..." : "Add Task"}
                    </button>
                  </div>
                </form>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {round.tasks.map((task: any, idx: number) => (
                <div key={task.id} className="bg-white rounded-[1.5rem] sm:rounded-[3rem] p-6 shadow-sm border border-black/5 flex flex-col">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-brand-hover rounded-xl flex items-center justify-center">
                      <Trophy size={20} weight="fill" />
                    </div>
                    <div className="flex-1">
                      <p className="font-bold text-zinc-900">{task.title}</p>
                      <p className="text-xs text-zinc-500">{task.taskType} • {task.maxScore} pts</p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEditTaskClick(task)}
                        className="p-2 bg-zinc-100 hover:bg-zinc-200 rounded-xl transition-colors"
                      >
                        <Pencil size={16} weight="bold" />
                      </button>
                      <button
                        onClick={() => {
                          setDeletingTaskId(task.id);
                          setShowTaskDeleteConfirm(true);
                        }}
                        className="p-2 bg-red-100 hover:bg-red-200 rounded-xl transition-colors"
                      >
                        <Trash size={16} weight="bold" />
                      </button>
                    </div>
                  </div>
                  <p className="text-sm text-zinc-600 mb-4">{task.description}</p>
                  <Link href={`/engineer/rounds/${params.cohortId}/tasks/${task.id}`} className="mt-auto text-sm font-bold text-zinc-900 hover:text-black transition-colors flex items-center gap-1">
                    View Details
                    <ArrowRight size={14} />
                  </Link>
                </div>
              ))}
            </div>

            {round.pendingSubmissions?.length > 0 && (
              <div>
                <h3 className="text-xl font-bold text-zinc-900 mb-4">Pending Submissions</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {round.pendingSubmissions.map((sub: any, idx: number) => (
                    <div key={sub.id} className="bg-white rounded-[1.5rem] sm:rounded-[3rem] p-6 shadow-sm border border-black/5">
                      <p className="font-bold text-zinc-900">{sub.studentName}</p>
                      <p className="text-sm text-zinc-500">{sub.taskTitle}</p>
                      <p className="text-xs text-zinc-400 mt-2">Submitted {new Date(sub.submittedAt).toLocaleDateString()}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}

        {activeTab === "progress" && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="bg-white rounded-[1.5rem] sm:rounded-[3rem] p-8 shadow-sm border border-black/5 text-center"
          >
            <div className="w-16 h-16 bg-zinc-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Trophy size={32} className="text-zinc-400" />
            </div>
            <h3 className="font-display text-xl font-bold text-zinc-900 mb-2">Progress Tracking Coming Soon</h3>
            <p className="text-zinc-500">Student progress tracking will be available here soon.</p>
          </motion.div>
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

      {/* Material Edit Modal */}
      {editingMaterial && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-[2rem] p-8 max-w-md w-full mx-4 shadow-2xl"
          >
            <h3 className="text-xl font-bold text-zinc-900 mb-6">Edit Material</h3>
            <form onSubmit={handleEditMaterialSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2">Title</label>
                <input
                  type="text"
                  value={editMaterialFormData.title}
                  onChange={(e) => setEditMaterialFormData({ ...editMaterialFormData, title: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-zinc-200 focus:border-zinc-400 outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2">Type</label>
                <select
                  value={editMaterialFormData.materialType}
                  onChange={(e) => setEditMaterialFormData({ ...editMaterialFormData, materialType: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-zinc-200 focus:border-zinc-400 outline-none"
                >
                  <option value="Pdf">PDF</option>
                  <option value="PowerPoint">PowerPoint</option>
                  <option value="Video">Video</option>
                  <option value="Link">Link</option>
                  <option value="CodeRepository">Code Repository</option>
                  <option value="Worksheet">Worksheet</option>
                  <option value="Recording">Recording</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2">URL</label>
                <input
                  type="url"
                  value={editMaterialFormData.url}
                  onChange={(e) => setEditMaterialFormData({ ...editMaterialFormData, url: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-zinc-200 focus:border-zinc-400 outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2">Description</label>
                <textarea
                  value={editMaterialFormData.description}
                  onChange={(e) => setEditMaterialFormData({ ...editMaterialFormData, description: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-zinc-200 focus:border-zinc-400 outline-none"
                  rows={2}
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="materialDownloadable"
                  checked={editMaterialFormData.isDownloadable}
                  onChange={(e) => setEditMaterialFormData({ ...editMaterialFormData, isDownloadable: e.target.checked })}
                  className="w-4 h-4 rounded border-zinc-300 text-zinc-900 focus:ring-zinc-900"
                />
                <label htmlFor="materialDownloadable" className="text-sm font-medium text-zinc-700">
                  Allow download
                </label>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingMaterial(null)}
                  disabled={submitting}
                  className="px-4 py-2 text-zinc-500 font-bold text-sm hover:text-zinc-900 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2 bg-zinc-900 text-white rounded-xl font-bold text-sm hover:bg-black transition-all disabled:opacity-50"
                >
                  {submitting ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Material Delete Confirmation Modal */}
      {showMaterialDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-[2rem] p-8 max-w-md w-full mx-4 shadow-2xl"
          >
            <h3 className="text-xl font-bold text-zinc-900 mb-4">Delete Material</h3>
            <p className="text-zinc-600 mb-6">
              Are you sure you want to delete this material? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowMaterialDeleteConfirm(false);
                  setDeletingMaterialId(null);
                }}
                disabled={submitting}
                className="px-4 py-2 text-zinc-500 font-bold text-sm hover:text-zinc-900 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteMaterial}
                disabled={submitting}
                className="px-6 py-2 bg-red-600 text-white rounded-xl font-bold text-sm hover:bg-red-700 transition-all disabled:opacity-50 flex items-center gap-2"
              >
                {submitting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Task Edit Modal */}
      {editingTask && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-[2rem] p-8 max-w-2xl w-full mx-4 shadow-2xl"
          >
            <h3 className="text-xl font-bold text-zinc-900 mb-6">Edit Task</h3>
            <form onSubmit={handleEditTaskSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2">Task Title</label>
                <input
                  type="text"
                  value={editTaskFormData.title}
                  onChange={(e) => setEditTaskFormData({ ...editTaskFormData, title: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-zinc-200 focus:border-zinc-400 outline-none"
                  placeholder="Task title"
                  required
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2">Task Type</label>
                  <select
                    value={editTaskFormData.taskType}
                    onChange={(e) => setEditTaskFormData({ ...editTaskFormData, taskType: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-zinc-200 focus:border-zinc-400 outline-none"
                  >
                    <option value="Code">Code</option>
                    <option value="Design">Design</option>
                    <option value="Project">Project</option>
                    <option value="Reflection">Reflection</option>
                    <option value="Research">Research</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2">Submission Type</label>
                  <select
                    value={editTaskFormData.submissionType}
                    onChange={(e) => setEditTaskFormData({ ...editTaskFormData, submissionType: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-zinc-200 focus:border-zinc-400 outline-none"
                  >
                    <option value="File">File Upload</option>
                    <option value="Text">Text</option>
                    <option value="Link">Link</option>
                    <option value="Image">Image</option>
                    <option value="Repository">Repository</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2">Description</label>
                <textarea
                  value={editTaskFormData.description}
                  onChange={(e) => setEditTaskFormData({ ...editTaskFormData, description: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-zinc-200 focus:border-zinc-400 outline-none"
                  placeholder="Task description"
                  rows={3}
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2">Instructions</label>
                <textarea
                  value={editTaskFormData.instructions}
                  onChange={(e) => setEditTaskFormData({ ...editTaskFormData, instructions: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-zinc-200 focus:border-zinc-400 outline-none"
                  placeholder="Task instructions"
                  rows={3}
                  required
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2">Max Score</label>
                  <input
                    type="number"
                    value={editTaskFormData.maxScore}
                    onChange={(e) => setEditTaskFormData({ ...editTaskFormData, maxScore: parseInt(e.target.value) })}
                    className="w-full px-4 py-3 rounded-xl border border-zinc-200 focus:border-zinc-400 outline-none"
                    placeholder="100"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2">XP Reward</label>
                  <input
                    type="number"
                    value={editTaskFormData.xpReward}
                    onChange={(e) => setEditTaskFormData({ ...editTaskFormData, xpReward: parseInt(e.target.value) })}
                    className="w-full px-4 py-3 rounded-xl border border-zinc-200 focus:border-zinc-400 outline-none"
                    placeholder="100"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2">Due (hours)</label>
                  <input
                    type="number"
                    value={editTaskFormData.dueHoursAfterSession}
                    onChange={(e) => setEditTaskFormData({ ...editTaskFormData, dueHoursAfterSession: parseInt(e.target.value) })}
                    className="w-full px-4 py-3 rounded-xl border border-zinc-200 focus:border-zinc-400 outline-none"
                    placeholder="24"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingTask(null)}
                  disabled={submitting}
                  className="px-4 py-2 text-zinc-500 font-bold text-sm hover:text-zinc-900 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2 bg-zinc-900 text-white rounded-xl font-bold text-sm hover:bg-black transition-all disabled:opacity-50"
                >
                  {submitting ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Task Delete Confirmation Modal */}
      {showTaskDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-[2rem] p-8 max-w-md w-full mx-4 shadow-2xl"
          >
            <h3 className="text-xl font-bold text-zinc-900 mb-4">Delete Task</h3>
            <p className="text-zinc-600 mb-6">
              Are you sure you want to delete this task? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowTaskDeleteConfirm(false);
                  setDeletingTaskId(null);
                }}
                disabled={submitting}
                className="px-4 py-2 text-zinc-500 font-bold text-sm hover:text-zinc-900 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteTask}
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
