"use client";
import React from "react";

import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Image,
  Font,
} from "@react-pdf/renderer";

Font.registerHyphenationCallback((word) => [word]);

export type TamuItem = {
  id: string;
  nama: string;
  jabatan: string;
  alamat: string;
  sesi: string;
  qr_code?: string;
};

type Props = {
  data: TamuItem[];
  settings: {
    bgDepanUrl: string;
    bgBelakangUrl: string;
    ttdUrl: string;
    nomor: string;
    tanggal: string;
    jabatan: string;
    nama: string;
    nip: string;
    acara: string;
  };
  periode: string;
};

// Ukuran kertas A4 Landscape
const A4_LANDSCAPE: [number, number] = [841.89, 595.28];

const styles = StyleSheet.create({
  page: {
    position: "relative",
    width: "100%",
    height: "100%",
    backgroundColor: "#ffffff",
  },
  bgContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: "100%",
    height: "100%",
    zIndex: -1,
  },
  backgroundImage: {
    width: "100%",
    height: "100%",
  },
  rowContainer: {
    flexDirection: "row",
    width: "100%",
    height: "100%",
  },
  leftColumn: {
    width: "50%",
    height: "100%",
    padding: 60,
    alignItems: "center",
    justifyContent: "center",
  },
  rightColumn: {
    width: "50%",
    height: "100%",
    padding: 60,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  qrCodeLarge: {
    width: 140,
    height: 140,
    marginBottom: 20,
  },
  qrText: {
    fontFamily: "Times-Bold",
    fontSize: 12,
    textAlign: "center",
    lineHeight: 1.5,
  },
  titleRight: {
    fontFamily: "Times-Bold",
    fontSize: 22,
    textAlign: "center",
    marginBottom: 8,
  },
  subtitleRight: {
    fontFamily: "Times-Bold",
    fontSize: 14,
    textAlign: "center",
    marginBottom: 8,
    letterSpacing: 1,
  },
  periodeRight: {
    fontFamily: "Times-Roman",
    fontSize: 12,
    textAlign: "center",
    marginBottom: 20,
  },
  infoRight: {
    fontFamily: "Times-Roman",
    fontSize: 12,
    textAlign: "center",
    marginBottom: 4,
  },
  tujuanBlockRight: {
    alignItems: "center",
    marginTop: 80,
  },
  footerRight: {
    fontFamily: "Times-Roman",
    fontSize: 11,
    textAlign: "center",
    position: "absolute",
    bottom: 40,
    left: 0,
    right: 0,
  },
  logoImageRight: {
    width: 60,
    height: 60,
    marginBottom: 15,
  },
  // HALAMAN 2
  colLeft: {
    width: "50%",
    height: "100%",
    paddingTop: 60,
    paddingBottom: 40,
    paddingLeft: 50,
    paddingRight: 30,
    justifyContent: "center",
  },
  colRight: {
    width: "50%",
    height: "100%",
    paddingTop: 60,
    paddingBottom: 40,
    paddingLeft: 30,
    paddingRight: 50,
    justifyContent: "flex-start", // Susunan acara mulai dari atas
  },
  suratLogo: {
    width: 40,
    height: 40,
    alignSelf: "center",
    marginBottom: 10,
  },
  suratTitle: {
    fontFamily: "Times-Bold",
    fontSize: 16,
    textAlign: "center",
    marginBottom: 4,
  },
  suratSubtitle: {
    fontFamily: "Times-Bold",
    fontSize: 14,
    textAlign: "center",
    marginBottom: 4,
  },
  suratPeriode: {
    fontFamily: "Times-Bold",
    fontSize: 12,
    textAlign: "center",
    marginBottom: 2,
  },
  suratNomor: {
    fontFamily: "Times-Roman",
    fontSize: 12,
    textAlign: "center",
    marginBottom: 15,
  },
  suratSalam: {
    fontFamily: "Times-BoldItalic",
    fontSize: 12,
    textAlign: "center",
    marginBottom: 8,
  },
  suratBody: {
    fontFamily: "Times-Roman",
    fontSize: 12,
    textAlign: "center",
    lineHeight: 1.5,
    marginBottom: 10,
  },
  suratJadwalRow: {
    flexDirection: "row",
    marginBottom: 3,
    paddingLeft: 20,
  },
  suratJadwalLabel: {
    fontFamily: "Times-Bold",
    fontSize: 12,
    width: 80,
  },
  suratJadwalValue: {
    fontFamily: "Times-Bold",
    fontSize: 12,
    flex: 1,
  },
  suratSalamPenutup: {
    fontFamily: "Times-BoldItalic",
    fontSize: 12,
    textAlign: "center",
    marginTop: 10,
    marginBottom: 15,
  },
  suratTgl: {
    fontFamily: "Times-Roman",
    fontSize: 12,
    textAlign: "center",
    marginBottom: 15,
  },
  suratTtdContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 20,
  },
  suratTtdBlock: {
    alignItems: "center",
    width: "45%",
  },
  suratTtdJabatan: {
    fontFamily: "Times-Roman",
    fontSize: 12,
  },
  suratTtdImage: {
    position: "absolute",
    top: -10,
    left: -40,
    width: 200,
    height: 100,
    objectFit: "contain",
    zIndex: -1,
  },
  suratTtdNama: {
    fontFamily: "Times-Roman",
    fontSize: 12,
  },
  
  acaraTitle: {
    fontFamily: "Times-Bold",
    fontSize: 14,
    textAlign: "center",
    marginBottom: 15,
  },
  acaraText: {
    fontFamily: "Times-Roman",
    fontSize: 12,
    lineHeight: 1.8,
    marginBottom: 30,
  },
  catatanTitle: {
    fontFamily: "Times-Bold",
    fontSize: 12,
    textDecoration: "underline",
    marginBottom: 5,
  },
  catatanText: {
    fontFamily: "Times-Roman",
    fontSize: 11,
    lineHeight: 1.5,
  }
});

export default function UndanganDocument({ data, settings, periode }: Props) {
  const isBgDepanValid = settings.bgDepanUrl && settings.bgDepanUrl.startsWith('http');
  const isBgBelakangValid = settings.bgBelakangUrl && settings.bgBelakangUrl.startsWith('http');
  const isTtdValid = settings.ttdUrl && settings.ttdUrl.startsWith('http');

  return (
    <Document>
      {data.map((tamu, idx) => (
        <React.Fragment key={idx}>
          {/* HALAMAN 1: Surat Undangan */}
          <Page size={A4_LANDSCAPE} style={styles.page}>
            {isBgDepanValid && (
              <View style={styles.bgContainer}>
                <Image src={settings.bgDepanUrl} style={styles.backgroundImage} />
              </View>
            )}
            
            <View style={styles.rowContainer}>
              {/* KOLOM KIRI: QR Code */}
              <View style={styles.leftColumn}>
                <Image 
                  src={tamu.qr_code || `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${tamu.id}`} 
                  style={styles.qrCodeLarge} 
                />
                <Text style={styles.qrText}>
                  Perlihatkan Kode QR ini kepada petugas{"\n"}
                  perekaman kehadiran Wisuda IAIN Bone
                </Text>
              </View>

              {/* KOLOM KANAN: Detail Undangan */}
              <View style={styles.rightColumn}>
                <Image src="/logo.png" style={styles.logoImageRight} />
                <Text style={styles.titleRight}>UNDANGAN WISUDA</Text>
                <Text style={styles.subtitleRight}>INSTITUT AGAMA ISLAM NEGERI BONE</Text>
                <Text style={styles.periodeRight}>{periode}</Text>

                <View style={{ marginBottom: 10, marginTop: 15, alignItems: "center" }}>
                  <Text style={styles.infoRight}>Pelaksanaan : {settings.tanggal}</Text>
                  <Text style={styles.infoRight}>Waktu : {tamu.sesi === 'Sesi Satu' ? '08:00 WITA - Selesai' : '13:00 WITA - Selesai'} ({tamu.sesi})</Text>
                  <Text style={styles.infoRight}>Tempat : Gedung Serbaguna IAIN Bone</Text>
                </View>

                <View style={styles.tujuanBlockRight}>
                  <Text style={{ fontFamily: "Times-Roman", fontSize: 12, marginBottom: 15 }}>Kepada Yth.</Text>
                  <Text style={{ fontFamily: "Times-Bold", fontSize: 14, marginBottom: 4, textAlign: "center" }}>{tamu.nama}</Text>
                  {tamu.jabatan && <Text style={{ fontFamily: "Times-Bold", fontSize: 12, marginBottom: 4, textAlign: "center" }}>{tamu.jabatan}</Text>}
                  <Text style={{ fontFamily: "Times-Roman", fontSize: 12, textAlign: "center" }}>Di - {tamu.alamat || "Tempat"}</Text>
                </View>

                <Text style={styles.footerRight}>Mohon maaf jika ada kesalahan nama & gelar</Text>
              </View>
            </View>
          </Page>

          {/* HALAMAN 2: Susunan Acara */}
          <Page size={A4_LANDSCAPE} style={styles.page}>
            {isBgBelakangValid && (
              <View style={styles.bgContainer}>
                <Image src={settings.bgBelakangUrl} style={styles.backgroundImage} />
              </View>
            )}
            
            <View style={styles.rowContainer}>
              {/* KOLOM KIRI: Surat Formal */}
              <View style={styles.colLeft}>
                <Image src="/logo.png" style={styles.suratLogo} />
                <Text style={styles.suratTitle}>UNDANGAN WISUDA</Text>
                <Text style={styles.suratSubtitle}>INSTITUT AGAMA ISLAM NEGERI BONE</Text>
                <Text style={styles.suratPeriode}>{periode}</Text>
                <Text style={styles.suratNomor}>Nomor : {settings.nomor}</Text>

                <Text style={styles.suratSalam}>Assalamualaikum Warahmatullahi Wabarakatuh</Text>
                
                <Text style={styles.suratBody}>
                  Rektor Institut Agama Islam Negeri Bone, mengundang dengan hormat Bapak/Ibu/Saudara(i) untuk menghadiri Wisuda Sarjana Strata Satu (S-1) dan Strata Dua (S-2) pada IAIN Bone yang Insya Allah akan dilaksanakan pada :
                </Text>

                <View style={styles.suratJadwalRow}>
                  <Text style={styles.suratJadwalLabel}>Hari/Tanggal</Text>
                  <Text style={styles.suratJadwalValue}>: {settings.tanggal}</Text>
                </View>
                <View style={styles.suratJadwalRow}>
                  <Text style={styles.suratJadwalLabel}>Waktu</Text>
                  <Text style={styles.suratJadwalValue}>: {tamu.sesi === 'Sesi Satu' ? '08:00 WITA - Selesai' : '13:00 WITA - Selesai'}</Text>
                </View>
                <View style={styles.suratJadwalRow}>
                  <Text style={styles.suratJadwalLabel}>Tempat</Text>
                  <Text style={styles.suratJadwalValue}>: Gedung Serbaguna IAIN Bone</Text>
                </View>

                <Text style={{ fontFamily: "Times-Roman", fontSize: 12, textAlign: "center", marginTop: 15 }}>
                  Demikian undangan ini, atas perhatian{"\n"}
                  dan kehadirannya diucapkan terima kasih.
                </Text>
                <Text style={styles.suratSalamPenutup}>Wassalamu alaikum Warahmatullahi Wabarakatuh</Text>

                <Text style={styles.suratTgl}>{settings.tanggal}</Text>

                {/* Karena data dinamis, kita pakai tanda tangan yang diset oleh Admin. */}
                <View style={{ alignItems: "center", marginTop: 20 }}>
                  <View style={{ alignItems: "center", width: 200 }}>
                    <Text style={styles.suratTtdJabatan}>{settings.jabatan},</Text>
                    {isTtdValid && (
                      <Image src={settings.ttdUrl} style={styles.suratTtdImage} />
                    )}
                    <View style={{ height: 60 }} />
                    <Text style={styles.suratTtdNama}>{settings.nama}</Text>
                  </View>
                </View>

              </View>

              {/* KOLOM KANAN: Susunan Acara & Catatan */}
              <View style={styles.colRight}>
                <Text style={styles.acaraTitle}>SUSUNAN ACARA</Text>
                
                <View style={{ marginBottom: 30 }}>
                  {settings.acara ? settings.acara.split('\n').filter(line => line.trim() !== "").map((line, i) => (
                    <View key={i} style={{ flexDirection: 'row', marginBottom: 4 }}>
                      <Text style={{ fontFamily: "Times-Roman", fontSize: 12, marginRight: 8 }}>•</Text>
                      <Text style={{ fontFamily: "Times-Roman", fontSize: 12, lineHeight: 1.5, flex: 1 }}>{line.trim()}</Text>
                    </View>
                  )) : (
                    <Text style={styles.acaraText}>Belum ada susunan acara yang diatur.</Text>
                  )}
                </View>

                <Text style={styles.catatanTitle}>Catatan</Text>
                <Text style={styles.catatanText}>
                  1. Mohon hadir 15 menit sebelum acara dimulai{"\n"}
                  2. Undangan dibawa serta{"\n"}
                  3. Pakaian bebas rapi (Khusus Anggota Senat Pakaian Toga){"\n"}
                  4. Mengikuti tata tertib yang disampaikan MC{"\n"}
                  5. HP dalam mode Sunyi
                </Text>
              </View>
            </View>
          </Page>
        </React.Fragment>
      ))}
    </Document>
  );
}
