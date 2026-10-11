export type ArsipWisudawan = {
  nim: string;
  nama_mahasiswa: string | null;
  ipk: string | null;
  predikat: string | null;
  fakultas: string | null;
  prodi: string | null;
  toga: string | null;
  tanggal_yudisium: string | null;
  periode: string | null;
  status: string | null;
  sesi: string | null;
  email: string | null;
  password: string | null;
  timestamp: string | null;
  terdaftar: string | null;
  id_wisuda: string | null;
  ttl: string | null;
  judul_skripsi: string | null;
  jenis_kelamin: string | null;
  ormawa: string | null;
  jabatan_dalam_ormawa: string | null;
  foto: string | null;
  sertifikat: string | null;
  nama_gelar: string | null;
  prodi_singkat: string | null;
  qr_toga: string | null;
  id_undangan: string | null;
  qr_undangan: string | null;
  urut: string | null;
  waktu_toga: string | null;
  waktu_hadir: string | null;
  prestasi_akd: string | null;
  prestasi_org: string | null;
  survei: string | null;
  log_status: any;
  prestasi_prodi: string | null;
  status_periode: string | null;
};

export const ARSIP_HEADERS = [
  'nim', 'nama_mahasiswa', 'ipk', 'predikat', 'fakultas', 'prodi',
  'toga', 'tanggal_yudisium', 'periode', 'status', 'sesi', 'email',
  'password', 'timestamp', 'terdaftar', 'id_wisuda', 'ttl', 'judul_skripsi',
  'jenis_kelamin', 'ormawa', 'jabatan_dalam_ormawa', 'foto', 'sertifikat',
  'nama_gelar', 'prodi_singkat', 'qr_toga', 'id_undangan', 'qr_undangan',
  'urut', 'waktu_toga', 'waktu_hadir', 'prestasi_akd', 'prestasi_org',
  'survei', 'log_status', 'prestasi_prodi', 'status_periode'
];

export function mapRowToColumns(w: ArsipWisudawan): string[] {
  return [
    w.nim ?? '',
    w.nama_mahasiswa ?? '',
    w.ipk ?? '',
    w.predikat ?? '',
    w.fakultas ?? '',
    w.prodi ?? '',
    w.toga ?? '',
    w.tanggal_yudisium ?? '',
    w.periode ?? '',
    w.status ?? '',
    w.sesi ?? '',
    w.email ?? '',
    w.password ?? '',
    w.timestamp ?? '',
    w.terdaftar ?? '',
    w.id_wisuda ?? '',
    w.ttl ?? '',
    w.judul_skripsi ?? '',
    w.jenis_kelamin ?? '',
    w.ormawa ?? '',
    w.jabatan_dalam_ormawa ?? '',
    w.foto ?? '',
    w.sertifikat ?? '',
    w.nama_gelar ?? '',
    w.prodi_singkat ?? '',
    w.qr_toga ?? '',
    w.id_undangan ?? '',
    w.qr_undangan ?? '',
    w.urut ?? '',
    w.waktu_toga ?? '',
    w.waktu_hadir ?? '',
    w.prestasi_akd ?? '',
    w.prestasi_org ?? '',
    w.survei ?? '',
    typeof w.log_status === 'string' ? w.log_status : JSON.stringify(w.log_status ?? []),
    w.prestasi_prodi ?? '',
    w.status_periode ?? ''
  ];
}