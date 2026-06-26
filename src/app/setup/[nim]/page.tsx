import { getWisudawanByNim } from "@/actions/wisudawan";
import { notFound, redirect } from "next/navigation";
import SetupClient from "./SetupClient";
import { getWisudawanSession } from "@/actions/wisudawan";

export default async function SetupPage({ params }: { params: Promise<{ nim: string }> }) {
  const { nim } = await params;
  const decodedNim = decodeURIComponent(nim);

  // ── Verifikasi sesi ──
  const session = await getWisudawanSession();
  if (!session) {
    // Tidak ada sesi → arahkan ke login
    redirect(`/auth?reason=unauthenticated`);
  }
  if (session.nim !== decodedNim) {
    // Bukan milik NIM ini
    redirect(`/setup/${session.nim}`);
  }
  if (!session.isDefaultPassword) {
    // Sudah pernah setup akun (password bukan default) → langsung ke profil
    redirect(`/wisudawan/${session.nim}`);
  }

  const data = await getWisudawanByNim(decodedNim, true);
  if (!data) return notFound();

  return <SetupClient nim={decodedNim} nama={(data as any)["NAMA MAHASISWA"] || decodedNim} initialToga={(data as any)["TOGA"] || ""} />;
}

