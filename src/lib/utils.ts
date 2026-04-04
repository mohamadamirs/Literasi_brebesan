// src/lib/utils.ts

export function generateSlug(title: string) {
  const baseSlug = title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "") // Hapus simbol aneh (kayak !@#%)
    .replace(/[\s_-]+/g, "-") // Ganti spasi jadi strip (-)
    .replace(/^-+|-+$/g, ""); // Hapus strip di awal/akhir

  // Kita tambahin string acak dikit di belakangnya biar UNIK.
  // Misal ada 2 user bikin judul "Halo Dunia", biar gak tabrakan di database.
  const uniqueId = Math.random().toString(36).substring(2, 7);

  return `${baseSlug}-${uniqueId}`;
}
