import { google, drive_v3 } from "googleapis"; // Mengimpor library googleapis untuk berinteraksi dengan Google APIs

// Mengatur autentikasi JWT (JSON Web Token) untuk akun layanan Google.
const auth = new google.auth.JWT({
  email: import.meta.env.GOOGLE_SERVICE_ACCOUNT_EMAIL, // Email akun layanan
  key: import.meta.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, "\n"), // Kunci privat
  scopes: ["https://www.googleapis.com/auth/drive.readonly"], // Scope akses: hanya membaca Google Drive
});

// Menginisialisasi objek Google Drive API
const drive = google.drive({ version: "v3", auth });

const ROOT_ID = import.meta.env.GOOGLE_DRIVE_ROOT_FOLDER_ID;

export interface DriveItem {
  id: string;
  name: string;
  mimeType?: string;
  webContentLink?: string;
}

export async function getFolders(parentId: string): Promise<DriveItem[]> {
  const res = await drive.files.list({
    q: `'${parentId}' in parents and mimeType = 'application/vnd.google-apps.folder' and trashed = false`,
    fields: "files(id, name)",
    orderBy: "name desc",
  });
  return (res.data.files as DriveItem[]) || [];
}

/**
 * Mengambil daftar file media di dalam folder tertentu dari Google Drive.
 */
export async function getMediaFiles(
  folderId: string,
  pageToken?: string | null,
  limit: number = 4,
): Promise<{ files: DriveItem[]; nextPageToken: string | null }> {
  try {
    const response = await drive.files.list({
      q: `'${folderId}' in parents and trashed = false`,
      fields: "nextPageToken, files(id, name, mimeType, webContentLink)",
      pageSize: limit,
      pageToken: pageToken || undefined,
    });

    return {
      files: (response.data.files as DriveItem[]) || [],
      nextPageToken: response.data.nextPageToken || null,
    };
  } catch (error) {
    console.error("Error fetching media files:", error);
    throw error;
  }
}

export async function getArchiveNavigation(
  yearId?: string | null,
  monthId?: string | null,
  activityId?: string | null,
): Promise<{ data: DriveItem[]; view: string; baseUrl: string }> {
  try {
    let data: DriveItem[] = [];
    let view = "years";
    let baseUrl = "?yearId=";

    if (activityId) {
      view = "files";
      return { data: [], view, baseUrl: "" };
    }

    if (monthId && yearId) {
      data = await getFolders(monthId);
      view = "activities";
      baseUrl = `?yearId=${yearId}&monthId=${monthId}&activityId=`;
    } else if (yearId) {
      data = await getFolders(yearId);
      view = "months";
      baseUrl = `?yearId=${yearId}&monthId=`;
    } else {
      data = await getFolders(ROOT_ID);
      view = "years";
      baseUrl = "?yearId=";
    }

    return { data, view, baseUrl };
  } catch (error) {
    console.error("Fungsi getArchiveNavigation Error:", error);
    throw new Error("Gagal mengambil struktur arsip.");
  }
}
