// ==========================================
// GOOGLE APPS SCRIPT: UPLOAD & EXPORT WEB APP
// ==========================================

// Mengambil ID dari Script Properties (Project Settings > Script Properties)
const scriptProperties = PropertiesService.getScriptProperties();
const UPLOAD_FOLDER_ID = scriptProperties.getProperty("UPLOAD_FOLDER_ID");
const SPREADSHEET_ID = scriptProperties.getProperty("SPREADSHEET_ID");

// Folder root untuk foto profil wisudawan.
// Jika FOTO_FOLDER_ID tidak di-set, fallback ke UPLOAD_FOLDER_ID.
const FOTO_FOLDER_ID = scriptProperties.getProperty("FOTO_FOLDER_ID") || UPLOAD_FOLDER_ID;

// ─────────────────────────────────────────────────────
// MAPPING: Nama Lengkap Fakultas → Kode Singkat
// ─────────────────────────────────────────────────────
const FAKULTAS_MAP = {
  "Fakultas Syariah dan Hukum Islam": "FSHI",
  "Fakultas Tarbiyah": "FT",
  "Fakultas Ushuluddin dan Dakwah": "FUD",
  "Fakultas Ekonomi dan Bisnis Islam": "FEBI",
  "Pascasarjana": "PS"
};

/**
 * Dapatkan kode singkat fakultas. Jika tidak ada di mapping,
 * ambil huruf kapital pertama dari setiap kata (inisial).
 */
function getKodeFakultas(namaFakultas) {
  if (!namaFakultas) return "UNKN";
  const kode = FAKULTAS_MAP[namaFakultas.trim()];
  if (kode) return kode;
  // Fallback: ambil inisial huruf besar
  return namaFakultas
    .split(" ")
    .filter(function(w) { return w.length > 0; })
    .map(function(w) { return w[0].toUpperCase(); })
    .join("");
}

/**
 * Sanitasi string untuk nama file/folder:
 * - Karakter non-alfanumerik diganti underscore
 * - Underscore berulang diringkas
 * - Trim underscore di awal/akhir
 */
function sanitizeForFilename(str) {
  if (!str) return "";
  return str
    .replace(/[^a-zA-Z0-9]/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_|_$/g, "");
}

/**
 * Ambil atau buat subfolder dengan nama tertentu di dalam parentFolder.
 * Jika subfolder sudah ada, return yang pertama ditemukan.
 */
function getOrCreateSubfolder(parentFolder, subfolderName) {
  const existing = parentFolder.getFoldersByName(subfolderName);
  if (existing.hasNext()) {
    return existing.next();
  }
  return parentFolder.createFolder(subfolderName);
}

// ─────────────────────────────────────────────────────────────────

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);

    // ─────────────────────────────────────────
    // ACTION: UPLOAD FOTO PROFIL WISUDAWAN
    // ─────────────────────────────────────────
    if (data.action === "upload_foto") {
      const rootFotoFolder = DriveApp.getFolderById(FOTO_FOLDER_ID);

      // ── 1. Hapus foto lama (jika ada) ──────
      if (data.old_file_id) {
        try {
          const oldFile = DriveApp.getFileById(data.old_file_id);
          oldFile.setTrashed(true);
          Logger.log("Foto lama dihapus: " + data.old_file_id);
        } catch (err) {
          Logger.log("Foto lama tidak ditemukan: " + data.old_file_id);
        }
      }

      // ── 2. Tentukan Struktur Folder Induk & Subfolder Foto ──
      const periodeRaw = data.periode || "Umum";
      let tahun = new Date().getFullYear();
      let cleanPeriode = periodeRaw;

      // Ekstraksi Tahun dari string periodeRaw (contoh: "Angkatan XVII Tahun 2026")
      const yearMatch = periodeRaw.match(/\b(20\d{2})\b/);
      if (yearMatch) {
        tahun = yearMatch[1];
        // Hapus kata "Tahun [Tahun]" untuk nama periode bersih
        cleanPeriode = periodeRaw.replace(new RegExp("\\s*Tahun\\s*" + tahun, "i"), "").trim();
        if (cleanPeriode === periodeRaw) {
          cleanPeriode = periodeRaw.replace(new RegExp("\\s*" + tahun), "").trim();
        }
      }

      const parentFolderName = "Wisuda_" + tahun + "_" + cleanPeriode;
      const subfolderName    = "Foto_" + periodeRaw;
      
      // Buat/Dapatkan Folder Induk: Wisuda_[Tahun]_[Periode] di Root
      const parentFolder = getOrCreateSubfolder(rootFotoFolder, parentFolderName);
      
      // Buat/Dapatkan Subfolder Foto: Foto_[Nama Periode Asli] di dalam Folder Induk
      const targetFolder = getOrCreateSubfolder(parentFolder, subfolderName);

      // ── 3. Bangun nama file ───────────────────────────────────
      // Format: FOTO_[timestamp]_[KODE_FAKULTAS]_[NIM].jpg
      // Contoh: FOTO_1749820803456_FEBI_612062020120.jpg
      const timestamp    = Date.now();
      const kodeFakultas = getKodeFakultas(data.fakultas);
      const nim          = sanitizeForFilename(data.nim || "");
      const namaFile     = "FOTO_" + timestamp + "_" + kodeFakultas + "_" + nim + ".jpg";

      Logger.log("Nama file : " + namaFile);
      Logger.log("Subfolder : " + subfolderName);

      // ── 4. Upload file ke subfolder ──────────────────────────
      const blob = Utilities.newBlob(
        Utilities.base64Decode(data.base64_data),
        "image/jpeg",
        namaFile
      );

      const file = targetFolder.createFile(blob);
      // Izinkan siapa saja dengan link untuk melihat (untuk <img src="...">)
      file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

      const fileId = file.getId();

      return ContentService.createTextOutput(JSON.stringify({
        status: "success",
        fileId: fileId,
        namaFile: namaFile,
        subfolder: subfolderName,
        // URL langsung untuk <img src>
        fileUrl: "https://drive.google.com/uc?export=view&id=" + fileId,
        // URL untuk dibuka di Google Drive
        viewUrl: file.getUrl()
      })).setMimeType(ContentService.MimeType.JSON);
    }

    // ─────────────────────────────────────────
    // ACTION: UPLOAD FILE UMUM
    // ─────────────────────────────────────────
    if (data.action === "upload") {
      const folder = DriveApp.getFolderById(UPLOAD_FOLDER_ID);
      const contentType = data.mime_type || "application/pdf";
      const blob = Utilities.newBlob(Utilities.base64Decode(data.base64_data), contentType, data.nama_file);
      
      const file = folder.createFile(blob);
      file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
      
      return ContentService.createTextOutput(JSON.stringify({
        status: "success",
        fileUrl: file.getUrl(),
        fileId: file.getId()
      })).setMimeType(ContentService.MimeType.JSON);
    }
    
    // ─────────────────────────────────────────
    // ACTION: DELETE FILE
    // ─────────────────────────────────────────
    if (data.action === "delete_file") {
      if (data.file_id) {
        try {
          const fileToTrash = DriveApp.getFileById(data.file_id);
          fileToTrash.setTrashed(true);
          return ContentService.createTextOutput(JSON.stringify({
            status: "success",
            message: "File berhasil dihapus"
          })).setMimeType(ContentService.MimeType.JSON);
        } catch (err) {
          return ContentService.createTextOutput(JSON.stringify({
            status: "error",
            message: "Gagal menghapus file: " + err.toString()
          })).setMimeType(ContentService.MimeType.JSON);
        }
      }
      return ContentService.createTextOutput(JSON.stringify({
        status: "error",
        message: "Parameter file_id diperlukan"
      })).setMimeType(ContentService.MimeType.JSON);
    }
    
    // ─────────────────────────────────────────
    // ACTION: EXPORT KE GOOGLE SHEETS
    // ─────────────────────────────────────────
    if (data.action === "export_sheet") {
      const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
      let sheet = ss.getSheetByName(data.sheet_name || "Data Wisudawan");
      
      if (!sheet) {
        sheet = ss.insertSheet(data.sheet_name || "Data Wisudawan");
      }
      
      if (data.overwrite) {
        sheet.clear();
      }
      
      const rows = data.rows; 
      if (rows && rows.length > 0) {
        const range = sheet.getRange(sheet.getLastRow() + 1, 1, rows.length, rows[0].length);
        range.setValues(rows);
      }
      
      return ContentService.createTextOutput(JSON.stringify({
        status: "success",
        sheetUrl: ss.getUrl()
      })).setMimeType(ContentService.MimeType.JSON);
    }

    // ─────────────────────────────────────────
    // ACTION: EXPORT STATISTIK HORIZONTAL
    // ─────────────────────────────────────────
    if (data.action === "export_statistik_horizontal") {
      const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
      let sheet = ss.getSheetByName(data.sheet_name || "Statistik");
      
      if (!sheet) {
        sheet = ss.insertSheet(data.sheet_name || "Statistik");
      }

      const rows = data.rows; // Array of [label, value]
      const lastRow = sheet.getLastRow();
      const lastCol = sheet.getLastColumn();

      if (lastRow === 0 || lastCol === 0) {
        // Sheet kosong, tulis semuanya
        sheet.getRange(1, 1, rows.length, 2).setValues(rows);
      } else {
        const targetCol = lastCol + 1;
        const existingLabelsRange = sheet.getRange(1, 1, lastRow, 1).getValues();
        const existingLabels = existingLabelsRange.map(r => String(r[0]).trim());

        rows.forEach(r => {
          const label = String(r[0]).trim();
          const value = r[1];
          
          if (!label) return; // skip row kosong
          
          const idx = existingLabels.indexOf(label);
          if (idx !== -1) {
            sheet.getRange(idx + 1, targetCol).setValue(value);
          } else {
            const newRow = sheet.getLastRow() + 1;
            sheet.getRange(newRow, 1).setValue(label);
            sheet.getRange(newRow, targetCol).setValue(value);
            // Tambahkan ke map untuk baris selanjutnya
            for (let i = existingLabels.length; i < newRow - 1; i++) {
               existingLabels.push("");
            }
            existingLabels.push(label);
          }
        });
      }

      return ContentService.createTextOutput(JSON.stringify({
        status: "success",
        sheetUrl: ss.getUrl()
      })).setMimeType(ContentService.MimeType.JSON);
    }
    
    // ─────────────────────────────────────────
    // ACTION: SEND OTP EMAIL
    // ─────────────────────────────────────────
    if (data.action === "send_otp_email") {
      const { to, nama, otp } = data;
      
      if (!to || !nama || !otp) {
        return ContentService.createTextOutput(JSON.stringify({
          status: "error",
          message: "Parameter to, nama, dan otp wajib ada"
        })).setMimeType(ContentService.MimeType.JSON);
      }
      
      const subject = `Kode OTP Reset Password - ${otp}`;
      
      // Menggunakan MailApp untuk mengirim email (via akun wisudaiainbone@gmail.com)
      const htmlBody = `
        <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden;">
          <div style="background-color: #059669; padding: 24px; text-align: center; color: white;">
            <h1 style="margin: 0; font-size: 20px;">Wisuda IAIN Bone</h1>
            <p style="margin: 4px 0 0 0; font-size: 14px; opacity: 0.9;">Reset Password Akun</p>
          </div>
          <div style="padding: 32px 24px;">
            <p style="margin-top: 0;">Halo, <strong>${nama}</strong>,</p>
            <p style="color: #4b5563; line-height: 1.6;">Kami menerima permintaan untuk mereset password akun pendaftaran wisuda Anda. Gunakan kode OTP 6-digit berikut untuk melanjutkan:</p>
            
            <div style="background-color: #f0fdf4; border: 2px dashed #34d399; padding: 16px; border-radius: 8px; text-align: center; margin: 24px 0;">
              <span style="font-family: monospace; font-size: 32px; font-weight: bold; color: #047857; letter-spacing: 6px;">${otp}</span>
            </div>
            
            <p style="color: #6b7280; font-size: 13px;">⏱️ Kode OTP ini hanya berlaku selama <strong>10 menit</strong>.</p>
            <p style="color: #6b7280; font-size: 13px; margin-bottom: 0;">Jika Anda tidak merasa meminta reset password ini, abaikan email ini.</p>
          </div>
        </div>
      `;
      
      MailApp.sendEmail({
        to: to,
        subject: subject,
        htmlBody: htmlBody,
        name: "Panitia Wisuda IAIN Bone"
      });
      
      return ContentService.createTextOutput(JSON.stringify({
        status: "success",
        message: "Email terkirim"
      })).setMimeType(ContentService.MimeType.JSON);
    }

    // ─────────────────────────────────────────
    // ACTION: SIMPAN RINGKASAN PERIODE KE SHEET
    // ─────────────────────────────────────────
    if (data.action === "save_ringkasan_periode") {
      const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
      const sheetName = "Ringkasan Periode";
      let sheet = ss.getSheetByName(sheetName);
      
      if (!sheet) {
        sheet = ss.insertSheet(sheetName);
        // Buat header
        sheet.getRange(1, 1, 1, 5).setValues([
          ["Nama Periode", "Total Wisudawan", "Terdaftar", "Tanggal Arsip", "Status"]
        ]);
        sheet.getRange(1, 1, 1, 5).setFontWeight("bold");
      }
      
      const { nama_periode, total, terdaftar, tanggal_arsip } = data;
      
      // Cek apakah baris untuk periode ini sudah ada (update jika ada)
      const lastRow = sheet.getLastRow();
      let found = false;
      if (lastRow > 1) {
        const existingNames = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
        for (let i = 0; i < existingNames.length; i++) {
          if (String(existingNames[i][0]).trim() === String(nama_periode).trim()) {
            // Update baris yang sudah ada
            sheet.getRange(i + 2, 1, 1, 5).setValues([[
              nama_periode,
              total || 0,
              terdaftar || 0,
              tanggal_arsip || new Date().toLocaleDateString("id-ID"),
              "Selesai"
            ]]);
            found = true;
            break;
          }
        }
      }
      
      if (!found) {
        // Tambah baris baru
        const newRow = sheet.getLastRow() + 1;
        sheet.getRange(newRow, 1, 1, 5).setValues([[
          nama_periode,
          total || 0,
          terdaftar || 0,
          tanggal_arsip || new Date().toLocaleDateString("id-ID"),
          "Selesai"
        ]]);
      }
      
      return ContentService.createTextOutput(JSON.stringify({
        status: "success",
        sheetUrl: ss.getUrl()
      })).setMimeType(ContentService.MimeType.JSON);
    }

    // ─────────────────────────────────────────
    // ACTION: BACA RINGKASAN PERIODE DARI SHEET
    // ─────────────────────────────────────────
    if (data.action === "read_ringkasan_periode") {
      const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
      const sheetName = "Ringkasan Periode";
      const sheet = ss.getSheetByName(sheetName);
      
      if (!sheet || sheet.getLastRow() <= 1) {
        return ContentService.createTextOutput(JSON.stringify({
          status: "success",
          data: []
        })).setMimeType(ContentService.MimeType.JSON);
      }
      
      const lastRow = sheet.getLastRow();
      const rows = sheet.getRange(2, 1, lastRow - 1, 5).getValues();
      
      const result = rows
        .filter(function(r) { return r[0] && String(r[0]).trim() !== ""; })
        .map(function(r) {
          return {
            nama_periode: String(r[0]).trim(),
            total: Number(r[1]) || 0,
            terdaftar: Number(r[2]) || 0,
            tanggal_arsip: String(r[3]).trim(),
            status: String(r[4]).trim()
          };
        });
      
      // Filter berdasarkan nama_periode jika ada
      const filterPeriode = data.nama_periode;
      const filtered = filterPeriode 
        ? result.filter(function(r) { return r.nama_periode === filterPeriode; })
        : result;
      
      return ContentService.createTextOutput(JSON.stringify({
        status: "success",
        data: filtered
      })).setMimeType(ContentService.MimeType.JSON);
    }

    // ─────────────────────────────────────────
    // ACTION: BACA STATISTIK (DARI TAB STATISTIK)
    // ─────────────────────────────────────────
    if (data.action === "read_statistik_all") {
      const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
      const sheet = ss.getSheetByName(data.sheet_name || "Statistik");
      
      if (!sheet || sheet.getLastRow() === 0 || sheet.getLastColumn() === 0) {
        return ContentService.createTextOutput(JSON.stringify({
          status: "success",
          data: {}
        })).setMimeType(ContentService.MimeType.JSON);
      }
      
      const fullData = sheet.getDataRange().getValues();
      const headers = fullData[0]; // Baris pertama
      
      // Cari baris "Total Wisudawan Aktif"
      let totalRowIdx = -1;
      for (let i = 1; i < fullData.length; i++) {
        if (String(fullData[i][0]).trim() === "Total Wisudawan Aktif") {
          totalRowIdx = i;
          break;
        }
      }
      
      const result = {};
      if (totalRowIdx !== -1) {
        // Mulai dari kolom B (indeks 1)
        for (let col = 1; col < headers.length; col++) {
          const periodeName = String(headers[col]).trim();
          if (periodeName) {
            const totalCount = Number(fullData[totalRowIdx][col]) || 0;
            result[periodeName] = {
              total: totalCount,
              terdaftar: totalCount
            };
          }
        }
      }
      
      return ContentService.createTextOutput(JSON.stringify({
        status: "success",
        data: result
      })).setMimeType(ContentService.MimeType.JSON);
    }

    // Action tidak dikenali
    return ContentService.createTextOutput(JSON.stringify({
      status: "error",
      message: "Action tidak valid"
    })).setMimeType(ContentService.MimeType.JSON);
    
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      status: "error",
      message: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

// Menghindari error jika diakses via browser (Method GET)
function doGet(e) {
  return ContentService.createTextOutput("Wisuda Web App API berjalan normal.");
}
