import { redirect } from "next/navigation";
import { cekAdminSudahAda } from "@/actions/setup";
import SetupClient from "./SetupClient";

export const metadata = {
  title: "Setup Admin — Portal Wisuda IAIN Bone",
  description: "Buat akun superadmin pertama untuk mengakses dashboard admin.",
};

export default async function SetupPage() {
  // Jika sudah ada admin, jangan tampilkan form setup
  // Redirect langsung ke halaman login
  const sudahAda = await cekAdminSudahAda();
  if (sudahAda) {
    redirect("/admin/login");
  }

  return <SetupClient />;
}
