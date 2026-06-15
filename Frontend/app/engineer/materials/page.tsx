"use client";

import { UploadSimple, FilePdf, PresentationChart, FileZip, FileText, FileVideo, FileCode, Pencil, Trash } from "@phosphor-icons/react";
import { useEffect, useState } from "react";
import { getEngineerMaterials, updateEngineerMaterial, deleteEngineerMaterial } from "@/lib/api";

export default function EngineerMaterialsPage() {
  const [materials, setMaterials] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingMaterial, setEditingMaterial] = useState<any>(null);
  const [editFormData, setEditFormData] = useState<any>({});
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const loadMaterials = async () => {
    try {
      const data = await getEngineerMaterials();
      setMaterials(data);
    } catch (error) {
      console.error("Failed to load materials", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMaterials();
  }, []);

  const getMaterialIcon = (type: string) => {
    switch (type) {
      case "Pdf":
        return <FilePdf size={24} weight="fill" />;
      case "PowerPoint":
        return <PresentationChart size={24} weight="fill" />;
      case "Video":
        return <FileVideo size={24} weight="fill" />;
      case "CodeRepository":
        return <FileCode size={24} weight="fill" />;
      default:
        return <FileText size={24} weight="fill" />;
    }
  };

  const getMaterialColor = (type: string) => {
    switch (type) {
      case "Pdf":
        return "bg-red-100 text-red-600";
      case "PowerPoint":
        return "bg-orange-100 text-orange-600";
      case "Video":
        return "bg-blue-100 text-blue-600";
      case "CodeRepository":
        return "bg-green-100 text-green-600";
      default:
        return "bg-zinc-100 text-zinc-600";
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    if (days === 0) return "Today";
    if (days === 1) return "Yesterday";
    if (days < 7) return `${days} days ago`;
    return date.toLocaleDateString();
  };

  const handleEditClick = (material: any) => {
    setEditingMaterial(material);
    setEditFormData({
      title: material.title,
      url: material.url,
      description: material.description || "",
      materialType: material.materialType,
      isDownloadable: material.isDownloadable,
      isPublished: material.isPublished
    });
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMaterial) return;
    setSubmitting(true);
    try {
      await updateEngineerMaterial(editingMaterial.id, editFormData);
      await loadMaterials();
      setEditingMaterial(null);
    } catch (error) {
      console.error("Failed to update material", error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteClick = async () => {
    if (!deleteConfirmId) return;
    setSubmitting(true);
    try {
      await deleteEngineerMaterial(deleteConfirmId);
      await loadMaterials();
      setDeleteConfirmId(null);
    } catch (error) {
      console.error("Failed to delete material", error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="w-full px-6 lg:px-12 pt-6 pb-24">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10">
        <div>
          <h1 className="font-display text-4xl font-black text-zinc-900 tracking-tight mb-2">Manage Materials</h1>
          <p className="text-zinc-500 font-medium">Upload slides, code snippets, and resources for your students.</p>
        </div>
      </div>

      <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-black/5">
         <h2 className="text-2xl font-display font-bold text-zinc-900 mb-6">Recent Uploads</h2>
         
         {loading ? (
           <p className="text-zinc-500">Loading materials...</p>
         ) : materials.length === 0 ? (
           <p className="text-zinc-500">No materials yet. Upload your first material in a round page.</p>
         ) : (
           <div className="space-y-4">
             {materials.map((material, idx) => (
               <div key={material.id} className="flex items-center justify-between p-4 bg-zinc-50 border border-black/5 rounded-2xl hover:bg-zinc-100 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${getMaterialColor(material.materialType)}`}>
                      {getMaterialIcon(material.materialType)}
                    </div>
                    <div>
                      <h4 className="font-bold text-zinc-900">{material.title}</h4>
                      <p className="text-xs text-zinc-500 font-medium">
                        {material.courseTitle || "Unknown Course"} • {material.cohortName || "Unknown Cohort"} • Uploaded {formatDate(material.createdAt)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <a
                      href={material.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2 bg-white border border-black/10 hover:bg-zinc-50 text-zinc-700 rounded-lg text-xs font-bold transition-colors"
                    >
                      View
                    </a>
                    <button
                      onClick={() => handleEditClick(material)}
                      className="p-2 bg-white border border-black/10 hover:bg-zinc-50 text-zinc-700 rounded-lg transition-colors"
                    >
                      <Pencil size={16} weight="bold" />
                    </button>
                    <button
                      onClick={() => setDeleteConfirmId(material.id)}
                      className="p-2 bg-red-50 border border-red-200 hover:bg-red-100 text-red-700 rounded-lg transition-colors"
                    >
                      <Trash size={16} weight="bold" />
                    </button>
                  </div>
               </div>
             ))}
           </div>
         )}
      </div>

      {/* Edit Modal */}
      {editingMaterial && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-[2rem] p-8 max-w-md w-full mx-4 shadow-2xl">
            <h2 className="text-2xl font-bold text-zinc-900 mb-6">Edit Material</h2>
            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2">Title</label>
                <input
                  type="text"
                  value={editFormData.title}
                  onChange={(e) => setEditFormData({ ...editFormData, title: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-zinc-200 focus:border-zinc-400 outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2">URL</label>
                <input
                  type="url"
                  value={editFormData.url}
                  onChange={(e) => setEditFormData({ ...editFormData, url: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-zinc-200 focus:border-zinc-400 outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2">Description</label>
                <textarea
                  value={editFormData.description}
                  onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-zinc-200 focus:border-zinc-400 outline-none"
                  rows={3}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2">Type</label>
                <select
                  value={editFormData.materialType}
                  onChange={(e) => setEditFormData({ ...editFormData, materialType: e.target.value })}
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
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isDownloadable"
                  checked={editFormData.isDownloadable}
                  onChange={(e) => setEditFormData({ ...editFormData, isDownloadable: e.target.checked })}
                />
                <label htmlFor="isDownloadable" className="text-sm text-zinc-700">Downloadable</label>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isPublished"
                  checked={editFormData.isPublished}
                  onChange={(e) => setEditFormData({ ...editFormData, isPublished: e.target.checked })}
                />
                <label htmlFor="isPublished" className="text-sm text-zinc-700">Published</label>
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setEditingMaterial(null)}
                  className="flex-1 px-4 py-3 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded-xl font-bold text-sm transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 px-4 py-3 bg-brand hover:bg-brand-hover text-brand-fg rounded-xl font-bold text-sm transition-colors shadow-md shadow-brand/30 disabled:opacity-50"
                >
                  {submitting ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-[2rem] p-8 max-w-md w-full mx-4 shadow-2xl">
            <h2 className="text-2xl font-bold text-zinc-900 mb-4">Delete Material</h2>
            <p className="text-zinc-600 mb-6">Are you sure you want to delete this material? This action cannot be undone.</p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setDeleteConfirmId(null)}
                className="flex-1 px-4 py-3 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded-xl font-bold text-sm transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteClick}
                disabled={submitting}
                className="flex-1 px-4 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold text-sm transition-colors disabled:opacity-50"
              >
                {submitting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
