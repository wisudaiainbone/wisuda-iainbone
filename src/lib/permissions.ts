/**
 * Sistem Permission & Role Admin
 * 
 * Definisi 4 role dengan akses yang berbeda-beda:
 * - superadmin     : Akses penuh ke seluruh fitur
 * - admin_institut : Akses fitur utama (wisudawan, pengaturan) — level institusi
 * - admin_unit     : Akses data wisudawan terbatas — level unit/fakultas
 * - admin_absensi  : Akses khusus presensi wisudawan
 */

export type AdminRole =
  | 'superadmin'
  | 'admin_institut'
  | 'admin_unit'
  | 'admin_absensi';

/**
 * Metadata tampilan untuk setiap role.
 */
export const ROLE_META: Record<AdminRole, {
  label: string;
  description: string;
  color: string; // kelas CSS untuk badge warna
  icon: string;  // emoji/ikon pendek
}> = {
  superadmin: {
    label: 'Superadmin',
    description: 'Akses penuh ke seluruh sistem',
    color: 'bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300',
    icon: '👑',
  },
  admin_institut: {
    label: 'Admin Institut',
    description: 'Akses pengelolaan wisuda tingkat institusi',
    color: 'bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300',
    icon: '🏛️',
  },
  admin_unit: {
    label: 'Admin Unit',
    description: 'Akses data wisudawan tingkat unit/fakultas',
    color: 'bg-sky-100 dark:bg-sky-900/40 text-sky-700 dark:text-sky-300',
    icon: '🏫',
  },
  admin_absensi: {
    label: 'Admin Absensi',
    description: 'Akses pencatatan kehadiran wisudawan',
    color: 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300',
    icon: '✅',
  },
};

/**
 * Daftar rute yang DIIZINKAN per role.
 * Format: string path prefix. '*' berarti semua rute.
 * 
 * Aturan:
 * - Semua role selalu bisa akses `/admin` (beranda dashboard)
 * - Rute yang tidak ada di daftar → redirect ke `/admin` (forbidden)
 */
export const ROLE_ALLOWED_ROUTES: Record<AdminRole, string[]> = {
  superadmin: ['*', '/admin/fakultas'], // semua rute diizinkan

  admin_institut: [
    '/admin',
    '/admin/wisudawan',
    '/admin/pengaturan',
    '/admin/periode',
    '/admin/toga',
    '/admin/tamu',
    '/admin/informasi',
  ],

  admin_unit: [
    '/admin',
    '/admin/wisudawan',
    '/admin/toga',
    '/admin/prestasi',
    '/admin/perbaikan',
    '/admin/informasi',
  ],

  admin_absensi: [
    '/admin',
    '/admin/absensi',
    '/admin/informasi',
  ],
};

/**
 * Cek apakah role tertentu diizinkan mengakses suatu pathname.
 */
export function isRouteAllowed(role: AdminRole, pathname: string): boolean {
  const allowed = ROLE_ALLOWED_ROUTES[role];

  // Superadmin atau wildcard: izinkan semua
  if (allowed.includes('*')) return true;

  // Cek apakah pathname dimulai dengan salah satu rute yang diizinkan
  // Tepat cocok atau merupakan sub-rute (misal /admin/wisudawan/123)
  return allowed.some((route) => {
    if (route === '/admin') {
      // Untuk beranda, hanya cocokkan persis /admin saja
      return pathname === '/admin';
    }
    return pathname === route || pathname.startsWith(route + '/');
  });
}

/**
 * Cek apakah role dapat mengelola admin lain (halaman manajemen-admin).
 */
export function canManageAdmins(role: AdminRole): boolean {
  return role === 'superadmin';
}

/**
 * Cek apakah role dapat mengelola periode wisuda.
 */
export function canManagePeriode(role: AdminRole): boolean {
  return role === 'superadmin' || role === 'admin_institut';
}

/**
 * Cek apakah role dapat mengubah pengaturan sistem.
 */
export function canManagePengaturan(role: AdminRole): boolean {
  return role === 'superadmin' || role === 'admin_institut';
}

/**
 * Cek apakah role dapat melihat & mengelola data wisudawan.
 */
export function canManageWisudawan(role: AdminRole): boolean {
  return role === 'superadmin' || role === 'admin_institut' || role === 'admin_unit';
}

/**
 * Cek apakah role dapat mengelola data Toga.
 */
export function canManageToga(role: AdminRole): boolean {
  return role === 'superadmin' || role === 'admin_institut' || role === 'admin_unit';
}

/**
 * Cek apakah role dapat mengelola data Tamu.
 */
export function canManageTamu(role: AdminRole): boolean {
  return role === 'superadmin' || role === 'admin_institut';
}

/**
 * Cek apakah role dapat melakukan absensi.
 */
export function canDoAbsensi(role: AdminRole): boolean {
  return role === 'superadmin' || role === 'admin_absensi';
}

/**
 * Cek apakah role dapat mengelola master data Fakultas/Prodi.
 */
export function canManageFakultas(role: AdminRole): boolean {
  return role === 'superadmin';
}

/**
 * Cek apakah role dapat melihat halaman Informasi wisuda.
 */
export function canViewInformasi(role: AdminRole): boolean {
  return true; // semua role bisa melihat informasi wisuda
}

/**
 * Semua nilai role yang valid — digunakan untuk validasi form & dropdown.
 */
export const ALL_ROLES: AdminRole[] = [
  'superadmin',
  'admin_institut',
  'admin_unit',
];
