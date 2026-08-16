import React from 'react';
import { Page, Text, View, Document, StyleSheet, Font } from '@react-pdf/renderer';

// Nonaktifkan pemenggalan kata (hyphenation)
Font.registerHyphenationCallback(word => [word]);

type WisudawanRow = {
  nim: string;
  nama_mahasiswa: string;
  urut?: number | null;
  sesi?: string;
};

type Pair = {
  sesi1: WisudawanRow | null;
  sesi2: WisudawanRow | null;
};

type Props = {
  pairs: Pair[];
};

// 16 cm x 19.5 cm in points (1 cm = ~28.346 pt)
const PAGE_WIDTH = 16 * 28.346;
const PAGE_HEIGHT = 19.5 * 28.346;

const styles = StyleSheet.create({
  page: {
    width: PAGE_WIDTH,
    height: PAGE_HEIGHT,
    paddingTop: 20,
    paddingBottom: 20,
    paddingLeft: 15,
    paddingRight: 15,
    backgroundColor: '#ffffff',
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    alignContent: 'flex-start',
  },
  cell: {
    width: '47%',
    height: Math.floor((PAGE_HEIGHT - 40) / 5) - 5, // bagi 5 baris, dikurangi sedikit margin
    marginBottom: 5,
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
  },
  topSection: {
    width: '100%',
    paddingBottom: 4,
    borderBottom: '1pt solid black',
    alignItems: 'center',
    justifyContent: 'flex-end',
    flex: 1,
  },
  bottomSection: {
    width: '100%',
    paddingTop: 4,
    alignItems: 'center',
    justifyContent: 'flex-start',
    flex: 1,
  },
  nameText: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 9,
    textAlign: 'center',
  },
  nimText: {
    fontFamily: 'Helvetica',
    fontSize: 8,
    marginTop: 2,
    textAlign: 'center',
  }
});

export default function LabelKursiPDFDocument({ pairs }: Props) {
  // Chunking pairs per 10 items (10 pairs = 1 page)
  const chunks: Pair[][] = [];
  for (let i = 0; i < pairs.length; i += 10) {
    chunks.push(pairs.slice(i, i + 10));
  }

  return (
    <Document>
      {chunks.map((chunk, pageIndex) => (
        <Page key={pageIndex} size={[PAGE_WIDTH, PAGE_HEIGHT]} style={styles.page}>
          {chunk.map((pair, index) => (
            <View key={index} style={styles.cell}>
              
              <View style={styles.topSection}>
                {pair.sesi1 ? (
                  <>
                    <Text style={styles.nameText}>
                      {pair.sesi1.urut} | {pair.sesi1.nama_mahasiswa.toUpperCase()}
                    </Text>
                    <Text style={styles.nimText}>
                      {pair.sesi1.nim} ( SESI 1 )
                    </Text>
                  </>
                ) : (
                  <Text style={styles.nameText}> </Text>
                )}
              </View>

              <View style={styles.bottomSection}>
                {pair.sesi2 ? (
                  <>
                    <Text style={styles.nameText}>
                      {pair.sesi2.urut} | {pair.sesi2.nama_mahasiswa.toUpperCase()}
                    </Text>
                    <Text style={styles.nimText}>
                      {pair.sesi2.nim} ( SESI 2 )
                    </Text>
                  </>
                ) : (
                  <Text style={styles.nameText}> </Text>
                )}
              </View>

            </View>
          ))}
        </Page>
      ))}
    </Document>
  );
}
