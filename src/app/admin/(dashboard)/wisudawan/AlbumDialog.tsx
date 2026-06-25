'use client';

import { useState, useMemo } from 'react';
import { BookOpen, X, Loader2, AlertCircle, FileText, FileSpreadsheet, Image as ImageIcon } from 'lucide-react';
import { extractGDriveFileId } from '@/lib/uploadFoto';
import { saveAs } from 'file-saver';
// @ts-ignore
import * as docx from 'docx';
// @ts-ignore
import ExcelJS from 'exceljs';
import { pdf, Document, Page, Text, View, StyleSheet, Image as PdfImage, Font } from '@react-pdf/renderer';

type WisudawanRow = {
  nim: string;
  nama_mahasiswa: string;
  nama_gelar?: string;
  fakultas?: string;
  prodi?: string;
  ipk?: number | null;
  predikat?: string;
  sesi?: string;
  urut?: number | null;
  terdaftar?: string;
  foto?: string;
};

type ProdiItem = {
  id: number;
  fakultas: string;
  prodi: string;
  singkatan: string;
  urutan: number;
};

type Props = {
  data: WisudawanRow[];
  prodiData: ProdiItem[];
};

async function fetchImageAsBase64(url: string): Promise<string | null> {
  if (!url) return null;
  try {
    let fetchUrl = url;
    if (url.includes('drive.google.com')) {
      const fileId = extractGDriveFileId(url);
      if (fileId) {
        fetchUrl = `https://lh3.googleusercontent.com/d/${fileId}`;
      }
    }
    let res = await fetch(fetchUrl, { mode: 'cors', referrerPolicy: 'no-referrer' });
    if (!res.ok && fetchUrl !== url) {
      res = await fetch(url, { mode: 'cors', referrerPolicy: 'no-referrer' });
    }
    if (!res.ok) return null;
    const blob = await res.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.readAsDataURL(blob);
    });
  } catch (err) {
    return null;
  }
}

// Helper to convert base64 to array buffer (for exceljs/docx)
function base64ToArrayBuffer(base64: string) {
  const binaryString = window.atob(base64.split(',')[1]);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}

// PDF Styles
const pdfStyles = StyleSheet.create({
  page: { padding: 30, fontSize: 11, fontFamily: 'Helvetica' },
  header: { fontSize: 16, textAlign: 'center', marginBottom: 20, fontWeight: 'bold' },
  table: { display: 'flex', flexDirection: 'column', width: 'auto', borderStyle: 'solid', borderWidth: 1, borderRightWidth: 0, borderBottomWidth: 0 },
  tableRow: { margin: 'auto', flexDirection: 'row' },
  colPhoto: { width: '25%', borderStyle: 'solid', borderWidth: 1, borderLeftWidth: 0, borderTopWidth: 0, padding: 5, justifyContent: 'center', alignItems: 'center' },
  colData: { width: '50%', borderStyle: 'solid', borderWidth: 1, borderLeftWidth: 0, borderTopWidth: 0, padding: 8, justifyContent: 'center' },
  colSign: { width: '25%', borderStyle: 'solid', borderWidth: 1, borderLeftWidth: 0, borderTopWidth: 0, padding: 8 },
  photoBox: { width: 60, height: 80, backgroundColor: '#f0f0f0', border: '1px solid #ccc', display: 'flex', justifyContent: 'center', alignItems: 'center' },
  photoText: { color: '#999', fontSize: 8 },
  image: { width: 60, height: 80, objectFit: 'cover' },
  bold: { fontWeight: 'bold', fontFamily: 'Helvetica-Bold' },
  rowText: { marginBottom: 3 },
  signBox: { width: '100%', height: '100%', display: 'flex', justifyContent: 'space-between' }
});

export default function AlbumDialog({ data, prodiData }: Props) {
  const [open, setOpen] = useState(false);
  const [selectedFakultas, setSelectedFakultas] = useState('');
  const [includePhoto, setIncludePhoto] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressMsg, setProgressMsg] = useState('');

  const fakultasList = useMemo(() => {
    return Array.from(new Set(data.map(w => w.fakultas).filter(Boolean) as string[])).sort();
  }, [data]);

  const targetWisudawan = useMemo(() => {
    let filtered = data.filter(w => Boolean(w.terdaftar && w.terdaftar !== 'false' && w.terdaftar !== '0') && w.urut != null);
    if (selectedFakultas) {
      filtered = filtered.filter(w => w.fakultas === selectedFakultas);
    }
    filtered.sort((a, b) => {
      const fakA = a.fakultas || '';
      const fakB = b.fakultas || '';
      if (fakA !== fakB) return fakA.localeCompare(fakB);
      const prodiObjA = prodiData.find(p => p.prodi === a.prodi);
      const prodiObjB = prodiData.find(p => p.prodi === b.prodi);
      const prodiAOrder = prodiObjA?.urutan ?? 999;
      const prodiBOrder = prodiObjB?.urutan ?? 999;
      if (prodiAOrder !== prodiBOrder) return prodiAOrder - prodiBOrder;
      return (a.urut || 0) - (b.urut || 0);
    });
    return filtered;
  }, [data, prodiData, selectedFakultas]);

  // Load photos into a map to avoid re-fetching
  const loadPhotos = async () => {
    const photoMap = new Map<string, string>();
    if (!includePhoto) return photoMap;
    for (let i = 0; i < targetWisudawan.length; i++) {
      const w = targetWisudawan[i];
      setProgressMsg(`Mengunduh foto ${i + 1}/${targetWisudawan.length}: ${w.nama_mahasiswa}`);
      setProgress(Math.round(((i + 1) / targetWisudawan.length) * 50));
      if (w.foto) {
        const b64 = await fetchImageAsBase64(w.foto);
        if (b64) photoMap.set(w.nim, b64);
      }
    }
    return photoMap;
  };

  const generatePDF = async () => {
    setIsGenerating(true);
    try {
      const photoMap = await loadPhotos();
      setProgressMsg('Merender PDF...');
      setProgress(60);

      const PdfDoc = () => (
        <Document>
          <Page size="A4" style={pdfStyles.page}>
            <Text style={pdfStyles.header}>Buku Album Wisudawan {selectedFakultas ? `- ${selectedFakultas}` : ''}</Text>
            <View style={pdfStyles.table}>
              {targetWisudawan.map((w, i) => {
                const fotoB64 = photoMap.get(w.nim);
                const nama = w.nama_gelar || w.nama_mahasiswa;
                return (
                  <View style={pdfStyles.tableRow} key={w.nim} wrap={false}>
                    <View style={pdfStyles.colPhoto}>
                      {fotoB64 ? (
                        <PdfImage src={fotoB64} style={pdfStyles.image} />
                      ) : (
                        <View style={pdfStyles.photoBox}><Text style={pdfStyles.photoText}>3x4</Text></View>
                      )}
                    </View>
                    <View style={pdfStyles.colData}>
                      <Text style={pdfStyles.rowText}><Text style={pdfStyles.bold}>NAMA:</Text> {nama}</Text>
                      <Text style={pdfStyles.rowText}><Text style={pdfStyles.bold}>NIM:</Text> {w.nim}</Text>
                      <Text style={pdfStyles.rowText}><Text style={pdfStyles.bold}>FAKULTAS:</Text> {w.fakultas}</Text>
                      <Text style={pdfStyles.rowText}><Text style={pdfStyles.bold}>PRODI:</Text> {w.prodi}</Text>
                    </View>
                    <View style={pdfStyles.colSign}>
                      <View style={pdfStyles.signBox}>
                        <Text>{i + 1}.</Text>
                        <Text style={{ borderBottom: '1px dotted #000', width: '80%', alignSelf: 'flex-end', marginBottom: 10 }}></Text>
                      </View>
                    </View>
                  </View>
                );
              })}
            </View>
          </Page>
        </Document>
      );

      const blob = await pdf(<PdfDoc />).toBlob();
      saveAs(blob, `Album_Wisudawan_${selectedFakultas || 'Semua'}.pdf`);
      setProgress(100);
      setProgressMsg('Selesai!');
    } catch (e) {
      console.error(e);
      setProgressMsg('Terjadi kesalahan!');
    } finally {
      setTimeout(() => setIsGenerating(false), 2000);
    }
  };

  const generateDOCX = async () => {
    setIsGenerating(true);
    try {
      const photoMap = await loadPhotos();
      setProgressMsg('Merender DOCX...');
      setProgress(60);

      const tableRows = targetWisudawan.map((w, i) => {
        const nama = w.nama_gelar || w.nama_mahasiswa;
        const fotoB64 = photoMap.get(w.nim);
        
        let photoCellContent = [new docx.Paragraph({ text: "3x4", alignment: docx.AlignmentType.CENTER })];
        if (fotoB64) {
          try {
            const ext = fotoB64.split(';')[0].split('/')[1] === 'png' ? 'png' : 'jpg';
            const buffer = base64ToArrayBuffer(fotoB64);
            photoCellContent = [
              new docx.Paragraph({
                children: [
                  new docx.ImageRun({
                    data: buffer,
                    transformation: { width: 80, height: 106 }, // roughly 3x4 ratio
                    type: ext
                  })
                ],
                alignment: docx.AlignmentType.CENTER
              })
            ];
          } catch (e) {}
        }

        return new docx.TableRow({
          children: [
            new docx.TableCell({
              children: photoCellContent,
              width: { size: 25, type: docx.WidthType.PERCENTAGE },
              verticalAlign: docx.VerticalAlign.CENTER,
              margins: { top: 100, bottom: 100 }
            }),
            new docx.TableCell({
              children: [
                new docx.Paragraph({ children: [new docx.TextRun({ text: "NAMA: ", bold: true }), new docx.TextRun(nama)] }),
                new docx.Paragraph({ children: [new docx.TextRun({ text: "NIM: ", bold: true }), new docx.TextRun(w.nim)] }),
                new docx.Paragraph({ children: [new docx.TextRun({ text: "FAKULTAS: ", bold: true }), new docx.TextRun(w.fakultas || '-')] }),
                new docx.Paragraph({ children: [new docx.TextRun({ text: "PRODI: ", bold: true }), new docx.TextRun(w.prodi || '-')] }),
              ],
              width: { size: 50, type: docx.WidthType.PERCENTAGE },
              verticalAlign: docx.VerticalAlign.CENTER,
              margins: { left: 200, right: 100, top: 100, bottom: 100 }
            }),
            new docx.TableCell({
              children: [
                new docx.Paragraph({ text: `${i + 1}.`, spacing: { before: 100 } }),
                new docx.Paragraph({ text: "...........................................", spacing: { before: 800 } })
              ],
              width: { size: 25, type: docx.WidthType.PERCENTAGE },
              verticalAlign: docx.VerticalAlign.TOP,
              margins: { left: 100, top: 100 }
            }),
          ]
        });
      });

      const doc = new docx.Document({
        sections: [{
          properties: {},
          children: [
            new docx.Paragraph({
              text: `Buku Album Wisudawan ${selectedFakultas ? `- ${selectedFakultas}` : ''}`,
              heading: docx.HeadingLevel.HEADING_1,
              alignment: docx.AlignmentType.CENTER,
              spacing: { after: 400 }
            }),
            new docx.Table({
              width: { size: 100, type: docx.WidthType.PERCENTAGE },
              rows: tableRows
            })
          ]
        }]
      });

      const blob = await docx.Packer.toBlob(doc);
      saveAs(blob, `Album_Wisudawan_${selectedFakultas || 'Semua'}.docx`);
      setProgress(100);
      setProgressMsg('Selesai!');
    } catch (e) {
      console.error(e);
      setProgressMsg('Terjadi kesalahan!');
    } finally {
      setTimeout(() => setIsGenerating(false), 2000);
    }
  };

  const generateXLSX = async () => {
    setIsGenerating(true);
    try {
      const photoMap = await loadPhotos();
      setProgressMsg('Merender XLSX...');
      setProgress(60);

      const workbook = new ExcelJS.Workbook();
      const sheet = workbook.addWorksheet('Album');

      sheet.columns = [
        { header: 'No', key: 'no', width: 5 },
        { header: 'Area Foto', key: 'foto', width: 15 },
        { header: 'Detail Data', key: 'detail', width: 50 },
        { header: 'Tanda Tangan', key: 'ttd', width: 25 },
      ];

      targetWisudawan.forEach((w, i) => {
        const nama = w.nama_gelar || w.nama_mahasiswa;
        const row = sheet.addRow([
          i + 1,
          '', // Foto cell placeholder
          `NAMA: ${nama}\nNIM: ${w.nim}\nFAKULTAS: ${w.fakultas}\nPRODI: ${w.prodi}`,
          `${i + 1}. \n\n..........................`
        ]);
        
        row.height = 80;
        row.getCell(3).alignment = { wrapText: true, vertical: 'middle', horizontal: 'left' };
        row.getCell(4).alignment = { wrapText: true, vertical: 'top', horizontal: 'left' };
        row.getCell(1).alignment = { vertical: 'middle', horizontal: 'center' };

        const fotoB64 = photoMap.get(w.nim);
        if (fotoB64) {
          try {
            const ext = fotoB64.split(';')[0].split('/')[1] === 'png' ? 'png' : 'jpeg';
            const imageId = workbook.addImage({
              base64: fotoB64,
              extension: ext as any,
            });
            sheet.addImage(imageId, {
              tl: { col: 1, row: i + 1 }, // Note: header is row 1, so data starts at row 2, which is i+1 (0-indexed i -> row 2)
              ext: { width: 80, height: 100 },
              editAs: 'oneCell'
            });
          } catch(e){}
        }
      });

      // Fix image positioning offset because row 1 is header
      // Actually `tl: { col: 1, row: i + 1 }` places it in Column B (index 1), Row i+2 (index i+1). Which is exactly correct!

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      saveAs(blob, `Album_Wisudawan_${selectedFakultas || 'Semua'}.xlsx`);
      setProgress(100);
      setProgressMsg('Selesai!');
    } catch (e) {
      console.error(e);
      setProgressMsg('Terjadi kesalahan!');
    } finally {
      setTimeout(() => setIsGenerating(false), 2000);
    }
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center justify-center gap-1.5 px-3 sm:px-4 h-8 sm:h-10 rounded-lg sm:rounded-xl bg-pink-600 hover:bg-pink-700 text-white text-xs sm:text-sm font-normal sm:font-semibold transition-colors-pink-900/20 whitespace-nowrap"
      >
        <BookOpen size={18} />
        <span>Album</span>
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-6 w-full max-w-md animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-[var(--color-text)] flex items-center gap-2">
                <BookOpen className="text-indigo-600" size={24} />
                Generate Buku Album
              </h3>
              <button onClick={() => !isGenerating && setOpen(false)} className="text-[var(--color-text-muted)] hover:text-[var(--color-text)]">
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-[var(--color-text)] mb-1">
                  Pilih Fakultas (Opsional)
                </label>
                <select
                  value={selectedFakultas}
                  onChange={(e) => setSelectedFakultas(e.target.value)}
                  className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-secondary)] px-3 py-2.5 text-sm text-[var(--color-text)] focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  disabled={isGenerating}
                >
                  <option value="">Semua Fakultas</option>
                  {fakultasList.map((fak) => (
                    <option key={fak} value={fak}>{fak}</option>
                  ))}
                </select>
              </div>

              <label className="flex items-start gap-3 p-3 border border-[var(--color-border)] rounded-xl bg-[var(--color-bg-secondary)] cursor-pointer hover:bg-[var(--color-border)] transition-colors">
                <input
                  type="checkbox"
                  checked={includePhoto}
                  onChange={(e) => setIncludePhoto(e.target.checked)}
                  disabled={isGenerating}
                  className="mt-1 rounded text-indigo-600 focus:ring-indigo-500 bg-[var(--color-surface)] border-[var(--color-border)]"
                />
                <div className="flex flex-col">
                  <span className="text-sm font-bold text-[var(--color-text)] flex items-center gap-1">
                    <ImageIcon size={14} /> Sertakan Foto Asli
                  </span>
                  <span className="text-xs text-[var(--color-text-muted)] mt-0.5">
                    Jika dicentang, proses unduh akan membutuhkan waktu lebih lama. Jika tidak, akan ditampilkan kotak kosong untuk tempat pas foto.
                  </span>
                </div>
              </label>

              <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-200 dark:border-amber-800/30 flex items-start gap-3">
                <AlertCircle className="text-amber-600 dark:text-amber-500 shrink-0 mt-0.5" size={16} />
                <div className="text-xs text-amber-700 dark:text-amber-400 font-medium">
                  Ada {targetWisudawan.length} wisudawan yang valid untuk di-generate. Data diurutkan sesuai urutan prodi dan nomor urut.
                </div>
              </div>

              {isGenerating ? (
                <div className="space-y-3 pt-4 border-t border-[var(--color-border)]">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium text-indigo-600 flex items-center gap-2">
                      <Loader2 size={16} className="animate-spin" />
                      Memproses...
                    </span>
                    <span className="font-mono font-bold text-indigo-600">{progress}%</span>
                  </div>
                  <div className="w-full h-2.5 bg-indigo-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-indigo-600 rounded-full transition-all duration-300 ease-out"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <p className="text-xs text-[var(--color-text-muted)] text-center animate-pulse">{progressMsg}</p>
                </div>
              ) : (
                <div className="flex flex-col gap-2 pt-4 border-t border-[var(--color-border)]">
                  <button
                    onClick={generatePDF}
                    className="flex items-center justify-center gap-2 w-full px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl transition-colors"
                  >
                    <FileText size={18} />
                    Export sebagai PDF
                  </button>
                  <button
                    onClick={generateDOCX}
                    className="flex items-center justify-center gap-2 w-full px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-colors"
                  >
                    <FileText size={18} />
                    Export sebagai Word (DOCX)
                  </button>
                  <button
                    onClick={generateXLSX}
                    className="flex items-center justify-center gap-2 w-full px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition-colors"
                  >
                    <FileSpreadsheet size={18} />
                    Export sebagai Excel (XLSX)
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
