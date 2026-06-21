"use client";

import {
  Document,
  Page,
  Text,
  View,
  Image,
  StyleSheet,
  Font,
} from "@react-pdf/renderer";

// ─── Types ────────────────────────────────────────────────────────────────────
export type CertData = {
  nim: string;
  namaMahasiswa: string;
  namaGelar: string;
  prodi: string;
  fakultas: string;
  ipk: string;
  predikat: string;
  prestasiAkd: string;
  periode: string;
};

export type CertSettings = {
  nomor: string;
  tanggal: string;
  jabatan: string;
  nip: string;
  nama: string;
  bgUrl?: string;
  ttdUrl?: string;
};

type Props = {
  cert: CertData;
  settings: CertSettings;
  logoBase64: string;
  tempatWisuda: string;
  tanggalWisuda: string;
};

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  page: {
    flexDirection: "column",
    backgroundColor: "#FFFFFF",
    padding: 0,
    fontFamily: "Helvetica",
  },

  // Background Image Layer
  backgroundImage: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: "100%",
    height: "100%",
    zIndex: -1, // Keep behind all other content
  },

  // Body container
  body: {
    flex: 1,
    paddingHorizontal: 60,
    paddingTop: 70,
    paddingBottom: 40,
    flexDirection: "column",
    alignItems: "center",
  },

  // Logo & Header
  logo: {
    width: 65,
    height: 65,
    marginBottom: 10,
  },
  institutsiTitle: {
    fontSize: 12,
    fontFamily: "Helvetica-Bold",
    color: "#374151",
    textAlign: "center",
    letterSpacing: 1,
    marginBottom: 12,
  },

  // Big Title
  titlePiagam: {
    fontSize: 34,
    fontFamily: "Helvetica-Bold",
    fontWeight: "ultrabold",
    color: "#263b09ff", // Dark green/olive
    textAlign: "center",
    letterSpacing: 0,
    marginBottom: 4,
  },

  // SK / Nomor
  nomorText: {
    fontSize: 12,
    color: "#1f2937",
    textAlign: "center",
    marginBottom: 24,
  },

  // Diberikan Kepada
  diberikanLabel: {
    fontSize: 12,
    color: "#1f2937",
    textAlign: "center",
    letterSpacing: 1.5,
    marginBottom: 12,
  },

  // Nama & NIM
  namaGelar: {
    fontSize: 28,
    fontFamily: "Times-Bold", // Serif font as per reference
    color: "#000000",
    textAlign: "center",
    marginBottom: 6,
  },
  nimProdi: {
    fontSize: 12,
    color: "#374151",
    textAlign: "center",
    marginBottom: 24,
  },

  // Paragraph Text
  paragraphContainer: {
    width: "100%",
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  paragraphText: {
    fontSize: 12,
    color: "#1f2937",
    textAlign: "center",
    lineHeight: 1.6,
  },

  // Signature Block
  ttdContainer: {
    flexDirection: "row",
    justifyContent: "flex-end",
    width: "100%",
    paddingRight: 40,
  },
  ttdBox: {
    alignItems: "flex-start",
    width: 200,
  },
  ttdLocation: {
    fontSize: 12,
    color: "#1f2937",
    marginBottom: 2,
  },
  ttdJabatan: {
    fontSize: 12,
    color: "#1f2937",
    marginBottom: 0,
  },

  // Overlay area untuk TTD
  ttdImageArea: {
    position: "absolute",
    top: 28, // sejajar dengan posisi aslinya setelah teks
    left: 0,
    width: 250,
    height: 55,
  },
  ttdSigImage: {
    position: "absolute",
    top: -30,
    left: -150, // geser gambar lebih ke kiri
    width: 340,
    height: 116,
    objectFit: "contain",
    zIndex: -1,
  },

  ttdNama: {
    fontSize: 12,
    fontFamily: "Helvetica-Bold",
    color: "#000000",
  },
  ttdNip: {
    fontSize: 11,
    color: "#374151",
    marginTop: 2,
  },
});

// ─── Helpers ──────────────────────────────────────────────────────────────────
function getSebutan(prestasiAkd: string, fakultas: string): string {
  const parts = prestasiAkd
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const hasInstitut = parts.includes("Institut");
  const rank = parts.find((p) => p !== "Institut");

  const fakultasStr = fakultas.toLowerCase() === "pascasarjana"
    ? "Pascasarjana"
    : `Fakultas ${fakultas}`;

  if (hasInstitut && rank) {
    return `Terbaik ${rank} ${fakultasStr} dan Terbaik Institut`;
  }
  if (hasInstitut && !rank) {
    return "Terbaik Institut";
  }
  return `Terbaik ${rank || prestasiAkd} ${fakultasStr}`;
}

// ─── Single Certificate Document ─────────────────────────────────────────────
export function CertificateDocument({ cert, settings, logoBase64, tempatWisuda, tanggalWisuda }: Props) {
  const sebutanLabel = getSebutan(cert.prestasiAkd, cert.fakultas || "");

  const ipkFormatted = cert.ipk
    ? parseFloat(cert.ipk.replace(",", ".")).toFixed(2)
    : "-";

  // Tanggal default fallback
  const fallbackDate = new Date().toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const tempatPelaksanaan = tempatWisuda || "";
  const tanggalPelaksanaan = tanggalWisuda || fallbackDate;

  return (
    <Document>
      <Page size="A4" orientation="landscape" style={styles.page}>

        {/* Background Image layer */}
        {settings.bgUrl && (
          <Image src={settings.bgUrl} style={styles.backgroundImage} fixed={true} />
        )}

        <View style={styles.body}>

          {/* Logo */}
          {logoBase64 && (
            <Image src={logoBase64} style={styles.logo} />
          )}

          {/* Header */}
          <Text style={styles.institutsiTitle}>
            INSTITUT AGAMA ISLAM NEGERI BONE
          </Text>

          {/* Title */}
          <Text style={styles.titlePiagam}>PIAGAM PENGHARGAAN</Text>

          {/* Nomor SK */}
          <Text style={styles.nomorText}>
            Berdasarkan Keputusan Rektor {settings.nomor || "..."}
          </Text>

          {/* Diberikan Kepada */}
          <Text style={styles.diberikanLabel}>DIBERIKAN KEPADA:</Text>

          {/* Nama & NIM */}
          <Text style={styles.namaGelar}>{cert.namaGelar}</Text>
          <Text style={styles.nimProdi}>
            NIM {cert.nim} - Prodi {cert.prodi || "-"}, {cert.fakultas || "-"}
          </Text>

          {/* Paragraph */}
          <View style={styles.paragraphContainer}>
            <Text style={styles.paragraphText}>
              Atas Prestasinya Sebagai Wisudawan {sebutanLabel} dengan IPK {ipkFormatted} Predikat {cert.predikat || "-"} pada Wisuda {cert.periode} Institut Agama Islam Negeri Bone di {tempatPelaksanaan} pada {tanggalPelaksanaan}
            </Text>
          </View>

          {/* Signature */}
          <View style={styles.ttdContainer}>
            <View style={styles.ttdBox}>
              {/* Render gambar PERTAMA agar berada di layer bawah (di belakang teks) */}
              {settings.ttdUrl && (
                <View style={styles.ttdImageArea}>
                  <Image src={settings.ttdUrl} style={styles.ttdSigImage} />
                </View>
              )}

              <Text style={styles.ttdLocation}>
                {settings.tanggal || tanggalPelaksanaan}
              </Text>
              <Text style={styles.ttdJabatan}>
                {settings.jabatan || "Rektor"}
              </Text>

              {/* Jarak penahan ruang tanda tangan */}
              <View style={{ height: 55 }} />

              <Text style={styles.ttdNama}>
                {settings.nama || ""}
              </Text>
              {settings.nip ? (
                <Text style={styles.ttdNip}>NIP {settings.nip}</Text>
              ) : null}
            </View>
          </View>

        </View>
      </Page>
    </Document>
  );
}
