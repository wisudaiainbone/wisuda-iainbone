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

      // ── 2. Tentukan subfolder "Foto_[Nama Periode]" ──────────
      // Nama periode berasal dari tabel periode_wisuda (status='Sedang Dibuka')
      // yang sudah dikirim oleh client dari props activePeriode.nama_periode
      const periodeRaw    = data.periode || "Umum";
      const subfolderName = "Foto_" + periodeRaw;
      const targetFolder  = getOrCreateSubfolder(rootFotoFolder, subfolderName);

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
