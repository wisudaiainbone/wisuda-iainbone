import { getWisudawanByNim } from "@/actions/wisudawan";
import { getActivePeriode } from "@/actions/periode";
import { getSetting } from "@/actions/settings";
import ClientProfile from "./ClientProfile";
import { notFound, redirect } from "next/navigation";
import { getWisudawanSession } from "@/actions/wisudawan";
import { getToken } from "next-auth/jwt";
import { headers } from "next/headers";

export default async function Page({ params }: { params: Promise<{ nim: string }> }) {
  const resolvedParams = await params;
  const nim = resolvedParams.nim;
  const decodedNim = decodeURIComponent(nim);

  // ── Verifikasi sesi (defense-in-depth di samping middleware) ──
  // Admin bypass: cek apakah ada admin session NextAuth aktif
  // Karena getToken butuh req object, kita andalkan middleware sebagai garis pertama.
  // Di sini kita cek session wisudawan sebagai lapisan kedua.
  const session = await getWisudawanSession();
  if (!session) {
    // Tidak ada sesi wisudawan → redirect ke halaman login
    redirect(`/auth?callbackUrl=/wisudawan/${encodeURIComponent(decodedNim)}&reason=unauthenticated`);
  }
  if (session.nim !== decodedNim) {
    // Sesi valid tapi bukan milik NIM ini → redirect ke profil sendiri
    redirect(`/wisudawan/${session.nim}`);
  }

  const [data, activePeriode, allowEditTogaSetting, allowEditProfileSetting, showTogaInfoSetting, showUndanganInfoSetting, allowPerbaikanSetting, showPrestasiCardSetting, contohFotoUrlSetting] = await Promise.all([
    getWisudawanByNim(decodedNim),
    getActivePeriode(),
    getSetting('allow_edit_toga', 'true', true),
    getSetting('allow_edit_profile', 'true', true),
    getSetting('show_toga_info', 'true', true),
    getSetting('show_undangan_info', 'true', true),
    getSetting('allow_perbaikan', 'true', true),
    getSetting('show_prestasi_card', 'true', true),
    getSetting('contoh_foto_url', '', true)
  ]);

  if (!data) {
    return notFound();
  }

  const allowEditToga = allowEditTogaSetting === 'true';
  const allowEditProfile = allowEditProfileSetting === 'true';
  const showTogaInfo = showTogaInfoSetting === 'true';
  const showUndanganInfo = showUndanganInfoSetting === 'true';
  const allowPerbaikan = allowPerbaikanSetting === 'true';
  const showPrestasiCard = showPrestasiCardSetting === 'true';
  const contohFotoUrl = contohFotoUrlSetting;

  return <ClientProfile nim={nim} w={data as any} activePeriode={activePeriode} allowEditToga={allowEditToga} allowEditProfile={allowEditProfile} showTogaInfo={showTogaInfo} showUndanganInfo={showUndanganInfo} allowPerbaikan={allowPerbaikan} showPrestasiCard={showPrestasiCard} contohFotoUrl={contohFotoUrl as string} />;
}

