// src/lib/utils.ts

export function generateSlug(title: string) {
  const baseSlug = title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "") // Hapus simbol aneh (seperti !@#%)
    .replace(/[\s_-]+/g, "-") // Ganti spasi jadi strip (-)
    .replace(/^-+|-+$/g, ""); // Hapus strip di awal/akhir

  // Kita tambahkan string acak sedikit di belakangnya agar UNIK.
  // Misal ada 2 user membuat judul "Halo Dunia", agar tidak tabrakan di database.
  const uniqueId = Math.random().toString(36).substring(2, 7);

  return `${baseSlug}-${uniqueId}`;
}
