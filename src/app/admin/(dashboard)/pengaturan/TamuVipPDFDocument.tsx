import React from 'react';
import { Page, Text, View, Document, StyleSheet } from '@react-pdf/renderer';

type VIPRow = {
  urut: number;
  nama: string;
};

type Props = {
  data: VIPRow[];
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
  nameText: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 10,
    textAlign: 'center',
  }
});

export default function TamuVipPDFDocument({ data }: Props) {
  // Chunking data per 10 items (10 labels = 1 page)
  const chunks: VIPRow[][] = [];
  for (let i = 0; i < data.length; i += 10) {
    chunks.push(data.slice(i, i + 10));
  }

  return (
    <Document>
      {chunks.map((chunk, pageIndex) => (
        <Page key={pageIndex} size={[PAGE_WIDTH, PAGE_HEIGHT]} style={styles.page}>
          {chunk.map((item, index) => (
            <View key={index} style={styles.cell}>
              <Text style={styles.nameText}>
                {item.urut} | {item.nama.toUpperCase()}
              </Text>
            </View>
          ))}
        </Page>
      ))}
    </Document>
  );
}
