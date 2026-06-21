import { getWisudawanByNim } from "@/actions/wisudawan";
import { getActivePeriode } from "@/actions/periode";
import { getSetting } from "@/actions/settings";
import ClientProfile from "./ClientProfile";
import { notFound } from "next/navigation";

export default async function Page({ params }: { params: Promise<{ nim: string }> }) {
  const resolvedParams = await params;
  const nim = resolvedParams.nim;
  
  const [data, activePeriode, allowEditTogaSetting, allowEditProfileSetting, showTogaInfoSetting, showUndanganInfoSetting, allowPerbaikanSetting, showPrestasiCardSetting] = await Promise.all([
    getWisudawanByNim(nim),
    getActivePeriode(),
    getSetting('allow_edit_toga', 'true', true),
    getSetting('allow_edit_profile', 'true', true),
    getSetting('show_toga_info', 'true', true),
    getSetting('show_undangan_info', 'true', true),
    getSetting('allow_perbaikan', 'true', true),
    getSetting('show_prestasi_card', 'true', true)
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

  return <ClientProfile nim={nim} w={data as any} activePeriode={activePeriode} allowEditToga={allowEditToga} allowEditProfile={allowEditProfile} showTogaInfo={showTogaInfo} showUndanganInfo={showUndanganInfo} allowPerbaikan={allowPerbaikan} showPrestasiCard={showPrestasiCard} />;
}
