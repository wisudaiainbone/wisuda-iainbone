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

export type TagData = {
  nim: string;
  namaLengkap: string;
  prodiSingkat: string;
  fakultasSingkat: string;
  nomorUrut: number;
};

type Props = {
  data: TagData[];
  periode: string;
  logoBase64: string;
};

// Ukuran Kertas Folio (F4) Landscape dalam points: 330mm x 215mm = ~935.43 x 609.45 pt
const F4_LANDSCAPE: [number, number] = [935.43, 609.45];

const styles = StyleSheet.create({
  page: {
    flexDirection: "row",
    flexWrap: "wrap",
    backgroundColor: "#FFFFFF",
    padding: 10, // Margin tepi kertas agar tidak terpotong printer
  },
  labelContainer: {
    // 3 kolom x 4 baris = 12 label per halaman.
    // Memberikan rasio landscape (sekitar 2:1) yang pas untuk desain label.
    width: "33.333%",
    height: "25%",
    padding: 0, // Tanpa jarak antar label
  },
  labelBox: {
    flex: 1,
    flexDirection: "row",
    borderWidth: 0.5,
    borderColor: "#9ca3af", // Border abu-abu tipis sebagai panduan potong
  },
  
  // --- KIRI (Maroon) ---
  leftPanel: {
    width: "35%", // Lebar area kiri
    backgroundColor: "#8c2e2e", // Warna merah maroon (disesuaikan dengan gambar)
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    padding: 10,
  },
  nomorUrutText: {
    fontSize: 54, // Sangat besar
    fontFamily: "Helvetica-Bold",
    color: "#FFFFFF",
    lineHeight: 1,
    marginBottom: 4,
  },
  fakultasProdiText: {
    fontSize: 12,
    fontFamily: "Helvetica-Bold",
    color: "#FFFFFF",
    textAlign: "center",
    textTransform: "uppercase",
  },

  // --- KANAN (Putih) ---
  rightPanel: {
    width: "65%",
    backgroundColor: "#FFFFFF",
    flexDirection: "column",
    paddingVertical: 12,
    paddingHorizontal: 16,
    position: "relative",
  },
  
  // Bagian Logo (Kiri atas panel putih)
  logoContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    marginBottom: 10,
  },
  logoImage: {
    width: 32,
    height: 32,
  },

  // Bagian Tengah (Nama & NIM)
  namaNimContainer: {
    flex: 1,
    justifyContent: "flex-start",
  },
  namaLengkap: {
    fontSize: 16,
    fontFamily: "Helvetica-Bold",
    color: "#000000",
    lineHeight: 1.1,
    marginBottom: 0,
  },
  nim: {
    fontSize: 14,
    fontFamily: "Helvetica",
    color: "#1f2937",
  },

  // Bagian Bawah (Info Wisuda)
  footerTextContainer: {
    marginTop: "auto",
  },
  footerText: {
    fontSize: 8,
    fontFamily: "Helvetica",
    color: "#374151",
    lineHeight: 1.3,
  },
});

export default function TagDocument({ data, periode, logoBase64 }: Props) {
  return (
    <Document>
      <Page size={F4_LANDSCAPE} style={styles.page} wrap>
        {data.map((item, index) => (
          <View key={index} style={styles.labelContainer} wrap={false}>
            <View style={styles.labelBox}>
              
              {/* KOLOM KIRI */}
              <View style={styles.leftPanel}>
                <Text style={styles.nomorUrutText}>{String(item.nomorUrut).padStart(3, "0")}</Text>
                <Text style={styles.fakultasProdiText}>
                  {item.fakultasSingkat} - {item.prodiSingkat}
                </Text>
              </View>

              {/* KOLOM KANAN */}
              <View style={styles.rightPanel}>
                {/* Logo Section */}
                <View style={styles.logoContainer}>
                  {logoBase64 && <Image src={logoBase64} style={styles.logoImage} />}
                </View>

                {/* Info Mahasiswa */}
                <View style={styles.namaNimContainer}>
                  <Text style={styles.namaLengkap}>{item.namaLengkap}</Text>
                  <Text style={styles.nim}>{item.nim}</Text>
                </View>

                {/* Footer */}
                <View style={styles.footerTextContainer}>
                  <Text style={styles.footerText}>Wisuda Program Sarjana dan Magister</Text>
                  <Text style={styles.footerText}>{periode} IAIN Bone</Text>
                </View>
              </View>

            </View>
          </View>
        ))}
      </Page>
    </Document>
  );
}
