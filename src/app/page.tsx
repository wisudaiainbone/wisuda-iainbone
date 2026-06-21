import { Navbar } from "@/components/layout/Navbar";
import { HeroSection } from "@/components/sections/HeroSection";
import { getAllPeriode } from "@/actions/periode";

export default async function HomePage() {
  const allPeriode = await getAllPeriode();
  
  // Transform to match Period[] format for HeroSection
  const graduationPeriods = allPeriode.map(p => ({
    id: p.id,
    title: p.nama_periode,
    status: p.status,
    date: p.tanggal_pelaksanaan?.split(', ')[1] || '',
    day: p.tanggal_pelaksanaan?.split(', ')[0] || '',
    location: p.tempat_pelaksanaan?.split(', ')[1] || '',
    venue: p.tempat_pelaksanaan?.split(', ')[0] || '',
    session1: p.waktu_sesi_1,
    session2: p.waktu_sesi_2,
    registrationDateLabel: p.tanggal_pendaftaran,
    gladi: p.jadwal_gladi,
    pengumuman: p.pengumuman,
    hint_pendaftaran: p.hint_pendaftaran,
    stats: p.stats,
    wagLink: p.wagLink,
    themeImage: p.themeImage,
    statusColor: p.statusColor
  })).sort((a, b) => {
    if (a.status === 'Sedang Dibuka' && b.status !== 'Sedang Dibuka') return -1;
    if (a.status !== 'Sedang Dibuka' && b.status === 'Sedang Dibuka') return 1;
    return 0;
  });

  return (
    <div className="landing-page">
      <Navbar />
      <main className="section-page">
        <HeroSection graduationPeriods={graduationPeriods as any} />
      </main>
    </div>
  );
}
