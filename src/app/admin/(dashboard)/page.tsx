import { getDashboardStats } from '@/actions/dashboard';
import { getAllPeriode } from '@/actions/periode';
import { getAdminSession } from '@/actions/adminAuth';
import DashboardClient from './DashboardClient';

export const revalidate = 900;

type PageProps = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }> | { [key: string]: string | string[] | undefined };
};

export default async function AdminDashboardPage(props: PageProps) {
  const searchParams = await props.searchParams;
  const periode = typeof searchParams?.periode === 'string' ? searchParams.periode : undefined;

  const [stats, allPeriode, adminSession] = await Promise.all([
    getDashboardStats(periode),
    getAllPeriode(),
    getAdminSession(),
  ]);

  const periodeOptions = allPeriode.map(p => ({ id: p.id, nama: p.nama_periode }));

  return (
    <DashboardClient
      stats={stats}
      periodeOptions={periodeOptions}
      selectedPeriode={periode}
      viewBy="fakultas"
      adminName={adminSession?.nama ?? 'Admin'}
    />
  );
}
