"use client";

import { useEffect, useState, useCallback } from "react";
import { apiGet, apiPost, apiPut } from "@/lib/api";
import { UserPlus, ShieldCheck, MagnifyingGlass, Trash, Sparkle, X, Power, PencilSimple, Funnel, FileCsv } from "@phosphor-icons/react";
import { useToast } from "@/lib/toast-context";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft } from "@phosphor-icons/react";
import { SkeletonTable } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { Table, type Column } from "@/components/ui/Table";
import { exportToCsv } from "@/lib/csv-export";

type AcademyUser = {
  id: string;
  email: string;
  displayName: string;
  role: string;
  totalXp: number;
  isActive: boolean;
};

export default function AdminUsersPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  const [users, setUsers] = useState<AcademyUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedRole, setSelectedRole] = useState(searchParams.get("role") || "");
  const [selectedStatus, setSelectedStatus] = useState("");

  // Create User Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "Password123!",
    role: "student"
  });

  // Edit User Modal State
  const [showEditModal, setShowEditModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    id: "",
    name: "",
    email: "",
    role: "student"
  });

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedRole) params.append("role", selectedRole);
      if (selectedStatus) params.append("isActive", selectedStatus);
      
      const data = await apiGet<AcademyUser[]>(`/api/admin/users?${params.toString()}`, []);
      setUsers(data);
    } finally {
      setLoading(false);
    }
  }, [selectedRole, selectedStatus]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await apiPost("/api/admin/users/create", formData);
      toast(`User ${formData.email} created successfully.`, "success");
      setShowCreateModal(false);
      setFormData({ name: "", email: "", password: "Password123!", role: "student" });
      fetchUsers();
    } catch (e: any) {
      toast(e.message || "Failed to create user", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsEditing(true);
    try {
      await apiPut(`/api/admin/users/${editData.id}`, {
        name: editData.name,
        email: editData.email,
        role: editData.role
      });
      toast(`Identity for ${editData.email} updated.`, "success");
      setShowEditModal(false);
      fetchUsers();
    } catch (e: any) {
      // Try to parse detailed error from backend
      let msg = "Failed to update user";
      try {
        const errorData = JSON.parse(e.message);
        if (errorData.errors) msg = errorData.errors.join(", ");
      } catch {
        msg = e.message || msg;
      }
      toast(msg, "error");
    } finally {
      setIsEditing(false);
    }
  };

  const handleToggleActive = async (e: React.MouseEvent, user: AcademyUser) => {
    e.stopPropagation(); // Prevent row click
    try {
      await apiPut(`/api/admin/users/${user.id}/toggle-active`, {});
      toast(`User ${user.isActive ? 'deactivated' : 'activated'} successfully.`, "success");
      fetchUsers();
    } catch (e: any) {
      toast(e.message || "Failed to toggle status", "error");
    }
  };

  const openEditModal = (e: React.MouseEvent, user: AcademyUser) => {
    e.stopPropagation(); // Prevent row click
    setEditData({
      id: user.id,
      name: user.displayName,
      email: user.email,
      role: user.role
    });
    setShowEditModal(true);
  };

  const filteredUsers = users.filter(u => 
    u.email.toLowerCase().includes(search.toLowerCase()) || 
    u.displayName.toLowerCase().includes(search.toLowerCase())
  );

  const columns: Column<AcademyUser>[] = [
    {
      key: "displayName",
      label: "Identity",
      sortable: true,
      render: (user) => (
        <div className="flex items-center gap-3 group/item">
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-zinc-200 flex items-center justify-center font-bold text-sm sm:text-base text-zinc-600 shrink-0 group-hover/item:bg-brand group-hover/item:text-white transition-colors">
            {user.displayName?.charAt(0) || "U"}
          </div>
          <div>
            <div className="font-bold text-zinc-900 text-sm sm:text-base group-hover/item:text-brand transition-colors">{user.displayName}</div>
            <div className="text-xs text-zinc-500 font-mono">{user.email}</div>
          </div>
        </div>
      ),
    },
    {
      key: "role",
      label: "Authority Level",
      sortable: true,
      render: (user) => (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${
          user.role === "academy_admin" ? "bg-red-100 text-red-700" : "bg-brand-hover text-zinc-900"
        }`}>
          {user.role === "academy_admin" && <ShieldCheck size={12} weight="fill" />}
          {user.role}
        </span>
      ),
    },
    {
      key: "totalXp",
      label: "XP",
      sortable: true,
      render: (user) => (
        <span className="inline-flex items-center gap-1 font-bold text-zinc-700 text-sm">
          <Sparkle size={14} weight="fill" className="text-brand" />
          {user.totalXp}
        </span>
      ),
    },
    {
      key: "isActive",
      label: "Status",
      sortable: true,
      render: (user) => (
        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
          user.isActive ? "bg-green-100 text-green-700" : "bg-zinc-100 text-zinc-500"
        }`}>
          {user.isActive ? "Active" : "Deactivated"}
        </span>
      ),
    },
    {
      key: "id",
      label: "Actions",
      width: "120px",
      render: (user) => (
        <div className="flex items-center justify-end gap-2">
          <button 
            onClick={(e) => openEditModal(e, user)}
            className="p-2 bg-zinc-50 hover:bg-zinc-100 text-zinc-600 rounded-lg transition-colors"
            title="Edit Identity"
          >
            <PencilSimple size={16} weight="bold" />
          </button>
          <button 
            onClick={(e) => handleToggleActive(e, user)}
            className={`p-2 rounded-lg transition-colors ${
              user.isActive 
                ? "bg-red-50 hover:bg-red-100 text-red-600" 
                : "bg-green-50 hover:bg-green-100 text-green-600"
            }`}
            title={user.isActive ? "Deactivate User" : "Activate User"}
          >
            <Power size={16} weight="bold" />
          </button>
        </div>
      ),
    },
  ];

  if (loading && users.length === 0) return <div className="w-full px-4 sm:px-6 lg:px-12 pt-4 sm:pt-6 pb-24"><SkeletonTable rows={5} cols={4} /></div>;

  return (
    <div className="w-full px-4 sm:px-6 lg:px-12 pt-4 sm:pt-6 pb-24">
      <div className="mb-6 sm:mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <Link href="/admin" className="text-brand text-xs font-black uppercase tracking-[0.2em] mb-3 sm:mb-4 flex items-center gap-2 hover:underline">
            <ArrowLeft size={14} weight="bold" /> Back to Dashboard
          </Link>
          <h1 className="font-display text-2xl sm:text-3xl lg:text-4xl font-black text-zinc-900 tracking-tight mb-2">Identity Directory</h1>
          <p className="text-zinc-500 font-medium">Manage academy personnel, system administrators, and student terminals.</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          {filteredUsers.length > 0 && (
            <button
              onClick={() => exportToCsv(filteredUsers.map(u => ({ Name: u.displayName, Email: u.email, Role: u.role, XP: u.totalXp, Status: u.isActive ? 'Active' : 'Deactivated' })), "academy-users")}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-zinc-50 border border-black/10 text-zinc-700 px-5 py-3 rounded-full font-bold text-sm hover:bg-zinc-100 transition-colors shadow-sm"
            >
              <FileCsv size={18} weight="bold" /> Export CSV
            </button>
          )}
          <button 
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-[#ff1a1a] text-white px-5 py-3 rounded-full font-bold text-sm hover:bg-[#ff4d4d] transition-colors shadow-lg"
            onClick={() => setShowCreateModal(true)}
          >
            <UserPlus size={18} weight="bold" /> Create User
          </button>
        </div>
      </div>

      <div className="bg-white rounded-[1.5rem] sm:rounded-[2.5rem] p-4 sm:p-8 shadow-sm border border-black/5">
        <div className="flex flex-col lg:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <MagnifyingGlass size={18} className="text-zinc-400" />
            </div>
            <input 
              placeholder="Search by name or email..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-zinc-50 border border-black/10 rounded-2xl pl-11 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-black/5"
            />
          </div>
          
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 bg-zinc-50 border border-black/10 rounded-2xl px-4 py-2">
              <Funnel size={16} className="text-zinc-400" />
              <select 
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
                className="bg-transparent text-sm font-bold text-zinc-600 focus:outline-none cursor-pointer"
              >
                <option value="">All Roles</option>
                <option value="student">Students</option>
                <option value="engineer">Engineers</option>
                <option value="cta">CAT Officers</option>
                <option value="academy_admin">Admins</option>
              </select>
            </div>

            <div className="flex items-center gap-2 bg-zinc-50 border border-black/10 rounded-2xl px-4 py-2">
              <Power size={16} className="text-zinc-400" />
              <select 
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="bg-transparent text-sm font-bold text-zinc-600 focus:outline-none cursor-pointer"
              >
                <option value="">All Status</option>
                <option value="true">Active Only</option>
                <option value="false">Deactivated Only</option>
              </select>
            </div>
          </div>
        </div>

        {loading && users.length === 0 ? (
          <SkeletonTable rows={5} cols={4} />
        ) : filteredUsers.length === 0 ? (
          <EmptyState icon={<UserPlus size={32} weight="fill" />} title="No users found." />
        ) : (
          <Table
            columns={columns}
            data={filteredUsers}
            keyExtractor={(u) => u.id}
            onRowClick={(u) => router.push(`/admin/users/${u.id}`)}
          />
        )}
      </div>

      {/* Create User Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-zinc-950/60 backdrop-blur-sm" onClick={() => !isSubmitting && setShowCreateModal(false)} />
          <div className="relative w-full max-w-md bg-white rounded-[2rem] shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="px-8 pt-8 pb-6 flex items-center justify-between border-b border-zinc-100">
              <h2 className="font-display text-2xl font-black text-zinc-900 tracking-tight">New Identity</h2>
              <button 
                onClick={() => setShowCreateModal(false)}
                className="p-2 hover:bg-zinc-100 rounded-full transition-colors"
                disabled={isSubmitting}
              >
                <X size={20} weight="bold" className="text-zinc-400" />
              </button>
            </div>
            
            <form onSubmit={handleCreateUser} className="p-8 space-y-5">
              <div>
                <label className="block text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] mb-2 px-1">Full Name</label>
                <input
                  required
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. John Doe"
                  className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-brand/5 focus:border-brand transition-all"
                />
              </div>
              
              <div>
                <label className="block text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] mb-2 px-1">Email Address</label>
                <input
                  required
                  type="email"
                  value={formData.email}
                  onChange={e => setFormData({ ...formData, email: e.target.value })}
                  placeholder="e.g. student@example.com"
                  className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-brand/5 focus:border-brand transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] mb-2 px-1">Authority Role</label>
                  <select
                    value={formData.role}
                    onChange={e => setFormData({ ...formData, role: e.target.value })}
                    className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-brand/5 focus:border-brand transition-all appearance-none cursor-pointer"
                  >
                    <option value="student">Student</option>
                    <option value="engineer">Engineer</option>
                    <option value="cta">CAT Officer</option>
                    <option value="academy_admin">Administrator</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] mb-2 px-1">Initial Pass</label>
                  <input
                    required
                    type="text"
                    value={formData.password}
                    onChange={e => setFormData({ ...formData, password: e.target.value })}
                    className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-brand/5 focus:border-brand transition-all"
                  />
                </div>
              </div>

              <div className="pt-4">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-zinc-900 text-white py-4 rounded-2xl font-black text-sm hover:bg-black transition-all active:scale-[0.98] shadow-lg shadow-zinc-200 disabled:opacity-50 disabled:pointer-events-none"
                >
                  {isSubmitting ? "Provisioning..." : "Initialize Identity"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {showEditModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-zinc-950/60 backdrop-blur-sm" onClick={() => !isEditing && setShowEditModal(false)} />
          <div className="relative w-full max-w-md bg-white rounded-[2rem] shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="px-8 pt-8 pb-6 flex items-center justify-between border-b border-zinc-100">
              <h2 className="font-display text-2xl font-black text-zinc-900 tracking-tight">Edit Identity</h2>
              <button 
                onClick={() => setShowEditModal(false)}
                className="p-2 hover:bg-zinc-100 rounded-full transition-colors"
                disabled={isEditing}
              >
                <X size={20} weight="bold" className="text-zinc-400" />
              </button>
            </div>
            
            <form onSubmit={handleEditUser} className="p-8 space-y-5">
              <div>
                <label className="block text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] mb-2 px-1">Full Name</label>
                <input
                  required
                  value={editData.name}
                  onChange={e => setEditData({ ...editData, name: e.target.value })}
                  placeholder="e.g. John Doe"
                  className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-brand/5 focus:border-brand transition-all"
                />
              </div>
              
              <div>
                <label className="block text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] mb-2 px-1">Email Address</label>
                <input
                  required
                  type="email"
                  value={editData.email}
                  onChange={e => setEditData({ ...editData, email: e.target.value })}
                  placeholder="e.g. student@example.com"
                  className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-brand/5 focus:border-brand transition-all"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] mb-2 px-1">Authority Role</label>
                <select
                  value={editData.role}
                  onChange={e => setEditData({ ...editData, role: e.target.value })}
                  className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-brand/5 focus:border-brand transition-all appearance-none cursor-pointer"
                >
                  <option value="student">Student</option>
                  <option value="engineer">Engineer</option>
                  <option value="cta">CAT Officer</option>
                  <option value="academy_admin">Administrator</option>
                </select>
              </div>

              <div className="pt-4">
                <button
                  type="submit"
                  disabled={isEditing}
                  className="w-full bg-zinc-900 text-white py-4 rounded-2xl font-black text-sm hover:bg-black transition-all active:scale-[0.98] shadow-lg shadow-zinc-200 disabled:opacity-50 disabled:pointer-events-none"
                >
                  {isEditing ? "Updating..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
