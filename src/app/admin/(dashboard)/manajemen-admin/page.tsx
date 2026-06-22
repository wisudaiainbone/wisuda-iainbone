import { getAdminUsers } from "@/actions/adminUsers";
import { getAdminSession } from "@/actions/adminAuth";
import { getProdiList } from "@/actions/prodi";
import { redirect } from "next/navigation";
import ManajemenAdminClient from "./ManajemenAdminClient";

export const metadata = {
  title: "Admin — Portal Wisuda IAIN Bone",
  description: "Kelola daftar akun admin sistem wisuda IAIN Bone.",
};

export default async function ManajemenAdminPage() {
  const session = await getAdminSession();

  // Hanya superadmin yang boleh akses halaman ini
  if (!session || session.role !== "superadmin") {
    redirect("/admin");
  }

  const [admins, prodiList] = await Promise.all([
    getAdminUsers(),
    getProdiList()
  ]);
  const fakultasList = Array.from(new Set(prodiList.map(p => p.fakultas))).sort();

  return (
    <ManajemenAdminClient
      initialAdmins={admins}
      currentAdminId={session.id}
      currentAdminRole={session.role}
      fakultasList={fakultasList}
    />
  );
}
