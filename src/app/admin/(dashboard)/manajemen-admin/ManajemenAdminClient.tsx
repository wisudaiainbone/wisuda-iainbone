"use client";

import { useState, useTransition } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShieldCheck, ShieldAlert, UserPlus, Trash2, Edit2,
  Clock, Mail, Check, X, Loader2
} from "lucide-react";
import type { AdminUser } from "@/actions/adminUsers";
import {
  inviteAdminUser,
  editAdminUser,
  toggleAdminStatus,
  deleteAdminUser,
  updateAdminRole,
} from "@/actions/adminUsers";
import { ROLE_META, ALL_ROLES, type AdminRole } from "@/lib/permissions";
import { useToast } from "@/components/ui/Toast";
import ConfirmDialog from "@/components/ui/ConfirmDialog";

type Props = {
  initialAdmins: AdminUser[];
  currentAdminId: string;
  currentAdminRole: AdminRole;
  fakultasList: string[];
};

export default function ManajemenAdminClient({
  initialAdmins,
  currentAdminId,
  currentAdminRole,
  fakultasList,
}: Props) {
  const [admins, setAdmins] = useState<AdminUser[]>(initialAdmins);
  const [showForm, setShowForm] = useState(false);
  const [isPending, startTransition] = useTransition();
  const { showToast } = useToast();

  // Form state
  const [formEmail, setFormEmail] = useState("");
  const [formNama, setFormNama] = useState("");
  const [formRole, setFormRole] = useState<AdminRole>("admin_unit");
  const [formUnitKerja, setFormUnitKerja] = useState("");
  const [formLoading, setFormLoading] = useState(false);
  const [editingAdminId, setEditingAdminId] = useState<string | null>(null);

  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    action: (() => void) | null;
    title: string;
    message: string;
    confirmText: string;
    isDestructive: boolean;
  }>({
    isOpen: false,
    action: null,
    title: "",
    message: "",
    confirmText: "",
    isDestructive: true,
  });

  const handleSaveAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);

    if (editingAdminId) {
      // Mode Edit
      const res = await editAdminUser(editingAdminId, formNama, formRole, formRole === "admin_unit" ? formUnitKerja : undefined);
      setFormLoading(false);
      if (res.success) {
        showToast(`Admin "${formNama}" berhasil diperbarui!`, "success");
        setShowForm(false);
        setAdmins((prev) => prev.map((a) => a.id === editingAdminId ? {
          ...a,
          nama_lengkap: formNama,
          role: formRole,
          unit_kerja: formRole === "admin_unit" ? formUnitKerja : null,
        } : a));
      } else {
        showToast(res.error ?? "Gagal memperbarui admin.", "error");
      }
    } else {
      // Mode Tambah
      const res = await inviteAdminUser(formEmail, formNama, formRole, formRole === "admin_unit" ? formUnitKerja : undefined);
      setFormLoading(false);
      if (res.success) {
        showToast(`Admin "${formNama}" berhasil ditambahkan!`, "success");
        setShowForm(false);
        setAdmins((prev) => [
          {
            id: res.userId!,
            nama_lengkap: formNama,
            email: formEmail,
            role: formRole,
            unit_kerja: formRole === "admin_unit" ? formUnitKerja : null,
            is_active: true,
            created_at: new Date().toISOString(),
            last_login: null,
          },
          ...prev,
        ]);
      } else {
        showToast(res.error ?? "Gagal menambahkan admin.", "error");
      }
    }
  };

  const openAddForm = () => {
    setEditingAdminId(null);
    setFormEmail(""); setFormNama(""); setFormRole("admin_unit"); setFormUnitKerja("");
    setShowForm(true);
  };

  const openEditForm = (admin: AdminUser) => {
    setEditingAdminId(admin.id);
    setFormEmail(admin.email);
    setFormNama(admin.nama_lengkap);
    setFormRole(admin.role);
    setFormUnitKerja(admin.unit_kerja || "");
    setShowForm(true);
  };

  const handleToggle = (adminId: string, currentStatus: boolean) => {
    if (adminId === currentAdminId) {
      showToast("Tidak bisa menonaktifkan akun Anda sendiri.", "error");
      return;
    }
    setConfirmDialog({
      isOpen: true,
      title: !currentStatus ? "Aktifkan Akun Admin" : "Nonaktifkan Akun Admin",
      message: `Yakin ingin ${!currentStatus ? 'mengaktifkan' : 'menonaktifkan'} akun admin ini?`,
      confirmText: !currentStatus ? "Ya, Aktifkan" : "Ya, Nonaktifkan",
      isDestructive: currentStatus, // merah kalau dinonaktifkan
      action: () => {
        startTransition(async () => {
          const res = await toggleAdminStatus(adminId, !currentStatus);
          if (res.success) {
            setAdmins((prev) =>
              prev.map((a) => (a.id === adminId ? { ...a, is_active: !currentStatus } : a))
            );
            showToast(`Status admin berhasil ${!currentStatus ? "diaktifkan" : "dinonaktifkan"}.`, "success");
          } else {
            showToast(res.error ?? "Gagal mengubah status.", "error");
          }
          setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
        });
      }
    });
  };

  const handleDelete = (adminId: string) => {
    if (adminId === currentAdminId) {
      showToast("Tidak bisa menghapus akun Anda sendiri.", "error");
      return;
    }
    setConfirmDialog({
      isOpen: true,
      title: "Hapus Akun Admin",
      message: "Yakin ingin menghapus admin ini secara permanen? Aksi ini tidak dapat dibatalkan.",
      confirmText: "Hapus Permanen",
      isDestructive: true,
      action: () => {
        startTransition(async () => {
          const res = await deleteAdminUser(adminId);
          if (res.success) {
            setAdmins((prev) => prev.filter((a) => a.id !== adminId));
            showToast("Admin berhasil dihapus.", "success");
          } else {
            showToast(res.error ?? "Gagal menghapus admin.", "error");
          }
          setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
        });
      }
    });
  };

  const handleRoleChange = (adminId: string, newRole: AdminRole) => {
    startTransition(async () => {
      const res = await updateAdminRole(adminId, newRole);
      if (res.success) {
        setAdmins((prev) =>
          prev.map((a) => (a.id === adminId ? { ...a, role: newRole } : a))
        );
        showToast("Role admin berhasil diperbarui.", "success");
      } else {
        showToast(res.error ?? "Gagal mengubah role.", "error");
      }
    });
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "Belum pernah login";
    return new Intl.DateTimeFormat("id-ID", {
      day: "numeric", month: "short", year: "numeric",
      hour: "2-digit", minute: "2-digit",
    }).format(new Date(dateStr));
  };

  return (
    <div className="space-y-6">
      {/* Form Tambah Admin */}
      {/* Form Tambah Admin Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl w-full max-w-xl shadow-2xl animate-in zoom-in-95 duration-200 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between p-6 border-b border-[var(--color-border)] shrink-0">
              <h2 className="text-xl font-bold text-[var(--color-text)]">
                {editingAdminId ? "Edit Admin" : "Tambah Admin Baru"}
              </h2>
              <button
                onClick={() => setShowForm(false)}
                className="text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors p-1 rounded-lg hover:bg-[var(--color-bg-secondary)]"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveAdmin} className="p-6 space-y-4 overflow-y-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5 sm:col-span-1">
                  <label className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wide">
                    Role
                  </label>
                  <select
                    value={formRole}
                    onChange={(e) => setFormRole(e.target.value as AdminRole)}
                    className="w-full px-4 py-2.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text)] text-sm focus:ring-2 focus:ring-emerald-500/40 outline-none transition-all"
                  >
                    {ALL_ROLES.map((r) => (
                      <option key={r} value={r}>
                        {ROLE_META[r].icon} {ROLE_META[r].label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5 sm:col-span-1">
                  <label className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wide">
                    Email (Akun Google)
                  </label>
                  <input
                    type="email"
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                    placeholder="admin@gmail.com"
                    required
                    disabled={!!editingAdminId}
                    className="w-full px-4 py-2.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text)] text-sm focus:ring-2 focus:ring-emerald-500/40 outline-none transition-all disabled:opacity-60 disabled:bg-slate-100 dark:disabled:bg-slate-800"
                  />
                  {editingAdminId && <p className="text-[10px] text-[var(--color-text-subtle)] mt-1">Email tidak dapat diubah karena merupakan ID Akun Google.</p>}
                </div>
                <div className="space-y-1.5 sm:col-span-2">
                  <label className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wide">
                    Nama Lengkap
                  </label>
                  <input
                    type="text"
                    value={formNama}
                    onChange={(e) => setFormNama(e.target.value)}
                    placeholder="Ahmad Fauzi"
                    required
                    className="w-full px-4 py-2.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text)] text-sm focus:ring-2 focus:ring-emerald-500/40 outline-none transition-all"
                  />
                </div>
                {formRole === "admin_unit" && (
                  <div className="space-y-1.5 sm:col-span-2">
                    <label className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wide">
                      Unit Kerja (Fakultas / Pascasarjana)
                    </label>
                    <select
                      value={formUnitKerja}
                      onChange={(e) => setFormUnitKerja(e.target.value)}
                      required
                      className="w-full px-4 py-2.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text)] text-sm focus:ring-2 focus:ring-emerald-500/40 outline-none transition-all"
                    >
                      <option value="" disabled>Pilih Unit Kerja</option>
                      {fakultasList.map((fakultas) => (
                        <option key={fakultas} value={fakultas}>{fakultas}</option>
                      ))}
                      {!fakultasList.includes("Pascasarjana") && <option value="Pascasarjana">Pascasarjana</option>}
                    </select>
                  </div>
                )}
              </div>
              <div className="flex items-center justify-end gap-3 pt-6 mt-6 border-t border-[var(--color-border)]">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-5 py-2.5 rounded-xl text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-bg-secondary)] text-sm font-semibold transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={formLoading}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white text-sm font-semibold transition-colors shadow-md shadow-emerald-900/20"
                >
                  {formLoading ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                  {formLoading ? "Menyimpan..." : "Simpan Admin"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Tabel Admin */}
      <div className="bg-transparent md:bg-[var(--color-surface)] md:rounded-2xl border-none md:border md:border-[var(--color-border)] shadow-none md:shadow-sm overflow-hidden flex flex-col gap-4 md:gap-0">
        <div className="overflow-x-auto hidden md:block">
          <table className="w-full text-sm">
            <thead className="bg-[var(--color-bg-secondary)] border-b border-[var(--color-border)]">
              <tr>
                <th className="px-6 py-4 font-normal text-[var(--color-text-muted)]">Admin</th>
                <th className="px-6 py-4 font-normal text-[var(--color-text-muted)]">Email</th>
                <th className="px-6 py-4 font-normal text-[var(--color-text-muted)]">Role</th>
                <th className="px-6 py-4 font-normal text-[var(--color-text-muted)]">Fakultas</th>
                <th className="px-6 py-4 font-normal text-[var(--color-text-muted)]">Status</th>
                <th className="px-6 py-4 font-normal text-[var(--color-text-muted)] hidden lg:table-cell">Login Terakhir</th>
                {currentAdminRole === "superadmin" && (
                  <th className="px-6 py-4 font-normal text-[var(--color-text-muted)] text-right">Aksi</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-border)]">
              {admins.map((admin) => {
                const meta = ROLE_META[admin.role as AdminRole] ?? ROLE_META.admin_unit;
                return (
                  <tr key={admin.id} className="hover:bg-[var(--color-bg-secondary)] transition-colors">
                    {/* Info Admin */}
                    <td className="px-6 py-4">
                      <div className="font-semibold text-[var(--color-text)] flex items-center gap-2">
                        {admin.nama_lengkap}
                        {admin.id === currentAdminId && (
                          <span className="text-[10px] uppercase font-black tracking-wider px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400">
                            Anda
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Email */}
                    <td className="px-6 py-4">
                      <span className="text-xs font-medium text-[var(--color-text-muted)] flex items-center gap-1.5">
                        <Mail size={12} className="opacity-50" />
                        {admin.email}
                      </span>
                    </td>

                    {/* Role */}
                    <td className="px-6 py-4">
                      {currentAdminRole === "superadmin" && admin.id !== currentAdminId ? (
                        <select
                          value={admin.role}
                          onChange={(e) => handleRoleChange(admin.id, e.target.value as AdminRole)}
                          disabled={isPending}
                          className="text-xs font-semibold px-2.5 py-1 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text)] cursor-pointer focus:ring-1 focus:ring-emerald-500/40 outline-none"
                        >
                          {ALL_ROLES.map((r) => (
                            <option key={r} value={r}>
                              {ROLE_META[r].icon} {ROLE_META[r].label}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-lg ${meta.color}`}>
                          <span>{meta.icon}</span>
                          {meta.label}
                        </span>
                      )}
                    </td>

                    {/* Fakultas */}
                    <td className="px-6 py-4">
                      {admin.unit_kerja ? (
                        <span className="text-xs font-medium px-2.5 py-1 rounded-md border border-[var(--color-border)] bg-[var(--color-bg-secondary)] text-[var(--color-text-muted)] whitespace-nowrap">
                          {admin.unit_kerja}
                        </span>
                      ) : (
                        <span className="text-xs text-[var(--color-text-subtle)]">-</span>
                      )}
                    </td>

                    {/* Status */}
                    <td className="px-6 py-4">
                      {currentAdminRole === "superadmin" && admin.id !== currentAdminId ? (
                        <button
                          onClick={() => handleToggle(admin.id, admin.is_active)}
                          disabled={isPending}
                          className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-lg transition-all hover:scale-105 active:scale-95 cursor-pointer ${admin.is_active
                            ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-200 dark:hover:bg-emerald-900/50"
                            : "bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 hover:bg-rose-200 dark:hover:bg-rose-900/50"
                            } ${isPending ? "opacity-60 cursor-not-allowed" : ""}`}
                          title={admin.is_active ? "Klik untuk menonaktifkan" : "Klik untuk mengaktifkan"}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${admin.is_active ? "bg-emerald-500" : "bg-rose-500"}`} />
                          {admin.is_active ? "Aktif" : "Nonaktif"}
                        </button>
                      ) : (
                        <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-lg ${admin.is_active
                          ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400"
                          : "bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400"
                          } ${admin.id === currentAdminId ? "opacity-60" : ""}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${admin.is_active ? "bg-emerald-500" : "bg-rose-500"}`} />
                          {admin.is_active ? "Aktif" : "Nonaktif"}
                        </span>
                      )}
                    </td>

                    {/* Last Login */}
                    <td className="px-6 py-4 hidden lg:table-cell">
                      <span className="text-xs text-[var(--color-text-muted)]">
                        {formatDate(admin.last_login)}
                      </span>
                    </td>

                    {/* Aksi */}
                    {currentAdminRole === "superadmin" && (
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => openEditForm(admin)}
                            disabled={isPending}
                            title="Edit admin"
                            className="p-1.5 rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors text-[var(--color-text-muted)] hover:text-emerald-600 dark:hover:text-emerald-400 disabled:opacity-40 disabled:cursor-not-allowed"
                          >
                            <Edit2 size={15} />
                          </button>
                          <button
                            onClick={() => handleDelete(admin.id)}
                            disabled={isPending || admin.id === currentAdminId}
                            title="Hapus admin"
                            className="p-1.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-colors text-[var(--color-text-muted)] hover:text-rose-600 dark:hover:text-rose-400 disabled:opacity-40 disabled:cursor-not-allowed"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>

          {admins.length === 0 && (
            <div className="text-center py-16 text-[var(--color-text-muted)]">
              <ShieldAlert size={32} className="mx-auto mb-3 opacity-40" />
              <p className="text-sm">Belum ada admin terdaftar.</p>
            </div>
          )}
        </div>

        {/* Mobile Card View */}
        <div className="grid grid-cols-1 gap-4 md:hidden pb-24">
          {admins.length === 0 ? (
            <div className="text-center py-16 text-[var(--color-text-muted)]">
              <ShieldAlert size={32} className="mx-auto mb-3 opacity-40" />
              <p className="text-sm">Belum ada admin terdaftar.</p>
            </div>
          ) : (
            admins.map((admin) => {
              const meta = ROLE_META[admin.role as AdminRole] ?? ROLE_META.admin_unit;
              return (
                <div key={admin.id} className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl p-4 shadow-sm flex flex-col gap-3 relative">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex flex-col">
                      <div className="font-bold text-[var(--color-text)] flex items-center gap-2">
                        {admin.nama_lengkap}
                        {admin.id === currentAdminId && (
                          <span className="text-[10px] uppercase font-black tracking-wider px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400">
                            Anda
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] font-bold text-[var(--color-text-muted)] mt-0.5 flex items-center gap-1">
                        <Mail size={10} className="opacity-50" />
                        {admin.email}
                      </span>
                    </div>
                    {/* Role */}
                    <div className="shrink-0">
                      {currentAdminRole === "superadmin" && admin.id !== currentAdminId ? (
                        <select
                          value={admin.role}
                          onChange={(e) => handleRoleChange(admin.id, e.target.value as AdminRole)}
                          disabled={isPending}
                          className="text-[10px] font-bold tracking-wider uppercase px-2 py-1 rounded-md border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text)] cursor-pointer focus:ring-1 focus:ring-emerald-500/40 outline-none"
                        >
                          {ALL_ROLES.map((r) => (
                            <option key={r} value={r}>
                              {ROLE_META[r].label}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-bold tracking-wider uppercase ${meta.color}`}>
                          <span>{meta.icon}</span>
                          {meta.label}
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-6 mt-1">
                    <div>
                      <span className="block text-[10px] text-[var(--color-text-muted)] uppercase tracking-wider mb-0.5">Fakultas</span>
                      {admin.unit_kerja ? (
                        <span className="text-xs font-bold text-[var(--color-text)] bg-[var(--color-surface)] px-2 py-1 rounded-md border border-[var(--color-border)] inline-block">
                          {admin.unit_kerja}
                        </span>
                      ) : (
                        <span className="text-xs text-[var(--color-text-subtle)]">-</span>
                      )}
                    </div>
                    <div>
                      <span className="block text-[10px] text-[var(--color-text-muted)] uppercase tracking-wider mb-0.5">Status</span>
                      {currentAdminRole === "superadmin" && admin.id !== currentAdminId ? (
                        <button
                          onClick={() => handleToggle(admin.id, admin.is_active)}
                          disabled={isPending}
                          className={`inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-md transition-all hover:scale-105 active:scale-95 cursor-pointer ${admin.is_active
                            ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-200 dark:hover:bg-emerald-900/50"
                            : "bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 hover:bg-rose-200 dark:hover:bg-rose-900/50"
                            } ${isPending ? "opacity-60 cursor-not-allowed" : ""}`}
                          title={admin.is_active ? "Klik untuk menonaktifkan" : "Klik untuk mengaktifkan"}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${admin.is_active ? "bg-emerald-500" : "bg-rose-500"}`} />
                          {admin.is_active ? "Aktif" : "Nonaktif"}
                        </button>
                      ) : (
                        <span className={`inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-md ${admin.is_active
                          ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400"
                          : "bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400"
                          } ${admin.id === currentAdminId ? "opacity-60" : ""}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${admin.is_active ? "bg-emerald-500" : "bg-rose-500"}`} />
                          {admin.is_active ? "Aktif" : "Nonaktif"}
                        </span>
                      )}
                    </div>
                  </div>

                  {currentAdminRole === "superadmin" && (
                    <div className="flex items-center justify-end gap-2 mt-2 pt-3 border-t border-[var(--color-border)]">
                      <button
                        onClick={() => openEditForm(admin)}
                        disabled={isPending}
                        title="Edit admin"
                        className="w-8 h-8 flex items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-500 hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button
                        onClick={() => handleDelete(admin.id)}
                        disabled={isPending || admin.id === currentAdminId}
                        title="Hapus admin"
                        className="w-8 h-8 flex items-center justify-center rounded-lg bg-rose-50 dark:bg-rose-900/20 text-rose-500 hover:bg-rose-100 dark:hover:bg-rose-900/40 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>


      {/* Floating Action Button (Tambah Admin) */}
      {currentAdminRole === "superadmin" && (
        <div className="fixed bottom-24 right-4 md:bottom-8 md:right-8 z-50">
          <button
            onClick={openAddForm}
            className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-full w-14 h-14 flex items-center justify-center shadow-[0_8px_30px_rgb(0,0,0,0.12)] shadow-emerald-600/30 transition-transform hover:scale-105 active:scale-95"
            title="Tambah Admin"
          >
            <UserPlus size={24} />
          </button>
        </div>
      )}

      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        onClose={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))}
        onConfirm={() => confirmDialog.action && confirmDialog.action()}
        title={confirmDialog.title}
        message={confirmDialog.message}
        confirmText={confirmDialog.confirmText}
        isDestructive={confirmDialog.isDestructive}
        isLoading={isPending}
      />
    </div>
  );
}
