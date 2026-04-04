import { sql } from "@vercel/postgres";

// JEMBATAN DARURAT:
// Kita ambil dari import.meta.env (yang dibaca Astro)
// dan masukin ke process.env (yang dicari SDK Vercel)
if (!process.env.POSTGRES_URL) {
  process.env.POSTGRES_URL = import.meta.env.POSTGRES_URL;
}

export { sql };
