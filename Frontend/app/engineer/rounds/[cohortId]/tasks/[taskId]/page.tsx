"use client";

import { ArrowLeft, Pencil, Trophy, FileText, Link, CheckCircle, XCircle, Star } from "@phosphor-icons/react";
import LinkComponent from "next/link";
import { useEffect, useState } from "react";
import {
  getEngineerTask,
  getEngineerTaskSubmissions,
  updateEngineerTask,
  gradeTask,
} from "@/lib/api";
import { useParams, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { TaskGradingModal } from "@/components/TaskGradingModal";

export default function TaskDetailPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const [task, setTask] = useState<any>(null);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(searchParams.get('edit') === 'true');
  const [formData, setFormData] = useState<any>({});
  const [submitting, setSubmitting] = useState(false);
  const [showGradingModal, setShowGradingModal] = useState(false);
  const [currentSubmission, setCurrentSubmission] = useState<any>(null);

  const loadData = async () => {
    try {
      const [taskData, submissionsData] = await Promise.all([
        getEngineerTask(params.taskId as string),
        getEngineerTaskSubmissions(params.taskId as string)
      ]);
      setTask(taskData);
      setSubmissions(submissionsData);
      
      setFormData({
        title: taskData.title,
        description: taskData.description,
        instructions: taskData.instructions,
        taskType: taskData.taskType,
        submissionType: taskData.submissionType,
        maxScore: taskData.maxScore,
        xpReward: taskData.xpReward,
        dueHoursAfterSession: taskData.dueHoursAfterSession,
        rubricJson: taskData.rubricJson
      });
    } catch (error) {
      console.error("Failed to load task:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [params.cohortId, params.taskId]);

  const handleUpdateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await updateEngineerTask(params.taskId as string, formData);
      await loadData();
      setIsEditing(false);
    } catch (error) {
      console.error("Failed to update task:", error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleGradeSubmission = async (submissionId: string, score: number, feedback: string) => {
    try {
      await gradeTask(submissionId, score, feedback);
      await loadData();
      setShowGradingModal(false);
    } catch (error) {
      console.error("Failed to grade submission:", error);
    }
  };

  if (loading) {
    return <div className="page-loader"><div className="spinner" /></div>;
  }

  if (!task) {
    return (
      <div className="w-full px-4 sm:px-8 py-6 sm:py-8 lg:px-12">
        <div className="mb-10">
          <LinkComponent href={`/engineer/rounds/${params.cohortId}`} className="flex items-center gap-2 text-zinc-500 font-bold mb-4 hover:text-zinc-900 transition-colors">
            <ArrowLeft size={18} />
            <span>Back to Round</span>
          </LinkComponent>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-display font-black tracking-tight text-zinc-900 leading-tight mb-2">
            Task Not Found
          </h1>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full px-4 sm:px-8 py-6 sm:py-8 lg:px-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
        <div>
          <LinkComponent href={`/engineer/rounds/${params.cohortId}`} className="flex items-center gap-2 text-zinc-500 font-bold mb-2 hover:text-zinc-900 transition-colors">
            <ArrowLeft size={18} />
            <span>Back to Round</span>
          </LinkComponent>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-display font-black tracking-tight text-zinc-900 leading-tight mb-2">
            {task.title}
          </h1>
          <div className="flex items-center gap-3 flex-wrap">
            <span className="px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-widest bg-blue-100 text-blue-700">
              {task.taskType}
            </span>
            <span className="text-zinc-500 font-medium">Max Score: {task.maxScore}</span>
            <span className="text-zinc-500 font-medium">XP Reward: {task.xpReward}</span>
          </div>
        </div>
        <button
          onClick={() => setIsEditing(!isEditing)}
          className="flex items-center gap-2 px-4 py-2 bg-zinc-900 text-white rounded-lg font-bold text-sm hover:bg-black transition-all"
        >
          <Pencil size={16} weight="bold" />
          {isEditing ? "Cancel" : "Edit Task"}
        </button>
      </div>

      {isEditing ? (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-[1.5rem] sm:rounded-[3rem] p-8 shadow-sm border border-black/5"
        >
          <form onSubmit={handleUpdateTask} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2">Task Title</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-zinc-200 focus:border-zinc-400 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2">Task Type</label>
                <select
                  value={formData.taskType}
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
                  value={formData.submissionType}
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
              <div>
                <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2">Max Score</label>
                <input
                  type="number"
                  value={formData.maxScore}
                  onChange={(e) => setFormData({ ...formData, maxScore: parseInt(e.target.value) })}
                  className="w-full px-4 py-3 rounded-xl border border-zinc-200 focus:border-zinc-400 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2">XP Reward</label>
                <input
                  type="number"
                  value={formData.xpReward}
                  onChange={(e) => setFormData({ ...formData, xpReward: parseInt(e.target.value) })}
                  className="w-full px-4 py-3 rounded-xl border border-zinc-200 focus:border-zinc-400 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2">Due (Hours After Session)</label>
                <input
                  type="number"
                  value={formData.dueHoursAfterSession}
                  onChange={(e) => setFormData({ ...formData, dueHoursAfterSession: parseInt(e.target.value) })}
                  className="w-full px-4 py-3 rounded-xl border border-zinc-200 focus:border-zinc-400 outline-none"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-zinc-200 focus:border-zinc-400 outline-none"
                  rows={3}
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2">Instructions</label>
                <textarea
                  value={formData.instructions}
                  onChange={(e) => setFormData({ ...formData, instructions: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-zinc-200 focus:border-zinc-400 outline-none"
                  rows={5}
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
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-[1.5rem] sm:rounded-[3rem] p-8 shadow-sm border border-black/5">
              <h3 className="text-xl font-bold text-zinc-900 mb-6">Task Details</h3>
              <div className="space-y-4">
                <div>
                  <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2">Description</p>
                  <p className="font-medium text-zinc-900">{task.description || "No description"}</p>
                </div>
                <div>
                  <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2">Instructions</p>
                  <p className="font-medium text-zinc-900 whitespace-pre-wrap">{task.instructions || "No instructions"}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-[1.5rem] sm:rounded-[3rem] p-8 shadow-sm border border-black/5">
              <h3 className="text-xl font-bold text-zinc-900 mb-6">Submissions ({submissions.length})</h3>
              <div className="space-y-4">
                {submissions.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-zinc-500 font-medium">No submissions yet</p>
                  </div>
                ) : (
                  submissions.map((submission) => (
                    <div key={submission.id} className="border border-black/5 rounded-2xl p-6">
                      <div className="flex items-start justify-between gap-4 mb-4">
                        <div>
                          <h4 className="font-bold text-zinc-900">{submission.studentName}</h4>
                          <p className="text-xs text-zinc-500">{submission.studentEmail}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          {submission.score !== null ? (
                            <div className="flex items-center gap-1 px-3 py-1 rounded-lg bg-green-100 text-green-700">
                              <Star size={12} weight="fill" />
                              <span className="text-xs font-bold">{submission.score}/{task.maxScore}</span>
                            </div>
                          ) : (
                            <span className="px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-widest bg-zinc-100 text-zinc-600">
                              Pending
                            </span>
                          )}
                        </div>
                      </div>

                      {submission.submissionUrl && (
                        <a href={submission.submissionUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-blue-600 hover:text-blue-800 font-medium mb-2">
                          <Link size={16} />
                          <span className="text-sm break-all">{submission.submissionUrl}</span>
                        </a>
                      )}
                      {submission.repositoryUrl && (
                        <a href={submission.repositoryUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-blue-600 hover:text-blue-800 font-medium mb-2">
                          <FileText size={16} />
                          <span className="text-sm break-all">{submission.repositoryUrl}</span>
                        </a>
                      )}
                      {submission.submissionText && (
                        <div className="bg-zinc-50 rounded-xl p-4 mb-4">
                          <p className="text-sm font-medium text-zinc-900 whitespace-pre-wrap">{submission.submissionText}</p>
                        </div>
                      )}

                      {submission.feedback && (
                        <div className="mb-4">
                          <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-1">Feedback</p>
                          <p className="text-sm font-medium text-zinc-700">{submission.feedback}</p>
                        </div>
                      )}

                      <button
                        onClick={() => {
                          setCurrentSubmission(submission);
                          setShowGradingModal(true);
                        }}
                        className="w-full md:w-auto px-4 py-2 bg-zinc-900 text-white rounded-lg font-bold text-sm hover:bg-black transition-all"
                      >
                        {submission.score !== null ? "Re-grade" : "Grade"}
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white rounded-[1.5rem] sm:rounded-[3rem] p-6 shadow-sm border border-black/5">
              <h4 className="font-bold text-zinc-900 mb-4">Task Info</h4>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-brand-hover rounded-xl flex items-center justify-center">
                    <Trophy size={20} />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Max Score</p>
                    <p className="font-bold text-zinc-900">{task.maxScore} points</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-brand-hover rounded-xl flex items-center justify-center">
                    <CheckCircle size={20} />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest">XP Reward</p>
                    <p className="font-bold text-zinc-900">{task.xpReward} XP</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {showGradingModal && currentSubmission && (
        <TaskGradingModal
          taskTitle={task.title}
          submissions={[currentSubmission]}
          onClose={() => setShowGradingModal(false)}
          onGraded={() => loadData()}
        />
      )}
    </div>
  );
}
